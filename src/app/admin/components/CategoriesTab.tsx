import React from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, X, Filter, Save, Loader2 } from 'lucide-react';

interface CategoriesTabProps {
    categories: any[];
    showCategoryForm: boolean;
    setShowCategoryForm: (show: boolean) => void;
    editingCategory: any | null;
    setEditingCategory: (category: any | null) => void;
    handleSaveCategory: (e: React.FormEvent<HTMLFormElement>) => void;
    handleDeleteCategory: (id: string) => void;
    isLoading: boolean;
}

const CategoriesTab = ({
    categories,
    showCategoryForm,
    setShowCategoryForm,
    editingCategory,
    setEditingCategory,
    handleSaveCategory,
    handleDeleteCategory,
    isLoading
}: CategoriesTabProps) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Product Categories ({categories.length})</h2>
                <Button
                    onClick={() => {
                        setEditingCategory(null);
                        setShowCategoryForm(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Category
                </Button>
            </div>

            {showCategoryForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-bold text-white">
                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                            </h3>
                            <button onClick={() => setShowCategoryForm(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveCategory} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Category ID</label>
                                    <input
                                        name="id"
                                        defaultValue={editingCategory?.id}
                                        placeholder="e.g. retail"
                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                        required
                                        disabled={!!editingCategory}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Display Order</label>
                                    <input
                                        name="display_order"
                                        type="number"
                                        defaultValue={editingCategory?.display_order || 0}
                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Category Name</label>
                                <input
                                    name="name"
                                    defaultValue={editingCategory?.name}
                                    placeholder="e.g. Retail"
                                    className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Description</label>
                                <textarea
                                    name="description"
                                    defaultValue={editingCategory?.description}
                                    placeholder="Category description..."
                                    className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-widest ml-1">Icon (Optional)</label>
                                <input
                                    name="icon"
                                    defaultValue={editingCategory?.icon}
                                    placeholder="e.g. 🏪"
                                    className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                />
                            </div>

                            <div className="flex gap-4 pt-6">
                                <Button type="submit" disabled={isLoading} className="flex-[2] py-8 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-xl shadow-xl shadow-indigo-500/20 text-white">
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Save className="w-6 h-6 mr-2" />}
                                    {editingCategory ? 'Update Category' : 'Create Category'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCategoryForm(false)}
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
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest text-center">Order</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {categories.map(category => (
                                <tr key={category.id} className="group hover:bg-white/5 transition-all duration-300">
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-mono text-slate-400">{category.id}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {category.icon && <span className="text-2xl">{category.icon}</span>}
                                            <span className="font-bold text-white text-sm">{category.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-slate-400">{category.description}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-bold text-slate-300">{category.display_order}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => {
                                                    setEditingCategory(category);
                                                    setShowCategoryForm(true);
                                                }}
                                                className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-indigo-400 transition-all border border-indigo-500/10"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(category.id)}
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
            </div>

            {categories.length === 0 && (
                <div className="text-center py-20 bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-white/10">
                    <Filter className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Categories</h3>
                    <p className="text-slate-500">Create your first product category to get started.</p>
                </div>
            )}
        </div>
    );
};

export default CategoriesTab;
