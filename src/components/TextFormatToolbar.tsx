import { fabric } from 'fabric';
import React, { useState, useEffect } from 'react';
import { MobileTextFormatToolbar } from './MobileTextFormatToolbar';
import { DesktopTextFormatToolbar } from './DesktopTextFormatToolbar';

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
    onAction?: (action: string) => void;
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
    onDragStart,
    onAction
}: TextFormatToolbarProps) {
    const [fontFamily, setFontFamily] = useState('Arial');
    const [fontSize, setFontSize] = useState(30);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [textColor, setTextColor] = useState('#000000');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center');
    const [isLocked, setIsLocked] = useState(false);
    const [showPositionMenu, setShowPositionMenu] = useState(false);

    const isMultiple = selectedObject?.type === 'activeSelection';
    const isGroup = selectedObject?.type === 'group';

    // Mobile Toolbar State
    const [activeTool, setActiveTool] = useState<null | 'font' | 'size' | 'color' | 'format' | 'layers'>(null);

    // Check if selected object is a text object (only when single selection)
    const isTextObject = !!(selectedObject && !isMultiple && (
        selectedObject.type === 'i-text' ||
        selectedObject.type === 'textbox' ||
        selectedObject.type === 'text'
    ));
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
        if (isNaN(newSize)) return;
        setFontSize(newSize);
        updateProperty('fontSize', newSize);

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
            const obj = selectedObject;
            if (obj.fill && obj.fill !== 'transparent' && obj.fill !== 'none') {
                updateProperty('fill', newColor);
            }
            if (obj.stroke && obj.stroke !== 'transparent' && obj.stroke !== 'none') {
                updateProperty('stroke', newColor);
            }
            if (obj.type === 'path' && (!obj.fill || obj.fill === 'transparent') && (!obj.stroke || obj.stroke === 'transparent')) {
                updateProperty('fill', newColor);
            }
            if (obj.type === 'group') {
                (obj as fabric.Group).getObjects().forEach(child => {
                    child.set({ fill: newColor, stroke: newColor });
                });
            }
        }
    };

    const handleAlignChange = (align: 'left' | 'center' | 'right' | 'justify') => {
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

    const handleLockToggleInternal = () => {
        if (onLockToggle) {
            onLockToggle();
            setIsLocked(!isLocked);
        }
    };

    const fontOptions = [
        "Arial", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Raleway",
        "PT Sans", "Merriweather", "Nunito", "Playfair Display", "Poppins",
        "Source Sans Pro", "Ubuntu", "Roboto Slab", "Lora", "Pacifico",
        "Dancing Script", "Bebas Neue", "Lobster", "Abril Fatface",
        "Times New Roman", "Courier New", "Georgia", "Verdana",
        "Comic Sans MS", "Impact"
    ];

    const commonProps = {
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
        handleFontFamilyChange,
        handleFontSizeChange,
        toggleBold,
        toggleItalic,
        handleAlignChange,
        handleColorChange,
        handleLayerAction,
        onDuplicate: onDuplicate || (() => { }),
        onDelete: onDelete || (() => { }),
        onAction,
        fontOptions
    };

    if (compact) {
        return (
            <MobileTextFormatToolbar
                {...commonProps}
                textObject={textObject}
                isLandscape={isLandscape}
                activeTool={activeTool}
                setActiveTool={setActiveTool}
            />
        );
    }

    return (
        <DesktopTextFormatToolbar
            {...commonProps}
            showPositionMenu={showPositionMenu}
            setShowPositionMenu={setShowPositionMenu}
            onLockToggle={handleLockToggleInternal}
            onDragStart={onDragStart}
        />
    );
}
