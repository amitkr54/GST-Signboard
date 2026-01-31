'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import { SignageData, DesignConfig } from '@/lib/types';
import { MaterialId } from '@/lib/utils';
import { X, Download, ArrowRight } from 'lucide-react';

const FabricPreview = dynamic(() => import('./FabricPreview').then(mod => mod.FabricPreview), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-800 animate-pulse rounded-xl flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest">Loading Preview...</div>
});

interface ReviewApprovalProps {
    data: SignageData;
    design: DesignConfig;
    material: MaterialId;
    isOpen: boolean;
    onClose: () => void;
    onApprove: () => void;
    onDownloadPDF?: () => void;
    onEdit?: () => void;
    canvasJSON?: any;
}

export function ReviewApproval({ data, design, material, isOpen, onClose, onApprove, onDownloadPDF, onEdit, canvasJSON }: ReviewApprovalProps) {
    const [isApproved, setIsApproved] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);
    const [isDownloading, setIsDownloading] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        console.log('ReviewApproval mounted');
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
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[100] flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-[#0a0f18] sm:rounded-[2.5rem] shadow-[0_0_80px_-12px_rgba(79,70,229,0.2)] sm:max-w-5xl w-full h-full sm:h-auto sm:max-h-[95vh] overflow-hidden border-x sm:border border-white/5 flex flex-col">
                <div className="bg-slate-900/40 backdrop-blur-xl border-b border-white/5 px-6 sm:px-10 py-5 sm:py-6 flex items-center justify-between shrink-0">
                    <div className="pl-2 sm:pl-0">
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" />
                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tighter uppercase tracking-[0.1em]">Verification</h2>
                        </div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-3.5 italic opacity-80">Final Press-Ready Check</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {onDownloadPDF && (
                            <button
                                type="button"
                                onClick={async () => {
                                    setIsDownloading(true);
                                    await onDownloadPDF();
                                    setTimeout(() => setIsDownloading(false), 2000);
                                }}
                                disabled={isDownloading}
                                className="p-2 sm:px-3 sm:py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg transition-all border border-indigo-500/20 shadow-sm group flex items-center gap-2"
                                title="Download Design Proof"
                            >
                                {isDownloading ? (
                                    <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest sm:block hidden">Design</span>
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 sm:p-2.5 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all border border-white/5"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 overflow-y-auto custom-scrollbar">
                    {/* Left: Preview */}
                    <div className="space-y-4">
                        <div className="bg-slate-950/40 rounded-[1.5rem] p-4 sm:p-6 border border-white/5 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <svg className="w-3 h-3 sm:w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">Design Preview</p>
                            </div>
                            <div
                                className="relative group flex items-center justify-center w-full"
                                style={{ aspectRatio: `${design.width} / ${design.height}` }}
                            >
                                <FabricPreview
                                    data={data}
                                    design={design}
                                    material={material}
                                    isReadOnly={true}
                                    initialJSON={canvasJSON}
                                    registerGlobal={true}
                                />
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-[0.1em] text-center">
                                Actual print may vary slightly due to material texture
                            </p>
                        </div>
                    </div>

                    {/* Right: Checklist and Actions */}
                    <div className="space-y-4 sm:space-y-5">
                        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/5 p-4 sm:p-5 shadow-xl">
                            <h3 className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-4 h-px bg-indigo-500" /> Checklist
                            </h3>
                            <ul className="space-y-2.5">
                                {checklistItems.map((item, index) => (
                                    <li key={index} className="flex items-center gap-3 text-xs sm:text-sm group">
                                        <div className="w-4 h-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                                            <div className="w-1 h-1 rounded-full bg-indigo-400" />
                                        </div>
                                        <span className="text-slate-300 font-bold leading-none">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {hasEmptyFields && (
                            <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-3 sm:p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="p-1.5 bg-rose-500/20 rounded-lg shrink-0">
                                    <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-bold text-rose-400 text-[10px] uppercase tracking-widest leading-none">Missing Fields</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5 font-bold leading-tight">Required info will be blank on your print.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-indigo-600/5 sm:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-indigo-500/10 sm:border-white/5 p-4 sm:p-5 shadow-xl transition-all hover:bg-indigo-600/10">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isApproved}
                                        onChange={(e) => setIsApproved(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 border-2 border-slate-700 rounded-md group-hover:border-indigo-500/50 transition-all peer-checked:bg-indigo-600 peer-checked:border-indigo-600 flex items-center justify-center shadow-inner">
                                        <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                            <path d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-[11px] sm:text-xs text-slate-300 font-bold uppercase tracking-tight leading-snug select-none group-hover:text-white transition-colors">
                                    Final Design Confirmation
                                </span>
                            </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onEdit || onClose}
                                className="py-3 px-5 rounded-lg font-bold uppercase tracking-[0.15em] text-[10px] border border-white/10 text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                            >
                                Edit Design
                            </button>
                            <button
                                type="button"
                                onClick={onApprove}
                                disabled={!isApproved}
                                className={`py-3 px-5 rounded-lg font-bold uppercase tracking-[0.15em] text-[10px] transition-all shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2 ${isApproved
                                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white transform hover:-translate-y-0.5 active:scale-95'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                Approve <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
