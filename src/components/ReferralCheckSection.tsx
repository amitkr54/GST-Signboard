'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Check, Loader2 } from 'lucide-react';
import { getReferrerByCode } from '@/app/actions';

export function ReferralCheckSection() {
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');
    const [message, setMessage] = useState('');

    const handleCheck = async () => {
        if (!code.trim()) return;
        setStatus('loading');
        setMessage('');

        try {
            const result = await getReferrerByCode(code.trim());
            if (result.success && result.referrer) {
                setStatus('valid');
                setMessage(`Valid Code! You will save ₹150 on your order.`);
            } else {
                setStatus('invalid');
                setMessage(result.error || 'Invalid referral code.');
            }
        } catch (error) {
            console.error(error);
            setStatus('invalid');
            setMessage('Error checking code. Please try again.');
        }
    };

    return (
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-20 relative overflow-hidden w-full">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
                <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                    Have a Referral Code?
                </h3>
                <p className="text-lg text-white/90 mb-8">
                    Enter your referral code below to verify your discount.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative">
                    <input
                        type="text"
                        placeholder="Enter referral code"
                        value={code}
                        onChange={(e) => {
                            setCode(e.target.value.toUpperCase());
                            setStatus('idle');
                            setMessage('');
                        }}
                        className="flex-1 px-6 py-4 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all text-center sm:text-left font-bold tracking-wider"
                    />
                    <Button
                        onClick={handleCheck}
                        disabled={status === 'loading' || !code}
                        className="px-8 py-4 bg-white text-indigo-600 hover:bg-gray-50 font-bold rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-70 disabled:hover:scale-100 min-w-[140px]"
                    >
                        {status === 'loading' ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Check Code'
                        )}
                    </Button>
                </div>

                {/* Status Message */}
                {status !== 'idle' && (
                    <div className={`mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-md border ${status === 'valid'
                        ? 'bg-green-500/20 border-green-400/50 text-white'
                        : 'bg-red-500/20 border-red-400/50 text-white'
                        } animate-in fade-in slide-in-from-bottom-2`}>
                        {status === 'valid' && <Check className="w-5 h-5" />}
                        <span className="font-bold">{message}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
