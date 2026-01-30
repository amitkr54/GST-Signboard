import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface UseCanvasGesturesProps {
    canvasInstance: fabric.Canvas | null;
    compact: boolean;
    scale: number;
    setRotationAngle: (angle: number | null) => void;
    setIsEditingTextMobile: (val: boolean) => void;
    setMobileTextValue: (val: string) => void;
    setMobileInputPos: (pos: { top: number, left: number } | undefined) => void;
    mobileEditingObjectRef: React.MutableRefObject<fabric.IText | null>;
}

export function useCanvasGestures({
    canvasInstance,
    compact,
    scale,
    setRotationAngle,
    setIsEditingTextMobile,
    setMobileTextValue,
    setMobileInputPos,
    mobileEditingObjectRef
}: UseCanvasGesturesProps) {
    const compactRef = useRef(compact);

    useEffect(() => {
        compactRef.current = compact;
    }, [compact]);

    useEffect(() => {
        if (!canvasInstance) return;

        // Rotation indicator
        const handleRotating = (e: fabric.IEvent) => {
            const obj = e.target;
            if (obj) {
                const angle = Math.round(obj.angle || 0);
                setRotationAngle(angle);
            }
        };

        const handleModified = () => {
            setRotationAngle(null);
        };

        const handleSelectionCleared = () => {
            setRotationAngle(null);
        };

        // Double-tap detection for mobile
        let lastTapTime = 0;
        let lastTapTarget: any = null;
        const DOUBLE_TAP_DELAY = 300;

        const handleMouseDown = (e: fabric.IEvent) => {
            if (!compactRef.current) return;
            if (!e.target || (e.target.type !== 'i-text' && e.target.type !== 'textbox')) return;

            const now = Date.now();
            const timeSinceLastTap = now - lastTapTime;

            if (timeSinceLastTap < DOUBLE_TAP_DELAY && lastTapTarget === e.target) {
                // Double-tap detected!
                const textObj = e.target as fabric.IText;
                mobileEditingObjectRef.current = textObj;
                setMobileTextValue(textObj.text || '');

                // Calculate screen position
                const rect = canvasInstance.getElement().getBoundingClientRect();
                const center = textObj.getBoundingRect();
                setMobileInputPos({
                    top: rect.top + (center.top * scale),
                    left: rect.left + (center.left * scale)
                });

                setIsEditingTextMobile(true);
                lastTapTime = 0;
                lastTapTarget = null;
            } else {
                // First tap
                lastTapTime = now;
                lastTapTarget = e.target;
            }
        };

        // Desktop fallback
        const handleDblClick = (e: fabric.IEvent) => {
            if (compactRef.current && e.target && (e.target.type === 'i-text' || e.target.type === 'textbox')) {
                const textObj = e.target as fabric.IText;
                mobileEditingObjectRef.current = textObj;
                setMobileTextValue(textObj.text || '');

                const rect = canvasInstance.getElement().getBoundingClientRect();
                const center = textObj.getBoundingRect();
                setMobileInputPos({
                    top: rect.top + (center.top * scale),
                    left: rect.left + (center.left * scale)
                });

                setIsEditingTextMobile(true);
            }
        };

        canvasInstance.on('object:rotating', handleRotating);
        canvasInstance.on('object:modified', handleModified);
        canvasInstance.on('selection:cleared', handleSelectionCleared);
        canvasInstance.on('mouse:down', handleMouseDown);
        canvasInstance.on('mouse:dblclick', handleDblClick);

        return () => {
            canvasInstance.off('object:rotating', handleRotating);
            canvasInstance.off('object:modified', handleModified);
            canvasInstance.off('selection:cleared', handleSelectionCleared);
            canvasInstance.off('mouse:down', handleMouseDown);
            canvasInstance.off('mouse:dblclick', handleDblClick);
        };
    }, [canvasInstance, scale, setRotationAngle, setIsEditingTextMobile, setMobileTextValue, setMobileInputPos, mobileEditingObjectRef]);
}
