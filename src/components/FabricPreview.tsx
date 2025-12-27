'use client';

import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { SignageData, DesignConfig } from '@/lib/types';
import { MaterialId } from '@/lib/utils';
import { LAYOUT } from '@/lib/layout-constants';
import { TEMPLATES } from '@/lib/templates';
import { getTemplates } from '@/app/actions';
import { TextFormatToolbar } from './TextFormatToolbar';
import { initAligningGuidelines } from '@/lib/fabric-aligning-guidelines';

interface FabricPreviewProps {
    data: SignageData;
    design: DesignConfig;
    material?: MaterialId;
    onMount?: (canvas: fabric.Canvas) => void;
    onDesignChange?: (design: DesignConfig) => void;
    onAddText?: (addFn: (type: 'heading' | 'subheading' | 'body') => void) => void;
    onAddIcon?: (addFn: (iconName: string) => void) => void;
    onAddShape?: (addFn: (type: 'rect' | 'circle' | 'line' | 'triangle') => void) => void;
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
    const [scale, setScale] = useState(0.1); // Start small to avoid cropping flash
    const [canvasInstance, setCanvasInstance] = useState<fabric.Canvas | null>(null);
    const lastScaleRef = useRef<number>(0.1);
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [dynamicTemplates, setDynamicTemplates] = useState<typeof TEMPLATES>(TEMPLATES);
    const [isStabilized, setIsStabilized] = useState(false);
    const [debug, setDebug] = useState({
        win: { w: 0, h: 0 },
        container: { w: 0, h: 0 },
        avail: { w: 0, h: 0 },
        scale: 0
    });

    // Initial stabilization delay
    useEffect(() => {
        const timer = setTimeout(() => setIsStabilized(true), 800);
        return () => clearTimeout(timer);
    }, []);

    // Fetch templates
    useEffect(() => {
        const fetchTemplates = async () => {
            const templates = await getTemplates();
            if (templates && templates.length > 0) {
                setDynamicTemplates(templates as any);
            }
        };
        fetchTemplates();
    }, []);

