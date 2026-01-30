import { fabric } from 'fabric';
import React, { useState } from 'react';
import { FontVariantSupport } from '@/lib/font-utils';
import {
    Minus,
    Plus,
    AlignLeft,
    AlignCenter,
    AlignRight,
    ArrowUp,
    ArrowDown,
    ArrowUpToLine,
    ArrowDownToLine,
    Unlock,
    Lock,
    Copy,
    Trash2,
    Layers,
    Type,
    Group as GroupIcon,
    Ungroup as UngroupIcon,
    Download,
    Layout,
    ChevronDown,
    Menu,
    Trash,
    GripVertical,
    MoreHorizontal,
    AlignStartHorizontal,
    AlignCenterHorizontal,
    AlignEndHorizontal,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    Maximize,
    Minimize,
    Type as SpacingIcon
} from 'lucide-react';

// Custom Canva-style "Space Evenly" Icons
const DistributeHorizontalIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 5v14" />
        <path d="M12 9v6" />
        <path d="M19 5v14" />
    </svg>
);

const DistributeVerticalIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
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

interface DesktopTextFormatToolbarProps {
    selectedObject: fabric.Object;
    isTextObject: boolean;
    isMultiple: boolean;
    isGroup: boolean;
    isLocked: boolean;
    fontFamily: string;
    fontSize: number;
    isBold: boolean;
    isItalic: boolean;
    textColor: string;
    textAlign: string;
    lineHeight: number;
    charSpacing: number;
    showPositionMenu: boolean;
    setShowPositionMenu: (show: boolean) => void;
    handleFontFamilyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleFontSizeChange: (e: React.ChangeEvent<HTMLInputElement> | number) => void;
    toggleBold: () => void;
    toggleItalic: () => void;
    handleAlignChange: (align: 'left' | 'center' | 'right' | 'justify') => void;
    handleLineHeightChange: (value: number) => void;
    handleCharSpacingChange: (value: number) => void;
    handleColorChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleLayerAction: (action: 'front' | 'back' | 'forward' | 'backward') => void;
    onLockToggle: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onAction?: (action: string) => void;
    onDragStart?: (e: React.MouseEvent) => void;
    fontOptions: string[];
    supportedVariants?: FontVariantSupport;
}

