import React, { useRef } from 'react';
import { SignageData, DesignConfig } from '@/lib/types';
import { MaterialId } from '@/lib/utils';
import { FabricPreview } from './FabricPreview';
import { fabric } from 'fabric';

interface SignagePreviewProps {
    data: SignageData;
    design: DesignConfig;
    material?: MaterialId;
    onDesignChange?: (design: DesignConfig) => void;
    // Sidebar callbacks
    onAddText?: (addFn: (type: 'heading' | 'subheading' | 'body') => void) => void;
    onAddIcon?: (addFn: (iconName: string) => void) => void;
    onAddShape?: (addFn: (type: 'rect' | 'circle' | 'line' | 'triangle') => void) => void;
    onAddImage?: (addFn: (imageUrl: string) => void) => void;
    compact?: boolean;
}

export function SignagePreview({
    data,
    design,
    material = 'flex',
    onDesignChange,
    onAddText,
    onAddIcon,
    onAddShape,
    onAddImage,
    compact = false
}: SignagePreviewProps) {
    const canvasRef = useRef<fabric.Canvas | null>(null);

    return (
        <FabricPreview
            data={data}
            design={design}
            material={material}
            onMount={(canvas) => {
                canvasRef.current = canvas;
                (window as any).fabricCanvas = canvas; // Expose for debug/download
            }}
            onDesignChange={onDesignChange}
            onAddText={onAddText}
            onAddIcon={onAddIcon}
            onAddShape={onAddShape}
            onAddImage={onAddImage}
            compact={compact}
        />
    );
}
