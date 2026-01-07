import React from 'react';
import { fabric } from 'fabric';

interface CanvasInteractionDebuggerProps {
    selectedObject: fabric.Object | null;
    alignmentDebug?: { isDragging: boolean; vLines: number; hLines: number };
}

export function CanvasInteractionDebugger({ selectedObject, alignmentDebug }: CanvasInteractionDebuggerProps) {
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
            {alignmentDebug && (
                <div className="mt-2 pt-2 border-t border-gray-600 text-magenta-500">
                    <div>Drag: {String(alignmentDebug.isDragging)}</div>
                    <div>V-Lines: {alignmentDebug.vLines}</div>
                    <div>H-Lines: {alignmentDebug.hLines}</div>
                </div>
            )}
        </div>
    );
}
