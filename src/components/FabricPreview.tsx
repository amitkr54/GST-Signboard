'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { fabric } from 'fabric';
import { SignageData, DesignConfig } from '@/lib/types';
import { MaterialId } from '@/lib/utils';
import { TEMPLATES } from '@/lib/templates';
import { getTemplates } from '@/app/actions';
import { TextFormatToolbar } from './TextFormatToolbar';
import { CanvasContextMenu } from './CanvasContextMenu';
import { initAligningGuidelines } from '@/lib/fabric-aligning-guidelines';

// Modular Hooks & Components
import { useCanvasHistory } from '@/hooks/useCanvasHistory';
import { useCanvasObjectManagers } from '@/hooks/useCanvasObjectManagers';
import { useCanvasEvents } from '@/hooks/useCanvasEvents';
import { useCanvasTemplates } from '@/hooks/useCanvasTemplates';
import { CanvasInteractionDebugger } from './CanvasInteractionDebugger';

interface FabricPreviewProps {
    data: SignageData;
    design: DesignConfig;
    material?: MaterialId;
    onMount?: (canvas: fabric.Canvas) => void;
    onDesignChange?: (design: DesignConfig) => void;
    onAddText?: (addFn: (type: 'heading' | 'subheading' | 'body') => void) => void;
    onAddIcon?: (addFn: (iconName: string) => void) => void;
    onAddShape?: (addFn: (type: string) => void) => void;
    onAddImage?: (addFn: (imageUrl: string) => void) => void;
    onDataChange?: (data: Partial<SignageData>) => void;
    compact?: boolean;
    isLandscape?: boolean;
}

