'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { DesignConfig } from '@/lib/types';

interface DesktopSignageHeaderProps {
    design: DesignConfig;
    isSaving: boolean;
    hasSavedDraft: boolean;
}

export function DesktopSignageHeader({ design, isSaving, hasSavedDraft }: DesktopSignageHeaderProps) {
    return (
        <header className="h-16 shrink-0 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between border-b border-white/10 z-30 shadow-xl">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
                <span className="font-bold text-white tracking-tight">Signage Studio</span>
            </div>
            <div className="flex items-center gap-4">
                {isSaving && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-widest leading-none">Saving to Cloud...</span>
                    </div>
                )}
                {!isSaving && hasSavedDraft && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <Check className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">All changes saved</span>
                    </div>
                )}
                <div className="text-sm font-bold text-slate-300">
                    {design.width}in × {design.height}in
                </div>
            </div>
        </header>
    );
}
