'use server';

import { createClient } from '@supabase/supabase-js';
import { SignageData, DesignConfig } from '@/lib/types';
import QRCode from 'qrcode';
import { calculatePrice } from '@/lib/utils';
import {
    PHONEPE_MERCHANT_ID,
    PHONEPE_SALT_KEY,
    PHONEPE_SALT_INDEX,
    PHONEPE_HOST_URL,
    generateChecksum,
    base64Encode
} from '@/lib/phonepe';

// Note: In a real app, use createClient from @supabase/ssr for auth context
// Here we use the admin client for simplicity in this demo, or just the regular client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    },
    userId?: string
) {
    let totalAmount = calculatePrice(materialId);

    // Add Delivery & Installation costs
    if (options?.deliveryType === 'fast') totalAmount += 200;
    if (options?.includeInstallation) totalAmount += 500;

    // Apply Referral Discount
    if (options?.referralCode) {
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
        console.error('Error creating order:', error);
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
    const pin = formData.get('pin');
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;
    const fabricConfigJson = formData.get('fabricConfig') as string;
    const fabricConfig = fabricConfigJson ? JSON.parse(fabricConfigJson) : undefined;

    if (pin !== '1234') { // Simple PIN for demo
        return { success: false, error: 'Invalid Admin PIN' };
    }

    if (!file || !name) {
        return { success: false, error: 'Missing file or name' };
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Detect extension
        const ext = file.name.endsWith('.pdf') ? 'pdf' : 'svg';
        const filename = `${crypto.randomUUID()}.${ext}`;
        const fs = require('fs');
        const path = require('path');

        const publicDir = path.join(process.cwd(), 'public', 'templates');

        // Ensure directory exists
        if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
        }

        const filePath = path.join(publicDir, filename);
        fs.writeFileSync(filePath, buffer);

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

                while ((tspanMatch = tspanRegex.exec(textBody)) !== null) {
                    const spanAttrs = tspanMatch[1];
                    const spanContent = tspanMatch[2].replace(/<[^>]*>?/gm, '').trim();
                    if (spanContent) {
                        lines.push(spanContent);
                        const spanStyles = getStyles(spanAttrs);
                        const currentY = parseFloat(spanStyles['y']?.toString().replace(/[a-z]/g, '') || 'NaN');

                        if (lines.length === 1) {
                            Object.assign(mergedStyles, baseStyles, spanStyles);
                            firstY = currentY;
                        } else {
                            if (lines.length === 2) secondY = currentY;
                            const { x, y, ...otherStyles } = spanStyles;
                            Object.assign(mergedStyles, otherStyles);
                        }
                    }
                }

                if (lines.length === 0) {
                    const directContent = textBody.replace(/<[^>]*>?/gm, '').trim();
                    if (directContent) {
                        lines.push(directContent);
                        Object.assign(mergedStyles, baseStyles);
                        firstY = parseFloat(mergedStyles['y']?.toString().replace(/[a-z]/g, '') || 'NaN');
                    }
                }

                if (lines.length > 0) {
                    const content = lines.join('\n');
                    let fontSize = parseFloat(mergedStyles['font-size']?.toString().replace(/[a-z]/g, '') || 'NaN');

                    if (isNaN(fontSize)) {
                        fontSize = viewBox[2] > 5000 ? (viewBox[2] / 40) : 40;
                    }

                    // Calculate lineHeight if multiple lines
                    let lineHeight = 1.16;
                    if (!isNaN(firstY) && !isNaN(secondY) && fontSize > 0) {
                        lineHeight = (secondY - firstY) / fontSize;
                        // Sanity check for lineHeight
                        if (lineHeight < 0.5 || lineHeight > 3) lineHeight = 1.16;
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
        if (components.text.length > 0 || components.backgroundObjects.length > 0) {
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

        // Update JSON Database
        const dbPath = path.join(process.cwd(), 'src', 'data', 'templates.json');
        let templates = [];
        try {
            if (fs.existsSync(dbPath)) {
                templates = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            }
        } catch (e) {
            console.warn('Could not read templates.json, starting fresh');
        }

        const newTemplate = {
            id: `custom-${Date.now()}`,
            name,
            description,
            thumbnailColor: '#ffffff',
            layoutType: 'centered',
            svgPath: `/templates/${filename}`,
            isCustom: true,
            components: ext === 'svg' ? components : undefined,
            fabricConfig: fabricConfig
        };

        templates.unshift(newTemplate); // Add to top
        fs.writeFileSync(dbPath, JSON.stringify(templates, null, 2));

        return { success: true };

    } catch (error: any) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
    }
}

export async function getTemplates() {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(process.cwd(), 'src', 'data', 'templates.json');

    try {
        if (fs.existsSync(dbPath)) {
            const data = fs.readFileSync(dbPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading templates:', error);
    }

    // Fallback to empty or initial if needed
    // In a real app we might return the hardcoded list as fallback here
    return [];
}

export async function deleteTemplate(templateId: string, pin: string) {
    if (pin !== '1234') {
        return { success: false, error: 'Invalid Admin PIN' };
    }

    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(process.cwd(), 'src', 'data', 'templates.json');

    try {
        if (!fs.existsSync(dbPath)) {
            return { success: false, error: 'Database not found' };
        }

        const templates = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const templateIndex = templates.findIndex((t: any) => t.id === templateId);

        if (templateIndex === -1) {
            return { success: false, error: 'Template not found' };
        }

        const template = templates[templateIndex];

        // Delete the file if it exists
        if (template.svgPath) {
            const filePath = path.join(process.cwd(), 'public', template.svgPath);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Remove from array
        templates.splice(templateIndex, 1);
        fs.writeFileSync(dbPath, JSON.stringify(templates, null, 2));

        return { success: true };
    } catch (error: any) {
        console.error('Delete error:', error);
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
