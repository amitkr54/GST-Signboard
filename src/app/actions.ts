'use server';

import { createClient } from '@supabase/supabase-js';
import { SignageData, DesignConfig } from '@/lib/types';
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

        // Update JSON Database
        const dbPath = path.join(process.cwd(), 'src', 'data', 'templates.json');
        let templates = [];
        try {
            templates = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } catch (e) {
            // If file doesn't exist or is invalid, start with empty array
            console.warn('Could not read templates.json, starting fresh');
        }

        const newTemplate = {
            id: `custom-${Date.now()}`,
            name,
            description,
            thumbnailColor: '#ffffff',
            layoutType: 'centered',
            svgPath: `/templates/${filename}`,
            isCustom: true
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


