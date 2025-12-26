import { fabric } from 'fabric';

/**
 * Initialize aligning guidelines for a fabric canvas.
 * This adds event listeners to show dashed lines when objects align.
 */
export function initAligningGuidelines(canvas: fabric.Canvas) {
    const ctx = canvas.getSelectionContext();
    const aligningLineOffset = 5;
    const aligningLineMargin = 4;
    const aligningLineWidth = 2; // Thicker line for better visibility
    const aligningLineColor = '#eb2416ff'; // Canva-like orange/red color
    const viewportTransform = canvas.viewportTransform;
    const zoom = canvas.getZoom();

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
        const activeObjectWidth = activeObject.getScaledWidth();
        const activeObjectHeight = activeObject.getScaledHeight();
        const activeObjectBoundingRect = activeObject.getBoundingRect();

        // @ts-ignore
        const transform = canvas._currentTransform;
        if (!transform) return;

        verticalLines = [];
        horizontalLines = [];

        // It's important to use the bounding rect for snapping to edges
        // But for center snapping, we use center points

        const activeObjectLeft = activeObjectBoundingRect.left;
        const activeObjectRight = activeObjectBoundingRect.left + activeObjectBoundingRect.width;
        const activeObjectTop = activeObjectBoundingRect.top;
        const activeObjectBottom = activeObjectBoundingRect.top + activeObjectBoundingRect.height;

        // Snap threshold
        const snappingDistance = 10;

        let isInVerticalCenter = false;
        let isInHorizontalCenter = false;

        const canvasWidth = canvas.width || 0;
        const canvasHeight = canvas.height || 0;

        // SNAP TO CANVAS CENTER (Vertical)
        if (Math.abs(activeObjectCenter.x - canvasWidth / 2) < snappingDistance) {
            activeObject.set({ left: canvasWidth / 2 });
            activeObject.setCoords();
            verticalLines.push({
                x: canvasWidth / 2,
                y1: 0,
                y2: canvasHeight
            });
            isInVerticalCenter = true;
        }

        // SNAP TO CANVAS CENTER (Horizontal)
        if (Math.abs(activeObjectCenter.y - canvasHeight / 2) < snappingDistance) {
            activeObject.set({ top: canvasHeight / 2 });
            activeObject.setCoords();
            horizontalLines.push({
                y: canvasHeight / 2,
                x1: 0,
                x2: canvasWidth
            });
            isInHorizontalCenter = true;
        }

        // Traverse all objects
        for (let i = canvasObjects.length; i--;) {
            // @ts-ignore
            if (canvasObjects[i] === activeObject || !canvasObjects[i].visible || canvasObjects[i].name === 'background' || canvasObjects[i].name === 'safetyGuide') continue;

            const object = canvasObjects[i];
            const objectCenter = object.getCenterPoint();
            const objectBoundingRect = object.getBoundingRect();

            const objectLeft = objectBoundingRect.left;
            const objectRight = objectBoundingRect.left + objectBoundingRect.width;
            const objectTop = objectBoundingRect.top;
            const objectBottom = objectBoundingRect.top + objectBoundingRect.height;

            // SNAP VERTICAL (X-axis alignment)

            // 1. Center to Center
            if (Math.abs(activeObjectCenter.x - objectCenter.x) < snappingDistance) {
                activeObject.setPositionByOrigin(
                    new fabric.Point(objectCenter.x, activeObjectCenter.y),
                    'center',
                    'center'
                );
                verticalLines.push({
                    x: objectCenter.x,
                    y1: Math.min(activeObjectTop, objectTop) - aligningLineOffset,
                    y2: Math.max(activeObjectBottom, objectBottom) + aligningLineOffset
                });
                isInVerticalCenter = true;
            }

            // 2. Left to Left
            if (Math.abs(activeObjectLeft - objectLeft) < snappingDistance) {
                activeObject.setPositionByOrigin(
                    new fabric.Point(objectLeft + activeObjectWidth / 2 + (activeObjectCenter.x - activeObjectLeft), activeObjectCenter.y),
                    'center',
                    'center'
                );
                // Recalculate after snap
                const newLeft = objectLeft;
                activeObject.set({ left: newLeft }); // Simple set for left-aligned origin
                verticalLines.push({
                    x: objectLeft,
                    y1: Math.min(activeObjectTop, objectTop) - aligningLineOffset,
                    y2: Math.max(activeObjectBottom, objectBottom) + aligningLineOffset
                });
            }

            // 3. Right to Right
            if (Math.abs(activeObjectRight - objectRight) < snappingDistance) {
                verticalLines.push({
                    x: objectRight,
                    y1: Math.min(activeObjectTop, objectTop) - aligningLineOffset,
                    y2: Math.max(activeObjectBottom, objectBottom) + aligningLineOffset
                });
                activeObject.set({ left: objectRight - activeObjectBoundingRect.width });
            }


            // SNAP HORIZONTAL (Y-axis alignment)

            // 1. Center to Center
            if (Math.abs(activeObjectCenter.y - objectCenter.y) < snappingDistance) {
                activeObject.setPositionByOrigin(
                    new fabric.Point(activeObjectCenter.x, objectCenter.y),
                    'center',
                    'center'
                );
                horizontalLines.push({
                    y: objectCenter.y,
                    x1: Math.min(activeObjectLeft, objectLeft) - aligningLineOffset,
                    x2: Math.max(activeObjectRight, objectRight) + aligningLineOffset
                });
                isInHorizontalCenter = true;
            }

            // 2. Top to Top
            if (Math.abs(activeObjectTop - objectTop) < snappingDistance) {
                activeObject.setPositionByOrigin(
                    new fabric.Point(activeObjectCenter.x, objectTop + activeObjectHeight / 2 - (activeObjectCenter.y - activeObjectTop)),
                    'center',
                    'center'
                );
                activeObject.set({ top: objectTop });
                horizontalLines.push({
                    y: objectTop,
                    x1: Math.min(activeObjectLeft, objectLeft) - aligningLineOffset,
                    x2: Math.max(activeObjectRight, objectRight) + aligningLineOffset
                });
            }

            // 3. Bottom to Bottom
            if (Math.abs(activeObjectBottom - objectBottom) < snappingDistance) {
                activeObject.setPositionByOrigin(
                    new fabric.Point(activeObjectCenter.x, objectBottom - activeObjectHeight / 2 - (activeObjectBottom - activeObjectCenter.y)),
                    'center',
                    'center'
                );
                activeObject.set({ top: objectBottom - activeObjectBoundingRect.height });
                horizontalLines.push({
                    y: objectBottom,
                    x1: Math.min(activeObjectLeft, objectLeft) - aligningLineOffset,
                    x2: Math.max(activeObjectRight, objectRight) + aligningLineOffset
                });
            }
        }
    });

    canvas.on('after:render', () => {
        // @ts-ignore
        if (!canvas.contextTop) return;

        // @ts-ignore
        const ctx = canvas.contextTop;

        // @ts-ignore
        canvas.clearContext(canvas.contextTop);

        ctx.save();
        ctx.lineWidth = aligningLineWidth;
        ctx.strokeStyle = aligningLineColor;
        ctx.setLineDash([8, 8]); // Dashed line
        ctx.beginPath();

        // Draw vertical lines
        for (let i = verticalLines.length; i--;) {
            const line = verticalLines[i];

            // Convert canvas coordinates to viewport coordinates
            // This is crucial because contextTop sits above the canvas and isn't transformed by viewportTransform automatically in the same way for custom drawing sometimes, 
            // BUT usually after:render is in the transformed context? 
            // Actually, contextTop is the upper canvas. We need to draw in canvas coordinates but transformed.
            // Fabric's drawing usually handles this if we use the main context, but contextTop is overlay.

            // Let's try drawing directly using fabric's coordinate system transform
            const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

            const origin = fabric.util.transformPoint(new fabric.Point(line.x, line.y1), vpt);
            const end = fabric.util.transformPoint(new fabric.Point(line.x, line.y2), vpt);

            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(end.x, end.y);
        }

        // Draw horizontal lines
        for (let i = horizontalLines.length; i--;) {
            const line = horizontalLines[i];

            const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

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
