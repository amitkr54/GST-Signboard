import { fabric } from 'fabric';
import React from 'react';
import ReactDOM from 'react-dom';
import {
    X,
    Keyboard,
    Type,
    Bold,
    Copy,
    Trash2,
    ChevronLeft,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Layers,
    ArrowUp,
    ArrowDown,
    ArrowUpToLine,
    ArrowDownToLine,
    Italic,
    Group as GroupIcon,
    Ungroup as UngroupIcon
} from 'lucide-react';

interface MobileTextFormatToolbarProps {
    selectedObject: fabric.Object;
    isTextObject: boolean;
    textObject: fabric.IText | null;
    isMultiple: boolean;
    isGroup: boolean;
    isLandscape: boolean;
    activeTool: null | 'font' | 'size' | 'color' | 'format' | 'layers';
    setActiveTool: (tool: null | 'font' | 'size' | 'color' | 'format' | 'layers') => void;
    fontFamily: string;
    fontSize: number;
    isBold: boolean;
    isItalic: boolean;
    textColor: string;
    textAlign: string;
    handleFontFamilyChange: (font: string) => void;
    handleFontSizeChange: (size: number) => void;
    toggleBold: () => void;
    toggleItalic: () => void;
    handleAlignChange: (align: 'left' | 'center' | 'right' | 'justify') => void;
    handleColorChange: (color: string | React.ChangeEvent<HTMLInputElement>) => void;
    handleLayerAction: (action: 'front' | 'back' | 'forward' | 'backward') => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onAction?: (action: string) => void;
    fontOptions: string[];
}

