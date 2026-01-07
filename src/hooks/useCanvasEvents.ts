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

        const objects = canvas.getObjects();
        const marginScale = 0.05;
        const margin = Math.min(canvas.width || 1800, canvas.height || 1200) * marginScale;

        const safeBounds = {
            left: margin,
            top: margin,
            right: (canvas.width || 1800) - margin,
            bottom: (canvas.height || 1200) - margin
        };

        let violation = false;
        objects.forEach(obj => {
            if (obj.name === 'safetyGuide' || obj.name === 'background' || !obj.selectable) return;

            const bounds = obj.getBoundingRect();
            const buffer = 1;

            if (
                bounds.left < safeBounds.left - buffer ||
                bounds.top < safeBounds.top - buffer ||
                (bounds.left + bounds.width) > safeBounds.right + buffer ||
                (bounds.top + bounds.height) > safeBounds.bottom + buffer
            ) {
                violation = true;
            }
        });

        onSafetyChange(violation);
    }, [onSafetyChange]);

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

        const json = JSON.stringify(canvasInstance.toJSON(['name', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'selectable', 'evented', 'editable', 'id']));
        setInitialHistory(json);

        return () => {
            canvasInstance.off('selection:created', handleSelection);
            canvasInstance.off('selection:updated', handleSelection);
            canvasInstance.off('selection:cleared', handleCleared);
            canvasInstance.off('mouse:down', handleMouseDown);
            canvasInstance.off('object:modified');
            canvasInstance.off('object:added');
            canvasInstance.off('object:removed');
            canvasInstance.off('object:moving');
            canvasInstance.off('object:scaling');
        };
    }, [canvasInstance, setSelectedObject, setContextMenu, saveHistory, setInitialHistory, checkSafetyArea]);

    return { checkSafetyArea };
}
