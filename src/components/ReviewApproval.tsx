'use client';

import React, { useRef } from 'react';
import { SignageData, DesignConfig } from '@/lib/types';
import { MaterialId } from '@/lib/utils';
import { fabric } from 'fabric';
import { FabricPreview } from './FabricPreview';
import { X } from 'lucide-react';

interface ReviewApprovalProps {
    data: SignageData;
    design: DesignConfig;
    material: MaterialId;
    isOpen: boolean;
    onClose: () => void;
    onApprove: () => void;
}

export function ReviewApproval({ data, design, material, isOpen, onClose, onApprove }: ReviewApprovalProps) {
    const [isApproved, setIsApproved] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);
    const canvasRef = useRef<fabric.Canvas | null>(null);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Reset approval state when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setIsApproved(false);
        }
    }, [isOpen]);

    if (!isMounted || !isOpen) return null;

    const checklistItems = [
        'Are the text and images clear and easy to read?',
        'Do the design elements fit in the safety area?',
        'Does the background fill out to the edges?',
        'Is everything spelled correctly?'
    ];

    const hasEmptyFields = !data.companyName || !data.address;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white/80 backdrop-blur border-b px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-2xl font-bold text-gray-900">Review your design</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Preview */}
                    <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                            <p className="text-sm text-gray-600 mb-3">
                                It will be printed like this preview. Make sure you are happy before continuing.
                            </p>
                            <div className="bg-white rounded-lg overflow-hidden shadow-inner" style={{ height: '400px' }}>
                                <FabricPreview
                                    data={data}
                                    design={design}
                                    material={material}
                                    onMount={(canvas) => {
                                        canvasRef.current = canvas;
                                        // Disable all interactions
                                        canvas.selection = false;
                                        canvas.forEachObject((obj) => {
                                            obj.selectable = false;
                                            obj.evented = false;
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: Checklist and Actions */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Verification Checklist</h3>
                            <ul className="space-y-2">
                                {checklistItems.map((item, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                        <span className="text-gray-400 mt-0.5">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {hasEmptyFields && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="font-semibold text-red-800 text-sm">Empty items won't be printed</p>
                                    <p className="text-xs text-red-600 mt-1">Some required fields are missing. Please go back and complete them.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isApproved}
                                    onChange={(e) => setIsApproved(e.target.checked)}
                                    className="mt-1 w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 leading-relaxed select-none">
                                    I have authorization to use this design, I have reviewed and approve it.
                                </span>
                            </label>
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={onApprove}
                                disabled={!isApproved}
                                className={`w-full py-3 rounded-xl font-semibold transition-all ${isApproved
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Continue
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Edit my design
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
