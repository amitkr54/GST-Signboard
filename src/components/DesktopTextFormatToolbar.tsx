import { fabric } from 'fabric';
import React from 'react';
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
    Trash2,
    Layers,
    Type,
    Group as GroupIcon,
    Ungroup as UngroupIcon
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
    fontOptions
}: DesktopTextFormatToolbarProps) {
    return (
        <div
            className="z-20 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 px-3 py-1.5 flex items-center gap-4 overflow-x-auto shrink-0 transition-all duration-300"
            style={{
                maxWidth: 'calc(100% - 2rem)',
                width: 'fit-content'
            }}
        >
            {/* Drag Handle */}
            <div
                className="cursor-move p-1 -ml-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600 shrink-0"
                onMouseDown={onDragStart}
            >
                <GripVertical className="w-4 h-4" />
            </div>

            {/* Font Family - Text only */}
            {isTextObject && (
                <div className="relative group shrink-0">
                    <select
                        value={fontFamily}
                        onChange={handleFontFamilyChange}
                        disabled={isLocked}
                        className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
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
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={() => handleFontSizeChange(Math.max(8, fontSize - 1))}
                        disabled={isLocked || fontSize <= 8}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white hover:border-indigo-300 transition-all disabled:opacity-30"
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
                        className="w-12 text-center py-1.5 bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none"
                    />
                    <button
                        onClick={() => handleFontSizeChange(Math.min(300, fontSize + 1))}
                        disabled={isLocked || fontSize >= 300}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white hover:border-indigo-300 transition-all disabled:opacity-30"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            )}

            {isTextObject && <div className="w-px h-6 bg-slate-200" />}

            {/* Formatting Group */}
            {isTextObject && (
                <div className="flex gap-1 p-0.5 bg-slate-50 rounded-lg border border-slate-200 shrink-0">
                    <button
                        onClick={toggleBold}
                        disabled={isLocked}
                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${isBold ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                            } font-black text-xs disabled:opacity-50`}
                        title="Bold"
                    >
                        B
                    </button>
                    <button
                        onClick={toggleItalic}
                        disabled={isLocked}
                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${isItalic ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                            } italic font-black text-xs disabled:opacity-50`}
                        title="Italic"
                    >
                        I
                    </button>
                    <div className="w-px h-4 bg-slate-200 my-auto mx-0.5" />
                    <button
                        onClick={() => handleAlignChange('left')}
                        disabled={isLocked}
                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${textAlign === 'left' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                            } disabled:opacity-50`}
                        title="Align Left"
                    >
                        <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => handleAlignChange('center')}
                        disabled={isLocked}
                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${textAlign === 'center' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                            } disabled:opacity-50`}
                        title="Align Center"
                    >
                        <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => handleAlignChange('right')}
                        disabled={isLocked}
                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${textAlign === 'right' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                            } disabled:opacity-50`}
                        title="Align Right"
                    >
                        <AlignRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => handleAlignChange('justify')}
                        disabled={isLocked}
                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${textAlign === 'justify' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm'
                            } disabled:opacity-50`}
                        title="Justify"
                    >
                        <AlignJustify className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {(isMultiple || isGroup) && (
                <div className="flex gap-1 p-0.5 bg-slate-50 rounded-lg border border-slate-200 shrink-0">
                    {isMultiple && (
                        <button
                            onClick={() => onAction?.('group')}
                            className="h-7 px-3 flex items-center gap-2 rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all font-bold text-[10px] uppercase"
                            title="Group Objects"
                        >
                            <GroupIcon className="w-3.5 h-3.5" />
                            Group
                        </button>
                    )}
                    {isGroup && (
                        <button
                            onClick={() => onAction?.('ungroup')}
                            className="h-7 px-3 flex items-center gap-2 rounded-md bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 transition-all font-bold text-[10px] uppercase"
                            title="Ungroup"
                        >
                            <UngroupIcon className="w-3.5 h-3.5" />
                            Ungroup
                        </button>
                    )}
                </div>
            )}

            <div className="w-px h-6 bg-slate-200" />

            {/* Quick Alignment (for objects) */}
            {(isMultiple || selectedObject) && !isTextObject && (
                <div className="flex gap-1 shrink-0">
                    <button onClick={() => onAction?.('align-left')} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-all" title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onAction?.('align-center')} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-all" title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onAction?.('align-right')} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-all" title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
                    <div className="w-px h-4 bg-slate-200 my-auto mx-1" />
                    <button onClick={() => onAction?.('align-top')} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-all" title="Align Top"><ArrowUpToLine className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onAction?.('align-middle')} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-all" title="Align Middle"><Layers className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onAction?.('align-bottom')} className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition-all" title="Align Bottom"><ArrowDownToLine className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {/* Position Menu */}
            <div className="relative shrink-0">
                <button
                    onClick={() => setShowPositionMenu(!showPositionMenu)}
                    disabled={isLocked}
                    className={`h-7 flex items-center gap-1.5 px-3 rounded-lg transition-all font-bold text-[10px] uppercase tracking-wider ${showPositionMenu ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300 border border-slate-200'
                        } disabled:opacity-50`}
                    title="Position"
                >
                    <LayoutGrid className="w-3 h-3" />
                    Position
                </button>

                {showPositionMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-150 z-[1001]">
                        <div className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Align to Card</div>
                        <div className="grid grid-cols-2 gap-1 px-1">
                            {[
                                { label: 'Left', action: 'align-card-left', icon: AlignLeft },
                                { label: 'Center', action: 'align-card-center', icon: AlignCenter },
                                { label: 'Right', action: 'align-card-right', icon: AlignRight },
                                { label: 'Top', action: 'align-card-top', icon: ArrowUpToLine },
                                { label: 'Middle', action: 'align-card-middle', icon: Layers },
                                { label: 'Bottom', action: 'align-card-bottom', icon: ArrowDownToLine }
                            ].map(item => (
                                <button
                                    key={item.label}
                                    onClick={() => {
                                        onAction?.(item.action);
                                        setShowPositionMenu(false);
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors text-xs font-bold"
                                >
                                    <item.icon className="w-3.5 h-3.5 opacity-60" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="w-px h-6 bg-slate-200" />

            {/* Color */}
            <div className="flex items-center gap-2 shrink-0">
                <input
                    type="color"
                    value={textColor}
                    onChange={handleColorChange}
                    disabled={isLocked}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-slate-50 border border-slate-200 p-0.5 shadow-sm hover:border-indigo-300 transition-all disabled:opacity-50"
                    title="Color"
                />
            </div>

            <div className="w-px h-6 bg-slate-200" />

            {/* Layers */}
            <div className="flex gap-1 p-0.5 bg-slate-50 rounded-lg border border-slate-200 shrink-0">
                <button
                    onClick={() => handleLayerAction('front')}
                    disabled={isLocked}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                    title="Bring to Front"
                >
                    <ArrowUpToLine className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => handleLayerAction('forward')}
                    disabled={isLocked}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                    title="Bring Forward"
                >
                    <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => handleLayerAction('backward')}
                    disabled={isLocked}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                    title="Send Backward"
                >
                    <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => handleLayerAction('back')}
                    disabled={isLocked}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
                    title="Send to Back"
                >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="w-px h-6 bg-slate-200" />

            {/* Actions Group */}
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={onLockToggle}
                    className={`h-7 flex items-center gap-1.5 px-3 rounded-lg transition-all font-bold text-[10px] uppercase tracking-wider ${isLocked ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300 border border-slate-200'
                        }`}
                    title={isLocked ? "Unlock" : "Lock"}
                >
                    {isLocked ? (
                        <Unlock className="w-3 h-3" />
                    ) : (
                        <Lock className="w-3 h-3" />
                    )}
                    {isLocked ? 'Unlock' : 'Lock'}
                </button>

                <div className="flex gap-1 p-0.5 bg-slate-50 rounded-lg border border-slate-200">
                    <button
                        onClick={onDuplicate}
                        disabled={isLocked}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-indigo-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Duplicate"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={isLocked}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
