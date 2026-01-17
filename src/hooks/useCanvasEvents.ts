import { useEffect, useCallback, useRef } from 'react';
import { fabric } from 'fabric';

interface UseCanvasEventsProps {
    canvasInstance: fabric.Canvas | null;
    setSelectedObject: (obj: fabric.Object | null) => void;
    setContextMenu: (menu: { x: number, y: number } | null) => void;
    saveHistory: (canvas: fabric.Canvas | null) => void;
    undo: (canvas: fabric.Canvas | null) => void;
    redo: (canvas: fabric.Canvas | null) => void;
    clipboard: React.MutableRefObject<fabric.Object | null>;
    setInitialHistory: (json: string) => void;
    baseWidth: number;
    baseHeight: number;
    onSafetyChange?: (hasViolation: boolean) => void;
}

export function useCanvasEvents({
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
    onSafetyChange
}: UseCanvasEventsProps) {
    const checkSafetyArea = useCallback((canvas: fabric.Canvas) => {
        if (!onSafetyChange) return;

        const zoom = canvas.getZoom() || 1;
        const objects = canvas.getObjects();
        const marginScale = 0.05;
        const margin = Math.min(baseWidth, baseHeight) * marginScale;

        const safeBounds = {
            left: margin,
            top: margin,
            right: baseWidth - margin,
            bottom: baseHeight - margin
        };

        let violation = false;
        objects.forEach(obj => {
            if (obj.name === 'safety_bleed_rect' || obj.name === 'safetyGuide' || obj.name === 'background' || (obj as any).isBackground || !obj.selectable) return;

            // Convert viewport bounds to design units
            const bounds = obj.getBoundingRect();
            const designLeft = bounds.left / zoom;
            const designTop = bounds.top / zoom;
            const designWidth = bounds.width / zoom;
            const designHeight = bounds.height / zoom;

            let actualLeft = designLeft;
            let actualRight = designLeft + designWidth;
            let actualTop = designTop;
            let actualBottom = designTop + designHeight;

            if (obj.type === 'textbox') {
                const textbox = obj as fabric.Textbox;
                const padding = textbox.padding || 0;
                let maxLineWidth = 0;
                // @ts-ignore - access internal line widths
                const lines = (textbox as any)._textLines || [];
                for (let i = 0; i < lines.length; i++) {
                    maxLineWidth = Math.max(maxLineWidth, textbox.getLineWidth(i));
                }

                const totalWidth = textbox.width || 0;
                const scaleX = textbox.scaleX || 1;
                const align = textbox.textAlign || 'left';

                let offset = 0;
                if (align === 'center') offset = (totalWidth - maxLineWidth) / 2;
                else if (align === 'right') offset = totalWidth - maxLineWidth;

                // actualLeft/Right are now correctly calculated in Design units
                actualLeft = designLeft + ((padding + offset) * scaleX);
                actualRight = actualLeft + (maxLineWidth * scaleX);

                // Vertical bounds (also design units)
                actualTop = designTop + (padding * (textbox.scaleY || 1));
                actualBottom = actualTop + ((textbox.height || 0) * (textbox.scaleY || 1));
            }

            const safetyBuffer = 2; // Tolerance for rounding
            if (
                actualLeft < safeBounds.left - safetyBuffer ||
                actualTop < safeBounds.top - safetyBuffer ||
                actualRight > safeBounds.right + safetyBuffer ||
                actualBottom > safeBounds.bottom + safetyBuffer
            ) {
                violation = true;
            }
        });

        onSafetyChange(violation);

        // Toggle bleed rects visibility
        objects.filter(o => o.name === 'safety_bleed_rect').forEach(r => {
            r.set('opacity', violation ? 0.3 : 0);
        });
        canvas.requestRenderAll();
    }, [onSafetyChange, baseWidth, baseHeight]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const canvas = canvasInstance;
        if (!canvas) return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo(canvas);
            return;
        }
        if (((e.ctrlKey || e.metaKey) && e.key === 'y') || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
            e.preventDefault();
            redo(canvas);
            return;
        }

        const activeObject = canvas.getActiveObject();
        if (!activeObject) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                const objects = canvas.getObjects().filter(obj => obj.selectable && !obj.name?.includes('background') && !obj.name?.includes('guide'));
                if (objects.length > 0) {
                    const selection = new fabric.ActiveSelection(objects, { canvas });
                    canvas.setActiveObject(selection);
                    canvas.requestRenderAll();
                }
            }
            return;
        }

        // @ts-ignore
        if (activeObject.isEditing) return;

        if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeObjects = canvas.getActiveObjects();
            if (activeObjects.length) {
                canvas.discardActiveObject();
                activeObjects.forEach((obj) => canvas.remove(obj));
                canvas.requestRenderAll();
                saveHistory(canvas);
            }
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
                    (clonedObj as fabric.Group).forEachObject((obj) => canvas.add(obj));
                    clonedObj.setCoords();
                } else {
                    canvas.add(clonedObj);
                }
                clipboard.current = clonedObj;
                canvas.setActiveObject(clonedObj);
                canvas.requestRenderAll();
                saveHistory(canvas);
            });
        }
    }, [canvasInstance, undo, redo, saveHistory, clipboard]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (!canvasInstance) return;

        const handleSelection = () => {
            const active = canvasInstance.getActiveObject();
            setSelectedObject(active || null);

            // Focus wrapper for key events, but avoid disrupting active text editing
            if (active && canvasInstance.getElement() && !(active as any).isEditing) {
                requestAnimationFrame(() => {
                    const el = (canvasInstance as any).wrapperEl;
                    if (el && !(active as any).isEditing) {
                        el.focus();
                    }
                });
            }
        };

        const handleCleared = () => {
            setSelectedObject(null);
            setContextMenu(null);
        };

        const handleMouseDown = () => {
            canvasInstance.calcOffset();
        };

        canvasInstance.on('selection:created', handleSelection);
        canvasInstance.on('selection:updated', handleSelection);
        canvasInstance.on('selection:cleared', handleCleared);
        // canvasInstance.on('mouse:down', handleMouseDown);
        canvasInstance.on('text:selection:changed', handleSelection);


        canvasInstance.on('object:modified', () => {
            saveHistory(canvasInstance);
            checkSafetyArea(canvasInstance);
        });
        canvasInstance.on('object:moving', () => checkSafetyArea(canvasInstance));
        canvasInstance.on('object:scaling', () => checkSafetyArea(canvasInstance));
        canvasInstance.on('object:added', () => {
            saveHistory(canvasInstance);
            checkSafetyArea(canvasInstance);
        });
        canvasInstance.on('object:removed', () => {
            saveHistory(canvasInstance);
            checkSafetyArea(canvasInstance);
        });

        canvasInstance.on('text:changed', (e) => {
            const obj = e.target as fabric.Textbox;
            if (!obj || obj.type !== 'textbox') return;

            const marginScale = 0.05;
            const margin = Math.min(baseWidth, baseHeight) * marginScale;
            // Cap at board safety margins
            const maxWidth = baseWidth - (margin * 2);

            // Fast measurement using fabric.Text (avoiding Textbox layout engine overhead)
            const measurer = new fabric.Text(obj.text || '', {
                fontFamily: obj.fontFamily,
                fontSize: obj.fontSize,
                fontWeight: obj.fontWeight,
                fontStyle: obj.fontStyle,
                charSpacing: obj.charSpacing
            });

            // Large buffer (+15) prevents premature wrapping across different browsers
            const targetWidth = Math.min((measurer.width || 0) + 15, maxWidth);

            // padding: 4 provides generous room for character glyphs (like 'Y')
            obj.set({ width: targetWidth, padding: 4 });
            obj.setCoords();
            checkSafetyArea(canvasInstance);
            canvasInstance.requestRenderAll();
        });

        const json = JSON.stringify(canvasInstance.toJSON(['name', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'selectable', 'evented', 'editable', 'id']));
        setInitialHistory(json);

        return () => {
            canvasInstance.off('selection:created', handleSelection);
            canvasInstance.off('selection:updated', handleSelection);
            canvasInstance.off('selection:cleared', handleCleared);
            // canvasInstance.off('mouse:down', handleMouseDown);
            canvasInstance.off('text:selection:changed', handleSelection);
            // Note: We avoid global .off() on shared events like object:moving 
            // to prevent stripping listeners added by other modules (e.g. alignment guidelines)
        };
    }, [canvasInstance, setSelectedObject, setContextMenu, saveHistory, setInitialHistory, checkSafetyArea, baseWidth, baseHeight]);

    return { checkSafetyArea };
}
