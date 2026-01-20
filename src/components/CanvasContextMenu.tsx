import React, { useEffect, useRef, useState } from 'react';
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
    Layout,
    ChevronRight,
    AlignLeft,
    AlignCenter,
    AlignRight,
    ArrowUpFromLine,
    ArrowDownFromLine,
    Maximize,
    Minimize,
    Group as GroupIcon,
    Ungroup as UngroupIcon,
    MoreHorizontal,
    MoreVertical,
    Paintbrush,
    Columns,
    Rows,
    Menu
} from 'lucide-react';

// Custom Canva-style "Space Evenly" Icons
const DistributeHorizontalIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 5v14" />
        <path d="M12 9v6" />
        <path d="M19 5v14" />
    </svg>
);

const DistributeVerticalIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 5h14" />
        <path d="M9 12h6" />
        <path d="M5 19h14" />
    </svg>
);

const DuplicateIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 9h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z" />
        <path d="M5 15V5a1 1 0 0 1 1-1h9" />
        <path d="M11 14h5M13.5 11.5v5" />
    </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 15V3" />
        <path d="M7 10l5 5 5-5" />
        <path d="M5 21h14" />
    </svg>
);

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onAction: (action: string) => void;
    isLocked?: boolean;
    hasSelection: boolean;
    isGroup?: boolean;
    isMultiple?: boolean;
}

export function CanvasContextMenu({ x, y, onClose, onAction, isLocked, hasSelection, isGroup, isMultiple }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const MenuItem = ({ icon: Icon, label, action, shortcut, danger, disabled, hasSubMenu, subMenuId }: any) => {
        const isSubMenuActive = activeSubMenu === subMenuId;

        return (
            <div
                className="relative"
                onMouseEnter={() => hasSubMenu && setActiveSubMenu(subMenuId)}
                onMouseLeave={() => hasSubMenu && setActiveSubMenu(null)}
            >
                <button
                    onClick={() => {
                        if (!disabled && !hasSubMenu) {
                            onAction(action);
                            onClose();
                        }
                    }}
                    disabled={disabled}
                    className={`w-full flex items-center justify-between px-4 py-1.5 text-sm transition-all ${danger ? 'text-rose-400 hover:bg-rose-500/10' : 'text-slate-300 hover:bg-white/5 hover:text-white'} ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${isSubMenuActive ? 'bg-white/5 text-white' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        {Icon && <Icon className="w-4 h-4 opacity-70" />}
                        <span className="font-bold">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {shortcut && <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{shortcut}</span>}
                        {hasSubMenu && <ChevronRight className="w-4 h-4 text-slate-500" />}
                    </div>
                </button>

                {hasSubMenu && isSubMenuActive && (
                    <div className="absolute top-0 left-full -ml-1 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[200px] animate-in fade-in slide-in-from-left-2 duration-150">
                        {subMenuId === 'layer' && (
                            <>
                                <MenuItem icon={ArrowUpToLine} label="Bring to Front" action="front" />
                                <MenuItem icon={ArrowUp} label="Bring Forward" action="forward" />
                                <MenuItem icon={ArrowDown} label="Send Backward" action="backward" />
                                <MenuItem icon={ArrowDownToLine} label="Send to Back" action="back" />
                            </>
                        )}
                        {subMenuId === 'align' && (
                            <>
                                <MenuItem icon={AlignLeft} label="Left" action="align-left" />
                                <MenuItem icon={AlignCenter} label="Center" action="align-center" />
                                <MenuItem icon={AlignRight} label="Right" action="align-right" />
                                <Divider />
                                <MenuItem icon={ArrowUpToLine} label="Top" action="align-top" />
                                <MenuItem icon={AlignCenter} label="Middle" action="align-middle" className="rotate-90" />
                                <MenuItem icon={ArrowDownToLine} label="Bottom" action="align-bottom" />
                            </>
                        )}
                        {subMenuId === 'space' && (
                            <>
                                <MenuItem icon={DistributeHorizontalIcon} label="Horizontal" action="distribute-h" />
                                <MenuItem icon={DistributeVerticalIcon} label="Vertical" action="distribute-v" />
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const Divider = () => <div className="h-px bg-white/5 my-1 mx-2" />;

    // Adjust position to keep menu within viewport
    const menuWidth = 240;
    const menuHeight = 500;
    const adjustedX = Math.min(x, window.innerWidth - menuWidth - 20);
    const adjustedY = Math.min(y, window.innerHeight - menuHeight - 20);

    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-1 min-w-[240px] animate-in fade-in zoom-in-95 duration-150"
            style={{
                left: adjustedX,
                top: adjustedY
            }}
        >
            <MenuItem icon={Copy} label="Copy" action="copy" shortcut="Ctrl+C" disabled={!hasSelection} />
            <MenuItem icon={Paintbrush} label="Copy style" action="copy-style" shortcut="Ctrl+Alt+C" disabled={!hasSelection} />
            <MenuItem icon={Clipboard} label="Paste" action="paste" shortcut="Ctrl+V" />
            <MenuItem icon={DuplicateIcon} label="Duplicate" action="duplicate" shortcut="Ctrl+D" disabled={!hasSelection || isLocked} />
            <MenuItem icon={Trash2} label="Delete" action="delete" shortcut="Delete" danger disabled={!hasSelection || isLocked} />

            <Divider />

            <MenuItem
                icon={isLocked ? Unlock : Lock}
                label={isLocked ? "Unlock" : "Lock"}
                action="lock"
                shortcut="Alt+Shift+L"
                disabled={!hasSelection}
            />

            <Divider />

            <MenuItem icon={Layers} label="Layer" hasSubMenu subMenuId="layer" disabled={!hasSelection || isLocked} />
            <MenuItem icon={AlignCenter} label="Align elements" hasSubMenu subMenuId="align" disabled={!hasSelection || isLocked} />
            <MenuItem icon={Menu} label="Space evenly" hasSubMenu subMenuId="space" disabled={!hasSelection || isLocked || !isMultiple} />

            <Divider />

            {isGroup ? (
                <MenuItem icon={UngroupIcon} label="Ungroup" action="ungroup" shortcut="Ctrl+Shift+G" disabled={isLocked} />
            ) : (
                <MenuItem icon={GroupIcon} label="Group" action="group" shortcut="Ctrl+G" disabled={!hasSelection || isLocked || !isMultiple} />
            )}

            <MenuItem
                icon={Layout}
                label="Mark as Background"
                action="markAsBackground"
                disabled={!hasSelection || isLocked}
            />

            <Divider />

            <MenuItem icon={DownloadIcon} label="Download selection" action="download-selection" disabled={!hasSelection} />
        </div>
    );
}
