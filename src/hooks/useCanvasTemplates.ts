import { useCallback } from 'react';
import { fabric } from 'fabric';
import { SignageData, DesignConfig } from '@/lib/types';
import { LAYOUT } from '@/lib/layout-constants';

export function useCanvasTemplates(
    canvasRef: React.MutableRefObject<fabric.Canvas | null>,
    baseWidth: number,
    baseHeight: number,
    design: DesignConfig,
    data: SignageData,
    onSafetyCheck?: () => void
) {
    const finalizeStandardLayout = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { PADDING } = LAYOUT;
        let curY = PADDING + 50;

        const logo = canvas.getObjects().find(o => (o as any).name === 'template_logo');
        const comp = canvas.getObjects().find(o => (o as any).name === 'template_company');
        const det = canvas.getObjects().filter(o => (o as any).name === 'template_details');

        [logo, comp, ...det].filter(Boolean).forEach((obj: any) => {
            obj.set({ left: baseWidth / 2, top: curY, originX: 'center', originY: 'top' });
            curY += obj.getScaledHeight() + 30;
            obj.setCoords();
        });
    }, [canvasRef, baseWidth]);

    const updateTemplateContent = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const existing = canvas.getObjects();

        // 0. Promote ANY static text components to Textboxes BEFORE sync
        existing.forEach(obj => {
            const name = (obj as any).name;
            // Promote if it's a template text OR if it's a generic text object that should be editable
            const isTemplateText = name && (name === 'template_company' || name === 'template_svg_text' || name === 'template_details');
            const isGenericText = obj.type === 'text' && (obj.selectable || (obj as any).editable);

            if (obj.type === 'text' && (isTemplateText || isGenericText) && canvas) {
                const textObj = obj as fabric.Text;
                const oldScale = textObj.scaleX || 1;
                const normalizedFontSize = (textObj.fontSize || 40) * oldScale;

                const textbox = new fabric.Textbox(textObj.text || '', {
                    ...(textObj.toObject(['name', 'selectable', 'evented', 'editable', 'id', 'fontFamily', 'fontWeight', 'fontStyle', 'fill', 'textAlign', 'angle', 'opacity', 'left', 'top', 'originX', 'originY'])),
                    fontSize: normalizedFontSize,
                    width: (textObj.width || 200) * oldScale,
                    scaleX: 1,
                    scaleY: 1,
                    type: 'textbox',
                    editable: true
                });
                canvas.remove(obj);
                canvas.add(textbox);
            }
        });

        // 1. Background
        let bgRect = canvas.getObjects().find(obj => (obj as any).name === 'background') as fabric.Rect;
        if (!bgRect) {
            bgRect = new fabric.Rect({
                width: baseWidth, height: baseHeight, left: baseWidth / 2, top: baseHeight / 2,
                originX: 'center', originY: 'center', fill: design.backgroundColor,
                selectable: false, evented: false, name: 'background'
            });
            canvas.add(bgRect);
            canvas.sendToBack(bgRect);
        } else {
            bgRect.set({
                width: baseWidth,
                height: baseHeight,
                left: baseWidth / 2,
                top: baseHeight / 2
            });
            bgRect.setCoords();
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

        // 2. Safety Guide
        let safety = existing.find(o => (o as any).name === 'safetyGuide');
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
        canvas.moveTo(safety, 1);

        // 3. Bleed Rects (Canva-style red areas)
        const bleedRects = existing.filter(o => (o as any).name === 'safety_bleed_rect');
        if (bleedRects.length === 0) {
            const rectProps = {
                fill: '#dd0a0aff',
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
            [top, bottom, left, right].forEach(r => canvas.moveTo(r, 1));
            canvas.moveTo(safety, 5); // Ensure safety guide is above bleed rects
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

        // 4. Sync Text (Protecting Editing State)
        const company = canvas.getObjects().find(obj => (obj as any).name === 'template_company') as fabric.Textbox | undefined;
        if (company && !(company as any).isEditing) {
            const newText = (data.companyName || '').toUpperCase();
            company.set({
                text: newText,
                selectable: true,
                evented: true,
                editable: true,
                lockScalingY: false,
                objectCaching: false,
                borderColor: '#E53935',
                cornerColor: '#ffffff',
                cornerStrokeColor: '#E53935',
                cornerSize: 14,
                transparentCorners: false,
                padding: 0,
                lineHeight: 1,
                cornerStyle: 'circle',
                borderScaleFactor: 2.5
            });
            // Only sync global styles if they've changed in the design prop (manual overrides in toolbar take precedence)
            if (design.fontFamily && company.fontFamily !== design.fontFamily) company.set('fontFamily', design.fontFamily);
            if (design.textColor && company.fill !== design.textColor) company.set('fill', design.textColor);
            if (design.companyNameSize && company.fontSize !== design.companyNameSize) company.set('fontSize', design.companyNameSize);

            // Auto-fit company text
            const marginScale = 0.05;
            const margin = Math.min(baseWidth, baseHeight) * marginScale;
            const maxWidth = baseWidth - (margin * 2);

            // Fast measurement using fabric.Text
            const measurer = new fabric.Text(company.text || '', {
                fontFamily: company.fontFamily,
                fontSize: company.fontSize,
                fontWeight: company.fontWeight,
                fontStyle: company.fontStyle,
                charSpacing: company.charSpacing
            });
            const targetWidth = Math.min((measurer.width || 0) + 15, maxWidth);
            company.set({ width: targetWidth, padding: 4 });
            company.setCoords();
        }

        const details = canvas.getObjects().filter(obj => (obj as any).name === 'template_details') as fabric.Textbox[];
        details.forEach((det, idx) => {
            if (idx === 0 && det && !(det as any).isEditing) {
                const newText = data.address || '';
                det.set({
                    text: newText,
                    selectable: true,
                    evented: true,
                    editable: true,
                    lockScalingY: false,
                    objectCaching: false,
                    padding: 0,
                    lineHeight: 1
                });
                if (design.fontFamily && det.fontFamily !== design.fontFamily) det.set('fontFamily', design.fontFamily);
                if (design.textColor && det.fill !== design.textColor) det.set('fill', design.textColor);
                if (design.fontSize && det.fontSize !== design.fontSize) det.set('fontSize', design.fontSize);

                // Auto-fit details text
                const marginScale = 0.05;
                const margin = Math.min(baseWidth, baseHeight) * marginScale;
                const maxWidth = baseWidth - (margin * 2);

                const detMeasurer = new fabric.Text(det.text || '', {
                    fontFamily: det.fontFamily,
                    fontSize: det.fontSize,
                    fontWeight: det.fontWeight,
                    fontStyle: det.fontStyle,
                    charSpacing: det.charSpacing
                });
                const targetWidth = Math.min((detMeasurer.width || 0) + 15, maxWidth);
                det.set({ width: targetWidth, padding: 4 });
                det.setCoords();
            }
        });

        finalizeStandardLayout();
        canvas.requestRenderAll();
        onSafetyCheck?.();
    }, [canvasRef, baseWidth, baseHeight, design, data, finalizeStandardLayout, onSafetyCheck]);

    const renderSVGTemplate = useCallback((comps: any, svgText?: string) => {
        const canvas = canvasRef.current;
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
                        fontFamily: c.fontFamily || 'Arial',
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
    }, [canvasRef, baseWidth, baseHeight, updateTemplateContent]);

    return { updateTemplateContent, renderSVGTemplate };
}