export function DesktopTextFormatToolbar({
    selectedObject,
    isTextObject,
    isMultiple,
    isGroup,
    isLocked,
    fontFamily,
    fontSize,
    isBold,
    isItalic,
    textColor,
    textAlign,
    lineHeight,
    charSpacing,
    showPositionMenu,
    setShowPositionMenu,
    handleFontFamilyChange,
    handleFontSizeChange,
    toggleBold,
    toggleItalic,
    handleAlignChange,
    handleLineHeightChange,
    handleCharSpacingChange,
    handleColorChange,
    handleLayerAction,
    onLockToggle,
    onDuplicate,
    onDelete,
    onAction,
    onDragStart,
    fontOptions,
    supportedVariants
}: DesktopTextFormatToolbarProps) {
    const [showAlignMenu, setShowAlignMenu] = useState(false);
    const [showLayerMenu, setShowLayerMenu] = useState(false);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showSpacingMenu, setShowSpacingMenu] = useState(false);

    // Use AlignCenter as the constant trigger icon as requested
    const AlignmentTriggerIcon = AlignCenter;

    return (
        <div className="flex items-center gap-2 h-10 px-3 py-1 bg-slate-900 border border-slate-700/50 rounded-none shadow-xl animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto">
            {/* FONT, SIZE & B/I SECTION */}
            <div className="flex items-center gap-2 border-r border-slate-700/50 pr-2">
                {isTextObject && !isMultiple && (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={fontFamily}
                                onChange={handleFontFamilyChange}
                                disabled={isLocked}
                                className="appearance-none pl-3 pr-8 py-1.5 bg-slate-800/80 border border-slate-700 rounded-none text-[13px] font-bold text-slate-100 hover:border-indigo-500/50 focus:outline-none transition-all cursor-pointer disabled:opacity-50 min-w-[120px]"
                            >
                                {fontOptions.map(font => (
                                    <option key={font} value={font} className="bg-slate-900 text-white" style={{ fontFamily: font }}>{font}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                        </div>

                        <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-none h-8 px-0.5">
                            <button onClick={() => handleFontSizeChange(Math.round(Math.max(8, fontSize - 1)))} disabled={isLocked} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Decrease font size"><Minus className="w-3 h-3" /></button>
                            <input type="number" value={Math.round(fontSize)} onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 0)} disabled={isLocked} className="w-10 text-center bg-transparent border-none text-[12px] font-bold text-slate-100 focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                            <button onClick={() => handleFontSizeChange(Math.round(Math.min(300, fontSize + 1)))} disabled={isLocked} className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Increase font size"><Plus className="w-3 h-3" /></button>
                        </div>

                        <div className="flex items-center gap-1 border-l border-slate-700/50 pl-1 mx-1">
                            <button onClick={toggleBold} disabled={isLocked || (supportedVariants && !supportedVariants.bold)} className={`w-8 h-8 flex items-center justify-center rounded-none font-black text-xs transition-all ${isBold ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Bold">B</button>
                            <button onClick={toggleItalic} disabled={isLocked || (supportedVariants && !supportedVariants.italic)} className={`w-8 h-8 flex items-center justify-center rounded-none italic font-black text-xs transition-all ${isItalic ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`} title="Italic">I</button>
                        </div>

                        <div className="flex items-center gap-0.5 bg-slate-800/80 rounded-none p-0.5 border-l border-slate-700/50 pl-1">
                            <button onClick={() => handleAlignChange('left')} className={`w-8 h-8 flex items-center justify-center rounded-none ${textAlign === 'left' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Align left"><AlignLeft className="w-4.5 h-4.5" /></button>
                            <button onClick={() => handleAlignChange('center')} className={`w-8 h-8 flex items-center justify-center rounded-none ${textAlign === 'center' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Align center"><AlignCenter className="w-4.5 h-4.5" /></button>
                            <button onClick={() => handleAlignChange('right')} className={`w-8 h-8 flex items-center justify-center rounded-none ${textAlign === 'right' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`} title="Align right"><AlignRight className="w-4.5 h-4.5" /></button>
                        </div>

                        <div className="relative border-l border-slate-700/50 pl-1 mx-1">
                            <button
                                onClick={() => setShowSpacingMenu(!showSpacingMenu)}
                                className={`w-8 h-8 flex items-center justify-center rounded-none transition-all ${showSpacingMenu ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                title="Spacing"
                            >
                                <SpacingIcon className="w-4.5 h-4.5" />
                            </button>
                            {showSpacingMenu && (
                                <div className="absolute top-10 left-0 bg-slate-800 border border-slate-700 rounded-none shadow-2xl p-4 z-50 flex flex-col gap-4 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Line Spacing</span>
                                            <span className="text-[11px] font-bold text-slate-100">{lineHeight.toFixed(2)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="2.5"
                                            step="0.05"
                                            value={lineHeight}
                                            onChange={(e) => handleLineHeightChange(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Letter Spacing</span>
                                            <span className="text-[11px] font-bold text-slate-100">{charSpacing}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-100"
                                            max="500"
                                            step="1"
                                            value={charSpacing}
                                            onChange={(e) => handleCharSpacingChange(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* MULTIPLE SELECTION - ARRANGE & SPACE */}
            {/* MULTIPLE SELECTION - ALIGN & SPACE */}
            {isMultiple && (
                <>
                    <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-none p-0.5 border border-slate-700/50 h-8 pr-2 mr-2">
                        <span className="text-[13px] font-bold text-slate-100 px-2 border-r border-slate-700/50 h-6 flex items-center justify-center min-w-[120px]">Align Elements</span>
                        <div className="flex items-center gap-0.5">
                            <button onClick={() => onAction?.('align-left')} className="w-7 h-7 flex items-center justify-center rounded-none text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align left"><AlignStartVertical className="w-5 h-5" strokeWidth={1.5} /></button>
                            <button onClick={() => onAction?.('align-center')} className="w-7 h-7 flex items-center justify-center rounded-none text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align center"><AlignCenterVertical className="w-5 h-5" strokeWidth={1.5} /></button>
                            <button onClick={() => onAction?.('align-right')} className="w-7 h-7 flex items-center justify-center rounded-none text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align right"><AlignEndVertical className="w-5 h-5" strokeWidth={1.5} /></button>
                            <div className="w-px h-4 bg-slate-700 mx-0.5" />
                            <button onClick={() => onAction?.('align-top')} className="w-7 h-7 flex items-center justify-center rounded-none text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align top"><AlignStartHorizontal className="w-5 h-5" strokeWidth={1.5} /></button>
                            <button onClick={() => onAction?.('align-middle')} className="w-7 h-7 flex items-center justify-center rounded-none text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align middle"><AlignCenterHorizontal className="w-5 h-5" strokeWidth={1.5} /></button>
                            <button onClick={() => onAction?.('align-bottom')} className="w-7 h-7 flex items-center justify-center rounded-none text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align bottom"><AlignEndHorizontal className="w-5 h-5" strokeWidth={1.5} /></button>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-none p-0.5 border border-slate-700/50 h-8 pr-2 mr-2">
                        <span className="text-[13px] font-bold text-slate-100 px-2 border-r border-slate-700/50 h-6 flex items-center justify-center min-w-[140px]">Space Distribution</span>
                        <div className="flex items-center gap-0.5">
                            <button onClick={() => onAction?.('distribute-h')} className="w-7 h-7 flex items-center justify-center rounded-none text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Distribute horizontally"><DistributeHorizontalIcon className="w-5 h-5" /></button>
                            <button onClick={() => onAction?.('distribute-v')} className="w-7 h-7 flex items-center justify-center rounded-none text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Distribute vertically"><DistributeVerticalIcon className="w-5 h-5" /></button>
                        </div>
                    </div>
                </>
            )}

            <div className="flex items-center gap-2 pr-2 border-r border-slate-700/50">
                <div className="relative flex flex-col items-center justify-center w-10 h-10 cursor-pointer group" title={isTextObject ? "Text color" : "Element color"}>
                    {isTextObject ? (
                        <>
                            <span className="text-[17px] font-bold text-white leading-none mt-1">A</span>
                            <div className="w-6 h-1 rounded-sm mt-1" style={{
                                background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff)'
                            }} />
                        </>
                    ) : (
                        <div
                            className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: textColor }}
                        />
                    )}
                    <input type="color" value={textColor} onChange={handleColorChange} disabled={isLocked} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                </div>
            </div>


            {/* ARRANGE BLOCK (For single objects, aligning to board) */}
            {!isMultiple && (
                <div className="relative border-r border-slate-700/50 pr-2">
                    <button
                        onClick={() => setShowAlignMenu(!showAlignMenu)}
                        disabled={isLocked}
                        className="flex items-center gap-2 h-8 px-2 rounded-none text-slate-400 hover:bg-slate-800 transition-all group"
                        title="Arrange"
                    >
                        <span className="text-[13px] font-bold text-slate-100 hidden xl:block whitespace-nowrap">Align to Board</span>
                        <AlignCenterVertical className="w-5.5 h-5.5 group-hover:text-indigo-400" strokeWidth={1.5} />
                        <ChevronDown className={`w-4 h-4 transition-transform ${showAlignMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showAlignMenu && (
                        <div className="absolute top-10 left-0 bg-slate-800 border border-slate-700 rounded-none shadow-2xl p-1 z-50 flex gap-0.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <button onClick={() => { onAction?.('align-left'); setShowAlignMenu(false); }} className="w-8 h-8 flex items-center justify-center rounded-none text-slate-400 hover:bg-indigo-600 hover:text-white transition-all" title="Align left"><AlignStartVertical className="w-5 h-5" strokeWidth={1.5} /></button>
                            <button onClick={() => { onAction?.('align-center'); setShowAlignMenu(false); }} className="w-8 h-8 flex items-center justify-center rounded-none text-slate-400 hover:bg-indigo-600 hover:text-white transition-all" title="Align center"><AlignCenterVertical className="w-5 h-5" strokeWidth={1.5} /></button>
                            <button onClick={() => { onAction?.('align-right'); setShowAlignMenu(false); }} className="w-8 h-8 flex items-center justify-center rounded-none text-slate-400 hover:bg-indigo-600 hover:text-white transition-all" title="Align right"><AlignEndVertical className="w-5 h-5" strokeWidth={1.5} /></button>
                            <div className="w-px h-5 bg-slate-700 mx-0.5" />
                            <button onClick={() => { onAction?.('align-top'); setShowAlignMenu(false); }} className="w-8 h-8 flex items-center justify-center rounded-none text-slate-400 hover:bg-indigo-600 hover:text-white transition-all" title="Align top"><AlignStartHorizontal className="w-5 h-5" strokeWidth={1.5} /></button>
                            <button onClick={() => { onAction?.('align-middle'); setShowAlignMenu(false); }} className="w-8 h-8 flex items-center justify-center rounded-none text-slate-400 hover:bg-indigo-600 hover:text-white transition-all" title="Align middle"><AlignCenterHorizontal className="w-5 h-5" strokeWidth={1.5} /></button>
                            <button onClick={() => { onAction?.('align-bottom'); setShowAlignMenu(false); }} className="w-8 h-8 flex items-center justify-center rounded-none text-slate-400 hover:bg-indigo-600 hover:text-white transition-all" title="Align bottom"><AlignEndHorizontal className="w-5 h-5" strokeWidth={1.5} /></button>
                        </div>
                    )}
                </div>
            )}


            {/* LAYERS BLOCK */}
            <div className="relative border-r border-slate-700/50 pr-2">
                <button
                    onClick={() => setShowLayerMenu(!showLayerMenu)}
                    disabled={isLocked}
                    className="flex items-center gap-2 h-8 px-2 rounded-none text-slate-400 hover:bg-slate-800 transition-all group"
                    title="Layer"
                >
                    <Layers className="w-4.5 h-4.5 group-hover:text-indigo-400" />
                    <span className="text-[13px] font-bold text-slate-100 hidden xl:block">Layer</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showLayerMenu ? 'rotate-180' : ''}`} />
                </button>
                {showLayerMenu && (
                    <div className="absolute top-10 left-0 bg-slate-800 border border-slate-700 rounded-none shadow-2xl py-1 z-50 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
                        <button onClick={() => { handleLayerAction('front'); setShowLayerMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all">
                            <ArrowUpToLine className="w-4 h-4 text-indigo-400" />
                            Bring to front
                        </button>
                        <button onClick={() => { handleLayerAction('forward'); setShowLayerMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all border-t border-slate-700/50">
                            <ArrowUp className="w-4 h-4 text-indigo-400" />
                            Bring forward
                        </button>
                        <button onClick={() => { handleLayerAction('backward'); setShowLayerMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all border-t border-slate-700/50">
                            <ArrowDown className="w-4 h-4 text-indigo-400" />
                            Send backward
                        </button>
                        <button onClick={() => { handleLayerAction('back'); setShowLayerMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all border-t border-slate-700/50">
                            <ArrowDownToLine className="w-4 h-4 text-indigo-400" />
                            Send to back
                        </button>
                    </div>
                )}
            </div>

            {/* ACTIONS SECTION */}
            <div className="flex items-center gap-1.5 ml-auto border-l border-slate-700/50 pl-3">
                {/* 1. Element Selection: Show All Buttons directly */}
                {!isTextObject && !isMultiple && (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={onLockToggle}
                            className={`flex items-center gap-2 h-8 px-2 rounded-none transition-all group ${isLocked ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:bg-slate-800'}`}
                            title={isLocked ? "Unlock" : "Lock"}
                        >
                            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 group-hover:text-indigo-400" />}
                            <span className="text-[11px] font-bold tracking-wider hidden 2xl:block">{isLocked ? 'Unlock' : 'Lock'}</span>
                        </button>

                        <button
                            onClick={onDuplicate}
                            disabled={isLocked}
                            className="flex items-center gap-2 h-8 px-2 rounded-none text-slate-400 hover:bg-slate-800 transition-all group disabled:opacity-30"
                            title="Duplicate"
                        >
                            <DuplicateIcon className="w-4 h-4 group-hover:text-indigo-400" />
                            <span className="text-[11px] font-bold tracking-wider hidden 2xl:block">Duplicate</span>
                        </button>

                        <button
                            onClick={() => onAction?.('markAsBackground')}
                            disabled={isLocked}
                            className="flex items-center gap-2 h-8 px-2 rounded-none text-slate-400 hover:bg-slate-800 transition-all group"
                            title="Set as background"
                        >
                            <Layout className="w-4 h-4 group-hover:text-indigo-400" />
                            <span className="text-[11px] font-bold tracking-wider hidden 2xl:block">Set BG</span>
                        </button>

                        <button
                            onClick={() => onAction?.('download-selection')}
                            className="flex items-center gap-2 h-8 px-2 rounded-none text-slate-400 hover:bg-slate-800 transition-all group"
                            title="Export selection"
                        >
                            <DownloadIcon className="w-4 h-4 group-hover:text-indigo-400" />
                            <span className="text-[11px] font-bold tracking-wider hidden 2xl:block">Export</span>
                        </button>

                        <button
                            onClick={onDelete}
                            className="flex items-center gap-2 h-8 px-2 rounded-none text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-all group"
                            title="Delete"
                        >
                            <Trash className="w-4 h-4" />
                            <span className="text-[11px] font-bold tracking-wider hidden 2xl:block">Delete</span>
                        </button>
                    </div>
                )}

                {/* 2. Text or Multiple Selection: Show "More" Menu */}
                {(isTextObject || isMultiple) && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className="w-8 h-8 flex items-center justify-center rounded-none text-slate-400 hover:bg-slate-800 transition-all"
                            title="More"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {showMoreMenu && (
                            <div className="absolute top-10 right-0 bg-slate-800 border border-slate-700 rounded-none shadow-2xl py-1 z-50 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
                                {isMultiple && (
                                    <button onClick={() => { onAction?.(isGroup ? 'ungroup' : 'group'); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all">
                                        <GroupIcon className="w-4 h-4 text-indigo-400" />
                                        {isGroup ? 'Ungroup layers' : 'Group layers'}
                                    </button>
                                )}

                                <button onClick={() => { onLockToggle(); setShowMoreMenu(false); }} className={`w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all ${isMultiple ? 'border-t border-slate-700/50' : ''}`}>
                                    {isLocked ? <Lock className="w-4 h-4 text-indigo-400" /> : <Unlock className="w-4 h-4 text-indigo-400" />}
                                    {isLocked ? 'Unlock layer' : 'Lock layer'}
                                </button>

                                <button onClick={() => { onDuplicate(); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all border-t border-slate-700/50">
                                    <DuplicateIcon className="w-4 h-4 text-indigo-400" />
                                    Duplicate selection
                                </button>

                                {!isMultiple && (
                                    <button onClick={() => { onAction?.('markAsBackground'); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all border-t border-slate-700/50">
                                        <Layout className="w-4 h-4 text-indigo-400" />
                                        Set as background
                                    </button>
                                )}

                                <button onClick={() => { onAction?.('download-selection'); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all border-t border-slate-700/50">
                                    <DownloadIcon className="w-4 h-4 text-indigo-400" />
                                    Export selection
                                </button>

                                <button onClick={() => { onDelete(); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-950/30 transition-all border-t border-slate-700/50">
                                    <Trash className="w-4 h-4" />
                                    Delete selection
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
