import { fabric } from 'fabric';

/**
 * Initialize aligning guidelines for a fabric canvas.
 * Shows visual alignment lines when dragging objects near canvas center or other objects.
 * 
 * Features:
 * - Anti-Ghosting: Canvas-Level Instance ID prevents orphaned listeners
 * - Strict Visibility: Lines only render when actively dragging
 * - Multi-Object Support: Aligns with canvas center and all other visible objects
 */
export function initAligningGuidelines(canvas: fabric.Canvas) {
    // ANTI-GHOSTING PROTECTION
    // Generate unique ID for THIS instance and store it on the canvas.
    // All handlers check this ID before executing.
    const myInstanceId = Date.now() + Math.random();
    (canvas as any).__currentAligningId = myInstanceId;

    // Dispose any previous instance
    if ((canvas as any).__disposeAligningGuidelines) {
        (canvas as any).__disposeAligningGuidelines();
    }

    // Visual Configuration
    const lineWidth = 0.25;
    const lineColor = '#ff00ff'; // Magenta
    const labelFont = '10px sans-serif';

    // State (scoped to this closure)
    let isDragging = false;
    let verticalLines: { x: number; y1: number; y2: number; label: string }[] = [];
    let horizontalLines: { y: number; x1: number; x2: number; label: string }[] = [];

    // EVENT HANDLERS (all verify instance ID)

    const onMouseDown = () => {
        if ((canvas as any).__currentAligningId !== myInstanceId) return;
        isDragging = true;
        verticalLines = [];
        horizontalLines = [];
    };

    const onMouseUp = () => {
        if ((canvas as any).__currentAligningId !== myInstanceId) return;
        isDragging = false;
        verticalLines = [];
        horizontalLines = [];
        canvas.requestRenderAll();
    };

    const onObjectMoving = (e: fabric.IEvent) => {
        if ((canvas as any).__currentAligningId !== myInstanceId) return;
        if (!isDragging || !e.target) return;

        const activeObject = e.target;
        const canvasObjects = canvas.getObjects();
        const activeCenter = activeObject.getCenterPoint();
        const activeBounds = activeObject.getBoundingRect();

        // @ts-ignore
        const transform = canvas._currentTransform;
        if (!transform) return;

        // Clear previous lines
        verticalLines = [];
        horizontalLines = [];

        // Active object geometry
        const aLeft = activeBounds.left;
        const aRight = activeBounds.left + activeBounds.width;
        const aTop = activeBounds.top;
        const aBottom = activeBounds.top + activeBounds.height;
        const aCenterX = activeCenter.x;
        const aCenterY = activeCenter.y;

        // Snap configuration
        const zoom = canvas.getZoom();
        const snapDistance = 8 / zoom;
        const canvasWidth = canvas.width! / zoom;
        const canvasHeight = canvas.height! / zoom;

        // Best snap candidates
        let bestSnapX: { snapTo: number; value: number; type: 'left' | 'center' | 'right' } | null = null;
        let bestSnapY: { snapTo: number; value: number; type: 'top' | 'center' | 'bottom' } | null = null;

        const updateBestX = (snapTo: number, value: number, type: 'left' | 'center' | 'right') => {
            const dist = Math.abs(snapTo - value);
            if (dist < snapDistance) {
                if (!bestSnapX || dist < Math.abs(bestSnapX.snapTo - bestSnapX.value)) {
                    bestSnapX = { snapTo, value, type };
                }
            }
        };

        const updateBestY = (snapTo: number, value: number, type: 'top' | 'center' | 'bottom') => {
            const dist = Math.abs(snapTo - value);
            if (dist < snapDistance) {
                if (!bestSnapY || dist < Math.abs(bestSnapY.snapTo - bestSnapY.value)) {
                    bestSnapY = { snapTo, value, type };
                }
            }
        };

        // 1. Check Canvas Center
        updateBestX(canvasWidth / 2, aCenterX, 'center');
        updateBestY(canvasHeight / 2, aCenterY, 'center');

        // 2. Check All Other Objects
        for (let i = canvasObjects.length; i--;) {
            const obj = canvasObjects[i];

            // Skip: self, background, safety guide, invisible, non-selectable
            if (obj === activeObject || !obj.visible || !obj.selectable ||
                obj.name === 'background' ||
                obj.name === 'safety_guide' ||
                obj.name === 'safetyGuide' ||
                obj.name?.includes('template_')) {
                continue;
            }

            const objBounds = obj.getBoundingRect();
            const objCenter = obj.getCenterPoint();

            // Horizontal Alignment (X-axis)
            updateBestX(objCenter.x, aCenterX, 'center');
            updateBestX(objBounds.left, aLeft, 'left');
            updateBestX(objBounds.left + objBounds.width, aRight, 'right');
            updateBestX(objBounds.left, aCenterX, 'center');
            updateBestX(objBounds.left + objBounds.width, aCenterX, 'center');

            // Vertical Alignment (Y-axis)
            updateBestY(objCenter.y, aCenterY, 'center');
            updateBestY(objBounds.top, aTop, 'top');
            updateBestY(objBounds.top + objBounds.height, aBottom, 'bottom');
            updateBestY(objBounds.top, aCenterY, 'center');
            updateBestY(objBounds.top + objBounds.height, aCenterY, 'center');
        }

        // Add lines for best matches
        if (bestSnapX) {
            verticalLines.push({
                x: bestSnapX.snapTo,
                y1: 0,
                y2: canvasHeight,
                label: bestSnapX.type.charAt(0).toUpperCase() + bestSnapX.type.slice(1)
            });
        }

        if (bestSnapY) {
            horizontalLines.push({
                y: bestSnapY.snapTo,
                x1: 0,
                x2: canvasWidth,
                label: bestSnapY.type.charAt(0).toUpperCase() + bestSnapY.type.slice(1)
            });
        }
    };

    const onAfterRender = () => {
        // ANTI-GHOSTING: Verify this is the active instance
        if ((canvas as any).__currentAligningId !== myInstanceId) return;

        // Expose debug info for debugger UI
        (canvas as any).__debug_align = {
            isDragging,
            vLines: verticalLines.length,
            hLines: horizontalLines.length
        };

        // STRICT VISIBILITY: Only render when actively dragging
        if (!isDragging) return;
        if (verticalLines.length === 0 && horizontalLines.length === 0) return;

        // @ts-ignore
        const ctx = canvas.contextTop;
        if (!ctx) return;

        ctx.save();
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = lineColor;
        ctx.fillStyle = lineColor;
        ctx.font = labelFont;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();

        const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

        // Draw vertical lines
        for (const line of verticalLines) {
            const start = fabric.util.transformPoint(new fabric.Point(line.x, line.y1), vpt);
            const end = fabric.util.transformPoint(new fabric.Point(line.x, line.y2), vpt);
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.fillText(line.label, start.x + 4, start.y + 12);
        }

        // Draw horizontal lines
        for (const line of horizontalLines) {
            const start = fabric.util.transformPoint(new fabric.Point(line.x1, line.y), vpt);
            const end = fabric.util.transformPoint(new fabric.Point(line.x2, line.y), vpt);
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.fillText(line.label, start.x + 4, start.y - 4);
        }

        ctx.stroke();
        ctx.restore();
    };

    // Attach event listeners
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
        delete (canvas as any).__currentAligningId;
        delete (canvas as any).__debug_align;
    };

    // Store dispose function on canvas
    (canvas as any).__disposeAligningGuidelines = dispose;

    return dispose;
}
