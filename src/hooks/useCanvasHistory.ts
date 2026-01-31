import { useRef, useCallback } from 'react';
import { fabric } from 'fabric';

export function useCanvasHistory() {
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const historyProcessing = useRef(false);

    const saveHistory = useCallback((canvas: fabric.Canvas | null) => {
        if (!canvas || historyProcessing.current) return;

        const currentState = JSON.stringify(canvas.toJSON(['name', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'selectable', 'evented', 'editable', 'id', 'data', 'isBackground', 'ignoreSafety']));
        const lastState = historyRef.current[historyIndexRef.current];

        if (lastState && currentState === lastState) return;

        // Persist to local storage for "Canva-like" refresh protection
        localStorage.setItem('signage_canvas_json', currentState);

        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        }

        historyRef.current.push(currentState);
        historyIndexRef.current = historyRef.current.length - 1;

        // Limit history to 20 steps
        if (historyRef.current.length > 20) {
            historyRef.current.shift();
            historyIndexRef.current--;
        }
    }, []);

    const undo = useCallback((canvas: fabric.Canvas | null) => {
        if (!canvas || historyIndexRef.current <= 0) return;

        historyProcessing.current = true;
        historyIndexRef.current -= 1;
        const json = historyRef.current[historyIndexRef.current];
        canvas.loadFromJSON(json, () => {
            canvas.renderAll();
            historyProcessing.current = false;
        });
    }, []);

    const redo = useCallback((canvas: fabric.Canvas | null) => {
        if (!canvas || historyIndexRef.current >= historyRef.current.length - 1) return;

        historyProcessing.current = true;
        historyIndexRef.current += 1;
        const json = historyRef.current[historyIndexRef.current];
        canvas.loadFromJSON(json, () => {
            canvas.renderAll();
            historyProcessing.current = false;
        });
    }, []);

    const setInitialHistory = useCallback((json: string) => {
        historyRef.current = [json];
        historyIndexRef.current = 0;
    }, []);

    const setIsProcessing = useCallback((val: boolean) => {
        historyProcessing.current = val;
    }, []);

    return {
        saveHistory,
        undo,
        redo,
        setInitialHistory,
        setIsProcessing,
        historyIndex: historyIndexRef.current,
        canUndo: historyIndexRef.current > 0,
        canRedo: historyIndexRef.current < historyRef.current.length - 1,
        isProcessing: historyProcessing.current
    };
}
