'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Plus, Edit, Trash2, X, Upload, Save, Package, Layout, CheckCircle,
    AlertCircle, Image as ImageIcon, ChevronRight, Search, Filter,
    Bold, Italic, Link as LinkIcon, List as ListIcon, Loader2, FileText, Wrench
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fabric } from 'fabric';
import { Product, ProductSize } from '@/lib/products';
import {
    saveProductAction, deleteProductAction, uploadProductImages,
    uploadTemplate, getTemplates, deleteTemplate as deleteTemplateActionImport,
    getOrders as getOrdersAction, updateOrderStatus as updateOrderStatusAction,
    getCategories, saveCategory, deleteCategory
} from '../actions';

const PRODUCT_CATEGORIES = [
    { id: 'all', name: 'All Categories' },
    { id: 'business', name: 'Business' },
    { id: 'retail', name: 'Retail' },
    { id: 'event', name: 'Event' },
    { id: 'hospitality', name: 'Hospitality' }
];

interface FormattingToolbarProps {
    targetId: string;
    onFormat: (tag: string) => void;
}

const FormattingToolbar = ({ onFormat }: FormattingToolbarProps) => (
    <div className="flex items-center gap-1 mb-1 p-1 bg-gray-50 border border-gray-200 rounded-t-lg">
        <button
            type="button"
            onClick={() => onFormat('b')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Bold"
        >
            <Bold className="w-4 h-4" />
        </button>
        <button
            type="button"
            onClick={() => onFormat('i')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Italic"
        >
            <Italic className="w-4 h-4" />
        </button>
        <button
            type="button"
            onClick={() => onFormat('a')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Link"
        >
            <LinkIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
            type="button"
            onClick={() => onFormat('li')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="List Item"
        >
            <ListIcon className="w-4 h-4" />
        </button>
    </div>
);

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
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Height</label>
                                <input
                                    type="number"
                                    value={size.dimensions.height}
                                    onChange={(e) => updateDimensions(size.id, { height: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border-2 border-white rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-900 font-bold"
                                    required
                                />
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

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginPin, setLoginPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showProductForm, setShowProductForm] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [pin, setPin] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'templates' | 'products' | 'orders' | 'categories'>('orders');
    const [sizes, setSizes] = useState<ProductSize[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    // Template Categorization State
    const [templateType, setTemplateType] = useState<'universal' | 'specific'>('universal');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [templateCategory, setTemplateCategory] = useState<string>('Business');

    // Multi-select for bulk delete
    const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
    const [selectedProductsForDelete, setSelectedProductsForDelete] = useState<string[]>([]);

    // Category management state
    const [categories, setCategories] = useState<any[]>([]);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [fileDimensions, setFileDimensions] = useState<{ width: number, height: number } | null>(null);

    const router = useRouter();

    // Check localStorage for saved PIN on mount
    useEffect(() => {
        const savedPin = localStorage.getItem('admin_pin');
        if (savedPin === '1234') {
            setIsAuthenticated(true);
            setPin(savedPin);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (loginPin === '1234') {
            setIsAuthenticated(true);
            setPin(loginPin);
            localStorage.setItem('admin_pin', loginPin);
            setMessage(null);
        } else {
            setMessage({ type: 'error', text: 'Invalid Admin PIN' });
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setPin('');
        localStorage.removeItem('admin_pin');
        setMessage({ type: 'success', text: 'Logged out successfully' });
    };

    const fetchTemplates = async () => {
        const data = await getTemplates();
        setTemplates(data || []);
    };

    const fetchProducts = async () => {
        const { db } = await import('@/lib/db');
        try {
            const data = await db.getProducts();
            setProducts(data || []);
        } catch (err) {
            console.error('Error fetching products:', err);
        }
    };

    const fetchOrders = async () => {
        if (!pin) return;
        const res = await getOrdersAction(pin);
        if (res.success) {
            setOrders(res.orders || []);
        }
    };

    const fetchCategories = async () => {
        const res = await getCategories();
        if (res.success) {
            setCategories(res.categories || []);
        }
    };

    const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!pin) {
            setMessage({ type: 'error', text: 'Please enter Admin PIN' });
            return;
        }

        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const categoryData = {
            id: editingCategory?.id || formData.get('id') as string,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            icon: formData.get('icon') as string,
            display_order: parseInt(formData.get('display_order') as string) || 0,
            is_active: true
        };

        const res = await saveCategory(categoryData, pin);
        if (res.success) {
            setMessage({ type: 'success', text: editingCategory ? 'Category updated!' : 'Category created!' });
            fetchCategories();
            setShowCategoryForm(false);
            setEditingCategory(null);
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to save category' });
        }
        setIsLoading(false);
    };

    const handleDeleteCategory = async (id: string) => {
        if (!pin) {
            setMessage({ type: 'error', text: 'Please enter Admin PIN' });
            return;
        }
        if (!confirm('Delete this category?')) return;

        setIsLoading(true);
        const res = await deleteCategory(id, pin);
        if (res.success) {
            setMessage({ type: 'success', text: 'Category deleted!' });
            fetchCategories();
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to delete category' });
        }
        setIsLoading(false);
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        const file = formData.get('file') as File;

        if (file && file.name.endsWith('.svg')) {
            try {
                const text = await file.text();
                const fabricJson = await new Promise<string>((resolve) => {
                    fabric.loadSVGFromString(text, (objects, options) => {
                        const tempCanvas = new fabric.Canvas(null, {
                            width: options.width || 1000,
                            height: options.height || 1000
                        });
                        objects.forEach((obj, i) => tempCanvas.add(obj));
                        resolve(JSON.stringify(tempCanvas.toJSON()));
                    });
                });

                if (fabricJson) {
                    formData.append('fabricConfig', fabricJson);
                }
            } catch (e) {
                console.error('SVG Parse Error', e);
            }
        }

        let res;
        try {
            res = await uploadTemplate(formData);
        } catch (error: any) {
            res = { success: false, error: error.message };
        }

        if (res.success) {
            setMessage({ type: 'success', text: 'Template uploaded successfully!' });
            (event.target as HTMLFormElement).reset();
            fetchTemplates();
        } else {
            setMessage({ type: 'error', text: res.error || 'Upload failed' });
        }
        setIsLoading(false);
    }

    async function handleDelete(id: string) {
        if (!pin) {
            setMessage({ type: 'error', text: 'Please enter Admin PIN to delete' });
            return;
        }
        if (!confirm('Are you sure you want to delete this template?')) return;
        setIsLoading(true);
        const res = await deleteTemplateActionImport(id, pin);
        if (res.success) {
            setMessage({ type: 'success', text: 'Template deleted' });
            fetchTemplates();
        } else {
            setMessage({ type: 'error', text: res.error || 'Delete failed' });
        }
        setIsLoading(false);
    }

    async function handleSaveProduct(formData: FormData) {
        if (!pin) {
            setMessage({ type: 'error', text: 'Please enter Admin PIN to save products' });
            return;
        }

        setIsLoading(true);

        let finalImage = formData.get('image') as string || '/products/placeholder.jpg';
        let finalImages = [...existingImages];

        if (selectedImages.length > 0) {
            const uploadFormData = new FormData();
            selectedImages.forEach(file => uploadFormData.append('images', file));
            const uploadRes = await uploadProductImages(uploadFormData);
            if (uploadRes.success && uploadRes.urls) {
                finalImages = [...finalImages, ...uploadRes.urls];
                if (finalImage === '/products/placeholder.jpg' || !finalImage) {
                    finalImage = uploadRes.urls[0];
                }
            } else if (!uploadRes.success) {
                setMessage({ type: 'error', text: uploadRes.error || 'Image upload failed' });
                setIsLoading(false);
                return;
            }
        }

        const productData: any = {
            id: formData.get('id') as string || `product-${Date.now()}`,
            name: formData.get('name') as string,
            category: formData.get('category') as any,
            description: formData.get('description') as string,
            image: finalImage,
            images: finalImages,
            priceFrom: parseInt(formData.get('priceFrom') as string),
            rating: 4.5,
            reviewCount: 0,
            features: (formData.get('features') as string).split('\n').filter(f => f.trim()),
            sizes: sizes,
            materials: (formData.get('materials') as string).split(',').map(m => m.trim()) as any[],
            popularTemplates: [],
            seo: {
                metaTitle: formData.get('metaTitle') as string,
                metaDescription: formData.get('metaDescription') as string,
                keywords: (formData.get('keywords') as string)?.split(',').map(kw => kw.trim()).filter(Boolean) || [],
                slug: formData.get('slug') as string
            }
        };

        const res = await saveProductAction(productData, pin);

        if (res.success) {
            setMessage({ type: 'success', text: editingProduct ? 'Product updated!' : 'Product created!' });
            fetchProducts();
            setShowProductForm(false);
            setEditingProduct(null);
            setSelectedImages([]);
            setExistingImages([]);
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to save product' });
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchTemplates();
        fetchProducts();
        fetchCategories();
        if (isAuthenticated) {
            fetchOrders();
        }
        // Initialize with default size on client side to avoid hydration mismatch
        setSizes([{ id: 'standard', name: 'Standard', dimensions: { width: 24, height: 16, unit: 'in' }, priceMultiplier: 1 }]);
    }, [isAuthenticated, pin]);

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        if (!pin) return;
        setIsLoading(true);
        const res = await updateOrderStatusAction(orderId, newStatus, pin);
        if (res.success) {
            setMessage({ type: 'success', text: 'Order status updated' });
            fetchOrders();
        } else {
            setMessage({ type: 'error', text: res.error || 'Update failed' });
        }
        setIsLoading(false);
    };

    const handleFormat = (targetId: string, tag: string) => {
        const textarea = document.getElementById(targetId) as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let replacement = '';

        if (tag === 'a') {
            const url = prompt('Enter URL:', 'https://');
            if (url) replacement = `<a href="${url}" class="text-indigo-600 hover:underline font-bold" target="_blank">${selectedText || 'Link'}</a>`;
        } else if (tag === 'li') {
            replacement = `<li>${selectedText}</li>`;
        } else {
            replacement = `<${tag}>${selectedText}</${tag}>`;
        }

        if (replacement) {
            textarea.setRangeText(replacement, start, end, 'select');
        }
    };

    async function handleDeleteProduct(id: string) {
        if (!pin) {
            setMessage({ type: 'error', text: 'Please enter Admin PIN to delete products' });
            return;
        }
        if (!confirm('Delete this product?')) return;
        setIsLoading(true);
        const res = await deleteProductAction(id, pin);
        if (res.success) {
            setMessage({ type: 'success', text: 'Product deleted!' });
            fetchProducts();
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to delete product' });
        }
        setIsLoading(false);
    }

    // Bulk delete handlers
    async function handleBulkDeleteTemplates() {
        if (!pin) {
            setMessage({ type: 'error', text: 'Please enter Admin PIN to delete templates' });
            return;
        }
        if (selectedTemplateIds.length === 0) {
            setMessage({ type: 'error', text: 'No templates selected' });
            return;
        }
        if (!confirm(`Delete ${selectedTemplateIds.length} template(s)?`)) return;

        setIsLoading(true);
        let successCount = 0;
        for (const id of selectedTemplateIds) {
            const res = await deleteTemplateActionImport(id, pin);
            if (res.success) successCount++;
        }

        setMessage({ type: 'success', text: `${successCount} template(s) deleted` });
        setSelectedTemplateIds([]);
        fetchTemplates();
        setIsLoading(false);
    }

    async function handleBulkDeleteProducts() {
        if (!pin) {
            setMessage({ type: 'error', text: 'Please enter Admin PIN to delete products' });
            return;
        }
        if (selectedProductsForDelete.length === 0) {
            setMessage({ type: 'error', text: 'No products selected' });
            return;
        }
        if (!confirm(`Delete ${selectedProductsForDelete.length} product(s)?`)) return;

        setIsLoading(true);
        let successCount = 0;
        for (const id of selectedProductsForDelete) {
            const res = await deleteProductAction(id, pin);
            if (res.success) successCount++;
        }

        setMessage({ type: 'success', text: `${successCount} product(s) deleted` });
        setSelectedProductsForDelete([]);
        fetchProducts();
        setIsLoading(false);
    }

    // Toggle selection handlers
    const toggleTemplateSelection = (id: string) => {
        setSelectedTemplateIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const toggleProductSelection = (id: string) => {
        setSelectedProductsForDelete(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const toggleAllTemplates = () => {
        if (selectedTemplateIds.length === templates.length) {
            setSelectedTemplateIds([]);
        } else {
            setSelectedTemplateIds(templates.map(t => t.id));
        }
    };

    const toggleAllProducts = () => {
        if (selectedProductsForDelete.length === products.length) {
            setSelectedProductsForDelete([]);
        } else {
            setSelectedProductsForDelete(products.map(p => p.id));
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10 animate-in fade-in zoom-in duration-500">
                        <div className="bg-indigo-600/20 p-8 text-center border-b border-white/5">
                            <div className="w-20 h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                <Package className="w-10 h-10 text-indigo-400" />
                            </div>
                            <h1 className="text-2xl font-black text-white">Admin Access</h1>
                            <p className="text-indigo-200 text-sm mt-1">SignagePro Management Portal</p>
                        </div>

                        <form onSubmit={handleLogin} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-indigo-200 ml-1">Administrator PIN</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={loginPin}
                                        onChange={(e) => setLoginPin(e.target.value)}
                                        placeholder="••••"
                                        className="w-full px-6 py-4 bg-black/20 border-2 border-white/10 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-center text-2xl tracking-widest font-mono text-white placeholder-white/20"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            {message?.type === 'error' && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl flex items-center gap-3 text-sm animate-shake">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span className="font-semibold">{message.text}</span>
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                            >
                                Unlock Dashboard
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 font-sans">
            <div className="max-w-7xl mx-auto p-6 text-white">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-white mb-2">Admin Dashboard</h1>
                        <p className="text-indigo-200">Manage your products and templates</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="rounded-xl border-white/10 hover:bg-white/10 text-white"
                    >
                        Sign Out
                    </Button>
                </div>

                <div className="flex gap-2 mb-6 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`px-6 py-3 font-bold transition-all relative ${activeTab === 'orders' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <AlertCircle className="w-5 h-5 inline mr-2" />
                        Orders
                        {activeTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-3 font-bold transition-all relative ${activeTab === 'products' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Package className="w-5 h-5 inline mr-2" />
                        Products
                        {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`px-6 py-3 font-bold transition-all relative ${activeTab === 'templates' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <FileText className="w-5 h-5 inline mr-2" />
                        Templates
                        {activeTab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-6 py-3 font-bold transition-all relative ${activeTab === 'categories' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Filter className="w-5 h-5 inline mr-2" />
                        Categories
                        {activeTab === 'categories' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                    </button>
                </div>

                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Product Orders ({orders.length})</h2>
                            <Button
                                onClick={fetchOrders}
                                variant="outline"
                                className="border-white/10 text-white hover:bg-white/5"
                            >
                                Refresh
                            </Button>
                        </div>

                        <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/10 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white/5 border-b border-white/10">
                                            <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Order Info</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Customer</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Amount</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {orders.map(order => (
                                            <React.Fragment key={order.id}>
                                                <tr className={`group transition-all duration-300 ${expandedOrder === order.id ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-[10px] text-indigo-400 font-bold tracking-tight">#{order.id.split('-')[0].toUpperCase()}</span>
                                                            <span className="text-xs text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-white text-sm">{order.customer_name}</span>
                                                            <span className="text-[10px] text-slate-400">{order.customer_phone}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-black text-emerald-400">₹{order.amount}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                            className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-black/20 border transition-all ${order.status === 'paid' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="paid">Paid</option>
                                                            <option value="processing">Processing</option>
                                                            <option value="shipped">Shipped</option>
                                                            <option value="completed">Completed</option>
                                                            <option value="cancelled">Cancelled</option>
                                                        </select>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all"
                                                        >
                                                            {expandedOrder === order.id ? <X size={16} /> : <ChevronRight size={16} className={expandedOrder === order.id ? 'rotate-90' : ''} />}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {/* Expanded Details */}
                                                {expandedOrder === order.id && (
                                                    <tr className="bg-black/20 border-b border-indigo-500/20 animate-in slide-in-from-top-4 duration-300">
                                                        <td colSpan={5} className="px-8 py-6">
                                                            <div className="grid md:grid-cols-2 gap-8">
                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Customer Info & Shipping</h4>
                                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-slate-200 space-y-2">
                                                                            <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Name:</span> {order.customer_name}</p>
                                                                            <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Email:</span> {order.customer_email}</p>
                                                                            <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Phone:</span> {order.customer_phone}</p>
                                                                            <div className="pt-2 border-t border-white/5">
                                                                                <span className="text-slate-500 font-bold uppercase text-[9px] block mb-1">Address:</span>
                                                                                {order.customer_address}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Company Details</h4>
                                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-slate-200">
                                                                            <p className="font-bold">{order.company_details?.companyName}</p>
                                                                            <p className="opacity-70">{order.company_details?.address}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Service Options</h4>
                                                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-slate-200 space-y-2">
                                                                            <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Delivery:</span> {order.design_config?.deliveryType === 'fast' ? 'Express (24-48h)' : 'Standard (3-5 days)'}</p>
                                                                            <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Installation:</span> {order.design_config?.includeInstallation ? 'Required' : 'Not Required'}</p>
                                                                            <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Payment Scheme:</span> {order.design_config?.paymentScheme === 'part' ? 'Partial (Advance)' : 'Full Payment'}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Design Proof</h4>
                                                                    <div className="aspect-[16/10] bg-white rounded-2xl border-4 border-slate-800 overflow-hidden flex items-center justify-center p-2">
                                                                        {order.visual_proof ? (
                                                                            order.visual_proof.startsWith('data:application/pdf') ? (
                                                                                <div className="w-full h-full relative group/pdf">
                                                                                    <iframe
                                                                                        src={order.visual_proof}
                                                                                        className="w-full h-full"
                                                                                        title="Design Proof"
                                                                                    />
                                                                                    <a
                                                                                        href={order.visual_proof}
                                                                                        download={`proof-${order.id}.pdf`}
                                                                                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/pdf:opacity-100 transition-opacity text-white font-bold"
                                                                                    >
                                                                                        Download PDF
                                                                                    </a>
                                                                                </div>
                                                                            ) : (
                                                                                <div dangerouslySetInnerHTML={{ __html: order.visual_proof }} className="w-full h-full" />
                                                                            )
                                                                        ) : (
                                                                            <span className="text-slate-400 font-bold">No visual proof</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {orders.length === 0 && (
                            <div className="text-center py-20 bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-white/10">
                                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white">No Orders Found</h3>
                                <p className="text-slate-400">Wait for your first customer to place an order.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'products' && (
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
                                                    <div key={idx} className="aspect-square rounded-2xl border-2 border-white/5 relative group p-1">
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
                )}

                {activeTab === 'templates' && (
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
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 py-7 rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 group relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        {isLoading ? (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Loader2 className="w-5 h-4 animate-spin text-white" />
                                                <span className="text-white">Processing...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 justify-center">
                                                <Upload className="w-5 h-5 text-white" />
                                                <span className="text-white">Upload Template</span>
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
                )
                }

                {/* Categories Tab */}
                {
                    activeTab === 'categories' && (
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
                                            <h3 className="text-3xl font-black text-white">
                                                {editingCategory ? 'Edit Category' : 'Add New Category'}
                                            </h3>
                                            <button onClick={() => setShowCategoryForm(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                                                <X className="w-6 h-6 text-white" />
                                            </button>
                                        </div>

                                        <form onSubmit={handleSaveCategory} className="space-y-6">
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Category ID</label>
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
                                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Display Order</label>
                                                    <input
                                                        name="display_order"
                                                        type="number"
                                                        defaultValue={editingCategory?.display_order || 0}
                                                        className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Category Name</label>
                                                <input
                                                    name="name"
                                                    defaultValue={editingCategory?.name}
                                                    placeholder="e.g. Retail"
                                                    className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Description</label>
                                                <textarea
                                                    name="description"
                                                    defaultValue={editingCategory?.description}
                                                    placeholder="Category description..."
                                                    className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white min-h-[100px]"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-1">Icon (Optional)</label>
                                                <input
                                                    name="icon"
                                                    defaultValue={editingCategory?.icon}
                                                    placeholder="e.g. 🏪"
                                                    className="w-full px-6 py-4 bg-black/20 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
                                                />
                                            </div>

                                            <div className="flex gap-4 pt-6">
                                                <Button type="submit" disabled={isLoading} className="flex-[2] py-8 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-xl shadow-xl shadow-indigo-500/20 text-white">
                                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Save className="w-6 h-6 mr-2" />}
                                                    {editingCategory ? 'Update Category' : 'Create Category'}
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setShowCategoryForm(false)}
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
                                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">ID</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Name</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest">Description</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest text-center">Order</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest text-right">Actions</th>
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
                    )
                }

                {
                    message && (
                        <div className={`fixed bottom-8 right-8 p-6 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 z-[100] border-2 ${message.type === 'success'
                            ? 'bg-emerald-600 text-white border-white/20'
                            : 'bg-red-600 text-white border-white/20'
                            }`}>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                {message.type === 'success' ? <CheckCircle className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-1">System Status</p>
                                <span className="font-black text-lg leading-none">{message.text}</span>
                            </div>
                            <button onClick={() => setMessage(null)} className="ml-4 hover:scale-110 transition-transform">
                                <X className="w-5 h-5 opacity-40 hover:opacity-100" />
                            </button>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
