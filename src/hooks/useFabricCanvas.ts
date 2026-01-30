import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { DesignConfig } from '@/lib/types';
import { initAligningGuidelines } from '@/lib/fabric-aligning-guidelines';

interface UseFabricCanvasProps {
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    baseWidth: number;
    baseHeight: number;
    design: DesignConfig;
    isReadOnly: boolean;
    compact: boolean;
    onMount?: (canvas: fabric.Canvas) => void;
    setIsProcessing?: (val: boolean) => void;
    registerGlobal?: boolean;
}

export function useFabricCanvas({
    canvasRef,
    baseWidth,
    baseHeight,
    design,
    isReadOnly,
    compact,
    onMount,
    setIsProcessing,
    registerGlobal = false
}: UseFabricCanvasProps) {
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [canvasInstance, setCanvasInstance] = useState<fabric.Canvas | null>(null);
    const compactRef = useRef(compact);

    // Update compact ref when prop changes
    useEffect(() => {
        compactRef.current = compact;

        // Dynamic update of prototypes based on compact mode
        fabric.Textbox.prototype.set({
            borderColor: '#FF3333',
            cornerColor: '#ffffff',
            cornerStrokeColor: '#FF3333',
            cornerSize: 20,
            transparentCorners: false,
            padding: 8,
            cornerStyle: 'circle',
            borderScaleFactor: 4,
            editable: !compact
        });

        fabric.IText.prototype.set({
            borderColor: '#FF3333',
            cornerColor: '#ffffff',
            cornerStrokeColor: '#FF3333',
            cornerSize: 20,
            transparentCorners: false,
            padding: 8,
            cornerStyle: 'circle',
            borderScaleFactor: 4,
            editable: !compact
        });

        // Update existing objects on canvas
        if (canvasInstance) {
            canvasInstance.getObjects().forEach(obj => {
                if (obj.type === 'i-text' || obj.type === 'textbox') {
                    (obj as fabric.IText).set('editable', !compact);
                }
            });
            canvasInstance.requestRenderAll();
        }
    }, [compact, canvasInstance]);

    // Canvas Initialization
    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: baseWidth,
            height: baseHeight,
            backgroundColor: design.backgroundColor,
            selection: !isReadOnly,
            renderOnAddRemove: true,
            preserveObjectStacking: true
        });

        // Apply global styles
        fabric.Object.prototype.set({
            borderColor: '#FF3333',
            cornerColor: '#ffffff',
            cornerStrokeColor: '#FF3333',
            cornerSize: 28,
            transparentCorners: false,
            padding: 8,
            cornerStyle: 'circle',
            borderScaleFactor: 4
        });

        fabricCanvasRef.current = canvas;
        setCanvasInstance(canvas);

        if (!isReadOnly || registerGlobal) {
            (window as any).fabricCanvas = canvas;
        }

        const disposeGuidelines = initAligningGuidelines(canvas);

        if (onMount) onMount(canvas);

        return () => {
            if (disposeGuidelines) disposeGuidelines();
            canvas.dispose();
            fabricCanvasRef.current = null;
            setCanvasInstance(null);
            if ((!isReadOnly || registerGlobal) && (window as any).fabricCanvas === canvas) {
                delete (window as any).fabricCanvas;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        fabricCanvasRef,
        canvasInstance,
        compactRef
    };
}
