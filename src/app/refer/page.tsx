'use client';

import React, { useState } from 'react';
import { createReferrer } from '@/app/actions';
import { Share2, Copy, MessageCircle, CheckCircle } from 'lucide-react';

export default function ReferPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [referrer, setReferrer] = useState<any>(null);
    const [copied, setCopied] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const result = await createReferrer(name, email, phone);

        if (result.success && result.referrer) {
            setReferrer(result.referrer);
        } else {
            alert('Error: ' + result.error);
        }

        setIsSubmitting(false);
    };

    const referralLink = referrer
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/design?ref=${referrer.referral_code}`
        : '';

    const copyCode = () => {
        navigator.clipboard.writeText(referrer.referral_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const message = `Hey! I found this amazing signage printing service. Use my referral code *${referrer.referral_code}* to get started: ${referralLink}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (referrer) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">You're all set! 🎉</h1>
                            <p className="text-gray-600">Start sharing and earn ₹150 per referral</p>
                        </div>

                        <div className="space-y-6">
                            {/* Referral Code Display */}
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
                                <p className="text-sm opacity-90 mb-2">Your Referral Code</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-3xl font-bold tracking-wider">{referrer.referral_code}</span>
                                    <button
                                        onClick={copyCode}
                                        className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* How to Share */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Share2 className="w-5 h-5 text-blue-600" />
                                    Share Your Code
                                </h3>

                                <div className="space-y-4">
                                    {/* Manual/Verbal Sharing */}
                                    <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                                        <h4 className="font-semibold text-gray-900 mb-2">📢 Share Verbally</h4>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Tell your friends, family, or customers to use your code when they place an order:
                                        </p>
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                                            <p className="text-xs text-blue-700 mb-1">Just tell them:</p>
                                            <p className="font-bold text-blue-900">"Use code {referrer.referral_code} when you order"</p>
                                        </div>
                                    </div>

                                    {/* Digital Sharing */}
                                    <div className="bg-white rounded-lg p-4 border-2 border-green-200">
                                        <h4 className="font-semibold text-gray-900 mb-2">🔗 Share Link</h4>
                                        <p className="text-sm text-gray-600 mb-3">Or share this link directly:</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={referralLink}
                                                readOnly
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                                            />
                                            <button
                                                onClick={copyLink}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                            >
                                                <Copy className="w-4 h-4" />
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    {/* WhatsApp Share */}
                                    <button
                                        onClick={shareWhatsApp}
                                        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Share on WhatsApp
                                    </button>
                                </div>
                            </div>

                            {/* View Dashboard Link */}
                            <a
                                href={`/dashboard?code=${referrer.referral_code}`}
                                className="block w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors text-center"
                            >
                                View My Dashboard →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        Refer & Earn <span className="text-blue-600">₹150</span>
                    </h1>
                    <p className="text-xl text-gray-600 mb-2">
                        Share our signage printing service and earn commission
                    </p>
                    <p className="text-gray-500">No purchase required • Unlimited earnings</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* How It Works */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Sign Up Free</h3>
                                    <p className="text-sm text-gray-600">Fill the form and get your unique referral code</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Share Your Code</h3>
                                    <p className="text-sm text-gray-600">Tell friends verbally or share link on WhatsApp, social media</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-1">Earn ₹150 Per Referral</h3>
                                    <p className="text-sm text-gray-600">Get paid when they complete their order</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sign Up Form */}
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Start Earning Today</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="10-digit mobile number"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Creating Account...' : 'Get My Referral Code'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Benefits */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl p-6 text-center">
                        <div className="text-4xl mb-3">💰</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Fixed Commission</h3>
                        <p className="text-sm text-gray-600">Earn ₹150 for every successful referral</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 text-center">
                        <div className="text-4xl mb-3">🚀</div>
                        <h3 className="font-semibold text-gray-900 mb-2">No Limit</h3>
                        <p className="text-sm text-gray-600">Unlimited referrals, unlimited earnings</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 text-center">
                        <div className="text-4xl mb-3">✨</div>
                        <h3 className="font-semibold text-gray-900 mb-2">Easy Sharing</h3>
                        <p className="text-sm text-gray-600">Share verbally, WhatsApp, or social media</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
