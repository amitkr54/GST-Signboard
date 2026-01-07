import { fabric } from 'fabric';

/**
 * Initialize aligning guidelines for a fabric canvas.
 * This adds event listeners to show dashed lines when objects align.
 */
export function initAligningGuidelines(canvas: fabric.Canvas) {
    // Canvas-Level Zombie Protection
    // We generate a unique ID for THIS instance of the guidelines.
    // We store it on the canvas. Only listeners with the matching ID are allowed to run.
    const myId = Date.now() + Math.random();
    (canvas as any).__currentAligningId = myId;

    // Enforce Singleton: Allow only one set of guidelines per canvas
    if ((canvas as any).__disposeAligningGuidelines) {
        (canvas as any).__disposeAligningGuidelines();
    }

    const aligningLineOffset = 5;
    const aligningLineWidth = 0.25; // Fine line width
    const aligningLineColor = '#ff00ff'; // Magenta
    const labelFont = '10px sans-serif';

    let verticalLines: { x: number; y1: number; y2: number; label: string }[] = [];
    let horizontalLines: { y: number; x1: number; x2: number; label: string }[] = [];
    let isDragging = false;

    const onMouseDown = () => {
        if ((canvas as any).__currentAligningId !== myId) return;
        isDragging = true;
        verticalLines = [];
        horizontalLines = [];
    };

    const onMouseUp = () => {
        if ((canvas as any).__currentAligningId !== myId) return;
        isDragging = false;
        verticalLines = [];
        horizontalLines = [];
        canvas.requestRenderAll();
    };

    const onObjectMoving = (e: fabric.IEvent) => {
        if ((canvas as any).__currentAligningId !== myId) return;
        if (!isDragging || !e.target) return;

        const activeObject = e.target;
        const canvasObjects = canvas.getObjects();
        const activeObjectCenter = activeObject.getCenterPoint();
        const activeObjectBoundingRect = activeObject.getBoundingRect();

        // @ts-ignore
        const transform = canvas._currentTransform;
        if (!transform) return;

        verticalLines = [];
        horizontalLines = [];

        const activeObjectLeft = activeObjectBoundingRect.left;
        const activeObjectRight = activeObjectBoundingRect.left + activeObjectBoundingRect.width;
        const activeObjectTop = activeObjectBoundingRect.top;
        const activeObjectBottom = activeObjectBoundingRect.top + activeObjectBoundingRect.height;
        const activeObjectCenterX = activeObjectCenter.x;
        const activeObjectCenterY = activeObjectCenter.y;

        // Dynamic snap threshold
        const zoom = canvas.getZoom();
        const snappingDistance = 8 / zoom;

        const canvasWidth = canvas.width! / zoom;
        const canvasHeight = canvas.height! / zoom;

        // Potential Snapping Points
        let bestSnapX: { snapTo: number; value: number; type: 'left' | 'center' | 'right' } | null = null;
        let bestSnapY: { snapTo: number; value: number; type: 'top' | 'center' | 'bottom' } | null = null;

        function updateBestX(snapTo: number, value: number, type: 'left' | 'center' | 'right') {
            const dist = Math.abs(snapTo - value);
            if (dist < snappingDistance) {
                if (!bestSnapX || dist < Math.abs(bestSnapX.snapTo - bestSnapX.value)) {
                    bestSnapX = { snapTo, value, type };
                }
            }
        }

        function updateBestY(snapTo: number, value: number, type: 'top' | 'center' | 'bottom') {
            const dist = Math.abs(snapTo - value);
            if (dist < snappingDistance) {
                if (!bestSnapY || dist < Math.abs(bestSnapY.snapTo - bestSnapY.value)) {
                    bestSnapY = { snapTo, value, type };
                }
            }
        }

        // 1. Snap to Canvas Center
        updateBestX(canvasWidth / 2, activeObjectCenterX, 'center');
        updateBestY(canvasHeight / 2, activeObjectCenterY, 'center');

        // 2. Snap to other objects
        for (let i = canvasObjects.length; i--;) {
            const object = canvasObjects[i];
            // Exclude background, safety guide (both naming conventions), and templates
            if (object === activeObject || !object.visible ||
                object.name === 'background' ||
                object.name === 'safety_guide' ||
                object.name === 'safetyGuide' ||
                object.name?.includes('template_')) continue;

            const br = object.getBoundingRect();
            const center = object.getCenterPoint();

            // X-axis Snapping
            updateBestX(center.x, activeObjectCenterX, 'center');
            updateBestX(br.left, activeObjectLeft, 'left');
            updateBestX(br.left + br.width, activeObjectRight, 'right');
            updateBestX(br.left, activeObjectCenterX, 'center');
            updateBestX(br.left + br.width, activeObjectCenterX, 'center');

            // Y-axis Snapping
            updateBestY(center.y, activeObjectCenterY, 'center');
            updateBestY(br.top, activeObjectTop, 'top');
            updateBestY(br.top + br.height, activeObjectBottom, 'bottom');
            updateBestY(br.top, activeObjectCenterY, 'center');
            updateBestY(br.top + br.height, activeObjectCenterY, 'center');
        }

        if (bestSnapX) {
            verticalLines.push({
                x: bestSnapX!.snapTo,
                y1: 0,
                y2: canvasHeight,
                label: bestSnapX!.type.charAt(0).toUpperCase() + bestSnapX!.type.slice(1) // Capitalize
            });
        }

        if (bestSnapY) {
            horizontalLines.push({
                y: bestSnapY!.snapTo,
                x1: 0,
                x2: canvasWidth,
                label: bestSnapY!.type.charAt(0).toUpperCase() + bestSnapY!.type.slice(1)
            });
        }
    };

    const onAfterRender = () => {
        // Only run if THIS is the active instance on the canvas
        if ((canvas as any).__currentAligningId !== myId) return;

        // Expose debug info
        (canvas as any).__debug_align = {
            isDragging,
            vLines: verticalLines.length,
            hLines: horizontalLines.length
        };

        if (!isDragging) return;
        if (verticalLines.length === 0 && horizontalLines.length === 0) return;

        // @ts-ignore
        const ctx = canvas.contextTop;
        if (!ctx) return;

        ctx.save();
        ctx.lineWidth = aligningLineWidth;
        ctx.strokeStyle = aligningLineColor;
        ctx.fillStyle = aligningLineColor; // Text color matches line
        ctx.font = labelFont;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();

        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

        for (const line of verticalLines) {
            const origin = fabric.util.transformPoint(new fabric.Point(line.x, line.y1), vpt);
            const end = fabric.util.transformPoint(new fabric.Point(line.x, line.y2), vpt);
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(end.x, end.y);
            // Draw Label at top
            ctx.fillText(line.label, origin.x + 4, origin.y + 12);
        }

        for (const line of horizontalLines) {
            const origin = fabric.util.transformPoint(new fabric.Point(line.x1, line.y), vpt);
            const end = fabric.util.transformPoint(new fabric.Point(line.x2, line.y), vpt);
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(end.x, end.y);
            // Draw Label at left
            ctx.fillText(line.label, origin.x + 4, origin.y - 4);
        }

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

    // Return cleanup function
    const dispose = () => {
        canvas.off('mouse:down', onMouseDown);
        canvas.off('object:moving', onObjectMoving);
        canvas.off('after:render', onAfterRender);
        canvas.off('mouse:up', onMouseUp);
        canvas.off('object:modified', onMouseUp);
        canvas.off('mouse:out', onMouseUp);
        canvas.off('selection:cleared', onMouseUp);
        delete (canvas as any).__disposeAligningGuidelines;
    };

    (canvas as any).__disposeAligningGuidelines = dispose;
    return dispose;
}
