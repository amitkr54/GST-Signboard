import React from 'react';
import { SignageData, DesignConfig } from '@/lib/types';
import { MaterialId } from '@/lib/utils';
import { FabricPreview } from './FabricPreview';

interface PreviewSectionProps {
    uploadedDesign: string | null;
    data: SignageData;
    design: DesignConfig;
    material: MaterialId;
    onDesignChange: (design: DesignConfig) => void;
    onAddText?: (fn: (type: 'heading' | 'subheading' | 'body') => void) => void;
    onAddIcon?: (fn: (iconName: string) => void) => void;
    onAddShape?: (fn: (type: 'rect' | 'circle' | 'line' | 'triangle') => void) => void;
    onAddImage?: (fn: (url: string) => void) => void;
    onDataChange?: (data: Partial<SignageData>) => void;
    compact?: boolean;
    isLandscape?: boolean;
    onObjectSelected?: (obj: fabric.Object | null) => void;
    onToolbarAction?: (actionFn: (action: string) => void) => void;
    initialJSON?: any;
}

export function PreviewSection({
    uploadedDesign,
    data,
    design,
    material,
    onDesignChange,
    onAddText,
    onAddIcon,
    onAddShape,
    onAddImage,
    onDataChange,
    compact = false,
    isLandscape = false,
    onObjectSelected,
    onToolbarAction,
    initialJSON
}: PreviewSectionProps) {

    if (uploadedDesign) {
        return (
            <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${compact ? 'p-0' : 'p-4'} overflow-hidden`}>
                <div className="relative shadow-xl max-w-full max-h-full flex items-center justify-center">
                    <img
                        src={uploadedDesign}
                        alt="Your Uploaded Design"
                        className="max-w-full max-h-full object-contain bg-white"
                        style={{ maxHeight: compact ? '300px' : 'calc(100vh - 200px)' }}
                    />
                </div>
            </div>
        );
    }

    return (
        <div id="tutorial-actual-canvas" className="w-full h-full flex-1 min-h-0 flex flex-col overflow-hidden">
            <FabricPreview
                data={data}
                design={design}
                material={material}
                onDesignChange={onDesignChange}
                onAddText={onAddText}
                onAddIcon={onAddIcon}
                onAddShape={onAddShape}
                onAddImage={onAddImage}
                onDataChange={onDataChange}
                compact={compact}
                isLandscape={isLandscape}
                onObjectSelected={onObjectSelected}
                onToolbarAction={onToolbarAction}
                initialJSON={initialJSON}
            />
        </div>
    );
}
