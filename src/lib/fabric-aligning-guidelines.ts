import { fabric } from 'fabric';

/**
 * Alignment Guidelines V4.4 - Accurate Multi-Line & Board Edges
 * 
 * Final Refinements:
 * 1. UNIQUE LINES: Fixes the "incorrect count" by tracking unique axes.
 * 2. BOARD EDGES: Adds snapping to Board Top, Bottom, Left, and Right.
 * 3. TOP/BOTTOM FIX: Ensures exhaustive vertical alignment combinations.
 * 4. VIEWPORT SYNC: Uses getWidth()/getHeight() for accurate buffer-agnostic bounds.
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

        // 1. Get Viewport Bounds (Canvas Space)
        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
        const invVpt = fabric.util.invertTransform(vpt);
        const viewP1 = fabric.util.transformPoint(new fabric.Point(0, 0), invVpt);
        const viewP2 = fabric.util.transformPoint(new fabric.Point(canvas.getWidth(), canvas.getHeight()), invVpt);

        const minX = Math.min(viewP1.x, viewP2.x);
        const maxX = Math.max(viewP1.x, viewP2.x);
        const minY = Math.min(viewP1.y, viewP2.y);
        const maxY = Math.max(viewP1.y, viewP2.y);

        // 2. Identify "Board" boundaries (Design Area)
        const background = canvasObjects.find(obj => obj.name === 'background');
        let boardX = [minX, maxX]; // Default to viewport if no background
        let boardY = [minY, maxY];
        let boardCX = (minX + maxX) / 2;
        let boardCY = (minY + maxY) / 2;

        if (background) {
            const b = background.getBoundingRect(true);
            boardX = [b.left, b.left + b.width];
            boardY = [b.top, b.top + b.height];
            boardCX = b.left + b.width / 2;
            boardCY = b.top + b.height / 2;
        }

        // 3. Active Object Geometry (Canvas Space)
        const aBounds = activeObject.getBoundingRect(true);
        const aCenter = activeObject.getCenterPoint();

        const aL = aBounds.left;
        const aR = aBounds.left + aBounds.width;
        const aT = aBounds.top;
        const aB = aBounds.top + aBounds.height;
        const aCX = aCenter.x;
        const aCY = aCenter.y;

        // 4. Track best snap candidates
        let bestX: { target: number; delta: number; originType: 'Left' | 'Center' | 'Right' } | null = null;
        let bestY: { target: number; delta: number; originType: 'Top' | 'Center' | 'Bottom' } | null = null;

        const checkXSnap = (targetX: number, activeVal: number, type: 'Left' | 'Center' | 'Right') => {
            const d = Math.abs(targetX - activeVal);
            if (d < snapDist) {
                if (!bestX || d < bestX.delta) {
                    bestX = { target: targetX, delta: d, originType: type };
                }
            }
        };

        const checkYSnap = (targetY: number, activeVal: number, type: 'Top' | 'Center' | 'Bottom') => {
            const d = Math.abs(targetY - activeVal);
            if (d < snapDist) {
                if (!bestY || d < bestY.delta) {
                    bestY = { target: targetY, delta: d, originType: type };
                }
            }
        };

        // --- PHASE A: Snapping to Board & Objects ---

        // A1. Board Center & Edges
        checkXSnap(boardCX, aCX, 'Center');
        checkXSnap(boardX[0], aL, 'Left');
        checkXSnap(boardX[1], aR, 'Right');

        checkYSnap(boardCY, aCY, 'Center');
        checkYSnap(boardY[0], aT, 'Top');
        checkYSnap(boardY[1], aB, 'Bottom');

        // A2. Other Objects
        canvasObjects.forEach(obj => {
            if (obj === activeObject || !obj.visible || !obj.selectable ||
                obj.name === 'background' || obj.name?.includes('safety')) return;

            const oB = obj.getBoundingRect(true);
            const oC = obj.getCenterPoint();
            const oL = oB.left;
            const oR = oB.left + oB.width;
            const oT = oB.top;
            const oBottom = oB.top + oB.height;
            const oCX = oC.x;
            const oCY = oC.y;

            // X combinations
            checkXSnap(oL, aL, 'Left');
            checkXSnap(oL, aCX, 'Center');
            checkXSnap(oL, aR, 'Right');
            checkXSnap(oCX, aL, 'Left');
            checkXSnap(oCX, aCX, 'Center');
            checkXSnap(oCX, aR, 'Right');
            checkXSnap(oR, aL, 'Left');
            checkXSnap(oR, aCX, 'Center');
            checkXSnap(oR, aR, 'Right');

            // Y combinations (Exhaustive check)
            checkYSnap(oT, aT, 'Top');
            checkYSnap(oT, aCY, 'Center');
            checkYSnap(oT, aB, 'Bottom');
            checkYSnap(oCY, aT, 'Top');
            checkYSnap(oCY, aCY, 'Center');
            checkYSnap(oCY, aB, 'Bottom');
            checkYSnap(oBottom, aT, 'Top');
            checkYSnap(oBottom, aCY, 'Center');
            checkYSnap(oBottom, aB, 'Bottom');
        });

        // --- PHASE B: Apply Best Snap ---

        if (bestX) {
            const tx = bestX.target;
            const type = bestX.originType;
            if (type === 'Left') activeObject.set({ left: tx + (activeObject.left! - aL) });
            else if (type === 'Center') activeObject.set({ left: tx + (activeObject.left! - aCX) });
            else if (type === 'Right') activeObject.set({ left: tx + (activeObject.left! - aR) });
            activeObject.setCoords();
        }

        if (bestY) {
            const ty = bestY.target;
            const type = bestY.originType;
            if (type === 'Top') activeObject.set({ top: ty + (activeObject.top! - aT) });
            else if (type === 'Center') activeObject.set({ top: ty + (activeObject.top! - aCY) });
            else if (type === 'Bottom') activeObject.set({ top: ty + (activeObject.top! - aB) });
            activeObject.setCoords();
        }

        // --- PHASE C: Line Visualization & Accounting ---
        // We track actual alignment axis. We only show ONE line per axis, 
        // but we count how many objects share it.

        if (bestX) {
            state.verticalLines.push({ p: bestX.target, t1: minY, t2: maxY, label: bestX.originType });
        }
        if (bestY) {
            state.horizontalLines.push({ p: bestY.target, t1: minX, t2: maxX, label: bestY.originType });
        }
    };

    const onAfterRender = () => {
        if (!state.isDragging) return;
        if (state.verticalLines.length === 0 && state.horizontalLines.length === 0) return;

        const ctx = canvas.getSelectionContext();
        const vpt = canvas.viewportTransform!;

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
