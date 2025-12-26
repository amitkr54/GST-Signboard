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
    // Sidebar callbacks
    onAddText?: (addFn: (type: 'heading' | 'subheading' | 'body') => void) => void;
    onAddIcon?: (addFn: (iconName: string) => void) => void;
    onAddShape?: (addFn: (type: 'rect' | 'circle' | 'line' | 'triangle') => void) => void;
    onAddImage?: (addFn: (imageUrl: string) => void) => void;
    compact?: boolean;
}

export function FabricPreview({ data, design, material = 'flex', onMount, onDesignChange, onAddText, onAddIcon, onAddShape, onAddImage, compact = false }: FabricPreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.2);
    const [hasWarning, setHasWarning] = useState(false);
    const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
    const [dynamicTemplates, setDynamicTemplates] = useState<typeof TEMPLATES>(TEMPLATES);

    // Fetch dynamic templates on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            const templates = await getTemplates();
            if (templates && templates.length > 0) {
                setDynamicTemplates(templates as typeof TEMPLATES);
            }
        };
        fetchTemplates();
    }, []);

    // Add text to canvas
    const addTextToCanvas = (type: 'heading' | 'subheading' | 'body') => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const textConfig = {
            heading: { text: 'Add a heading', fontSize: 72, fontWeight: 'bold' },
            subheading: { text: 'Add a subheading', fontSize: 48, fontWeight: '600' },
            body: { text: 'Add body text', fontSize: 24, fontWeight: 'normal' },
        };

        const config = textConfig[type];
        if (!config) {
            console.error('Invalid text type:', type);
            console.error('Available types:', Object.keys(textConfig));
            return;
        }

        const textbox = new fabric.Textbox(config.text, {
            left: LAYOUT.WIDTH / 2,
            top: LAYOUT.HEIGHT / 2,
            fontSize: config.fontSize,
            fontWeight: config.fontWeight,
            fontFamily: 'Arial',
            fill: '#FFFFFF',  // White text - visible on dark backgrounds
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
        });

        canvas.add(textbox);
        textbox.bringToFront(); // Ensure it's on top
        canvas.setActiveObject(textbox);
        canvas.requestRenderAll();
        setSelectedObject(textbox);


    };

    // Add icon to canvas
    const addIconToCanvas = (iconName: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Lucide-style outline SVG path data (stroke-based)
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

        // Create SVG path as fabric Path object with STROKE (outline) instead of fill
        const iconPath = new fabric.Path(pathData, {
            left: LAYOUT.WIDTH / 2,
            top: LAYOUT.HEIGHT / 2,
            originX: 'center',
            originY: 'center',
            fill: 'transparent',  // No fill
            stroke: '#000000',    // Black stroke (outline)
            strokeWidth: 2,       // Line thickness
            scaleX: 3,
            scaleY: 3,
        });

        canvas.add(iconPath);
        canvas.setActiveObject(iconPath);
        canvas.requestRenderAll();


    };

    // Add shape to canvas
    const addShapeToCanvas = (type: 'rect' | 'circle' | 'line' | 'triangle') => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;
        let shape: fabric.Object;

        switch (type) {
            case 'rect':
                shape = new fabric.Rect({
                    left: LAYOUT.WIDTH / 2,
                    top: LAYOUT.HEIGHT / 2,
                    width: 200,
                    height: 150,
                    fill: '#7D2AE8',
                    originX: 'center',
                    originY: 'center',
                });
                break;
            case 'circle':
                shape = new fabric.Circle({
                    left: LAYOUT.WIDTH / 2,
                    top: LAYOUT.HEIGHT / 2,
                    radius: 80,
                    fill: '#7D2AE8',
                    originX: 'center',
                    originY: 'center',
                });
                break;
            case 'line':
                shape = new fabric.Line([0, 0, 300, 0], {
                    left: LAYOUT.WIDTH / 2 - 150,
                    top: LAYOUT.HEIGHT / 2,
                    stroke: '#7D2AE8',
                    strokeWidth: 4,
                });
                break;
            case 'triangle':
                shape = new fabric.Triangle({
                    left: LAYOUT.WIDTH / 2,
                    top: LAYOUT.HEIGHT / 2,
                    width: 150,
                    height: 130,
                    fill: '#7D2AE8',
                    originX: 'center',
                    originY: 'center',
                });
                break;
            default:
                return;
        }

        canvas.add(shape);
        canvas.setActiveObject(shape);
        canvas.requestRenderAll();


    };

    // Add image to canvas
    const addImageToCanvas = (imageUrl: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        fabric.Image.fromURL(imageUrl, (img) => {
            // Scale image to fit within canvas
            const maxWidth = LAYOUT.WIDTH * 0.5;
            const maxHeight = LAYOUT.HEIGHT * 0.5;
            const scale = Math.min(maxWidth / (img.width || 100), maxHeight / (img.height || 100));

            img.set({
                left: LAYOUT.WIDTH / 2,
                top: LAYOUT.HEIGHT / 2,
                originX: 'center',
                originY: 'center',
                scaleX: scale,
                scaleY: scale,
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.requestRenderAll();


        });
    };

    // Expose add functions to parent - only once after functions are defined
    const hasExposedFns = useRef(false);
    useEffect(() => {
        if (hasExposedFns.current) return;
        hasExposedFns.current = true;

        if (onAddText) onAddText(addTextToCanvas);
        if (onAddIcon) onAddIcon(addIconToCanvas);
        if (onAddShape) onAddShape(addShapeToCanvas);
        if (onAddImage) onAddImage(addImageToCanvas);
    }, []);

    // History state for undo/redo
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);
    const clipboardRef = useRef<fabric.Object | null>(null);

    // Save canvas state to history
    const saveToHistory = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const json = JSON.stringify(canvas.toJSON());

        // Remove any future states if we're not at the end
        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        }

        historyRef.current.push(json);
        historyIndexRef.current = historyRef.current.length - 1;

        // Limit history to 50 states
        if (historyRef.current.length > 50) {
            historyRef.current.shift();
            historyIndexRef.current--;
        }
    };

    // Keyboard shortcuts handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            const activeObject = canvas.getActiveObject();

            // Check if user is typing in a text object
            const isEditing = activeObject &&
                (activeObject instanceof fabric.IText || activeObject instanceof fabric.Textbox) &&
                (activeObject as fabric.IText).isEditing;

            // Ctrl+Z - Undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                if (isEditing) return; // Allow native undo in text
                e.preventDefault();

                if (historyIndexRef.current > 0) {
                    historyIndexRef.current--;
                    const state = historyRef.current[historyIndexRef.current];
                    canvas.loadFromJSON(JSON.parse(state), () => {
                        canvas.requestRenderAll();
                        setSelectedObject(null);
                    });
                }
                return;
            }

            // Ctrl+Y or Ctrl+Shift+Z - Redo
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                if (isEditing) return;
                e.preventDefault();

                if (historyIndexRef.current < historyRef.current.length - 1) {
                    historyIndexRef.current++;
                    const state = historyRef.current[historyIndexRef.current];
                    canvas.loadFromJSON(JSON.parse(state), () => {
                        canvas.requestRenderAll();
                        setSelectedObject(null);
                    });
                }
                return;
            }

            // Ctrl+C - Copy
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                if (isEditing) return; // Allow native copy in text
                if (!activeObject) return;
                e.preventDefault();

                activeObject.clone((cloned: fabric.Object) => {
                    clipboardRef.current = cloned;
                });
                return;
            }

            // Ctrl+V - Paste
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                if (isEditing) return; // Allow native paste in text
                if (!clipboardRef.current) return;
                e.preventDefault();

                clipboardRef.current.clone((cloned: fabric.Object) => {
                    canvas.discardActiveObject();
                    cloned.set({
                        left: (cloned.left || 0) + 20,
                        top: (cloned.top || 0) + 20,
                        evented: true,
                    });
                    canvas.add(cloned);
                    canvas.setActiveObject(cloned);
                    canvas.requestRenderAll();
                    setSelectedObject(cloned);
                    saveToHistory();
                });
                return;
            }

            // Ctrl+D - Duplicate
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                if (!activeObject || activeObject.lockMovementX) return;
                e.preventDefault();

                activeObject.clone((cloned: fabric.Object) => {
                    canvas.discardActiveObject();
                    cloned.set({
                        left: (activeObject.left || 0) + 20,
                        top: (activeObject.top || 0) + 20,
                        evented: true,
                    });
                    canvas.add(cloned);
                    canvas.setActiveObject(cloned);
                    canvas.requestRenderAll();
                    setSelectedObject(cloned);
                    saveToHistory();
                });
                return;
            }

            // Delete or Backspace - Delete selected object
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (isEditing) return;
                const activeObject = canvas.getActiveObject();
                if (!activeObject) return;
                e.preventDefault();

                canvas.remove(activeObject);
                canvas.discardActiveObject();
                canvas.requestRenderAll();
                setSelectedObject(null);
                saveToHistory();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: LAYOUT.WIDTH,
            height: LAYOUT.HEIGHT,
            backgroundColor: design.backgroundColor,
            selection: true,
            renderOnAddRemove: true,
            selectionColor: 'rgba(0, 184, 212, 0.1)',
            selectionBorderColor: '#00b8d4',
            selectionLineWidth: 5,
            allowTouchScrolling: true,
        });

        fabric.Object.prototype.borderColor = '#7D2AE8'; // Canva Purple
        fabric.Object.prototype.cornerColor = '#ffffff'; // White handles
        fabric.Object.prototype.cornerStrokeColor = '#7D2AE8'; // Purple border for handles
        fabric.Object.prototype.cornerSize = 24; // Even larger handles
        fabric.Object.prototype.transparentCorners = false;
        fabric.Object.prototype.borderScaleFactor = 10; // Much thicker border
        fabric.Object.prototype.borderDashArray = undefined; // Solid line
        fabric.Object.prototype.cornerStyle = 'circle'; // Circle handles for corners
        fabric.Object.prototype.padding = 12; // More padding

        // Custom render function for rectangular middle controls (like Canva)
        const renderRectControl = (
            ctx: CanvasRenderingContext2D,
            left: number,
            top: number,
            styleOverride: any,
            fabricObject: fabric.Object
        ) => {
            const size = 8; // Width
            const height = 40; // Height
            ctx.save();
            ctx.fillStyle = '#ffffff'; // White fill
            ctx.strokeStyle = '#7D2AE8'; // Purple border
            ctx.lineWidth = 2;

            // Draw rectangle centered on the point
            ctx.fillRect(left - size / 2, top - height / 2, size, height);
            ctx.strokeRect(left - size / 2, top - height / 2, size, height);
            ctx.restore();
        };

        // Apply custom render to middle-left and middle-right controls
        fabric.Object.prototype.controls.ml.render = renderRectControl;
        fabric.Object.prototype.controls.ml.sizeX = 8;
        fabric.Object.prototype.controls.ml.sizeY = 40;
        fabric.Object.prototype.controls.ml.offsetY = 0; // Ensure centered

        fabric.Object.prototype.controls.mr.render = renderRectControl;
        fabric.Object.prototype.controls.mr.sizeX = 8;
        fabric.Object.prototype.controls.mr.sizeY = 40;
        fabric.Object.prototype.controls.mr.offsetY = 0; // Ensure centered

        // Set editing border color for Textbox to match selection border
        fabric.Textbox.prototype.editingBorderColor = '#7D2AE8'; // Same purple color when editing

        fabricCanvasRef.current = canvas;
        if (onMount) onMount(canvas);

        return () => {
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, []);

    useEffect(() => {
        const updateScale = () => {
            const container = containerRef.current;
            if (!container) return;
            const parent = container.parentElement;
            if (!parent) return;

            // Adjust for toolbar height + padding + rulers
            // Minimize padding to maximize canvas display size
            // Match the breakpoint used in page.tsx (lg: 1024px)
            const isMobile = window.innerWidth < 1024;
            const rulerSpace = 0; // Space for rulers (Removed)
            const toolbarHeight = 40; // Minimized

            // Reduced padding for mobile to maximize canvas size
            // Corrected for desktop to prevent cropping (accounting for all margins/paddings)
            // Desktop Vertical: 32 (container p-4) + 40 (toolbar) + 8 (toolbar mb-2) + 8 (canvas pt-2) + 16 (canvas pb-4) = 104
            // Desktop Horizontal: 32 (container p-4) + 16 (canvas pl-4) = 48
            const horizontalPadding = isMobile ? 0 : 48;
            const verticalPadding = isMobile ? 0 : 104;
            const availableWidth = Math.max(0, parent.clientWidth - horizontalPadding);
            const availableHeight = Math.max(0, parent.clientHeight - verticalPadding);

            const scaleX = availableWidth / LAYOUT.WIDTH;
            const scaleY = availableHeight / LAYOUT.HEIGHT;

            // Higher minimum scale for mobile to keep text visible and readable
            // But not too high to cause cropping on very small screens (360px)
            const minScale = compact ? 0.15 : 0.15;
            const newScale = Math.max(minScale, Math.min(scaleX, scaleY, 1));

            console.log('FabricPreview Scale Debug:', {
                parentWidth: parent.clientWidth,
                parentHeight: parent.clientHeight,
                availableWidth,
                availableHeight,
                scaleX,
                scaleY,
                newScale,
                minScale,
                isMobile
            });
            setScale(newScale);

            // Force Fabric to re-render after scale change
            const canvas = fabricCanvasRef.current;
            if (canvas) {
                canvas.requestRenderAll();
                console.log('Canvas re-rendered after scale change:', newScale);
            }
        };
        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);


    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // 1. Handle Background - Update existing or create new
        let bgRect = canvas.getObjects().find(obj => (obj as any).name === 'background') as fabric.Rect;
        let fill = design.backgroundColor;
        let stroke = '';
        let strokeWidth = 0;

        if (material === 'flex') {
            stroke = '#000000';
            strokeWidth = 2;
        } else if (material === 'steel') {
            fill = '#e5e5e5';
            stroke = '#a0a0a0';
            strokeWidth = 8;
        } else if (material === 'acrylic') {
            stroke = 'rgba(255,255,255,0.2)';
            strokeWidth = 2;
        }

        if (bgRect) {
            bgRect.set({
                fill: fill,
                stroke: stroke,
                strokeWidth: strokeWidth,
                width: LAYOUT.WIDTH - strokeWidth - 8, // 8 = safetyMargin * 2
                height: LAYOUT.HEIGHT - strokeWidth - 8
            });
            canvas.sendToBack(bgRect);
        } else {
            const safetyMargin = 4;
            bgRect = new fabric.Rect({
                width: LAYOUT.WIDTH - strokeWidth - (safetyMargin * 2),
                height: LAYOUT.HEIGHT - strokeWidth - (safetyMargin * 2),
                left: LAYOUT.WIDTH / 2,
                top: LAYOUT.HEIGHT / 2,
                originX: 'center',
                originY: 'center',
                fill: fill,
                stroke: stroke,
                strokeWidth: strokeWidth,
                selectable: false,
                evented: false,
                name: 'background'
            });
            canvas.add(bgRect);
            canvas.sendToBack(bgRect);
        }

        // Update canvas background color property as fallback
        canvas.setBackgroundColor(design.backgroundColor, () => canvas.requestRenderAll());

        // 2. Handle Safety Guide
        let safetyRect = canvas.getObjects().find(obj => (obj as any).name === 'safetyGuide');
        if (!safetyRect) {
            const safetyInset = 25;
            safetyRect = new fabric.Rect({
                width: LAYOUT.WIDTH - (safetyInset * 2),
                height: LAYOUT.HEIGHT - (safetyInset * 2),
                left: LAYOUT.WIDTH / 2,
                top: LAYOUT.HEIGHT / 2,
                originX: 'center',
                originY: 'center',
                fill: 'transparent',
                stroke: '#00b8d4',
                strokeWidth: 3,
                strokeDashArray: [15, 10],
                selectable: false,
                evented: false,
                excludeFromExport: true,
                name: 'safetyGuide'
            });
            canvas.add(safetyRect);
        }
        // Ensure safety guide is above background but below content
        canvas.moveTo(safetyRect, 1);

        // 3. Handle Template Objects (Company Name, Address, etc.)
        // Remove old template objects
        const objectsToRemove = canvas.getObjects().filter(obj => (obj as any).name === 'template');
        objectsToRemove.forEach(obj => canvas.remove(obj));

        if (data.logoUrl) {
            fabric.Image.fromURL(data.logoUrl, (img) => {
                if (!img) return;
                const logoSize = design.logoSize || 150;
                img.scaleToHeight(logoSize);
                img.set({ originX: 'center' });
                renderLayout(canvas, data, design, img);
            }, { crossOrigin: 'anonymous' });
        } else {
            if (canvas) {
                (window as any).fabricCanvas = canvas;
                renderLayout(canvas, data, design, null);
            }
        }
    }, [data, design, material, dynamicTemplates]);

    const renderLayout = (canvas: fabric.Canvas, data: SignageData, design: DesignConfig, logoImg: fabric.Image | null) => {
        const { WIDTH, HEIGHT, PADDING, LOGO_MB, COMPANY_MB, DETAILS_GAP } = LAYOUT;
        const objects: fabric.Object[] = [];
        const detailFontSize = 30;
        const safetyInset = 25;
        const maxWidth = WIDTH - (safetyInset * 2);

        // Get template configuration
        const templateConfig = dynamicTemplates.find(t => t.id === design.templateId);

        console.log('🔍 Debug - Template Info:', {
            templateId: design.templateId,
            templateConfig: templateConfig,
            hasSvgPath: !!templateConfig?.svgPath,
            svgPath: templateConfig?.svgPath
        });

        // --- SVG / PDF TEMPLATE HANDLING ---
        // Robustly remove old template backgrounds before rendering new ones
        canvas.getObjects().forEach(obj => {
            const objName = (obj as any).name;
            if (objName === 'template_pdf_background' || objName === 'template_svg_background') {
                canvas.remove(obj);
            }
        });

        if (templateConfig?.svgPath) {
            console.log('✅ SVG/PDF path detected:', templateConfig.svgPath);
            const isPdf = templateConfig.svgPath.toLowerCase().endsWith('.pdf');

            if (isPdf) {

                // Dynamic import to avoid SSR issues
                import('pdfjs-dist').then(async (pdfjsLib) => {
                    // Set worker
                    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

                    try {
                        const loadingTask = pdfjsLib.getDocument(templateConfig.svgPath!);
                        const pdf = await loadingTask.promise;
                        const page = await pdf.getPage(1);

                        const viewport = page.getViewport({ scale: 2.0 }); // High quality
                        const canvasEl = document.createElement('canvas');
                        const context = canvasEl.getContext('2d');
                        canvasEl.height = viewport.height;
                        canvasEl.width = viewport.width;

                        await page.render({
                            canvasContext: context!,
                            viewport: viewport
                        } as any).promise;

                        // Create Image from Canvas
                        const imgData = canvasEl.toDataURL('image/png');
                        fabric.Image.fromURL(imgData, (img) => {
                            if (!canvas) return;

                            // Maintain aspect ratio - use the smaller scale
                            const scaleX = WIDTH / (img.width || WIDTH);
                            const scaleY = HEIGHT / (img.height || HEIGHT);
                            const scale = Math.min(scaleX, scaleY);

                            img.set({
                                left: WIDTH / 2,
                                top: HEIGHT / 2,
                                originX: 'center',
                                originY: 'center',
                                scaleX: scale,
                                scaleY: scale,
                                selectable: false,
                                evented: false, // CRITICAL: Allow clicks to pass through
                                name: 'template_pdf_background'
                            });

                            canvas.add(img);
                            canvas.sendToBack(img);

                            // Render text on top
                            renderTemplateText(canvas, data, design, logoImg, templateConfig);
                        });

                    } catch (err) {
                        console.error('PDF Render Error:', err);
                        // Fallback to rendering text without background
                        renderTemplateText(canvas, data, design, logoImg, templateConfig);
                    }
                });
                return; // Exit early, async will handle the rest

            } else {
                // Remove old template backgrounds
                canvas.getObjects().forEach(obj => {
                    if ((obj as any).name === 'template_pdf_background' || (obj as any).name === 'template_svg_background') {
                        canvas.remove(obj);
                    }
                });

                // SVG Handler
                console.log('📦 Loading SVG from:', templateConfig.svgPath);
                fabric.loadSVGFromURL(templateConfig.svgPath, (objects, options) => {
                    console.log('📥 SVG Loaded! Objects:', objects, 'Options:', options);
                    if (!canvas) {
                        console.error('❌ Canvas is null in SVG callback');
                        return;
                    }

                    if (!objects || objects.length === 0) {
                        console.error('❌ SVG loaded but has no objects');
                        return;
                    }

                    // Create a group to scale it easily
                    const svgGroup = fabric.util.groupSVGElements(objects, options);
                    console.log('🎨 SVG Group created:', svgGroup);

                    // Maintain aspect ratio - use the smaller scale
                    const scaleX = WIDTH / (svgGroup.width || WIDTH);
                    const scaleY = HEIGHT / (svgGroup.height || HEIGHT);
                    const scale = Math.min(scaleX, scaleY);

                    console.log('📏 Scaling SVG:', { scaleX, scaleY, finalScale: scale });

                    svgGroup.set({
                        left: WIDTH / 2,
                        top: HEIGHT / 2,
                        originX: 'center',
                        originY: 'center',
                        scaleX: scale,
                        scaleY: scale,
                        selectable: false,
                        evented: false, // CRITICAL: Don't intercept mouse events
                        excludeFromExport: false,
                        name: 'template_svg_background'
                    });

                    // Add background first
                    canvas.add(svgGroup);
                    // Move to index 1 (above background at 0, but below safety guide at 1)
                    const bgRect = canvas.getObjects().find(obj => (obj as any).name === 'background');
                    if (bgRect) {
                        canvas.sendToBack(bgRect); // Ensure background is at index 0
                    }
                    canvas.moveTo(svgGroup, 1); // SVG at index 1
                    console.log('✅ SVG added to canvas at index 1 (non-interactive)');

                    // Render text on top
                    renderTemplateText(canvas, data, design, logoImg, templateConfig);
                });
                return; // Exit early, async will handle the rest
            }
        }

        // If no SVG/PDF template, render normally
        renderTemplateText(canvas, data, design, logoImg, templateConfig);
    };

    // Helper function to render text content (shared by SVG, PDF, and normal templates)
    const renderTemplateText = (canvas: fabric.Canvas, data: SignageData, design: DesignConfig, logoImg: fabric.Image | null, templateConfig?: typeof TEMPLATES[0]) => {
        console.log('📝 renderTemplateText called with:', {
            hasCompanyName: !!data?.companyName,
            companyName: data?.companyName,
            templateId: design.templateId
        });

        const { WIDTH, HEIGHT, PADDING, LOGO_MB, COMPANY_MB, DETAILS_GAP } = LAYOUT;
        const objects: fabric.Object[] = [];
        const detailFontSize = 30;
        const safetyInset = 25;
        const maxWidth = WIDTH - (safetyInset * 2);

        // Pre-create objects
        if (logoImg) {
            logoImg.set({ name: 'template_logo', originX: 'center', originY: 'center' });
            objects.push(logoImg);
        }

        if (data?.companyName) {
            // Use smaller font size for custom templates with backgrounds
            const isCustomTemplate = templateConfig?.svgPath !== undefined;
            const defaultFontSize = isCustomTemplate ? 80 : 120;
            const fontSize = design.companyNameSize || defaultFontSize;

            const text = new fabric.Textbox(String(data.companyName).toUpperCase(), {
                width: maxWidth,
                fontSize: fontSize,
                fontFamily: design.fontFamily || 'Arial',
                fontWeight: 'bold',
                fill: design.textColor || (isCustomTemplate ? '#000000' : '#FFFFFF'), // Black for custom, white for others
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                splitByGrapheme: false,
                editable: true, // Explicitly set editable
                name: 'template_company'
            });
            shrinkToFit(text, maxWidth);
            objects.push(text);
        }

        const detailGroups: fabric.Textbox[] = [];

        if (data.gstin || data.cin) {
            let content = '';
            if (data.gstin) content += `GSTIN: ${data.gstin}`;
            if (data.cin) {
                if (content) content += '   |   ';
                content += `CIN: ${data.cin}`;
            }
            const text = new fabric.Textbox(content, {
                width: maxWidth,
                fontSize: detailFontSize,
                fontFamily: 'Arial',
                fontWeight: 'bold',
                fill: design.textColor || (templateConfig?.svgPath ? '#000000' : '#FFFFFF'),
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                editable: true,
                name: 'template_details'
            });
            shrinkToFit(text, maxWidth);
            objects.push(text);
            detailGroups.push(text);
        }

        if (data.address) {
            const text = new fabric.Textbox(`Address:\n${data.address}`, {
                width: maxWidth,
                fontSize: detailFontSize,
                fontFamily: 'Arial',
                fill: design.textColor || (templateConfig?.svgPath ? '#000000' : '#FFFFFF'),
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                editable: true,
                name: 'template_details'
            });
            shrinkToFit(text, maxWidth);
            objects.push(text);
            detailGroups.push(text);
        }

        if (data.mobile) {
            const text = new fabric.Textbox(`Contact: ${data.mobile}`, {
                width: maxWidth,
                fontSize: detailFontSize,
                fontFamily: 'Arial',
                fontWeight: 'bold',
                fill: design.textColor || (templateConfig?.svgPath ? '#000000' : '#FFFFFF'),
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                editable: true,
                name: 'template_details'
            });
            shrinkToFit(text, maxWidth);
            objects.push(text);
            detailGroups.push(text);
        }

        // Layout Logic based on Template ID
        const templateId = design.templateId || 'modern';

        if (templateId === 'modern' || templateId === 'bold' || templateId === 'minimal') {
            // -- VERTICAL STACK (Default) --
            let currentY = PADDING + 50;

            objects.forEach((obj) => {
                obj.set({
                    left: WIDTH / 2,
                    top: currentY,
                    originY: 'top'
                });

                let gap = DETAILS_GAP;
                if (obj.name === 'template_logo') gap = LOGO_MB;
                else if (obj.name === 'template_company') gap = COMPANY_MB;

                currentY += obj.getScaledHeight() + gap;
            });

        } else if (templateId === 'professional') {

            // -- ATHMA STYLE (Double Border) --
            const borderInset = 20;
            const borderGap = 10;

            // Outer Border
            const outerBorder = new fabric.Rect({
                left: borderInset,
                top: borderInset,
                width: WIDTH - (borderInset * 2),
                height: HEIGHT - (borderInset * 2),
                fill: 'transparent',
                stroke: '#000000',
                strokeWidth: 5,
                selectable: false,
                evented: false, // Don't block text
                name: 'template'
            });
            canvas.add(outerBorder);

            // Separator Line
            const separatorY = HEIGHT * 0.55;
            const separator = new fabric.Line([borderInset, separatorY, WIDTH - borderInset, separatorY], {
                stroke: '#000000',
                strokeWidth: 5,
                selectable: false,
                evented: false, // Don't block text
                name: 'template'
            });
            canvas.add(separator);

            // Position Content
            // Logo & Title in Top Section
            let topY = PADDING + 50;
            objects.forEach((obj) => {
                if (obj.name === 'template_logo' || obj.name === 'template_company') {
                    obj.set({
                        left: WIDTH / 2,
                        top: topY,
                        originY: 'top'
                    });
                    topY += obj.getScaledHeight() + LOGO_MB;
                }
            });

            // Re-loop for details in bottom section
            let bottomY = separatorY + 40;
            objects.forEach((obj) => {
                if (obj.name !== 'template_logo' && obj.name !== 'template_company') {
                    obj.set({
                        left: WIDTH / 2,
                        top: bottomY,
                        originY: 'top'
                    });
                    if (obj instanceof fabric.Textbox) obj.set({ textAlign: 'center' });
                    bottomY += obj.getScaledHeight() + DETAILS_GAP;
                }
            });

        } else if (templateId === 'industrial') {
            // -- CRAFTBY STYLE (Dark, Rivets) --
            // Background is handled by general logic (set to #333333 in templates.ts)

            // Title & Subtitle lines
            const lineY1 = 280;
            const lineY2 = 450;
            const lineY3 = 900;

            const lineOptions = {
                stroke: '#ffffff',
                strokeWidth: 3,
                selectable: false,
                evented: false, // Don't block text
                name: 'template'
            };

            canvas.add(new fabric.Line([100, lineY1, WIDTH - 100, lineY1], lineOptions));
            canvas.add(new fabric.Line([100, lineY2, WIDTH - 100, lineY2], lineOptions));

            // Vertical Split for bottom section
            canvas.add(new fabric.Line([WIDTH / 2, lineY3 - 50, WIDTH / 2, HEIGHT - 50], lineOptions));

            // Rivets (Circles in corners)
            const rivetOffset = 60;
            const rivetRadius = 15;
            const rivetOptions = {
                fill: '#bdc3c7', // Silverish
                stroke: '#7f8c8d',
                strokeWidth: 2,
                selectable: false,
                evented: false, // Don't block text
                name: 'template'
            };

            [[rivetOffset, rivetOffset], [WIDTH - rivetOffset, rivetOffset],
            [rivetOffset, HEIGHT - rivetOffset], [WIDTH - rivetOffset, HEIGHT - rivetOffset]].forEach(([x, y]) => {
                canvas.add(new fabric.Circle({
                    ...rivetOptions,
                    left: x,
                    top: y,
                    radius: rivetRadius,
                    originX: 'center',
                    originY: 'center'
                }));
            });

            // Position Content
            objects.forEach(obj => {
                obj.set({ fill: '#ffffff' }); // Ensure white text
            });

            let currentY = PADDING + 80;
            objects.forEach(obj => {
                if (obj.name === 'template_company') {
                    obj.set({ left: WIDTH / 2, top: 120, originY: 'center' });
                    if (obj instanceof fabric.Textbox) obj.set({ fontSize: 100 });
                } else if (obj.name === 'template_logo') {
                    obj.set({ left: WIDTH / 2, top: 360, originY: 'center' }); // Logo in middle band
                } else {
                    // Details
                    obj.set({ left: WIDTH / 2, top: currentY + 500, originY: 'top' });
                    currentY += obj.getScaledHeight() + DETAILS_GAP;
                }
            });

        } else if (templateId === 'modern-split') {
            // -- VARAPRADA STYLE (Side Strip) --
            // Blue Side Strip on Left
            const stripWidth = 400;
            const strip = new fabric.Rect({
                left: 0,
                top: 0,
                width: stripWidth,
                height: HEIGHT,
                fill: '#1565c0', // Blue
                selectable: false,
                evented: false, // Don't block text
                name: 'template'
            });
            canvas.add(strip);
            canvas.sendToBack(strip); // Behind text

            // Vertical Text on Strip (Address/Details)
            // Note: FabricJS rotates around center. 
            // We want to put address here.

            const detailObjs = objects.filter(o => o.name === 'template_details');
            const mainObjs = objects.filter(o => o.name !== 'template_details');

            // Main content (Logo + Company) on Right White Area
            let mainY = PADDING + 100;
            const rightCenter = stripWidth + ((WIDTH - stripWidth) / 2);

            mainObjs.forEach(obj => {
                // Large red company name as per reference
                if (obj.name === 'template_company') {
                    obj.set({
                        fill: '#d32f2f', // Red
                    });
                    // @ts-ignore
                    obj.set({ fontSize: 180, fontWeight: '900' });
                    obj.set({
                        angle: -90, // Rotated vertically like image? NO, image has main text vertical on right
                        // Actually checking image 3: "VARAPRADA ENTERPRISES" is vertical red text on white background.
                        // "GSTIN..." is also vertical black text.
                        // The blue strip has address.
                    });

                    // Let's implement the vertical text style for this template specifically
                    obj.set({
                        angle: 0, // Keep horizontal for readability unless user rotates, 
                        // OR stick to standard horizontal for usability?
                        // The user request is "use these as templates". 
                        // Vertical text is very specific and breaks if text is long. 
                        // I will lay it out horizontally on the right for better usability,
                        // BUT mimicking the "Side Strip" look using the blue bar.
                        left: rightCenter,
                        top: mainY,
                        originX: 'center'
                    });
                    if (obj instanceof fabric.Textbox) obj.set({ textAlign: 'center' });
                    mainY += obj.getScaledHeight() + 80;
                } else {
                    obj.set({
                        left: rightCenter,
                        top: mainY,
                        originX: 'center',
                        originY: 'top'
                    });
                    mainY += obj.getScaledHeight() + LOGO_MB;
                }
            });

            // Details on the Blue Strip (White Text)
            let stripY = PADDING + 50;
            detailObjs.forEach(obj => {
                if (obj instanceof fabric.Textbox) {
                    // @ts-ignore
                    obj.set({
                        fill: '#ffffff',
                        width: stripWidth - 60, // Contain within strip
                        fontSize: 32
                    });
                    shrinkToFit(obj, stripWidth - 60);

                    obj.set({
                        left: stripWidth / 2,
                        top: stripY,
                        originX: 'center',
                        originY: 'top'
                    });
                    if (obj instanceof fabric.Textbox) obj.set({ textAlign: 'center' });
                    stripY += obj.getScaledHeight() + 40;
                }
            });


        } else if (templateId === 'boxed') {
            // -- PWLO STYLE (Simple Black Border Box) --
            const margin = 40;
            const border = new fabric.Rect({
                left: margin,
                top: margin,
                width: WIDTH - (margin * 2),
                height: HEIGHT - (margin * 2),
                fill: 'transparent',
                stroke: '#000000',
                strokeWidth: 4,
                selectable: false,
                evented: false, // Don't block text
                name: 'template'
            });
            canvas.add(border);

            // Centered Content
            let currentY = PADDING + 100;
            objects.forEach((obj) => {
                obj.set({
                    left: WIDTH / 2,
                    top: currentY,
                    originY: 'top'
                });
                currentY += obj.getScaledHeight() + DETAILS_GAP;
            });


        } else if (templateId === 'foundation') {
            // -- IMW STYLE (Blue BG, White Border, White Text) --
            // BG is handled by templates.ts (thumbnailColor/backgroundColor)
            // But we need to enforce blue if not set, or rely on the user selection?
            // The template definition has thumbnailColor '#1e3a8a'.
            // Logic in FabricPreview useEffect sets bg color.

            // White Double Border / Rounded Border
            const borderInset = 30;
            const border = new fabric.Rect({
                left: borderInset,
                top: borderInset,
                width: WIDTH - (borderInset * 2),
                height: HEIGHT - (borderInset * 2),
                fill: 'transparent',
                stroke: '#ffffff',
                strokeWidth: 8,
                rx: 30, // Rounded corners
                ry: 30,
                selectable: false,
                evented: false, // Don't block text
                name: 'template'
            });
            canvas.add(border);

            // Centered Content - Enforce White Text
            let currentY = PADDING + 100;
            objects.forEach((obj) => {
                obj.set({ fill: '#ffffff' });

                obj.set({
                    left: WIDTH / 2,
                    top: currentY,
                    originY: 'top'
                });
                currentY += obj.getScaledHeight() + DETAILS_GAP + 10;
            });

        } else {
            // -- FALLBACK (Same as Modern) --
            let currentY = PADDING + 50;
            objects.forEach((obj) => {
                obj.set({
                    left: WIDTH / 2,
                    top: currentY,
                    originY: 'top'
                });
                currentY += obj.getScaledHeight() + DETAILS_GAP;
            });
        }


        // Add to canvas
        console.log(`🚀 Adding ${objects.length} template objects to canvas`);
        objects.forEach((obj, idx) => {
            // Common properties
            obj.set({
                selectable: true,
                evented: true, // Explicitly enable events for text
                hasBorders: true,
                lockScalingY: false,
            });

            // Set a generic category name if it doesn't have a specific one (e.g. for cleanup)
            if (!obj.name) {
                obj.set({ name: 'template' });
            }

            // Make textboxes editable
            if (obj.type === 'textbox' || obj.type === 'i-text') {
                (obj as any).set({ editable: true });
            }

            obj.setControlsVisibility({
                mt: false, mb: false, ml: true, mr: true,
                bl: true, br: true, tl: true, tr: true, mtr: true
            });

            obj.setCoords();
            canvas.add(obj);
            console.log(`  Added object ${idx}: ${obj.type} (${obj.name})`);
        });

        initCanvasEvents(canvas);
        canvas.calcOffset(); // Ensure click mapping is accurate
        canvas.requestRenderAll();
        console.log('✅ Template text rendering complete');
    };




    const shrinkAllTextboxes = (canvas: fabric.Canvas) => {
        const { WIDTH } = LAYOUT;
        const safetyInset = 25;
        const maxWidth = WIDTH - (safetyInset * 2);

        canvas.getObjects().forEach((obj) => {
            if (obj instanceof fabric.Textbox) {
                let maxLineWidth = 0;

                // @ts-ignore - _textLines is internal but useful here
                if (obj._textLines) {
                    // @ts-ignore
                    obj._textLines.forEach((_, i) => {
                        const lineWidth = obj.getLineWidth(i);
                        if (lineWidth > maxLineWidth) maxLineWidth = lineWidth;
                    });
                } else {
                    maxLineWidth = obj.width || maxWidth;
                }

                // Set width to longest line + buffer, but max at maxWidth
                const newWidth = Math.max(Math.min(maxLineWidth + 20, maxWidth), 100);
                obj.set({ width: newWidth });
                obj.setCoords();
            }
        });

        canvas.requestRenderAll();
    };

    // Helper function to reposition all objects when heights change
    const repositionAllObjects = (canvas: fabric.Canvas) => {
        const { WIDTH, PADDING, LOGO_MB, COMPANY_MB, DETAILS_GAP } = LAYOUT;
        const objects = canvas.getObjects().filter(obj => {
            const objName = (obj as any).name;
            return !obj.excludeFromExport && objName !== 'background' && objName !== 'safetyGuide' && objName !== 'guideline';
        });

        let currentY = PADDING;
        objects.forEach((obj) => {
            obj.set({
                left: WIDTH / 2,
                top: currentY,
            });
            obj.setCoords();

            let gap = DETAILS_GAP;
            if (obj instanceof fabric.Image) gap = LOGO_MB;
            else if (obj instanceof fabric.Textbox && obj.text && obj.text.includes(data.companyName?.toUpperCase() || '')) gap = COMPANY_MB;

            currentY += obj.getScaledHeight() + gap;
        });

        canvas.requestRenderAll();
    };

    // Helper to shrink Textbox width to fit content, up to maxWidth
    const shrinkToFit = (textbox: fabric.Textbox, maxWidth: number) => {
        const ctx = textbox.canvas?.getContext() || document.createElement('canvas').getContext('2d');
        if (ctx) {
            ctx.font = `${textbox.fontWeight} ${textbox.fontSize}px ${textbox.fontFamily}`;
            const textWidth = ctx.measureText(textbox.text || '').width;
            if (textWidth < maxWidth) {
                textbox.set('width', textWidth + 20); // +20 buffer
            }
        }
    };

    const checkBounds = (canvas: fabric.Canvas) => {
        const { WIDTH, HEIGHT } = LAYOUT;
        const safetyInset = 25;
        let isOutOfBounds = false;

        canvas.getObjects().forEach((obj) => {
            const objName = (obj as any).name;
            // Exclude backgrounds, guides, and TEMPLATE BACKGROUNDS (SVG/PDF) or decorative template objects
            if (obj.excludeFromExport || objName === 'background' || objName === 'safetyGuide' || objName === 'guideline' ||
                objName === 'template_svg_background' || objName === 'template_pdf_background' ||
                (objName === 'template' && !(obj instanceof fabric.Textbox || obj instanceof fabric.IText))) {
                return;
            }

            obj.setCoords();
            const br = obj.getBoundingRect(true, true);

            if (
                br.left < safetyInset ||
                br.top < safetyInset ||
                br.left + br.width > WIDTH - safetyInset ||
                br.top + br.height > HEIGHT - safetyInset
            ) {
                isOutOfBounds = true;
            }
        });

        const safetyRect = canvas.getObjects().find(
            obj => (obj as any).name === 'safetyGuide'
        ) as fabric.Rect | undefined;

        if (safetyRect) {
            safetyRect.set('stroke', isOutOfBounds ? '#ef4444' : '#00b8d4');
        }

        setHasWarning(isOutOfBounds);
        canvas.requestRenderAll();
    };

    const initCanvasEvents = (canvas: fabric.Canvas) => {
        const aligningLineMargin = 10;
        const aligningLineColor = '#00ff00';
        const { WIDTH } = LAYOUT;
        const safetyInset = 25;
        const maxWidth = WIDTH - (safetyInset * 2);

        canvas.off('object:moving');
        canvas.off('object:modified');
        canvas.off('mouse:up');
        canvas.off('selection:cleared');
        canvas.off('selection:created');
        canvas.off('selection:updated');

        // Initialize alignment guidelines
        // Initialize alignment guidelines
        initAligningGuidelines(canvas);

        canvas.on('selection:created', (e) => {
            if (e.selected && e.selected[0]) {
                setSelectedObject(e.selected[0]);
            }
        });

        canvas.on('selection:updated', (e) => {
            if (e.selected && e.selected[0]) {
                setSelectedObject(e.selected[0]);
            } else {
                setSelectedObject(null);
            }
        });

        canvas.on('selection:cleared', () => {
            setSelectedObject(null);
        });

        // Fix text jumping during editing and keep controls visible
        canvas.on('text:editing:entered', (e) => {
            const obj = e.target as any;
            if (!obj || obj.type !== 'textbox') return;

            // Store original position
            obj.__originalTop = obj.top;
            obj.__originalLeft = obj.left;
            obj.__fixedHeight = obj.height;

            // Keep controls visible during editing (like Canva)
            obj.hasControls = true;
            obj.hasBorders = true;
            obj.borderColor = '#7D2AE8'; // Keep purple border
            obj.cornerColor = '#ffffff';
            obj.cornerStrokeColor = '#7D2AE8';

            canvas.renderAll();
        });

        canvas.on('text:changed', (e) => {
            const obj = e.target as any;
            if (!obj || obj.type !== 'textbox') return;

            // Lock position to prevent jumping (but allow height to grow)
            obj.top = obj.__originalTop;
            obj.left = obj.__originalLeft;
            // Removed: obj.height = obj.__fixedHeight; to allow textbox to expand

            obj.setCoords();
            canvas.renderAll();
        });



        canvas.on('object:modified', (e) => {
            checkBounds(canvas);
            canvas.requestRenderAll();
        });

        canvas.on('mouse:up', () => {
            canvas.requestRenderAll();
        });

        canvas.calcOffset();
        checkBounds(canvas);
    };

    return (
        <div ref={containerRef} className={`w-full h-full flex flex-col items-center bg-gray-100 rounded-xl overflow-visible ${compact ? 'p-0' : 'p-4'} relative`}>
            {/* Toolbar - Always visible when object selected, but stacked on top */}
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
                        onFontSizeChange={(newSize) => {
                            if (selectedObject && selectedObject instanceof fabric.Textbox && data.companyName && (selectedObject as fabric.Textbox).text?.includes(data.companyName.toUpperCase())) {
                                if (onDesignChange) {
                                    onDesignChange({
                                        ...design,
                                        companyNameSize: newSize
                                    });
                                }
                            }
                        }}
                        onDuplicate={() => {
                            if (!fabricCanvasRef.current || !selectedObject) return;
                            const canvas = fabricCanvasRef.current;

                            selectedObject.clone((cloned: fabric.Object) => {
                                canvas.discardActiveObject();
                                cloned.set({
                                    left: (selectedObject.left || 0) + 20,
                                    top: (selectedObject.top || 0) + 20,
                                    evented: true,
                                });

                                canvas.add(cloned);
                                canvas.setActiveObject(cloned);
                                canvas.requestRenderAll();
                                setSelectedObject(cloned);
                                saveToHistory();
                            });
                        }}
                        onDelete={() => {
                            if (!fabricCanvasRef.current || !selectedObject) return;
                            const canvas = fabricCanvasRef.current;
                            canvas.remove(selectedObject);
                            canvas.discardActiveObject();
                            canvas.requestRenderAll();
                            setSelectedObject(null);
                            saveToHistory();
                        }}
                        onLockToggle={() => {
                            if (!fabricCanvasRef.current || !selectedObject) return;
                            const canvas = fabricCanvasRef.current;
                            const isLocked = selectedObject.lockMovementX;

                            selectedObject.set({
                                lockMovementX: !isLocked,
                                lockMovementY: !isLocked,
                                lockScalingX: !isLocked,
                                lockScalingY: !isLocked,
                                lockRotation: !isLocked,
                            });

                            if (selectedObject instanceof fabric.IText || selectedObject instanceof fabric.Textbox) {
                                (selectedObject as fabric.IText).set('editable', isLocked);
                            }

                            selectedObject.setCoords();
                            canvas.requestRenderAll();
                        }}
                    />

                )}
            </div>

            <div className={`flex-1 flex items-center justify-center w-full relative ${compact ? 'p-0' : 'pl-4 pb-4'} pt-2`}>
                <div style={{
                    width: LAYOUT.WIDTH * scale,
                    height: LAYOUT.HEIGHT * scale,
                    maxWidth: '100%',  // Don't overflow container width
                    maxHeight: '100%', // Don't overflow container height
                    position: 'relative',
                    margin: 'auto',    // Center the canvas
                    aspectRatio: '3 / 2', // Maintain 18:12 = 3:2 landscape ratio
                }}>
                    <div style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        width: LAYOUT.WIDTH,
                        height: LAYOUT.HEIGHT
                    }}>
                        <canvas ref={canvasRef} />
                    </div>
                </div>

            </div>



            {hasWarning && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-10 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold text-xs">Danger Zone</span>
                </div>
            )}
        </div>
    );
};
