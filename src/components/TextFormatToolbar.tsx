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
    ArrowDownToLine
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
    isLandscape = false
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
                const fontStr = `${selectedObject.get('fontWeight') || 'normal'} ${selectedObject.get('fontSize')}px "${value}"`;
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
            ? `fixed top-0 bottom-0 right-0 w-[48px] bg-white z-[9999] shadow-[-4px_0_20px_rgba(0,0,0,0.1)] flex flex-col pt-safe pb-safe rounded-l-2xl duration-200 transition-transform ${activeTool ? 'translate-x-full' : 'translate-x-0'}`
            : "fixed bottom-0 left-0 right-0 bg-white z-[9999] rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-bottom-4 duration-200 pb-safe";

        const contentClasses = isLandscape
            ? "flex-1 p-0.5 flex flex-col gap-2 overflow-y-auto overflow-x-hidden no-scrollbar items-center"
            : "p-2 overflow-x-auto";

        const menuWrapperClasses = "flex items-center gap-4 min-w-max px-1";
        const verticalMenuClasses = "flex flex-col items-center gap-4 py-2 w-full";

        return ReactDOM.createPortal(
            <div className={sidebarClasses}>
                {/* Header - Compact */}
                <div className={`flex justify-between items-center px-1 py-1 border-b border-gray-100 ${isLandscape ? 'flex-col gap-2' : ''}`}>
                    <div className={`flex items-center gap-1 ${isLandscape ? 'flex-col' : ''}`}>
                        {activeTool && (
                            <button onClick={() => setActiveTool(null)} className="p-1 rounded-full hover:bg-gray-100">
                                {isLandscape ? <ChevronLeft className="w-5 h-5 text-gray-400 rotate-90" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
                            </button>
                        )}
                        {!isLandscape && (
                            <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">
                                {activeTool ? activeTool : (isTextObject ? 'Text' : 'Element')}
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
                        className="p-1 rounded-full bg-gray-50 hover:bg-gray-100"
                    >
                        <X className="w-4 h-4 text-gray-600" />
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
                                        <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-active:bg-blue-50 group-active:border-blue-200">
                                            <Keyboard className="w-4 h-4 text-gray-700" />
                                        </div>
                                        {!isLandscape && <span className="text-[10px] text-gray-600 font-medium">Edit</span>}
                                    </button>

                                    <button onClick={() => setActiveTool('font')} className="flex flex-col items-center gap-1 group">
                                        <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-active:bg-blue-50 group-active:border-blue-200">
                                            <span className="font-serif text-sm text-gray-700">Aa</span>
                                        </div>
                                        {!isLandscape && <span className="text-[10px] text-gray-600 font-medium">Font</span>}
                                    </button>

                                    <button onClick={() => setActiveTool('size')} className="flex flex-col items-center gap-1 group">
                                        <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-active:bg-blue-50 group-active:border-blue-200">
                                            <Type className="w-4 h-4 text-gray-700" />
                                        </div>
                                        {!isLandscape && <span className="text-[10px] text-gray-600 font-medium">Size</span>}
                                    </button>
                                </>
                            )}

                            <button onClick={() => setActiveTool('color')} className="flex flex-col items-center gap-1 group">
                                <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-active:bg-blue-50 group-active:border-blue-200">
                                    <div className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: textColor }}></div>
                                </div>
                                {!isLandscape && <span className="text-[10px] text-gray-600 font-medium">Color</span>}
                            </button>

                            <button onClick={() => setActiveTool('layers')} className="flex flex-col items-center gap-1 group">
                                <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-active:bg-blue-50 group-active:border-blue-200">
                                    <Layers className="w-4 h-4 text-gray-700" />
                                </div>
                                {!isLandscape && <span className="text-[10px] text-gray-600 font-medium">Layers</span>}
                            </button>

                            <div className={isLandscape ? "w-8 h-px bg-gray-200 my-1" : "w-px h-6 bg-gray-200 mx-1"} />

                            <button onClick={onDuplicate} className="flex flex-col items-center gap-1 group">
                                <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-active:bg-blue-50 group-active:border-blue-200">
                                    <Copy className="w-4 h-4 text-gray-700" />
                                </div>
                                {!isLandscape && <span className="text-[10px] text-gray-600 font-medium">Clone</span>}
                            </button>

                            <button onClick={onDelete} className="flex flex-col items-center gap-1 group">
                                <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center group-active:bg-red-50 group-active:border-red-200">
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </div>
                                {!isLandscape && <span className="text-[10px] text-red-600 font-medium">Delete</span>}
                            </button>
                        </div>
                    ) : (
                        // Sub Menus
                        <div className={`${isLandscape ? 'fixed right-0 top-0 bottom-0 w-36 overflow-hidden flex flex-col rounded-l-2xl' : 'w-full'} bg-white shadow-2xl p-1.5 border-l border-gray-100 animate-in fade-in slide-in-from-right-4`}>
                            {isLandscape && (
                                <div className="flex justify-between items-center px-2 py-2 border-b border-gray-50 mb-1 flex-shrink-0">
                                    <button
                                        onClick={() => setActiveTool(null)}
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Back</span>
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
                                                className={`px-1.5 py-0.5 text-left rounded text-[11px] ${fontFamily === font ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                                                style={{ fontFamily: font }}
                                            >
                                                {font}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {activeTool === 'size' && (
                                    <div className={`flex items-center gap-2 py-2 px-1 ${isLandscape ? 'flex-col h-full justify-center' : ''}`}>
                                        <span className="text-[10px] text-gray-500">{isLandscape ? '200' : '8px'}</span>
                                        <input
                                            type="range"
                                            min="8"
                                            max="200"
                                            value={fontSize}
                                            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                                            className={isLandscape
                                                ? "h-32 w-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                : "flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            }
                                            style={isLandscape ? { writingMode: 'bt-lr' as any, WebkitAppearance: 'slider-vertical' } : {}}
                                        />
                                        <span className="text-[10px] text-gray-500">{isLandscape ? '8' : '200px'}</span>
                                        <div className="w-10 h-8 flex items-center justify-center bg-gray-100 rounded border border-gray-200 font-medium text-xs text-gray-700">
                                            {fontSize}
                                        </div>
                                    </div>
                                )}

                                {activeTool === 'color' && (
                                    <div className="flex flex-col gap-4">
                                        <div className={`flex gap-3 p-1 ${isLandscape ? 'flex-wrap justify-center' : 'overflow-x-auto pb-2'}`}>
                                            {/* Preset Colors */}
                                            {['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#808080', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => handleColorChange(color)}
                                                    className={`w-7 h-7 rounded-full border flex-shrink-0 ${textColor === color ? 'border-blue-500 shadow-sm scale-110' : 'border-gray-200'}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                        <div className={`flex items-center gap-2 border-t border-gray-50 pt-2 ${isLandscape ? 'flex-col' : ''}`}>
                                            <label className="text-sm font-medium text-gray-700">Custom:</label>
                                            <input
                                                type="color"
                                                value={textColor}
                                                onChange={handleColorChange}
                                                className="w-full h-10 rounded cursor-pointer border border-gray-300"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTool === 'format' && (
                                    <div className={`flex gap-4 py-2 ${isLandscape ? 'flex-col items-center' : 'justify-center'}`}>
                                        <button
                                            onClick={toggleBold}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg border ${isBold ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}
                                        >
                                            <Bold className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={toggleItalic}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg border ${isItalic ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}
                                        >
                                            <Italic className="w-5 h-5" />
                                        </button>
                                        <div className={isLandscape ? "w-10 h-px bg-gray-200" : "w-px h-10 bg-gray-200"} />
                                        <button
                                            onClick={() => handleAlignChange('left')}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg border ${textAlign === 'left' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}
                                        >
                                            <AlignLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleAlignChange('center')}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg border ${textAlign === 'center' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}
                                        >
                                            <AlignCenter className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleAlignChange('right')}
                                            className={`w-10 h-10 flex items-center justify-center rounded-lg border ${textAlign === 'right' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-700'}`}
                                        >
                                            <AlignRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                                {activeTool === 'layers' && (
                                    <div className={`flex gap-4 py-2 ${isLandscape ? 'flex-col items-center' : 'justify-center'}`}>
                                        <button
                                            onClick={() => handleLayerAction('front')}
                                            className="w-10 h-10 flex flex-col items-center justify-center rounded-lg border bg-white border-gray-200 text-gray-700"
                                            title="Bring to Front"
                                        >
                                            <ArrowUpToLine className="w-5 h-5" />
                                            {!isLandscape && <span className="text-[8px] mt-1">To Front</span>}
                                        </button>
                                        <button
                                            onClick={() => handleLayerAction('forward')}
                                            className="w-10 h-10 flex flex-col items-center justify-center rounded-lg border bg-white border-gray-200 text-gray-700"
                                            title="Bring Forward"
                                        >
                                            <ArrowUp className="w-5 h-5" />
                                            {!isLandscape && <span className="text-[8px] mt-1">Forward</span>}
                                        </button>
                                        <button
                                            onClick={() => handleLayerAction('backward')}
                                            className="w-10 h-10 flex flex-col items-center justify-center rounded-lg border bg-white border-gray-200 text-gray-700"
                                            title="Send Backward"
                                        >
                                            <ArrowDown className="w-5 h-5" />
                                            {!isLandscape && <span className="text-[8px] mt-1">Backward</span>}
                                        </button>
                                        <button
                                            onClick={() => handleLayerAction('back')}
                                            className="w-10 h-10 flex flex-col items-center justify-center rounded-lg border bg-white border-gray-200 text-gray-700"
                                            title="Send to Back"
                                        >
                                            <ArrowDownToLine className="w-5 h-5" />
                                            {!isLandscape && <span className="text-[8px] mt-1">To Back</span>}
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
            className="z-20 bg-white rounded-lg shadow-md border border-gray-200 px-4 py-2 flex items-center gap-3 overflow-x-auto mb-4"
            style={{
                maxWidth: 'calc(100% - 2rem)',
                width: 'fit-content'
            }}
        >
            {/* Font Family - Text only */}
            {isTextObject && (
                <select
                    value={fontFamily}
                    onChange={handleFontFamilyChange}
                    disabled={isLocked}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                    {fontOptions.map(font => (
                        <option key={font} value={font}>{font}</option>
                    ))}
                </select>
            )}

            {/* Font Size - Text only */}
            {isTextObject && (
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        value={fontSize}
                        onChange={handleFontSizeChange}
                        disabled={isLocked}
                        min="8"
                        max="300"
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                </div>
            )}

            {isTextObject && <div className="w-px h-6 bg-gray-300" />}

            {/* Bold - Text only */}
            {isTextObject && (
                <button
                    onClick={toggleBold}
                    disabled={isLocked}
                    className={`w-8 h-8 flex items-center justify-center rounded ${isBold ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } font-bold transition-colors disabled:opacity-50`}
                    title="Bold"
                >
                    B
                </button>
            )}

            {/* Italic - Text only */}
            {isTextObject && (
                <button
                    onClick={toggleItalic}
                    disabled={isLocked}
                    className={`w-8 h-8 flex items-center justify-center rounded ${isItalic ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } italic transition-colors disabled:opacity-50`}
                    title="Italic"
                >
                    I
                </button>
            )}

            {isTextObject && <div className="w-px h-6 bg-gray-300" />}

            {/* Text Alignment - Text only */}
            {isTextObject && (
                <div className="flex gap-1">
                    <button
                        onClick={() => handleAlignChange('left')}
                        disabled={isLocked}
                        className={`w-8 h-8 flex items-center justify-center rounded ${textAlign === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } transition-colors disabled:opacity-50`}
                        title="Align Left"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4h14v2H3V4zm0 4h10v2H3V8zm0 4h14v2H3v-2zm0 4h10v2H3v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleAlignChange('center')}
                        disabled={isLocked}
                        className={`w-8 h-8 flex items-center justify-center rounded ${textAlign === 'center' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } transition-colors disabled:opacity-50`}
                        title="Align Center"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4h14v2H3V4zm2 4h10v2H5V8zm-2 4h14v2H3v-2zm2 4h10v2H5v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleAlignChange('right')}
                        disabled={isLocked}
                        className={`w-8 h-8 flex items-center justify-center rounded ${textAlign === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            } transition-colors disabled:opacity-50`}
                        title="Align Right"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4h14v2H3V4zm4 4h10v2H7V8zm-4 4h14v2H3v-2zm4 4h10v2H7v-2z" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="w-px h-6 bg-gray-300" />

            {/* Color */}
            <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Color:</label>
                <input
                    type="color"
                    value={textColor}
                    onChange={handleColorChange}
                    disabled={isLocked}
                    className="w-10 h-8 rounded cursor-pointer border border-gray-300 disabled:opacity-50"
                    title="Color"
                />
            </div>

            <div className="w-px h-6 bg-gray-300" />

            {/* Layers */}
            <div className="flex gap-1">
                <button
                    onClick={() => handleLayerAction('front')}
                    disabled={isLocked}
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    title="Bring to Front"
                >
                    <ArrowUpToLine className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleLayerAction('forward')}
                    disabled={isLocked}
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    title="Bring Forward"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleLayerAction('backward')}
                    disabled={isLocked}
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    title="Send Backward"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
                <button
                    onClick={() => handleLayerAction('back')}
                    disabled={isLocked}
                    className="w-8 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    title="Send to Back"
                >
                    <ArrowDownToLine className="w-4 h-4" />
                </button>
            </div>

            <div className="w-px h-6 bg-gray-300" />

            {/* Actions: Lock, Duplicate, Delete */}
            <div className="flex gap-1">
                {/* Lock/Unlock */}
                <button
                    onClick={() => {
                        if (onLockToggle) {
                            onLockToggle();
                            setIsLocked(!isLocked);
                        }
                    }}
                    className={`group relative px-2 h-8 flex items-center justify-center rounded ${isLocked ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        } transition-colors`}
                    title={isLocked ? "Unlock" : "Lock"}
                >
                    {isLocked ? (
                        /* Closed/Locked padlock - filled */
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        /* Open/Unlocked padlock - outline style */
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        </svg>
                    )}
                    <span className="hidden group-hover:inline ml-1 text-xs font-medium">{isLocked ? 'Unlock' : 'Lock'}</span>
                </button>

                {/* Duplicate */}
                <button
                    onClick={onDuplicate}
                    disabled={isLocked}
                    className="group relative px-2 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Duplicate"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                        <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                    </svg>
                    <span className="hidden group-hover:inline ml-1 text-xs font-medium">Duplicate</span>
                </button>

                {/* Delete */}
                <button
                    onClick={onDelete}
                    disabled={isLocked}
                    className="group relative px-2 h-8 flex items-center justify-center rounded bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden group-hover:inline ml-1 text-xs font-medium">Delete</span>
                </button>
            </div>
        </div>
    );
}
