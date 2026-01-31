import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Save, Loader2, Layout, Maximize2, Minimize2, X, Edit } from 'lucide-react';

interface CanvasPresetsTabProps {
    canvasPresets: any[];
    addPreset: (preset?: any) => void;
    removePreset: (index: number) => void;
    updatePreset: (index: number, field: string, value: any) => void;
    customLimits: {
        minWidth: number;
        maxWidth: number;
        minHeight: number;
        maxHeight: number;
    };
    setCustomLimits: (limits: any) => void;
    handleSaveCanvasSettings: () => void;
    isLoading: boolean;
}

const CanvasPresetsTab = ({
    canvasPresets,
    addPreset,
    removePreset,
    updatePreset,
    customLimits,
    setCustomLimits,
    handleSaveCanvasSettings,
    isLoading
}: CanvasPresetsTabProps) => {
    const [showForm, setShowForm] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        width: 10,
        height: 10,
        unit: 'in'
    });

    const handleOpenForm = (index: number | null = null) => {
        if (index !== null) {
            setEditingIndex(index);
            setFormData(canvasPresets[index]);
        } else {
            setEditingIndex(null);
            setFormData({ name: '', width: 10, height: 10, unit: 'in' });
        }
        setShowForm(true);
    };

    const handleSavePreset = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingIndex !== null) {
            Object.entries(formData).forEach(([field, value]) => {
                updatePreset(editingIndex, field, value);
            });
        } else {
            addPreset(formData);
        }
        setShowForm(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">Canvas Presets ({canvasPresets.length})</h2>
                </div>
                <Button
                    onClick={() => handleOpenForm()}
                    className="bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Preset
                </Button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 max-w-lg w-full shadow-2xl border border-white/10 relative">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-bold text-white">
                                {editingIndex !== null ? 'Edit Preset' : 'Add New Preset'}
                            </h3>
                            <button onClick={() => setShowForm(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <form onSubmit={handleSavePreset} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Preset Name</label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                    placeholder="e.g. Standard Poster, Small Label"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Width</label>
                                    <input
                                        type="number"
                                        value={formData.width}
                                        onChange={(e) => setFormData({ ...formData, width: parseFloat(e.target.value) })}
                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Height</label>
                                    <input
                                        type="number"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Unit</label>
                                <select
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold appearance-none cursor-pointer"
                                >
                                    <option value="in">Inches (in)</option>
                                    <option value="px">Pixels (px)</option>
                                    <option value="cm">Centimeters (cm)</option>
                                    <option value="mm">Millimeters (mm)</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <Button type="submit" className="flex-[2] py-8 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-xl shadow-xl shadow-indigo-500/20 text-white">
                                    <Save className="w-6 h-6 mr-2" />
                                    {editingIndex !== null ? 'Update Preset' : 'Create Preset'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-8 border-2 border-white/10 bg-white/5 rounded-2xl font-bold text-xl hover:bg-white/10 text-white"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest text-center">Width</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest text-center">Height</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest text-center">Unit</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {canvasPresets.map((preset, index) => (
                                <tr key={index} className="group hover:bg-white/5 transition-all duration-300">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                                                <Layout className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <span className="font-bold text-white text-sm">{preset.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                            <span className="text-[10px] font-bold text-slate-300 font-mono">{preset.width}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                            <span className="text-[10px] font-bold text-slate-300 font-mono">{preset.height}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-[9px] px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-full font-bold uppercase tracking-widest border border-indigo-500/20 shadow-sm">
                                            {preset.unit}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleOpenForm(index)}
                                                className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-indigo-400 transition-all border border-indigo-500/10"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => removePreset(index)}
                                                className="p-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-all border border-red-500/10"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {canvasPresets.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500 italic">No presets defined. Click "Add Preset" to get started.</p>
                    </div>
                )}
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] border border-white/10 p-8 space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">Custom Size Limits</h3>
                    <p className="text-sm text-slate-400 mb-6">Define the minimum and maximum dimensions allowed for custom designs.</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Minimize2 className="w-3 h-3" /> Min Width
                        </label>
                        <input
                            type="number"
                            value={customLimits.minWidth}
                            onChange={(e) => setCustomLimits({ ...customLimits, minWidth: parseFloat(e.target.value) })}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none font-bold transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Maximize2 className="w-3 h-3" /> Max Width
                        </label>
                        <input
                            type="number"
                            value={customLimits.maxWidth}
                            onChange={(e) => setCustomLimits({ ...customLimits, maxWidth: parseFloat(e.target.value) })}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none font-bold transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Minimize2 className="w-3 h-3" /> Min Height
                        </label>
                        <input
                            type="number"
                            value={customLimits.minHeight}
                            onChange={(e) => setCustomLimits({ ...customLimits, minHeight: parseFloat(e.target.value) })}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none font-bold transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Maximize2 className="w-3 h-3" /> Max Height
                        </label>
                        <input
                            type="number"
                            value={customLimits.maxHeight}
                            onChange={(e) => setCustomLimits({ ...customLimits, maxHeight: parseFloat(e.target.value) })}
                            className="w-full bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-indigo-500 outline-none font-bold transition-all"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        onClick={handleSaveCanvasSettings}
                        disabled={isLoading}
                        className="w-full py-8 bg-indigo-600 hover:bg-indigo-500 font-bold text-xl rounded-2xl shadow-xl shadow-indigo-500/20 text-white"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Save className="w-6 h-6 mr-2" />}
                        Save All Configurations
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CanvasPresetsTab;
