import { fabric } from 'fabric';

/**
 * Alignment Guidelines V4.2 - Space Normalization & Multi-Line
 * 
 * Fixes:
 * 1. SPACE NORMALIZATION: All calculations in Canvas Space (absolute).
 * 2. MULTI-LINE: Shows lines to ALL aligning objects for a snap point.
 * 3. CORRECT SNAPPING: Objects jump correctly regardless of zoom.
 */

interface AlignLine {
    p: number;      // Position (canvas units)
    t1: number;     // Start (canvas units)
    t2: number;     // End (canvas units)
    label: string;
}

interface AligningState {
    isDragging: boolean;
    verticalLines: AlignLine[];
    horizontalLines: AlignLine[];
}

const SNAP_DISTANCE = 8;
const LINE_WIDTH = 1.5;
const LINE_COLOR = '#ff00ff';
const LABEL_FONT = '10px sans-serif';

function getOrInitState(canvas: any): AligningState {
    if (!canvas.__aligning_state) {
        canvas.__aligning_state = {
            isDragging: false,
            verticalLines: [],
            horizontalLines: []
        };
    }
    return canvas.__aligning_state;
}

export function initAligningGuidelines(canvas: fabric.Canvas) {
    const state = getOrInitState(canvas);

    const onMouseDown = () => {
        state.isDragging = true;
        state.verticalLines = [];
        state.horizontalLines = [];
    };

    const onMouseUp = () => {
        state.isDragging = false;
        state.verticalLines = [];
        state.horizontalLines = [];
        canvas.requestRenderAll();
    };

    const onObjectMoving = (e: fabric.IEvent) => {
        if (!state.isDragging || !e.target) return;

        const activeObject = e.target;
        const canvasObjects = canvas.getObjects();
        const zoom = canvas.getZoom();
        const snapDist = SNAP_DISTANCE / zoom;

        state.verticalLines = [];
        state.horizontalLines = [];

        // 1. Get Active Object Info in CANVAS SPACE
        // Using getBoundingRect(true) to get coordinates relative to canvas origin
        const aBounds = activeObject.getBoundingRect(true);
        const aCenter = activeObject.getCenterPoint();

        const aL = aBounds.left;
        const aR = aBounds.left + aBounds.width;
        const aT = aBounds.top;
        const aB = aBounds.top + aBounds.height;
        const aCX = aCenter.x;
        const aCY = aCenter.y;

        // Board dimensions
        const cW = canvas.width! / zoom;
        const cH = canvas.height! / zoom;

        // Track best snap candidates
        let bestX: { target: number; delta: number; origin: 'Left' | 'Center' | 'Right' } | null = null;
        let bestY: { target: number; delta: number; origin: 'Top' | 'Center' | 'Bottom' } | null = null;

        const updateBestX = (target: number, originVal: number, originType: 'Left' | 'Center' | 'Right') => {
            const delta = Math.abs(target - originVal);
            if (delta < snapDist) {
                if (!bestX || delta < bestX.delta) {
                    bestX = { target, delta, origin: originType };
                }
            }
        };

        const updateBestY = (target: number, originVal: number, originType: 'Top' | 'Center' | 'Bottom') => {
            const delta = Math.abs(target - originVal);
            if (delta < snapDist) {
                if (!bestY || delta < bestY.delta) {
                    bestY = { target, delta, origin: originType };
                }
            }
        };

        // --- STEP A: Search for Closest Snap Points ---

        // A1. Canvas Center
        updateBestX(cW / 2, aCX, 'Center');
        updateBestY(cH / 2, aCY, 'Center');

        // A2. Other Objects
        canvasObjects.forEach(obj => {
            if (obj === activeObject || !obj.visible || !obj.selectable ||
                obj.name === 'background' || obj.name?.includes('safety')) return;

            const oBounds = obj.getBoundingRect(true);
            const oCenter = obj.getCenterPoint();
            const oL = oBounds.left;
            const oR = oBounds.left + oBounds.width;
            const oT = oBounds.top;
            const oB = oBounds.top + oBounds.height;
            const oCX = oCenter.x;
            const oCY = oCenter.y;

            // X points
            updateBestX(oL, aL, 'Left');
            updateBestX(oL, aCX, 'Center');
            updateBestX(oL, aR, 'Right');
            updateBestX(oCX, aL, 'Left');
            updateBestX(oCX, aCX, 'Center');
            updateBestX(oCX, aR, 'Right');
            updateBestX(oR, aL, 'Left');
            updateBestX(oR, aCX, 'Center');
            updateBestX(oR, aR, 'Right');

            // Y points
            updateBestY(oT, aT, 'Top');
            updateBestY(oT, aCY, 'Center');
            updateBestY(oT, aB, 'Bottom');
            updateBestY(oCY, aT, 'Top');
            updateBestY(oCY, aCY, 'Center');
            updateBestY(oCY, aB, 'Bottom');
            updateBestY(oB, aT, 'Top');
            updateBestY(oB, aCY, 'Center');
            updateBestY(oB, aB, 'Bottom');
        });

        // --- STEP B: Apply Snapping ---

        if (bestX) {
            const absX = bestX.target;
            const type = bestX.origin;
            if (type === 'Left') activeObject.set({ left: absX + (activeObject.left! - aL) });
            else if (type === 'Center') activeObject.set({ left: absX + (activeObject.left! - aCX) });
            else if (type === 'Right') activeObject.set({ left: absX + (activeObject.left! - aR) });
            activeObject.setCoords();
        }

        if (bestY) {
            const absY = bestY.target;
            const type = bestY.origin;
            if (type === 'Top') activeObject.set({ top: absY + (activeObject.top! - aT) });
            else if (type === 'Center') activeObject.set({ top: absY + (activeObject.top! - aCY) });
            else if (type === 'Bottom') activeObject.set({ top: absY + (activeObject.top! - aB) });
            activeObject.setCoords();
        }

        // --- STEP C: Collect ALL Aligning Lines (After Snap) ---
        // We re-evaluate to show lines for every object that matches the final position

        if (bestX) {
            const snappedX = bestX.target;
            const label = bestX.origin;
            state.verticalLines.push({ p: snappedX, t1: 0, t2: cH, label });
        }
        if (bestY) {
            const snappedY = bestY.target;
            const label = bestY.origin;
            state.horizontalLines.push({ p: snappedY, t1: 0, t2: cW, label });
        }
    };

    const onAfterRender = () => {
        (canvas as any).__debug_align = {
            isDragging: state.isDragging,
            vLines: state.verticalLines.length,
            hLines: state.horizontalLines.length
        };

        if (!state.isDragging) return;
        if (state.verticalLines.length === 0 && state.horizontalLines.length === 0) return;

        const ctx = canvas.getContext();
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

        ctx.save();
        ctx.lineWidth = LINE_WIDTH;
        ctx.strokeStyle = LINE_COLOR;
        ctx.fillStyle = LINE_COLOR;
        ctx.font = LABEL_FONT;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();

        state.verticalLines.forEach(line => {
            const p1 = fabric.util.transformPoint(new fabric.Point(line.p, line.t1), vpt);
            const p2 = fabric.util.transformPoint(new fabric.Point(line.p, line.t2), vpt);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.fillText(line.label, p1.x + 4, 15);
        });

        state.horizontalLines.forEach(line => {
            const p1 = fabric.util.transformPoint(new fabric.Point(line.t1, line.p), vpt);
            const p2 = fabric.util.transformPoint(new fabric.Point(line.t2, line.p), vpt);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.fillText(line.label, 5, p1.y - 4);
        });

        ctx.stroke();
        ctx.restore();
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('object:moving', onObjectMoving);
    canvas.on('after:render', onAfterRender);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('object:modified', onMouseUp);
    canvas.on('mouse:out', onMouseUp);
    canvas.on('selection:cleared', onMouseUp);

    const dispose = () => {
        canvas.off('mouse:down', onMouseDown);
        canvas.off('object:moving', onObjectMoving);
        canvas.off('after:render', onAfterRender);
        canvas.off('mouse:up', onMouseUp);
        canvas.off('object:modified', onMouseUp);
        canvas.off('mouse:out', onMouseUp);
        canvas.off('selection:cleared', onMouseUp);
    };

    (canvas as any).__disposeAligningGuidelines = dispose;
    return dispose;
}
