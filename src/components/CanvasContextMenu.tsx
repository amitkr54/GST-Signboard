import React, { useEffect, useRef } from 'react';
import {
    Copy,
    Clipboard,
    Trash2,
    Layers,
    Lock,
    Unlock,
    ArrowUp,
    ArrowDown,
    ArrowUpToLine,
    ArrowDownToLine,
    Layout
} from 'lucide-react';

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: string) => void;
    isLocked?: boolean;
    hasSelection: boolean;
}

export function CanvasContextMenu({ x, y, onClose, onAction, isLocked, hasSelection }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const MenuItem = ({ icon: Icon, label, action, shortcut, danger, disabled }: any) => (
        <button
            onClick={() => {
                if (!disabled) {
                    onAction(action);
                    onClose();
                }
            }}
            disabled={disabled}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all ${danger ? 'text-rose-400 hover:bg-rose-500/10' : 'text-slate-300 hover:bg-white/5 hover:text-white'} ${disabled ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span className="font-bold">{label}</span>
            </div>
            {shortcut && <span className="text-[9px] text-slate-500 font-black ml-4 uppercase tracking-widest">{shortcut}</span>}
        </button>
    );

    const Divider = () => <div className="h-px bg-white/5 my-1.5 mx-2" />;

    // Adjust position to keep menu within viewport
    const menuWidth = 220;
    const menuHeight = 400; // estimated
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 20);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 20);

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 min-w-[240px] animate-in fade-in zoom-in-95 duration-150"
            style={{
                left: adjustedX,
                top: adjustedY
            }}
        >
            <MenuItem icon={Layers} label="Duplicate" action="duplicate" shortcut="Ctrl+D" disabled={!hasSelection || isLocked} />
            <MenuItem icon={Copy} label="Copy" action="copy" shortcut="Ctrl+C" disabled={!hasSelection} />
            <MenuItem icon={Clipboard} label="Paste" action="paste" shortcut="Ctrl+V" />
            <MenuItem icon={Trash2} label="Delete" action="delete" shortcut="Delete" danger disabled={!hasSelection || isLocked} />

            <Divider />

            <MenuItem icon={ArrowUpToLine} label="Bring to Front" action="front" disabled={!hasSelection || isLocked} />
            <MenuItem icon={ArrowUp} label="Bring Forward" action="forward" disabled={!hasSelection || isLocked} />
            <MenuItem icon={ArrowDown} label="Send Backward" action="backward" disabled={!hasSelection || isLocked} />
            <MenuItem icon={ArrowDownToLine} label="Send to Back" action="back" disabled={!hasSelection || isLocked} />

            <Divider />

            <MenuItem
                icon={isLocked ? Unlock : Lock}
                label={isLocked ? "Unlock" : "Lock"}
                action="lock"
                shortcut="Alt+Shift+L"
                disabled={!hasSelection}
            />
            <MenuItem
                icon={Layout}
                label="Mark as Background"
                action="markAsBackground"
                disabled={!hasSelection || isLocked}
            />

            <Divider />

            <div className="px-4 py-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Align to Page</div>
            <div className="grid grid-cols-3 gap-1.5 px-3 pb-2">
                {[
                    { label: 'Left', action: 'align-left' },
                    { label: 'Center', action: 'align-center' },
                    { label: 'Right', action: 'align-right' },
                    { label: 'Top', action: 'align-top' },
                    { label: 'Middle', action: 'align-middle' },
                    { label: 'Bottom', action: 'align-bottom' }
                ].map(item => (
                    <button
                        key={item.label}
                        onClick={() => {
                            if (!isLocked && hasSelection) {
                                onAction(item.action);
                                onClose();
                            }
                        }}
                        disabled={!hasSelection || isLocked}
                        className="px-1 py-1.5 text-[9px] font-bold text-slate-300 bg-slate-800/50 hover:bg-indigo-600/20 hover:text-white rounded-lg border border-white/5 transition-all disabled:opacity-30"
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
