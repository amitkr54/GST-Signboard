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
    isReadOnly?: boolean;
    initialJSON?: string;
    initialSVG?: string;
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
    isLandscape = false,
    isReadOnly = false,
    initialJSON,
    initialSVG
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
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
    const [hasSafetyViolation, setHasSafetyViolation] = useState(false);
    const [toolbarPos, setToolbarPos] = useState({ x: 200, y: 100 });
    const [hasMovedToolbar, setHasMovedToolbar] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const hasInitialLoadRef = useRef(false);

    const { width: baseWidth, height: baseHeight } = useMemo(() => {
        const DPI = 100;
        let w = design.width;
        let h = design.height;
        const u = design.unit || 'in';
        if (u === 'in') { w *= DPI; h *= DPI; }
        else if (u === 'cm') { w *= (DPI / 2.54); h *= (DPI / 2.54); }
        else if (u === 'mm') { w *= (DPI / 25.4); h *= (DPI / 25.4); }
        return { width: Math.round(w), height: Math.round(h) };
    }, [design.width, design.height, design.unit]);

    const { saveHistory, undo, redo, setInitialHistory, setIsProcessing } = useCanvasHistory();

    const { addText, addIcon, addShape, addImage } = useCanvasObjectManagers(
        fabricCanvasRef, baseWidth, baseHeight, onDesignChange, design, saveHistory
    );

    const { checkSafetyArea } = useCanvasEvents({
        canvasInstance, setSelectedObject, setContextMenu, saveHistory, undo, redo, clipboard,
        setInitialHistory, baseWidth, baseHeight, onSafetyChange: setHasSafetyViolation
    });

    const { updateTemplateContent, renderSVGTemplate } = useCanvasTemplates(
        fabricCanvasRef, baseWidth, baseHeight, design, data,
        () => canvasInstance && checkSafetyArea(canvasInstance)
    );

    useEffect(() => {
        const fetchTemplates = async () => {
            const templates = await getTemplates();
            if (templates && templates.length > 0) setDynamicTemplates(templates as any);
        };
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (selectedObject && !hasMovedToolbar && containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            setToolbarPos({ x: (containerWidth / 2) - 300, y: 20 });
        }
    }, [!!selectedObject, hasMovedToolbar]);

    // Shared object loader for grouping and centering
    const loadObjects = useCallback((objects: fabric.Object[]) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Filter outliers (ghosts)
        const filtered = objects.filter(o => {
            const w = o.getScaledWidth();
            const h = o.getScaledHeight();
            return w < 10000 && h < 10000 && Math.abs(o.left || 0) < 10000 && Math.abs(o.top || 0) < 10000;
        });

        canvas.clear();
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
        canvas.setDimensions({ width: baseWidth, height: baseHeight });
        canvas.setZoom(1);

        if (filtered.length === 0) {
            setIsProcessing(false);
            return;
        }

        const group = new fabric.Group(filtered);
        const sX = baseWidth / (group.width || 1);
        const sY = baseHeight / (group.height || 1);
        const sc = Math.min(sX, sY) * 0.9;

        group.scale(sc);
        group.center();
        group.setCoords();

        canvas.add(group);
        group.toActiveSelection();
        canvas.discardActiveObject();

        canvas.getObjects().forEach((obj) => {
            const isLargeRect = obj.type === 'rect' &&
                (obj.width || 0) >= baseWidth * 0.9 &&
                (obj.height || 0) >= baseHeight * 0.9;
            const isBg = (obj as any).name === 'background' || (obj as any).isBackground || isLargeRect;
            if (isBg) (obj as any).isBackground = true;
            obj.set({
                borderColor: '#E53935', cornerColor: '#ffffff', cornerStrokeColor: '#E53935',
                cornerSize: 14, transparentCorners: false, padding: 0, cornerStyle: 'circle',
                borderScaleFactor: 2.5, selectable: isBg ? false : !isReadOnly,
                evented: isBg ? false : !isReadOnly,
                lockMovementX: isBg ? true : undefined,
                lockMovementY: isBg ? true : undefined,
            });

            // Ensure text is editable
            if (obj.type?.includes('text') && !isReadOnly) {
                obj.set({
                    editable: true,
                    cursor: 'text',
                    lockScalingY: false
                } as any);
            }
        });

        const currentScale = lastScaleRef.current;
        canvas.setDimensions({ width: baseWidth * currentScale, height: baseHeight * currentScale });
        canvas.setZoom(currentScale);
        canvas.renderAll();
        setIsProcessing(false);
    }, [baseWidth, baseHeight, isReadOnly, setIsProcessing]);

    // Canvas Initialization
    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: baseWidth, height: baseHeight, backgroundColor: design.backgroundColor,
            selection: !isReadOnly, preserveObjectStacking: true
        });
        fabricCanvasRef.current = canvas;
        setCanvasInstance(canvas);
        if (!isReadOnly) (window as any).fabricCanvas = canvas;
        const disposeGuidelines = initAligningGuidelines(canvas);
        if (onMount) onMount(canvas);

        return () => {
            if (disposeGuidelines) disposeGuidelines();
            canvas.dispose();
            fabricCanvasRef.current = null;
            setCanvasInstance(null);
            if (!isReadOnly && (window as any).fabricCanvas === canvas) delete (window as any).fabricCanvas;
        };
    }, []);

    // Initial Data & Template Load
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const savedJSON = initialJSON || (!isReadOnly && !initialSVG ? localStorage.getItem('signage_canvas_json') : null);

        if (initialSVG) {
            setIsProcessing(true);
            canvas.clear();
            fabric.loadSVGFromString(initialSVG, (objects) => loadObjects(objects));
        } else if (savedJSON) {
            setIsProcessing(true);
            canvas.loadFromJSON(savedJSON, () => {
                if (initialJSON) loadObjects(canvas.getObjects());
                else {
                    canvas.getObjects().forEach(obj => {
                        const isBg = (obj as any).name === 'background' || (obj as any).isBackground;
                        obj.set({ selectable: isBg ? false : !isReadOnly, evented: isBg ? false : !isReadOnly });
                    });
                    const currentScale = lastScaleRef.current;
                    canvas.setDimensions({ width: baseWidth * currentScale, height: baseHeight * currentScale });
                    canvas.setZoom(currentScale);
                    canvas.renderAll();
                    setIsProcessing(false);
                }
            });
        }
    }, [canvasInstance, initialJSON, initialSVG, isReadOnly, baseWidth, baseHeight, loadObjects]);

    // Scaling Logic
    useEffect(() => {
        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;
            const sc = Math.min(container.clientWidth / baseWidth, container.clientHeight / baseHeight) * 0.95;
            if (sc > 0 && Math.abs(sc - lastScaleRef.current) > 0.0001) {
                lastScaleRef.current = sc;
                setScale(sc);
            }
        };
        const ro = new ResizeObserver(updateScale);
        if (containerRef.current) ro.observe(containerRef.current);
        updateScale();
        return () => ro.disconnect();
    }, [baseWidth, baseHeight]);

    useEffect(() => {
        if (canvasInstance) {
            canvasInstance.setDimensions({ width: baseWidth * scale, height: baseHeight * scale });
            canvasInstance.setZoom(scale);
            canvasInstance.requestRenderAll();
        }
    }, [canvasInstance, scale, baseWidth, baseHeight]);

    // Template Selection Handler
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || initialJSON) return;

        const templateId = design.templateId;
        const templateConfig = dynamicTemplates.find(t => t.id === templateId);

        const savedJSON = !isReadOnly ? localStorage.getItem('signage_canvas_json') : null;
        if (!hasInitialLoadRef.current && savedJSON) {
            hasInitialLoadRef.current = true;
            return;
        }
        hasInitialLoadRef.current = true;

        if (templateId === 'custom') {
            canvas.getObjects().forEach(obj => {
                if (!((obj as any).name === 'background' || (obj as any).isBackground)) canvas.remove(obj);
            });
            saveHistory(canvas);
            return;
        }

        if (templateConfig) {
            setIsProcessing(true);
            if (templateConfig.fabricConfig) {
                const config = typeof templateConfig.fabricConfig === 'string' ? JSON.parse(templateConfig.fabricConfig) : templateConfig.fabricConfig;
                fabric.util.enlivenObjects(config.objects || [], (objs: fabric.Object[]) => {
                    loadObjects(objs);
                    setIsProcessing(false);
                    saveHistory(canvas);
                }, '');
            } else if (templateConfig.svgPath) {
                fetch(templateConfig.svgPath).then(r => r.text()).then(svgText => {
                    renderSVGTemplate(templateConfig.components, svgText);
                    setIsProcessing(false);
                    saveHistory(canvas);
                });
            }
        }
    }, [design.templateId, dynamicTemplates, loadObjects, initialJSON, isReadOnly, saveHistory]);

    // Font Handling
    useEffect(() => {
        if (typeof window !== 'undefined' && (document as any).fonts) {
            const fixFonts = () => {
                const canvas = fabricCanvasRef.current;
                if (!canvas) return;
                canvas.getObjects().filter(o => o.type?.includes('text')).forEach(o => {
                    const t = o as any;
                    if (o.type === 'textbox') t.set({ width: Math.min(t.width || 0, baseWidth - 20) });
                    t.setCoords();
                });
                canvas.requestRenderAll();
            };
            (document as any).fonts.ready.then(fixFonts);
        }
    }, [baseWidth]);

    const handleAction = useCallback((action: string) => {
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
                        canvas.discardActiveObject();
                        cloned.set({ left: (cloned.left || 0) + 10, top: (cloned.top || 0) + 10, evented: true });
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
                    canvas.requestRenderAll();
                    setSelectedObject({ ...activeObject } as any);
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
            case 'forward': activeObject?.bringForward(); break;
            case 'backward':
                if (activeObject) {
                    const bg = canvas.getObjects().find(o => (o as any).name === 'background');
                    if (canvas.getObjects().indexOf(activeObject) > (bg ? canvas.getObjects().indexOf(bg) : -1) + 1) activeObject.sendBackwards();
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
    }, [baseWidth, baseHeight, saveHistory]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const target = canvas.findTarget(e.nativeEvent, false);
        if (target) { canvas.setActiveObject(target); setSelectedObject(target); }
        else { canvas.discardActiveObject(); setSelectedObject(null); }
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleToolbarDragStart = (e: React.MouseEvent) => {
        setIsDragging(true);
        setHasMovedToolbar(true);
        setDragStartPos({ x: e.clientX - toolbarPos.x, y: e.clientY - toolbarPos.y });
    };

    useEffect(() => {
        if (!isDragging) return;
        const move = (e: MouseEvent) => setToolbarPos({ x: e.clientX - dragStartPos.x, y: e.clientY - dragStartPos.y });
        const up = () => setIsDragging(false);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    }, [isDragging, dragStartPos]);

    useEffect(() => { onAddText?.(addText); onAddIcon?.(addIcon); onAddShape?.(addShape); onAddImage?.(addImage); }, [onAddText, onAddIcon, onAddShape, onAddImage, addText, addIcon, addShape, addImage]);

    return (
        <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-50 flex flex-col min-h-0">
            {selectedObject && !isReadOnly && !compact && (
                <div className="fixed z-[1000]" style={{ left: `${toolbarPos.x}px`, top: `${toolbarPos.y}px`, transition: isDragging ? 'none' : 'box-shadow 0.2s' }}>
                    <TextFormatToolbar selectedObject={selectedObject} onUpdate={() => { fabricCanvasRef.current?.requestRenderAll(); saveHistory(fabricCanvasRef.current!); }}
                        onFontSizeChange={(size) => onDesignChange?.({ ...design, companyNameSize: size })}
                        onFontFamilyChange={(font) => onDesignChange?.({ ...design, fontFamily: font })}
                        onColorChange={(color) => onDesignChange?.({ ...design, textColor: color })}
                        onDuplicate={() => handleAction('duplicate')} onDelete={() => handleAction('delete')}
                        onLockToggle={() => handleAction('lock')} onDragStart={handleToolbarDragStart} />
                </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div ref={containerRef} className="w-full h-full flex items-center justify-center relative bg-transparent" onContextMenu={handleContextMenu}>
                    <div className="bg-white shadow-2xl relative shrink-0" style={{ width: baseWidth * scale, height: baseHeight * scale }}>
                        <canvas ref={canvasRef} />
                        {hasSafetyViolation && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-1.5 px-3 py-1 bg-[#cc0000] rounded-full shadow-lg">
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">Danger zone</span>
                            </div>
                        )}
                    </div>
                </div>
                {contextMenu && !isReadOnly && (
                    <CanvasContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onAction={handleAction} hasSelection={!!selectedObject} />
                )}
            </div>
        </div>
    );
}
