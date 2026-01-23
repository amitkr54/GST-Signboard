'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { fabric } from 'fabric';
import { SignageData, DesignConfig } from '@/lib/types';
import { MaterialId, getNormalizedDimensions } from '@/lib/utils';
import { TEMPLATES } from '@/lib/templates';
import { getTemplates } from '@/app/actions';
import { TextFormatToolbar } from './TextFormatToolbar';
import { CanvasContextMenu } from './CanvasContextMenu';
import { initAligningGuidelines } from '@/lib/fabric-aligning-guidelines';
import { FloatingSelectionToolbar } from './FloatingSelectionToolbar';

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
    initialJSON?: any;
    initialSVG?: string;
    onObjectSelected?: (obj: fabric.Object | null) => void;
    onToolbarAction?: (actionFn: (action: string) => void) => void;
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
    initialSVG,
    onObjectSelected,
    onToolbarAction
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
    const [copiedStyle, setCopiedStyle] = useState<any>(null);
    const [hasSafetyViolation, setHasSafetyViolation] = useState(false);
    const [toolbarPos, setToolbarPos] = useState<{ x: number, y: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const [rotationAngle, setRotationAngle] = useState<number | null>(null);
    const [floatingToolbarPos, setFloatingToolbarPos] = useState<{ x: number, y: number } | null>(null);
    const hasInitialLoadRef = useRef(false);

    // Canvas size based on user's selected dimensions (for correct aspect ratio)
    // We normalize this to a Safe View Size (max 1800px) to prevent browser crashes on large banners
    // Export will handle the full 100 DPI scaling separately
    const { width: baseWidth, height: baseHeight } = useMemo(() => {
        return getNormalizedDimensions(design.width, design.height);
    }, [design.width, design.height]);

    // History & Managers Hooks
    const { saveHistory, undo, redo, setInitialHistory, setIsProcessing } = useCanvasHistory();
    const { addText, addIcon, addShape, addImage } = useCanvasObjectManagers(
        fabricCanvasRef, baseWidth, baseHeight, onDesignChange, design, saveHistory
    );

    // Canvas Events Hook
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
        onSafetyChange: setHasSafetyViolation,
        onSelectionChange: onObjectSelected
    });

    // Template Mapping Hook
    const { updateTemplateContent, renderSVGTemplate } = useCanvasTemplates(
        fabricCanvasRef, baseWidth, baseHeight, design, data,
        () => canvasInstance && checkSafetyArea(canvasInstance)
    );

    // Initial load for templates
    useEffect(() => {
        const fetchTemplates = async () => {
            const templates = await getTemplates();
            if (templates && templates.length > 0) setDynamicTemplates(templates as any);
        };
        fetchTemplates();
    }, []);

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
            borderColor: '#FF3333', // Vibrant red
            cornerColor: '#ffffff', // White handles
            cornerStrokeColor: '#FF3333', // Red stroke for corners
            cornerSize: 28, // Scaled for 1800px normalization
            transparentCorners: false,
            padding: 8,
            cornerStyle: 'circle',
            borderScaleFactor: 4 // Thicker selection lines
        });

        // Ensure Textbox also uses the same prototype settings
        fabric.Textbox.prototype.set({
            borderColor: '#FF3333',
            cornerColor: '#ffffff',
            cornerStrokeColor: '#FF3333',
            cornerSize: 20,
            transparentCorners: false,
            padding: 8,
            cornerStyle: 'circle',
            borderScaleFactor: 4
        });

        // Rotation indicator
        canvas.on('object:rotating', (e) => {
            const obj = e.target;
            if (obj) {
                const angle = Math.round(obj.angle || 0);
                setRotationAngle(angle);
            }
        });

        canvas.on('object:modified', () => {
            setRotationAngle(null);
        });

        canvas.on('selection:cleared', () => {
            setRotationAngle(null);
        });

        fabricCanvasRef.current = canvas;
        setCanvasInstance(canvas);

        if (!isReadOnly) {
            (window as any).fabricCanvas = canvas;
        }

        const disposeGuidelines = initAligningGuidelines(canvas);

        if (onMount) onMount(canvas);

        return () => {
            if (disposeGuidelines) disposeGuidelines();
            canvas.dispose();
            fabricCanvasRef.current = null;
            setCanvasInstance(null);
            if (!isReadOnly && (window as any).fabricCanvas === canvas) {
                delete (window as any).fabricCanvas;
            }
        };
    }, []);
    // Load Initial JSON (Snapshot)
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !initialJSON) return;

        setIsProcessing(true);
        canvas.loadFromJSON(initialJSON, () => {
            canvas.getObjects().forEach((obj) => {
                if (isReadOnly) {
                    obj.set({ selectable: false, evented: false });
                }
            });
            canvas.requestRenderAll();
            setIsProcessing(false);
        });
    }, [initialJSON, isReadOnly, setIsProcessing]);

    const updateFloatingToolbar = useCallback((obj: fabric.Object | null) => {
        if (!obj || !fabricCanvasRef.current || !containerRef.current) {
            setFloatingToolbarPos(null);
            return;
        }

        const canvas = fabricCanvasRef.current;
        const boundingRect = obj.getBoundingRect(true);

        // Use the current design scale to map canvas coords to viewport div coords
        const x = (boundingRect.left + boundingRect.width / 2) * scale;
        const y = boundingRect.top * scale;

        setFloatingToolbarPos({ x, y });
    }, [scale]);

    useEffect(() => {
        const canvas = canvasInstance;
        if (!canvas) return;

        const handler = () => updateFloatingToolbar(canvas.getActiveObject());
        const clearHandler = () => setFloatingToolbarPos(null);

        canvas.on('selection:created', handler);
        canvas.on('selection:updated', handler);
        canvas.on('selection:cleared', clearHandler);
        canvas.on('object:moving', handler);
        canvas.on('object:scaling', handler);
        canvas.on('object:rotating', handler);

        return () => {
            canvas.off('selection:created', handler);
            canvas.off('selection:updated', handler);
            canvas.off('selection:cleared', clearHandler);
            canvas.off('object:moving', handler);
            canvas.off('object:scaling', handler);
            canvas.off('object:rotating', handler);
        };
    }, [canvasInstance, updateFloatingToolbar]);

    const handleAction = useCallback((action: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();

        // Safety Margin (consistent with guides)
        const margin = Math.min(baseWidth, baseHeight) * 0.05;

        switch (action) {
            case 'copy-style':
                if (activeObject) {
                    const style: any = {
                        fill: activeObject.fill,
                        stroke: activeObject.stroke,
                        strokeWidth: activeObject.strokeWidth,
                        opacity: activeObject.opacity
                    };
                    if (activeObject.type?.includes('text') || activeObject.type === 'textbox') {
                        const t = activeObject as fabric.IText;
                        style.fontFamily = t.fontFamily;
                        style.fontSize = t.fontSize;
                        style.fontWeight = t.fontWeight;
                        style.fontStyle = t.fontStyle;
                        style.textAlign = t.textAlign;
                        style.charSpacing = t.charSpacing;
                        style.lineHeight = t.lineHeight;
                        style.underline = t.underline;
                    }
                    setCopiedStyle(style);
                }
                break;
            case 'paste-style':
                if (activeObject && copiedStyle) {
                    const objects = activeObject.type === 'activeSelection'
                        ? (activeObject as fabric.ActiveSelection).getObjects()
                        : [activeObject];

                    objects.forEach(obj => {
                        const isText = obj.type?.includes('text') || obj.type === 'textbox';

                        // Basic styles for all
                        obj.set({
                            fill: copiedStyle.fill,
                            stroke: copiedStyle.stroke,
                            strokeWidth: copiedStyle.strokeWidth,
                            opacity: copiedStyle.opacity
                        });

                        // Text specific style
                        if (isText) {
                            (obj as any).set({
                                fontFamily: copiedStyle.fontFamily,
                                fontSize: copiedStyle.fontSize,
                                fontWeight: copiedStyle.fontWeight,
                                fontStyle: copiedStyle.fontStyle,
                                textAlign: copiedStyle.textAlign,
                                charSpacing: copiedStyle.charSpacing,
                                lineHeight: copiedStyle.lineHeight,
                                underline: copiedStyle.underline
                            });
                            (obj as any).initDimensions?.();
                        }
                    });
                    canvas.requestRenderAll();
                    saveHistory(canvas);
                }
                break;
            case 'copy':
                if (activeObject) {
                    activeObject.clone((cloned: fabric.Object) => {
                        (canvas as any)._clipboard = cloned;
                    });
                }
                break;
            case 'paste':
                const clipboard = (canvas as any)._clipboard;
                if (clipboard) {
                    clipboard.clone((clonedObj: any) => {
                        canvas.discardActiveObject();
                        clonedObj.set({
                            left: clonedObj.left + 20,
                            top: clonedObj.top + 20,
                            evented: true,
                        });
                        if (clonedObj.type === 'activeSelection') {
                            clonedObj.canvas = canvas;
                            clonedObj.forEachObject((obj: any) => canvas.add(obj));
                            clonedObj.setCoords();
                        } else {
                            canvas.add(clonedObj);
                        }
                        canvas.setActiveObject(clonedObj);
                        canvas.requestRenderAll();
                        saveHistory(canvas);
                    });
                }
                break;
            case 'duplicate':
                if (activeObject) {
                    activeObject.clone((cloned: any) => {
                        canvas.discardActiveObject();
                        cloned.set({
                            left: cloned.left + 10,
                            top: cloned.top + 10,
                            evented: true,
                        });
                        if (cloned.type === 'activeSelection') {
                            cloned.canvas = canvas;
                            cloned.forEachObject((obj: any) => canvas.add(obj));
                            cloned.setCoords();
                        } else {
                            canvas.add(cloned);
                        }
                        canvas.setActiveObject(cloned);
                        canvas.requestRenderAll();
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
                    setSelectedObject(null);
                }
                break;
            case 'group':
                if (activeObject && activeObject.type === 'activeSelection') {
                    const group = (activeObject as fabric.ActiveSelection).toGroup();
                    canvas.setActiveObject(group);
                    canvas.requestRenderAll();
                    saveHistory(canvas);
                    setSelectedObject(group);
                }
                break;
            case 'ungroup':
                if (activeObject && activeObject.type === 'group') {
                    (activeObject as fabric.Group).toActiveSelection();
                    canvas.requestRenderAll();
                    saveHistory(canvas);
                    setSelectedObject(canvas.getActiveObject());
                }
                break;
            case 'distribute-h':
                if (activeObject && activeObject.type === 'activeSelection') {
                    const selection = activeObject as fabric.ActiveSelection;
                    const objs = [...selection.getObjects()].sort((a, b) => a.getCenterPoint().x - b.getCenterPoint().x);
                    if (objs.length > 2) {
                        const infos = objs.map(o => ({
                            obj: o,
                            width: o.getScaledWidth(),
                            center: o.getCenterPoint().x
                        }));

                        const first = infos[0];
                        const last = infos[infos.length - 1];

                        let totalOccupied = 0;
                        infos.forEach(i => totalOccupied += i.width);

                        const firstLeft = first.center - first.width / 2;
                        const lastRight = last.center + last.width / 2;
                        let totalSpan = lastRight - firstLeft;

                        let gap = (totalSpan - totalOccupied) / (infos.length - 1);

                        // If objects are overlapping (negative gap), expand to create minimum 20px gaps
                        if (gap < 0) {
                            gap = 20;
                            totalSpan = totalOccupied + gap * (infos.length - 1);
                        }

                        let currentLeft = firstLeft;
                        infos.forEach(info => {
                            info.obj.setPositionByOrigin(new fabric.Point(currentLeft + info.width / 2, info.obj.getCenterPoint().y), 'center', 'center');
                            currentLeft += info.width + gap;
                        });

                        selection.setCoords();
                        canvas.requestRenderAll();
                        saveHistory(canvas);
                    }
                }
                break;
            case 'distribute-v':
                if (activeObject && activeObject.type === 'activeSelection') {
                    const selection = activeObject as fabric.ActiveSelection;
                    const objs = [...selection.getObjects()].sort((a, b) => a.getCenterPoint().y - b.getCenterPoint().y);
                    if (objs.length > 2) {
                        const infos = objs.map(o => ({
                            obj: o,
                            height: o.getScaledHeight(),
                            center: o.getCenterPoint().y
                        }));

                        const first = infos[0];
                        const last = infos[infos.length - 1];

                        let totalOccupied = 0;
                        infos.forEach(i => totalOccupied += i.height);

                        const firstTop = first.center - first.height / 2;
                        const lastBottom = last.center + last.height / 2;
                        let totalSpan = lastBottom - firstTop;

                        let gap = (totalSpan - totalOccupied) / (infos.length - 1);

                        // If objects are overlapping (negative gap), expand to create minimum 20px gaps
                        if (gap < 0) {
                            gap = 20;
                            totalSpan = totalOccupied + gap * (infos.length - 1);
                        }

                        console.log('[DISTRIBUTE-V] totalSpan:', totalSpan, 'occupied:', totalOccupied, 'gap:', gap);

                        let currentTop = firstTop;
                        infos.forEach(info => {
                            info.obj.setPositionByOrigin(new fabric.Point(info.obj.getCenterPoint().x, currentTop + info.height / 2), 'center', 'center');
                            currentTop += info.height + gap;
                        });

                        selection.setCoords();
                        canvas.requestRenderAll();
                        saveHistory(canvas);
                    }
                }
                break;
            case 'lock':
                if (activeObject) {
                    const isLocked = !activeObject.lockMovementX;
                    activeObject.set({
                        lockMovementX: isLocked, lockMovementY: isLocked,
                        lockScalingX: isLocked, lockScalingY: isLocked,
                        lockRotation: isLocked, hasControls: !isLocked,
                        editable: (activeObject.type === 'textbox' || activeObject.type === 'i-text') ? !isLocked : undefined
                    } as any);
                    canvas.requestRenderAll();
                    setSelectedObject(activeObject);
                    saveHistory(canvas);
                }
                break;
            case 'markAsBackground':
                if (activeObject) {
                    const isCurrentlyBg = (activeObject as any).isBackground;
                    (activeObject as any).isBackground = !isCurrentlyBg;
                    (activeObject as any).name = !isCurrentlyBg ? 'background' : '';

                    if (!isCurrentlyBg) {
                        // Move to bottom but above existing backgrounds
                        const objects = canvas.getObjects();
                        let lastBgIdx = -1;
                        for (let i = 0; i < objects.length; i++) {
                            if ((objects[i] as any).isBackground || objects[i].name === 'background') {
                                lastBgIdx = i;
                            }
                        }
                        activeObject.moveTo(lastBgIdx + 1);
                    }

                    saveHistory(canvas);
                    checkSafetyArea(canvas);
                    canvas.requestRenderAll();
                }
                break;
            case 'download-selection':
                if (activeObject) {
                    const dataURL = activeObject.toDataURL({
                        format: 'png',
                        quality: 1
                    });
                    const link = document.createElement('a');
                    link.download = 'selection.png';
                    link.href = dataURL;
                    link.click();
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
                    const bgIdx = bg ? canvas.getObjects().indexOf(bg) : -1;
                    const curIdx = canvas.getObjects().indexOf(activeObject);
                    if (curIdx > bgIdx + 1) activeObject.sendBackwards();
                }
                break;
            case 'align-left':
                if (activeObject) {
                    if (activeObject.type === 'activeSelection') {
                        const selection = activeObject as fabric.ActiveSelection;
                        const selectionWidth = selection.width || 0;
                        selection.getObjects().forEach(obj => {
                            const point = new fabric.Point(-selectionWidth / 2, obj.top!);
                            obj.setPositionByOrigin(point, 'left', obj.originY!);
                        });
                        selection.setCoords();
                    } else {
                        const rect = activeObject.getBoundingRect(true, true);
                        const currentLeft = activeObject.left || 0;
                        activeObject.set('left', currentLeft - rect.left + margin);
                        activeObject.setCoords();
                    }
                    saveHistory(canvas);
                }
                break;
            case 'align-center':
                if (activeObject) {
                    if (activeObject.type === 'activeSelection') {
                        const selection = activeObject as fabric.ActiveSelection;
                        selection.getObjects().forEach(obj => {
                            const point = new fabric.Point(0, obj.top!);
                            obj.setPositionByOrigin(point, 'center', obj.originY!);
                        });
                        selection.setCoords();
                    } else {
                        const rect = activeObject.getBoundingRect(true, true);
                        const currentLeft = activeObject.left || 0;
                        activeObject.set('left', baseWidth / 2 - rect.width / 2 + (currentLeft - rect.left));
                        activeObject.setCoords();
                    }
                    saveHistory(canvas);
                }
                break;
            case 'align-right':
                if (activeObject) {
                    if (activeObject.type === 'activeSelection') {
                        const selection = activeObject as fabric.ActiveSelection;
                        const selectionWidth = selection.width || 0;
                        selection.getObjects().forEach(obj => {
                            const point = new fabric.Point(selectionWidth / 2, obj.top!);
                            obj.setPositionByOrigin(point, 'right', obj.originY!);
                        });
                        selection.setCoords();
                    } else {
                        const rect = activeObject.getBoundingRect(true, true);
                        const currentLeft = activeObject.left || 0;
                        activeObject.set('left', baseWidth - rect.width + (currentLeft - rect.left) - margin);
                        activeObject.setCoords();
                    }
                    saveHistory(canvas);
                }
                break;
            case 'align-top':
                if (activeObject) {
                    if (activeObject.type === 'activeSelection') {
                        const selection = activeObject as fabric.ActiveSelection;
                        const selectionHeight = selection.height || 0;
                        selection.getObjects().forEach(obj => {
                            const point = new fabric.Point(obj.left!, -selectionHeight / 2);
                            obj.setPositionByOrigin(point, obj.originX!, 'top');
                        });
                        selection.setCoords();
                    } else {
                        const rect = activeObject.getBoundingRect(true, true);
                        const currentTop = activeObject.top || 0;
                        activeObject.set('top', currentTop - rect.top + margin);
                        activeObject.setCoords();
                    }
                    saveHistory(canvas);
                }
                break;
            case 'align-middle':
                if (activeObject) {
                    if (activeObject.type === 'activeSelection') {
                        const selection = activeObject as fabric.ActiveSelection;
                        selection.getObjects().forEach(obj => {
                            const point = new fabric.Point(obj.left!, 0);
                            obj.setPositionByOrigin(point, obj.originX!, 'center');
                        });
                        selection.setCoords();
                    } else {
                        const rect = activeObject.getBoundingRect(true, true);
                        const currentTop = activeObject.top || 0;
                        activeObject.set('top', baseHeight / 2 - rect.height / 2 + (currentTop - rect.top));
                        activeObject.setCoords();
                    }
                    saveHistory(canvas);
                }
                break;
            case 'align-bottom':
                if (activeObject) {
                    if (activeObject.type === 'activeSelection') {
                        const selection = activeObject as fabric.ActiveSelection;
                        const selectionHeight = selection.height || 0;
                        selection.getObjects().forEach(obj => {
                            const point = new fabric.Point(obj.left!, selectionHeight / 2);
                            obj.setPositionByOrigin(point, obj.originX!, 'bottom');
                        });
                        selection.setCoords();
                    } else {
                        const rect = activeObject.getBoundingRect(true, true);
                        const currentTop = activeObject.top || 0;
                        activeObject.set('top', baseHeight - rect.height + (currentTop - rect.top) - margin);
                        activeObject.setCoords();
                    }
                    saveHistory(canvas);
                }
                break;
            case 'align-card-left':
                if (activeObject) {
                    const rect = activeObject.getBoundingRect(true, true);
                    const currentLeft = activeObject.left || 0;
                    activeObject.set('left', currentLeft - rect.left + margin);
                    activeObject.setCoords();
                    saveHistory(canvas);
                }
                break;
            case 'align-card-center':
                if (activeObject) {
                    const rect = activeObject.getBoundingRect(true, true);
                    const currentLeft = activeObject.left || 0;
                    activeObject.set('left', baseWidth / 2 - rect.width / 2 + (currentLeft - rect.left));
                    activeObject.setCoords();
                    saveHistory(canvas);
                }
                break;
            case 'align-card-right':
                if (activeObject) {
                    const rect = activeObject.getBoundingRect(true, true);
                    const currentLeft = activeObject.left || 0;
                    activeObject.set('left', baseWidth - rect.width + (currentLeft - rect.left) - margin);
                    activeObject.setCoords();
                    saveHistory(canvas);
                }
                break;
            case 'align-card-top':
                if (activeObject) {
                    const rect = activeObject.getBoundingRect(true, true);
                    const currentTop = activeObject.top || 0;
                    activeObject.set('top', currentTop - rect.top + margin);
                    activeObject.setCoords();
                    saveHistory(canvas);
                }
                break;
            case 'align-card-middle':
                if (activeObject) {
                    const rect = activeObject.getBoundingRect(true, true);
                    const currentTop = activeObject.top || 0;
                    activeObject.set('top', baseHeight / 2 - rect.height / 2 + (currentTop - rect.top));
                    activeObject.setCoords();
                    saveHistory(canvas);
                }
                break;
            case 'align-card-bottom':
                if (activeObject) {
                    const rect = activeObject.getBoundingRect(true);
                    activeObject.set('top', baseHeight - rect.height + (activeObject.top! - rect.top));
                    activeObject.setCoords();
                    saveHistory(canvas);
                }
                break;
        }
        canvas.requestRenderAll();
    }, [baseWidth, baseHeight, saveHistory, checkSafetyArea, copiedStyle]);

    // Scaling Logic
    useEffect(() => {
        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;
            const targetWidth = container.clientWidth;
            const targetHeight = container.clientHeight;
            if (targetWidth === 0 || targetHeight === 0) return;
            const sc = Math.max(0.1, Math.min(1.0, (targetWidth * 0.95) / baseWidth, (targetHeight * 0.95) / baseHeight));
            if (Math.abs(sc - lastScaleRef.current) > 0.0001) {
                lastScaleRef.current = sc;
                setScale(sc);
            }
        };
        const ro = new ResizeObserver(() => requestAnimationFrame(updateScale));
        if (containerRef.current) ro.observe(containerRef.current);

        // Initial measurement
        updateScale();

        // Robust fallback: re-measure after a delay to catch settled layout
        const timer1 = setTimeout(updateScale, 100);
        const timer2 = setTimeout(updateScale, 500);
        const timer3 = setTimeout(updateScale, 1000);

        window.addEventListener('resize', updateScale);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', updateScale);
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [baseWidth, baseHeight]);

    // Apply Scaling to Canvas
    useEffect(() => {
        if (canvasInstance) {
            const cssWidth = baseWidth * scale;
            const cssHeight = baseHeight * scale;

            console.log(`[SCALING FIX] Setting dimensions. Logical: ${baseWidth}x${baseHeight}, CSS: ${cssWidth}x${cssHeight}`);

            // 1. Set Backstore (Logical) Dimension to High Res
            // This ensures the exported image is 1800px+
            canvasInstance.setDimensions(
                { width: baseWidth, height: baseHeight },
                { backstoreOnly: true }
            );

            // 2. Set Visual (CSS) Dimension to Scaled Size
            // We apply this via Fabric API first
            canvasInstance.setDimensions(
                { width: cssWidth, height: cssHeight },
                { cssOnly: true }
            );

            // 3. MANUAL OVERRIDE: Force styles on all wrapper elements
            // Fabric sometimes misses the wrapper or upper-canvas sync in React StrictMode
            const lower = canvasInstance.getElement(); // <canvas>
            const upper = canvasInstance.getSelectionElement(); // <canvas class="upper-canvas">
            // @ts-ignore
            const wrapper = canvasInstance.wrapperEl; // <div class="canvas-container">

            if (lower) {
                lower.style.width = `${cssWidth}px`;
                lower.style.height = `${cssHeight}px`;
            }
            if (upper) {
                upper.style.width = `${cssWidth}px`;
                upper.style.height = `${cssHeight}px`;
                upper.style.left = '0px';
                upper.style.top = '0px';
            }
            if (wrapper) {
                wrapper.style.width = `${cssWidth}px`;
                wrapper.style.height = `${cssHeight}px`;
            }

            // Ensure Zoom is 1 (Natural 1:1 mapping of content to logical pixels)
            canvasInstance.setZoom(1);

            canvasInstance.calcOffset();
            canvasInstance.requestRenderAll();
        }
    }, [canvasInstance, scale, baseWidth, baseHeight]);

    // Sync Background Color
    useEffect(() => {
        if (canvasInstance) {
            canvasInstance.backgroundColor = design.backgroundColor;
            canvasInstance.requestRenderAll();
        }
    }, [canvasInstance, design.backgroundColor]);

    // Template Loading Flow
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || initialJSON) return;

        setIsProcessing(true);
        const templateConfig = dynamicTemplates.find(t => t.id === design.templateId);

        const savedJSON = !isReadOnly ? localStorage.getItem('signage_canvas_json') : null;
        if (!hasInitialLoadRef.current && savedJSON) {
            hasInitialLoadRef.current = true;
            setIsProcessing(false);
            return;
        }
        hasInitialLoadRef.current = true;

        const finalizeLoad = () => {
            setIsProcessing(false);
            saveHistory(canvas);
        };

        if (design.templateId === 'custom') {
            canvas.getObjects().forEach(obj => {
                if (!((obj as any).name === 'background' || (obj as any).isBackground)) canvas.remove(obj);
            });
            finalizeLoad();
            return;
        }

        if (templateConfig) {
            if (templateConfig.fabricConfig) {
                canvas.loadFromJSON(templateConfig.fabricConfig, () => {
                    // NEW SCALING LOGIC (100 DPI Standard) with Content Bounds Detection
                    const canvasWidth = canvas.getWidth();
                    const canvasHeight = canvas.getHeight();

                    console.log(`[TEMPLATE DEBUG] Loading ${design.templateId}`);
                    console.log(`[TEMPLATE DEBUG] Canvas: ${canvasWidth}x${canvasHeight}`);

                    // 1. Calculate Content Bounding Box
                    // Some templates have huge coordinates (e.g. 40,000px). We need to find the real bounds.
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    let hasObjects = false;

                    canvas.getObjects().forEach((obj: any) => {
                        if (obj.name === 'background' || obj.isBackground) return; // Skip background for bounds detection

                        hasObjects = true;
                        // Use getBoundingRect to find absolute bounds
                        const br = obj.getBoundingRect(true, true);
                        if (br.left < minX) minX = br.left;
                        if (br.top < minY) minY = br.top;
                        if (br.left + br.width > maxX) maxX = br.left + br.width;
                        if (br.top + br.height > maxY) maxY = br.top + br.height;
                    });

                    // 2. Determine Template Source Size & Offsets
                    let templateWidth = 1800;
                    let templateHeight = 1200;
                    let offsetX = 0;
                    let offsetY = 0;

                    if (hasObjects && minX !== Infinity) {
                        const contentWidth = maxX - minX;
                        const contentHeight = maxY - minY;

                        // Heuristic: If content is massive (> 3000) or way off origin (> 1000), use bounds
                        if (contentWidth > 3000 || contentHeight > 3000 || minX > 1000 || minY > 1000) {
                            console.log(`[TEMPLATE DEBUG] Massive coordinates detected. Normalizing from bounds: ${minX},${minY} to ${maxX},${maxY}`);
                            templateWidth = contentWidth;
                            templateHeight = contentHeight;
                            offsetX = -minX; // We need to shift objects back to 0
                            offsetY = -minY;
                        } else {
                            // Fallback to standard background check if available
                            const bg = templateConfig.fabricConfig.objects.find((o: any) => o.name === 'background' || o.isBackground);
                            if (bg?.width && bg?.height) {
                                templateWidth = bg.width * (bg.scaleX || 1);
                                templateHeight = bg.height * (bg.scaleY || 1);
                            }
                        }
                    }

                    // 3. Calculate Scale Factor
                    const scaleX = canvasWidth / templateWidth;
                    const scaleY = canvasHeight / templateHeight;
                    const scaleFactor = Math.min(scaleX, scaleY);

                    console.log(`[TEMPLATE DEBUG] Source: ${templateWidth}x${templateHeight}, Offset: ${offsetX},${offsetY}, Scale: ${scaleFactor}`);

                    // 4. Apply Scaling & Centering
                    canvas.getObjects().forEach((obj: any, index) => {
                        // Apply offset first (normalization), then scale
                        const originalLeft = obj.left || 0;
                        const originalTop = obj.top || 0;

                        // If we are normalizing, we shift then scale.
                        // If not, offsetX/Y is 0, so it works as before.
                        obj.set({
                            left: (originalLeft + offsetX) * scaleX,
                            top: (originalTop + offsetY) * scaleY,
                            scaleX: (obj.scaleX || 1) * scaleX,
                            scaleY: (obj.scaleY || 1) * scaleY,
                            selectable: true,
                            evented: true
                        });
                        obj.setCoords();
                    });


                    // Sync Background to Design State
                    const bgObj = canvas.getObjects().find(o => (o as any).name === 'background');
                    if (bgObj && onDesignChange) {
                        const fill = bgObj.fill;
                        if (typeof fill === 'string') {
                            // Solid Color
                            onDesignChange({
                                ...design,
                                backgroundColor: fill,
                                backgroundGradientEnabled: false
                            });
                        } else if (typeof fill === 'object' && (fill as any).type === 'linear') {
                            // Gradient (Basic Sync)
                            const grad = fill as any;
                            if (grad.colorStops && grad.colorStops.length >= 2) {
                                onDesignChange({
                                    ...design,
                                    backgroundGradientEnabled: true,
                                    backgroundColor: grad.colorStops[0].color,
                                    backgroundColor2: grad.colorStops[1].color,
                                    // Angle calculation is complex from coords, skipping for valid defaults or preserving current
                                });
                            }
                        }
                    }


                    // Don't call updateTemplateContent for fabricConfig templates
                    // They already have their objects in the JSON
                    canvas.requestRenderAll();
                    finalizeLoad();
                });
            } else if (templateConfig.svgPath) {
                fetch(templateConfig.svgPath).then(r => r.text()).then(svgText => {
                    renderSVGTemplate(templateConfig.components, svgText);
                    finalizeLoad();
                });
            } else {
                updateTemplateContent();
                finalizeLoad();
            }
        } else {
            updateTemplateContent();
            finalizeLoad();
        }
    }, [design.templateId, dynamicTemplates, setIsProcessing, saveHistory, initialJSON, baseWidth, baseHeight]);

    // Prop sync
    useEffect(() => { updateTemplateContent(); }, [data, design]);

    // Prop Registration
    useEffect(() => {
        onAddText?.(addText);
        onAddIcon?.(addIcon);
        onAddShape?.(addShape);
        onAddImage?.(addImage);
        onToolbarAction?.(handleAction);
    }, [onAddText, onAddIcon, onAddShape, onAddImage, onToolbarAction, addText, addIcon, addShape, addImage, handleAction]);

    const handleToolbarDragStart = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const parent = e.currentTarget.parentElement;
        if (!parent) return;
        const parentRect = parent.getBoundingClientRect();

        const currentX = rect.left - parentRect.left;
        const currentY = rect.top - parentRect.top;

        if (!toolbarPos) {
            setToolbarPos({ x: currentX, y: currentY });
        }

        setIsDragging(true);
        setDragStartPos({
            x: e.clientX - currentX,
            y: e.clientY - currentY
        });
    };

    useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            setToolbarPos({
                x: e.clientX - dragStartPos.x,
                y: e.clientY - dragStartPos.y
            });
        };
        const handleMouseUp = () => setIsDragging(false);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStartPos]);

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

    return (
        <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-50 flex flex-col min-h-0">
            {/* Formatting Toolbar (Rendered in Header via Portal) */}
            {selectedObject && !isReadOnly && typeof document !== 'undefined' && document.getElementById('toolbar-header-target') && (
                createPortal(
                    <TextFormatToolbar
                        selectedObject={selectedObject}
                        onUpdate={() => { canvasInstance?.requestRenderAll(); saveHistory(canvasInstance!); }}
                        onFontSizeChange={(size) => onDesignChange?.({ ...design, companyNameSize: size })}
                        onFontFamilyChange={(font) => onDesignChange?.({ ...design, fontFamily: font })}
                        onColorChange={(color) => onDesignChange?.({ ...design, textColor: color })}
                        onDuplicate={() => handleAction('duplicate')}
                        onDelete={() => handleAction('delete')}
                        onLockToggle={() => handleAction('lock')}
                        onAction={handleAction}
                    />,
                    document.getElementById('toolbar-header-target')!
                )
            )}

            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div ref={containerRef} className="w-full h-full flex items-center justify-center relative overflow-hidden bg-transparent" onContextMenu={handleContextMenu}>
                    <div className="bg-white rounded-sm shadow-2xl relative flex items-center justify-center shrink-0" style={{ width: baseWidth * scale, height: baseHeight * scale }}>
                        <canvas ref={canvasRef} />
                        {selectedObject && floatingToolbarPos && !isReadOnly && (
                            <FloatingSelectionToolbar
                                x={floatingToolbarPos.x}
                                y={floatingToolbarPos.y}
                                isLocked={!!selectedObject.lockMovementX}
                                onLockToggle={() => handleAction('lock')}
                                onDuplicate={() => handleAction('duplicate')}
                                onDelete={() => handleAction('delete')}
                                onMore={() => {
                                    setContextMenu({ x: floatingToolbarPos.x, y: floatingToolbarPos.y + 40 });
                                }}
                            />
                        )}
                        {hasSafetyViolation && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-1.5 px-3 py-1 bg-[#cc0000] rounded-full shadow-lg ring-1 ring-white/20">
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">Danger zone</span>
                            </div>
                        )}
                        {rotationAngle !== null && selectedObject && (
                            <div
                                className="absolute z-[60] px-2 py-1 bg-[#3b82f6] rounded shadow-lg animate-in fade-in zoom-in-95 duration-200"
                                style={{
                                    left: (selectedObject.getCenterPoint().x) * scale,
                                    top: (selectedObject.getBoundingRect().top * scale) - 40,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                <span className="text-xs font-bold text-white whitespace-nowrap">{rotationAngle}°</span>
                            </div>
                        )}
                    </div>

                    {contextMenu && !isReadOnly && (
                        <CanvasContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            onClose={() => setContextMenu(null)}
                            onAction={handleAction}
                            hasSelection={!!selectedObject}
                            isLocked={!!selectedObject?.lockMovementX}
                            isGroup={selectedObject?.type === 'group'}
                            isMultiple={selectedObject?.type === 'activeSelection'}
                            isBackground={!!(selectedObject as any)?.isBackground}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
