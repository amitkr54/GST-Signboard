import { useState, useEffect, useCallback } from 'react';
import { fabric } from 'fabric';
import { FONT_VARIANTS_METADATA, FontVariantSupport } from '@/lib/font-utils';

interface UseTextFormattingProps {
    selectedObject: fabric.Object | null;
    onUpdate: () => void;
    onFontSizeChange?: (fontSize: number) => void;
    onFontFamilyChange?: (fontFamily: string) => void;
    onColorChange?: (color: string) => void;
    onLockToggle?: () => void;
}

export function useTextFormatting({
    selectedObject,
    onUpdate,
    onFontSizeChange,
    onFontFamilyChange,
    onColorChange,
    onLockToggle
}: UseTextFormattingProps) {
    const [fontFamily, setFontFamily] = useState('Arial');
    const [fontSize, setFontSize] = useState(30);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [textColor, setTextColor] = useState('#000000');
    const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right' | 'justify'>('center');
    const [lineHeight, setLineHeight] = useState(1.16);
    const [charSpacing, setCharSpacing] = useState(0);
    const [isLocked, setIsLocked] = useState(false);

    const supportedVariants: FontVariantSupport = FONT_VARIANTS_METADATA[fontFamily] || { bold: true, italic: true, boldItalic: true };

    const isMultiple = selectedObject?.type === 'activeSelection';
    const isGroup = selectedObject?.type === 'group';

    // Check if selected objects are all text objects
    const areAllTextObjects = useCallback((obj: fabric.Object | null): boolean => {
        if (!obj) return false;
        if (obj.type === 'activeSelection') {
            const selection = obj as fabric.ActiveSelection;
            return selection.getObjects().every(child =>
                child.type === 'i-text' || child.type === 'textbox' || child.type === 'text'
            );
        }
        return obj.type === 'i-text' || obj.type === 'textbox' || obj.type === 'text';
    }, []);

    const isTextObject = areAllTextObjects(selectedObject);
    const textObject = (isTextObject && !isMultiple) ? (selectedObject as fabric.IText) : null;

    useEffect(() => {
        if (!selectedObject) return;

        // Set lock state for any object
        setIsLocked(!!selectedObject.lockMovementX);

        if (textObject) {
            // Single text object - easy sync
            setFontFamily((textObject.fontFamily || 'Arial').replace(/['"]/g, '').trim());
            setFontSize(textObject.fontSize || 30);
            setIsBold(textObject.fontWeight === 'bold');
            setIsItalic(textObject.fontStyle === 'italic');
            setTextColor(textObject.fill as string || '#000000');
            setTextAlign(textObject.textAlign as any || 'center');
            setLineHeight(textObject.lineHeight || 1.16);
            setCharSpacing(textObject.charSpacing || 0);
        } else if (isMultiple && isTextObject) {
            // Multiple text objects - find common values
            const selection = selectedObject as fabric.ActiveSelection;
            const objects = selection.getObjects() as fabric.IText[];

            const first = objects[0];
            const allSameFont = objects.every(o => (o.fontFamily || '').replace(/['"]/g, '').trim() === (first.fontFamily || '').replace(/['"]/g, '').trim());
            const allSameSize = objects.every(o => o.fontSize === first.fontSize);
            const allSameBold = objects.every(o => o.fontWeight === first.fontWeight);
            const allSameItalic = objects.every(o => o.fontStyle === first.fontStyle);
            const allSameColor = objects.every(o => o.fill === first.fill);
            const allSameAlign = objects.every(o => o.textAlign === first.textAlign);

            setFontFamily(allSameFont ? (first.fontFamily || 'Arial').replace(/['"]/g, '').trim() : 'Arial');
            setFontSize(allSameSize ? (first.fontSize || 30) : 30);
            setIsBold(allSameBold && first.fontWeight === 'bold');
            setIsItalic(allSameItalic && first.fontStyle === 'italic');
            setTextColor(allSameColor ? (first.fill as string || '#000000') : '#000000');
            setTextAlign(allSameAlign ? (first.textAlign as any || 'left') : 'left');
        } else {
            // Non-text or mixed objects
            setTextColor((selectedObject.fill as string) || (selectedObject.stroke as string) || '#000000');
        }
    }, [selectedObject, textObject, isMultiple, isTextObject, onUpdate]); // Added onUpdate dependency if needed, but usually redundant here

    const robustAutoFit = useCallback((obj: fabric.Object) => {
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
    }, []);

    const updateProperty = useCallback((property: string, value: any) => {
        if (!selectedObject || isLocked) return;

        const isText = selectedObject.type?.includes('text') || selectedObject.type === 'textbox';
        const canStylePartially = ['fontWeight', 'fontStyle'].includes(property);

        // Handle character-level styling if in editing mode and property allows
        if (isText && (selectedObject as any).isEditing && canStylePartially) {
            (selectedObject as any).setSelectionStyles({ [property]: value });
        } else {
            if (isMultiple) {
                (selectedObject as fabric.ActiveSelection).getObjects().forEach(obj => {
                    obj.set(property as any, value);
                    if (obj.type?.includes('text') || obj.type === 'textbox') {
                        robustAutoFit(obj);
                    }
                });
            } else {
                selectedObject.set(property as any, value);
            }
        }

        if (isText && ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle'].includes(property)) {
            // 1. Immediate Fit
            robustAutoFit(selectedObject);
            // 2. Delayed Fits (to catch font rendering delays)
            setTimeout(() => robustAutoFit(selectedObject), 50);
            setTimeout(() => robustAutoFit(selectedObject), 250);

            // 3. Font-Ready Fit (the most reliable)
            if (property === 'fontFamily' && (window as any).document?.fonts) {
                const fontWeight = (selectedObject as any).get('fontWeight') || 'normal';
                const currentFontSize = (selectedObject as any).get('fontSize');
                const fontStr = `${fontWeight} ${currentFontSize}px "${value}"`;
                (document as any).fonts.load(fontStr).then(() => {
                    robustAutoFit(selectedObject);
                }).catch(() => { });
            }
        }

        selectedObject.setCoords();
        onUpdate();
    }, [selectedObject, isLocked, isMultiple, onUpdate, robustAutoFit]);

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
        if (onFontSizeChange) onFontSizeChange(newSize);
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
        if (!selectedObject || isLocked) return;
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
                    if (child.name === 'icon_logo') return;
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

    const handleLineHeightChange = (value: number) => {
        if (isLocked) return;
        setLineHeight(value);
        updateProperty('lineHeight', value);
    };

    const handleCharSpacingChange = (value: number) => {
        if (isLocked) return;
        setCharSpacing(value);
        updateProperty('charSpacing', value);
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

    return {
        fontFamily,
        fontSize,
        isBold,
        isItalic,
        textColor,
        textAlign,
        lineHeight,
        charSpacing,
        isLocked,
        supportedVariants,
        isMultiple,
        isGroup,
        isTextObject,
        textObject,
        handleFontFamilyChange,
        handleFontSizeChange,
        toggleBold,
        toggleItalic,
        handleAlignChange,
        handleLineHeightChange,
        handleCharSpacingChange,
        handleColorChange,
        handleLayerAction,
        handleLockToggleInternal
    };
}
