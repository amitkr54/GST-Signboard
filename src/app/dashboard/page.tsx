'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getReferrerDashboard, getReferrerByEmail, createReferrer } from '@/app/actions';
import { useAuth } from '@/components/AuthProvider';
import { Copy, TrendingUp, Users, DollarSign, RefreshCw, LogIn, UserPlus } from 'lucide-react';
export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading dashboard...</p>
                    </div>
                </div>
            }
        >
            <DashboardContent />
        </Suspense>
    );
}

function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const urlCode = searchParams.get('code');
    const { user, loading: authLoading, signInWithGoogle } = useAuth();

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const [phone, setPhone] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        const initDashboard = async () => {
            setLoading(true);

            if (urlCode) {
                await loadDashboard(urlCode);
            } else if (user?.email) {
                const result = await getReferrerByEmail(user.email);
                if (result.success && result.referrer) {
                    await loadDashboard(result.referrer.referral_code);
                } else {
                    setData(null);
                }
            } else {
                setData(null);
            }
            setLoading(false);
        };

        initDashboard();
    }, [urlCode, user, authLoading]);

    const loadDashboard = async (referralCode: string) => {
        const result = await getReferrerDashboard(referralCode);
        if (result.success) {
            setData(result);
        } else {
            console.error('Error loading dashboard:', result.error);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email || !user?.user_metadata?.full_name) return;

        setIsSigningUp(true);
        const result = await createReferrer(
            user.user_metadata.full_name,
            user.email,
            phone
        );

        if (result.success) {
            await loadDashboard(result.referrer.referral_code);
        } else {
            alert('Error creating account: ' + result.error);
        }
        setIsSigningUp(false);
    };

    const copyCode = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Partner Dashboard</h2>
                    <p className="text-indigo-200 mb-8">
                        Sign in to view your earnings, track referrals, and manage your account.
                    </p>
                    <button
                        onClick={signInWithGoogle}
                        className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        <LogIn className="w-5 h-5" />
                        Sign in with Google
                    </button>
                </div>
            </div>
        );
    }

    if (user && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserPlus className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Join Referral Program</h2>
                        <p className="text-indigo-200 mt-2">
                            Generate your unique code and start earning ₹150 per referral!
                        </p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-indigo-200 mb-1">Name</label>
                            <input
                                type="text"
                                value={user.user_metadata.full_name || ''}
                                disabled
                                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-indigo-200 mb-1">Email</label>
                            <input
                                type="text"
                                value={user.email || ''}
                                disabled
                                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-indigo-200 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter your phone number"
                                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSigningUp}
                            className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-emerald-500/20"
                        >
                            {isSigningUp ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Generate Referral Code'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const { referrer, referrals, stats } = data;
    const code = referrer.referral_code;
    const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/design?ref=${code}`;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 mb-6 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Referral Dashboard</h1>
                            <p className="text-indigo-200">Welcome back, {referrer.name}!</p>
                        </div>
                        <div className="flex items-center gap-3 bg-indigo-900/30 px-4 py-3 rounded-lg border border-white/10">
                            <div>
                                <p className="text-xs text-indigo-300 mb-1">Your Code</p>
                                <p className="font-bold text-white text-lg">{code}</p>
                            </div>
                            <button
                                onClick={() => copyCode(code)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4" />
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <Users className="w-10 h-10 text-indigo-400" />
                        </div>
                        <p className="text-indigo-200 text-sm mb-1">Total Referrals</p>
                        <p className="text-3xl font-bold text-white">{stats.totalReferrals}</p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-10 h-10 text-emerald-400" />
                        </div>
                        <p className="text-indigo-200 text-sm mb-1">Total Earnings</p>
                        <p className="text-3xl font-bold text-white">₹{stats.totalEarnings}</p>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <DollarSign className="w-10 h-10 text-amber-400" />
                        </div>
                        <p className="text-indigo-200 text-sm mb-1">Pending Payout</p>
                        <p className="text-3xl font-bold text-white">₹{stats.pendingEarnings}</p>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 mb-6 text-white">
                    <h3 className="text-lg font-semibold mb-4">Share Your Link</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={referralLink}
                            readOnly
                            className="flex-1 px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70"
                        />
                        <button
                            onClick={() => copyCode(referralLink)}
                            className="px-6 py-3 bg-white text-purple-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                        >
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                    <p className="text-sm text-white/80 mt-3">
                        Or share your code verbally: <span className="font-bold">{code}</span>
                    </p>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-white mb-4">Recent Referrals</h3>
                    {referrals.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <p className="text-indigo-200 mb-2">No referrals yet</p>
                            <p className="text-sm text-slate-500">Start sharing your code to earn commissions!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 font-semibold text-indigo-300">Date</th>
                                        <th className="text-left py-3 px-4 font-semibold text-indigo-300">Company</th>
                                        <th className="text-left py-3 px-4 font-semibold text-indigo-300">Order Amount</th>
                                        <th className="text-left py-3 px-4 font-semibold text-indigo-300">Commission</th>
                                        <th className="text-left py-3 px-4 font-semibold text-indigo-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {referrals.map((referral: any, index: number) => (
                                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4 text-sm text-slate-300">
                                                {new Date(referral.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-4 text-sm font-medium text-white">
                                                {referral.orders?.company_details?.companyName || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 text-sm text-slate-300">
                                                ₹{referral.orders?.amount || 0}
                                            </td>
                                            <td className="py-4 px-4 text-sm font-semibold text-emerald-400">
                                                ₹{referral.commission_amount}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${referral.status === 'paid'
                                                        ? 'bg-emerald-500/20 text-emerald-300'
                                                        : 'bg-amber-500/20 text-amber-300'
                                                        }`}
                                                >
                                                    {referral.status === 'paid' ? 'Paid' : 'Pending'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
