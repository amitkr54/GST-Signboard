import React from 'react';
import { Type, PaintBucket, Palette, Building2, ArrowRightCircle, ArrowLeftCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileToolbarProps {
    activeDrawer: 'font' | 'text-color' | 'profile' | 'bg-color' | 'templates' | null;
    setActiveDrawer: (drawer: 'font' | 'text-color' | 'profile' | 'bg-color' | 'templates' | null) => void;
    onNext?: () => void;
    nextLabel?: string;
    onBack?: () => void;
    showTools?: boolean;
}

export function MobileToolbar({ activeDrawer, setActiveDrawer, onNext, nextLabel, onBack, showTools = true }: MobileToolbarProps) {
    const tools = [
        { id: 'font', label: 'Text Font', icon: Type },
        { id: 'text-color', label: 'Text Colour', icon: Palette },
        { id: 'profile', label: 'Company Details', icon: Building2 },
        { id: 'bg-color', label: 'Background Colour', icon: PaintBucket },
    ] as const;

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 bg-[#0a0f1d] border-t border-white/10 z-[90] shadow-[0_-10px_40px_rgba(0,0,0,0.4)] transition-all",
            showTools ? "px-1 py-3 pb-4 sm:pb-3 flex justify-between items-center" : "p-4 flex gap-4 items-center"
        )}>
            {onBack && (
                <button
                    onClick={onBack}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all outline-none text-white/40 active:scale-95",
                        showTools ? "flex-1 min-w-0 px-0.5" : "px-4 py-2.5 rounded-xl bg-white/5 border border-white/10"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <ArrowLeftCircle size={showTools ? 26 : 20} className={showTools ? "" : "text-white/60"} />
                        {!showTools && <span className="text-[14px] font-bold leading-none">Back</span>}
                    </div>
                    {showTools && (
                        <div className="flex flex-col items-center leading-[1.1]">
                            <span className="text-[11px] font-bold text-center">Back</span>
                        </div>
                    )}
                </button>
            )}

            {showTools && tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeDrawer === tool.id;

                return (
                    <button
                        key={tool.id}
                        onClick={() => setActiveDrawer(isActive ? null : tool.id)}
                        className={cn(
                            "flex flex-col items-center gap-1 transition-all outline-none flex-1 min-w-0 px-0.5",
                            isActive ? "text-white scale-105" : "text-white/60 hover:text-white"
                        )}
                    >
                        <div className={cn(
                            "p-1 rounded-xl transition-colors",
                            isActive ? "bg-white/10" : "bg-transparent"
                        )}>
                            <Icon size={24} />
                        </div>
                        <div className="flex flex-col items-center leading-[1.1]">
                            {tool.label.split(' ').map((word, i) => (
                                <span key={i} className="text-[11px] font-bold text-center tracking-tight">{word}</span>
                            ))}
                        </div>
                    </button>
                );
            })}

            {onNext && (
                <button
                    onClick={onNext}
                    className={cn(
                        "flex transition-all outline-none active:scale-95",
                        showTools
                            ? "flex flex-col items-center gap-1 flex-1 min-w-0 px-0.5 text-indigo-400"
                            : "flex-1 items-center justify-center gap-3 bg-indigo-600 text-white py-2.5 rounded-xl font-black text-[13px] shadow-lg shadow-indigo-600/20"
                    )}
                >
                    {showTools ? (
                        <>
                            <div className="p-1 rounded-xl bg-transparent">
                                <ArrowRightCircle size={26} />
                            </div>
                            <div className="flex flex-col items-center leading-[1.1]">
                                <span className="text-[11px] font-black text-center">{nextLabel || 'Next'}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="leading-none">{nextLabel || 'Proceed'}</span>
                            <ArrowRightCircle size={20} className="text-white" />
                        </>
                    )}
                </button>
            )}
        </div>
    );
}
