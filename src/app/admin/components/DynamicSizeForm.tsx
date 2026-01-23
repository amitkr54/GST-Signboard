import React from 'react';
import { Plus, Trash2, Hash } from 'lucide-react';
import { ProductSize } from '@/lib/products';
import { getSimplifiedRatio } from '@/lib/utils';

interface DynamicSizeFormProps {
    sizes: ProductSize[];
    onChange: (sizes: ProductSize[]) => void;
}

const DynamicSizeForm = ({ sizes, onChange }: DynamicSizeFormProps) => {
    const addSize = () => {
        onChange([...(sizes || []), {
            id: `size-${Date.now()}`,
            name: '',
            dimensions: { width: 0, height: 0, unit: 'in' },
            priceMultiplier: 1
        }]);
    };

    const removeSize = (id: string) => {
        onChange(sizes.filter(s => s.id !== id));
    };

    const updateSize = (id: string, updates: Partial<ProductSize>) => {
        onChange(sizes.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const updateDimensions = (id: string, dimUpdates: Partial<ProductSize['dimensions']>) => {
        onChange(sizes.map(s => s.id === id ? {
            ...s,
            dimensions: { ...s.dimensions, ...dimUpdates }
        } : s));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-black text-gray-700 uppercase tracking-wider">Available Sizes</label>
                <button
                    type="button"
                    onClick={addSize}
                    className="text-xs font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-all"
                >
                    <Plus className="w-3 h-3" /> Add Size
                </button>
            </div>

            <div className="grid gap-3">
                {(sizes || []).map((size) => (
                    <div key={size.id} className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100 group relative animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-12 sm:col-span-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Label Name</label>
                                <input
                                    type="text"
                                    value={size.name}
                                    onChange={(e) => updateSize(size.id, { name: e.target.value })}
                                    placeholder="e.g. Small (12x18)"
                                    className="w-full px-3 py-2 border-2 border-white rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900 font-bold"
                                    required
                                />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Width</label>
                                <input
                                    type="number"
                                    value={size.dimensions.width}
                                    onChange={(e) => updateDimensions(size.id, { width: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border-2 border-white rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900 font-bold"
                                    required
                                />
                            </div>
                            <div className="col-span-4 sm:col-span-2 relative">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Height</label>
                                <input
                                    type="number"
                                    value={size.dimensions.height}
                                    onChange={(e) => updateDimensions(size.id, { height: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border-2 border-white rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900 font-bold"
                                    required
                                />
                                {(() => {
                                    const ratio = getSimplifiedRatio(size.dimensions.width, size.dimensions.height);
                                    if (!ratio) return null;
                                    return (
                                        <div className="absolute -top-3 right-0 flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded-lg shadow-lg z-10 animate-in zoom-in duration-300">
                                            <Hash className="w-2.5 h-2.5" />
                                            <span>{ratio}</span>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Price X</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={size.priceMultiplier}
                                    onChange={(e) => updateSize(size.id, { priceMultiplier: parseFloat(e.target.value) || 1 })}
                                    className="w-full px-3 py-2 border-2 border-white rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900 font-bold"
                                    required
                                />
                            </div>
                            <div className="col-span-12 sm:col-span-2 sm:mb-1.5 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => removeSize(size.id)}
                                    className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-all"
                                    title="Remove Size"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {(!sizes || sizes.length === 0) && (
                <p className="text-center text-xs text-gray-400 italic py-4">No sizes defined. Please add at least one.</p>
            )}
        </div>
    );
};

export default DynamicSizeForm;
