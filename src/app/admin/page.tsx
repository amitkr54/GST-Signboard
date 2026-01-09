'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Plus, Edit, Trash2, X, Upload, Save, Package, Layout, CheckCircle,
    AlertCircle, Image as ImageIcon, ChevronRight, Search, Filter,
    Bold, Italic, Link as LinkIcon, List as ListIcon, Loader2, FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fabric } from 'fabric';
import { Product, ProductSize } from '@/lib/products';
import {
    saveProductAction, deleteProductAction, uploadProductImages,
    saveTemplateAction, deleteTemplateAction, uploadTemplateThumbnail,
    uploadTemplate, getTemplates, deleteTemplate as deleteTemplateActionImport
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
                                    className="w-full px-3 py-2 border-2 border-white rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm"
                                    required
                                />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Width</label>
                                <input
                                    type="number"
                                    value={size.dimensions.width}
                                    onChange={(e) => updateDimensions(size.id, { width: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border-2 border-white rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm"
                                    required
                                />
                            </div>
                            <div className="col-span-4 sm:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Height</label>
                                <input
                                    type="number"
                                    value={size.dimensions.height}
                                    onChange={(e) => updateDimensions(size.id, { height: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border-2 border-white rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm"
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
                                    className="w-full px-3 py-2 border-2 border-white rounded-xl focus:border-indigo-500 outline-none transition-all shadow-sm"
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
    const [activeTab, setActiveTab] = useState<'templates' | 'products'>('products');
    const [sizes, setSizes] = useState<ProductSize[]>([]);
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (loginPin === '1234') {
            setIsAuthenticated(true);
            setPin(loginPin);
            setMessage(null);
        } else {
            setMessage({ type: 'error', text: 'Invalid Admin PIN' });
        }
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

    useEffect(() => {
        fetchTemplates();
        fetchProducts();
        // Initialize with default size on client side to avoid hydration mismatch
        setSizes([{ id: 'standard', name: 'Standard', dimensions: { width: 24, height: 16, unit: 'in' }, priceMultiplier: 1 }]);
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        const file = formData.get('file') as File;

        if (file && file.name.endsWith('.svg')) {
            try {
                const text = await file.text();
                await new Promise<void>((resolve) => {
                    fabric.loadSVGFromString(text, (objects, options) => {
                        const tempCanvas = new fabric.Canvas(null, {
                            width: options.width || 1000,
                            height: options.height || 1000
                        });

                        objects.forEach((obj, i) => {
                            if (!(obj as any).name) (obj as any).name = `object_${i}`;
                            tempCanvas.add(obj);
                        });

                        const textObjects = tempCanvas.getObjects().filter(o => o.type === 'text' || o.type === 'i-text');
                        textObjects.sort((a, b) => (a.top || 0) - (b.top || 0));

                        const mergedGroups: fabric.Object[][] = [];
                        let currentGroup: fabric.Object[] = [];

                        textObjects.forEach((obj, index) => {
                            if (currentGroup.length === 0) {
                                currentGroup.push(obj);
                                return;
                            }

                            const prev = currentGroup[currentGroup.length - 1] as any;
                            const curr = obj as any;

                            const isSameFont = prev.fontFamily === curr.fontFamily;
                            const isSameSize = Math.abs((prev.fontSize || 0) - (curr.fontSize || 0)) < 2;
                            const isSameColor = prev.fill === curr.fill;
                            const isSameWeight = prev.fontWeight === curr.fontWeight;
                            const isSameStyle = prev.fontStyle === curr.fontStyle;

                            const fontSize = prev.fontSize || 20;
                            const lineHeight = prev.lineHeight || 1.16;
                            const expectedLineGap = fontSize * lineHeight;
                            const actualGap = (curr.top || 0) - (prev.top || 0);

                            const isCloseVertically = actualGap > (expectedLineGap * 0.8) && actualGap < (expectedLineGap * 1.5);
                            const alignTolerance = 30;
                            const isAlignedLeft = Math.abs((prev.left || 0) - (curr.left || 0)) < alignTolerance;
                            const isAlignedCenter = Math.abs(((prev.left || 0) + (prev.width || 0) / 2) - ((curr.left || 0) + (curr.width || 0) / 2)) < alignTolerance;
                            const isAlignedRight = Math.abs(((prev.left || 0) + (prev.width || 0)) - ((curr.left || 0) + (curr.width || 0))) < alignTolerance;

                            if (isSameFont && isSameSize && isSameColor && isSameWeight && isSameStyle &&
                                isCloseVertically && (isAlignedLeft || isAlignedCenter || isAlignedRight)) {
                                currentGroup.push(curr);
                            } else {
                                mergedGroups.push([...currentGroup]);
                                currentGroup = [curr];
                            }
                        });
                        if (currentGroup.length > 0) mergedGroups.push(currentGroup);

                        mergedGroups.forEach(group => {
                            if (group.length > 1) {
                                const first = group[0];
                                const combinedText = group.map((o: any) => o.text).join('\n');
                                const newTextbox = new fabric.Textbox(combinedText, {
                                    ...first.toObject(['left', 'top', 'fill', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'shadow', 'opacity']),
                                    width: Math.max(...group.map(o => o.getScaledWidth())),
                                    splitByGrapheme: false
                                });
                                group.forEach(o => tempCanvas.remove(o));
                                tempCanvas.add(newTextbox);
                            }
                        });

                        tempCanvas.renderAll();
                        const json = tempCanvas.toJSON();
                        formData.append('fabricConfig', JSON.stringify(json));
                        tempCanvas.dispose();
                        resolve();
                    });
                });
            } catch (err) {
                console.error('Error generating Fabric JSON:', err);
            }
        }

        const res = await uploadTemplate(formData);

        if (res.success) {
            setMessage({ type: 'success', text: 'Template uploaded successfully!' });
            (event.target as HTMLFormElement).reset();
            fetchTemplates();
            router.refresh();
        } else {
            setMessage({ type: 'error', text: res.error || 'Upload failed' });
        }
        setIsLoading(false);
    }

    async function handleDelete(id: string) {
        if (!pin) {
            setMessage({ type: 'error', text: 'Please enter Admin PIN above to delete' });
            return;
        }
        if (!confirm('Are you sure you want to delete this template?')) return;
        setIsLoading(true);
        const res = await deleteTemplateActionImport(id, pin);
        if (res.success) {
            setMessage({ type: 'success', text: 'Template deleted' });
            fetchTemplates();
            router.refresh();
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
            sizes: JSON.parse(formData.get('sizes') as string),
            materials: (formData.get('materials') as string).split(',').map(m => m.trim()) as any[],
            popularTemplates: []
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

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-indigo-100 animate-in fade-in zoom-in duration-500">
                        <div className="bg-indigo-600 p-8 text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                <Package className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-2xl font-black text-white">Admin Access</h1>
                            <p className="text-indigo-100 text-sm mt-1">SignagePro Management Portal</p>
                        </div>

                        <form onSubmit={handleLogin} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 ml-1">Administrator PIN</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        value={loginPin}
                                        onChange={(e) => setLoginPin(e.target.value)}
                                        placeholder="••••"
                                        className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 focus:ring-0 outline-none transition-all text-center text-2xl tracking-widest font-mono"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {message?.type === 'error' && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm animate-shake">
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span className="font-semibold">{message.text}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                            >
                                Unlock Dashboard
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2">Admin Dashboard</h1>
                        <p className="text-gray-600">Manage your products and templates</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setIsAuthenticated(false)}
                        className="rounded-xl border-gray-200 hover:bg-gray-50"
                    >
                        Sign Out
                    </Button>
                </div>

                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-3 font-bold transition-all relative ${activeTab === 'products' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Package className="w-5 h-5 inline mr-2" />
                        Products
                        {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`px-6 py-3 font-bold transition-all relative ${activeTab === 'templates' ? 'text-indigo-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <FileText className="w-5 h-5 inline mr-2" />
                        Templates
                        {activeTab === 'templates' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
                    </button>
                </div>

                {activeTab === 'products' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Products ({products.length})</h2>
                            <Button
                                onClick={() => {
                                    setEditingProduct(null);
                                    setShowProductForm(true);
                                    setSizes([{ id: 'standard', name: 'Standard', dimensions: { width: 24, height: 16, unit: 'in' }, priceMultiplier: 1 }]);
                                    setSelectedImages([]);
                                    setExistingImages([]);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Product
                            </Button>
                        </div>

                        {showProductForm && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                                <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-3xl font-black text-gray-900">
                                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                                        </h3>
                                        <button onClick={() => setShowProductForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                            <X className="w-6 h-6" />
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

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-black text-gray-700 mb-1 uppercase tracking-wider">Product Name *</label>
                                                <input
                                                    name="name"
                                                    defaultValue={editingProduct?.name}
                                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-black text-gray-700 mb-1 uppercase tracking-wider">Category *</label>
                                                <select
                                                    name="category"
                                                    defaultValue={editingProduct?.category || 'business'}
                                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                                    required
                                                >
                                                    {PRODUCT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-1 uppercase tracking-wider">Description *</label>
                                            <FormattingToolbar targetId="prod-desc" onFormat={(tag) => handleFormat('prod-desc', tag)} />
                                            <textarea
                                                id="prod-desc"
                                                name="description"
                                                defaultValue={editingProduct?.description}
                                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 border-t-0 rounded-b-xl focus:border-indigo-500 outline-none transition-all"
                                                rows={4}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-1 uppercase tracking-wider">Starting Price (₹) *</label>
                                            <input
                                                name="priceFrom"
                                                type="number"
                                                defaultValue={editingProduct?.priceFrom}
                                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-1 uppercase tracking-wider">Features (one per line) *</label>
                                            <FormattingToolbar targetId="prod-features" onFormat={(tag) => handleFormat('prod-features', tag)} />
                                            <textarea
                                                id="prod-features"
                                                name="features"
                                                defaultValue={editingProduct?.features?.join('\n')}
                                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 border-t-0 rounded-b-xl focus:border-indigo-500 outline-none transition-all font-medium"
                                                rows={6}
                                                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-1 uppercase tracking-wider">Materials (comma separated)</label>
                                            <input
                                                name="materials"
                                                defaultValue={editingProduct?.materials?.join(', ')}
                                                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                                                placeholder="flex, sunboard, acrylic"
                                            />
                                        </div>

                                        <div>
                                            <input type="hidden" name="sizes" value={JSON.stringify(sizes)} />
                                            <DynamicSizeForm sizes={sizes} onChange={setSizes} />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Product Images</label>
                                            <div className="grid grid-cols-4 gap-3 mb-4">
                                                {existingImages.map((url, idx) => (
                                                    <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-gray-50 shadow-sm">
                                                        <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                                                            className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]"
                                                        >
                                                            <Trash2 className="w-6 h-6 text-white" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {selectedImages.map((file, idx) => (
                                                    <div key={idx} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm bg-indigo-50/30">
                                                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                                                            className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]"
                                                        >
                                                            <Trash2 className="w-6 h-6 text-white" />
                                                        </button>
                                                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded uppercase tracking-tighter">New</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files) {
                                                            setSelectedImages(prev => [...prev, ...Array.from(e.target.files!)]);
                                                        }
                                                    }}
                                                    className="hidden"
                                                    id="product-image-upload"
                                                />
                                                <label
                                                    htmlFor="product-image-upload"
                                                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer group"
                                                >
                                                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                                                    <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-700">Add Product Images</span>
                                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <Button type="submit" disabled={isLoading} className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50">
                                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Save className="w-6 h-6 mr-2" />}
                                                {editingProduct ? 'Update Product' : 'Create Product'}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setShowProductForm(false)}
                                                className="flex-1 py-4 border-2 border-gray-100 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all active:scale-95"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <div key={product.id} className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 relative overflow-hidden">
                                    {/* Background decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-16 -mt-16 group-hover:w-40 group-hover:h-40 transition-all duration-500" />

                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div>
                                            <h3 className="font-black text-xl text-gray-900 leading-tight mb-2 line-clamp-1">{product.name}</h3>
                                            <span className="text-[10px] px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-black uppercase tracking-widest border border-indigo-100">
                                                {product.category}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingProduct(product);
                                                    setShowProductForm(true);
                                                    setSizes(product.sizes || []);
                                                    setExistingImages(product.images || []);
                                                    setSelectedImages([]);
                                                }}
                                                className="p-2.5 bg-gray-50 hover:bg-indigo-600 rounded-xl text-gray-400 hover:text-white transition-all shadow-sm"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="p-2.5 bg-gray-50 hover:bg-red-600 rounded-xl text-gray-400 hover:text-white transition-all shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 mb-6 line-clamp-2 min-h-[2.5rem] leading-relaxed relative z-10">
                                        {(product.description || '').replace(/<[^>]*>/g, '')}
                                    </p>

                                    <div className="flex items-center justify-between mt-auto border-t border-gray-50 pt-4 relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-0.5">Starting From</span>
                                            <span className="text-2xl font-black text-indigo-600">₹{product.priceFrom}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                            <Layout className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="text-xs font-bold text-gray-600">{(product.sizes || []).length} Sizes</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {products.length === 0 && (
                            <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 shadow-inner">
                                <div className="w-24 h-24 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Package className="w-12 h-12 text-gray-300" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">No Products Ready</h3>
                                <p className="text-gray-400 max-w-sm mx-auto">Get started by creating your first product listing and delight your customers.</p>
                                <Button
                                    onClick={() => setShowProductForm(true)}
                                    className="mt-8 bg-indigo-600 hover:bg-indigo-700 py-6 px-10 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100"
                                >
                                    <Plus className="w-6 h-6 mr-2" />
                                    Launch First Product
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="lg:col-span-1">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 sticky top-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                        <Upload className="w-6 h-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900">Upload Base</h2>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Administrator PIN</label>
                                        <input
                                            type="password"
                                            name="pin"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            placeholder="Enter Admin PIN"
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all shadow-inner"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Template Title</label>
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="e.g. Premium Business Card"
                                            className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Design File (SVG)</label>
                                        <div className="relative group/file">
                                            <input
                                                type="file"
                                                name="file"
                                                accept=".svg"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                required
                                            />
                                            <div className="w-full px-4 py-8 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center group-hover/file:border-indigo-500 group-hover/file:bg-indigo-50 transition-all">
                                                <ImageIcon className="w-8 h-8 text-gray-300 group-hover/file:text-indigo-400 mb-2 transition-colors" />
                                                <span className="text-xs font-bold text-gray-500 group-hover/file:text-indigo-600">Choose SVG Design File</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button type="submit" className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Save className="w-6 h-6 mr-2" />}
                                        Store Template
                                    </Button>
                                </form>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="grid sm:grid-cols-2 gap-6">
                                {templates.map((template) => (
                                    <div key={template.id} className="group bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100 hover:shadow-2xl hover:border-indigo-50 duration-500 transition-all relative overflow-hidden flex flex-col">
                                        <div className="aspect-[4/3] bg-gray-50 rounded-2xl mb-4 border border-gray-100 flex items-center justify-center relative overflow-hidden shadow-inner group-hover:bg-white transition-colors duration-500">
                                            <span className="text-3xl font-black text-indigo-100 group-hover:text-indigo-500 transition-colors duration-500">SVG</span>
                                            <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-all duration-500" />
                                        </div>

                                        <div className="flex justify-between items-start">
                                            <div className="overflow-hidden">
                                                <h3 className="font-black text-lg text-gray-900 leading-tight truncate mb-1 pr-4">{template.name}</h3>
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em]">{template.id}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                disabled={isLoading}
                                                className="p-3 bg-gray-50 hover:bg-red-600 rounded-2xl text-gray-300 hover:text-white transition-all shadow-sm shrink-0"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {templates.length === 0 && (
                                    <div className="col-span-2 text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                                        <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-bold tracking-tight">Cloud Storage Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {message && (
                    <div className={`fixed bottom-8 right-8 p-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 z-[100] border-4 ${message.type === 'success'
                            ? 'bg-indigo-600 text-white border-white/20'
                            : 'bg-red-600 text-white border-white/20'
                        }`}>
                        <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                            {message.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-none mb-1">System Notification</p>
                            <span className="font-black text-lg leading-none">{message.text}</span>
                        </div>
                        <button onClick={() => setMessage(null)} className="ml-4 hover:scale-110 transition-transform">
                            <X className="w-5 h-5 opacity-40 hover:opacity-100" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
