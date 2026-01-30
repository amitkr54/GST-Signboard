'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    variant?: 'light' | 'dark';
    disableBackdrop?: boolean;
}

export function MobileDrawer({ isOpen, onClose, title, children, variant = 'dark', disableBackdrop = false }: MobileDrawerProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setMounted(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!mounted && !isOpen) return null;

    const isLight = variant === 'light';

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] transition-opacity duration-300",
                    isLight ? "bg-slate-900/40 backdrop-blur-[2px]" : "bg-slate-950/60 backdrop-blur-sm",
                    disableBackdrop && "bg-transparent backdrop-blur-none",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    "fixed bottom-0 left-0 right-0 z-[101] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-transform duration-300 transform flex flex-col max-h-[50vh]",
                    isLight ? "bg-white rounded-none" : "bg-[#0f172a] rounded-none border-t border-white/5",
                    isOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                {/* Handle */}
                <div className="w-full flex justify-center pt-2 pb-0.5 shrink-0" onClick={onClose}>
                    <div className={cn(
                        "w-12 h-1",
                        isLight ? "bg-slate-200" : "bg-white/10"
                    )} />
                </div>

                {/* Header */}
                <div className={cn(
                    "px-6 py-2 flex items-center justify-between shrink-0",
                    isLight ? "border-b border-slate-100" : "border-b border-white/5"
                )}>
                    <h3 className={cn(
                        "text-[15px] font-bold tracking-tight",
                        isLight ? "text-slate-900" : "text-white"
                    )}>{title}</h3>
                    <button
                        onClick={onClose}
                        className={cn(
                            "p-1.5 transition-all",
                            isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-500" : "bg-white/5 hover:bg-white/10 text-slate-400"
                        )}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-2 pb-6">
                    {children}
                </div>
            </div>
        </>
    );
}
