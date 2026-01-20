import { fabric } from 'fabric';
import React from 'react';
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
    Trash
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
    showPositionMenu: boolean;
    setShowPositionMenu: (show: boolean) => void;
    handleFontFamilyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    handleFontSizeChange: (e: React.ChangeEvent<HTMLInputElement> | number) => void;
    toggleBold: () => void;
    toggleItalic: () => void;
    handleAlignChange: (align: 'left' | 'center' | 'right' | 'justify') => void;
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
    showPositionMenu,
    setShowPositionMenu,
    handleFontFamilyChange,
    handleFontSizeChange,
    toggleBold,
    toggleItalic,
    handleAlignChange,
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
    return (
        <div className="flex flex-col gap-2.5 px-4 py-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-2xl shrink-0 min-w-fit animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* ROW 1: TYPOGRAPHY BASIS */}
            <div className="flex items-center gap-4 h-10">
                {isTextObject && !isMultiple ? (
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex items-center gap-2.5 shrink-0">
                            <Type className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden xl:inline">Typography</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <select
                                    value={fontFamily}
                                    onChange={handleFontFamilyChange}
                                    disabled={isLocked}
                                    className="appearance-none pl-3 pr-9 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-[13px] font-bold text-slate-100 hover:border-indigo-500/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer disabled:opacity-50 min-w-[180px]"
                                >
                                    {fontOptions.map(font => (
                                        <option key={font} value={font} className="bg-slate-900 text-white py-2" style={{ fontFamily: font }}>{font}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                            </div>

                            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl px-1 h-9">
                                <button onClick={() => handleFontSizeChange(Math.max(8, fontSize - 1))} disabled={isLocked} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all"><Minus className="w-3.5 h-3.5" /></button>
                                <input type="number" value={fontSize} onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 0)} disabled={isLocked} className="w-12 text-center bg-transparent border-none text-[13px] font-bold text-slate-100 focus:ring-0" />
                                <button onClick={() => handleFontSizeChange(Math.min(300, fontSize + 1))} disabled={isLocked} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all"><Plus className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>

                        <div className="w-px h-5 bg-slate-800/80 mx-1" />

                        <div className="flex items-center gap-1.5">
                            <button onClick={toggleBold} disabled={isLocked || (supportedVariants && !supportedVariants.bold)} className={`w-9 h-9 flex items-center justify-center rounded-xl font-black text-sm transition-all ${isBold ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>B</button>
                            <button onClick={toggleItalic} disabled={isLocked || (supportedVariants && !supportedVariants.italic)} className={`w-9 h-9 flex items-center justify-center rounded-xl italic font-black text-sm transition-all ${isItalic ? 'bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>I</button>

                            <div className="w-9 h-9 rounded-xl border-2 border-slate-700/50 shadow-inner relative cursor-pointer hover:scale-105 transition-transform overflow-hidden ring-offset-2 ring-offset-slate-900 hover:ring-2 hover:ring-indigo-500/50" style={{ backgroundColor: textColor }}>
                                <input type="color" value={textColor} onChange={handleColorChange} disabled={isLocked} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150" />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Row 1 for Multiple Elements (Always shows Alignment/Distribution) */
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden xl:inline">Arrange</span>
                            <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl border border-slate-700 p-1">
                                <button onClick={() => onAction?.('align-left')} className="w-9 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align Left"><AlignLeft className="w-4 h-4" /></button>
                                <button onClick={() => onAction?.('align-center')} className="w-9 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align Center"><AlignCenter className="w-4 h-4" /></button>
                                <button onClick={() => onAction?.('align-right')} className="w-9 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align Right"><AlignRight className="w-4 h-4" /></button>
                                <div className="w-px h-5 bg-slate-700 mx-1" />
                                <button onClick={() => onAction?.('align-top')} className="w-9 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align Top"><ArrowUpToLine className="w-4 h-4" /></button>
                                <button onClick={() => onAction?.('align-middle')} className="w-9 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all rotate-90" title="Align Middle"><AlignCenter className="w-4 h-4" /></button>
                                <button onClick={() => onAction?.('align-bottom')} className="w-9 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Align Bottom"><ArrowDownToLine className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {isMultiple && (
                            <div className="flex items-center gap-2.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden xl:inline">Space</span>
                                <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl border border-slate-700 p-1">
                                    <button onClick={() => onAction?.('distribute-h')} className="w-9 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Horizontal"><DistributeHorizontalIcon className="w-4 h-4" /></button>
                                    <button onClick={() => onAction?.('distribute-v')} className="w-9 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Vertical"><DistributeVerticalIcon className="w-4 h-4" /></button>
                                </div>
                            </div>
                        )}

                        <div className="flex-1" />

                        {(isMultiple || isGroup) && (
                            <button
                                onClick={() => onAction?.(isMultiple ? 'group' : 'ungroup')}
                                className="h-9 px-5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2.5 ring-4 ring-indigo-500/10"
                            >
                                {isMultiple ? <GroupIcon className="w-4 h-4" /> : <UngroupIcon className="w-4 h-4" />}
                                {isMultiple ? 'Group Layer' : 'Ungroup'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* DIVIDER */}
            <div className="w-full h-px bg-slate-800/40" />

            {/* ROW 2: LAYOUT & ACTIONS */}
            <div className="flex items-center gap-4 h-10">
                <div className="flex items-center gap-4 w-full">
                    {/* Alignment for Text Objects moved here for balance */}
                    {isTextObject && !isMultiple && (
                        <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-xl border border-slate-700 p-1">
                            <button onClick={() => handleAlignChange('left')} disabled={isLocked} className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${textAlign === 'left' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}><AlignLeft className="w-4 h-4" /></button>
                            <button onClick={() => handleAlignChange('center')} disabled={isLocked} className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${textAlign === 'center' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}><AlignCenter className="w-4 h-4" /></button>
                            <button onClick={() => handleAlignChange('right')} disabled={isLocked} className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${textAlign === 'right' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700'}`}><AlignRight className="w-4 h-4" /></button>
                        </div>
                    )}

                    <div className="flex items-center gap-3 px-1.5 py-1 bg-slate-800/80 rounded-xl border border-slate-700">
                        <div className="flex items-center gap-2 ml-1">
                            <Layers className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight hidden xl:inline">Position</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => handleLayerAction('front')} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="To Front"><ArrowUpToLine className="w-4 h-4" /></button>
                            <button onClick={() => handleLayerAction('forward')} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Forward"><ArrowUp className="w-4 h-4" /></button>
                            <button onClick={() => handleLayerAction('backward')} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="Backward"><ArrowDown className="w-4 h-4" /></button>
                            <button onClick={() => handleLayerAction('back')} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-all" title="To Back"><ArrowDownToLine className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="flex-1 min-w-[20px]" />

                    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-1 flex items-center gap-1">
                        <button onClick={() => onAction?.('markAsBackground')} className="h-8 px-3 text-[10px] font-bold text-slate-300 hover:bg-indigo-600 hover:text-white rounded-lg transition-all flex items-center gap-2 uppercase tracking-tight"><Layout className="w-3.5 h-3.5" /> Set BG</button>
                        <button onClick={() => onAction?.('download-selection')} className="h-8 px-3 text-[10px] font-bold text-slate-300 hover:bg-indigo-600 hover:text-white rounded-lg transition-all flex items-center gap-2 uppercase tracking-tight"><DownloadIcon className="w-3.5 h-3.5" /> Export</button>

                        <div className="w-px h-5 bg-slate-700 mx-1" />

                        <button onClick={onLockToggle} className={`w-9 h-8 flex items-center justify-center rounded-lg transition-all ${isLocked ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-700 hover:text-amber-400'}`}>{isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}</button>
                        <button onClick={onDuplicate} disabled={isLocked} className="w-9 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-indigo-400 transition-all shadow-sm"><DuplicateIcon className="w-4 h-4" /></button>
                        <button onClick={onDelete} disabled={isLocked} className="w-9 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/20 hover:text-rose-500 transition-all font-bold"><Trash className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
