import { fabric } from 'fabric';
import React from 'react';
import { FontVariantSupport } from '@/lib/font-utils';
import {
    GripVertical,
    Minus,
    Plus,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    LayoutGrid,
    ArrowUp,
    ArrowDown,
    ArrowUpToLine,
    ArrowDownToLine,
    Unlock,
    Lock,
    Copy,
    Clipboard,
    Paintbrush,
    Trash2,
    Layers,
    Type,
    Group as GroupIcon,
    Ungroup as UngroupIcon,
    MoreHorizontal,
    MoreVertical,
    Download,
    Layout
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
        <div className="flex flex-col gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-sm shrink-0">
            {/* Row 1: Typography, Formatting, Alignment & Color */}
            <div className="flex items-center gap-2 px-1 h-8">
                {/* Font Family - Text only */}
                {isTextObject && (
                    <div className="relative group shrink-0">
                        <select
                            value={fontFamily}
                            onChange={handleFontFamilyChange}
                            disabled={isLocked}
                            className="appearance-none pl-2.5 pr-7 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 min-w-[130px]"
                        >
                            {fontOptions.map(font => (
                                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                )}

                {/* Font Size - Text only */}
                {isTextObject && (
                    <div className="flex items-center gap-0.5 shrink-0 bg-white border border-slate-200 rounded-lg px-1">
                        <button
                            onClick={() => handleFontSizeChange(Math.max(8, fontSize - 1))}
                            disabled={isLocked || fontSize <= 8}
                            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <input
                            type="number"
                            value={fontSize}
                            onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 0)}
                            disabled={isLocked}
                            min="8"
                            max="300"
                            className="w-9 text-center py-1 bg-transparent border-none text-[11px] font-bold text-slate-700 focus:outline-none"
                        />
                        <button
                            onClick={() => handleFontSizeChange(Math.min(300, fontSize + 1))}
                            disabled={isLocked || fontSize >= 300}
                            className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {isTextObject && <div className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />}

                {/* Formatting & Alignment Group */}
                {isTextObject && (
                    <div className="flex gap-0.5 p-0.5 bg-white rounded-lg border border-slate-200 shrink-0">
                        <button
                            onClick={toggleBold}
                            disabled={isLocked || (supportedVariants && !supportedVariants.bold)}
                            className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${isBold ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                } font-black text-[10px] disabled:opacity-30 disabled:cursor-not-allowed`}
                            title={supportedVariants?.bold === false ? "Bold not available for this font" : "Bold"}
                        >
                            B
                        </button>
                        <button
                            onClick={toggleItalic}
                            disabled={isLocked || (supportedVariants && !supportedVariants.italic)}
                            className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${isItalic ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                } italic font-black text-[10px] disabled:opacity-30 disabled:cursor-not-allowed`}
                            title={supportedVariants?.italic === false ? "Italic not available for this font" : "Italic"}
                        >
                            I
                        </button>
                        <div className="w-px h-4 bg-slate-200 my-auto mx-0.5" />
                        <button
                            onClick={() => handleAlignChange('left')}
                            disabled={isLocked}
                            className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${textAlign === 'left' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                } disabled:opacity-50`}
                            title="Align Left"
                        >
                            <AlignLeft className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => handleAlignChange('center')}
                            disabled={isLocked}
                            className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${textAlign === 'center' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                } disabled:opacity-50`}
                            title="Align Center"
                        >
                            <AlignCenter className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => handleAlignChange('right')}
                            disabled={isLocked}
                            className={`w-6 h-6 flex items-center justify-center rounded-md transition-all ${textAlign === 'right' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                } disabled:opacity-50`}
                            title="Align Right"
                        >
                            <AlignRight className="w-3 h-3" />
                        </button>
                    </div>
                )}

                {/* Color */}
                <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Color</span>
                    <input
                        type="color"
                        value={textColor}
                        onChange={handleColorChange}
                        disabled={isLocked}
                        className="w-7 h-7 rounded-lg cursor-pointer bg-white border border-slate-200 p-0.5 shadow-sm hover:border-indigo-300 transition-all disabled:opacity-50"
                        title="Color"
                    />
                </div>

                <div className="w-px h-5 bg-slate-200 shrink-0 mx-0.5" />

                {/* Clipboard Group */}
                <div className="flex items-center gap-1 shrink-0 px-1 bg-white border border-slate-200 rounded-lg">
                    <button onClick={() => onAction?.('copy')} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all" title="Copy (Ctrl+C)"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onAction?.('copy-style')} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all" title="Copy Style (Ctrl+Alt+C)"><Paintbrush className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onAction?.('paste')} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all" title="Paste (Ctrl+V)"><Clipboard className="w-3.5 h-3.5" /></button>
                    <div className="w-px h-3.5 bg-slate-200" />
                    <button onClick={() => onAction?.('paste-style')} className="h-6 px-1.5 flex items-center gap-1.5 rounded-md text-[9px] font-bold text-slate-500 hover:bg-slate-50 hover:text-indigo-600 uppercase tracking-tighter" title="Paste Style">Paste Style</button>
                </div>
            </div>

            {/* Row 2: Position, Layers & Actions */}
            <div className="flex items-center gap-3 px-1 h-8">
                {/* Position Group */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-1">Arrange</span>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                        <button
                            onClick={() => setShowPositionMenu(!showPositionMenu)}
                            disabled={isLocked}
                            className={`h-6 flex items-center gap-1 px-2 rounded-md transition-all font-bold text-[9px] uppercase tracking-wider ${showPositionMenu ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
                                } disabled:opacity-50`}
                            title="Positioning"
                        >
                            <LayoutGrid className="w-3 h-3" />
                            Position
                        </button>

                        <div className="w-px h-3.5 bg-slate-200 shrink-0 mx-0.5" />

                        {/* Quick Alignment (for objects) */}
                        {(isMultiple || selectedObject) && !isTextObject && (
                            <>
                                <button onClick={() => onAction?.('align-left')} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 transition-all" title="Align Left"><AlignLeft className="w-3 h-3" /></button>
                                <button onClick={() => onAction?.('align-center')} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 transition-all" title="Align Center"><AlignCenter className="w-3 h-3" /></button>
                                <button onClick={() => onAction?.('align-right')} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 transition-all" title="Align Right"><AlignRight className="w-3 h-3" /></button>
                                <div className="w-px h-3.5 bg-slate-200 shrink-0 mx-0.5" />
                                <button onClick={() => onAction?.('align-top')} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 transition-all" title="Align Top"><ArrowUpToLine className="w-3 h-3" /></button>
                                <button onClick={() => onAction?.('align-middle')} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 transition-all" title="Align Middle"><Layers className="w-3 h-3" /></button>
                                <button onClick={() => onAction?.('align-bottom')} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 transition-all" title="Align Bottom"><ArrowDownToLine className="w-3 h-3" /></button>
                            </>
                        )}
                    </div>
                </div>

                {/* Layers Group */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Layers</span>
                    <div className="flex gap-0.5 p-0.5 bg-white rounded-lg border border-slate-200 shrink-0">
                        <button onClick={() => handleLayerAction('front')} disabled={isLocked} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-50" title="Bring to Front"><ArrowUpToLine className="w-3 h-3" /></button>
                        <button onClick={() => handleLayerAction('forward')} disabled={isLocked} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-50" title="Bring Forward"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => handleLayerAction('backward')} disabled={isLocked} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-50" title="Send Backward"><ArrowDown className="w-3 h-3" /></button>
                        <button onClick={() => handleLayerAction('back')} disabled={isLocked} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-50" title="Send to Back"><ArrowDownToLine className="w-3 h-3" /></button>
                    </div>
                </div>

                {/* Distribution Group (Multi-select) */}
                {isMultiple && (
                    <div className="flex items-center gap-1.5 shrink-0 border-l border-slate-200 pl-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Space</span>
                        <div className="flex gap-0.5 p-0.5 bg-white rounded-lg border border-slate-200 shrink-0">
                            <button onClick={() => onAction?.('distribute-h')} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50" title="Space Evenly Horizontal"><MoreHorizontal className="w-3 h-3" /></button>
                            <button onClick={() => onAction?.('distribute-v')} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50" title="Space Evenly Vertical"><MoreVertical className="w-3 h-3 rotate-90" /></button>
                        </div>
                    </div>
                )}

                {/* Grouping Actions */}
                {(isMultiple || isGroup) && (
                    <div className="flex gap-1 p-0.5 bg-white rounded-lg border border-slate-200 shrink-0">
                        <button
                            onClick={() => onAction?.(isMultiple ? 'group' : 'ungroup')}
                            className="h-6 px-2 flex items-center gap-1 rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all font-bold text-[9px] uppercase tracking-wide"
                        >
                            {isMultiple ? <GroupIcon className="w-3 h-3" /> : <UngroupIcon className="w-3 h-3" />}
                            {isMultiple ? 'Group' : 'Ungroup'}
                        </button>
                    </div>
                )}

                {/* Actions Group */}
                <div className="flex items-center gap-2 shrink-0 ml-auto mr-1">
                    <div className="flex gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200">
                        <button
                            onClick={() => onAction?.('markAsBackground')}
                            disabled={isLocked}
                            className="h-6 px-1.5 flex items-center gap-1 rounded-md text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all font-bold text-[9px] uppercase tracking-wide"
                            title="Set as background"
                        >
                            <Layout className="w-3 h-3" />
                            To BG
                        </button>
                        <div className="w-px h-3.5 bg-slate-200 my-auto" />
                        <button
                            onClick={() => onAction?.('download-selection')}
                            className="h-6 px-1.5 flex items-center gap-1 rounded-md text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all font-bold text-[9px] uppercase tracking-wide"
                            title="Download selection"
                        >
                            <Download className="w-3 h-3" />
                            SVG
                        </button>
                    </div>

                    <button
                        onClick={onLockToggle}
                        className={`h-6.5 flex items-center gap-1 px-2.5 rounded-lg transition-all font-bold text-[9px] uppercase tracking-wider ${isLocked ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                            }`}
                    >
                        {isLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {isLocked ? 'Unlock' : 'Lock'}
                    </button>

                    <div className="flex gap-0.5 p-0.5 bg-white rounded-lg border border-slate-200 shrink-0">
                        <button onClick={onDuplicate} disabled={isLocked} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-50 disabled:opacity-50" title="Duplicate"><Copy className="w-3 h-3" /></button>
                        <button onClick={onDelete} disabled={isLocked} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-50" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
