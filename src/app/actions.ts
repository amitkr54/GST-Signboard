'use server';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { createClient } from '@supabase/supabase-js';
import { SignageData, DesignConfig } from '@/lib/types';
import QRCode from 'qrcode';
import { calculateDynamicPrice } from '@/lib/utils';
import {
    PHONEPE_MERCHANT_ID,
    PHONEPE_SALT_KEY,
    PHONEPE_SALT_INDEX,
    PHONEPE_HOST_URL,
    generateChecksum,
    base64Encode
} from '@/lib/phonepe';
import { normalizeFabricConfig, getAspectRatio } from '@/lib/normalization';
import { revalidatePath } from 'next/cache';

// Define Material Type matching DB
export interface Material {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price_per_sqin: number;
    is_active: boolean;
}

import { supabase } from '@/lib/supabase';

export async function createOrder(
    data: SignageData,
    design: DesignConfig,
    materialId: string,
    options?: {
        deliveryType: 'standard' | 'fast';
        includeInstallation: boolean;
        referralCode?: string;
        contactDetails?: {
            name: string;
            email: string;
            mobile: string;
            shippingAddress: string;
        };
        paymentScheme?: 'full' | 'part';
        advanceAmount?: number;
        approvalProof?: string;
        customBasePrice?: number;
    },
    userId?: string
) {
    // Fetch material rate from DB to ensure accurate pricing
    const { data: materialData } = await supabase
        .from('materials')
        .select('price_per_sqin')
        .or(`id.eq.${materialId},slug.eq.${materialId}`)
        .single();

    const pricePerSqIn = materialData?.price_per_sqin || 0;

    let totalAmount = options?.customBasePrice ?? calculateDynamicPrice(
        design.width,
        design.height,
        design.unit as any,
        pricePerSqIn
    );

    // Add Delivery & Installation costs
    if (options?.deliveryType === 'fast') totalAmount += 200;
    if (options?.includeInstallation) totalAmount += 500;

    // Apply Referral Discount
    const isReferralEnabled = await getAppSetting('referral_scheme_enabled', true);
    if (options?.referralCode && isReferralEnabled) {
        const { data: referrer } = await supabase
            .from('referrers')
            .select('id')
            .eq('referral_code', options.referralCode)
            .single();

        if (referrer) {
            totalAmount -= 150;
        }
    }

    // Calculate Payable Amount based on Scheme
    let payableAmount = totalAmount;
    let balanceAmount = 0;

    if (options?.paymentScheme === 'part' && options.advanceAmount) {
        // Validate minimum 25%
        const minAdvance = Math.ceil(totalAmount * 0.25);
        if (options.advanceAmount < minAdvance) {
            return { success: false, error: `Minimum advance payment is ₹${minAdvance} (25%)` };
        }
        payableAmount = options.advanceAmount;
        balanceAmount = totalAmount - payableAmount;
    }

    const orderId = crypto.randomUUID();

    // 1. Create Order in Database
    const { error } = await supabase
        .from('orders')
        .insert({
            id: orderId,
            user_id: userId || null,
            customer_name: options?.contactDetails?.name || 'Guest',
            customer_email: options?.contactDetails?.email || 'guest@example.com',
            customer_phone: options?.contactDetails?.mobile || '',
            customer_address: options?.contactDetails?.shippingAddress || '', // Added customer_address
            company_details: data,
            design_config: { ...design, ...options }, // Store options including contact details
            material: materialId,
            amount: totalAmount,
            status: 'pending',
            visual_proof: options?.approvalProof || null, // Storing SVG proof in visual_proof column
        });

    if (error) {
        console.error('--- SUPABASE ORDER ERROR ---');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('Details:', error.details);
        return { success: false, error: error.message };
    }

    return { success: true, orderId: orderId, amount: totalAmount, payableAmount };
}

export async function initiatePhonePePayment(orderId: string, amount: number, mobile: string) {
    const merchantTransactionId = `MT${Date.now()}_${orderId.substring(0, 8)}`;

    // Update order with transaction ID
    await supabase
        .from('orders')
        .update({ merchant_transaction_id: merchantTransactionId })
        .eq('id', orderId);

    const payload = {
        merchantId: PHONEPE_MERCHANT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: 'MUID' + Date.now(),
        amount: amount * 100, // Amount in paise
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/status?id=${merchantTransactionId}`,
        redirectMode: 'REDIRECT',
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/callback`,
        mobileNumber: mobile,
        paymentInstrument: {
            type: 'PAY_PAGE'
        }
    };

    const base64Payload = base64Encode(payload);
    const checksum = generateChecksum(base64Payload, '/pg/v1/pay', PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX);

    console.log('PhonePe Request:', {
        url: `${PHONEPE_HOST_URL}/pg/v1/pay`,
        merchantId: PHONEPE_MERCHANT_ID,
        checksum: checksum,
        payload: payload
    });

    try {
        const response = await fetch(`${PHONEPE_HOST_URL}/pg/v1/pay`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum
            },
            body: JSON.stringify({
                request: base64Payload
            })
        });

        const data = await response.json();

        if (data.success) {
            return { success: true, url: data.data.instrumentResponse.redirectInfo.url };
        } else {
            return { success: false, error: data.message || 'Payment initiation failed' };
        }
    } catch (error) {
        console.error('PhonePe Error:', error);
        return { success: false, error: 'Failed to connect to payment gateway' };
    }
}

