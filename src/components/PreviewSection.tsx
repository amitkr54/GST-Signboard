import React from 'react';
import { SignagePreview } from '@/components/SignagePreview';
import { SignageData, DesignConfig } from '@/lib/types';
import { MaterialId } from '@/lib/utils';

interface PreviewSectionProps {
    uploadedDesign: string | null;
    data: SignageData;
    design: DesignConfig;
    material: MaterialId;
    compact?: boolean;
    onDesignChange?: (design: DesignConfig) => void;
    // Sidebar callbacks
    onAddText?: (addFn: (type: 'heading' | 'subheading' | 'body') => void) => void;
    onAddIcon?: (addFn: (iconName: string) => void) => void;
    onAddShape?: (addFn: (type: 'rect' | 'circle' | 'line' | 'triangle') => void) => void;
    onAddImage?: (addFn: (imageUrl: string) => void) => void;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
    uploadedDesign,
    data,
    design,
    material,
    compact = false,
    onDesignChange,
    onAddText,
    onAddIcon,
    onAddShape,
    onAddImage
}) => {
    return (
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${compact ? 'h-full flex flex-col' : 'p-4 mb-6'}`}>
            <div className={`flex ${compact ? 'flex-col gap-3 p-3 border-b' : 'flex-row items-center justify-between mb-4'}`}>
                <h2 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-800`}>Live Preview (18" x 12")</h2>
                <div className={`flex items-center ${compact ? 'flex-wrap' : ''} gap-2`}>
                    <label htmlFor="canvasBgColor" className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>
                        Background:
                    </label>
                    <input
                        id="canvasBgColor"
                        type="color"
                        value={design.backgroundColor}
                        onChange={(e) => {
                            if (onDesignChange) {
                                onDesignChange({ ...design, backgroundColor: e.target.value });
                            }
                        }}
                        className={`${compact ? 'w-9 h-7' : 'w-12 h-8'} rounded border border-gray-300 cursor-pointer`}
                        title="Change canvas background color"
                    />
                    <div className={`h-${compact ? '7' : '8'} w-px bg-gray-200 mx-2`}></div>

                    <button
                        onClick={async () => {
                            // @ts-ignore
                            const canvas = window.fabricCanvas;
                            if (canvas) {
                                const svg = canvas.toSVG({
                                    suppressPreamble: false,
                                    width: 1800,
                                    height: 1200,
                                    viewBox: {
                                        x: 0,
                                        y: 0,
                                        width: 1800,
                                        height: 1200
                                    }
                                });

                                const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `signage-${Date.now()}.svg`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                URL.revokeObjectURL(url);
                            }
                        }}
                        className={`flex items-center gap-1 ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
                        title="Download SVG"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width={compact ? "14" : "16"} height={compact ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                        SVG
                    </button>

                    <button
                        onClick={async () => {
                            // @ts-ignore
                            const canvas = window.fabricCanvas;
                            if (!canvas) return;

                            try {
                                const { jsPDF } = await import('jspdf');
                                const svg2pdfModule = await import('svg2pdf.js');

                                const svg = canvas.toSVG({
                                    suppressPreamble: false,
                                    width: 1800,
                                    height: 1200,
                                    viewBox: {
                                        x: 0,
                                        y: 0,
                                        width: 1800,
                                        height: 1200
                                    }
                                });

                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = svg;
                                const svgElement = tempDiv.querySelector('svg');

                                if (!svgElement) return;

                                const pdf = new jsPDF({
                                    orientation: 'landscape',
                                    unit: 'in',
                                    format: [12, 18]
                                });

                                await svg2pdfModule.svg2pdf(svgElement, pdf, {
                                    x: 0,
                                    y: 0,
                                    width: 18,
                                    height: 12
                                });

                                pdf.save(`signage-${Date.now()}.pdf`);
                            } catch (error) {
                                console.error('PDF generation error:', error);
                                alert('Failed to generate PDF');
                            }
                        }}
                        className={`flex items-center gap-1 ${compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors`}
                        title="Download PDF"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width={compact ? "14" : "16"} height={compact ? "14" : "16"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                        PDF
                    </button>
                </div>
            </div>

            <div className="w-full relative flex-1 overflow-hidden" style={{ minHeight: compact ? '300px' : '400px', maxHeight: compact ? 'none' : '95vh', height: compact ? '100%' : '90vh' }}>
                {uploadedDesign ? (
                    <div className="w-full h-full flex justify-center p-4 bg-gray-100 rounded-xl">
                        <img
                            src={uploadedDesign}
                            alt="Uploaded design preview"
                            className="max-w-full max-h-full object-contain border-4 border-gray-300 shadow-2xl"
                        />
                    </div>
                ) : (
                    <SignagePreview
                        data={data}
                        design={design}
                        material={material}
                        onDesignChange={onDesignChange}
                        onAddText={onAddText}
                        onAddIcon={onAddIcon}
                        onAddShape={onAddShape}
                        onAddImage={onAddImage}
                        compact={compact}
                    />
                )}
            </div>
        </div>
    );
};

