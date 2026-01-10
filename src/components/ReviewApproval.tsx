'use client';

import React, { useRef } from 'react';
import { SignageData, DesignConfig } from '@/lib/types';
import { MaterialId } from '@/lib/utils';
import { fabric } from 'fabric';
import { FabricPreview } from './FabricPreview';
import { X } from 'lucide-react';

interface ReviewApprovalProps {
    data: SignageData;
    design: DesignConfig;
    material: MaterialId;
    isOpen: boolean;
    onClose: () => void;
    onApprove: () => void;
}

export function ReviewApproval({ data, design, material, isOpen, onClose, onApprove }: ReviewApprovalProps) {
    const [isApproved, setIsApproved] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);
    const canvasRef = useRef<fabric.Canvas | null>(null);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Reset approval state when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setIsApproved(false);
        }
    }, [isOpen]);

    if (!isMounted || !isOpen) return null;

    const checklistItems = [
        'Are the text and images clear and easy to read?',
        'Do the design elements fit in the safety area?',
        'Does the background fill out to the edges?',
        'Is everything spelled correctly?'
    ];

    const hasEmptyFields = !data.companyName || !data.address;

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)] max-w-6xl w-full max-h-[90vh] overflow-hidden border border-white/10 flex flex-col">
                <div className="bg-slate-900/40 backdrop-blur-xl border-b border-white/10 px-8 py-5 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-[0.2em]">Review Design</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Final Verification Checklist</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-all"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto custom-scrollbar">
                    {/* Left: Preview */}
                    <div className="space-y-6">
                        <div className="bg-slate-950/40 rounded-3xl p-6 border border-white/5 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Print Preview</p>
                            </div>
                            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl relative group" style={{ height: '450px' }}>
                                <FabricPreview
                                    data={data}
                                    design={design}
                                    material={material}
                                    onMount={(canvas) => {
                                        canvasRef.current = canvas;
                                        // Disable all interactions
                                        canvas.selection = false;
                                        canvas.forEachObject((obj) => {
                                            obj.selectable = false;
                                            obj.evented = false;
                                        });
                                    }}
                                />
                                <div className="absolute inset-0 pointer-events-none border-[12px] border-white/10" />
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase tracking-[0.1em] text-center">
                                Actual print may vary slightly due to material texture
                            </p>
                        </div>
                    </div>

                    {/* Right: Checklist and Actions */}
                    <div className="space-y-8">
                        <div className="bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-white/5 p-8 shadow-xl">
                            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <span className="w-6 h-px bg-indigo-500" /> Checklist
                            </h3>
                            <ul className="space-y-4">
                                {checklistItems.map((item, index) => (
                                    <li key={index} className="flex items-start gap-4 text-sm group">
                                        <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-500/30 transition-colors">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        </div>
                                        <span className="text-slate-300 font-medium leading-relaxed">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {hasEmptyFields && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                                <div className="p-2 bg-rose-500/20 rounded-xl">
                                    <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-black text-rose-400 text-sm uppercase tracking-widest">Required Info Missing</p>
                                    <p className="text-xs text-slate-400 mt-1 font-bold leading-relaxed">Some required fields are missing. These will be left blank on your print.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-800/30 backdrop-blur-sm rounded-3xl border border-white/5 p-8 shadow-xl">
                            <label className="flex items-start gap-4 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isApproved}
                                        onChange={(e) => setIsApproved(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-6 h-6 border-2 border-slate-700 rounded-lg group-hover:border-indigo-500/50 transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center shadow-inner">
                                        <svg className="w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-sm text-slate-300 font-bold leading-relaxed select-none group-hover:text-white transition-colors">
                                    I confirm that I have reviewed the design and have the authorization to print it.
                                </span>
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <button
                                onClick={onClose}
                                className="py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Edit Design
                            </button>
                            <button
                                onClick={onApprove}
                                disabled={!isApproved}
                                className={`py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-2xl ${isApproved
                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-1'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                Continue Checklist
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
