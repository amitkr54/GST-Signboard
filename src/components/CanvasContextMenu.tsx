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
            className={`w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${danger ? 'text-red-600' : 'text-gray-700'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
            <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{label}</span>
            </div>
            {shortcut && <span className="text-[10px] text-gray-400 font-medium ml-4 uppercase">{shortcut}</span>}
        </button>
    );

    const Divider = () => <div className="h-px bg-gray-100 my-1" />;

    // Adjust position to keep menu within viewport
    const menuWidth = 220;
    const menuHeight = 400; // estimated
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 20);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 20);

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl py-1 min-w-[220px] animate-in fade-in zoom-in-95 duration-100"
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

            <Divider />

            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Align to Page</div>
            <div className="grid grid-cols-3 gap-1 px-2 pb-1">
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
                        className="px-1 py-1 text-[10px] text-gray-600 hover:bg-gray-100 rounded border border-gray-100 disabled:opacity-40"
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
