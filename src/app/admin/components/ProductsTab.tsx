import React from 'react';
import { Button } from '@/components/ui/Button';
import {
    Plus, Edit, Trash2, X, Upload, Save, Package, Layout, Loader2
} from 'lucide-react';
import { Product, ProductSize } from '@/lib/products';
import FormattingToolbar from './FormattingToolbar';
import DynamicSizeForm from './DynamicSizeForm';

interface ProductsTabProps {
    products: Product[];
    categories: any[];
    showProductForm: boolean;
    setShowProductForm: (show: boolean) => void;
    editingProduct: Product | null;
    setEditingProduct: (product: Product | null) => void;
    selectedProductsForDelete: string[];
    handleBulkDeleteProducts: () => void;
    handleSaveProduct: (formData: FormData) => void;
    handleDeleteProduct: (id: string) => void;
    toggleProductSelection: (id: string) => void;
    toggleAllProducts: () => void;
    sizes: ProductSize[];
    setSizes: (sizes: ProductSize[]) => void;
    selectedImages: File[];
    setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
    existingImages: string[];
    setExistingImages: React.Dispatch<React.SetStateAction<string[]>>;
    handleFormat: (targetId: string, tag: string) => void;
    isLoading: boolean;
}

const ProductsTab = ({
    products,
    categories,
    showProductForm,
    setShowProductForm,
    editingProduct,
    setEditingProduct,
    selectedProductsForDelete,
    handleBulkDeleteProducts,
    handleSaveProduct,
    handleDeleteProduct,
    toggleProductSelection,
    toggleAllProducts,
    sizes,
    setSizes,
    selectedImages,
    setSelectedImages,
    existingImages,
    setExistingImages,
    handleFormat,
    isLoading
}: ProductsTabProps) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">Products ({products.length})</h2>
                    {selectedProductsForDelete.length > 0 && (
                        <Button
                            onClick={handleBulkDeleteProducts}
                            variant="outline"
                            className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold rounded-xl flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete {selectedProductsForDelete.length} Selected
                        </Button>
                    )}
                </div>
                <Button
                    onClick={() => {
                        setEditingProduct(null);
                        setShowProductForm(true);
                        setSizes([{ id: 'standard', name: 'Standard', dimensions: { width: 24, height: 16, unit: 'in' }, priceMultiplier: 1 }]);
                        setSelectedImages([]);
                        setExistingImages([]);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Product
                </Button>
            </div>

            {showProductForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 rounded-[2.5rem] p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/10 relative">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-3xl font-black text-white">
                                {editingProduct ? 'Edit Product' : 'Add New Product'}
                            </h3>
                            <button onClick={() => setShowProductForm(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSaveProduct(new FormData(e.currentTarget));
                            }}
                            className="space-y-6"
                        >
                            <input type="hidden" name="id" value={editingProduct?.id || ''} />

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Product Name</label>
                                    <input
                                        name="name"
                                        defaultValue={editingProduct?.name}
                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Category</label>
                                    <select
                                        name="category"
                                        defaultValue={editingProduct?.category || 'business'}
                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all cursor-pointer text-white font-bold appearance-none"
                                        required
                                    >
                                        {categories.filter(c => c.id !== 'all').map(cat => (
                                            <option key={cat.id} value={cat.id} className="bg-slate-900">{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Description</label>
                                <FormattingToolbar targetId="prod-desc" onFormat={(tag) => handleFormat('prod-desc', tag)} />
                                <textarea
                                    id="prod-desc"
                                    name="description"
                                    defaultValue={editingProduct?.description}
                                    className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white min-h-[120px]"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Starting Price (₹)</label>
                                    <input
                                        name="priceFrom"
                                        type="number"
                                        defaultValue={editingProduct?.priceFrom}
                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-emerald-400 font-black text-xl"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Materials (comma separated)</label>
                                    <input
                                        name="materials"
                                        defaultValue={editingProduct?.materials?.join(', ')}
                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                        placeholder="Neon, Acrylic, Wood"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Features (one per line)</label>
                                <textarea
                                    name="features"
                                    defaultValue={editingProduct?.features?.join('\n')}
                                    className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white min-h-[80px]"
                                    placeholder="Customizable design&#10;Durable material"
                                />
                            </div>

                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-6">
                                <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">SEO Configuration</h4>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Meta Title</label>
                                        <input
                                            name="metaTitle"
                                            defaultValue={editingProduct?.seo?.metaTitle}
                                            placeholder="Product SEO Title"
                                            className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">URL Slug</label>
                                        <input
                                            name="slug"
                                            defaultValue={editingProduct?.seo?.slug}
                                            placeholder="product-name-slug"
                                            className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Meta Keywords (comma separated)</label>
                                    <input
                                        name="keywords"
                                        defaultValue={editingProduct?.seo?.keywords?.join(', ')}
                                        placeholder="signage, banner, custom"
                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Meta Description</label>
                                    <textarea
                                        name="metaDescription"
                                        defaultValue={editingProduct?.seo?.metaDescription}
                                        placeholder="Enter descriptive text for search engines..."
                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white min-h-[80px]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Product Dimensions (Sizes)</label>
                                <DynamicSizeForm sizes={sizes} onChange={setSizes} />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Visual Gallery</label>
                                <div className="grid grid-cols-4 gap-4">
                                    {existingImages.map((url, idx) => (
                                        <div key={`existing-${idx}`} className="aspect-square rounded-2xl border-2 border-white/5 relative group p-1">
                                            <img src={url} className="w-full h-full object-cover rounded-xl" />
                                            <button
                                                type="button"
                                                onClick={() => setExistingImages(img => img.filter((_, i) => i !== idx))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedImages.map((file, idx) => (
                                        <div key={`selected-${idx}`} className="aspect-square rounded-2xl border-2 border-indigo-500/30 bg-indigo-500/5 relative group p-1 animate-in zoom-in-50 duration-300">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                className="w-full h-full object-cover rounded-xl"
                                            />
                                            <div className="absolute inset-0 bg-indigo-600/20 rounded-xl pointer-events-none" />
                                            <button
                                                type="button"
                                                onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                                                className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                                            >
                                                <X size={14} />
                                            </button>
                                            <div className="absolute bottom-1 right-1 bg-indigo-600 rounded-lg px-1.5 py-0.5 shadow-lg">
                                                <span className="text-[8px] font-black text-white uppercase">New</span>
                                            </div>
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded-2xl border-2 border-dashed border-white/10 hover:border-indigo-500 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center p-4">
                                        <Upload size={20} className="text-white/40 mb-2" />
                                        <span className="text-[10px] font-black text-white/40 uppercase">Upload</span>
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files || []);
                                                setSelectedImages(prev => [...prev, ...files]);
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <Button type="submit" disabled={isLoading} className="flex-[2] py-8 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/20 text-white">
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Save className="w-6 h-6 mr-2" />}
                                    {editingProduct ? 'Update Product' : 'Create Product'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowProductForm(false)}
                                    className="flex-1 py-8 border-2 border-white/10 bg-white/5 rounded-2xl font-black text-xl hover:bg-white/10 text-white"
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
                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest w-12">
                                    <input
                                        type="checkbox"
                                        checked={selectedProductsForDelete.length === products.length && products.length > 0}
                                        onChange={toggleAllProducts}
                                        className="w-4 h-4 rounded border-white/20 bg-black/20 text-indigo-600 focus:ring-indigo-500"
                                    />
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Product</th>
                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest text-center">Sizes</th>
                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Price</th>
                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.map(product => (
                                <tr key={product.id} className="group hover:bg-white/5 transition-all duration-300">
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedProductsForDelete.includes(product.id)}
                                            onChange={() => toggleProductSelection(product.id)}
                                            className="w-4 h-4 rounded border-white/20 bg-black/20 text-indigo-600 focus:ring-indigo-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden shrink-0 shadow-lg">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-sm">{product.name}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">#{product.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-full font-black uppercase tracking-widest border border-indigo-500/20 shadow-sm">
                                            {product.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10">
                                            <Layout className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-300">{(product.sizes || []).length}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-emerald-400">₹{product.priceFrom}</span>
                                            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">Starting</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => {
                                                    setEditingProduct(product);
                                                    setShowProductForm(true);
                                                    setSizes(product.sizes || []);
                                                    setExistingImages(product.images || []);
                                                    setSelectedImages([]);
                                                }}
                                                className="p-3 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl text-indigo-400 transition-all border border-indigo-500/10"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
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

            {products.length === 0 && (
                <div className="text-center py-20 bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-white/10">
                    <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Products</h3>
                    <p className="text-slate-500">Launch your first product to get started.</p>
                </div>
            )}
        </div>
    );
};

export default ProductsTab;
