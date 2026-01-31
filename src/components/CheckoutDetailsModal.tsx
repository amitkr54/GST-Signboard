'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/Button';
import { X, User, Mail, Phone, MapPin, Sparkles, ArrowRight, LogIn } from 'lucide-react';

interface CheckoutDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    contactDetails: {
        name: string;
        email: string;
        mobile: string;
        shippingAddress: string;
    };
    onUpdateDetails: (details: any) => void;
    onComplete: () => void | Promise<void>;
    isProcessing: boolean;
    designConfig?: any;
    signageData?: any;
}

export function CheckoutDetailsModal({
    isOpen,
    onClose,
    contactDetails,
    onUpdateDetails,
    onComplete,
    isProcessing,
    designConfig,
    signageData
}: CheckoutDetailsModalProps) {
    const { user, signInWithGoogle } = useAuth();
    const [step, setStep] = useState<'auth' | 'details'>(user ? 'details' : 'auth');

    const [hasPreFilled, setHasPreFilled] = useState(false);

    useEffect(() => {
        if (user && !hasPreFilled) {
            // Pre-fill from user metadata
            onUpdateDetails({
                ...contactDetails,
                name: contactDetails.name || user.user_metadata?.full_name || '',
                email: contactDetails.email || user.email || '',
            });
            setHasPreFilled(true);
            if (step === 'auth') setStep('details');
        }
    }, [user, hasPreFilled, onUpdateDetails, contactDetails, step]);

    const handleGoogleLogin = async () => {
        // Save current design state to localStorage so it survives the redirect
        const draft = {
            design: (window as any).fabricCanvas?.toJSON() || null,
            designConfig,
            signageData,
            contactDetails,
            timestamp: Date.now(),
            action: 'continue_checkout'
        };
        localStorage.setItem('design_draft_pending', JSON.stringify(draft));
        await signInWithGoogle();
    };

    if (!isOpen) return null;

    const isDetailsComplete = contactDetails.name && contactDetails.email && contactDetails.mobile && contactDetails.shippingAddress;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)] max-w-xl w-full overflow-hidden border border-white/10 flex flex-col animate-in fade-in zoom-in-95 duration-300">
                <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-widest">
                            {step === 'auth' ? 'Step 1: Identity' : 'Step 2: Delivery Details'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    {step === 'auth' ? (
                        <div className="space-y-8">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                    <Sparkles className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white tracking-tight">How would you like to continue?</h3>
                                <p className="text-slate-400 text-sm font-medium">Log in to track your orders or continue as a guest.</p>
                            </div>

                            <div className="grid gap-4">
                                <Button
                                    onClick={handleGoogleLogin}
                                    className="w-full py-7 bg-white text-slate-900 hover:bg-slate-100 font-bold text-lg rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02]"
                                >
                                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                                    Continue with Google
                                </Button>

                                <div className="relative flex items-center justify-center my-4">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                                    <span className="relative px-4 bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-widest">OR</span>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setStep('details')}
                                    className="w-full py-7 border-white/10 bg-white/5 text-white hover:bg-white/10 font-bold text-lg rounded-2xl flex items-center justify-center gap-3"
                                >
                                    Continue as Guest
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={(e) => { e.preventDefault(); onComplete(); }} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            required
                                            value={contactDetails.name}
                                            onChange={e => onUpdateDetails({ ...contactDetails, name: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-indigo-500 outline-none font-semibold"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                        <input
                                            required
                                            type="email"
                                            value={contactDetails.email}
                                            onChange={e => onUpdateDetails({ ...contactDetails, email: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-indigo-500 outline-none font-semibold"
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Mobile Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        required
                                        type="tel"
                                        value={contactDetails.mobile}
                                        onChange={e => {
                                            let val = e.target.value;
                                            // Handle deletion of +91
                                            if (contactDetails.mobile.startsWith('+91 ') && !val.startsWith('+91 ')) {
                                                val = '';
                                            }

                                            // Extract digits
                                            const digits = val.replace(/\D/g, '').replace(/^91/, '');
                                            const truncated = digits.slice(0, 10);

                                            let formatted = '';
                                            if (truncated.length > 0) {
                                                formatted = '+91 ';
                                                if (truncated.length > 5) {
                                                    formatted += truncated.slice(0, 5) + ' ' + truncated.slice(5);
                                                } else {
                                                    formatted += truncated;
                                                }
                                            }
                                            onUpdateDetails({ ...contactDetails, mobile: formatted });
                                        }}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-indigo-500 outline-none font-bold"
                                        placeholder="+91 99999 99999"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Shipping Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-500" />
                                    <textarea
                                        required
                                        value={contactDetails.shippingAddress}
                                        onChange={e => onUpdateDetails({ ...contactDetails, shippingAddress: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-indigo-500 outline-none font-bold min-h-[100px]"
                                        placeholder="Enter your full delivery address..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                {!user && (
                                    <button
                                        type="button"
                                        onClick={() => setStep('auth')}
                                        className="px-6 py-4 bg-white/5 text-slate-300 font-semibold rounded-xl hover:bg-white/10 transition-colors"
                                    >
                                        Back
                                    </button>
                                )}
                                <Button
                                    disabled={!isDetailsComplete || isProcessing}
                                    className="flex-1 py-7 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xl rounded-2xl shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </div>
                                    ) : (
                                        <>
                                            Pay & Confirm Order
                                            <ArrowRight className="w-6 h-6" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
