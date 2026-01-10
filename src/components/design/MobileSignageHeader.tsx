'use client';

import React from 'react';
import { ChevronLeft, Undo2, Redo2, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MobileSignageHeaderProps {
    isLandscape: boolean;
    isSaving: boolean;
    hasSavedDraft: boolean;
}

export function MobileSignageHeader({ isLandscape, isSaving, hasSavedDraft }: MobileSignageHeaderProps) {
    const router = useRouter();

    return (
        <header className={`shrink-0 bg-slate-900/80 backdrop-blur-md px-4 py-2 flex items-center justify-between border-b border-white/10 shadow-lg z-30 transition-all ${isLandscape ? 'h-0 overflow-hidden py-0 opacity-0' : 'h-auto'}`}>
            <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-300 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center px-4">
                <div className="flex items-center justify-center gap-2">
                    <h1 className="font-bold text-white leading-tight">Design Signage</h1>
                </div>
                {!isLandscape && <p className="text-[10px] text-slate-400">Professional Canvas Editor</p>}
            </div>
            <div className="flex items-center gap-3">
                {isSaving && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-100 animate-pulse">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Saving...</span>
                    </div>
                )}
                {!isSaving && hasSavedDraft && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                        <Check className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saved</span>
                    </div>
                )}
                <div className="flex gap-1">
                    <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><Undo2 className="w-5 h-5" /></button>
                    <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><Redo2 className="w-5 h-5" /></button>
                </div>
            </div>
        </header>
    );
}