export function MobileTextFormatToolbar({
    selectedObject,
    isTextObject,
    textObject,
    isMultiple,
    isGroup,
    isLandscape,
    activeTool,
    setActiveTool,
    fontFamily,
    fontSize,
    isBold,
    isItalic,
    textColor,
    textAlign,
    handleFontFamilyChange,
    handleFontSizeChange,
    toggleBold,
    toggleItalic,
    handleAlignChange,
    handleColorChange,
    handleLayerAction,
    onDuplicate,
    onDelete,
    onAction,
    fontOptions
}: MobileTextFormatToolbarProps) {
    if (typeof document === 'undefined') return null;

    const sidebarClasses = isLandscape
        ? `fixed top-0 bottom-0 right-0 w-[56px] bg-slate-900/95 backdrop-blur-xl z-[9999] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] border-l border-white/10 flex flex-col pt-safe pb-safe rounded-l-3xl duration-300 transition-transform ${activeTool ? 'translate-x-full' : 'translate-x-0'}`
        : "fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl z-[9999] rounded-t-3xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-bottom-4 duration-300 pb-safe";

    const contentClasses = isLandscape
        ? "flex-1 p-1 flex flex-col gap-3 overflow-y-auto overflow-x-hidden no-scrollbar items-center py-4"
        : "p-3 overflow-x-auto";

    const menuWrapperClasses = "flex items-center gap-5 min-w-max px-2";
    const verticalMenuClasses = "flex flex-col items-center gap-5 py-4 w-full";

    const renderHeader = () => (
        <div className={`flex justify-between items-center px-4 py-3 border-b border-white/5 ${isLandscape ? 'flex-col gap-4' : ''}`}>
            <div className={`flex items-center gap-3 ${isLandscape ? 'flex-col' : ''}`}>
                {activeTool && (
                    <button onClick={() => setActiveTool(null)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                        {isLandscape ? <ChevronLeft className="w-5 h-5 text-indigo-400 rotate-90" /> : <ChevronLeft className="w-4 h-4 text-indigo-400" />}
                    </button>
                )}
                {!isLandscape && (
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                        {activeTool ? activeTool : (isTextObject ? 'Format Text' : 'Format Element')}
                    </span>
                )}
            </div>
            <button
                onClick={() => {
                    if (selectedObject.canvas) {
                        selectedObject.canvas.discardActiveObject();
                        selectedObject.canvas.requestRenderAll();
                    }
                }}
                className="p-2 rounded-full bg-white/5 hover:bg-rose-500/20 group transition-all"
            >
                <X className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
            </button>
        </div>
    );

    const renderMainMenu = () => (
        <div className={isLandscape ? verticalMenuClasses : menuWrapperClasses}>
            {isTextObject && (
                <>
                    <button onClick={() => {
                        if (textObject && !textObject.isEditing) {
                            textObject.enterEditing();
                            textObject.canvas?.requestRenderAll();
                        }
                    }} className="flex flex-col items-center gap-1 group">
                        <div className="w-11 h-11 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 group-hover:border-indigo-500/50 transition-all shadow-lg">
                            <Keyboard className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                        </div>
                        {!isLandscape && <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Edit</span>}
                    </button>

                    <button onClick={() => setActiveTool('font')} className="flex flex-col items-center gap-1 group">
                        <div className="w-11 h-11 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 group-hover:border-indigo-500/50 transition-all shadow-lg">
                            <span className="font-serif text-base text-slate-300 group-hover:text-indigo-400">Aa</span>
                        </div>
                        {!isLandscape && <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Font</span>}
                    </button>

                    <button onClick={() => setActiveTool('size')} className="flex flex-col items-center gap-1 group">
                        <div className="w-11 h-11 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 group-hover:border-indigo-500/50 transition-all shadow-lg">
                            <Type className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                        </div>
                        {!isLandscape && <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Size</span>}
                    </button>
                </>
            )}

            <button onClick={() => setActiveTool('color')} className="flex flex-col items-center gap-1 group">
                <div className="w-11 h-11 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 group-hover:border-indigo-500/50 transition-all shadow-lg">
                    <div className="w-5 h-5 rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: textColor }}></div>
                </div>
                {!isLandscape && <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Color</span>}
            </button>

            <button onClick={() => setActiveTool('format')} className="flex flex-col items-center gap-1 group">
                <div className="w-11 h-11 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 group-hover:border-indigo-500/50 transition-all shadow-lg">
                    <AlignJustify className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                </div>
                {!isLandscape && <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Format</span>}
            </button>

            <button onClick={() => setActiveTool('layers')} className="flex flex-col items-center gap-1 group">
                <div className="w-11 h-11 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 group-hover:border-indigo-500/50 transition-all shadow-lg">
                    <Layers className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                </div>
                {!isLandscape && <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Layers</span>}
            </button>

            <div className={isLandscape ? "w-10 h-px bg-white/5 my-2" : "w-px h-8 bg-white/5 mx-2 flex-shrink-0"} />

            <button onClick={onDuplicate} className="flex flex-col items-center gap-1 group">
                <div className="w-11 h-11 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 group-hover:border-indigo-500/50 transition-all shadow-lg">
                    <Copy className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                </div>
                {!isLandscape && <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Clone</span>}
            </button>

            <button onClick={onDelete} className="flex flex-col items-center gap-1 group">
                <div className="w-11 h-11 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/30 group-hover:border-rose-500/50 transition-all shadow-lg">
                    <Trash2 className="w-5 h-5 text-rose-500" />
                </div>
                {!isLandscape && <span className="text-[9px] text-rose-500 font-black uppercase tracking-widest mt-1">Delete</span>}
            </button>
        </div>
    );

    const renderSubMenu = () => (
        <div className={`${isLandscape ? 'fixed right-0 top-0 bottom-0 w-48 overflow-hidden flex flex-col rounded-l-3xl shadow-2xl bg-slate-900 border-l border-white/10' : 'w-full'}`}>
            {isLandscape && (
                <div className="flex justify-between items-center px-4 py-4 border-b border-white/5 mb-2 flex-shrink-0">
                    <button
                        onClick={() => setActiveTool(null)}
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 mt-0.5" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Back</span>
                    </button>
                </div>
            )}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {activeTool === 'font' && (
                    <div className="flex flex-col gap-0.5">
                        {fontOptions.map(font => (
                            <button
                                key={font}
                                onClick={() => handleFontFamilyChange(font)}
                                className={`px-4 py-2 text-left rounded-xl text-xs transition-colors ${fontFamily === font ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/20' : 'text-slate-300 hover:bg-white/5'}`}
                                style={{ fontFamily: font }}
                            >
                                {font}
                            </button>
                        ))}
                    </div>
                )}

                {activeTool === 'size' && (
                    <div className={`flex items-center gap-4 py-6 px-4 ${isLandscape ? 'flex-col h-full justify-center' : ''}`}>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isLandscape ? '200px' : '8px'}</span>
                        <input
                            type="range"
                            min="8"
                            max="200"
                            value={fontSize}
                            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                            className={isLandscape
                                ? "h-48 w-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                : "flex-1 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                            }
                            style={isLandscape ? { writingMode: 'bt-lr' as any, WebkitAppearance: 'slider-vertical' } : {}}
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isLandscape ? '8px' : '200px'}</span>
                        <div className="w-14 h-10 flex items-center justify-center bg-slate-800/50 rounded-xl border border-white/10 font-black text-xs text-white shadow-inner">
                            {fontSize}
                        </div>
                    </div>
                )}

                {activeTool === 'color' && (
                    <div className="flex flex-col gap-6 p-2">
                        <div className={`grid gap-3 ${isLandscape ? 'grid-cols-4' : 'grid-cols-6'} py-2`}>
                            {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => handleColorChange(color)}
                                    className={`aspect-square rounded-full border-2 transition-all ${textColor === color ? 'border-indigo-500 scale-110 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                        <div className="flex flex-col gap-3 py-4 border-t border-white/5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Custom Color</label>
                            <div className="flex gap-3">
                                <input
                                    type="color"
                                    value={textColor}
                                    onChange={handleColorChange}
                                    className="w-12 h-12 rounded-xl cursor-pointer bg-slate-800 border-none p-1 shadow-lg"
                                />
                                <div className="flex-1 px-4 py-3 bg-slate-800/50 rounded-xl border border-white/5 text-sm font-mono text-slate-300 uppercase flex items-center">
                                    {textColor}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTool === 'format' && (
                    <div className="flex flex-col gap-4">
                        {(isTextObject || isMultiple || isGroup) && (
                            <div className={`flex gap-3 py-4 px-2 ${isLandscape ? 'flex-col items-center' : 'justify-center overflow-x-auto'}`}>
                                {isTextObject && (
                                    <>
                                        <button
                                            onClick={toggleBold}
                                            className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all ${isBold ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-800/50 border-white/5 text-slate-400 font-bold'}`}
                                        >
                                            <Bold className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={toggleItalic}
                                            className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all ${isItalic ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}
                                        >
                                            <Italic className="w-5 h-5" />
                                        </button>
                                        <div className={isLandscape ? "w-10 h-px bg-white/5 my-2" : "w-px h-10 bg-white/5 mx-2 flex-shrink-0"} />
                                        <button
                                            onClick={() => handleAlignChange('left')}
                                            className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all ${textAlign === 'left' ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}
                                        >
                                            <AlignLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleAlignChange('center')}
                                            className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all ${textAlign === 'center' ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}
                                        >
                                            <AlignCenter className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleAlignChange('right')}
                                            className={`w-12 h-12 flex items-center justify-center rounded-2xl border-2 transition-all ${textAlign === 'right' ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10' : 'bg-slate-800/50 border-white/5 text-slate-400'}`}
                                        >
                                            <AlignRight className="w-5 h-5" />
                                        </button>
                                    </>
                                )}

                                {(isMultiple || isGroup) && (
                                    <div className="flex gap-3">
                                        {isMultiple && (
                                            <button onClick={() => onAction?.('group')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg">
                                                <GroupIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        {isGroup && (
                                            <button onClick={() => onAction?.('ungroup')} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg">
                                                <UngroupIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {isMultiple && (
                            <div className="flex flex-col gap-4 px-2 py-4 border-t border-white/5">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Align relative to each other</div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { label: 'Left', action: 'align-left', icon: AlignLeft },
                                        { label: 'Center', action: 'align-center', icon: AlignCenter },
                                        { label: 'Right', action: 'align-right', icon: AlignRight },
                                        { label: 'Top', action: 'align-top', icon: ArrowUpToLine },
                                        { label: 'Middle', action: 'align-middle', icon: Layers },
                                        { label: 'Bottom', action: 'align-bottom', icon: ArrowDownToLine }
                                    ].map(item => (
                                        <button
                                            key={item.label}
                                            onClick={() => onAction?.(item.action)}
                                            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-400 hover:bg-indigo-600/20 hover:text-white transition-all"
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="text-[9px] font-bold uppercase">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-4 px-2 py-4 border-t border-white/5">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Align to Card</div>
                            <div className="grid grid-cols-3 gap-3">
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
                                        onClick={() => onAction?.(item.action)}
                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-400 hover:bg-indigo-600/20 hover:text-white transition-all"
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="text-[9px] font-bold uppercase">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTool === 'layers' && (
                    <div className={`grid grid-cols-2 gap-4 py-4 px-2 ${isLandscape ? 'grid-cols-1' : ''}`}>
                        <button
                            onClick={() => handleLayerAction('front')}
                            className="h-16 flex items-center gap-4 px-4 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            <div className="p-2 bg-indigo-500/20 rounded-lg"><ArrowUpToLine className="w-5 h-5 text-indigo-400" /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">To Front</span>
                        </button>
                        <button
                            onClick={() => handleLayerAction('forward')}
                            className="h-16 flex items-center gap-4 px-4 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            <div className="p-2 bg-indigo-500/20 rounded-lg"><ArrowUp className="w-5 h-5 text-indigo-400" /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Forward</span>
                        </button>
                        <button
                            onClick={() => handleLayerAction('backward')}
                            className="h-16 flex items-center gap-4 px-4 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            <div className="p-2 bg-slate-900 rounded-lg"><ArrowDown className="w-5 h-5 text-slate-500" /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Backward</span>
                        </button>
                        <button
                            onClick={() => handleLayerAction('back')}
                            className="h-16 flex items-center gap-4 px-4 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-lg active:scale-95"
                        >
                            <div className="p-2 bg-slate-900 rounded-lg"><ArrowDownToLine className="w-5 h-5 text-slate-500" /></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">To Back</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(
        <div className={sidebarClasses}>
            {renderHeader()}
            <div className={contentClasses}>
                {activeTool === null ? renderMainMenu() : renderSubMenu()}
            </div>
        </div>,
        document.body
    );
}
