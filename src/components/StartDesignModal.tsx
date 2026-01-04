'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ArrowRight, Layout, Ruler } from 'lucide-react';

interface StartDesignModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Unit = 'in' | 'cm' | 'mm' | 'px';

const PRESETS = [
    { name: 'Landscape Standard', width: 24, height: 16, unit: 'in' },
    { name: 'Portrait Standard', width: 16, height: 24, unit: 'in' },
    { name: 'Square', width: 20, height: 20, unit: 'in' },
    { name: 'Business Card', width: 3.5, height: 2, unit: 'in' },
    { name: 'A4 Paper', width: 210, height: 297, unit: 'mm' },
    { name: 'Instagram Post', width: 1080, height: 1080, unit: 'px' },
];

export function StartDesignModal({ isOpen, onClose }: StartDesignModalProps) {
    const router = useRouter();
    const [mode, setMode] = useState<'presets' | 'custom'>('presets');

    // Custom Size State
    const [width, setWidth] = useState<string>('24');
    const [height, setHeight] = useState<string>('16');
    const [unit, setUnit] = useState<Unit>('in');

    if (!isOpen) return null;

    const handleCreate = (w: number | string, h: number | string, u: Unit) => {
        const params = new URLSearchParams();
        params.set('width', w.toString());
        params.set('height', h.toString());
        params.set('unit', u);
        router.push(`/design?${params.toString()}`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh]">

                {/* Left Panel: Inspiration / Image */}
                <div className="w-full md:w-1/3 bg-slate-900 p-6 flex flex-col justify-between relative overflow-hidden text-white">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-50"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Start Creating</h3>
                        <p className="text-indigo-100 text-sm">Choose a canvas size to begin your design journey.</p>
                    </div>

                    <div className="relative z-10 mt-auto">
                        <div className="aspect-[4/3] bg-white/10 backdrop-blur rounded-lg border border-white/20 p-4 flex items-center justify-center">
                            <Layout className="w-12 h-12 text-white/80" />
                        </div>
                    </div>
                </div>

                {/* Right Panel: options */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setMode('presets')}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'presets' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Presets
                            </button>
                            <button
                                onClick={() => setMode('custom')}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'custom' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Custom Size
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {mode === 'presets' ? (
                        <div className="grid grid-cols-2 gap-3">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => handleCreate(preset.width, preset.height, preset.unit as Unit)}
                                    className="flex flex-col items-start p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 hover:shadow-sm transition-all text-left group"
                                >
                                    <span className="font-semibold text-gray-900 group-hover:text-indigo-700">{preset.name}</span>
                                    <span className="text-xs text-gray-500 mt-1 font-mono">
                                        {preset.width} x {preset.height} {preset.unit}
                                    </span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
                                    <input
                                        type="number"
                                        value={width}
                                        onChange={(e) => setWidth(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                                        placeholder="Width"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                                        placeholder="Height"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {(['in', 'cm', 'mm', 'px'] as const).map((u) => (
                                        <button
                                            key={u}
                                            onClick={() => setUnit(u)}
                                            className={`py-2.5 text-sm font-medium rounded-lg border transition-all ${unit === u
                                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {u}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => handleCreate(parseFloat(width) || 0, parseFloat(height) || 0, unit)}
                                disabled={!width || !height}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                            >
                                Create Design
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
