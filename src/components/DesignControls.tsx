import React from 'react';
import { DesignConfig } from '@/lib/types';

interface DesignControlsProps {
    design: DesignConfig;
    onChange: (design: DesignConfig) => void;
}

export function DesignControls({ design, onChange }: DesignControlsProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange({ ...design, [name]: value });
    };

    const handleDownload = async (type: 'svg' | 'pdf') => {
        // @ts-ignore
        const canvas = window.fabricCanvas;
        if (!canvas) {
            alert('Preview not ready yet');
            return;
        }

        // --- SAFETY CHECKS ---
        const objects = canvas.getObjects();
        const issues: string[] = [];
        const safePadding = 40; // px
        const width = canvas.width || 1800;
        const height = canvas.height || 1200;

        // Debug specific checks
        console.log('Safety Check:', { width, height, objects: objects.length });

        // 1. Check for Placeholder Text
        const placeholders = ['Company Name', 'Your Text Here', 'Heading', 'Double click to edit'];
        let foundPlaceholder = false;
        objects.forEach((obj: any) => {
            if (obj.text && placeholders.some(p => obj.text.includes(p))) {
                foundPlaceholder = true;
            }
        });
        if (foundPlaceholder) {
            issues.push("• You have unchanged placeholder text (e.g. 'Company Name').");
        }

        // 2. Check for Safe Margins
        let nearEdge = false;
        objects.forEach((obj: any) => {
            if (!obj.visible || obj.type === 'rect' || obj.name === 'background') return;
            // Skip background rectangles

            const br = obj.getBoundingRect(true); // Absolute coords
            if (br.left < safePadding || br.top < safePadding ||
                (br.left + br.width) > (width - safePadding) ||
                (br.top + br.height) > (height - safePadding)) {
                nearEdge = true;
                console.log('Object near edge:', obj.type, br);
            }
        });
        if (nearEdge) {
            issues.push("• Some items are very close to the edge and might get cut off.");
        }

        // 3. Confirm Dialog
        let message = "Ready to download?\n\nBEFORE YOU PRINT:\n[ ] Checked for spelling mistakes?\n[ ] Confirmed colors are correct?\n[ ] Design is readable from a distance?";

        if (issues.length > 0) {
            message = "⚠️ WAIT! We found potential issues:\n\n" + issues.join("\n") + "\n\n" + message;
        }

        if (!confirm(message)) return;

        // --- PROCEED WITH DOWNLOAD ---
        try {
            const svgContent = canvas.toSVG({
                suppressPreamble: false,
                width: 1800,
                height: 1200,
                viewBox: { x: 0, y: 0, width: 1800, height: 1200 }
            });

            if (type === 'svg') {
                const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `signage-${Date.now()}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } else {
                // Dynamic import to reduce bundle size
                const { jsPDF } = await import('jspdf');
                const svg2pdfModule = await import('svg2pdf.js');

                // Create a temporary SVG element
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = svgContent;
                const svgElement = tempDiv.querySelector('svg');

                if (!svgElement) {
                    alert('Failed to generate SVG for PDF');
                    return;
                }

                // Create PDF (18" x 12" at 100 DPI = 1800 x 1200 pixels)
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'in',
                    format: [12, 18]
                });

                await svg2pdfModule.svg2pdf(svgElement, pdf, {
                    x: 0, y: 0, width: 18, height: 12
                });

                pdf.save(`signage-${Date.now()}.pdf`);
            }

        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to generate file. Please try again.');
        }
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-4">Design Customization</h2>

            <div className="grid grid-cols-2 gap-4">
                {/* Custom Size Controls */}
                <div className="col-span-2 grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border mb-2">
                    <div className="col-span-3 text-sm font-semibold text-gray-700">Canvas Size</div>

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Width</label>
                        <input
                            type="number"
                            name="width"
                            value={design.width}
                            onChange={handleChange}
                            className="block w-full h-9 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Height</label>
                        <input
                            type="number"
                            name="height"
                            value={design.height}
                            onChange={handleChange}
                            className="block w-full h-9 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Unit</label>
                        <select
                            name="unit"
                            value={design.unit}
                            onChange={handleChange}
                            className="block w-full h-9 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-2 text-sm"
                        >
                            <option value="px">px</option>
                            <option value="in">in</option>
                            <option value="cm">cm</option>
                            <option value="mm">mm</option>
                        </select>
                    </div>
                </div>

                <div className="col-span-2 p-4 bg-gray-50 rounded-lg border mt-2">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-semibold text-gray-700">Background Style</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Solid</span>
                            <button
                                onClick={() => onChange({ ...design, backgroundGradientEnabled: !design.backgroundGradientEnabled })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${design.backgroundGradientEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${design.backgroundGradientEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-xs text-gray-500">Gradient</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                {design.backgroundGradientEnabled ? 'Start Color' : 'Background Color'}
                            </label>
                            <input
                                type="color"
                                name="backgroundColor"
                                value={design.backgroundColor}
                                onChange={handleChange}
                                className="block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border cursor-pointer"
                            />
                        </div>

                        {design.backgroundGradientEnabled && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">End Color</label>
                                    <input
                                        type="color"
                                        name="backgroundColor2"
                                        value={design.backgroundColor2}
                                        onChange={handleChange}
                                        className="block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border cursor-pointer"
                                    />
                                </div>
                                <div className="col-span-2 mt-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-xs font-medium text-gray-500">Gradient Angle</label>
                                        <span className="text-xs font-bold text-blue-600">{design.backgroundGradientAngle}°</span>
                                    </div>
                                    <input
                                        type="range"
                                        name="backgroundGradientAngle"
                                        min="0"
                                        max="360"
                                        value={design.backgroundGradientAngle}
                                        onChange={handleChange}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Text Color</label>
                    <input
                        type="color"
                        name="textColor"
                        value={design.textColor}
                        onChange={handleChange}
                        className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border cursor-pointer"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Border Color</label>
                    <input
                        type="color"
                        name="borderColor"
                        value={design.borderColor}
                        onChange={handleChange}
                        className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Font Family</label>
                    <select
                        name="fontFamily"
                        value={design.fontFamily}
                        onChange={handleChange}
                        className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border px-2"
                    >
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="cursive">Cursive</option>
                    </select>
                </div>
            </div>

            {/* Company Name Size Slider */}
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name Size: {design.companyNameSize}px
                </label>
                <input
                    type="range"
                    name="companyNameSize"
                    min="50"
                    max="300"
                    step="5"
                    value={design.companyNameSize}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>50px</span>
                    <span>300px</span>
                </div>
            </div>

            {/* Logo Size Slider */}
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo Size: {design.logoSize}px
                </label>
                <input
                    type="range"
                    name="logoSize"
                    min="100"
                    max="600"
                    step="10"
                    value={design.logoSize}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>100px</span>
                    <span>600px</span>
                </div>
            </div>

            {/* Download Buttons */}
            <div className="mt-8 pt-4 border-t space-y-3">
                <button
                    onClick={() => handleDownload('svg')}
                    className="w-full bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                    Download SVG
                </button>

                <button
                    onClick={() => handleDownload('pdf')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                    Download PDF
                </button>

                <p className="text-xs text-gray-500 mt-2 text-center">
                    Download as SVG for professional editing or PDF for direct printing.
                </p>
            </div>
        </div>
    );
}