export async function checkPaymentStatus(merchantTransactionId: string) {
    const checksum = generateChecksum('', `/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`, PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX);

    try {
        const response = await fetch(`${PHONEPE_HOST_URL}/pg/v1/status/${PHONEPE_MERCHANT_ID}/${merchantTransactionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': PHONEPE_MERCHANT_ID
            }
        });

        const data = await response.json();

        if (data.success && data.code === 'PAYMENT_SUCCESS') {
            // Update Order Status
            const { data: order } = await supabase
                .from('orders')
                .select('amount, payment_scheme, balance_amount')
                .eq('merchant_transaction_id', merchantTransactionId)
                .single();

            if (order) {
                const paidAmount = data.data.amount / 100;

                await supabase
                    .from('orders')
                    .update({
                        status: order.balance_amount > 0 ? 'partially_paid' : 'paid',
                        payment_id: data.data.transactionId,
                        paid_amount: paidAmount
                    })
                    .eq('merchant_transaction_id', merchantTransactionId);
            }

            return { success: true, status: 'SUCCESS' };
        } else {
            return { success: false, status: 'FAILED', message: data.message };
        }
    } catch (error) {
        return { success: false, error: 'Failed to verify payment' };
    }
}

export async function processPayment(orderId: string, amount: number) {
    // Mock Payment Processing
    // In real app: Integrate Razorpay/PhonePe here

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay

    // Update order status to paid
    const { error } = await supabase
        .from('orders')
        .update({ status: 'paid', payment_id: `mock_${Date.now()}` })
        .eq('id', orderId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function getReferralStats() {
    // Fetch all profiles with referral codes
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, referral_code')
        .not('referral_code', 'is', null);

    if (error) return { success: false, error: error.message };

    // For each profile, count orders where referred_by matches referral_code
    // Note: This is inefficient for large datasets, better to use a join or view
    const stats = await Promise.all(profiles.map(async (profile) => {
        const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('referred_by', profile.referral_code);

        return {
            ...profile,
            referralCount: count || 0
        };
    }));

    return { success: true, stats };
}

export async function generateReferralCode(userId: string) {
    const code = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase
        .from('profiles')
        .update({ referral_code: code })
        .eq('id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ========== USER DASHBOARD ACTIONS ==========

export async function getUserOrders(email: string) {
    if (!email) return { success: false, error: 'Email required' };

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, orders: orders || [] };
}

// ========== NEW REFERRAL SYSTEM (₹150 Fixed Commission) ==========

export async function createReferrer(name: string, email: string, phone: string) {
    // Generate unique referral code
    const code = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create referrer record
    const { data, error } = await supabase
        .from('referrers')
        .insert({
            referral_code: code,
            name,
            email,
            phone,
            total_earnings: 0,
            pending_earnings: 0
        })
        .select()
        .single();

    if (error) {
        // Check if code already exists, regenerate if needed
        if (error.code === '23505') { // Unique violation
            return createReferrer(name, email, phone); // Retry with new code
        }
        return { success: false, error: error.message };
    }

    return { success: true, referrer: data };
}

export async function trackReferral(orderId: string, referralCode: string) {
    const isReferralEnabled = await getAppSetting('referral_scheme_enabled', true);
    if (!isReferralEnabled) {
        return { success: false, error: 'Referral scheme is currently disabled' };
    }

    const COMMISSION_AMOUNT = 150; // ₹150 fixed commission

    // Find the referrer
    const { data: referrer, error: referrerError } = await supabase
        .from('referrers')
        .select('id, pending_earnings, total_earnings')
        .eq('referral_code', referralCode)
        .single();

    if (referrerError || !referrer) {
        return { success: false, error: 'Referrer not found' };
    }

    // Create referral record
    const { error: referralError } = await supabase
        .from('referrals')
        .insert({
            referrer_id: referrer.id,
            order_id: orderId,
            commission_amount: COMMISSION_AMOUNT,
            status: 'pending' // Will be 'paid' after admin pays
        });

    if (referralError) {
        return { success: false, error: referralError.message };
    }

    // Update referrer's pending earnings
    const { error: updateError } = await supabase
        .from('referrers')
        .update({
            pending_earnings: referrer.pending_earnings + COMMISSION_AMOUNT,
            total_earnings: referrer.total_earnings + COMMISSION_AMOUNT
        })
        .eq('id', referrer.id);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return { success: true, commission: COMMISSION_AMOUNT };
}

export async function getReferrerDashboard(referralCode: string) {
    // Get referrer info
    const { data: referrer, error: referrerError } = await supabase
        .from('referrers')
        .select('*')
        .eq('referral_code', referralCode)
        .single();

    if (referrerError || !referrer) {
        return { success: false, error: 'Referrer not found' };
    }

    // Get referrals list with order details
    const { data: referrals, error: referralsError } = await supabase
        .from('referrals')
        .select(`
            *,
            orders (
                company_details,
                amount,
                status,
                created_at
            )
        `)
        .eq('referrer_id', referrer.id)
        .order('created_at', { ascending: false });

    if (referralsError) {
        return { success: false, error: referralsError.message };
    }

    const stats = {
        totalReferrals: referrals?.length || 0,
        pendingEarnings: referrer.pending_earnings,
        totalEarnings: referrer.total_earnings,
        paidEarnings: referrer.total_earnings - referrer.pending_earnings
    };

    return {
        success: true,
        referrer,
        referrals: referrals || [],
        stats
    };
}

export async function getReferrerByCode(code: string) {
    const { data, error } = await supabase
        .from('referrers')
        .select('*')
        .eq('referral_code', code)
        .single();

    if (error) {
        return { success: false, error: error.message };
    }


    return { success: true, referrer: data };
}

export async function getReferrerByEmail(email: string) {
    const { data, error } = await supabase
        .from('referrers')
        .select('*')
        .eq('email', email)
        .single();

    if (error) {
        // If no rows found, it's not an error in the traditional sense, just no user
        if (error.code === 'PGRST116') {
            return { success: true, referrer: null };
        }
        return { success: false, error: error.message };
    }

    return { success: true, referrer: data };
}

export async function uploadTemplate(formData: FormData) {
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const fabricConfigStr = formData.get('fabricConfig') as string;
    const thumbnailDataUrl = formData.get('thumbnail') as string;
    const fabricConfig = fabricConfigStr ? JSON.parse(fabricConfigStr) : {};

    // Categorization
    const templateType = formData.get('templateType') as string; // 'universal' | 'specific'
    const category = formData.get('category') as string;
    const productIdsStr = formData.get('productIds') as string;
    const productIds = productIdsStr ? JSON.parse(productIdsStr) : [];

    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    try {
        let thumbnailUrl = undefined;
        const templateId = `custom-${Date.now()}`;

        // If thumbnail provided, upload it
        if (thumbnailDataUrl) {
            const thumbRes = await uploadThumbnail(thumbnailDataUrl, templateId);
            if (thumbRes.success) thumbnailUrl = thumbRes.url;
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Detect extension
        const ext = file.name.endsWith('.pdf') ? 'pdf' : 'svg';
        const filename = `${crypto.randomUUID()}.${ext}`;

        // OLD: Local filesystem storage
        // const publicDir = path.join(process.cwd(), 'public', 'templates');
        // const filePath = path.join(publicDir, filename);
        // fs.writeFileSync(filePath, buffer);

        const body = new Uint8Array(buffer);
        console.log('--- TEMPLATE STORAGE UPLOAD ATTEMPT ---');
        console.log('Filename:', filename);

        let workedBucket = 'TEMPLATES';
        let { data: uploadData, error: uploadError } = await supabase.storage
            .from(workedBucket)
            .upload(filename, body, {
                contentType: ext === 'svg' ? 'image/svg+xml' : 'application/pdf',
                upsert: false
            });

        if (uploadError) {
            workedBucket = 'templates';
            const retry = await supabase.storage
                .from(workedBucket)
                .upload(filename, body, {
                    contentType: ext === 'svg' ? 'image/svg+xml' : 'application/pdf',
                    upsert: false
                });
            uploadData = retry.data;
            uploadError = retry.error;
        }

        if (uploadError) {
            console.error('Supabase Storage Upload Error:', uploadError);
            return { success: false, error: 'Failed to upload image to cloud storage: ' + uploadError.message };
        }

        const { data: publicUrlData } = supabase.storage.from(workedBucket).getPublicUrl(filename);
        const publicUrl = publicUrlData.publicUrl;



        // --- NEW: SVG Component Extraction ---
        let components: any = undefined;
        if (ext === 'svg') {
            const svgContent = buffer.toString('utf8');

            // 1. Extract viewBox for normalization
            const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i);
            const viewBox = viewBoxMatch ? viewBoxMatch[1].split(/[\s,]+/).map(Number) : [0, 0, 1000, 1000];

            components = {
                text: [],
                logo: null,
                backgroundObjects: [], // For paths, rects, etc.
                originalViewBox: viewBox // Always store viewBox for scaling
            };

            // --- 1b. Extract CSS Styles from <style> blocks ---
            const styleMap: Record<string, any> = {};
            const styleBlocks = svgContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
            if (styleBlocks) {
                styleBlocks.forEach(block => {
                    const css = block.replace(/<\/?style[^>]*>/gi, '');
                    const rules = css.match(/\.([a-z0-9_-]+)\s*\{([^}]*)\}/gi);
                    if (rules) {
                        rules.forEach(rule => {
                            const [full, className, content] = rule.match(/\.([a-z0-9_-]+)\s*\{([^}]*)\}/i) || [];
                            if (className) {
                                styleMap[className] = {};
                                content.split(';').forEach(p => {
                                    const [k, v] = p.split(':').map(s => s.trim());
                                    if (k && v) styleMap[className][k.toLowerCase()] = v.replace(/['"]/g, '');
                                });
                            }
                        });
                    }
                });
            }

            const getStyles = (attrStr: string) => {
                let s: any = {};
                const styleMatch = attrStr.match(/style=["']([^"']+)["']/i);
                if (styleMatch) {
                    styleMatch[1].split(';').forEach(p => {
                        const [k, v] = p.split(':').map(str => str.trim());
                        if (k && v) s[k.toLowerCase()] = v.replace(/['"]/g, '');
                    });
                }
                const classMatch = attrStr.match(/class=["']([^"']+)["']/i);
                if (classMatch) {
                    classMatch[1].split(/\s+/).forEach(c => {
                        if (styleMap[c]) Object.assign(s, styleMap[c]);
                    });
                }
                ['font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor', 'fill', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'points', 'd'].forEach(a => {
                    const m = attrStr.match(new RegExp(`\\b${a}=["']([^"']+)["']`, 'i'));
                    if (m) s[a] = m[1];
                });
                return s;
            };

            // --- 1c. Clean content for extraction (Do NOT strip defs, as CorelDraw often puts content there) ---
            const extractionContent = svgContent;

            // 2. Extract Text elements (from full content to preserve fonts if needed, but extractionContent is safer for shapes)
            const textRegex = /<text\s+([^>]*?)>([\s\S]*?)<\/text>/gi;
            let match;
            while ((match = textRegex.exec(svgContent)) !== null) {
                const textAttrs = match[1];
                let textBody = match[2];

                const tspanRegex = /<tspan\s+([^>]*?)>([\s\S]*?)<\/tspan>/gi;
                let tspanMatch;
                let lines: string[] = [];
                let mergedStyles: any = {};

                const baseStyles = getStyles(textAttrs);

                let firstY = NaN;
                let secondY = NaN;

                // Store lines with their Y positions to determine line breaks vs spaces
                interface TextSpan {
                    text: string;
                    y: number;
                    x: number;
                    fontSize: number;
                }
                const spans: TextSpan[] = [];

                while ((tspanMatch = tspanRegex.exec(textBody)) !== null) {
                    const spanAttrs = tspanMatch[1];
                    const spanContent = tspanMatch[2].replace(/<[^>]*>?/gm, '').trim();
                    if (spanContent) {
                        const spanStyles = getStyles(spanAttrs);
                        const currentY = parseFloat(spanStyles['y']?.toString().replace(/[a-z]/g, '') || 'NaN');
                        const currentX = parseFloat(spanStyles['x']?.toString().replace(/[a-z]/g, '') || 'NaN');
                        // Use local font size or inherit from base
                        const localFontSize = parseFloat(spanStyles['font-size']?.toString().replace(/[a-z]/g, '') || 'NaN');

                        spans.push({
                            text: spanContent,
                            y: currentY,
                            x: currentX,
                            fontSize: localFontSize
                        });

                        // Maintain mergedStyles updates for the container properties
                        if (spans.length === 1) {
                            Object.assign(mergedStyles, baseStyles, spanStyles);
                            firstY = currentY;
                        } else {
                            if (spans.length === 2) secondY = currentY;
                            const { x, y, ...otherStyles } = spanStyles;
                            Object.assign(mergedStyles, otherStyles);
                        }
                    }
                }

                if (spans.length === 0) {
                    const directContent = textBody.replace(/<[^>]*>?/gm, '').trim();
                    if (directContent) {
                        const styleY = parseFloat(mergedStyles['y']?.toString().replace(/[a-z]/g, '') || 'NaN');
                        spans.push({
                            text: directContent,
                            y: isNaN(styleY) ? parseFloat(baseStyles['y']?.toString() || 'NaN') : styleY,
                            x: NaN,
                            fontSize: NaN
                        });
                        Object.assign(mergedStyles, baseStyles);
                        firstY = spans[0].y;
                    }
                }

                if (spans.length > 0) {
                    // Smart Join: Iterate and check Y differences
                    let content = '';
                    let lastY = spans[0].y;
                    let lastFontSize = spans[0].fontSize;

                    // Fallback font size if not found on spans
                    let containerFontSize = parseFloat(mergedStyles['font-size']?.toString().replace(/[a-z]/g, '') || 'NaN');
                    if (isNaN(containerFontSize)) {
                        containerFontSize = viewBox[2] > 5000 ? (viewBox[2] / 40) : 40;
                    }

                    spans.forEach((span, index) => {
                        if (index === 0) {
                            content += span.text;
                        } else {
                            const fs = !isNaN(span.fontSize) ? span.fontSize : (!isNaN(lastFontSize) ? lastFontSize : containerFontSize);

                            // LOGIC FIX:
                            // 1. If Y is NaN -> Assume Same Line (Space)
                            // 2. If Y exists but is close to lastY -> Same Line (Space)
                            // 3. Only if Y exists AND diff is large -> New Line

                            let isNewLine = false;
                            if (!isNaN(span.y) && !isNaN(lastY)) {
                                if (Math.abs(span.y - lastY) > (fs * 0.5)) {
                                    isNewLine = true;
                                }
                            }

                            if (isNewLine) {
                                content += '\n' + span.text;
                            } else {
                                // Logic for special characters: avoid space before punctuation
                                const isPunctuation = /^[.,:;!?]/.test(span.text);
                                content += (isPunctuation ? '' : ' ') + span.text;
                            }
                        }

                        // Update lastY only if valid
                        if (!isNaN(span.y)) {
                            lastY = span.y;
                        }
                        if (!isNaN(span.fontSize)) {
                            lastFontSize = span.fontSize;
                        }
                    });

                    // Ensure we have a valid fontSize for the final object
                    let fontSize = containerFontSize;

                    // Calculate lineHeight if multiple lines exist in the final content
                    let lineHeight = 1.16;
                    const lines = content.split('\n');

                    if (lines.length > 1 && !isNaN(firstY) && !isNaN(secondY) && fontSize > 0) {
                        // Recalculate secondY based on spans that actually triggered a newline
                        // This is tricky without exact mapping, but the original logic was simple too.
                        // Let's stick to the original simple calculation if available, or default.
                        const calculatedLH = (secondY - firstY) / fontSize;
                        if (calculatedLH > 0.5 && calculatedLH < 3) lineHeight = calculatedLH;
                    }

                    // --- BASELINE CORRECTION ---
                    const rawY = isNaN(firstY) ? parseFloat(mergedStyles['y']?.toString().replace(/[a-z]/g, '') || '0') : firstY;
                    const correctedTop = rawY - (fontSize * 0.82);

                    let textAlign = 'left';
                    const anchor = mergedStyles['text-anchor'] || '';
                    if (anchor === 'middle') textAlign = 'center';
                    else if (anchor === 'end') textAlign = 'right';

                    components.text.push({
                        text: content,
                        left: parseFloat(mergedStyles['x']?.toString().replace(/[a-z]/g, '') || '0'),
                        top: correctedTop,
                        fontSize: fontSize,
                        lineHeight: lineHeight,
                        fontFamily: (mergedStyles['font-family'] || 'Arial').split(',')[0].replace(/['"]/g, '').trim(),
                        fontWeight: (mergedStyles['font-weight'] || 'normal').toLowerCase(),
                        fontStyle: (mergedStyles['font-style'] || 'normal').toLowerCase(),
                        textAlign: textAlign,
                        fill: mergedStyles['fill'] || '#000000',
                        originalViewBox: viewBox
                    });
                }
            }

            // 3. Extract Rects and Paths for backgrounds/logos
            // Improved regex to handle optional namespaces (e.g. svg:path) and 'line' elements
            const shapeRegex = /<([a-z0-9]+:)?(path|rect|circle|ellipse|polygon|polyline|line)\s*([^>]*?)\/?>/gi;
            // Note: This is a simple extractor. It doesn't handle groups (<g>) or transforms perfectly,
            // but for static background elements it's enough to let Fabric render them.
            while ((match = shapeRegex.exec(extractionContent)) !== null) {
                const tag = match[2].toLowerCase(); // match[2] is the tag name
                const attrs = match[3];
                const styles = getStyles(attrs);

                // Skip if it looks like part of a font definition or metadata
                if (svgContent.indexOf('<font') < match.index && svgContent.indexOf('</font>') > match.index) continue;
                if (svgContent.indexOf('<metadata') < match.index && svgContent.indexOf('</metadata>') > match.index) continue;
                if (svgContent.indexOf('<clipPath') < match.index && svgContent.indexOf('</clipPath>') > match.index) continue; // Skip clip paths

                components.backgroundObjects.push({
                    type: tag,
                    attributes: attrs,
                    styles: styles
                });
            }
        }

        // --- 4. Content-Based Normalization (Actual Size) ---
        // This ensures the template data tightly fits the design, ignoring CorelDRAW's massive empty workspace.
        if (components && (components.text.length > 0 || components.backgroundObjects.length > 0)) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            components.text.forEach((t: any) => {
                minX = Math.min(minX, t.left);
                minY = Math.min(minY, t.top);
                // Estimate width if not available; 0.6*fontSize*charCount is a rough guide for Arial-like fonts
                const estimatedWidth = (t.text.split('\n')[0].length * t.fontSize * 0.6);
                maxX = Math.max(maxX, t.left + estimatedWidth);
                maxY = Math.max(maxY, t.top + (t.fontSize * (t.lineHeight || 1.16) * t.text.split('\n').length));
            });

            components.backgroundObjects.forEach((o: any) => {
                // Basic bounds check for rect, circle etc.
                // Paths are hard to parse via regex, so we'll at least use their starting position if nothing else.
                const s = o.styles;
                let x = parseFloat(s.x || s.cx || 0);
                let y = parseFloat(s.y || s.cy || 0);
                let w = parseFloat(s.width || s.r || 0);
                let h = parseFloat(s.height || s.r || 0);

                if (o.type === 'path' && s.d) {
                    // Try to extract first M coordinate as a hint
                    const m = s.d.match(/M\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/i);
                    if (m) { x = parseFloat(m[1]); y = parseFloat(m[2]); w = 10; h = 10; }
                }

                // Store calculated position in the object
                o.left = x;
                o.top = y;
                o.width = w;
                o.height = h;

                if (!isNaN(x)) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x + w);
                }
                if (!isNaN(y)) {
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y + h);
                }
            });

            // If we found valid bounds, update originalViewBox to "Actual Size"
            if (minX !== Infinity && maxX > minX && maxY > minY) {
                const padW = (maxX - minX) * 0.05; // 5% padding
                const padH = (maxY - minY) * 0.05;
                components.originalViewBox = [
                    minX - padW,
                    minY - padH,
                    (maxX - minX) + (padW * 2),
                    (maxY - minY) + (padH * 2)
                ];
                console.log('AUTO-CROP (BACKEND):', components.originalViewBox);
            }
        }

        // Update Supabase Database
        const newTemplate = {
            id: templateId,
            name,
            description,
            thumbnail_color: '#ffffff',
            thumbnail: thumbnailUrl,
            layout_type: 'centered',
            svg_path: publicUrl, // Store full URL instead of relative path
            is_custom: true,
            components: ext === 'svg' ? components : undefined,
            fabric_config: fabricConfig,
            // New Fields
            category: templateType === 'universal' ? null : (category || 'Uncategorized'),
            is_universal: templateType === 'universal',
            product_ids: templateType === 'specific' ? productIds : [],
            dimensions: {
                width: parseFloat(formData.get('width') as string) || (components?.originalViewBox ? components.originalViewBox[2] : 1000),
                height: parseFloat(formData.get('height') as string) || (components?.originalViewBox ? components.originalViewBox[3] : 1000),
                unit: 'in' // We assume input is in inches as per UI
            }
        };

        // --- NORMALIZE TEMPLATE ---
        if (newTemplate.dimensions && newTemplate.fabric_config) {
            const { width, height } = newTemplate.dimensions;

            // Normalize fabricConfig to standard pixel size based on aspect ratio
            newTemplate.fabric_config = normalizeFabricConfig(
                newTemplate.fabric_config,
                width,
                height
            );

            // Calculate and store aspect ratio
            (newTemplate as any).aspect_ratio = getAspectRatio(width, height);
        }

        const { error: insertError } = await supabase
            .from('templates')
            .insert(newTemplate);

        if (insertError) {
            throw new Error(insertError.message);
        }

        revalidatePath('/templates');
        revalidatePath('/admin');
        return { success: true };

    } catch (error: any) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
    }
}

export async function uploadThumbnail(dataUrl: string, templateId: string) {
    try {
        const base64Data = dataUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `thumb-${templateId}-${Date.now()}.png`;
        const body = new Uint8Array(buffer);


        console.log('--- THUMBNAIL UPLOAD ATTEMPT ---');
        console.log('Filename:', filename);

        // Try uppercase first as seen in your dashboard screenshot
        let { data, error } = await supabase.storage
            .from('TEMPLATES')
            .upload(filename, body, {
                contentType: 'image/png',
                upsert: false
            });

        if (error) {
            console.log('TEMPLATES thumbnail upload failed, trying lowercase "templates"...');
            console.error('Error was:', error.message);

            const retry = await supabase.storage
                .from('templates')
                .upload(filename, body, {
                    contentType: 'image/png',
                    upsert: false
                });

            if (retry.error) {
                console.error('Lower-case "templates" also failed:', retry.error.message);
                throw new Error(`Storage upload failed: ${retry.error.message}`);
            }

            const { data: publicUrlData } = supabase.storage.from('templates').getPublicUrl(filename);
            return { success: true, url: publicUrlData.publicUrl };
        }

        const { data: publicUrlData } = supabase.storage.from('TEMPLATES').getPublicUrl(filename);
        return { success: true, url: publicUrlData.publicUrl };

    } catch (error: any) {
        console.error('Thumbnail upload error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTemplateConfig(templateId: string, fabricConfig: any, pin: string, thumbnailUrl?: string, dimensions?: { width: number, height: number, unit: string }) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    try {
        // 1. Fetch current template to get old thumbnail if we're updating it
        let oldThumbnailUrl = null;
        if (thumbnailUrl) {
            const { data: currentTemplate } = await supabase
                .from('templates')
                .select('thumbnail')
                .eq('id', templateId)
                .single();
            oldThumbnailUrl = currentTemplate?.thumbnail;
        }

        let normalizedConfig = fabricConfig;
        let aspectRatio = undefined;

        // Normalize if dimensions provided
        if (dimensions) {
            normalizedConfig = normalizeFabricConfig(fabricConfig, dimensions.width, dimensions.height);
            aspectRatio = getAspectRatio(dimensions.width, dimensions.height);
        }

        const updateData: any = {
            fabric_config: normalizedConfig,
            is_custom: false // Ensure it stays as a global template
        };

        if (aspectRatio) {
            updateData.aspect_ratio = aspectRatio;
        }

        if (thumbnailUrl) {
            updateData.thumbnail = thumbnailUrl;
        }

        if (dimensions) {
            updateData.dimensions = dimensions;
        }

        const { error } = await supabase
            .from('templates')
            .update(updateData)
            .eq('id', templateId);

        if (error) {
            throw new Error(error.message);
        }

        // 2. Clean up old thumbnail from storage if update was successful
        if (thumbnailUrl && oldThumbnailUrl && oldThumbnailUrl.startsWith('http')) {
            const parts = oldThumbnailUrl.split('/');
            const filename = parts[parts.length - 1];
            if (filename) {
                await supabase.storage.from('TEMPLATES').remove([filename]);
            }
        }

        revalidatePath('/templates');
        revalidatePath('/admin');
        revalidatePath(`/configure`); // Revalidate configure too as it shows previews

        return { success: true };
    } catch (error: any) {
        console.error('Update template error:', error);
        return { success: false, error: error.message };
    }
}

export async function getTemplates(options?: { category?: string, productId?: string, aspectRatio?: number, search?: string }) {
    const { db } = await import('@/lib/db');
    try {
        return await db.getTemplates(options);
    } catch (error) {
        console.error('Error fetching templates:', error);
        return [];
    }
}

export async function getTemplateById(id: string) {
    const { db } = await import('@/lib/db');
    try {
        return await db.getTemplate(id);
    } catch (error) {
        console.error('Error fetching template by ID:', error);
        return null;
    }
}

export async function deleteTemplate(templateId: string, pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    try {
        const { data: template, error: fetchError } = await supabase
            .from('templates')
            .select('svg_path, thumbnail')
            .eq('id', templateId)
            .single();

        const { error: deleteError } = await supabase
            .from('templates')
            .delete()
            .eq('id', templateId);

        if (deleteError) {
            return { success: false, error: deleteError.message };
        }

        // Helper to extract filename from Supabase Storage URL
        const getFilenameFromUrl = (url: string) => {
            if (!url || !url.startsWith('http')) return null;
            const parts = url.split('/');
            return parts[parts.length - 1];
        };

        const filesToDelete: string[] = [];

        if (template?.svg_path) {
            const filename = getFilenameFromUrl(template.svg_path);
            if (filename) filesToDelete.push(filename);
            else {
                // Handle legacy local paths
                const filePath = path.join(process.cwd(), 'public', template.svg_path);
                if (fs.existsSync(filePath)) {
                    try { fs.unlinkSync(filePath); } catch (e) { console.warn('Failed to delete local file:', e); }
                }
            }
        }

        if (template?.thumbnail) {
            const thumbFilename = getFilenameFromUrl(template.thumbnail);
            if (thumbFilename) filesToDelete.push(thumbFilename);
        }

        if (filesToDelete.length > 0) {
            // Try deleting from both potential bucket names just in case
            await supabase.storage.from('TEMPLATES').remove(filesToDelete);
            await supabase.storage.from('templates').remove(filesToDelete);
        }

        revalidatePath('/templates');
        revalidatePath('/admin');

        return { success: true };
    } catch (error: any) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateTemplateMetadata(
    templateId: string,
    metadata: {
        category?: string | null;
        isUniversal?: boolean;
        productIds?: string[];
        dimensions?: { width: number; height: number; unit: string };
    },
    pin: string
) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    try {
        const updateData: any = {};

        if (metadata.isUniversal !== undefined) {
            updateData.is_universal = metadata.isUniversal;
            // If switching to universal, clear category
            if (metadata.isUniversal) {
                updateData.category = null;
                updateData.product_ids = [];
            }
        }

        if (metadata.category !== undefined && !metadata.isUniversal) {
            updateData.category = metadata.category;
        }

        if (metadata.productIds !== undefined && !metadata.isUniversal) {
            updateData.product_ids = metadata.productIds;
        }

        if (metadata.dimensions) {
            updateData.dimensions = metadata.dimensions;
        }

        const { error } = await supabase
            .from('templates')
            .update(updateData)
            .eq('id', templateId);

        if (error) throw error;

        revalidatePath('/templates');
        revalidatePath('/admin');

        return { success: true };
    } catch (error: any) {
        console.error('Update template metadata error:', error);
        return { success: false, error: error.message };
    }
}



export async function normalizeTemplateCategories(pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    try {
        // 1. Fetch all templates
        const { data: templates, error: fetchError } = await supabase
            .from('templates')
            .select('id, is_universal, category, product_ids');

        if (fetchError) throw fetchError;
        if (!templates) return { success: true, count: 0 };

        let updatedCount = 0;

        // 2. Iterate and fix
        for (const t of templates) {
            let needsUpdate = false;
            const updates: any = {};

            // Rule 1: Universal templates should not have a category or product_ids
            if (t.is_universal) {
                if (t.category !== null) {
                    updates.category = null;
                    needsUpdate = true;
                }
                if (t.product_ids && t.product_ids.length > 0) {
                    updates.product_ids = [];
                    needsUpdate = true;
                }
            }

            // Rule 2: Specific templates MUST have a category (if missing, default to Uncategorized)
            if (!t.is_universal && !t.category) {
                updates.category = 'Uncategorized';
                needsUpdate = true;
            }

            if (needsUpdate) {
                const { error: updateError } = await supabase
                    .from('templates')
                    .update(updates)
                    .eq('id', t.id);

                if (updateError) console.error(`Failed to normalize template ${t.id}:`, updateError);
                else updatedCount++;
            }
        }

        revalidatePath('/templates');
        revalidatePath('/admin');

        return { success: true, count: updatedCount };
    } catch (error: any) {
        console.error('Normalization error:', error);
        return { success: false, error: error.message };
    }
}

export async function syncDesign(userId: string, data: SignageData, design: DesignConfig) {
    const { error } = await supabase
        .from('user_designs')
        .upsert({
            user_id: userId,
            data: data,
            design: design,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error) {
        console.error('Error syncing design:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function generateQRCode(text: string) {
    try {
        const dataUrl = await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 512,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
        });
        return { success: true, dataUrl };
    } catch (error: any) {
        console.error('QR Generation error:', error);
        return { success: false, error: error.message };
    }
}

export async function getOrder(orderId: string) {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return { success: false, error: error.message };
    }

    return { success: true, order: data };
}

export async function getOrders(pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, orders: data };
    } catch (error: any) {
        console.error('Error fetching orders:', error);
        return { success: false, error: error.message };
    }
}

export async function updateOrderStatus(orderId: string, status: string, pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    try {
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error updating order:', error);
        return { success: false, error: error.message };
    }
}

export async function saveProductAction(product: any, pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    const { db } = await import('@/lib/db');
    try {
        await db.saveProduct(product);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getProducts() {
    const { db } = await import('@/lib/db');
    try {
        const products = await db.getProducts();
        return products;
    } catch (error: any) {
        console.error('Error in getProducts action:', error);
        return [];
    }
}

export async function deleteProductAction(id: string, pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    const { db } = await import('@/lib/db');
    try {
        await db.deleteProduct(id);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function uploadProductImages(formData: FormData) {
    const files = formData.getAll('images') as File[];
    const uploadedUrls: string[] = [];

    if (!files || files.length === 0) {
        return { success: false, error: 'No files provided' };
    }

    try {
        // Check if buckets exist, or just rely on 'products' bucket existing or being auto-created if possible (usually manual)
        // For now, assume a 'products' bucket or reuse 'templates' if we want to be lazy, but user asked "any where else", so 'products' is likely another bucket needed.
        // Actually, to keep it simple for the user, I can put them in the same 'templates' bucket but under a subfolder 'products/', 
        // OR ask the user to create a 'products' bucket. 
        // Given the quick fix nature, subfolder in 'templates' is safest as we KNOW that bucket exists now.
        // UPDATE: User asked about problems elsewhere. I should probably use the same bucket to avoid more setup steps for them.

        for (const file of files) {
            if (file.size === 0) continue;

            const buffer = Buffer.from(await file.arrayBuffer());
            const body = new Uint8Array(buffer);
            const ext = path.extname(file.name) || '.jpg';
            const filename = `products/${crypto.randomUUID()}${ext}`; // Store in products subfolder

            console.log(`--- PRODUCT IMAGE UPLOAD ATTEMPT: ${file.name} ---`);
            console.log('Filename:', filename);

            let workedBucket = 'TEMPLATES';
            let { error: uploadError } = await supabase.storage
                .from(workedBucket)
                .upload(filename, body, {
                    contentType: 'image/' + ext.replace('.', ''),
                    upsert: false
                });

            if (uploadError) {
                console.log(`TEMPLATES upload failed for ${file.name}, trying lowercase "templates"...`);
                console.error('Error was:', uploadError.message);
                workedBucket = 'templates';
                const retry = await supabase.storage
                    .from(workedBucket)
                    .upload(filename, body, {
                        contentType: 'image/' + ext.replace('.', ''),
                        upsert: false
                    });

                if (retry.error) {
                    console.error('Supabase Product Upload Error:', retry.error.message);
                    continue; // Skip failed uploads
                }
            }

            const { data: publicUrlData } = supabase.storage.from(workedBucket).getPublicUrl(filename);
            uploadedUrls.push(publicUrlData.publicUrl);
        }

        return { success: true, urls: uploadedUrls };
    } catch (error: any) {
        console.error('Image upload error:', error);
        return { success: false, error: `Image upload failed: ${error.message}` };
    }
}

// ========== CATEGORY MANAGEMENT ==========

export async function getCategories() {
    try {
        const { data, error } = await supabase
            .from('product_categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;
        return { success: true, categories: data || [] };
    } catch (error: any) {
        console.error('Error fetching categories:', error);
        return { success: false, error: error.message, categories: [] };
    }
}

export async function saveCategory(category: any, pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    try {
        const { error } = await supabase
            .from('product_categories')
            .upsert({
                id: category.id,
                name: category.name,
                description: category.description,
                icon: category.icon,
                display_order: category.display_order,
                is_active: category.is_active ?? true,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error saving category:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCategory(id: string, pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    try {
        const { error } = await supabase
            .from('product_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting category:', error);
        return { success: false, error: error.message };
    }
}

// ========== APP SETTINGS MANAGEMENT ==========

export async function getAppSetting(key: string, defaultValue: any = null) {
    try {
        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return defaultValue;
            throw error;
        }
        return data.value;
    } catch (error) {
        console.error(`Error fetching setting ${key}:`, error);
        return defaultValue;
    }
}

export async function updateAppSetting(key: string, value: any, pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    try {
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating setting ${key}:`, error);
        return { success: false, error: error.message };
    }
}


