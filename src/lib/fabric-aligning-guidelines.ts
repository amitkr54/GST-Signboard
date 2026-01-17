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

const SNAP_DISTANCE = 8;     // Pixels to snap from
const LINE_WIDTH = 2;        // Thickness of the guidelines
const LINE_COLOR = '#b3166cff';  // Magenta color for high visibility
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
    const instanceId = Math.random().toString(36).substring(7);
    console.log(`[AligningGuidelines:${instanceId}] Initializing with native objects...`);

    // 0. Prevent Multiple Initializations
    if ((canvas as any).__hasAligningGuidelines) {
        console.warn(`[AligningGuidelines:${instanceId}] ALREADY INITIALIZED on this canvas. Skipping.`);
        return (canvas as any).__disposeAligningGuidelines;
    }

    // Guidelines Objects
    const createGuideLine = (isVertical: boolean) => new fabric.Line([0, 0, 0, 0], {
        stroke: LINE_COLOR,
        strokeWidth: LINE_WIDTH,
        selectable: false,
        evented: false,
        visible: false,
        opacity: 0.8,
        name: isVertical ? '__v_guide' : '__h_guide',
        //@ts-ignore
        excludeFromExport: true
    });

    const createLabel = () => new fabric.Text('', {
        fontSize: 10,
        fontFamily: 'sans-serif',
        fill: LINE_COLOR,
        selectable: false,
        evented: false,
        visible: false,
        name: '__guide_label',
        //@ts-ignore
        excludeFromExport: true
    });

    const vLine = createGuideLine(true);
    const hLine = createGuideLine(false);
    const vLabel = createLabel();
    const hLabel = createLabel();

    canvas.add(vLine, hLine, vLabel, hLabel);

    const state = getOrInitState(canvas);

    const clearGuides = () => {
        vLine.set({ visible: false });
        hLine.set({ visible: false });
        vLabel.set({ visible: false });
        hLabel.set({ visible: false });
        state.isDragging = false;
        canvas.requestRenderAll();
    };

    const onMouseDown = () => {
        state.isDragging = true;
    };

    const onMouseUp = (e?: any) => {
        console.log(`[AligningGuidelines:${instanceId}] onMouseUp, isDragging was: ${state.isDragging}`);
        clearGuides();
    };

    const onObjectMoving = (e: fabric.IEvent) => {
        if (!e.target) return;
        state.isDragging = true;

        const activeObject = e.target;
        const canvasObjects = canvas.getObjects();
        const zoom = canvas.getZoom();
        const snapDist = SNAP_DISTANCE / zoom;

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
        let boardX = [minX, maxX];
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

        const aBounds = activeObject.getBoundingRect(true);
        const aCenter = activeObject.getCenterPoint();

        const aL = aBounds.left;
        const aR = aBounds.left + aBounds.width;
        const aT = aBounds.top;
        const aB = aBounds.top + aBounds.height;
        const aCX = aCenter.x;
        const aCY = aCenter.y;

        let bestX: any = null;
        let bestY: any = null;

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

        checkXSnap(boardCX, aCX, 'Center');
        checkXSnap(boardX[0], aL, 'Left');
        checkXSnap(boardX[1], aR, 'Right');
        checkYSnap(boardCY, aCY, 'Center');
        checkYSnap(boardY[0], aT, 'Top');
        checkYSnap(boardY[1], aB, 'Bottom');

        canvasObjects.forEach(obj => {
            if (obj === activeObject || !obj.visible || !obj.selectable ||
                obj.name === 'background' || obj.name?.includes('safety') || obj.name?.includes('guide')) return;

            const oB = obj.getBoundingRect(true);
            const oC = obj.getCenterPoint();
            const oL = oB.left;
            const oR = oB.left + oB.width;
            const oT = oB.top;
            const oBottom = oB.top + oB.height;
            const oCX = oC.x;
            const oCY = oC.y;

            checkXSnap(oL, aL, 'Left');
            checkXSnap(oL, aCX, 'Center');
            checkXSnap(oL, aR, 'Right');
            checkXSnap(oCX, aL, 'Left');
            checkXSnap(oCX, aCX, 'Center');
            checkXSnap(oCX, aR, 'Right');
            checkXSnap(oR, aL, 'Left');
            checkXSnap(oR, aCX, 'Center');
            checkXSnap(oR, aR, 'Right');

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

        if (bestX) {
            const tx = bestX.target;
            const type = bestX.originType;
            if (type === 'Left') activeObject.set({ left: tx + (activeObject.left! - aL) });
            else if (type === 'Center') activeObject.set({ left: tx + (activeObject.left! - aCX) });
            else if (type === 'Right') activeObject.set({ left: tx + (activeObject.left! - aR) });
            activeObject.setCoords();

            vLine.set({ x1: tx, x2: tx, y1: minY, y2: maxY, visible: true });
            vLabel.set({ left: tx + 4, top: minY + 15, text: type, visible: true });
        } else {
            vLine.set({ visible: false });
            vLabel.set({ visible: false });
        }

        if (bestY) {
            const ty = bestY.target;
            const type = bestY.originType;
            if (type === 'Top') activeObject.set({ top: ty + (activeObject.top! - aT) });
            else if (type === 'Center') activeObject.set({ top: ty + (activeObject.top! - aCY) });
            else if (type === 'Bottom') activeObject.set({ top: ty + (activeObject.top! - aB) });
            activeObject.setCoords();

            hLine.set({ y1: ty, y2: ty, x1: minX, x2: maxX, visible: true });
            hLabel.set({ left: minX + 5, top: ty - 12, text: type, visible: true });
        } else {
            hLine.set({ visible: false });
            hLabel.set({ visible: false });
        }

        canvas.bringToFront(vLine);
        canvas.bringToFront(hLine);
        canvas.bringToFront(vLabel);
        canvas.bringToFront(hLabel);
    };

    const onWindowMouseUp = (e: MouseEvent) => {
        if (state.isDragging) onMouseUp({ e });
    };

    canvas.on('mouse:down', onMouseDown);
    canvas.on('object:moving', onObjectMoving);
    canvas.on('mouse:up', onMouseUp);
    canvas.on('object:modified', onMouseUp);
    canvas.on('mouse:out', onMouseUp);
    canvas.on('selection:cleared', onMouseUp);
    window.addEventListener('mouseup', onWindowMouseUp);

    const dispose = () => {
        console.log(`[AligningGuidelines:${instanceId}] Disposing native objects`);
        canvas.off('mouse:down', onMouseDown);
        canvas.off('object:moving', onObjectMoving);
        canvas.off('mouse:up', onMouseUp);
        canvas.off('object:modified', onMouseUp);
        canvas.off('mouse:out', onMouseUp);
        canvas.off('selection:cleared', onMouseUp);
        window.removeEventListener('mouseup', onWindowMouseUp);

        canvas.remove(vLine, hLine, vLabel, hLabel);
        (canvas as any).__hasAligningGuidelines = false;
    };

    (canvas as any).__hasAligningGuidelines = true;
    (canvas as any).__disposeAligningGuidelines = dispose;
    return dispose;
}
