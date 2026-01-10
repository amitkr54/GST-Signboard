import { fabric } from 'fabric';
import React, { useState, useEffect } from 'react';
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
    Italic,
    Layers,
    ArrowUp,
    ArrowDown,
    ArrowUpToLine,
    ArrowDownToLine,
    Lock,
    Unlock,
    GripVertical,
    Minus,
    Plus
} from 'lucide-react';

interface TextFormatToolbarProps {
    selectedObject: fabric.Object | null;
    onUpdate: () => void;
    onFontSizeChange?: (fontSize: number) => void;
    onFontFamilyChange?: (fontFamily: string) => void;
    onColorChange?: (color: string) => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onLockToggle?: () => void;
    compact?: boolean;
    isLandscape?: boolean;
    onDragStart?: (e: React.MouseEvent) => void;
}

export function TextFormatToolbar({
    selectedObject,
    onUpdate,
    onFontSizeChange,
    onFontFamilyChange,
    onColorChange,
    onDuplicate,
    onDelete,
    onLockToggle,
    compact = false,
    isLandscape = false,
    onDragStart
}: TextFormatToolbarProps) {
    const [fontFamily, setFontFamily] = useState('Arial');
    const [fontSize, setFontSize] = useState(30);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [textColor, setTextColor] = useState('#000000');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
    const [isLocked, setIsLocked] = useState(false);

    // Mobile Toolbar State
    const [activeTool, setActiveTool] = useState<null | 'font' | 'size' | 'color' | 'format' | 'layers'>(null);

    // Check if selected object is a text object
    const isTextObject = selectedObject && (
        selectedObject.type === 'i-text' ||
        selectedObject.type === 'textbox' ||
        selectedObject.type === 'text'
    );
    const textObject = isTextObject ? selectedObject as fabric.IText : null;

    useEffect(() => {
        if (!selectedObject) return;

        // Set lock state for any object
        setIsLocked(!!selectedObject.lockMovementX);

        // Set text-specific properties only for text objects
        if (textObject) {
            setFontFamily(textObject.fontFamily || 'Arial');
            setFontSize(textObject.fontSize || 30);
            setIsBold(textObject.fontWeight === 'bold');
            setIsItalic(textObject.fontStyle === 'italic');
            setTextColor(textObject.fill as string || '#000000');
            setTextAlign(textObject.textAlign as any || 'center');
        } else {
            // For non-text objects, get fill/stroke color
            setTextColor((selectedObject.fill as string) || (selectedObject.stroke as string) || '#000000');
        }
    }, [selectedObject, textObject]);

    if (!selectedObject) return null;

    const robustAutoFit = (obj: fabric.Object) => {
        if (!obj || (obj.type !== 'textbox' && obj.type !== 'i-text' && obj.type !== 'text')) return;
        const tObj = obj as any;

        // For Textbox, we need to force width recalculation
        if (obj.type === 'textbox') {
            const oldWidth = tObj.width;
            tObj.set('width', 10000); // Temporary large width to prevent wrapping
            tObj.initDimensions();

            let maxWidth = 0;
            const lines = tObj._textLines || [];
            if (lines.length > 0) {
                for (let i = 0; i < lines.length; i++) {
                    maxWidth = Math.max(maxWidth, tObj.getLineWidth(i));
                }
                tObj.set('width', maxWidth + 1);
            } else {
                tObj.set('width', oldWidth); // Fallback
            }
        }

        tObj.setCoords();
        if (tObj.canvas) tObj.canvas.requestRenderAll();
    };

    const updateProperty = (property: string, value: any) => {
        if (isLocked) return;

        const isText = selectedObject.type?.includes('text') || selectedObject.type === 'textbox';

        const canStylePartially = ['fontWeight', 'fontStyle'].includes(property);

        // Handle character-level styling if in editing mode and property allows
        if (isText && (selectedObject as any).isEditing && canStylePartially) {
            (selectedObject as any).setSelectionStyles({ [property]: value });
        } else {
            selectedObject.set(property as any, value);
        }

        if (isText && ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle'].includes(property)) {
            // 1. Immediate Fit
            robustAutoFit(selectedObject);

            // 2. Delayed Fits (to catch font rendering delays)
            setTimeout(() => robustAutoFit(selectedObject), 50);
            setTimeout(() => robustAutoFit(selectedObject), 250);

            // 3. Font-Ready Fit (the most reliable)
            if (property === 'fontFamily' && (window as any).document?.fonts) {
                const fontStr = `${(selectedObject as any).get('fontWeight') || 'normal'} ${(selectedObject as any).get('fontSize')}px "${value}"`;
                (document as any).fonts.load(fontStr).then(() => {
                    robustAutoFit(selectedObject);
                }).catch(() => { });
            }
        }

        selectedObject.setCoords();
        onUpdate();
    };

    const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement> | string) => {
        if (isLocked) return;
        const newFont = typeof e === 'string' ? e : e.target.value;
        setFontFamily(newFont);
        updateProperty('fontFamily', newFont);
        if (onFontFamilyChange) onFontFamilyChange(newFont);
    };

    const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement> | number) => {
        if (isLocked) return;
        const newSize = typeof e === 'number' ? e : parseInt(e.target.value);
        setFontSize(newSize);
        updateProperty('fontSize', newSize);

        // Notify parent if this is the company name text
        if (onFontSizeChange) {
            onFontSizeChange(newSize);
        }
    };

    const toggleBold = () => {
        if (isLocked) return;
        const newBold = !isBold;
        setIsBold(newBold);
        updateProperty('fontWeight', newBold ? 'bold' : 'normal');
    };

    const toggleItalic = () => {
        if (isLocked) return;
        const newItalic = !isItalic;
        setIsItalic(newItalic);
        updateProperty('fontStyle', newItalic ? 'italic' : 'normal');
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
        if (isLocked) return;
        const newColor = typeof e === 'string' ? e : e.target.value;
        setTextColor(newColor);
        if (onColorChange) onColorChange(newColor);

        if (isTextObject) {
            updateProperty('fill', newColor);
        } else {
            // For non-text objects (Shapes, Icons, SVG Paths)
            const obj = selectedObject;

            // If it has a fill, update it (unless it's explicitly transparent/none)
            if (obj.fill && obj.fill !== 'transparent' && obj.fill !== 'none') {
                updateProperty('fill', newColor);
            }

            // If it has a stroke, update it
            if (obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== 'none') {
                updateProperty('stroke', newColor);
            }

            // Fallback for paths that might not have fill/stroke set but are visible
            if (obj.type === 'path' && (!obj.fill || obj.fill === 'transparent') && (!obj.stroke || obj.stroke === 'transparent')) {
                updateProperty('fill', newColor);
            }

            // Handle groups recursively if needed (though Fabric usually handles group.set)
            if (obj.type === 'group') {
                (obj as fabric.Group).getObjects().forEach(child => {
                    child.set({ fill: newColor, stroke: newColor });
                });
            }
        }
    };

    const handleAlignChange = (align: 'left' | 'center' | 'right') => {
        if (isLocked) return;
        setTextAlign(align);
        updateProperty('textAlign', align);
    };

    const handleLayerAction = (action: 'front' | 'back' | 'forward' | 'backward') => {
        if (!selectedObject || isLocked) return;
        const canvas = selectedObject.canvas;
        if (!canvas) return;

        switch (action) {
            case 'front':
                selectedObject.bringToFront();
                break;
            case 'back':
                // Send back but keep above background
                const objects = canvas.getObjects();
                const backgroundIndex = objects.findIndex(obj => obj.name === 'background');
                if (backgroundIndex !== -1) {
                    selectedObject.moveTo(backgroundIndex + 1);
                } else {
                    selectedObject.sendToBack();
                }
                break;
            case 'forward':
                selectedObject.bringForward();
                break;
            case 'backward':
                // Don't go below background
                const currentIdx = canvas.getObjects().indexOf(selectedObject);
                const bgIdx = canvas.getObjects().findIndex(obj => obj.name === 'background');
                if (currentIdx > bgIdx + 1) {
                    selectedObject.sendBackwards();
                }
                break;
        }
        canvas.requestRenderAll();
        onUpdate();
    };

    const fontOptions = [
        "Arial", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Raleway",
        "PT Sans", "Merriweather", "Nunito", "Playfair Display", "Poppins",
        "Source Sans Pro", "Ubuntu", "Roboto Slab", "Lora", "Pacifico",
        "Dancing Script", "Bebas Neue", "Lobster", "Abril Fatface",
        "Times New Roman", "Courier New", "Georgia", "Verdana",
        "Comic Sans MS", "Impact"
    ];

    // --- Mobile Toolbar Render ---
    if (compact) {
        if (typeof document === 'undefined') return null;

        const sidebarClasses = isLandscape
            ? `fixed top-0 bottom-0 right-0 w-[56px] bg-slate-900/95 backdrop-blur-xl z-[9999] shadow-[-10px_0_30px_rgba(0,0,0,0.5)] border-l border-white/10 flex flex-col pt-safe pb-safe rounded-l-3xl duration-300 transition-transform ${activeTool ? 'translate-x-full' : 'translate-x-0'}`
            : "fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl z-[9999] rounded-t-3xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-bottom-4 duration-300 pb-safe";

        const contentClasses = isLandscape
            ? "flex-1 p-1 flex flex-col gap-3 overflow-y-auto overflow-x-hidden no-scrollbar items-center py-4"
            : "p-3 overflow-x-auto";

        const menuWrapperClasses = "flex items-center gap-5 min-w-max px-2";
        const verticalMenuClasses = "flex flex-col items-center gap-5 py-4 w-full";

        return ReactDOM.createPortal(
            <div className={sidebarClasses}>
                {/* Header - Compact */}
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

                {/* Content Area */}
                <div className={contentClasses}>
                    {activeTool === null ? (
                        // Main Menu
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

                            <button onClick={() => setActiveTool('layers')} className="flex flex-col items-center gap-1 group">
                                <div className="w-11 h-11 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center group-hover:bg-indigo-600/20 group-hover:border-indigo-500/50 transition-all shadow-lg">
                                    <Layers className="w-5 h-5 text-slate-300 group-hover:text-indigo-400" />
                                </div>
                                {!isLandscape && <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Layers</span>}
                            </button>

                            <div className={isLandscape ? "w-10 h-px bg-white/5 my-2" : "w-px h-8 bg-white/5 mx-2"} />

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
                    ) : (
                        // Sub Menus
                        <div className={`${isLandscape ? 'fixed right-0 top-0 bottom-0 w-48 overflow-hidden flex flex-col rounded-l-3xl shadow-2xl' : 'w-full'} bg-slate-900 shadow-2xl p-2 border-l border-white/10 animate-in fade-in slide-in-from-right-10 duration-300`}>
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

                                <div className="flex flex-col gap-6 p-2">
                                    <div className={`grid gap-3 ${isLandscape ? 'grid-cols-4' : 'grid-cols-6'} py-2`}>
                                        {/* Preset Colors */}
                                        {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'].map(color => (
                                            <button
                                                key={color}
                                                onClick={() => handleColorChange(color)}
                                                className={`aspect-square rounded-full border-2 transition-all ${textColor === color ? 'border-indigo-500 scale-110 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <div className={`flex flex-col gap-3 py-4 border-t border-white/5 ${isLandscape ? '' : ''}`}>
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

                                {activeTool === 'format' && (
                                    <div className={`flex gap-3 py-4 px-2 ${isLandscape ? 'flex-col items-center' : 'justify-center overflow-x-auto'}`}>
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
                                    </div>
                                )}
                                {activeTool === 'layers' && (
                                    <div className={`grid grid-cols-2 gap-4 py-4 px-2 ${isLandscape ? 'grid-cols-1' : ''}`}>
                                        <button
                                            onClick={() => handleLayerAction('front')}
                                            className="h-16 flex items-center gap-4 px-4 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-lg active:scale-95"
                                            title="Bring to Front"
                                        >
                                            <div className="p-2 bg-indigo-500/20 rounded-lg"><ArrowUpToLine className="w-5 h-5 text-indigo-400" /></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">To Front</span>
                                        </button>
                                        <button
                                            onClick={() => handleLayerAction('forward')}
                                            className="h-16 flex items-center gap-4 px-4 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-lg active:scale-95"
                                            title="Bring Forward"
                                        >
                                            <div className="p-2 bg-indigo-500/20 rounded-lg"><ArrowUp className="w-5 h-5 text-indigo-400" /></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Forward</span>
                                        </button>
                                        <button
                                            onClick={() => handleLayerAction('backward')}
                                            className="h-16 flex items-center gap-4 px-4 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-lg active:scale-95"
                                            title="Send Backward"
                                        >
                                            <div className="p-2 bg-slate-900 rounded-lg"><ArrowDown className="w-5 h-5 text-slate-500" /></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">Backward</span>
                                        </button>
                                        <button
                                            onClick={() => handleLayerAction('back')}
                                            className="h-16 flex items-center gap-4 px-4 rounded-2xl bg-slate-800/50 border border-white/5 text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-lg active:scale-95"
                                            title="Send to Back"
                                        >
                                            <div className="p-2 bg-slate-900 rounded-lg"><ArrowDownToLine className="w-5 h-5 text-slate-500" /></div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">To Back</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>,
            document.body
        );
    }

    // --- Desktop Toolbar Render (Existing) ---
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
                        onChange={handleFontSizeChange}
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
                </div>
            )}

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
                    onClick={() => {
                        if (onLockToggle) {
                            onLockToggle();
                            setIsLocked(!isLocked);
                        }
                    }}
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