export function FabricPreview({
    data,
    design,
    material = 'flex',
    onMount,
    onDesignChange,
    onAddText,
    onAddIcon,
    onAddShape,
    onAddImage,
    onDataChange,
    compact = false,
    isLandscape = false
}: FabricPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const clipboard = useRef<fabric.Object | null>(null);
    const [scale, setScale] = useState(0.1);
    const [canvasInstance, setCanvasInstance] = useState<fabric.Canvas | null>(null);
    const lastScaleRef = useRef<number>(0.1);
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [dynamicTemplates, setDynamicTemplates] = useState<typeof TEMPLATES>(TEMPLATES);
    const [isStabilized, setIsStabilized] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [hasSafetyViolation, setHasSafetyViolation] = useState(false);

    const { width: baseWidth, height: baseHeight } = useMemo(() => {
        const DPI = 75;
        let w = design.width;
        let h = design.height;
        const u = design.unit || 'in';
        if (u === 'in') { w *= DPI; h *= DPI; }
        else if (u === 'cm') { w *= (DPI / 2.54); h *= (DPI / 2.54); }
        else if (u === 'mm') { w *= (DPI / 25.4); h *= (DPI / 25.4); }
        return { width: Math.round(w), height: Math.round(h) };
    }, [design.width, design.height, design.unit]);

    // 1. History Management
    const { saveHistory, undo, redo, setInitialHistory, setIsProcessing } = useCanvasHistory();

    // 2. Object Managers
    const { addText, addIcon, addShape, addImage } = useCanvasObjectManagers(
        fabricCanvasRef, baseWidth, baseHeight, onDesignChange, design, saveHistory
    );

    // 3. Canvas Events & Keyboard
    const { checkSafetyArea } = useCanvasEvents({
        canvasInstance,
        setSelectedObject,
        setContextMenu,
        saveHistory,
        undo,
        redo,
        clipboard,
        setInitialHistory,
        baseWidth,
        baseHeight,
        onSafetyChange: setHasSafetyViolation
    });

    // 4. Template & Layout Management
    const { updateTemplateContent, renderSVGTemplate } = useCanvasTemplates(
        fabricCanvasRef, baseWidth, baseHeight, design, data,
        () => canvasInstance && checkSafetyArea(canvasInstance)
    );

    useEffect(() => {
        const timer = setTimeout(() => setIsStabilized(true), 800);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchTemplates = async () => {
            const templates = await getTemplates();
            if (templates && templates.length > 0) setDynamicTemplates(templates as any);
        };
        fetchTemplates();
    }, []);

    const [alignmentDebug, setAlignmentDebug] = useState<{ isDragging: boolean; vLines: number; hLines: number } | undefined>(undefined);

    // Canvas Initialization
    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: baseWidth, height: baseHeight, backgroundColor: design.backgroundColor,
            selection: true, renderOnAddRemove: true, preserveObjectStacking: true
        });

        // Debug listener for alignment state
        canvas.on('after:render', () => {
            // @ts-ignore
            if (canvas.__debug_align) {
                // @ts-ignore
                setAlignmentDebug({ ...canvas.__debug_align });
            }
        });

        fabric.Object.prototype.set({
            borderColor: '#E53935', cornerColor: '#ffffff', cornerStrokeColor: '#E53935',
            cornerSize: 14, transparentCorners: false, padding: 0, cornerStyle: 'circle',
            borderScaleFactor: 2.5
        });

        fabricCanvasRef.current = canvas;
        setCanvasInstance(canvas);

        // Attach to window for global access (e.g. handleDownload)
        (window as any).fabricCanvas = canvas;

        // Initialize alignment guidelines
        const disposeGuidelines = initAligningGuidelines(canvas);

        if (onMount) onMount(canvas);

        const savedJSON = localStorage.getItem('signage_canvas_json');
        if (savedJSON) {
            try {
                setIsProcessing(true);
                canvas.loadFromJSON(savedJSON, () => {
                    canvas.getObjects().forEach((obj) => {
                        obj.set({
                            borderColor: '#E53935',
                            cornerColor: '#ffffff',
                            cornerStrokeColor: '#E53935',
                            cornerSize: 14,
                            transparentCorners: false,
                            padding: 0,
                            cornerStyle: 'circle',
                            borderScaleFactor: 2.5
                        });
                    });
                    canvas.renderAll();
                    setInitialHistory(savedJSON);
                    setIsProcessing(false);
                });
            } catch (err) {
                console.error('Restore failed', err);
                setIsProcessing(false);
            }
        }

        // Global font loading listener to re-sync all text boxes when new fonts arrive
        if ((window as any).document?.fonts) {
            const handleFontsReady = () => {
                const textObjects = canvas.getObjects().filter(obj =>
                    obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text'
                );

                textObjects.forEach(obj => {
                    const tObj = obj as any;
                    if (obj.type === 'textbox') {
                        const marginScale = 0.05;
                        const margin = Math.min(baseWidth, baseHeight) * marginScale;
                        const maxWidth = baseWidth - (margin * 2);

                        const measurer = new fabric.Text(tObj.text || '', {
                            fontFamily: tObj.fontFamily,
                            fontSize: tObj.fontSize,
                            fontWeight: tObj.fontWeight,
                            fontStyle: tObj.fontStyle,
                            charSpacing: tObj.charSpacing
                        });
                        const targetWidth = Math.min((measurer.width || 0) + 15, maxWidth);
                        tObj.set({ width: targetWidth, padding: 4 });
                    }
                    tObj.setCoords();
                });
                canvas.requestRenderAll();
            };

            (document as any).fonts.ready.then(handleFontsReady);
        }

        return () => {
            if (disposeGuidelines) disposeGuidelines();
            canvas.dispose();
            fabricCanvasRef.current = null;
            setCanvasInstance(null);
        };
    }, []);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const target = canvas.findTarget(e.nativeEvent, false);
        if (target) { canvas.setActiveObject(target); setSelectedObject(target); }
        else { canvas.discardActiveObject(); setSelectedObject(null); }
        canvas.requestRenderAll();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleAction = (action: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();

        switch (action) {
            case 'copy': if (activeObject) activeObject.clone((cloned: any) => clipboard.current = cloned); break;
            case 'paste':
                if (clipboard.current) {
                    clipboard.current.clone((clonedObj: any) => {
                        canvas.discardActiveObject();
                        clonedObj.set({ left: (clonedObj.left || 0) + 20, top: (clonedObj.top || 0) + 20, evented: true });
                        canvas.add(clonedObj);
                        canvas.setActiveObject(clonedObj);
                        saveHistory(canvas);
                    });
                }
                break;
            case 'duplicate':
                if (activeObject) {
                    activeObject.clone((cloned: any) => {
                        cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20, evented: true });
                        canvas.add(cloned);
                        canvas.setActiveObject(cloned);
                        saveHistory(canvas);
                    });
                }
                break;
            case 'delete':
                const activeObjects = canvas.getActiveObjects();
                if (activeObjects.length) {
                    canvas.discardActiveObject();
                    activeObjects.forEach((obj) => canvas.remove(obj));
                    saveHistory(canvas);
                }
                break;
            case 'lock':
                if (activeObject) {
                    const isLocked = !activeObject.lockMovementX;
                    activeObject.set({
                        lockMovementX: isLocked, lockMovementY: isLocked,
                        lockScalingX: isLocked, lockScalingY: isLocked,
                        lockRotation: isLocked, hasControls: !isLocked,
                        editable: activeObject.type?.includes('text') ? !isLocked : undefined
                    } as any);
                    saveHistory(canvas);
                }
                break;
            case 'front': activeObject?.bringToFront(); break;
            case 'back':
                if (activeObject) {
                    const bg = canvas.getObjects().find(o => (o as any).name === 'background');
                    if (bg) activeObject.moveTo(canvas.getObjects().indexOf(bg) + 1);
                    else activeObject.sendToBack();
                }
                break;
            case 'markAsBackground':
                if (activeObject) {
                    (activeObject as any).isBackground = true;
                    const bg = canvas.getObjects().find(o => (o as any).name === 'background');
                    if (bg) activeObject.moveTo(canvas.getObjects().indexOf(bg) + 1);
                    else activeObject.sendToBack();
                    saveHistory(canvas);
                    checkSafetyArea(canvas);
                }
                break;
            case 'forward': activeObject?.bringForward(); break;
            case 'backward':
                if (activeObject) {
                    const bg = canvas.getObjects().find(o => (o as any).name === 'background');
                    const bgIdx = bg ? canvas.getObjects().indexOf(bg) : -1;
                    const curIdx = canvas.getObjects().indexOf(activeObject);
                    if (curIdx > bgIdx + 1) activeObject.sendBackwards();
                }
                break;
            case 'align-left': activeObject?.set({ left: activeObject.getScaledWidth() / 2 }); break;
            case 'align-center': activeObject?.set({ left: baseWidth / 2 }); break;
            case 'align-right': activeObject?.set({ left: baseWidth - activeObject.getScaledWidth() / 2 }); break;
            case 'align-top': activeObject?.set({ top: activeObject.getScaledHeight() / 2 }); break;
            case 'align-middle': activeObject?.set({ top: baseHeight / 2 }); break;
            case 'align-bottom': activeObject?.set({ top: baseHeight - activeObject.getScaledHeight() / 2 }); break;
        }
        canvas.requestRenderAll();
    };

    // Scaling Logic
    useEffect(() => {
        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;
            const sc = Math.max(0.1, Math.min(1.0, (container.clientWidth * 0.95) / baseWidth, (container.clientHeight * 0.95) / baseHeight));
            if (Math.abs(sc - lastScaleRef.current) > 0.0001) { lastScaleRef.current = sc; setScale(sc); }
        };
        const ro = new ResizeObserver(() => requestAnimationFrame(updateScale));
        if (containerRef.current) ro.observe(containerRef.current);
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => { ro.disconnect(); window.removeEventListener('resize', updateScale); };
    }, [baseWidth, baseHeight]);

    useEffect(() => {
        if (canvasInstance) {
            canvasInstance.setDimensions({ width: baseWidth * scale, height: baseHeight * scale });
            canvasInstance.setZoom(scale);
            canvasInstance.calcOffset();
            canvasInstance.requestRenderAll();
        }
    }, [canvasInstance, scale, baseWidth, baseHeight]);

    // Template Loading Flow
    // Stable refs for callbacks to avoid re-triggering the loading effect
    const templateCallbacksRef = useRef({ updateTemplateContent, renderSVGTemplate });
    useEffect(() => {
        templateCallbacksRef.current = { updateTemplateContent, renderSVGTemplate };
    }, [updateTemplateContent, renderSVGTemplate]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        setIsProcessing(true);
        const templateConfig = dynamicTemplates.find(t => t.id === design.templateId);

        // Remove existing template objects
        canvas.getObjects().forEach(obj => {
            if ((obj as any).name?.startsWith('template_')) canvas.remove(obj);
        });

        const finalizeLoad = () => {
            setIsProcessing(false);
            saveHistory(canvas);
        };

        if (templateConfig) {
            if (templateConfig.fabricConfig) {
                canvas.loadFromJSON(templateConfig.fabricConfig, () => {
                    canvas.getObjects().forEach((obj: any) => {
                        if (obj.type === 'text' && obj.text) {
                            const newTxt = new fabric.Textbox(obj.text, { ...obj.toObject(), type: 'textbox', selectable: true, evented: true, editable: true });
                            canvas.remove(obj);
                            canvas.add(newTxt);
                        } else obj.set({ selectable: true, evented: true });
                    });
                    templateCallbacksRef.current.updateTemplateContent();
                    finalizeLoad();
                });
            } else if (templateConfig.svgPath) {
                fetch(templateConfig.svgPath)
                    .then(r => r.text())
                    .then(svgText => {
                        templateCallbacksRef.current.renderSVGTemplate(templateConfig.components, svgText);
                        finalizeLoad();
                    });
            } else {
                templateCallbacksRef.current.updateTemplateContent();
                finalizeLoad();
            }
        } else {
            templateCallbacksRef.current.updateTemplateContent();
            finalizeLoad();
        }
    }, [design.templateId, dynamicTemplates, setIsProcessing, saveHistory]);

    // Prop sync
    useEffect(() => { updateTemplateContent(); }, [data, design.backgroundColor, design.fontFamily, design.textColor, design.fontSize, design.companyNameSize]);

    // Debounced History Save for Design changes (Sliders/Colors in Sidebar)
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const timer = setTimeout(() => {
            saveHistory(canvas);
        }, 500);
        return () => clearTimeout(timer);
    }, [design, saveHistory]);

    // Prop Registration
    useEffect(() => {
        onAddText?.(addText);
        onAddIcon?.(addIcon);
        onAddShape?.(addShape);
        onAddImage?.(addImage);
    }, [onAddText, onAddIcon, onAddShape, onAddImage, addText, addIcon, addShape, addImage]);

    return (
        <div className="flex-1 w-full relative overflow-hidden flex flex-col min-h-0">
            {/* 1. Floating Toolbar */}
            <div className="absolute top-0 left-0 right-0 z-[100] transition-all duration-300 pointer-events-none">
                <div className="flex justify-center p-2 pointer-events-auto">
                    {selectedObject && (
                        <TextFormatToolbar
                            selectedObject={selectedObject}
                            compact={compact}
                            isLandscape={isLandscape}
                            onUpdate={() => {
                                if (fabricCanvasRef.current) {
                                    fabricCanvasRef.current.requestRenderAll();
                                    saveHistory(fabricCanvasRef.current);
                                }
                            }}
                            onFontSizeChange={(size) => onDesignChange?.({ ...design, companyNameSize: size })}
                            onFontFamilyChange={(font) => onDesignChange?.({ ...design, fontFamily: font })}
                            onColorChange={(color) => onDesignChange?.({ ...design, textColor: color })}
                            onDuplicate={() => handleAction('duplicate')}
                            onDelete={() => handleAction('delete')}
                            onLockToggle={() => handleAction('lock')}
                        />
                    )}
                </div>
            </div>

            {/* 2. Main Canvas Container - Absolute Centering Wrapper */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div ref={containerRef} className="w-full h-full flex items-center justify-center relative overflow-hidden bg-transparent" onContextMenu={handleContextMenu}>
                    <div className="bg-white rounded-sm shadow-2xl relative flex items-center justify-center shrink-0" style={{ width: baseWidth * scale, height: baseHeight * scale }}>
                        <canvas ref={canvasRef} />

                        {/* Safety Danger Zone Label */}
                        {hasSafetyViolation && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-1.5 px-3 py-1 bg-[#cc0000] rounded-full shadow-lg ring-1 ring-white/20 animate-in fade-in zoom-in duration-300">
                                <div className="w-3.5 h-3.5 rounded-full border border-white flex items-center justify-center">
                                    <span className="text-[9px] font-bold text-white mb-[0.5px]">i</span>
                                </div>
                                <span className="text-[11px] font-black text-white uppercase tracking-wider whitespace-nowrap leading-none pt-[1px]">Danger zone</span>
                            </div>
                        )}
                    </div>

                    {contextMenu && (
                        <CanvasContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onAction={handleAction} hasSelection={!!selectedObject} isLocked={!!selectedObject?.lockMovementX} />
                    )}
                    <CanvasInteractionDebugger selectedObject={selectedObject} alignmentDebug={alignmentDebug} />
                </div>
            </div>
        </div>
    );
}
