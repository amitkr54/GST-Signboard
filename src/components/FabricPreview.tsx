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
        const DPI = 75;
        let w = design.width;
        let h = design.height;
        const u = design.unit || 'in';
        if (u === 'in') { w *= DPI; h *= DPI; }
        else if (u === 'cm') { w *= (DPI / 2.54); h *= (DPI / 2.54); }
        else if (u === 'mm') { w *= (DPI / 25.4); h *= (DPI / 25.4); }
        console.log(`[FabricPreview] Dimensions: ${design.width}x${design.height} ${u} -> ${w}x${h} px`);
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
        const fetchTemplates = async () => {
            const templates = await getTemplates();
            if (templates && templates.length > 0) setDynamicTemplates(templates as any);
        };
        fetchTemplates();
    }, []);

    // 4. Default Toolbar Positioning
    useEffect(() => {
        if (selectedObject && !hasMovedToolbar && containerRef.current) {
            const containerWidth = containerRef.current.offsetWidth;
            // Center the toolbar (assuming ~600px width for the toolbar itself, so offset by 300)
            // 20px from top is a nice "header-like" default.
            setToolbarPos({ x: (containerWidth / 2) - 300, y: 20 });
        }
    }, [!!selectedObject, hasMovedToolbar]);

    // Canvas Initialization
    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        console.log(`[FabricPreview] Initializing Canvas ${baseWidth}x${baseHeight} (isReadOnly: ${isReadOnly})`);

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: baseWidth, height: baseHeight, backgroundColor: design.backgroundColor,
            selection: !isReadOnly, renderOnAddRemove: true, preserveObjectStacking: true
        });


        fabric.Object.prototype.set({
            borderColor: '#E53935', cornerColor: '#ffffff', cornerStrokeColor: '#E53935',
            cornerSize: 14, transparentCorners: false, padding: 0, cornerStyle: 'circle',
            borderScaleFactor: 2.5
        });

        fabricCanvasRef.current = canvas;
        setCanvasInstance(canvas);

        // Attach to window for global access - ONLY if not read only
        if (!isReadOnly) {
            (window as any).fabricCanvas = canvas;
        }

        // Initialize alignment guidelines
        const disposeGuidelines = initAligningGuidelines(canvas);

        if (onMount) onMount(canvas);

        return () => {
            console.log('[FabricPreview] Disposing Canvas');
            if (disposeGuidelines) disposeGuidelines();
            canvas.dispose();
            fabricCanvasRef.current = null;
            setCanvasInstance(null);
            if (!isReadOnly && (window as any).fabricCanvas === canvas) {
                delete (window as any).fabricCanvas;
            }
        };
    }, []);

    // JSON Loading Logic (initialJSON or localStorage)
    // JSON Loading Logic (initialJSON or localStorage or initialSVG)
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Reset canvas first if we are loading new initial data (important for template switching)
        // Note: For now we rely on the component mount/unmount cycle or simple replacement for template switching

        const loadObjects = (objects: fabric.Object[], options?: any) => {
            // Logic to process loaded objects (similar to JSON load callback)
            if (options && options.objects) objects = options.objects; // Handle JSON structure if needed but loadFromJSON handles it.

            // If passing objects directly (like from SVG)
            const group = new fabric.Group(objects);
            const items = group.getObjects();
            // We can just add them individually or as a group.
            // If SVG, usually we want ungrouped?

            // Better: fabric.loadSVGFromString provides (objects, options)
            // objects is array of fabric.Object.

            objects.forEach((obj) => {
                const isBackground = (obj as any).name === 'background' || (obj as any).isBackground === true;
                obj.set({
                    borderColor: '#E53935',
                    cornerColor: '#ffffff',
                    cornerStrokeColor: '#E53935',
                    cornerSize: 14,
                    transparentCorners: false,
                    padding: 0,
                    cornerStyle: 'circle',
                    borderScaleFactor: 2.5,
                    selectable: isBackground ? false : !isReadOnly,
                    evented: isBackground ? false : !isReadOnly,
                    lockMovementX: isBackground ? true : undefined,
                    lockMovementY: isBackground ? true : undefined,
                });
                canvas.add(obj);
            });

            // Re-apply scaling and zoom after load
            const currentScale = lastScaleRef.current;
            canvas.setDimensions({ width: baseWidth * currentScale, height: baseHeight * currentScale });
            canvas.setZoom(currentScale);
            canvas.renderAll();

            setIsProcessing(false);
        };

        const savedJSON = initialJSON || (!isReadOnly && !initialSVG ? localStorage.getItem('signage_canvas_json') : null);

        if (initialSVG) {
            console.log(`[FabricPreview] Loading SVG`);
            setIsProcessing(true);
            canvas.clear();
            fabric.loadSVGFromString(initialSVG, (objects, options) => {
                // Adjust size if needed? 
                // We should scale to fit? Or assume SVG is correct size?
                // For now, assume correct size but let's see. 
                // Often templates are saved with specific viewBox.
                loadObjects(objects);
                console.log(`[FabricPreview] SVG Load Complete`);
            });
        } else if (savedJSON) {
            console.log(`[FabricPreview] Loading JSON (isReadOnly: ${isReadOnly})`);
            try {
                setIsProcessing(true);
                canvas.loadFromJSON(savedJSON, () => {
                    canvas.getObjects().forEach((obj) => {
                        const isBackground = (obj as any).name === 'background' || (obj as any).isBackground === true;
                        obj.set({
                            borderColor: '#E53935',
                            cornerColor: '#ffffff',
                            cornerStrokeColor: '#E53935',
                            cornerSize: 14,
                            transparentCorners: false,
                            padding: 0,
                            cornerStyle: 'circle',
                            borderScaleFactor: 2.5,
                            selectable: isBackground ? false : !isReadOnly,
                            evented: isBackground ? false : !isReadOnly,
                            lockMovementX: isBackground ? true : undefined,
                            lockMovementY: isBackground ? true : undefined,
                        });
                    });

                    // CRITICAL: Re-apply scaling and zoom after load
                    const currentScale = lastScaleRef.current;
                    canvas.setDimensions({ width: baseWidth * currentScale, height: baseHeight * currentScale });
                    canvas.setZoom(currentScale);
                    canvas.renderAll();

                    setInitialHistory(savedJSON);
                    setIsProcessing(false);
                    console.log(`[FabricPreview] JSON Load Complete, Scale: ${currentScale}, Object Count: ${canvas.getObjects().length}`);
                    canvas.getObjects().forEach((obj, i) => {
                        console.log(`[FabricPreview] Object ${i}: type=${obj.type}, name=${(obj as any).name}, visible=${obj.visible}, opacity=${obj.opacity}, zIndex=${canvas.getObjects().indexOf(obj)}`);
                    });
                });
            } catch (err) {
                console.error('[FabricPreview] Restore failed', err);
                setIsProcessing(false);
            }
        }
    }, [canvasInstance, initialJSON, initialSVG, isReadOnly, baseWidth, baseHeight]);

    // Font Loading Listener
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).document?.fonts) {
            const handleFontsReady = () => {
                const canvas = fabricCanvasRef.current;
                if (!canvas) return;

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
    }, [baseWidth, baseHeight]);

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
                    activeObject.clone((cloned: fabric.Object | fabric.Group) => {
                        canvas.discardActiveObject();
                        cloned.set({
                            left: (cloned.left || 0) + 10,
                            top: (cloned.top || 0) + 10,
                            evented: true,
                        });
                        if (cloned.type === 'activeSelection' || cloned.type === 'group') {
                            cloned.canvas = canvas;
                            (cloned as any).forEachObject((obj: fabric.Object) => canvas.add(obj));
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
    }, [baseWidth, baseHeight, saveHistory, checkSafetyArea]);

    // Scaling Logic
    useEffect(() => {
        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;

            const targetWidth = container.clientWidth;
            const targetHeight = container.clientHeight;

            // If dimensions are 0 (hidden or mounting), don't update scale yet
            if (targetWidth === 0 || targetHeight === 0) {
                console.log('[FabricPreview] Skipping scale update - container size is 0');
                return;
            }

            const sc = Math.max(0.1, Math.min(1.0, (targetWidth * 0.95) / baseWidth, (targetHeight * 0.95) / baseHeight));
            if (Math.abs(sc - lastScaleRef.current) > 0.0001) {
                console.log(`[FabricPreview] Updating scale: ${lastScaleRef.current} -> ${sc} (${targetWidth}x${targetHeight})`);
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
        const templateId = design.templateId;
        const templateConfig = dynamicTemplates.find(t => t.id === templateId);

        // Session Restoration Safeguard:
        // If this is the initial mount AND we have a saved JSON in localStorage,
        // we skip the template load to prevent overwriting user customizations.
        const savedJSON = !isReadOnly ? localStorage.getItem('signage_canvas_json') : null;
        if (!hasInitialLoadRef.current && savedJSON && !initialJSON) {
            console.log('[FabricPreview] Skipping initial template load - saved session found');
            hasInitialLoadRef.current = true;
            setIsProcessing(false);
            return;
        }
        hasInitialLoadRef.current = true;

        // Remove existing template objects
        canvas.getObjects().forEach(obj => {
            if ((obj as any).name?.startsWith('template_')) canvas.remove(obj);
        });

        const finalizeLoad = () => {
            setIsProcessing(false);
            saveHistory(canvas);
        };

        if (design.templateId === 'custom') {
            // CRITICAL: For "Blank Canvas", explicitly clear EVERYTHING except background
            canvas.getObjects().forEach(obj => {
                const isBg = (obj as any).name === 'background' || (obj as any).isBackground;
                if (!isBg) canvas.remove(obj);
            });
            canvas.requestRenderAll();
            finalizeLoad();
            return;
        }

        if (templateConfig) {
            if (templateConfig.fabricConfig) {
                // ... (rest of logic)
                canvas.loadFromJSON(templateConfig.fabricConfig, () => {
                    canvas.getObjects().forEach((obj: any) => {
                        if (obj.type === 'text' && obj.text) {
                            const newTxt = new fabric.Textbox(obj.text, { ...obj.toObject(), type: 'textbox', selectable: true, evented: true, editable: true });
                            canvas.remove(obj);
                            canvas.add(newTxt);
                        } else obj.set({ selectable: true, evented: true });
                    });

                    // Re-apply scaling and zoom after template load
                    canvas.setDimensions({ width: baseWidth * scale, height: baseHeight * scale });
                    canvas.setZoom(scale);
                    canvas.renderAll();

                    updateTemplateContent();
                    finalizeLoad();
                });
            } else if (templateConfig.svgPath) {
                fetch(templateConfig.svgPath)
                    .then(r => r.text())
                    .then(svgText => {
                        renderSVGTemplate(templateConfig.components, svgText);
                        finalizeLoad();
                    });
            } else {
                updateTemplateContent();
                finalizeLoad();
            }
        } else {
            // No template config found (could be initial load or unknown ID)
            // Just update content, don't clear everything unless it was explicit 'custom'
            updateTemplateContent();
            finalizeLoad();
        }
    }, [design.templateId, dynamicTemplates, setIsProcessing, saveHistory, initialJSON, baseWidth, baseHeight]);

    // Prop sync
    useEffect(() => { updateTemplateContent(); }, [data, design.backgroundColor, design.fontFamily, design.textColor, design.fontSize, design.companyNameSize]);

    // Debounced History Save
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || isReadOnly) return;
        const timer = setTimeout(() => {
            saveHistory(canvas);
        }, 500);
        return () => clearTimeout(timer);
    }, [design, saveHistory, isReadOnly]);

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
        setDragStartPos({
            x: e.clientX - toolbarPos.x,
            y: e.clientY - toolbarPos.y
        });
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setToolbarPos({
                x: e.clientX - dragStartPos.x,
                y: e.clientY - dragStartPos.y
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStartPos]);

    return (
        <div className="flex-1 w-full h-full relative overflow-hidden bg-slate-50 flex flex-col min-h-0">
            {/* Draggable Toolbar */}
            {selectedObject && !isReadOnly && !compact && (
                <div
                    className="fixed z-[1000]"
                    style={{
                        left: `${toolbarPos.x}px`,
                        top: `${toolbarPos.y}px`,
                        transition: isDragging ? 'none' : 'box-shadow 0.2s'
                    }}
                >
                    <TextFormatToolbar
                        selectedObject={selectedObject}
                        compact={false}
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
                        onDragStart={handleToolbarDragStart}
                    />
                </div>
            )}

            {/* Mobile Toolbar */}
            {selectedObject && !isReadOnly && compact && (
                <TextFormatToolbar
                    selectedObject={selectedObject}
                    compact={true}
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

            {/* Main Canvas Container */}
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

                    {contextMenu && !isReadOnly && (
                        <CanvasContextMenu x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onAction={handleAction} hasSelection={!!selectedObject} isLocked={!!selectedObject?.lockMovementX} />
                    )}
                </div>
            </div>
        </div>
    );
}
