import { fabric } from 'fabric';
import React, { useState } from 'react';
import { MobileTextFormatToolbar } from './MobileTextFormatToolbar';
import { DesktopTextFormatToolbar } from './DesktopTextFormatToolbar';
import { useTextFormatting } from '@/hooks/useTextFormatting';

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
    const [showPositionMenu, setShowPositionMenu] = useState(false);
    // Mobile Toolbar State
    const [activeTool, setActiveTool] = useState<null | 'font' | 'size' | 'color' | 'format' | 'spacing' | 'layers'>(null);

    const {
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
    } = useTextFormatting({
        selectedObject,
        onUpdate,
        onFontSizeChange,
        onFontFamilyChange,
        onColorChange,
        onLockToggle
    });

    if (!selectedObject) return null;

    const defaultOptions = [
        "Inter", "Arial", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Raleway",
        "PT Sans", "Merriweather", "Nunito", "Playfair Display", "Poppins",
        "Source Sans Pro", "Ubuntu", "Roboto Slab", "Lora", "Pacifico",
        "Dancing Script", "Bebas Neue", "Lobster", "Abril Fatface",
        "Times New Roman", "Courier New", "Georgia", "Verdana",
        "Comic Sans MS", "Impact"
    ];

    // Ensure currently applied font is ALWAYS in the options list so it displays correctly
    const fontOptions = [...defaultOptions];
    if (fontFamily && !fontOptions.includes(fontFamily)) {
        fontOptions.unshift(fontFamily);
    }

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
        lineHeight,
        charSpacing,
        handleFontFamilyChange,
        handleFontSizeChange,
        toggleBold,
        toggleItalic,
        handleAlignChange,
        handleLineHeightChange,
        handleCharSpacingChange,
        handleColorChange,
        handleLayerAction,
        onDuplicate: onDuplicate || (() => { }),
        onDelete: onDelete || (() => { }),
        onAction,
        fontOptions,
        supportedVariants
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
