'use client';

import React from 'react';

export type MobileTab = 'templates' | 'design' | 'material' | 'order';

interface MobileStepNavigationProps {
    isLandscape: boolean;
    mobileTab: MobileTab;
    setMobileTab: (tab: MobileTab) => void;
}

export function MobileStepNavigation({ isLandscape, mobileTab, setMobileTab }: MobileStepNavigationProps) {
    const stepNumber = mobileTab === 'templates' ? '1' : mobileTab === 'design' ? '2' : mobileTab === 'material' ? '3' : '4';
    const stepTitle = mobileTab === 'templates' ? 'Select Template' : mobileTab === 'design' ? 'Design Your Signage' : mobileTab === 'material' ? 'Choose Material' : 'Finalize Order';

    return (
        <div className={`shrink-0 bg-slate-900/90 backdrop-blur-md px-4 transition-all duration-300 z-20 shadow-lg border-b border-white/10 ${isLandscape && mobileTab === 'design' ? 'h-0 overflow-hidden py-0 border-0 opacity-0' : 'pb-3 mt-0.5'}`}>
            {!isLandscape && (
                <div className="mb-3">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5 mt-2">
                        Step {stepNumber} of 4
                    </p>
                    <h2 className="text-base font-bold text-white tracking-tight">
                        {stepTitle}
                    </h2>
                </div>
            )}
            <div className="flex bg-slate-800/50 p-1 rounded-xl glass-panel gap-1">
                {(['templates', 'design', 'material', 'order'] as MobileTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setMobileTab(tab)}
                        className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${mobileTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>
        </div>
    );
}
