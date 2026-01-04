'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
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

    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const historyProcessing = useRef(false);

    const saveHistory = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || historyProcessing.current) return;

        const currentState = JSON.stringify(canvas.toJSON(['name', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'selectable', 'evented', 'editable', 'id']));
        const lastState = historyRef.current[historyIndexRef.current];

        if (lastState && currentState === lastState) return;

        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        }

        historyRef.current.push(currentState);
        historyIndexRef.current = historyRef.current.length - 1;

        if (historyRef.current.length > 50) {
            historyRef.current.shift();
            historyIndexRef.current--;
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (historyIndexRef.current > 0) {
                    historyProcessing.current = true;
                    historyIndexRef.current -= 1;
                    const json = historyRef.current[historyIndexRef.current];
                    canvas.loadFromJSON(json, () => {
                        canvas.renderAll();
                        historyProcessing.current = false;
                    });
                }
                return;
            }

            if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                if (historyIndexRef.current < historyRef.current.length - 1) {
                    historyProcessing.current = true;
                    historyIndexRef.current += 1;
                    const json = historyRef.current[historyIndexRef.current];
                    canvas.loadFromJSON(json, () => {
                        canvas.renderAll();
                        historyProcessing.current = false;
                    });
                }
                return;
            }

            const activeObject = canvas.getActiveObject();
            if (!activeObject) return;
            // @ts-ignore
            if (activeObject.isEditing) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                const activeObjects = canvas.getActiveObjects();
                if (activeObjects.length) {
                    canvas.discardActiveObject();
                    activeObjects.forEach((obj) => {
                        canvas.remove(obj);
                    });
                    canvas.requestRenderAll();
                    saveHistory();
                }
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
                activeObject.clone((cloned: fabric.Object) => {
                    clipboard.current = cloned;
                    const activeObjects = canvas.getActiveObjects();
                    if (activeObjects.length) {
                        canvas.discardActiveObject();
                        activeObjects.forEach((obj) => {
                            canvas.remove(obj);
                        });
                        canvas.requestRenderAll();
                        saveHistory();
                    }
                });
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                activeObject.clone((cloned: fabric.Object) => {
                    clipboard.current = cloned;
                });
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                if (!clipboard.current) return;
                clipboard.current.clone((clonedObj: fabric.Object) => {
                    canvas.discardActiveObject();
                    clonedObj.set({
                        left: (clonedObj.left || 0) + 20,
                        top: (clonedObj.top || 0) + 20,
                        evented: true,
                    });
                    if (clonedObj.type === 'activeSelection') {
                        clonedObj.canvas = canvas;
                        (clonedObj as fabric.Group).forEachObject((obj) => {
                            canvas.add(obj);
                        });
                        clonedObj.setCoords();
                    } else {
                        canvas.add(clonedObj);
                    }
                    clipboard.current = clonedObj;
                    canvas.setActiveObject(clonedObj);
                    canvas.requestRenderAll();
                    saveHistory();
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (canvasInstance && historyRef.current.length === 0) {
            const json = JSON.stringify(canvasInstance.toJSON(['name', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'selectable', 'evented', 'editable', 'id']));
            historyRef.current.push(json);
            historyIndexRef.current = 0;

            canvasInstance.on('object:modified', saveHistory);
            canvasInstance.on('object:added', saveHistory);
            canvasInstance.on('object:removed', saveHistory);
        }
    }, [canvasInstance]);

    useEffect(() => {
        const timer = setTimeout(() => setIsStabilized(true), 800);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchTemplates = async () => {
            const templates = await getTemplates();
            if (templates && templates.length > 0) {
                setDynamicTemplates(templates as any);
            }
        };
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: baseWidth,
            height: baseHeight,
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
        (window as any).fabricCanvas = canvas;

        initAligningGuidelines(canvas);

        if (onMount) onMount(canvas);

        return () => {
            (window as any).fabricCanvas = null;
            canvas.dispose();
            fabricCanvasRef.current = null;
            setCanvasInstance(null);
        };
    }, []);

    useEffect(() => {
        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;

            const winH = typeof window !== 'undefined' ? window.innerHeight : 1000;
            const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
            const containerH = container.clientHeight;
            const containerW = container.clientWidth;

            const HEADER_H = 48;
            const TOOLBAR_H = compact ? 0 : 44;
            const VERT_GUTTER = 40;

            const trueAvailH = containerH > 50 ? containerH : Math.max(100, winH - (HEADER_H + TOOLBAR_H + VERT_GUTTER));
            const trueAvailW = containerW > 50 ? containerW : (winW * 0.6);

            const paddingScale = trueAvailH < 400 ? 0.96 : 0.94;
            const targetW = trueAvailW * paddingScale;
            const targetH = trueAvailH * paddingScale;

            let sc = Math.min(targetW / baseWidth, targetH / baseHeight);
            sc = Math.min(sc, 1.0);
            sc = Math.max(0.1, sc);

            const roundedSc = Math.round(sc * 10000) / 10000;

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
    }, [compact, baseWidth, baseHeight]);

    useEffect(() => {
        if (canvasInstance) {
            canvasInstance.setDimensions({
                width: baseWidth * scale,
                height: baseHeight * scale
            });
            canvasInstance.setZoom(scale);
            canvasInstance.calcOffset();
            canvasInstance.requestRenderAll();
        }
    }, [canvasInstance, scale, baseWidth, baseHeight]);

    useEffect(() => {
        if (canvasInstance) {
            canvasInstance.setBackgroundColor(design.backgroundColor, () => {
                canvasInstance.requestRenderAll();
            });
        }
    }, [canvasInstance, design.backgroundColor]);

    function updateTemplateContent() {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const { PADDING } = LAYOUT;
        const WIDTH = baseWidth;
        const HEIGHT = baseHeight;
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

        historyProcessing.current = false;
        saveHistory();
    }

    function finalizeStandardLayout() {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const { PADDING } = LAYOUT;
        const WIDTH = baseWidth;

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

    function initCanvasEvents(canvas: fabric.Canvas) {
        initAligningGuidelines(canvas);
        canvas.on('selection:created', (e) => setSelectedObject(e.selected?.[0] || null));
        canvas.on('selection:updated', (e) => setSelectedObject(e.selected?.[0] || null));
        canvas.on('selection:cleared', () => setSelectedObject(null));
    }

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        historyProcessing.current = true;

        const templateId = design.templateId || '';
        const templateConfig = dynamicTemplates.find(t => t.id === templateId);

        canvas.getObjects().forEach(obj => {
            if ((obj as any).name?.startsWith('template_')) canvas.remove(obj);
        });

        if (templateConfig) {
            const renderTemplate = (comps: any, isSvgFallback: boolean = false, svgText?: string) => {
                const WIDTH = baseWidth;
                const HEIGHT = baseHeight;
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
                                editable: true,
                                lockScalingY: false,
                                objectCaching: false,
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
                    const objects = canvas.getObjects();
                    objects.forEach((obj: any) => {
                        if (obj.type === 'text' && obj.text) {
                            const newTextbox = new fabric.Textbox(obj.text, {
                                ...obj.toObject(),
                                type: 'textbox',
                                selectable: true,
                                evented: true,
                                editable: true,
                                lockScalingY: false,
                                objectCaching: false,
                                name: obj.name || 'template_text_upgraded'
                            });
                            newTextbox.set({
                                left: obj.left,
                                top: obj.top,
                                scaleX: obj.scaleX,
                                scaleY: obj.scaleY,
                                width: obj.width,
                            });
                            canvas.remove(obj);
                            canvas.add(newTextbox);
                        } else {
                            obj.set({ selectable: true, evented: true });
                        }
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

    useEffect(() => {
        updateTemplateContent();
    }, [data, design]);

    // --- Actions ---
    const addText = (type: 'heading' | 'subheading' | 'body') => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        const textbox = new fabric.Textbox(type === 'heading' ? 'Heading' : 'Text', {
            left: baseWidth / 2, top: baseHeight / 2,
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
            heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7 Z',
            globe: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20 M2 12h20',
            clock: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2',
            calendar: 'M3 4h18v18H3V4z M16 2v4 M8 2v4 M3 10h18',
            user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
            building: 'M2 6h20v16H2V6z M10 2v4 M14 2v4 M18 2v4 M6 2v4 M2 22v-4 M22 22v-4',
            facebook: 'M15.12 10.353h-2.803v-1.85c0-.813.539-.999.925-.999.385 0 2.39 0 2.39 0V4.097L12.55 4.09C9.13 4.09 8.356 6.64 8.356 8.328v2.025h-2.01v3.425h2.01v9.64h4.084V13.78H15.12l.465-3.427z',
            instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
            x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.494h2.039L6.486 3.24H4.298l13.311 17.407z',
            linkedin: 'M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z',
            youtube: 'M8 5v14l11-7z',
            whatsapp: 'M8.88595 7.16985C9.06891 7.17475 9.27175 7.18465 9.46474 7.61303C9.59271 7.89821 9.80829 8.42321 9.9839 8.85087C10.1206 9.18366 10.233 9.45751 10.2611 9.51356C10.3254 9.64156 10.365 9.78926 10.2809 9.96156C10.271 9.98188 10.2617 10.0013 10.2526 10.02C10.1852 10.16 10.1372 10.2597 10.0237 10.3899C9.97709 10.4435 9.9285 10.5022 9.88008 10.5607C9.79494 10.6636 9.71035 10.7658 9.63785 10.838C9.50924 10.9659 9.37563 11.1039 9.52402 11.3599C9.6725 11.6159 10.1919 12.4579 10.9587 13.1373C11.783 13.8712 12.4998 14.1805 12.8622 14.3368C12.9325 14.3672 12.9895 14.3918 13.0313 14.4126C13.2886 14.5406 13.4419 14.5209 13.5903 14.3486C13.7388 14.1762 14.2334 13.6001 14.4066 13.3441C14.5748 13.0881 14.7479 13.1275 14.9854 13.2161C15.2228 13.3047 16.4892 13.9251 16.7464 14.0531C16.7972 14.0784 16.8448 14.1012 16.8889 14.1224C17.0678 14.2082 17.1895 14.2665 17.2411 14.3535C17.3054 14.4618 17.3054 14.9739 17.0927 15.5746C16.8751 16.1752 15.8263 16.7513 15.3514 16.7956C15.3064 16.7999 15.2617 16.8053 15.2156 16.8108C14.7804 16.8635 14.228 16.9303 12.2596 16.1555C9.83424 15.2018 8.23322 12.8354 7.90953 12.357C7.88398 12.3192 7.86638 12.2932 7.85698 12.2806L7.8515 12.2733C7.70423 12.0762 6.80328 10.8707 6.80328 9.62685C6.80328 8.43682 7.38951 7.81726 7.65689 7.53467C7.67384 7.51676 7.6895 7.50021 7.70366 7.48494C7.94107 7.22895 8.21814 7.16495 8.39125 7.16495C8.56445 7.16495 8.73756 7.16495 8.88595 7.16985Z',
            whatsapp_bubble: 'M2.18418 21.3314C2.10236 21.6284 2.37285 21.9025 2.6709 21.8247L7.27824 20.6213C8.7326 21.409 10.37 21.8275 12.0371 21.8275H12.0421C17.5281 21.8275 22 17.3815 22 11.9163C22 9.26735 20.966 6.77594 19.0863 4.90491C17.2065 3.03397 14.7084 2 12.042 2C6.55607 2 2.08411 6.44605 2.08411 11.9114C2.08348 13.65 2.5424 15.3582 3.41479 16.8645L2.18418 21.3314Z'
        };

        const iconConfig: Record<string, {
            shape: 'circle' | 'roundedSquare' | 'bubble' | 'roundedRect',
            color: string,
            useGradient?: boolean
        }> = {
            facebook: { shape: 'circle', color: '#1877F2' },
            instagram: { shape: 'roundedSquare', color: '#E4405F', useGradient: true },
            x: { shape: 'circle', color: '#000000' },
            linkedin: { shape: 'circle', color: '#0A66C2' },
            youtube: { shape: 'roundedRect', color: '#FF0000' },
            whatsapp: { shape: 'bubble', color: '#25D366' }
        };

        const pathData = iconPaths[iconName] || iconPaths['star'];
        const config = iconConfig[iconName];

        if (config) {
            let background: fabric.Object;
            const commonProps = { left: 0, top: 0, originX: 'center', originY: 'center' };

            if (config.shape === 'roundedRect' && iconName === 'youtube') {
                background = new fabric.Rect({
                    ...commonProps,
                    width: 100, height: 70, rx: 15, ry: 15, fill: config.color
                });
            } else if (config.shape === 'roundedSquare') {
                background = new fabric.Rect({
                    ...commonProps,
                    width: 80, height: 80, rx: 18, ry: 18, fill: config.color
                });
                if (config.useGradient && iconName === 'instagram') {
                    const gradient = new fabric.Gradient({
                        type: 'linear',
                        coords: { x1: -40, y1: 40, x2: 40, y2: -40 },
                        colorStops: [
                            { offset: 0, color: '#f09433' },
                            { offset: 0.25, color: '#e6683c' },
                            { offset: 0.5, color: '#dc2743' },
                            { offset: 0.75, color: '#cc2366' },
                            { offset: 1, color: '#bc1888' }
                        ]
                    });
                    background.set('fill', gradient);
                }
            } else if (config.shape === 'bubble' && iconName === 'whatsapp') {
                background = new fabric.Path(iconPaths.whatsapp_bubble, {
                    ...commonProps,
                    fill: config.color,
                    scaleX: 4, scaleY: 4
                });
            } else {
                background = new fabric.Circle({ ...commonProps, radius: 40, fill: config.color });
            }

            const logoPath = new fabric.Path(pathData, {
                ...commonProps,
                fill: '#ffffff',
                stroke: 'transparent',
                scaleX: iconName === 'facebook' ? 2.8 : (iconName === 'whatsapp' ? 4 : (iconName === 'x' ? 1.8 : 2.2)),
                scaleY: iconName === 'facebook' ? 2.8 : (iconName === 'whatsapp' ? 4 : (iconName === 'x' ? 1.8 : 2.2))
            });

            if (iconName === 'facebook') logoPath.set({ left: 3, top: 4 });
            if (iconName === 'whatsapp') logoPath.set({ left: -0.5, top: -1.5 });
            if (iconName === 'x') logoPath.set({ left: 0, top: 0 });
            if (iconName === 'youtube') logoPath.set({ scaleX: 3.5, scaleY: 3.5, left: 2 });

            const group = new fabric.Group([background, logoPath], {
                left: baseWidth / 2, top: baseHeight / 2,
                originX: 'center', originY: 'center',
                name: `social_${iconName}`
            });

            canvas.add(group);
            canvas.setActiveObject(group);
        } else {
            const iconPath = new fabric.Path(pathData, {
                left: baseWidth / 2, top: baseHeight / 2,
                originX: 'center', originY: 'center',
                fill: 'transparent', stroke: '#000000', strokeWidth: 2,
                scaleX: 3, scaleY: 3, name: 'user_added_icon'
            });
            canvas.add(iconPath);
            canvas.setActiveObject(iconPath);
        }
    };

    const addShape = (type: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        let shape: fabric.Object;
        const common = { left: baseWidth / 2, top: baseHeight / 2, fill: '#7D2AE8', originX: 'center', originY: 'center', name: 'user_added_shape' };

        if (type === 'circle') shape = new fabric.Circle({ ...common, radius: 80 });
        else if (type === 'triangle') shape = new fabric.Triangle({ ...common, width: 150, height: 130 });
        else if (type === 'line') shape = new fabric.Rect({ ...common, width: 200, height: 4 });
        else if (type === 'star') {
            const points = [{ x: 0, y: -100 }, { x: 22, y: -30 }, { x: 95, y: -30 }, { x: 36, y: 13 }, { x: 59, y: 81 }, { x: 0, y: 38 }, { x: -59, y: 81 }, { x: -36, y: 13 }, { x: -95, y: -30 }, { x: -22, y: -30 }];
            shape = new fabric.Polygon(points, { ...common, scaleX: 0.8, scaleY: 0.8 });
        }
        else if (type === 'hexagon') {
            const points = [{ x: 50, y: -86.6 }, { x: 100, y: 0 }, { x: 50, y: 86.6 }, { x: -50, y: 86.6 }, { x: -100, y: 0 }, { x: -50, y: -86.6 }];
            shape = new fabric.Polygon(points, { ...common, scaleX: 0.8, scaleY: 0.8 });
        }
        else if (type === 'pentagon') {
            const points = [{ x: 0, y: -50 }, { x: 47.5, y: -15.5 }, { x: 29.4, y: 40.5 }, { x: -29.4, y: 40.5 }, { x: -47.5, y: -15.5 }];
            shape = new fabric.Polygon(points, { ...common, scaleX: 1.5, scaleY: 1.5 });
        }
        else if (type === 'arrow') {
            const path = 'M 0 25 L 100 25 L 100 0 L 160 50 L 100 100 L 100 75 L 0 75 Z';
            shape = new fabric.Path(path, { ...common, scaleX: 1, scaleY: 1 });
        }
        else if (type === 'arrow-left') {
            const path = 'M 0 25 L 100 25 L 100 0 L 160 50 L 100 100 L 100 75 L 0 75 Z';
            shape = new fabric.Path(path, { ...common, angle: 180, scaleX: 1, scaleY: 1 });
        }
        else if (type === 'arrow-up') {
            const path = 'M 0 25 L 100 25 L 100 0 L 160 50 L 100 100 L 100 75 L 0 75 Z';
            shape = new fabric.Path(path, { ...common, angle: -90, scaleX: 1, scaleY: 1 });
        }
        else if (type === 'arrow-down') {
            const path = 'M 0 25 L 100 25 L 100 0 L 160 50 L 100 100 L 100 75 L 0 75 Z';
            shape = new fabric.Path(path, { ...common, angle: 90, scaleX: 1, scaleY: 1 });
        }
        else if (type === 'chevron') {
            const points = [{ x: 0, y: -50 }, { x: 50, y: 0 }, { x: 0, y: 50 }, { x: -40, y: 50 }, { x: 10, y: 0 }, { x: -40, y: -50 }];
            shape = new fabric.Polygon(points, { ...common, scaleX: 1.5, scaleY: 1.5 });
        }
        else if (type === 'rect-sharp') {
            shape = new fabric.Rect({ ...common, width: 200, height: 150, rx: 0, ry: 0 });
        }
        else shape = new fabric.Rect({ ...common, width: 200, height: 150, rx: 10, ry: 10 });

        canvas.add(shape);
        canvas.setActiveObject(shape);
    };

    const addImage = (url: string) => {
        fabric.Image.fromURL(url, (img) => {
            const sc = Math.min((baseWidth * 0.4) / (img.width || 1), (baseHeight * 0.4) / (img.height || 1));
            img.set({ left: baseWidth / 2, top: baseHeight / 2, originX: 'center', originY: 'center', scaleX: sc, scaleY: sc, name: 'user_added_image' });
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
                                saveHistory();
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
                            if (fabricCanvasRef.current) {
                                fabricCanvasRef.current.requestRenderAll();
                                saveHistory();
                            }
                        }}
                        onDelete={() => {
                            if (fabricCanvasRef.current && selectedObject) {
                                fabricCanvasRef.current.remove(selectedObject);
                                fabricCanvasRef.current.discardActiveObject();
                                setSelectedObject(null);
                                saveHistory();
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
                        width: baseWidth * scale,
                        height: baseHeight * scale,
                    }}
                >
                    <canvas ref={canvasRef} />
                </div>
            </div>
        </div>
    );
}
