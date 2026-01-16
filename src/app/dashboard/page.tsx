'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { getReferrerDashboard, getReferrerByEmail, createReferrer, getUserOrders } from '@/app/actions';
import { useAuth } from '@/components/AuthProvider';
import { Copy, TrendingUp, Users, DollarSign, RefreshCw, LogIn, UserPlus, ShoppingBag, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSearchParams, useRouter } from 'next/navigation';

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
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'referrals' | 'orders'>('referrals');

    const [phone, setPhone] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    useEffect(() => {
        if (authLoading) return;

        const initDashboard = async () => {
            setLoading(true);

            // Fetch User Orders
            if (user?.email) {
                const ordersRes = await getUserOrders(user.email);
                if (ordersRes.success) {
                    setMyOrders(ordersRes.orders || []);
                    // Default to orders tab if they have orders but no referrer status yet
                    if ((ordersRes.orders || []).length > 0) {
                        setActiveTab('orders');
                    }
                }
            }

            // Fetch Referral Data
            if (urlCode) {
                await loadDashboard(urlCode);
            } else if (user?.email) {
                const result = await getReferrerByEmail(user.email);
                if (result.success && result.referrer) {
                    await loadDashboard(result.referrer.referral_code);
                    setActiveTab('referrals'); // Prioritize referral view if they are a referrer
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

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">User Dashboard</h2>
                    <p className="text-indigo-200 mb-8">
                        Sign in to view your orders, proofs, and referral earnings.
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

    return (
        <div className="min-h-screen py-8 px-4 bg-slate-950">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Welcome, {user.user_metadata?.full_name?.split(' ')[0]}!</h1>
                        <p className="text-indigo-300">Manage your orders and referrals</p>
                    </div>
                    <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10">
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ShoppingBag className="w-4 h-4" /> My Orders
                        </button>
                        <button
                            onClick={() => setActiveTab('referrals')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'referrals' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Users className="w-4 h-4" /> Referral Program
                        </button>
                    </div>
                </div>

                {/* MY ORDERS TAB */}
                {activeTab === 'orders' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Package className="w-5 h-5 text-indigo-400" /> Order History
                                </h2>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{myOrders.length} ORDERS</span>
                            </div>

                            {myOrders.length === 0 ? (
                                <div className="text-center py-20">
                                    <ShoppingBag className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-white mb-2">No Orders Yet</h3>
                                    <p className="text-slate-400 mb-6">Create your first custom signage design today!</p>
                                    <Button onClick={() => router.push('/products')} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-8 py-3 font-bold">
                                        Start Designing
                                    </Button>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {myOrders.map((order) => (
                                        <div key={order.id} className="p-6 hover:bg-white/5 transition-colors">
                                            <div className="flex flex-col md:flex-row gap-6">
                                                {/* Visual Proof / Thumbnail */}
                                                <div className="w-full md:w-48 aspect-[3/2] bg-slate-800 rounded-xl overflow-hidden border border-white/10 shrink-0 relative group">
                                                    {order.visual_proof ? (
                                                        order.visual_proof.startsWith('data:application/pdf') ? (
                                                            <>
                                                                <iframe src={order.visual_proof} className="w-full h-full pointer-events-none" title="Proof" />
                                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <a
                                                                        href={order.visual_proof}
                                                                        download={`proof-${order.id}.pdf`}
                                                                        className="px-4 py-2 bg-white text-black font-bold text-xs rounded-lg hover:scale-105 transition-transform"
                                                                    >
                                                                        Download PDF
                                                                    </a>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div dangerouslySetInnerHTML={{ __html: order.visual_proof }} className="w-full h-full object-contain" />
                                                        )
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-bold uppercase tracking-widest">No Preview</div>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-white mb-1">
                                                                {order.company_details?.companyName || 'Custom Signage'}
                                                            </h3>
                                                            <p className="text-xs text-indigo-300 font-mono">ORDER #{order.id.split('-')[0].toUpperCase()}</p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                                            order.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                                                'bg-slate-700 text-slate-300'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>

                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Dimensions</p>
                                                            <p className="text-slate-300 font-bold">{order.design_config?.width}" x {order.design_config?.height}"</p>
                                                        </div>
                                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Material</p>
                                                            <p className="text-slate-300 font-bold capitalize">{order.material?.replace('-', ' ') || 'Standard'}</p>
                                                        </div>
                                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Total Amount</p>
                                                            <p className="text-white font-bold">₹{order.amount}</p>
                                                        </div>
                                                        <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                            <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Date</p>
                                                            <p className="text-slate-300 font-bold">{new Date(order.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>

                                                    {order.status === 'pending' && (
                                                        <div className="flex justify-end">
                                                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-6 py-2 font-bold text-sm">
                                                                Complete Payment
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* REFERRALS TAB */}
                {activeTab === 'referrals' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {(!data && user) ? (
                            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-8 max-w-2xl mx-auto shadow-2xl text-center">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserPlus className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white">Join Referral Program</h2>
                                <p className="text-indigo-200 mt-2 mb-8">
                                    Generate your unique code and start earning ₹150 per referral!
                                </p>

                                <form onSubmit={handleSignup} className="space-y-4 max-w-md mx-auto text-left">
                                    <div>
                                        <label className="block text-sm font-medium text-indigo-200 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            required
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Enter your phone number"
                                            className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-white/30 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSigningUp}
                                        className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-emerald-500/20"
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
                        ) : data ? (
                            <div className="space-y-6">
                                {/* Existing Referral Dashboard Content */}
                                <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-xl">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold text-white mb-1">Referral Stats</h1>
                                            <p className="text-indigo-200 text-sm">Track your earnings and invites</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-indigo-900/30 px-4 py-3 rounded-lg border border-white/10">
                                            <div>
                                                <p className="text-xs text-indigo-300 mb-1">Your Code</p>
                                                <p className="font-bold text-white text-lg">{data.referrer.referral_code}</p>
                                            </div>
                                            <button
                                                onClick={() => copyCode(data.referrer.referral_code)}
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-2"
                                            >
                                                <Copy className="w-4 h-4" />
                                                {copied ? 'Copied!' : 'Copy'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <Users className="w-10 h-10 text-indigo-400" />
                                        </div>
                                        <p className="text-indigo-200 text-sm mb-1">Total Referrals</p>
                                        <p className="text-3xl font-bold text-white">{data.stats.totalReferrals}</p>
                                    </div>

                                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <TrendingUp className="w-10 h-10 text-emerald-400" />
                                        </div>
                                        <p className="text-indigo-200 text-sm mb-1">Total Earnings</p>
                                        <p className="text-3xl font-bold text-white">₹{data.stats.totalEarnings}</p>
                                    </div>

                                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <DollarSign className="w-10 h-10 text-amber-400" />
                                        </div>
                                        <p className="text-indigo-200 text-sm mb-1">Pending Payout</p>
                                        <p className="text-3xl font-bold text-white">₹{data.stats.pendingEarnings}</p>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-6 shadow-xl">
                                    <h3 className="text-xl font-bold text-white mb-4">Recent Referrals</h3>
                                    {data.referrals.length === 0 ? (
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
                                                        <th className="text-left py-3 px-4 font-semibold text-indigo-300">Amount</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-indigo-300">Commission</th>
                                                        <th className="text-left py-3 px-4 font-semibold text-indigo-300">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.referrals.map((referral: any, index: number) => (
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
                                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${referral.status === 'paid' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
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
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}
