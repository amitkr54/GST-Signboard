'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Lightbulb, PlayCircle, HelpCircle } from 'lucide-react';

interface Step {
    id: string;
    targetId: string;
    title: string;
    content: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: Step[] = [
    {
        id: 'welcome',
        targetId: 'tutorial-header',
        title: 'Welcome to Signage Studio! ✨',
        content: "Let's take a quick 1-minute tour to help you create your professional signage. Ready?",
        position: 'bottom'
    },
    {
        id: 'templates',
        targetId: 'tutorial-tab-templates',
        title: 'Start with a Template 📐',
        content: "Choose from our high-resolution templates to get a perfect layout in seconds. You can always customize everything later.",
        position: 'right'
    },
    {
        id: 'sidebar-tools',
        targetId: 'tutorial-sidebar-rail',
        title: 'Your Creative Toolbox 🎨',
        content: "Add professional text styles, icons, shapes, or upload your own logos here. Everything is drag-and-drop!",
        position: 'right'
    },
    {
        id: 'canvas',
        targetId: 'tutorial-actual-canvas',
        title: 'Design Your Masterpiece 🖌️',
        content: "This is your canvas. Click on any element to move, scale, or edit it. Right-click for more options!",
        position: 'right'
    },
    {
        id: 'config',
        targetId: 'tutorial-right-panel',
        title: 'Finalize & Print 📦',
        content: "When you're happy with your design, use this panel to choose your material and finalize your order for printing!",
        position: 'left'
    },
    {
        id: 'done',
        targetId: 'tutorial-help-button',
        title: 'Ready to Go? 🚀',
        content: "Need help again? You can restart this tour anytime from here. Happy designing!",
        position: 'left'
    }
];

interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const updatePosition = () => {
            const step = STEPS[currentStep];
            const target = document.getElementById(step.targetId);
            if (!target) return;

            const rect = target.getBoundingClientRect();
            const padding = 12;
            let top = 0;
            let left = 0;

            switch (step.position) {
                case 'bottom':
                    top = rect.bottom + padding;
                    left = rect.left + rect.width / 2;
                    break;
                case 'top':
                    top = rect.top - padding;
                    left = rect.left + rect.width / 2;
                    break;
                case 'right':
                    top = rect.top + rect.height / 2;
                    left = rect.right + padding;
                    break;
                case 'left':
                    top = rect.top + rect.height / 2;
                    left = rect.left - padding;
                    break;
            }

            setCoords({ top, left });
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [isOpen, currentStep]);

    if (!isOpen) return null;

    const step = STEPS[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === STEPS.length - 1;

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
            {/* Backdrop Blur Overlay */}
            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] pointer-events-auto" onClick={onClose} />

            {/* Highlighting Target (Optional - adds a subtle glow to the target) */}
            <div
                className="absolute border-2 border-indigo-500 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300 pointer-events-none"
                style={{
                    top: document.getElementById(step.targetId)?.getBoundingClientRect().top ?? 0,
                    left: document.getElementById(step.targetId)?.getBoundingClientRect().left ?? 0,
                    width: document.getElementById(step.targetId)?.getBoundingClientRect().width ?? 0,
                    height: document.getElementById(step.targetId)?.getBoundingClientRect().height ?? 0,
                }}
            />

            {/* Tooltip Card */}
            <div
                ref={tooltipRef}
                className={`absolute w-72 bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-6 pointer-events-auto transition-all duration-300 ${step.position === 'bottom' ? '-translate-x-1/2' :
                    step.position === 'top' ? '-translate-x-1/2 -translate-y-full' :
                        step.position === 'right' ? '-translate-y-1/2' :
                            '-translate-x-full -translate-y-1/2'
                    }`}
                style={{ top: coords.top, left: coords.left }}
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            {isLast ? <PlayCircle className="w-5 h-5 text-indigo-400" /> : <Lightbulb className="w-5 h-5 text-indigo-400" />}
                        </div>
                        <h3 className="font-bold text-white leading-tight">{step.title}</h3>
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        {step.content}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/5">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {currentStep + 1} / {STEPS.length}
                        </div>
                        <div className="flex gap-2">
                            {!isFirst && (
                                <button
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all active:scale-95"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (isLast) onClose();
                                    else setCurrentStep(prev => prev + 1);
                                }}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg active:scale-95"
                            >
                                {isLast ? 'Got it!' : 'Next'}
                                {!isLast && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Arrow Pointer */}
                <div className={`absolute w-3 h-3 bg-slate-900 border-l border-t border-white/20 rotate-45 ${step.position === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2' :
                    step.position === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2' :
                        step.position === 'right' ? '-left-1.5 top-1/2 -translate-y-1/2' :
                            '-right-1.5 top-1/2 -translate-y-1/2'
                    }`} />
            </div>
        </div>
    );
}
