'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, GripVertical } from 'lucide-react';

interface MobileTextInputOverlayProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
    isOpen: boolean;
    position?: { top: number; left: number };
}

export function MobileTextInputOverlay({
    value,
    onChange,
    onClose,
    isOpen,
    position
}: MobileTextInputOverlayProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [viewportScale, setViewportScale] = React.useState(1);
    const [viewportOffset, setViewportOffset] = React.useState(0);
    const [viewportWidth, setViewportWidth] = React.useState(0);
    const [viewportLeft, setViewportLeft] = React.useState(0);
    const [isLandscape, setIsLandscape] = React.useState(false);

    // Draggable state
    const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (!isOpen) return;

        const updateViewport = () => {
            if (window.visualViewport) {
                setViewportScale(window.visualViewport.scale);
                setViewportOffset(window.visualViewport.offsetTop);
                setViewportWidth(window.visualViewport.width);
                setViewportLeft(window.visualViewport.offsetLeft);
            }
            setIsLandscape(window.innerWidth > window.innerHeight);
        };

        window.visualViewport?.addEventListener('resize', updateViewport);
        window.visualViewport?.addEventListener('scroll', updateViewport);
        window.addEventListener('resize', updateViewport);
        updateViewport();

        return () => {
            window.visualViewport?.removeEventListener('resize', updateViewport);
            window.visualViewport?.removeEventListener('scroll', updateViewport);
            window.removeEventListener('resize', updateViewport);
        };
    }, [isOpen]);

    const baseTop = isLandscape
        ? viewportOffset + 8
        : (position ? Math.max(80, Math.min(position.top - 60, window.innerHeight - 150)) : 150);

    const baseLeft = viewportLeft + (viewportWidth / 2);

    const finalTop = baseTop + dragOffset.y;
    const finalLeft = baseLeft + dragOffset.x;

    const handlePointerDown = (e: React.PointerEvent) => {
        // Only trigger if clicking the handle or the background of the bar (not input/button)
        if ((e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('button')) return;

        setIsDragging(true);
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;

        const deltaX = (e.clientX - dragStartPos.current.x) * viewportScale;
        const deltaY = (e.clientY - dragStartPos.current.y) * viewportScale;

        setDragOffset(prev => ({
            x: prev.x + deltaX,
            y: prev.y + deltaY
        }));

        dragStartPos.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    useEffect(() => {
        if (isOpen && inputRef.current) {
            const timer = setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.setSelectionRange(0, inputRef.current.value.length);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen || typeof document === 'undefined') return null;

    const inverseScale = 1 / viewportScale;

    return createPortal(
        <div
            className={`fixed z-[99999] px-2 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto transition-shadow ${isDragging ? 'shadow-2xl scale-[1.02]' : ''}`}
            style={{
                top: `${finalTop}px`,
                left: `${finalLeft}px`,
                transform: `translateX(-50%) scale(${inverseScale})`,
                transformOrigin: 'top center',
                width: isLandscape ? '350px' : '448px',
                maxWidth: '95vw',
                touchAction: 'none' // Prevent scrolling while dragging
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <div className={`w-full bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden flex items-center p-0.5 cursor-move active:cursor-grabbing`}>
                <div className="px-1 text-slate-500 shrink-0">
                    <GripVertical className="w-4 h-4" />
                </div>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onClose();
                        if (e.key === 'Escape') onClose();
                    }}
                    className={`flex-1 bg-transparent border-none outline-none ${isLandscape ? 'px-2 py-0.5 text-sm' : 'px-3 py-1.5 text-base'} text-white font-bold placeholder:text-slate-500 min-w-0 pointer-events-auto`}
                    style={{ fontSize: '16px' }}
                    placeholder="Enter text..."
                />
                <button
                    onClick={onClose}
                    className={`${isLandscape ? 'w-6 h-6' : 'w-8 h-8'} flex items-center justify-center bg-indigo-600 rounded-lg text-white shadow-lg active:scale-90 transition-all ml-1 shrink-0 pointer-events-auto`}
                >
                    <Check className={isLandscape ? "w-3 h-3" : "w-4 h-4"} />
                </button>
            </div>

            <div
                className="fixed inset-0 -z-10 bg-black/5 backdrop-blur-[0.5px] pointer-events-auto"
                style={{
                    width: '300vw',
                    height: '300vh',
                    left: '-100vw',
                    top: '-100vh'
                }}
                onClick={onClose}
            />
        </div>,
        document.body
    );
}