// ========== MATERIAL MANAGEMENT ==========

export async function getMaterials() {
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching materials:', error);
        return { success: false, error: error.message };
    }

    return { success: true, materials: data as Material[] };
}

export async function saveMaterial(material: Partial<Material>, pin: string) {
    if (pin !== '1234') { // Basic PIN check, should use more robust auth in prod
        return { success: false, error: 'Unauthorized' };
    }

    const { id, ...updates } = material;

    // Validate
    if (!updates.name || !updates.price_per_sqin || !updates.slug) {
        return { success: false, error: 'Missing required fields' };
    }

    let query;
    if (id) {
        // Update
        query = supabase
            .from('materials')
            .update(updates)
            .eq('id', id);
    } else {
        // Insert
        query = supabase
            .from('materials')
            .insert(updates);
    }

    const { data, error } = await query.select().single();

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, material: data };
}

export async function deleteMaterial(id: string, pin: string) {
    if (pin !== '1234') return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

export async function normalizeAllTemplates(pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    try {
        const { data: templates, error: fetchError } = await supabase
            .from('templates')
            .select('*');

        if (fetchError) throw new Error(fetchError.message);

        let count = 0;

        for (const template of templates) {
            // Skip if no dimensions
            if (!template.dimensions || !template.fabric_config) continue;

            const { width, height } = template.dimensions;

            // Normalize
            const normalizedConfig = normalizeFabricConfig(template.fabric_config, width, height);
            const aspectRatio = getAspectRatio(width, height);

            // Update
            const { error: updateError } = await supabase
                .from('templates')
                .update({
                    fabric_config: normalizedConfig,
                    aspect_ratio: aspectRatio
                })
                .eq('id', template.id);

            if (!updateError) count++;
        }

        return { success: true, count };
    } catch (error: any) {
        console.error('Normalization error:', error);
        return { success: false, error: error.message };
    }
}
