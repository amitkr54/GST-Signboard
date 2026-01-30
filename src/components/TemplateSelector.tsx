import React, { useEffect, useState } from 'react';
import { TEMPLATES, Template } from '@/lib/templates';
import { TemplateId } from '@/lib/types';
import { Check, Sparkles } from 'lucide-react';
import { getTemplates } from '@/app/actions';

interface TemplateSelectorProps {
    selectedTemplateId: TemplateId | undefined;
    onSelect: (id: TemplateId, skipResize?: boolean) => void;
    currentProductId?: string;
    aspectRatio?: number; // width / height
    templates?: Template[];
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplateId, onSelect, currentProductId, aspectRatio, templates: externalTemplates }) => {
    const [internalTemplates, setInternalTemplates] = useState<Template[]>(TEMPLATES);
    const [isLoading, setIsLoading] = useState(!externalTemplates);

    useEffect(() => {
        if (externalTemplates) return; // Skip fetch if provided externally
        const fetchTemplates = async () => {
            setIsLoading(true);
            try {
                const data = await getTemplates();
                if (data && data.length > 0) {
                    setInternalTemplates(data);
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTemplates();
    }, [externalTemplates]);

    const templatesToUse = externalTemplates || internalTemplates;

    const getMatchQuality = (template: Template) => {
        // ALWAYS show the currently selected template
        if (selectedTemplateId && template.id === selectedTemplateId) {
            return 'EXACT';
        }

        // 1. Compatibility Check (Production Constraints)
        // A template is compatible if it's marked as Universal OR specifically mapped to this Product
        const isCompatible = template.isUniversal || (currentProductId && template.productIds && template.productIds.includes(currentProductId));

        if (!isCompatible) {
            return 'HIDDEN';
        }

        // 2. Aspect Ratio Match (Secondary quality filter)
        if (aspectRatio) {
            const tWidth = template.dimensions?.width || (template.layoutType === 'banner' ? 3 : 1);
            const tHeight = template.dimensions?.height || 1;
            const tRatio = tWidth / tHeight;

            const diff = Math.abs(tRatio - aspectRatio);
            const tolerance = aspectRatio * 0.15; // Strict 15% tolerance

            if (diff <= tolerance) {
                // If ID matches, it's EXACT. If only Universal but ratio fits, it's SMART_MATCH
                if (currentProductId && template.productIds?.includes(currentProductId)) return 'EXACT';
                return 'SMART_MATCH';
            }

            // If it's for this product but ratio differs, we might still show it or hide it.
            // Given the user wants it to match the "Choose" page, let's hide ratio mismatches too.
            return 'HIDDEN';
        }

        return template.isUniversal ? 'UNIVERSAL' : 'HIDDEN';
    };

    const categorizedTemplates = templatesToUse
        .map(t => ({ ...t, matchQuality: getMatchQuality(t) }))
        .filter(t => t.matchQuality !== 'HIDDEN')
        .sort((a, b) => {
            const order: Record<string, number> = { 'EXACT': 0, 'SMART_MATCH': 1, 'UNIVERSAL': 2, 'RATIO_MISMATCH': 3 };
            return (order[a.matchQuality] || 5) - (order[b.matchQuality] || 5);
        });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-3 p-1">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-square bg-slate-800/50 animate-pulse rounded-xl border border-white/5" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 p-1">
                {/* Custom Design Option */}
                <button
                    key="custom-blank"
                    onClick={() => onSelect('custom' as TemplateId)}
                    className={`relative group rounded-xl border-2 transition-all overflow-hidden text-left bg-slate-900/40 backdrop-blur-sm
                        ${selectedTemplateId === 'custom' || !selectedTemplateId
                            ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50'
                            : 'border-white/5 hover:border-indigo-500/30 hover:bg-slate-800/40'
                        }`}
                >
                    <div className="h-24 w-full relative flex items-center justify-center bg-slate-950/40">
                        <div className="w-16 h-12 border-2 border-dashed border-slate-700 group-hover:border-indigo-500/50 rounded flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-colors">
                            <span className="text-xl font-light">+</span>
                        </div>
                        {(selectedTemplateId === 'custom' || !selectedTemplateId) && (
                            <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                                <Check className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-slate-900/60">
                        <h4 className="text-[11px] font-black text-slate-100 uppercase tracking-tight">Blank Canvas</h4>
                        <p className="text-[9px] text-slate-400 font-bold mt-0.5">Start from scratch</p>
                    </div>
                </button>

                {categorizedTemplates.map((template) => (
                    <button
                        key={template.id}
                        onClick={() => onSelect(template.id as TemplateId)}
                        className={`relative group rounded-xl border-2 transition-all overflow-hidden text-left bg-slate-900/40 backdrop-blur-sm
                            ${selectedTemplateId === template.id
                                ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50'
                                : 'border-white/5 hover:border-indigo-500 hover:bg-slate-800/60'
                            }`}
                    >
                        {/* Preview Area */}
                        <div
                            className="w-full relative bg-slate-950/40 flex items-center justify-center p-2 transition-all duration-300"
                            style={{
                                aspectRatio: template.dimensions ? `${template.dimensions.width}/${template.dimensions.height}` : '1.5',
                                // Cap the height if it gets too extreme (e.g. strict vertical banners)
                                maxHeight: '400px'
                            }}
                        >
                            {template.thumbnail || template.svgPath ? (
                                <div className="relative w-full h-full p-4 bg-slate-700 rounded-lg shadow-sm">
                                    <img
                                        src={template.thumbnail || template.svgPath}
                                        alt={template.name}
                                        className="w-full h-full object-contain transition-transform"
                                    />
                                </div>
                            ) : (
                                <div className="text-[10px] font-black text-slate-700 tracking-tighter">PREVIEW</div>
                            )}

                            {/* Match Badges */}
                            {template.matchQuality === 'EXACT' && (
                                <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur-md text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-lg flex items-center gap-1">
                                    <Sparkles className="w-2 h-2" /> Perfect
                                </div>
                            )}
                            {template.matchQuality === 'SMART_MATCH' && (
                                <div className="absolute top-2 left-2 bg-indigo-500/90 backdrop-blur-md text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-lg">
                                    Smart Fit
                                </div>
                            )}

                            {selectedTemplateId === template.id && (
                                <div className="absolute top-2 right-2 bg-indigo-600 text-white p-1 rounded-full shadow-lg z-10">
                                    <Check className="w-3 h-3" />
                                </div>
                            )}
                        </div>

                        <div className="p-3 bg-slate-900/60 border-t border-white/5 flex items-center justify-between gap-2">
                            <h4 className="text-sm font-medium text-slate-200 truncate">{template.name}</h4>
                            <span className="text-xs text-slate-500 whitespace-nowrap">{template.category}</span>
                        </div>
                    </button>
                ))}
            </div>

            {categorizedTemplates.length === 0 && (
                <div className="text-center py-12 px-4 bg-slate-900/40 rounded-2xl border-2 border-dashed border-white/5">
                    <p className="text-xs font-bold text-slate-500">No matching templates found for this size.</p>
                </div>
            )}
        </div>
    );
};
