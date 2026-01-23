import React from 'react';
import { Button } from '@/components/ui/Button';
import { Package, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
    loginPin: string;
    setLoginPin: (pin: string) => void;
    handleLogin: (e: React.FormEvent) => void;
    message: { type: 'success' | 'error', text: string } | null;
}

const AdminLogin = ({ loginPin, setLoginPin, handleLogin, message }: AdminLoginProps) => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-500">
                    <div className="bg-indigo-600/20 p-8 text-center border-b border-white/5">
                        <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <Package className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white">Admin Access</h1>
                        <p className="text-indigo-200 text-sm mt-1">SignagePro Management Portal</p>
                    </div>

                    <form onSubmit={handleLogin} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-indigo-200 ml-1">Administrator PIN</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={loginPin}
                                    onChange={(e) => setLoginPin(e.target.value)}
                                    placeholder="••••"
                                    className="w-full px-6 py-4 bg-black/20 border-2 border-white/10 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-center text-2xl tracking-widest font-mono text-white placeholder-white/20"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                        {message?.type === 'error' && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl flex items-center gap-3 text-sm animate-shake">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <span className="font-semibold">{message.text}</span>
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                        >
                            Unlock Dashboard
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
