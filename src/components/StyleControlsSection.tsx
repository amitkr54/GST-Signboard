'use client';

import React, { useState } from 'react';
import { ChevronDown, Palette } from 'lucide-react';

interface FieldConstraints {
    fonts?: string[];
    sizes?: number[];
    colors?: string[];
}

interface StyleControlsSectionProps {
    label: string;
    field: string;
    currentFont?: string;
    currentSize?: number;
    currentColor?: string;
    constraints?: FieldConstraints;
    showSize?: boolean;
    defaultOpen?: boolean;
    onChange: (styles: { font?: string; size?: number; color?: string }) => void;
}

const DEFAULT_FONTS = ['Inter', 'Roboto', 'Playfair Display', 'Montserrat', 'Open Sans'];
const DEFAULT_SIZES = [24, 32, 42, 48, 60, 72];
const DEFAULT_COLORS = ['#000000', '#FFFFFF', '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1'];

export function StyleControlsSection({
    label,
    field,
    currentFont,
    currentSize,
    currentColor,
    constraints,
    showSize = true,
    defaultOpen = false,
    onChange
}: StyleControlsSectionProps) {
    const [isExpanded, setIsExpanded] = useState(defaultOpen);

    const availableFonts = constraints?.fonts || DEFAULT_FONTS;
    const availableSizes = constraints?.sizes || DEFAULT_SIZES;
    const availableColors = constraints?.colors || DEFAULT_COLORS;

    return (
        <details
            open={isExpanded}
            onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)}
            className="mt-1 border border-slate-200 rounded-none overflow-hidden bg-slate-50"
        >
            <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-between select-none">
                <span className="flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" />
                    {label}
                </span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
            </summary>

            <div className="p-3 space-y-3 bg-white border-t border-slate-200">
                {/* Font Selector */}
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                        Font
                    </label>
                    <select
                        value={currentFont || availableFonts[0]}
                        onChange={(e) => onChange({ font: e.target.value, size: currentSize, color: currentColor })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-none focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold"
                        style={{ fontFamily: currentFont || availableFonts[0] }}
                    >
                        {availableFonts.map((font) => (
                            <option key={font} value={font} style={{ fontFamily: font }}>
                                {font}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Size Selector */}
                {showSize && (
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                            Size
                        </label>
                        <select
                            value={currentSize || availableSizes[2]}
                            onChange={(e) => onChange({ font: currentFont, size: parseInt(e.target.value), color: currentColor })}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-none focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-bold"
                        >
                            {availableSizes.map((size) => (
                                <option key={size} value={size}>
                                    {size}px
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Color Picker */}
                <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                        Color
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                        {availableColors.map((color) => (
                            <button
                                key={color}
                                onClick={() => onChange({ font: currentFont, size: currentSize, color })}
                                className={`aspect-square rounded-none border-2 transition-all ${currentColor === color
                                    ? 'border-indigo-500 scale-110 shadow-lg'
                                    : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                    <div className="mt-2 flex gap-2 items-center">
                        <input
                            type="color"
                            value={currentColor || '#000000'}
                            onChange={(e) => onChange({ font: currentFont, size: currentSize, color: e.target.value })}
                            className="w-10 h-10 rounded-none cursor-pointer border border-slate-300"
                        />
                        <span className="text-xs text-slate-500 font-mono uppercase">
                            {currentColor || 'Custom'}
                        </span>
                    </div>
                </div>
            </div>
        </details>
    );
}
