import { useEffect, useCallback, useRef } from 'react';
import { fabric } from 'fabric';

// Throttle helper for performance optimization
function throttle<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let lastCall = 0;
    return ((...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    }) as T;
}

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
    onSelectionChange?: (obj: fabric.Object | null) => void;
    onDataChange?: (data: any) => void;
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
    onSafetyChange,
    onSelectionChange,
    onDataChange
}: UseCanvasEventsProps) {
    const handleBackgroundSnapping = useCallback((obj: fabric.Object) => {
        if (!(obj as any).isBackground && obj.name !== 'background') return;

        const zoom = canvasInstance?.getZoom() || 1;
        const thresholdX = baseWidth * 0.05; // Slightly larger for better "Fill" detection
        const thresholdY = baseHeight * 0.05;

        const bounds = obj.getBoundingRect(true, true);
        const l = bounds.left;
        const r = bounds.left + bounds.width;
        const t = bounds.top;
        const b = bounds.top + bounds.height;

        let changed = false;

        // DUAL SNAP (FILL) - Horizontal
        if (Math.abs(l) < thresholdX && Math.abs(r - baseWidth) < thresholdX) {
            // It's close to both sides -> FORCE FULL WIDTH
            obj.set({
                left: (obj.left || 0) - l,
                scaleX: (obj.scaleX || 1) * (baseWidth / (r - l))
            });
            changed = true;
        } else {
            // SINGLE SIDE SNAPPING - Horizontal
            if (Math.abs(l) < thresholdX) {
                obj.set('left', (obj.left || 0) - l);
                changed = true;
            } else if (Math.abs(r - baseWidth) < thresholdX) {
                const rightDiff = baseWidth - r;
                if ((obj as any).__isScaling) {
                    const newScaleX = (obj.scaleX || 1) * (baseWidth - l) / (r - l);
                    obj.set('scaleX', newScaleX);
                } else {
                    obj.set('left', (obj.left || 0) + rightDiff);
                }
                changed = true;
            }
        }

        // DUAL SNAP (FILL) - Vertical
        if (Math.abs(t) < thresholdY && Math.abs(b - baseHeight) < thresholdY) {
            // It's close to both sides -> FORCE FULL HEIGHT
            obj.set({
                top: (obj.top || 0) - t,
                scaleY: (obj.scaleY || 1) * (baseHeight / (b - t))
            });
            changed = true;
        } else {
            // SINGLE SIDE SNAPPING - Vertical
            if (Math.abs(t) < thresholdY) {
                obj.set('top', (obj.top || 0) - t);
                changed = true;
            } else if (Math.abs(b - baseHeight) < thresholdY) {
                const bottomDiff = baseHeight - b;
                if ((obj as any).__isScaling) {
                    const newScaleY = (obj.scaleY || 1) * (baseHeight - t) / (b - t);
                    obj.set('scaleY', newScaleY);
                } else {
                    obj.set('top', (obj.top || 0) + bottomDiff);
                }
                changed = true;
            }
        }

        if (changed) {
            obj.setCoords();
            canvasInstance?.requestRenderAll();
        }
    }, [canvasInstance, baseWidth, baseHeight]);

    const lastViolationState = useRef<boolean | null>(null);

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
            if (obj.name === 'safety_bleed_rect' || obj.name === 'safetyGuide' || obj.name === 'background' || (obj as any).isBackground || (obj as any).ignoreSafety || !obj.selectable) return;

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

        // Only trigger state change if violation status actually changed
        if (lastViolationState.current !== violation) {
            onSafetyChange(violation);
            lastViolationState.current = violation;
        }

        // Toggle bleed rects visibility
        objects.filter(o => o.name === 'safety_bleed_rect').forEach(r => {
            r.set('opacity', violation ? 0.7 : 0);
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
            return;
        }

        const moveStep = e.shiftKey ? 10 : 1;
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            activeObject.set('left', (activeObject.left || 0) - moveStep);
            activeObject.setCoords();
            canvas.requestRenderAll();
            saveHistory(canvas);
            checkSafetyArea(canvas);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            activeObject.set('left', (activeObject.left || 0) + moveStep);
            activeObject.setCoords();
            canvas.requestRenderAll();
            saveHistory(canvas);
            checkSafetyArea(canvas);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeObject.set('top', (activeObject.top || 0) - moveStep);
            activeObject.setCoords();
            canvas.requestRenderAll();
            saveHistory(canvas);
            checkSafetyArea(canvas);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeObject.set('top', (activeObject.top || 0) + moveStep);
            activeObject.setCoords();
            canvas.requestRenderAll();
            saveHistory(canvas);
            checkSafetyArea(canvas);
        }
    }, [canvasInstance, undo, redo, saveHistory, clipboard, checkSafetyArea]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (!canvasInstance) return;

        let selectionTimeout: NodeJS.Timeout | null = null;

        const handleSelection = (e?: any) => {
            if (selectionTimeout) {
                clearTimeout(selectionTimeout);
                selectionTimeout = null;
            }
            const active = canvasInstance.getActiveObject();
            const result = active || null;
            setSelectedObject(result);
            onSelectionChange?.(result);
        };

        const handleCleared = (e?: any) => {
            // Debounce the cleared event to avoid transient resets during double-clicks
            if (selectionTimeout) clearTimeout(selectionTimeout);

            selectionTimeout = setTimeout(() => {
                const actuallyHasActive = !!canvasInstance.getActiveObject();
                if (!actuallyHasActive) {
                    setSelectedObject(null);
                    onSelectionChange?.(null);
                    setContextMenu(null);
                }
                selectionTimeout = null;
            }, 50); // 50ms buffer for rapid click sequences
        };

        const handleMouseDown = () => {
            canvasInstance.calcOffset();
        };

        // Explicitly handle double-click to ensure text editability
        const handleDblClick = (e: fabric.IEvent) => {
            let target = e.target;
            if (!target) return;

            // LAZY PROMOTION: If it's a static Text object, promote it to Textbox
            if (target.type === 'text' && (target as any).selectable !== false) {
                const textObj = target as fabric.Text;
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
                canvasInstance.remove(textObj);
                canvasInstance.add(textbox);
                canvasInstance.setActiveObject(textbox);
                target = textbox;
            }

            if (target && (target.type === 'i-text' || target.type === 'textbox')) {
                const t = target as fabric.IText;
                if (!t.isEditing && t.editable) {
                    t.enterEditing();
                    canvasInstance.requestRenderAll();
                    // Re-trigger selection to ensure toolbar is aware
                    handleSelection();
                }
            }
        };

        canvasInstance.on('selection:created', handleSelection);
        canvasInstance.on('selection:updated', handleSelection);
        canvasInstance.on('selection:cleared', handleCleared);
        canvasInstance.on('mouse:dblclick', handleDblClick);
        // canvasInstance.on('mouse:down', handleMouseDown);
        canvasInstance.on('text:selection:changed', handleSelection);


        // Create throttled versions for better mobile performance
        const throttledSafetyCheck = throttle((canvas: fabric.Canvas) => checkSafetyArea(canvas), 32); // ~30fps
        const throttledSnapping = throttle((obj: fabric.Object) => handleBackgroundSnapping(obj), 16); // ~60fps

        canvasInstance.on('object:modified', (e) => {
            if (e.target) (e.target as any).__isScaling = false;
            saveHistory(canvasInstance);
            checkSafetyArea(canvasInstance); // Full check on completion
        });
        canvasInstance.on('object:moving', (e) => {
            throttledSafetyCheck(canvasInstance); // Throttled during movement
            if (e.target) throttledSnapping(e.target);
        });
        canvasInstance.on('object:scaling', (e) => {
            throttledSafetyCheck(canvasInstance); // Throttled during scaling
            if (e.target) {
                (e.target as any).__isScaling = true;
                throttledSnapping(e.target);
            }
        });
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
            const maxWidth = baseWidth - (margin * 2);

            const measurer = new fabric.Text(obj.text || '', {
                fontFamily: obj.fontFamily,
                fontSize: obj.fontSize,
                fontWeight: obj.fontWeight,
                fontStyle: obj.fontStyle,
                charSpacing: obj.charSpacing
            });

            const targetWidth = Math.min((measurer.width || 0) + 15, maxWidth);

            obj.set({ width: targetWidth, padding: 4 });
            obj.setCoords();
            checkSafetyArea(canvasInstance);
            canvasInstance.requestRenderAll();

            // SYNC TO DATA STATE
            const name = (obj as any).name;
            if (name && name.startsWith('template_') && onDataChange) {
                const key = name.replace('template_', '');
                if (['company', 'companyName', 'address', 'details', 'mobile', 'email', 'website', 'gstin', 'cin'].includes(key)) {
                    const dataKey = (key === 'company' || key === 'companyName') ? 'companyName' :
                        (key === 'address' || key === 'details') ? 'address' : key;
                    onDataChange({ [dataKey]: obj.text });
                } else if (key.startsWith('additional_')) {
                    const idx = parseInt(key.split('_')[1]);
                    // Specialized handling for additionalText array
                    // Since onDataChange currently handles shallow merges, we might need to be careful
                    // But in page.tsx, designState.setData usually merges.
                    onDataChange({ [`additional_update_${idx}`]: obj.text }); // Custom trigger or handle array in setData
                    // Alternatively, let's just pass customFields for now if it's not a built-in
                } else {
                    // Custom field
                    onDataChange({ customFields: { [key]: obj.text } });
                }
            }
        });

        const json = JSON.stringify(canvasInstance.toJSON(['name', 'templateKey', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'selectable', 'evented', 'editable', 'id', 'isBackground', 'ignoreSafety']));
        setInitialHistory(json);

        return () => {
            if (selectionTimeout) clearTimeout(selectionTimeout);
            canvasInstance.off('selection:created', handleSelection);
            canvasInstance.off('selection:updated', handleSelection);
            canvasInstance.off('selection:cleared', handleCleared);
            canvasInstance.off('mouse:dblclick', handleDblClick);
            canvasInstance.off('text:selection:changed', handleSelection);
        };
    }, [canvasInstance, setSelectedObject, setContextMenu, saveHistory, setInitialHistory, checkSafetyArea, baseWidth, baseHeight]);

    return { checkSafetyArea };
}
