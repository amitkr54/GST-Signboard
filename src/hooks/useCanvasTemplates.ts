import { useCallback } from 'react';
import { fabric } from 'fabric';
import { SignageData, DesignConfig } from '@/lib/types';
import { LAYOUT } from '@/lib/layout-constants';

export function useCanvasTemplates(
    canvas: fabric.Canvas | null,
    baseWidth: number,
    baseHeight: number,
    design: DesignConfig,
    data: SignageData,
    onSafetyCheck?: () => void,
    isReadOnly?: boolean,
    isAdmin?: boolean
) {
    const finalizeStandardLayout = useCallback(() => {
        if (!canvas) return;
        const { PADDING } = LAYOUT;
        let curY = PADDING + 50;

        const logo = canvas.getObjects().find((o: fabric.Object) => (o as any).name === 'template_logo');
        const comp = canvas.getObjects().find((o: fabric.Object) => (o as any).name === 'template_company');
        const det = canvas.getObjects().filter((o: fabric.Object) => (o as any).name === 'template_details');

        [logo, comp, ...det].filter(Boolean).forEach((obj: any) => {
            obj.set({ left: baseWidth / 2, top: curY, originX: 'center', originY: 'top' });
            curY += obj.getScaledHeight() + 30;
            obj.setCoords();
        });
    }, [canvas, baseWidth]);

    const updateTemplateContent = useCallback(() => {
        if (!canvas) return;
        console.log('[DEBUG] updateTemplateContent called');
        const existing = canvas.getObjects();

        // 0. Promote ANY static text components to Textboxes BEFORE sync
        existing.forEach((obj: fabric.Object) => {
            const name = (obj as any).name;
            // Promote if it's a template text OR if it's a generic text object that should be editable
            const isTemplateText = name && (name === 'template_company' || name === 'template_svg_text' || name === 'template_details');
            const isGenericText = obj.type === 'text' && (obj.selectable || (obj as any).editable);

            if (obj.type === 'text' && (isTemplateText || isGenericText) && canvas) {
                const textObj = obj as fabric.Text;
                const wasActive = canvas.getActiveObject() === obj;
                console.log('[DEBUG] Promoting static text to textbox. wasActive:', wasActive, 'name:', name);
                const oldScale = textObj.scaleX || 1;
                const normalizedFontSize = (textObj.fontSize || 40) * oldScale;

                const textbox = new fabric.Textbox(textObj.text || '', {
                    ...(textObj.toObject(['name', 'templateKey', 'selectable', 'evented', 'editable', 'id', 'fontFamily', 'fontWeight', 'fontStyle', 'fill', 'textAlign', 'angle', 'opacity', 'left', 'top', 'originX', 'originY'])),
                    fontSize: normalizedFontSize,
                    width: (textObj.width || 200) * oldScale,
                    scaleX: 1,
                    scaleY: 1,
                    type: 'textbox',
                    editable: true
                });
                const index = canvas.getObjects().indexOf(obj);
                canvas.insertAt(textbox, index, true);
                canvas.remove(obj);
                if (wasActive) {
                    console.log('[DEBUG] Restoring active selection to new textbox');
                    canvas.setActiveObject(textbox);
                }
            }
        });

        // 1. Background
        // FIX: Detect and remove duplicate background objects to prevent "ghost" backgrounds
        const backgroundObjects = canvas.getObjects().filter((obj: fabric.Object) => (obj as any).name === 'background' || (obj as any).isBackground);

        if (backgroundObjects.length > 1) {
            console.log('[Fix] Found multiple background objects, removing extras:', backgroundObjects.length);
            // Keep the first one, remove the rest
            for (let i = 1; i < backgroundObjects.length; i++) {
                canvas.remove(backgroundObjects[i]);
            }
        }

        let bgRect = backgroundObjects[0] as fabric.Rect;

        if (!bgRect) {
            bgRect = new fabric.Rect({
                width: baseWidth, height: baseHeight, left: baseWidth / 2, top: baseHeight / 2,
                originX: 'center', originY: 'center', fill: design.backgroundColor,
                selectable: false, evented: false, name: 'background',
                scaleX: 1, scaleY: 1,
                // @ts-ignore
                isBackground: true
            });
            canvas.add(bgRect);
            canvas.sendToBack(bgRect);
        } else {
            bgRect.set({
                width: baseWidth,
                height: baseHeight,
                left: baseWidth / 2,
                top: baseHeight / 2,
                scaleX: 1,
                scaleY: 1,
                selectable: false, // Ensure it's locked
                evented: false
            });
            bgRect.setCoords();
            canvas.sendToBack(bgRect);
        }

        if (design.backgroundGradientEnabled) {
            const angleRad = (design.backgroundGradientAngle || 0) * (Math.PI / 180);

            // Calculate gradient coordinates starting from center
            // We want the gradient to span the bounding box
            const x1 = 0.5 - 0.5 * Math.cos(angleRad);
            const y1 = 0.5 - 0.5 * Math.sin(angleRad);
            const x2 = 0.5 + 0.5 * Math.cos(angleRad);
            const y2 = 0.5 + 0.5 * Math.sin(angleRad);

            const gradient = new fabric.Gradient({
                type: 'linear',
                gradientUnits: 'percentage',
                coords: { x1, y1, x2, y2 },
                colorStops: [
                    { offset: 0, color: design.backgroundColor },
                    { offset: 1, color: design.backgroundColor2 || '#ffffff' }
                ]
            });
            bgRect.set({ fill: gradient });
        } else {
            bgRect.set({ fill: design.backgroundColor });
        }

        // 2. Safety Guide & Bleed Rects
        let safety = existing.find(o => (o as any).name === 'safetyGuide');
        const bleedRects = existing.filter(o => (o as any).name === 'safety_bleed_rect');

        if (isReadOnly) {
            // Remove guides if present
            if (safety) canvas.remove(safety);
            bleedRects.forEach(r => canvas.remove(r));
        } else {
            // Add/Update guides
            const marginScale = 0.05;
            const margin = Math.min(baseWidth, baseHeight) * marginScale;

            if (!safety) {
                safety = new fabric.Rect({
                    width: baseWidth - (margin * 2), height: baseHeight - (margin * 2),
                    left: baseWidth / 2, top: baseHeight / 2,
                    originX: 'center', originY: 'center', fill: 'transparent', stroke: '#00b8d4',
                    strokeWidth: 3, strokeDashArray: [15, 10], selectable: false, evented: false,
                    excludeFromExport: true, name: 'safetyGuide'
                });
                canvas.add(safety);
            } else {
                safety.set({
                    width: baseWidth - (margin * 2),
                    height: baseHeight - (margin * 2),
                    left: baseWidth / 2,
                    top: baseHeight / 2
                });
                safety.setCoords();
            }
            safety.bringToFront();

            // 3. Bleed Rects
            if (bleedRects.length === 0) {
                const rectProps = {
                    fill: '#a70000ff',
                    opacity: 0,
                    selectable: false,
                    evented: false,
                    name: 'safety_bleed_rect',
                    excludeFromExport: true
                };

                const top = new fabric.Rect({ ...rectProps, left: 0, top: 0, width: baseWidth, height: margin, originX: 'left', originY: 'top' });
                const bottom = new fabric.Rect({ ...rectProps, left: 0, top: baseHeight - margin, width: baseWidth, height: margin, originX: 'left', originY: 'top' });
                const left = new fabric.Rect({ ...rectProps, left: 0, top: margin, width: margin, height: baseHeight - (margin * 2), originX: 'left', originY: 'top' });
                const right = new fabric.Rect({ ...rectProps, left: baseWidth - margin, top: margin, width: margin, height: baseHeight - (margin * 2), originX: 'left', originY: 'top' });

                canvas.add(top, bottom, left, right);
                [top, bottom, left, right].forEach(r => r.bringToFront());
                safety.bringToFront(); // Ensure safety guide is above bleed rects
            } else {
                // Update positions on resize
                bleedRects.forEach((r: any, i) => {
                    if (i === 0) r.set({ left: 0, top: 0, width: baseWidth, height: margin }); // Top
                    if (i === 1) r.set({ left: 0, top: baseHeight - margin, width: baseWidth, height: margin }); // Bottom
                    if (i === 2) r.set({ left: 0, top: margin, width: margin, height: baseHeight - (margin * 2) }); // Left
                    if (i === 3) r.set({ left: baseWidth - margin, top: margin, width: margin, height: baseHeight - (margin * 2) }); // Right
                    r.setCoords();
                });
            }
        }

        // 4. Auto-Manage "Additional Detail" Objects (Create/Delete)
        const additionalObjects = existing.filter(o => (o as any).name?.startsWith('template_additional_'));
        const additionalTexts = data.additionalText || [];

        // cleanup: remove objects for deleted lines
        additionalObjects.forEach(obj => {
            const idx = parseInt((obj as any).name.split('_')[2]);
            if (idx >= additionalTexts.length && !isAdmin) {
                canvas.remove(obj);
            }
        });

        // create: add missing objects
        additionalTexts.forEach((text, i) => {
            const name = `template_additional_${i}`;
            const exists = canvas.getObjects().some(o => (o as any).name === name);

            if (!exists && text && text.trim() !== '') {
                console.log('[AutoGen] Creating additional detail:', { name, text, index: i });

                // Find best position (try below address/details field)
                const addressObj = canvas.getObjects().find(o => {
                    const objName = (o as any).name;
                    return objName === 'template_address' || objName === 'template_details';
                });

                let startTop = baseHeight * 0.5; // Default to middle
                let refStyle: fabric.Textbox | null = null;

                if (addressObj) {
                    // Position below address with some spacing
                    startTop = (addressObj.top || 0) + (addressObj.getScaledHeight() || 0) + (30 * (i + 1));
                    if (addressObj instanceof fabric.Textbox) {
                        refStyle = addressObj;
                    }
                } else {
                    // Fallback: find lowest text and position below, but cap at 80% of canvas height
                    const textObjects = canvas.getObjects().filter(o =>
                        (o.type === 'textbox' || o.type === 'text' || o.type === 'i-text') &&
                        !(o as any).name?.startsWith('template_additional_')
                    );

                    if (textObjects.length > 0) {
                        const lowestObj = textObjects.reduce((lowest, current) => {
                            const currentBottom = (current.top || 0) + (current.getScaledHeight() || 0);
                            const lowestBottom = (lowest.top || 0) + (lowest.getScaledHeight() || 0);
                            return currentBottom > lowestBottom ? current : lowest;
                        }, textObjects[0]);

                        startTop = (lowestObj.top || 0) + (lowestObj.getScaledHeight() || 0) + (30 * (i + 1));
                        if (lowestObj instanceof fabric.Textbox) {
                            refStyle = lowestObj;
                        }
                    }
                }

                // Ensure text stays within visible canvas (max 85% of height)
                const maxTop = baseHeight * 0.85;
                if (startTop > maxTop) {
                    startTop = maxTop;
                }

                const newText = new fabric.Textbox(text, {
                    left: baseWidth / 2,
                    top: startTop,
                    width: Math.min(baseWidth * 0.7, 500),
                    fontSize: refStyle?.fontSize || 30,
                    fontFamily: refStyle?.fontFamily || 'Inter',
                    fill: refStyle?.fill || '#000000',
                    textAlign: 'center',
                    originX: 'center',
                    originY: 'top',
                    selectable: true,
                    evented: true,
                    editable: true,
                    name: name
                });
                canvas.add(newText);
                console.log('[AutoGen] Added to canvas:', name, 'at position:', { left: newText.left, top: newText.top });
            }
        });

        // 5. Generic Smart Mapping Sync (Protecting Design & Formatting)
        canvas.getObjects().forEach((obj: fabric.Object) => {
            const name = (obj as any).name;
            if (!name || !name.startsWith('template_')) return;
            if ((obj as any).isEditing) return;

            const key = name.replace('template_', '');

            // Handle Text Synchronization
            if (obj.type === 'textbox' || obj.type === 'i-text' || obj.type === 'text') {
                const textObj = obj as fabric.Textbox;
                let newValue: string | undefined = '';
                let hasValue = false;
                let placeholder = '';

                // Build-in Field Mapping
                if (key === 'company' || key === 'companyName') {
                    newValue = data.companyName;
                    placeholder = 'Business Name';
                    hasValue = !!data.companyName;
                }
                else if (key === 'address' || key === 'details') {
                    newValue = data.address;
                    placeholder = 'Office Address';
                    hasValue = !!data.address;
                }
                else if (key === 'gstin') {
                    newValue = data.gstin;
                    placeholder = 'Gst Number';
                    hasValue = !!data.gstin;
                }
                else if (key === 'cin') {
                    newValue = data.cin;
                    placeholder = 'Cin Number';
                    hasValue = !!data.cin;
                }
                else if (key === 'mobile') {
                    newValue = data.mobile;
                    placeholder = 'Contact Number';
                    hasValue = !!data.mobile;
                }
                else if (key === 'email') {
                    newValue = data.email;
                    placeholder = 'Email Address';
                    hasValue = !!data.email;
                }
                else if (key === 'website') {
                    newValue = data.website;
                    placeholder = 'Website Url';
                    hasValue = !!data.website;
                }

                // Additional Text Lines (0-9)
                else if (key.startsWith('additional_')) {
                    const idx = parseInt(key.split('_')[1]);
                    newValue = data.additionalText?.[idx];
                    placeholder = `Additional Line ${idx + 1}`;
                    hasValue = !!newValue;
                }

                // Custom Field Mapping
                else if (data.customFields && data.customFields[key]) {
                    newValue = data.customFields[key];
                    hasValue = true;
                }
                else if (isAdmin) {
                    // Fallback placeholder formatting
                    placeholder = key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
                }

                // Apply update: 
                // 1. If we have actual mapped data, use it.
                // 2. If no data, and we are Admin, only show placeholder if current text is generic/empty.
                // 3. Otherwise (User mode or has custom text), LEAVE IT ALONE.

                const currentText = (textObj.text || '').trim();
                const isGeneric = !currentText || currentText === 'Text' || currentText.toLowerCase().includes('double click') || currentText.toLowerCase().includes('placeholder') || currentText === placeholder;

                let textToSet = '';
                if (hasValue) {
                    textToSet = newValue!;
                } else if (isAdmin && isGeneric) {
                    textToSet = placeholder;
                }

                if (textToSet !== '' && textToSet !== currentText) {
                    textObj.set({
                        text: textToSet,
                        objectCaching: false // Ensure crisp rendering after update
                    });

                    // Apply user's optional style preferences (font/size/color) from form controls
                    const userStyles = data.styles?.[name];
                    if (userStyles) {
                        if (userStyles.font) textObj.set({ fontFamily: userStyles.font });
                        if (userStyles.size) textObj.set({ fontSize: userStyles.size });
                        if (userStyles.color) textObj.set({ fill: userStyles.color });
                    }

                    textObj.setCoords();
                }
            }

            // Handle Image/Logo Synchronization
            if (name === 'template_logo') {
                const logo = obj as fabric.Image | fabric.Rect;
                if (data.logoUrl) {
                    if (logo.type === 'image') {
                        const img = logo as fabric.Image;
                        if (img.getSrc() !== data.logoUrl) {
                            img.setSrc(data.logoUrl, () => {
                                canvas.requestRenderAll();
                            }, { crossOrigin: 'anonymous' });
                        }
                    } else {
                        // Replace placeholder Rect with actual image
                        fabric.Image.fromURL(data.logoUrl, (img) => {
                            img.set({
                                left: logo.left,
                                top: logo.top,
                                scaleX: (logo.getScaledWidth() / img.width!),
                                scaleY: (logo.getScaledHeight() / img.height!),
                                name: 'template_logo',
                                selectable: true,
                                evented: true,
                                originX: logo.originX,
                                originY: logo.originY
                            });
                            canvas.remove(logo);
                            canvas.add(img);
                            img.setCoords();
                            canvas.requestRenderAll();
                        }, { crossOrigin: 'anonymous' });
                    }
                }
            }
        });

        // 5. Heal & Fix Stretched Rectangles (Auto-recovery)
        canvas.getObjects().forEach((obj: fabric.Object) => {
            // Identify template rectangles that are stretched or lost names
            const isStretchedRect = obj.type === 'rect' && (obj.width || 0) > 50000;
            const isTemplateRect = (obj as any).name === 'template_svg_background_object' || (isStretchedRect && (obj.fill === '#FEFEFE' || obj.fill === '#ffffff' || (typeof obj.fill === 'string' && obj.fill.toLowerCase() === '#fefefe')));

            if (isTemplateRect) {
                // FIX: Skip "healing" for objects that look like full background blocks (height > 15% of canvas)
                // This prevents the main background card from being shrunk like a separator line
                const currentPixelHeight = (obj.height || 0) * (obj.scaleY || 1);

                console.log('[HEALER DEBUG] Checking object:', {
                    name: (obj as any).name,
                    type: obj.type,
                    height: obj.height,
                    scaleY: obj.scaleY,
                    currentPixelHeight,
                    baseHeight,
                    threshold: baseHeight * 0.15,
                    shouldSkip: currentPixelHeight > baseHeight * 0.15
                });

                if (currentPixelHeight > baseHeight * 0.15) {
                    console.log('[HEALER DEBUG] Skipping healing for tall object (background candidate)');
                    return;
                }

                const targetSafeWidth = baseWidth * 0.92; // 92% safe zone
                const currentPixelWidth = (obj.width || 0) * (obj.scaleX || 1);
                const threshold = baseWidth * 0.01; // 1% precision threshold (User requested)

                console.log('[HEALER DEBUG] Width check:', {
                    currentPixelWidth,
                    targetSafeWidth,
                    diff: Math.abs(currentPixelWidth - targetSafeWidth),
                    threshold
                });

                // If off by more than threshold, snap it
                if (Math.abs(currentPixelWidth - targetSafeWidth) > threshold) {
                    const newScale = targetSafeWidth / (obj.width || 1);
                    obj.set({
                        scaleX: newScale,
                        scaleY: newScale,
                        name: 'template_svg_background_object'
                    });
                    obj.setCoords();
                    console.log(`Auto-healed stretched separator to safe scale ${newScale}`);
                }
            }
        });

        canvas.requestRenderAll();
        onSafetyCheck?.();
    }, [canvas, baseWidth, baseHeight, design, data, finalizeStandardLayout, onSafetyCheck, isAdmin]);

    const renderSVGTemplate = useCallback((comps: any, svgText?: string) => {
        if (!canvas) return;

        let vbX = 0, vbY = 0, vbW = baseWidth, vbH = baseHeight;
        if (comps?.originalViewBox) {
            [vbX, vbY, vbW, vbH] = comps.originalViewBox;
        } else if (svgText) {
            const vbMatch = svgText.match(/viewBox=["']([^"']+)["']/i);
            if (vbMatch) [vbX, vbY, vbW, vbH] = vbMatch[1].split(/[\s,]+/).map(Number);
        }

        const sc = Math.min(baseWidth / vbW, baseHeight / vbH);
        const ox = (baseWidth - vbW * sc) / 2;
        const oy = (baseHeight - vbH * sc) / 2;

        const addTextObjects = () => {
            if (comps.text) {
                comps.text.forEach((c: any, j: number) => {
                    const txt = new fabric.Textbox(c.text, {
                        left: (c.left - vbX) * sc + ox,
                        top: (c.top - vbY) * sc + oy,
                        fontSize: (c.fontSize || 40) * sc,
                        fontFamily: (c.fontFamily || 'Arial').replace(/['"]/g, '').trim(),
                        fontWeight: c.fontWeight || 'normal',
                        fontStyle: c.fontStyle || 'normal',
                        textAlign: c.textAlign || 'left',
                        fill: c.fill || '#000',
                        width: (c.width || (vbW * 0.8)) * sc,
                        selectable: true,
                        evented: true,
                        editable: true,
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
                addTextObjects();
            });
        } else {
            addTextObjects();
        }
    }, [canvas, baseWidth, baseHeight, updateTemplateContent]);

    return { updateTemplateContent, renderSVGTemplate };
}
