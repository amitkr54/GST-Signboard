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
}

export function FabricPreview({ data, design, material = 'flex', onMount, onDesignChange, onAddText, onAddIcon, onAddShape, onAddImage, onDataChange, compact = false }: FabricPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2);
    const [hasWarning, setHasWarning] = useState(false);
    const [canvasInstance, setCanvasInstance] = useState<fabric.Canvas | null>(null);
    const lastScaleRef = useRef<number>(0.2);
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [dynamicTemplates, setDynamicTemplates] = useState<typeof TEMPLATES>(TEMPLATES);

    // Fetch dynamic templates
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
            selectionColor: 'rgba(0, 184, 212, 0.1)',
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
        (window as any).canvas = canvas;
        if (onMount) onMount(canvas);

        return () => {
            delete (window as any).canvas;
            canvas.dispose();
            fabricCanvasRef.current = null;
            setCanvasInstance(null);
        };
    }, []);

    // Expose canvas for debugging
    useEffect(() => {
        if (fabricCanvasRef.current) {
            (window as any).canvas = fabricCanvasRef.current;
        }
        return () => {
            delete (window as any).canvas;
        };
    }, [fabricCanvasRef.current]);

    // Scaling Logic
    useEffect(() => {
        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;
            const parent = container.parentElement;
            if (!parent) return;

            // Give it some room, but try to take as much as we can
            const isMobile = window.innerWidth < 1024;
            const hPad = isMobile ? 20 : 40;
            const vPad = isMobile ? 100 : 80;

            const availW = parent.clientWidth - hPad;
            const availH = (parent.clientHeight || window.innerHeight - 200) - vPad;

            const sc = Math.min(availW / LAYOUT.WIDTH, availH / LAYOUT.HEIGHT);

            // Only update if scale actually changed (using ref to avoid stale closure)
            if (Math.abs(sc - lastScaleRef.current) > 0.001) {
                lastScaleRef.current = sc;
                setScale(sc);

                if (canvasInstance) {
                    canvasInstance.setDimensions({
                        width: LAYOUT.WIDTH * sc,
                        height: LAYOUT.HEIGHT * sc
                    });
                    canvasInstance.setZoom(sc);
                    canvasInstance.calcOffset();
                    canvasInstance.requestRenderAll();
                }
            }
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [compact, canvasInstance]);


    // 1. Template SVG/PDF Loading
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const templateId = design.templateId || '';
        const templateConfig = dynamicTemplates.find(t => t.id === templateId);

        // Clear old template objects
        canvas.getObjects().forEach(obj => {
            if ((obj as any).name?.startsWith('template_')) canvas.remove(obj);
        });

        if (templateConfig) {
            const renderTemplate = (comps: any, isSvgFallback: boolean = false, svgText?: string) => {
                const { WIDTH, HEIGHT } = LAYOUT;
                const hasExtText = !!comps?.text;

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
                    if (hasExtText && comps.text) {
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
                                name: j === 0 ? 'template_company' : 'template_svg_text',
                                splitByGrapheme: false
                            });
                            canvas.add(txt);
                            txt.bringToFront();
                        });
                    }
                    updateTemplateContent();
                };

                if (comps?.backgroundObjects && comps.backgroundObjects.length > 0) {
                    const svgInner = comps.backgroundObjects.map((obj: any) => `<${obj.type} ${obj.attributes} />`).join('');
                    const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}">${svgInner}</svg>`;
                    fabric.loadSVGFromString(svgFull, (objs) => {
                        objs.forEach(obj => {
                            (obj as any).name = 'template_svg_background_object';
                            obj.set({
                                selectable: true,
                                evented: true,
                                left: (obj.left || 0) * sc + ox,
                                top: (obj.top || 0) * sc + oy,
                                scaleX: sc,
                                scaleY: sc
                            });
                            canvas.add(obj);
                        });
                        renderText();
                    });
                } else if (isSvgFallback && svgText) {
                    fabric.loadSVGFromString(svgText, (objs) => {
                        objs.forEach(obj => {
                            if (hasExtText && (obj.type?.includes('text') || obj.type === 'tspan')) return;
                            (obj as any).name = 'template_svg_background_object';
                            obj.set({
                                selectable: true,
                                evented: true,
                                left: (obj.left || 0) * sc + ox,
                                top: (obj.top || 0) * sc + oy,
                                scaleX: sc,
                                scaleY: sc
                            });
                            canvas.add(obj);
                        });
                        renderText();
                    });
                } else {
                    renderText();
                }
            };

            if (templateConfig.svgPath?.toLowerCase().endsWith('.pdf')) {
                import('pdfjs-dist').then(async (pdfjsLib) => {
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
                    const loadingTask = pdfjsLib.getDocument(templateConfig.svgPath!);
                    const pdf = await loadingTask.promise;
                    const page = await pdf.getPage(1);
                    const viewport = page.getViewport({ scale: 2.0 });
                    const canvasEl = document.createElement('canvas');
                    canvasEl.height = viewport.height;
                    canvasEl.width = viewport.width;
                    await page.render({ canvasContext: canvasEl.getContext('2d')!, viewport, canvas: canvasEl }).promise;
                    fabric.Image.fromURL(canvasEl.toDataURL(), (img) => {
                        const sc = Math.min(LAYOUT.WIDTH / img.width!, LAYOUT.HEIGHT / img.height!);
                        img.set({
                            left: LAYOUT.WIDTH / 2,
                            top: LAYOUT.HEIGHT / 2,
                            originX: 'center',
                            originY: 'center',
                            scaleX: sc,
                            scaleY: sc,
                            selectable: false,
                            evented: false,
                            name: 'template_pdf_background'
                        });
                        canvas.add(img);
                        canvas.sendToBack(img);
                        updateTemplateContent();
                    });
                });
            } else if ((templateConfig.components as any)?.backgroundObjects || templateConfig.components?.text) {
                renderTemplate(templateConfig.components);
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

    // 2. Data & Style Sync (Updates without re-adding)
    function updateTemplateContent() {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const templateId = design.templateId || '';
        const isCustomTemplate = templateId.startsWith('custom-');
        const templateConfig = dynamicTemplates.find(t => t.id === templateId);
        const { WIDTH, HEIGHT, PADDING, LOGO_MB, COMPANY_MB, DETAILS_GAP } = LAYOUT;
        const safetyInset = 25, maxWidth = WIDTH - (safetyInset * 2);
        const existing = canvas.getObjects();

        // Background & Material
        let bgRect = existing.find(obj => (obj as any).name === 'background') as fabric.Rect;
        let fill = design.backgroundColor, stroke = '', sWidth = 0;
        if (material === 'flex') { stroke = '#000000'; sWidth = 2; }
        else if (material === 'steel') { fill = '#e5e5e5'; stroke = '#a0a0a0'; sWidth = 8; }
        else if (material === 'acrylic') { stroke = 'rgba(255,255,255,0.2)'; sWidth = 2; }

        if (!bgRect) {
            bgRect = new fabric.Rect({
                width: WIDTH - 8, height: HEIGHT - 8,
                left: WIDTH / 2, top: HEIGHT / 2,
                originX: 'center', originY: 'center',
                fill, stroke, strokeWidth: sWidth,
                selectable: false, evented: false, name: 'background'
            });
            canvas.add(bgRect);
            canvas.sendToBack(bgRect);
        } else {
            bgRect.set({ fill, stroke, strokeWidth: sWidth });
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

        // Text & Items
        if (data.logoUrl) {
            let logo = existing.find(o => (o as any).name === 'template_logo') as fabric.Image;
            fabric.Image.fromURL(data.logoUrl, (img) => {
                const logoSize = design.logoSize || 150;
                img.scaleToHeight(logoSize);
                if (logo) {
                    logo.setElement(img.getElement());
                    logo.set({ scaleX: img.scaleX, scaleY: img.scaleY });
                } else {
                    img.set({ name: 'template_logo', originX: 'center' });
                    canvas.add(img);
                    logo = img;
                }
                finalizeLayout();
            }, { crossOrigin: 'anonymous' });
        } else {
            const logo = existing.find(o => (o as any).name === 'template_logo');
            if (logo) canvas.remove(logo);
            finalizeLayout();
        }

        function finalizeLayout() {
            if (!canvas) return;
            const fontColor = design.textColor || (templateConfig?.svgPath ? '#000' : '#FFF');
            const fontFam = design.fontFamily || 'Arial';

            // Company Name
            let compTxt = canvas.getObjects().find(o => (o as any).name === 'template_company') as fabric.Textbox;
            if (data.companyName) {
                const fontSize = design.companyNameSize || (templateConfig?.svgPath ? 80 : 120);
                const content = String(data.companyName).toUpperCase();
                if (compTxt) {
                    compTxt.set({ text: content, fontSize, fontFamily: fontFam, fill: fontColor });
                } else {
                    compTxt = new fabric.Textbox(content, { width: maxWidth, fontSize, fontFamily: fontFam, fontWeight: 'bold', fill: fontColor, textAlign: 'center', originX: 'center', name: 'template_company' });
                    canvas.add(compTxt);
                }
                shrinkToFit(compTxt, maxWidth);
            } else if (compTxt && !isCustomTemplate) canvas.remove(compTxt);

            // Details
            const detailsList = [];
            if (data.gstin || data.cin) detailsList.push(`GSTIN: ${data.gstin || ''}${data.cin ? ' | CIN: ' + data.cin : ''}`);
            if (data.address) detailsList.push(`Address: ${data.address}`);
            if (data.mobile) detailsList.push(`Contact: ${data.mobile}`);

            const detailObjs = canvas.getObjects().filter(o => (o as any).name === 'template_details') as fabric.Textbox[];
            if (!isCustomTemplate) {
                detailObjs.slice(detailsList.length).forEach(o => canvas.remove(o));
                detailsList.forEach((text, i) => {
                    let t = detailObjs[i];
                    if (t) t.set({ text, fill: fontColor, fontFamily: fontFam });
                    else {
                        t = new fabric.Textbox(text, { width: maxWidth, fontSize: 30, textAlign: 'center', originX: 'center', name: 'template_details', fill: fontColor, fontFamily: fontFam });
                        canvas.add(t);
                    }
                    shrinkToFit(t, maxWidth);
                });
            }

            // Stacking (Only for standard)
            if (!isCustomTemplate) {
                let curY = PADDING + 50;
                const logo = canvas.getObjects().find(o => (o as any).name === 'template_logo');
                const comp = canvas.getObjects().find(o => (o as any).name === 'template_company');
                const det = canvas.getObjects().filter(o => (o as any).name === 'template_details');
                [logo, comp, ...det].filter(Boolean).forEach((obj: any) => {
                    obj.set({ left: WIDTH / 2, top: curY, originY: 'top' });
                    curY += obj.getScaledHeight() + (obj.name === 'template_logo' ? LOGO_MB : obj.name === 'template_company' ? COMPANY_MB : DETAILS_GAP);
                    obj.setCoords();
                });
            }
            initCanvasEvents(canvas);
            canvas.requestRenderAll();
        }
    }

    useEffect(() => {
        updateTemplateContent();
    }, [data, design, material]);

    // --- TOOL FUNCTIONS ---

    const addTextToCanvas = (type: 'heading' | 'subheading' | 'body') => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const config = {
            heading: { text: 'Add a heading', fontSize: 72, fontWeight: 'bold' },
            subheading: { text: 'Add a subheading', fontSize: 48, fontWeight: '600' },
            body: { text: 'Add body text', fontSize: 24, fontWeight: 'normal' },
        }[type];

        const textbox = new fabric.Textbox(config.text, {
            left: LAYOUT.WIDTH / 2,
            top: LAYOUT.HEIGHT / 2,
            fontSize: config.fontSize,
            fontWeight: config.fontWeight as any,
            fontFamily: 'Arial',
            fill: '#000000',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            name: 'user_added_text'
        });

        canvas.add(textbox);
        canvas.setActiveObject(textbox);
        canvas.requestRenderAll();
        setSelectedObject(textbox);
    };

    const addIconToCanvas = (iconName: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const iconPaths: Record<string, string> = {
            phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
            mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6',
            location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
            globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
            star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
            clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2',
            calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18',
            user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
            building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18 M2 22h20 M6 12H4a2 2 0 0 0-2 2v8 M22 22V14a2 2 0 0 0-2-2h-2 M10 6h4 M10 10h4 M10 14h4 M10 18h4',
        };

        const pathData = iconPaths[iconName];
        if (!pathData) return;

        const iconPath = new fabric.Path(pathData, {
            left: LAYOUT.WIDTH / 2,
            top: LAYOUT.HEIGHT / 2,
            originX: 'center',
            originY: 'center',
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 2,
            scaleX: 3,
            scaleY: 3,
            name: 'user_added_icon'
        });

        canvas.add(iconPath);
        canvas.setActiveObject(iconPath);
        canvas.requestRenderAll();
        setSelectedObject(iconPath);
    };

    const addShapeToCanvas = (type: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        let shape: fabric.Object;

        const common = {
            left: LAYOUT.WIDTH / 2,
            top: LAYOUT.HEIGHT / 2,
            fill: '#7D2AE8',
            originX: 'center',
            originY: 'center',
            name: 'user_added_shape'
        };

        switch (type) {
            case 'rect':
                shape = new fabric.Rect({ ...common, width: 200, height: 150 });
                break;
            case 'circle':
                shape = new fabric.Circle({ ...common, radius: 80 });
                break;
            case 'triangle':
                shape = new fabric.Triangle({ ...common, width: 150, height: 130 });
                break;
            case 'line':
                shape = new fabric.Line([0, 0, 300, 0], { ...common, stroke: '#7D2AE8', strokeWidth: 4 });
                break;
            default:
                return;
        }

        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.requestRenderAll();
        setSelectedObject(shape);
    };

    const addImageToCanvas = (url: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        fabric.Image.fromURL(url, (img) => {
            const sc = Math.min((LAYOUT.WIDTH * 0.5) / (img.width || 1), (LAYOUT.HEIGHT * 0.5) / (img.height || 1));
            img.set({
                left: LAYOUT.WIDTH / 2,
                top: LAYOUT.HEIGHT / 2,
                originX: 'center',
                originY: 'center',
                scaleX: sc,
                scaleY: sc,
                name: 'user_added_image'
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();
            setSelectedObject(img);
        }, { crossOrigin: 'anonymous' });
    };

    useEffect(() => {
        if (onAddText) onAddText(addTextToCanvas);
        if (onAddIcon) onAddIcon(addIconToCanvas);
        if (onAddShape) onAddShape(addShapeToCanvas);
        if (onAddImage) onAddImage(addImageToCanvas);
    }, []);


    function shrinkToFit(textbox: fabric.Textbox, maxWidth: number) {
        const ctx = textbox.canvas?.getContext() || document.createElement('canvas').getContext('2d');
        if (!ctx) return;
        ctx.font = `${textbox.fontWeight} ${textbox.fontSize}px ${textbox.fontFamily}`;
        const w = ctx.measureText(textbox.text || '').width;
        if (w < maxWidth) textbox.set('width', w + 40); else textbox.set('width', maxWidth);
    }

    function checkBounds(canvas: fabric.Canvas) {
        const { WIDTH, HEIGHT } = LAYOUT;
        const safetyInset = 25; let out = false;
        canvas.getObjects().forEach(obj => {
            if (obj.excludeFromExport || ['background', 'safetyGuide', 'guideline', 'template_pdf_background', 'template_svg_background_object', 'template_svg_group'].includes((obj as any).name)) return;
            const br = obj.getBoundingRect();
            // Just check for visual warning, DO NOT move objects
            if (br.left < safetyInset || br.top < safetyInset || br.left + br.width > WIDTH - safetyInset || br.top + br.height > HEIGHT - safetyInset) out = true;
        });
        const rect = canvas.getObjects().find(o => (o as any).name === 'safetyGuide') as fabric.Rect;
        if (rect) rect.set('stroke', out ? '#ef4444' : '#00b8d4');
        setHasWarning(out);
    }

    function initCanvasEvents(canvas: fabric.Canvas) {
        // initAligningGuidelines(canvas);
        canvas.on('selection:created', (e) => setSelectedObject(e.selected?.[0] || null));
        canvas.on('selection:updated', (e) => setSelectedObject(e.selected?.[0] || null));
        canvas.on('selection:cleared', () => setSelectedObject(null));
        canvas.on('object:modified', () => checkBounds(canvas));
        canvas.on('text:changed', (e) => {
            const obj = e.target as any;
            if (obj?.name === 'template_company' && onDataChange) onDataChange({ companyName: obj.text });
        });
        checkBounds(canvas);
    }

    return (
        <div ref={containerRef} className={`w-full h-full flex flex-col items-center bg-gray-100 rounded-xl overflow-visible ${compact ? 'p-0' : 'p-4'} relative`}>
            <div className={`w-full z-10 ${compact ? '' : 'mb-2 min-h-[40px]'}`}>
                {selectedObject && (
                    <TextFormatToolbar
                        selectedObject={selectedObject}
                        compact={compact}
                        onUpdate={() => {
                            if (fabricCanvasRef.current) {
                                checkBounds(fabricCanvasRef.current);
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
                                hasControls: isLocked // Show controls if we are UNLOCKING
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
                )}
            </div>
            <div className={`flex-1 flex items-center justify-center w-full relative ${compact ? 'p-0' : 'pl-4 pb-4'} pt-2 overflow-hidden`}>
                <div style={{ width: LAYOUT.WIDTH * scale, height: LAYOUT.HEIGHT * scale, position: 'relative', margin: 'auto' }}><canvas ref={canvasRef} /></div>
            </div>
        </div>
    );
}
