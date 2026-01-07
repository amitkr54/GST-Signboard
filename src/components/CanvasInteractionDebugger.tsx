import React from 'react';
import { fabric } from 'fabric';

interface CanvasInteractionDebuggerProps {
    selectedObject: fabric.Object | null;
}

export function CanvasInteractionDebugger({ selectedObject }: CanvasInteractionDebuggerProps) {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[10px] p-2 rounded pointer-events-none font-mono z-50">
            <div>Type: {selectedObject?.type || 'none'}</div>
            <div>Name: {(selectedObject as any)?.name || 'none'}</div>
            <div>Selectable: {String(selectedObject?.selectable)}</div>
            <div>Evented: {String(selectedObject?.evented)}</div>
            <div>Editing: {String((selectedObject as any)?.isEditing)}</div>
            {(selectedObject as any)?.type?.includes('text') && (
                <>
                    <div>SelStart: {(selectedObject as any)?.selectionStart}</div>
                    <div>SelEnd: {(selectedObject as any)?.selectionEnd}</div>
                </>
            )}
        </div>
    );
}
