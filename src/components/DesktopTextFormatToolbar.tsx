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
    MoreHorizontal,
    MoreVertical,
    Download,
    Layout,
    ChevronDown
} from 'lucide-react';

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
        <div className="flex flex-col gap-1 px-3 py-2 bg-white border border-slate-200 rounded-xl shadow-lg shrink-0 min-w-fit animate-in fade-in slide-in-from-top-2 duration-300">
            {/* Row 1: Typography (HIDDEN if multiple selected) */}
            {isTextObject && !isMultiple && (
                <div className="flex items-center gap-3 h-8 animate-in slide-in-from-top-1 duration-200">
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Type className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden xl:inline">Text Format</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Font Family */}
                        <div className="relative shrink-0">
                            <select
                                value={fontFamily}
                                onChange={handleFontFamilyChange}
                                disabled={isLocked}
                                className="appearance-none pl-3 pr-8 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 min-w-[150px]"
                            >
                                {fontOptions.map(font => (
                                    <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Font Size */}
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg h-7 px-0.5">
                            <button
                                onClick={() => handleFontSizeChange(Math.max(8, fontSize - 1))}
                                disabled={isLocked}
                                className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 transition-all font-black text-sm"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <input
                                type="number"
                                value={fontSize}
                                onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 0)}
                                disabled={isLocked}
                                className="w-10 text-center bg-transparent border-none text-xs font-bold text-slate-700"
                            />
                            <button
                                onClick={() => handleFontSizeChange(Math.min(300, fontSize + 1))}
                                disabled={isLocked}
                                className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 transition-all font-black text-sm"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <div className="w-px h-4 bg-slate-200 mx-1" />

                    {/* Styles */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleBold}
                            disabled={isLocked || (supportedVariants && !supportedVariants.bold)}
                            className={`w-7 h-7 flex items-center justify-center rounded-md font-black text-xs transition-all ${isBold ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            title="Bold"
                        >B</button>
                        <button
                            onClick={toggleItalic}
                            disabled={isLocked || (supportedVariants && !supportedVariants.italic)}
                            className={`w-7 h-7 flex items-center justify-center rounded-md italic font-black text-xs transition-all ${isItalic ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            title="Italic"
                        >I</button>
                    </div>

                    <div className="w-px h-4 bg-slate-200 mx-1" />

                    {/* Text Alignment */}
                    <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-200">
                        <button onClick={() => handleAlignChange('left')} disabled={isLocked} className={`w-7 h-6 flex items-center justify-center rounded ${textAlign === 'left' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Text Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleAlignChange('center')} disabled={isLocked} className={`w-7 h-6 flex items-center justify-center rounded ${textAlign === 'center' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Text Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleAlignChange('right')} disabled={isLocked} className={`w-7 h-6 flex items-center justify-center rounded ${textAlign === 'right' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Text Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <div
                            className="w-7 h-7 rounded-lg border-2 border-slate-100 shadow-sm relative cursor-pointer"
                            style={{ backgroundColor: textColor }}
                        >
                            <input
                                type="color"
                                value={textColor}
                                onChange={handleColorChange}
                                disabled={isLocked}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Row 2: Layout & Object Actions (Primary row for selection/multiples) */}
            <div className={`flex items-center gap-3 ${isTextObject && !isMultiple ? 'pt-1.5 border-t border-slate-100' : ''} h-8`}>
                {/* Layers Group */}
                <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 bg-slate-50 rounded-lg border border-slate-200">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <div className="flex items-center gap-0.5">
                        <button onClick={() => handleLayerAction('front')} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-indigo-600 transition-all" title="To Front"><ArrowUpToLine className="w-3 h-3" /></button>
                        <button onClick={() => handleLayerAction('forward')} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-indigo-600 transition-all" title="Forward"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => handleLayerAction('backward')} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-indigo-600 transition-all" title="Backward"><ArrowDown className="w-3 h-3" /></button>
                        <button onClick={() => handleLayerAction('back')} className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-indigo-600 transition-all" title="To Back"><ArrowDownToLine className="w-3 h-3" /></button>
                    </div>
                </div>

                <div className="w-px h-4 bg-slate-200" />

                {/* Align elements Group (Matches Context Menu) */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight hidden xl:inline">Align elements</span>
                    <div className="flex items-center gap-0.5 bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                        <button onClick={() => onAction?.('align-left')} className="w-7 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 transition-all" title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onAction?.('align-center')} className="w-7 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 transition-all" title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onAction?.('align-right')} className="w-7 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 transition-all" title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
                        <div className="w-px h-3 bg-slate-200 mx-0.5" />
                        <button onClick={() => onAction?.('align-top')} className="w-7 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 transition-all" title="Align Top"><ArrowUpToLine className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onAction?.('align-middle')} className="w-7 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 transition-all rotate-90" title="Align Middle"><AlignCenter className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onAction?.('align-bottom')} className="w-7 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 transition-all" title="Align Bottom"><ArrowDownToLine className="w-3.5 h-3.5" /></button>
                    </div>
                </div>

                {/* Space evenly (Matches Context Menu) */}
                {isMultiple && (
                    <>
                        <div className="w-px h-4 bg-slate-200 mx-1" />
                        <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight hidden xl:inline">Space evenly</span>
                            <div className="flex items-center gap-0.5 bg-slate-50 rounded-lg border border-slate-200 p-0.5">
                                <button onClick={() => onAction?.('distribute-h')} className="w-7 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 transition-all" title="Horizontal"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                                <button onClick={() => onAction?.('distribute-v')} className="w-7 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-white hover:text-indigo-600 transition-all rotate-90" title="Vertical"><MoreVertical className="w-3.5 h-3.5" /></button>
                            </div>
                        </div>
                    </>
                )}

                {/* Selection Actions (Far Right) */}
                <div className="flex items-center gap-2 ml-auto">
                    {(isMultiple || isGroup) && (
                        <button
                            onClick={() => onAction?.(isMultiple ? 'group' : 'ungroup')}
                            className="h-7 px-3 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shrink-0"
                        >
                            {isMultiple ? <GroupIcon className="w-3.5 h-3.5" /> : <UngroupIcon className="w-3.5 h-3.5" />}
                            {isMultiple ? 'Group' : 'Ungroup'}
                        </button>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-0.5 flex items-center shrink-0">
                        <button onClick={() => onAction?.('markAsBackground')} className="h-6 px-2 text-[9px] font-bold text-slate-500 hover:bg-white hover:text-indigo-600 rounded transition-all flex items-center gap-1.5 uppercase tracking-tighter" title="Set as Background"><Layout className="w-3 h-3" /> BG</button>
                        <button onClick={() => onAction?.('download-selection')} className="h-6 px-2 text-[9px] font-bold text-slate-500 hover:bg-white hover:text-indigo-600 rounded transition-all flex items-center gap-1.5 uppercase tracking-tighter" title="Export PNG"><Download className="w-3 h-3" /> PNG</button>

                        <div className="w-px h-3 bg-slate-200 mx-1" />

                        <button onClick={onLockToggle} className={`w-7 h-6 flex items-center justify-center rounded transition-all ${isLocked ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:bg-white hover:text-amber-600'}`} title={isLocked ? "Unlock" : "Lock"}>{isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}</button>
                        <button onClick={onDuplicate} disabled={isLocked} className="w-7 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-white hover:text-indigo-600 transition-all" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={onDelete} disabled={isLocked} className="w-7 h-6 flex items-center justify-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
