import React from 'react';
import { Menu, Undo2, Redo2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
    title?: string;
    onMenuClick: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    showHistoryControls?: boolean;
}

export function MobileHeader({
    title,
    onMenuClick,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    showHistoryControls = true
}: MobileHeaderProps) {
    return (
        <header className="shrink-0 px-4 py-3 flex items-center justify-between z-[100] border-b border-white/5 shadow-lg relative bg-[#0f172a] md:hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/50 to-purple-900/30 opacity-50" />

            {/* Left Section: Menu + Logo */}
            <div className="flex items-center gap-2 relative z-10">
                <button
                    onClick={onMenuClick}
                    className="text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Menu"
                >
                    <Menu size={22} />
                </button>

                {/* Logo or Title */}
                <div className="flex items-center gap-1.5 max-w-[140px]">
                    <div className="w-5 h-5 rounded-lg bg-indigo-500/20 backdrop-blur-md flex items-center justify-center border border-white/5 shadow-inner shrink-0">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span
                        className="font-black text-white leading-tight text-[14px] tracking-tight truncate"
                        style={{ fontFamily: '"Playfair Display", serif' }}
                    >
                        {title || 'SignagePro'}
                    </span>
                </div>
            </div>

            {/* Right Section: History Controls */}
            {showHistoryControls && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5 backdrop-blur-md relative z-10">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={cn(
                            "p-1.5 transition-all",
                            canUndo ? "text-white" : "text-white/20"
                        )}
                        aria-label="Undo"
                    >
                        <Undo2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-3 bg-white/10" />
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={cn(
                            "p-1.5 transition-all",
                            canRedo ? "text-white" : "text-white/20"
                        )}
                        aria-label="Redo"
                    >
                        <Redo2 className="w-4 h-4" />
                    </button>
                </div>
            )}
        </header>
    );
}
