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

        // 1. Background
        let bgRect = existing.find(obj => (obj as any).name === 'background') as fabric.Rect;
        if (!bgRect) {
            bgRect = new fabric.Rect({
                width: baseWidth, height: baseHeight, left: baseWidth / 2, top: baseHeight / 2,
                originX: 'center', originY: 'center', fill: design.backgroundColor,
                selectable: false, evented: false, name: 'background'
            });
            canvas.add(bgRect);
            canvas.sendToBack(bgRect);
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

        // 3. Sync Text (Protecting Editing State)
        const company = existing.find(obj => (obj as any).name === 'template_company') as fabric.Textbox;
        if (company && !(company as any).isEditing) {
            const newText = (data.companyName || '').toUpperCase();
            if (company.text !== newText) {
                company.set({
                    text: newText, fill: design.textColor, fontFamily: design.fontFamily,
                    fontSize: design.companyNameSize, selectable: true, evented: true
                });
            }
        }

        const details = existing.filter(obj => (obj as any).name === 'template_details') as fabric.Textbox[];
        details.forEach((det, idx) => {
            if (idx === 0 && !(det as any).isEditing) {
                const newText = data.address || '';
                if (det.text !== newText) {
                    det.set({
                        text: newText, fill: design.textColor, fontFamily: design.fontFamily,
                        fontSize: design.fontSize, selectable: true, evented: true
                    });
                }
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