    // Canvas Initialization
    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: LAYOUT.WIDTH,
            height: LAYOUT.HEIGHT,
            backgroundColor: design.backgroundColor,
            selection: true,
            renderOnAddRemove: true,
            selectionColor: 'rgba(125, 42, 232, 0.1)',
            selectionBorderColor: '#7D2AE8',
            selectionLineWidth: 2,
            preserveObjectStacking: true
        });

        fabric.Object.prototype.set({
            borderColor: '#7D2AE8',
            cornerColor: '#ffffff',
            cornerStrokeColor: '#7D2AE8',
            cornerSize: 12,
            transparentCorners: false,
            padding: 10,
            cornerStyle: 'circle'
        });

        fabricCanvasRef.current = canvas;
        setCanvasInstance(canvas);
        if (onMount) onMount(canvas);

        return () => {
            canvas.dispose();
            fabricCanvasRef.current = null;
            setCanvasInstance(null);
        };
    }, []);

    // --- SCALING ENGINE ---
    useEffect(() => {
        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;

            // 1. MEASUREMENT: Prioritize actual container size
            const winH = typeof window !== 'undefined' ? window.innerHeight : 1000;
            const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
            const containerH = container.clientHeight;
            const containerW = container.clientWidth;

            // 2. UI OFFSETS (Only used as fallbacks if container is not ready)
            const HEADER_H = 48;
            const TOOLBAR_H = compact ? 0 : 44;
            const VERT_GUTTER = 40;

            // 3. TARGET AREA CALCULATION
            // Fallback to Window estimation ONLY if container is zero (first frame)
            const trueAvailH = containerH > 50 ? containerH : Math.max(100, winH - (HEADER_H + TOOLBAR_H + VERT_GUTTER));
            const trueAvailW = containerW > 50 ? containerW : (winW * 0.6);

            // 4. BEST FIT (Standard board 1800x1200)
            // Use 94% for safety, but 96% on tiny screens (mobile) to maximize area
            const paddingScale = trueAvailH < 400 ? 0.96 : 0.94;
            const targetW = trueAvailW * paddingScale;
            const targetH = trueAvailH * paddingScale;

            let sc = Math.min(targetW / LAYOUT.WIDTH, targetH / LAYOUT.HEIGHT);

            // 5. HARD CAPS
            sc = Math.min(sc, 1.0);
            sc = Math.max(0.1, sc);

            // 6. APPLY
            const roundedSc = Math.round(sc * 10000) / 10000;

            // diagnostic log
            console.log('[Scaling Debug]', {
                container: { w: containerW, h: containerH },
                avail: { w: trueAvailW, h: trueAvailH },
                target: { w: targetW, h: targetH },
                scale: roundedSc
            });

            setDebug({
                win: { w: winW, h: winH },
                container: { w: Math.round(containerW), h: Math.round(containerH) },
                avail: { w: Math.round(trueAvailW), h: Math.round(trueAvailH) },
                scale: roundedSc
            });

            if (Math.abs(sc - lastScaleRef.current) > 0.0001) {
                lastScaleRef.current = sc;
                setScale(sc);
            }
        };

        const ro = new ResizeObserver(() => {
            requestAnimationFrame(updateScale);
        });

        if (containerRef.current) {
            ro.observe(containerRef.current);
        }

        updateScale();
        const timers = [10, 50, 150, 300, 600, 1000, 2000].map(d => setTimeout(updateScale, d));
        window.addEventListener('resize', updateScale);

        return () => {
            ro.disconnect();
            timers.forEach(clearTimeout);
            window.removeEventListener('resize', updateScale);
        };
    }, [compact]);

    // Sync scaling to fabric
    useEffect(() => {
        if (canvasInstance) {
            canvasInstance.setDimensions({
                width: LAYOUT.WIDTH * scale,
                height: LAYOUT.HEIGHT * scale
            });
            canvasInstance.setZoom(scale);
            canvasInstance.calcOffset();
            canvasInstance.requestRenderAll();
        }
    }, [canvasInstance, scale]);

    // Template Loading & Logic
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const templateId = design.templateId || '';
        const templateConfig = dynamicTemplates.find(t => t.id === templateId);

        canvas.getObjects().forEach(obj => {
            if ((obj as any).name?.startsWith('template_')) canvas.remove(obj);
        });

        if (templateConfig) {
            const renderTemplate = (comps: any, isSvgFallback: boolean = false, svgText?: string) => {
                const { WIDTH, HEIGHT } = LAYOUT;
                let vbX = 0, vbY = 0, vbW = WIDTH, vbH = HEIGHT;

                if (comps?.originalViewBox) {
                    [vbX, vbY, vbW, vbH] = comps.originalViewBox;
                } else if (isSvgFallback && svgText) {
                    const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/i);
                    if (vbMatch) [vbX, vbY, vbW, vbH] = vbMatch[1].split(/[\s,]+/).map(Number);
                }

                const sc = Math.min(WIDTH / vbW, HEIGHT / vbH);
                const ox = (WIDTH - vbW * sc) / 2;
                const oy = (HEIGHT - vbH * sc) / 2;

                const renderText = () => {
                    if (comps.text) {
                        comps.text.forEach((c: any, j: number) => {
                            const txt = new fabric.Textbox(c.text, {
                                left: (c.left - vbX) * sc + ox,
                                top: (c.top - vbY) * sc + oy,
                                fontSize: (c.fontSize || 40) * sc,
                                fontFamily: c.fontFamily || 'Arial',
                                textAlign: c.textAlign || 'left',
                                fill: c.fill || '#000',
                                width: (c.width || (vbW * 0.8)) * sc,
                                selectable: true,
                                evented: true,
                                name: j === 0 ? 'template_company' : 'template_svg_text'
                            });
                            canvas.add(txt);
                        });
                    }
                    updateTemplateContent();
                };

                if (comps?.backgroundObjects?.length > 0) {
                    const svgInner = comps.backgroundObjects.map((obj: any) => {
                        const styleStr = obj.styles ? Object.entries(obj.styles).map(([k, v]) => `${k}:${v}`).join(';') : '';
                        return `<${obj.type} ${obj.attributes} style="${styleStr}" />`;
                    }).join('');
                    const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">${svgInner}</svg>`;
                    fabric.loadSVGFromString(svgFull, (objs) => {
                        objs.forEach(obj => {
                            obj.set({
                                selectable: true,
                                left: (obj.left || 0) * sc + ox,
                                top: (obj.top || 0) * sc + oy,
                                scaleX: sc,
                                scaleY: sc,
                                name: 'template_svg_background_object'
                            });
                            canvas.add(obj);
                        });
                        renderText();
                    });
                } else {
                    renderText();
                }
            };

            if (templateConfig.fabricConfig) {
                canvas.loadFromJSON(templateConfig.fabricConfig, () => {
                    canvas.getObjects().forEach(obj => {
                        obj.set({ selectable: true, evented: true });
                    });
                    updateTemplateContent();
                });
            } else if (templateConfig.svgPath) {
                fetch(templateConfig.svgPath).then(r => r.text()).then(svgText => {
                    renderTemplate(templateConfig.components, true, svgText);
                });
            } else {
                updateTemplateContent();
            }
        } else {
            updateTemplateContent();
        }
    }, [design.templateId, dynamicTemplates]);

    function updateTemplateContent() {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const { WIDTH, HEIGHT, PADDING } = LAYOUT;
        const existing = canvas.getObjects();

        // Background
        let bgRect = existing.find(obj => (obj as any).name === 'background') as fabric.Rect;
        if (!bgRect) {
            bgRect = new fabric.Rect({
                width: WIDTH, height: HEIGHT,
                left: WIDTH / 2, top: HEIGHT / 2,
                originX: 'center', originY: 'center',
                fill: design.backgroundColor,
                selectable: false, evented: false, name: 'background'
            });
            canvas.add(bgRect);
            canvas.sendToBack(bgRect);
        } else {
            bgRect.set({ fill: design.backgroundColor });
        }

        // Safety Guide
        let safety = existing.find(o => (o as any).name === 'safetyGuide');
        if (!safety) {
            safety = new fabric.Rect({
                width: WIDTH - 50, height: HEIGHT - 50,
                left: WIDTH / 2, top: HEIGHT / 2,
                originX: 'center', originY: 'center',
                fill: 'transparent', stroke: '#00b8d4', strokeWidth: 3, strokeDashArray: [15, 10],
                selectable: false, evented: false, excludeFromExport: true, name: 'safetyGuide'
            });
            canvas.add(safety);
        }
        canvas.moveTo(safety, 1);

        finalizeStandardLayout();
        initCanvasEvents(canvas);
        canvas.requestRenderAll();
    }

    function finalizeStandardLayout() {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const { WIDTH, PADDING } = LAYOUT;

        let curY = PADDING + 50;

        const logo = canvas.getObjects().find(o => (o as any).name === 'template_logo');
        const comp = canvas.getObjects().find(o => (o as any).name === 'template_company');
        const det = canvas.getObjects().filter(o => (o as any).name === 'template_details');

        [logo, comp, ...det].filter(Boolean).forEach((obj: any) => {
            obj.set({ left: WIDTH / 2, top: curY, originX: 'center', originY: 'top' });
            curY += obj.getScaledHeight() + 30;
            obj.setCoords();
        });
    }

    useEffect(() => {
        updateTemplateContent();
    }, [data, design]);

    // --- Actions ---
    const addText = (type: 'heading' | 'subheading' | 'body') => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const textbox = new fabric.Textbox(type === 'heading' ? 'Heading' : 'Text', {
            left: LAYOUT.WIDTH / 2, top: LAYOUT.HEIGHT / 2,
            fontSize: type === 'heading' ? 80 : 40,
            originX: 'center', originY: 'center',
            name: 'user_added_text'
        });
        canvas.add(textbox);
        canvas.setActiveObject(textbox);
    };

    const addIcon = (iconName: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !fabric.Path) return;

        const iconPaths: Record<string, string> = {
            phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
            mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
            location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
            star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
        };

        const pathData = iconPaths[iconName] || iconPaths['star'];
        const iconPath = new fabric.Path(pathData, {
            left: LAYOUT.WIDTH / 2, top: LAYOUT.HEIGHT / 2,
            originX: 'center', originY: 'center',
            fill: 'transparent', stroke: '#000000', strokeWidth: 2, scaleX: 3, scaleY: 3,
            name: 'user_added_icon'
        });
        canvas.add(iconPath);
        canvas.setActiveObject(iconPath);
    };

    const addShape = (type: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        let shape: fabric.Object;
        const common = { left: LAYOUT.WIDTH / 2, top: LAYOUT.HEIGHT / 2, fill: '#7D2AE8', originX: 'center', originY: 'center', name: 'user_added_shape' };

        if (type === 'circle') shape = new fabric.Circle({ ...common, radius: 80 });
        else if (type === 'triangle') shape = new fabric.Triangle({ ...common, width: 150, height: 130 });
        else shape = new fabric.Rect({ ...common, width: 200, height: 150 });

        canvas.add(shape);
        canvas.setActiveObject(shape);
    };

    const addImage = (url: string) => {
        fabric.Image.fromURL(url, (img) => {
            const sc = Math.min((LAYOUT.WIDTH * 0.4) / (img.width || 1), (LAYOUT.HEIGHT * 0.4) / (img.height || 1));
            img.set({ left: LAYOUT.WIDTH / 2, top: LAYOUT.HEIGHT / 2, originX: 'center', originY: 'center', scaleX: sc, scaleY: sc, name: 'user_added_image' });
            fabricCanvasRef.current?.add(img);
            fabricCanvasRef.current?.setActiveObject(img);
        }, { crossOrigin: 'anonymous' });
    };

    useEffect(() => {
        if (onAddText) onAddText(addText);
        if (onAddIcon) onAddIcon(addIcon);
        if (onAddShape) onAddShape(addShape);
        if (onAddImage) onAddImage(addImage);
    }, []);

    function initCanvasEvents(canvas: fabric.Canvas) {
        initAligningGuidelines(canvas);
        canvas.on('selection:created', (e) => setSelectedObject(e.selected?.[0] || null));
        canvas.on('selection:updated', (e) => setSelectedObject(e.selected?.[0] || null));
        canvas.on('selection:cleared', () => setSelectedObject(null));
    }

    return (
        <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
            <div className={`w-full z-10 shrink-0 ${compact ? '' : 'mb-2 min-h-[44px]'}`}>
                {selectedObject ? (
                    <TextFormatToolbar
                        selectedObject={selectedObject}
                        compact={compact}
                        isLandscape={isLandscape}
                        onUpdate={() => {
                            if (fabricCanvasRef.current) {
                                fabricCanvasRef.current.requestRenderAll();
                            }
                        }}
                        onFontSizeChange={(size) => {
                            if (onDesignChange) onDesignChange({ ...design, companyNameSize: size });
                        }}
                        onDuplicate={() => {
                            if (!fabricCanvasRef.current || !selectedObject) return;
                            selectedObject.clone((cloned: fabric.Object) => {
                                cloned.set({
                                    left: (selectedObject.left || 0) + 30,
                                    top: (selectedObject.top || 0) + 30,
                                    evented: true,
                                });
                                fabricCanvasRef.current!.add(cloned);
                                fabricCanvasRef.current!.setActiveObject(cloned);
                                fabricCanvasRef.current!.requestRenderAll();
                            });
                        }}
                        onLockToggle={() => {
                            if (!selectedObject) return;
                            const isLocked = !!selectedObject.lockMovementX;
                            selectedObject.set({
                                lockMovementX: !isLocked,
                                lockMovementY: !isLocked,
                                lockRotation: !isLocked,
                                lockScalingX: !isLocked,
                                lockScalingY: !isLocked,
                                hasControls: isLocked
                            });
                            if (fabricCanvasRef.current) fabricCanvasRef.current.requestRenderAll();
                        }}
                        onDelete={() => {
                            if (fabricCanvasRef.current && selectedObject) {
                                fabricCanvasRef.current.remove(selectedObject);
                                fabricCanvasRef.current.discardActiveObject();
                                setSelectedObject(null);
                            }
                        }}
                    />
                ) : (
                    <div className={compact ? 'h-0' : 'h-[44px]'} />
                )}
            </div>
            <div
                ref={containerRef}
                className={`flex-1 min-h-0 h-full flex items-center justify-center w-full relative overflow-hidden bg-gray-200/50 transition-opacity duration-300 ${isStabilized ? 'opacity-100' : 'opacity-0'}`}
            >
                <div
                    className="bg-white rounded-sm shadow-2xl relative overflow-hidden flex items-center justify-center"
                    style={{
                        width: LAYOUT.WIDTH * scale,
                        height: LAYOUT.HEIGHT * scale,
                    }}
                >
                    <canvas ref={canvasRef} />
                </div>

                {/* DEBUG TOOLS - REMOVE ONCE RESOLVED */}
                <div className="absolute top-4 left-4 bg-black/90 text-white text-[11px] p-3 rounded-lg z-[9999] pointer-events-none font-mono shadow-xl border border-white/20">
                    <div className="text-[#00ff00] font-bold mb-1 border-b border-white/20 pb-1">CANVAS DEBUGGER</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="opacity-60 text-[10px]">WIN:</span> <span>{debug.win.w}x{debug.win.h}</span>
                        <span className="opacity-60 text-[10px]">CONT:</span> <span>{debug.container.w}x{debug.container.h}</span>
                        <span className="opacity-60 text-[10px]">AVAIL:</span> <span className="text-[#00ffff]">{debug.avail.w}x{debug.avail.h}</span>
                        <span className="opacity-60 text-[10px]">SCALE:</span> <span className="text-[#ff00ff]">{debug.scale.toFixed(4)}</span>
                        <span className="opacity-60 text-[10px]">BOARD:</span> <span>{Math.round(LAYOUT.WIDTH * debug.scale)}x{Math.round(LAYOUT.HEIGHT * debug.scale)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
