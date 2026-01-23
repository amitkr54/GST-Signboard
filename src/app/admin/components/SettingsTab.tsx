import React from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Save, Loader2, AlertCircle } from 'lucide-react';

interface SettingsTabProps {
    referralEnabled: boolean;
    handleToggleReferral: () => void;
    isLoading: boolean;
}

const SettingsTab = ({
    referralEnabled,
    handleToggleReferral,
    isLoading
}: SettingsTabProps) => {
    return (
        <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Application Settings</h2>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/10 p-8 space-y-8">
                <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                    <div className="space-y-1">
                        <h3 className="font-bold text-white text-lg">Referral Scheme</h3>
                        <p className="text-sm text-slate-400">Toggle referral discounts and tracking system-wide</p>
                    </div>
                    <div className="relative">
                        <button
                            onClick={handleToggleReferral}
                            disabled={isLoading}
                            className={`w-14 h-7 rounded-full transition-all duration-300 relative focus:outline-none ${referralEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-lg ${referralEnabled ? 'left-8' : 'left-1'}`} />
                        </button>
                    </div>
                </div>

                <div className="p-6 bg-indigo-500/10 rounded-3xl border border-indigo-500/20">
                    <div className="flex gap-4">
                        <AlertCircle className="w-6 h-6 text-indigo-400 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-indigo-200">Impact of disabling referrals:</p>
                            <ul className="text-xs text-indigo-300/80 space-y-1 list-disc ml-4">
                                <li>Referral section on Landing Page will be hidden</li>
                                <li>Referral Program tab in User Dashboard will be hidden</li>
                                <li>Discount field in Designer Checkout will be hidden</li>
                                <li>Referral tracking and ₹150 discount will be disabled on the backend</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsTab;
