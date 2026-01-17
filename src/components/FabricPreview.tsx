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
    const [copiedStyle, setCopiedStyle] = useState<any>(null);
    const [hasSafetyViolation, setHasSafetyViolation] = useState(false);
    const [toolbarPos, setToolbarPos] = useState({ x: 200, y: 100 });
    const [hasMovedToolbar, setHasMovedToolbar] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
    const hasInitialLoadRef = useRef(false);

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
        onSafetyChange: setHasSafetyViolation
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

        fabric.Object.prototype.set({
            borderColor: '#E53935',
            cornerColor: '#ffffff',
            cornerStrokeColor: '#E53935',
            cornerSize: 14,
            transparentCorners: false,
            padding: 0,
            cornerStyle: 'circle',
            borderScaleFactor: 2.5
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

    const handleAction = useCallback((action: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();

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
                        obj.set(copiedStyle);
                        if (obj.type?.includes('text') || obj.type === 'textbox') {
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
                    const objs = [...selection.getObjects()].sort((a, b) => a.left! - b.left!);
                    if (objs.length > 2) {
                        const first = objs[0];
                        const last = objs[objs.length - 1];
                        const totalSpread = last.left! - first.left!;
                        const gap = totalSpread / (objs.length - 1);
                        objs.forEach((obj, i) => {
                            obj.set('left', first.left! + (i * gap));
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
                    const objs = [...selection.getObjects()].sort((a, b) => a.top! - b.top!);
                    if (objs.length > 2) {
                        const first = objs[0];
                        const last = objs[objs.length - 1];
                        const totalSpread = last.top! - first.top!;
                        const gap = totalSpread / (objs.length - 1);
                        objs.forEach((obj, i) => {
                            obj.set('top', first.top! + (i * gap));
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
                    (activeObject as any).isBackground = true;
                    (activeObject as any).name = 'background';
                    activeObject.set({
                        selectable: false,
                        evented: false,
                        lockMovementX: true,
                        lockMovementY: true
                    } as any);
                    const bgIdx = canvas.getObjects().findIndex(o => (o as any).name === 'background');
                    if (bgIdx !== -1) activeObject.moveTo(bgIdx + 1);
                    else activeObject.sendToBack();
                    saveHistory(canvas);
                    checkSafetyArea(canvas);
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
                        const rect = activeObject.getBoundingRect(true);
                        activeObject.set('left', activeObject.left! - rect.left);
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
                        activeObject.centerH();
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
                        const rect = activeObject.getBoundingRect(true);
                        activeObject.set('left', baseWidth - rect.width + (activeObject.left! - rect.left));
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
                        const rect = activeObject.getBoundingRect(true);
                        activeObject.set('top', activeObject.top! - rect.top);
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
                        activeObject.centerV();
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
                        const rect = activeObject.getBoundingRect(true);
                        activeObject.set('top', baseHeight - rect.height + (activeObject.top! - rect.top));
                        activeObject.setCoords();
                    }
                    saveHistory(canvas);
                }
                break;
            case 'align-card-left':
                if (activeObject) {
                    const rect = activeObject.getBoundingRect(true);
                    activeObject.set('left', activeObject.left! - rect.left);
                    activeObject.setCoords();
                    saveHistory(canvas);
                }
                break;
            case 'align-card-center':
                if (activeObject) {
                    activeObject.centerH();
                    activeObject.setCoords();
                    saveHistory(canvas);
                }
                break;
            case 'align-card-right':
                if (activeObject) {
                    const rect = activeObject.getBoundingRect(true);
                    activeObject.set('left', baseWidth - rect.width + (activeObject.left! - rect.left));
                    activeObject.setCoords();
                    saveHistory(canvas);
                }
                break;
            case 'align-card-top':
                if (activeObject) {
                    const rect = activeObject.getBoundingRect(true);
                    activeObject.set('top', activeObject.top! - rect.top);
                    activeObject.setCoords();
                    saveHistory(canvas);
                }
                break;
            case 'align-card-middle':
                if (activeObject) {
                    activeObject.centerV();
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
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => { ro.disconnect(); window.removeEventListener('resize', updateScale); };
    }, [baseWidth, baseHeight]);

    // Apply Scaling to Canvas
    useEffect(() => {
        if (canvasInstance) {
            canvasInstance.setDimensions({ width: baseWidth * scale, height: baseHeight * scale });
            canvasInstance.setZoom(scale);
            canvasInstance.calcOffset();
            canvasInstance.requestRenderAll();
        }
    }, [canvasInstance, scale, baseWidth, baseHeight]);

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
                    canvas.getObjects().forEach((obj: any) => {
                        obj.set({ selectable: true, evented: true });
                    });
                    updateTemplateContent();
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
    }, [onAddText, onAddIcon, onAddShape, onAddImage, addText, addIcon, addShape, addImage]);

    const handleToolbarDragStart = (e: React.MouseEvent) => {
        setIsDragging(true);
        setHasMovedToolbar(true);
        setDragStartPos({ x: e.clientX - toolbarPos.x, y: e.clientY - toolbarPos.y });
    };

    useEffect(() => {
        if (!isDragging) return;
        const handleMouseMove = (e: MouseEvent) => setToolbarPos({ x: e.clientX - dragStartPos.x, y: e.clientY - dragStartPos.y });
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
            {selectedObject && !isReadOnly && !compact && (
                <div className="fixed z-[1000]" style={{ left: `${toolbarPos.x}px`, top: `${toolbarPos.y}px` }}>
                    <TextFormatToolbar
                        selectedObject={selectedObject}
                        onUpdate={() => { canvasInstance?.requestRenderAll(); saveHistory(canvasInstance!); }}
                        onAction={handleAction}
                        onDragStart={handleToolbarDragStart}
                        onDuplicate={() => handleAction('duplicate')}
                        onDelete={() => handleAction('delete')}
                        onLockToggle={() => handleAction('lock')}
                    />
                </div>
            )}

            {/* Mobile Toolbar */}
            {selectedObject && !isReadOnly && compact && (
                <TextFormatToolbar
                    selectedObject={selectedObject}
                    compact={true}
                    isLandscape={isLandscape}
                    onUpdate={() => { canvasInstance?.requestRenderAll(); saveHistory(canvasInstance!); }}
                    onFontSizeChange={(size) => onDesignChange?.({ ...design, companyNameSize: size })}
                    onFontFamilyChange={(font) => onDesignChange?.({ ...design, fontFamily: font })}
                    onColorChange={(color) => onDesignChange?.({ ...design, textColor: color })}
                    onDuplicate={() => handleAction('duplicate')}
                    onDelete={() => handleAction('delete')}
                    onLockToggle={() => handleAction('lock')}
                    onAction={handleAction}
                />
            )}

            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div ref={containerRef} className="w-full h-full flex items-center justify-center relative overflow-hidden bg-transparent" onContextMenu={handleContextMenu}>
                    <div className="bg-white rounded-sm shadow-2xl relative flex items-center justify-center shrink-0" style={{ width: baseWidth * scale, height: baseHeight * scale }}>
                        <canvas ref={canvasRef} />
                        {hasSafetyViolation && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-[40] flex items-center gap-1.5 px-3 py-1 bg-[#cc0000] rounded-full shadow-lg ring-1 ring-white/20">
                                <span className="text-[11px] font-black text-white uppercase tracking-wider">Danger zone</span>
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
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
