'use client';

import React from 'react';
import { Download, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MaterialSelector } from '@/components/MaterialSelector';
import { DesignConfig } from '@/lib/types';
import { MaterialId } from '@/lib/utils';

interface PropertiesPanelProps {
    design: DesignConfig;
    setDesign: (design: DesignConfig) => void;
    material: MaterialId;
    setMaterial: (material: MaterialId) => void;
    includeInstallation: boolean;
    setIncludeInstallation: (include: boolean) => void;
    paymentScheme: 'full' | 'part';
    setPaymentScheme: (scheme: 'full' | 'part') => void;
    advanceAmount: number;
    setAdvanceAmount: (amount: number) => void;
    referralCode: string;
    setReferralCode: (code: string) => void;
    codeValidated: boolean;
    validateReferralCode: (code: string) => void;
    setCodeValidated: (validated: boolean) => void;
    price: number;
    basePrice: number;
    deliveryCost: number;
    installationCost: number;
    discount: number;
    handleDownload: (format: 'svg' | 'pdf') => void;
    setShowReviewModal: (show: boolean) => void;
    isProcessing: boolean;
    INSTALLATION_COST: number;
}

export function PropertiesPanel({
    design,
    setDesign,
    material,
    setMaterial,
    includeInstallation,
    setIncludeInstallation,
    paymentScheme,
    setPaymentScheme,
    advanceAmount,
    setAdvanceAmount,
    referralCode,
    setReferralCode,
    codeValidated,
    validateReferralCode,
    setCodeValidated,
    price,
    basePrice,
    deliveryCost,
    installationCost,
    discount,
    handleDownload,
    setShowReviewModal,
    isProcessing,
    INSTALLATION_COST
}: PropertiesPanelProps) {
    return (
        <div className="w-[340px] bg-slate-900/60 backdrop-blur-xl border-l border-white/10 h-full overflow-y-auto shrink-0 z-10 custom-scrollbar flex flex-col shadow-2xl">
            <div className="p-0 flex-1">
                {/* Panel Header */}
                <div className="h-14 px-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/40 backdrop-blur-xl z-20">
                    <h3 className="font-black text-white text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                        Configuration
                    </h3>
                    <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">Need Help?</button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Materials & Installation Card */}
                    <div className="space-y-6">
                        {/* Size Controls (ReadOnly) */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dimensions</label>
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-gray-300 rounded border border-slate-700">
                                    {design.unit}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg flex justify-between items-center group">
                                    <span className="text-xs text-gray-400 font-medium group-hover:text-indigo-400 transition-colors">W</span>
                                    <span className="text-sm font-bold text-white">{design.width}</span>
                                </div>
                                <div className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg flex justify-between items-center group">
                                    <span className="text-xs text-gray-400 font-medium group-hover:text-indigo-400 transition-colors">H</span>
                                    <span className="text-sm font-bold text-white">{design.height}</span>
                                </div>
                            </div>
                        </div>

                        {/* Background & Export Row */}
                        <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-800">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-white block">Background</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400">Solid</span>
                                        <button
                                            onClick={() => setDesign({ ...design, backgroundGradientEnabled: !design.backgroundGradientEnabled })}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${design.backgroundGradientEnabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${design.backgroundGradientEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                                        </button>
                                        <span className="text-[10px] text-gray-400">Gradient</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2.5">
                                        {['#ffffff', '#000000', '#f1f1f1', '#e5e7eb', '#4F46E5', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#ec4899'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setDesign({ ...design, backgroundColor: color })}
                                                className={`w-7 h-7 rounded-full shadow-sm transition-all hover:scale-110 focus:outline-none ${design.backgroundColor === color ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-indigo-500 scale-110' : 'ring-1 ring-white/10 hover:ring-white/20'}`}
                                                style={{ backgroundColor: color }}
                                                title={color}
                                            />
                                        ))}
                                        <div className="relative w-7 h-7 rounded-full ring-1 ring-white/10 overflow-hidden shadow-sm hover:ring-white/20 transition-all">
                                            <input
                                                type="color"
                                                value={design.backgroundColor}
                                                onChange={(e) => setDesign({ ...design, backgroundColor: e.target.value })}
                                                className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0"
                                                title="Custom Color"
                                            />
                                            <div className="w-full h-full bg-[conic-gradient(from_180deg_at_50%_50%,#FF0000_0deg,#00FF00_120deg,#0000FF_240deg,#FF0000_360deg)] opacity-80 hover:opacity-100" />
                                        </div>
                                    </div>

                                    {design.backgroundGradientEnabled && (
                                        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">End Color</label>
                                                    <div className="relative h-8 w-full rounded-lg border border-slate-600 overflow-hidden group">
                                                        <input
                                                            type="color"
                                                            value={design.backgroundColor2}
                                                            onChange={(e) => setDesign({ ...design, backgroundColor2: e.target.value })}
                                                            className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0 z-10"
                                                        />
                                                        <div
                                                            className="w-full h-full transition-transform group-hover:scale-110 duration-200"
                                                            style={{ backgroundColor: design.backgroundColor2 }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex justify-between items-center">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Angle</label>
                                                        <span className="text-[10px] font-bold text-indigo-400">{design.backgroundGradientAngle}°</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="360"
                                                        value={design.backgroundGradientAngle}
                                                        onChange={(e) => setDesign({ ...design, backgroundGradientAngle: parseInt(e.target.value) })}
                                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Export Options */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleDownload('svg')}
                                    variant="outline"
                                    className="flex-1 gap-2 h-9 text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-indigo-400 hover:border-indigo-500 transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    SVG
                                </Button>
                                <Button
                                    onClick={() => handleDownload('pdf')}
                                    variant="outline"
                                    className="flex-1 gap-2 h-9 text-xs border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-red-400 hover:border-red-500 transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    PDF
                                </Button>
                            </div>
                        </div>

                        {/* Material Select */}
                        <div className="pt-6 border-t border-slate-800">
                            <label className="text-sm font-bold text-white mb-3 block">Material</label>
                            <MaterialSelector
                                selectedMaterial={material}
                                onSelect={setMaterial}
                            />
                        </div>

                        {/* Professional Installation */}
                        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-colors">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all shadow-sm ${includeInstallation ? 'bg-indigo-600 border-indigo-600 scale-110' : 'bg-slate-700 border-slate-600 group-hover:border-indigo-500'}`}>
                                    {includeInstallation && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    checked={includeInstallation}
                                    onChange={e => setIncludeInstallation(e.target.checked)}
                                    className="hidden"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="text-sm font-bold text-white">Professional Installation</span>
                                        <span className="text-xs font-bold text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded-full">+₹{INSTALLATION_COST}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Our expert team handles the mounting.</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Payment Section */}
                    <div className="pt-2">
                        <label className="text-sm font-bold text-white mb-3 block">Payment Scheme</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setPaymentScheme('part')}
                                className={`relative p-3 rounded-xl border-2 text-left transition-all ${paymentScheme === 'part' ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}
                            >
                                <div className={`w-4 h-4 rounded-full border mb-2 flex items-center justify-center ${paymentScheme === 'part' ? 'border-indigo-500' : 'border-slate-600'}`}>
                                    {paymentScheme === 'part' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                </div>
                                <p className="font-bold text-sm text-white">Part Pay</p>
                                <p className="text-[10px] text-slate-400 leading-tight mt-1">Pay 25% now, rest on delivery</p>
                            </button>

                            <button
                                onClick={() => setPaymentScheme('full')}
                                className={`relative p-3 rounded-xl border-2 text-left transition-all ${paymentScheme === 'full' ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}
                            >
                                <div className={`w-4 h-4 rounded-full border mb-2 flex items-center justify-center ${paymentScheme === 'full' ? 'border-indigo-500' : 'border-slate-600'}`}>
                                    {paymentScheme === 'full' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                </div>
                                <p className="font-bold text-sm text-white">Full Pay</p>
                                <p className="text-[10px] text-slate-400 leading-tight mt-1">Pay 100% upfront</p>
                            </button>
                        </div>

                        {paymentScheme === 'part' && (
                            <div className="mt-3 p-3 bg-slate-800 border border-slate-700 rounded-lg animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-semibold text-slate-300">Advance Amount</label>
                                    <span className="text-[10px] text-indigo-400 font-medium">Min: ₹{Math.ceil(price * 0.25)}</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-white font-semibold">₹</span>
                                    <input
                                        type="number"
                                        value={advanceAmount}
                                        onChange={(e) => setAdvanceAmount(Math.max(Math.ceil(price * 0.25), parseFloat(e.target.value) || 0))}
                                        min={Math.ceil(price * 0.25)}
                                        max={price}
                                        className="w-full pl-6 pr-3 py-1.5 text-sm font-bold text-white bg-slate-700 border border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Checkout */}
            <div className="p-5 border-t border-slate-800 bg-slate-900/80 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.4)] z-20">
                {/* Price Rows */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>Subtotal</span>
                        <span>₹{basePrice}</span>
                    </div>
                    {(deliveryCost > 0 || installationCost > 0) && (
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Extras (Delivery/Install)</span>
                            <span>₹{deliveryCost + installationCost}</span>
                        </div>
                    )}
                    {discount > 0 && (
                        <div className="flex justify-between text-xs text-green-400 font-medium">
                            <span>Discount</span>
                            <span>-₹{discount}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-end pt-2 border-t border-slate-700 mt-2">
                        <span className="font-bold text-white text-lg">Total</span>
                        <div className="text-right">
                            <span className="font-black text-2xl text-indigo-400 leading-none">₹{price}</span>
                        </div>
                    </div>
                </div>

                {/* Referral Code */}
                <div className="relative">
                    <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => {
                            const code = e.target.value.toUpperCase();
                            setReferralCode(code);
                            if (code) {
                                validateReferralCode(code);
                            } else {
                                setCodeValidated(false);
                            }
                        }}
                        placeholder="Referral Code (Optional)"
                        className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${codeValidated ? 'border-green-500 ring-green-500 bg-green-900/30 text-green-300 placeholder-green-500' : 'border-slate-700 focus:border-indigo-500 bg-slate-800 text-white placeholder-slate-500'}`}
                    />
                    {codeValidated && <div className="absolute right-3 top-2 text-green-400 text-xs font-bold">✓ APPLIED</div>}
                </div>

                <button
                    onClick={() => setShowReviewModal(true)}
                    disabled={isProcessing}
                    className="w-full group bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                >
                    {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                    {!isProcessing && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
            </div>
        </div>
    );
}
