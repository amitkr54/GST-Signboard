import { fabric } from 'fabric';

/**
 * Initialize aligning guidelines for a fabric canvas.
 * This adds event listeners to show dashed lines when objects align.
 */
export function initAligningGuidelines(canvas: fabric.Canvas) {
    const aligningLineOffset = 5;
    const aligningLineWidth = 1;
    const aligningLineColor = '#ff00ff'; // Canva magenta

    let verticalLines: { x: number; y1: number; y2: number }[] = [];
    let horizontalLines: { y: number; x1: number; x2: number }[] = [];

    // Clear existing listeners to prevent duplicates
    canvas.off('mouse:down');
    canvas.off('object:moving');
    canvas.off('after:render');
    canvas.off('mouse:up');

    canvas.on('mouse:down', () => {
        verticalLines = [];
        horizontalLines = [];
    });

    canvas.on('object:moving', (e) => {
        if (!e.target) return;

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

        // Dynamic snap threshold: 4 physical pixels on screen
        const zoom = canvas.getZoom();
        const snappingDistance = 4 / zoom;

        const canvasWidth = canvas.width! / zoom;
        const canvasHeight = canvas.height! / zoom;

        // Potential Snapping Points
        let bestSnapX: { snapTo: number; value: number; type: 'left' | 'center' | 'right' } | null = null;
        let bestSnapY: { snapTo: number; value: number; type: 'top' | 'center' | 'bottom' } | null = null;

        function updateBestX(snapTo: number, value: number, type: any) {
            const dist = Math.abs(snapTo - value);
            if (dist < snappingDistance) {
                if (!bestSnapX || dist < Math.abs(bestSnapX.snapTo - bestSnapX.value)) {
                    bestSnapX = { snapTo, value, type };
                }
            }
        }

        function updateBestY(snapTo: number, value: number, type: any) {
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
            if (object === activeObject || !object.visible ||
                object.name === 'background' ||
                object.name?.includes('template_')) continue;

            const br = object.getBoundingRect();
            const center = object.getCenterPoint();

            // X-axis Snapping
            updateBestX(center.x, activeObjectCenterX, 'center');
            updateBestX(br.left, activeObjectLeft, 'left');
            updateBestX(br.left + br.width, activeObjectRight, 'right');
            updateBestX(br.left, activeObjectCenterX, 'center'); // Edge to center
            updateBestX(br.left + br.width, activeObjectCenterX, 'center');

            // Y-axis Snapping
            updateBestY(center.y, activeObjectCenterY, 'center');
            updateBestY(br.top, activeObjectTop, 'top');
            updateBestY(br.top + br.height, activeObjectBottom, 'bottom');
            updateBestY(br.top, activeObjectCenterY, 'center');
            updateBestY(br.top + br.height, activeObjectCenterY, 'center');
        }

        // Apply best snaps
        if (bestSnapX) {
            let newLeft = activeObject.left!;
            if (bestSnapX.type === 'center') {
                // If snapping center, we need to adjust based on where the center is relative to left
                const offsetX = activeObjectCenterX - activeObject.left!;
                newLeft = bestSnapX.snapTo - offsetX;
            } else if (bestSnapX.type === 'left') {
                newLeft = bestSnapX.snapTo;
            } else if (bestSnapX.type === 'right') {
                newLeft = bestSnapX.snapTo - activeObjectBoundingRect.width;
            }
            activeObject.set({ left: newLeft });
            verticalLines.push({ x: bestSnapX.snapTo, y1: 0, y2: canvasHeight });
        }

        if (bestSnapY) {
            let newTop = activeObject.top!;
            if (bestSnapY.type === 'center') {
                const offsetY = activeObjectCenterY - activeObject.top!;
                newTop = bestSnapY.snapTo - offsetY;
            } else if (bestSnapY.type === 'top') {
                newTop = bestSnapY.snapTo;
            } else if (bestSnapY.type === 'bottom') {
                newTop = bestSnapY.snapTo - activeObjectBoundingRect.height;
            }
            activeObject.set({ top: newTop });
            horizontalLines.push({ y: bestSnapY.snapTo, x1: 0, x2: canvasWidth });
        }

        if (bestSnapX || bestSnapY) {
            activeObject.setCoords();
        }
    });

    canvas.on('after:render', () => {
        // @ts-ignore
        const ctx = canvas.contextTop;
        if (!ctx) return;

        // @ts-ignore
        canvas.clearContext(ctx);

        ctx.save();
        ctx.lineWidth = aligningLineWidth;
        ctx.strokeStyle = aligningLineColor;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();

        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

        for (const line of verticalLines) {
            const origin = fabric.util.transformPoint(new fabric.Point(line.x, line.y1), vpt);
            const end = fabric.util.transformPoint(new fabric.Point(line.x, line.y2), vpt);
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(end.x, end.y);
        }

        for (const line of horizontalLines) {
            const origin = fabric.util.transformPoint(new fabric.Point(line.x1, line.y), vpt);
            const end = fabric.util.transformPoint(new fabric.Point(line.x2, line.y), vpt);
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(end.x, end.y);
        }

        ctx.stroke();
        ctx.restore();
    });

    canvas.on('mouse:up', () => {
        verticalLines = [];
        horizontalLines = [];
        canvas.requestRenderAll();
    });
}
