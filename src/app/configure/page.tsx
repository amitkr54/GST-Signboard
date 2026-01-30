'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getTemplates, getMaterials } from '@/app/actions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronRight, ArrowLeft, Layout, Ruler, Layers, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { ALL_STANDARD_SIZES } from '@/lib/size-presets';

function ConfigureContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Entry Params
    const templateId = searchParams.get('template');
    const initWidth = Number(searchParams.get('width')) || 0;
    const initHeight = Number(searchParams.get('height')) || 0;
    const initUnit = (searchParams.get('unit') as any) || 'in';

    // State
    const [template, setTemplate] = React.useState<any>(null);
    const [materials, setMaterials] = React.useState<any[]>([]);
    const [selectedMaterial, setSelectedMaterial] = React.useState<any>(null);
    const [selectedSize, setSelectedSize] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    const STANDARD_SIZES = ALL_STANDARD_SIZES;

    React.useEffect(() => {
        if (!isLoading) {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }
    }, [isLoading]);

    React.useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            const { getMaterials, getTemplates } = await import('@/app/actions');

            const [materialRes, fetchedTemplates] = await Promise.all([
                getMaterials(),
                templateId ? getTemplates() : Promise.resolve([])
            ]);

            if (materialRes.success) {
                setMaterials(materialRes.materials || []);
            }

            if (templateId) {
                const found = fetchedTemplates.find((t: any) => t.id === templateId);
                if (found) setTemplate(found);
            }
            setIsLoading(false);
        };
        loadInitialData();
    }, [templateId]);

    const handleSelectMaterial = (material: any) => {
        setSelectedMaterial(material);

        // If a size is already selected (e.g. user manually clicked one), preserve it
        if (selectedSize) {
            return;
        }

        // 1. Auto-select custom size if dimensions were provided (homepage modal)
        if (initWidth > 0 && initHeight > 0) {
            setSelectedSize({
                id: 'custom',
                name: 'Custom Size',
                dimensions: {
                    width: initWidth,
                    height: initHeight,
                    unit: initUnit as any
                },
                ratio: 'custom'
            });
            return;
        }

        // 2. Auto-select "Best Match" if template is provided
        if (template) {
            const templateWidth = template.dimensions?.width || 1;
            const templateHeight = template.dimensions?.height || 1;

            let bestMatch = STANDARD_SIZES[0];
            let minDiff = 999;

            STANDARD_SIZES.forEach((size: any) => {
                const diff = getRatioDiff(templateWidth, templateHeight, size.dimensions.width, size.dimensions.height);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestMatch = size;
                }
            });

            if (minDiff < 0.2) {
                setSelectedSize(bestMatch);
                return;
            }
        }

        setSelectedSize(null);
    };

    const handleProceed = () => {
        if (!selectedMaterial || !selectedSize) return;

        const params = new URLSearchParams();
        if (selectedMaterial.slug) params.set('material', selectedMaterial.slug);
        else params.set('material', selectedMaterial.id);
        params.set('width', selectedSize.dimensions.width.toString());
        params.set('height', selectedSize.dimensions.height.toString());
        params.set('unit', selectedSize.dimensions.unit);
        if (templateId) params.set('template', templateId);

        router.push(`/design?${params.toString()}`);
    };

    const availableSizes = React.useMemo(() => {
        let sizes = [...STANDARD_SIZES];

        if (initWidth > 0 && initHeight > 0) {
            const matchesStandard = STANDARD_SIZES.find(s =>
                s.dimensions.width === initWidth &&
                s.dimensions.height === initHeight &&
                s.dimensions.unit === initUnit
            );

            if (!matchesStandard) {
                sizes.push({
                    id: 'custom',
                    name: 'Custom Size',
                    dimensions: {
                        width: initWidth,
                        height: initHeight,
                        unit: initUnit as any
                    },
                    ratio: 'custom'
                });
            }
        }

        // If a template is selected, only show sizes that match its aspect ratio
        if (template) {
            const tWidth = template.dimensions?.width || (template.layoutType === 'banner' ? 3 : 2);
            const tHeight = template.dimensions?.height || (template.layoutType === 'banner' ? 1 : 2);
            const tRatio = tWidth / tHeight;

            sizes = sizes.filter(size => {
                const sRatio = size.dimensions.width / size.dimensions.height;
                const diff = Math.abs(sRatio - tRatio);
                return diff <= tRatio * 0.2; // 20% tolerance for sizes
            });
        }

        return sizes;
    }, [initWidth, initHeight, initUnit, template]);

    // Update auto-selection to prefer standard sizes
    React.useEffect(() => {
        if (materials.length > 0 && !selectedMaterial) {
            setSelectedMaterial(materials[0]);

            // Initial size selection
            if (initWidth > 0 && initHeight > 0) {
                const matchesStandard = STANDARD_SIZES.find(s =>
                    s.dimensions.width === initWidth &&
                    s.dimensions.height === initHeight &&
                    s.dimensions.unit === initUnit
                );

                if (matchesStandard) {
                    setSelectedSize(matchesStandard);
                } else {
                    setSelectedSize({
                        id: 'custom',
                        name: 'Custom Size',
                        dimensions: { width: initWidth, height: initHeight, unit: initUnit as any },
                        ratio: 'custom'
                    });
                }
            }
        }
    }, [materials, initWidth, initHeight, initUnit]);

    const getRatioDiff = (w1: number, h1: number, w2: number, h2: number) => {
        if (!w1 || !h1 || !w2 || !h2) return 999;
        const r1 = w1 / h1;
        const r2 = w2 / h2;
        return Math.abs(r1 - r2);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/templates" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-indigo-300" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Configure Your Signage</h1>
                        <p className="text-indigo-300">Choose the material and size for your design</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Step 1: Material Selection */}
                    <div className="lg:col-span-2 space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">1</div>
                                <h2 className="text-xl font-bold">Select Material</h2>
                            </div>
                            <div className="grid sm:grid-cols-3 gap-3">
                                {materials.map((material: any) => (
                                    <button
                                        key={material.id}
                                        onClick={() => handleSelectMaterial(material)}
                                        className={`p-3 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${selectedMaterial?.id === material.id
                                            ? 'border-indigo-500 bg-indigo-500/10 shadow-lg'
                                            : 'border-white/10 bg-white/5 hover:border-white/30'
                                            }`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                                            <Layers className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm truncate">{material.name}</h3>
                                            <p className="text-[10px] text-indigo-300 truncate opacity-70">Premium choice</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Step 2: Size Selection */}
                        {selectedMaterial && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">2</div>
                                    <h2 className="text-xl font-bold">Select Size</h2>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {availableSizes.map((size: any) => {
                                        const templateWidth = template?.dimensions?.width || initWidth;
                                        const templateHeight = template?.dimensions?.height || initHeight;

                                        const isMatch = templateWidth > 0 && getRatioDiff(templateWidth, templateHeight, size.dimensions.width, size.dimensions.height) < 0.1;

                                        return (
                                            <button
                                                key={size.id}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-2 py-1.5 rounded-lg border-2 transition-all relative text-center flex flex-col items-center justify-center ${selectedSize?.id === size.id
                                                    ? 'border-indigo-500 bg-indigo-500/10'
                                                    : 'border-white/10 bg-white/5 hover:border-white/30'
                                                    }`}
                                            >
                                                {isMatch && (
                                                    <div className="absolute -top-1.5 -right-1.5 bg-green-500 text-[7px] font-black px-1 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-10">
                                                        <Sparkles className="w-2 h-2" />
                                                    </div>
                                                )}
                                                <div className="font-bold text-white text-sm whitespace-nowrap">{size.name}</div>
                                                {size.id !== 'custom' && size.name !== `${size.dimensions.width}${size.dimensions.unit} × ${size.dimensions.height}${size.dimensions.unit}` && (
                                                    <div className="text-[8px] text-indigo-300 font-mono mt-0 opacity-70 leading-none">
                                                        {size.dimensions.width}{size.dimensions.unit} × {size.dimensions.height}{size.dimensions.unit}
                                                    </div>
                                                )}
                                                {size.id === 'custom' && (
                                                    <div className="text-[8px] text-indigo-300 font-mono mt-0 leading-none">
                                                        {size.dimensions.width}{size.dimensions.unit} × {size.dimensions.height}{size.dimensions.unit}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Summary & Preview */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6 px-1">Order Summary</h3>

                                <div className="space-y-4 mb-8">
                                    {template && (
                                        <div className="flex gap-4 p-3 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="w-16 h-12 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                                                <img src={template.thumbnail || template.svgPath} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase">Template</p>
                                                <p className="text-sm font-bold truncate w-32">{template.name}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 px-1">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                            <Layers className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase">Material</p>
                                            <p className="font-bold">{selectedMaterial?.name || '---'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 px-1">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                            <Ruler className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase">Dimensions</p>
                                            <p className="font-bold">
                                                {selectedSize ? (
                                                    selectedSize.id === 'custom'
                                                        ? `${selectedSize.dimensions.width}${selectedSize.dimensions.unit} × ${selectedSize.dimensions.height}${selectedSize.dimensions.unit}`
                                                        : selectedSize.name
                                                ) : '---'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleProceed}
                                    disabled={!selectedMaterial || !selectedSize}
                                    className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-600/20 disabled:opacity-30 disabled:shadow-none transition-all group"
                                >
                                    Start Designing
                                    <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>

                            <p className="text-center text-xs text-slate-500 px-4">
                                Choose a material and size to proceed to the design editor.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ConfigurePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading configuration...</div>}>
            <ConfigureContent />
        </Suspense>
    );
}
