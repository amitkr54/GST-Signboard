import React from 'react';
import { Lock, Unlock, Copy, Trash2, MoreHorizontal } from 'lucide-react';

interface FloatingSelectionToolbarProps {
    x: number;
    y: number;
    isLocked: boolean;
    onLockToggle: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onMore?: () => void;
    fill?: string;
    onColorChange?: (color: string) => void;
}

const DuplicateIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 9h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z" />
        <path d="M5 15V5a1 1 0 0 1 1-1h9" />
        <path d="M11 14h5M13.5 11.5v5" />
    </svg>
);

export function FloatingSelectionToolbar({
    x,
    y,
    isLocked,
    onLockToggle,
    onDuplicate,
    onDelete,
    onMore,
    fill,
    onColorChange
}: FloatingSelectionToolbarProps) {
    return (
        <div
            className="absolute z-[100] flex items-center gap-0.5 p-0.5 bg-white border border-slate-200 rounded-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
            style={{
                left: x,
                top: y - 95, // Positioned much higher to clear rotation handle
                transform: 'translateX(-50%)'
            }}
        >
            {onColorChange && (
                <div className="relative group/color w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all">
                    <div
                        className="w-5 h-5 rounded-full border border-slate-200 shadow-sm"
                        style={{ backgroundColor: fill || '#000000' }}
                    />
                    <input
                        type="color"
                        value={fill || '#000000'}
                        onChange={(e) => onColorChange(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Change Color"
                    />
                </div>
            )}

            <button
                onClick={onLockToggle}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${isLocked ? 'bg-amber-100 text-amber-600' : 'text-slate-600 hover:bg-slate-100'}`}
                title={isLocked ? "Unlock" : "Lock"}
            >
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>

            <button
                onClick={onDuplicate}
                disabled={isLocked}
                className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-all"
                title="Duplicate"
            >
                <DuplicateIcon className="w-4 h-4" />
            </button>

            <button
                onClick={onDelete}
                className="w-9 h-9 flex items-center justify-center rounded-full text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all"
                title="Delete"
            >
                <Trash2 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-slate-200 mx-0.5" />

            <button
                onClick={onMore}
                className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-all"
                title="More"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>
    );
}
