import React from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Upload, Loader2, FileText, Wrench } from 'lucide-react';
import { Product } from '@/lib/products';

interface TemplatesTabProps {
    templates: any[];
    products: Product[];
    categories: any[];
    templateType: 'universal' | 'specific';
    setTemplateType: (type: 'universal' | 'specific') => void;
    selectedProductIds: string[];
    setSelectedProductIds: React.Dispatch<React.SetStateAction<string[]>>;
    templateCategory: string;
    setTemplateCategory: (cat: string) => void;
    handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
    handleDelete: (id: string) => void;
    selectedTemplateIds: string[];
    toggleTemplateSelection: (id: string) => void;
    toggleAllTemplates: () => void;
    handleBulkDeleteTemplates: () => void;
    isLoading: boolean;
    pin: string;
    handleNormalizeAll: () => void;
}

const TemplatesTab = ({
    templates,
    products,
    categories,
    templateType,
    setTemplateType,
    selectedProductIds,
    setSelectedProductIds,
    templateCategory,
    setTemplateCategory,
    handleSubmit,
    handleDelete,
    selectedTemplateIds,
    toggleTemplateSelection,
    toggleAllTemplates,
    handleBulkDeleteTemplates,
    isLoading,
    pin,
    handleNormalizeAll
}: TemplatesTabProps) => {
    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Upload Form */}
            <div className="lg:col-span-1">
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white/10 sticky top-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                            <Plus className="w-6 h-6 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-black text-white">Add Template</h3>
                    </div>

                    {selectedTemplateIds.length > 0 && (
                        <div className="mb-6 pb-6 border-b border-white/10">
                            <Button
                                onClick={handleBulkDeleteTemplates}
                                variant="outline"
                                className="w-full border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete {selectedTemplateIds.length} Selected
                            </Button>
                        </div>
                    )}

                    {/* Normalization Tool */}
                    <div className="mb-6 pb-6 border-b border-white/10">
                        <Button
                            onClick={handleNormalizeAll}
                            variant="outline"
                            className="w-full border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-bold rounded-xl flex items-center justify-center gap-2"
                        >
                            <Wrench className="w-4 h-4" />
                            Re-Save All Templates
                        </Button>
                        <p className="text-[10px] text-slate-500 mt-2 text-center">
                            Updates all templates to standard pixel sizes based on aspect ratio.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1">Template Title</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="e.g. Premium Business Card"
                                className="w-full px-6 py-4 bg-black/20 border border-white/10 text-white placeholder:text-slate-600 rounded-2xl focus:border-indigo-500 outline-none transition-all shadow-inner font-bold"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1">Usage Type</label>
                            <div className="grid grid-cols-2 gap-3 p-1 bg-black/20 rounded-2xl border border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setTemplateType('universal')}
                                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${templateType === 'universal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Universal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTemplateType('specific')}
                                    className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${templateType === 'specific' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Specific
                                </button>
                                <input type="hidden" name="templateType" value={templateType} />
                            </div>
                        </div>

                        {templateType === 'specific' && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1">Select Products</label>
                                <div className="max-h-40 overflow-y-auto p-4 bg-black/20 rounded-2xl border border-white/10 space-y-2">
                                    {products.map(p => (
                                        <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/5">
                                            <input
                                                type="checkbox"
                                                checked={selectedProductIds.includes(p.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedProductIds(prev => [...prev, p.id]);
                                                    else setSelectedProductIds(prev => prev.filter(id => id !== p.id));
                                                }}
                                                className="w-4 h-4 rounded border-white/10 bg-black/20 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-xs font-bold text-slate-300">{p.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <input type="hidden" name="productIds" value={JSON.stringify(selectedProductIds)} />
                            </div>
                        )}

                        <div>
                            <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1">Category</label>
                            <select
                                name="category"
                                value={templateCategory}
                                onChange={(e) => setTemplateCategory(e.target.value)}
                                className="w-full px-6 py-4 bg-black/20 border border-white/10 text-white rounded-2xl focus:border-indigo-500 outline-none transition-all shadow-inner font-bold appearance-none"
                            >
                                {categories.filter(c => c.id !== 'all').map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dimensions Input */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1">Width (in)</label>
                                <input
                                    type="number"
                                    name="width"
                                    placeholder="18"
                                    step="0.1"
                                    className="w-full px-6 py-4 bg-black/20 border-2 border-white/10 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-white font-bold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1">Height (in)</label>
                                <input
                                    type="number"
                                    name="height"
                                    placeholder="12"
                                    step="0.1"
                                    className="w-full px-6 py-4 bg-black/20 border-2 border-white/10 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-white font-bold"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-1">Template File (SVG)</label>
                            <input
                                type="file"
                                name="file"
                                accept=".svg"
                                className="w-full text-sm text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-white/5 file:text-indigo-400 hover:file:bg-white/10 transition-all cursor-pointer bg-black/20 rounded-2xl border-2 border-dashed border-white/10 p-2"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 group relative overflow-hidden text-white"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            {isLoading ? (
                                <div className="flex items-center gap-2 justify-center">
                                    <Loader2 className="w-5 h-4 animate-spin text-white" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 justify-center">
                                    <Upload className="w-5 h-5 text-white" />
                                    <span>Upload Template</span>
                                </div>
                            )}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Template List */}
            <div className="lg:col-span-2">
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5 border-b border-white/10">
                                    <th className="px-8 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedTemplateIds.length === templates.length && templates.length > 0}
                                            onChange={toggleAllTemplates}
                                            className="w-4 h-4 rounded border-white/20 bg-black/20 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </th>
                                    <th className="px-8 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest w-1/3">Preview</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Details</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Ratio</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {templates.map((template) => (
                                    <tr key={template.id} className="group hover:bg-white/5 transition-all duration-300">
                                        <td className="px-8 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedTemplateIds.includes(template.id)}
                                                onChange={() => toggleTemplateSelection(template.id)}
                                                className="w-4 h-4 rounded border-white/20 bg-black/20 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="w-full aspect-[4/3] bg-white rounded-xl border-4 border-slate-800 overflow-hidden shadow-lg p-2">
                                                <img
                                                    src={template.thumbnail || template.svgPath}
                                                    alt={template.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 align-top pt-8">
                                            <div className="flex flex-col gap-2">
                                                <span className="font-black text-xl text-white">{template.name}</span>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full font-black uppercase tracking-wider border border-indigo-500/20">
                                                        {template.category}
                                                    </span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${template.isUniversal ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'}`}>
                                                        {template.isUniversal ? 'Universal' : 'Specific'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-500 mt-2">ID: {template.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 align-top pt-8">
                                            <span className="text-xs font-mono text-slate-400">
                                                {template.aspect_ratio ? Number(template.aspect_ratio).toFixed(2) : '-'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right align-middle">
                                            <div className="flex gap-2 justify-end">
                                                <a
                                                    href={`/design?template=${template.id}&mode=admin&pin=${pin}`}
                                                    target="_blank"
                                                    className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-indigo-500 transition-all border border-indigo-500/10"
                                                    title="Open in Master Editor"
                                                >
                                                    <Wrench size={20} />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(template.id)}
                                                    className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-all border border-red-500/10"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {templates.length === 0 && (
                    <div className="text-center py-24 bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-white/10">
                        <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Storage Empty</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TemplatesTab;
