'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
    CheckCircle, AlertCircle, X, Package, FileText, Filter, Layers, Wrench
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fabric } from 'fabric';
import { Product, ProductSize } from '@/lib/products';
import {
    saveProductAction, deleteProductAction, uploadProductImages,
    uploadTemplate, getTemplates, deleteTemplate as deleteTemplateActionImport,
    getOrders as getOrdersAction, updateOrderStatus as updateOrderStatusAction,
    getCategories, saveCategory, deleteCategory,
    getAppSetting, updateAppSetting,
    getMaterials, saveMaterial, deleteMaterial, type Material,
    getProducts as getProductsAction,
    normalizeAllTemplates, uploadThumbnail, updateTemplateConfig
} from '../actions';

// Import refactored components
import AdminLogin from './components/AdminLogin';
import AdminHeader from './components/AdminHeader';
import OrdersTab from './components/OrdersTab';
import ProductsTab from './components/ProductsTab';
import TemplatesTab from './components/TemplatesTab';
import CategoriesTab from './components/CategoriesTab';
import MaterialsTab from './components/MaterialsTab';
import SettingsTab from './components/SettingsTab';
import CanvasPresetsTab from './components/CanvasPresetsTab';


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
    const [activeTab, setActiveTab] = useState<'templates' | 'products' | 'orders' | 'categories' | 'settings' | 'materials' | 'canvas-presets'>('orders');
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
    const [materials, setMaterials] = useState<Material[]>([]);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [showMaterialForm, setShowMaterialForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [referralEnabled, setReferralEnabled] = useState(true);

    // Canvas Settings State
    const [canvasPresets, setCanvasPresets] = useState<any[]>([]);
    const [customLimits, setCustomLimits] = useState({ minWidth: 1, maxWidth: 100, minHeight: 1, maxHeight: 100 });

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
        try {
            const data = await getProductsAction();
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

    const fetchMaterials = async () => {
        if (!pin) return;
        const res = await getMaterials();
        if (res.success && res.materials) {
            setMaterials(res.materials);
        }
    };

    const handleSaveMaterial = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const materialData = {
            id: editingMaterial?.id || formData.get('id') as string,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            price_per_sqft: parseFloat(formData.get('price_per_sqft') as string),
            slug: (formData.get('name') as string).toLowerCase().replace(/\s+/g, '-'),
            is_active: true
        };

        const res = await saveMaterial(materialData, pin);
        if (res.success) {
            setMessage({ type: 'success', text: editingMaterial ? 'Material updated!' : 'Material created!' });
            fetchMaterials();
            setShowMaterialForm(false);
            setEditingMaterial(null);
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to save material' });
        }
        setIsLoading(false);
    };

    const handleDeleteMaterial = async (id: string) => {
        if (!confirm('Delete this material?')) return;
        setIsLoading(true);
        const res = await deleteMaterial(id, pin);
        if (res.success) {
            setMessage({ type: 'success', text: 'Material deleted!' });
            fetchMaterials();
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to delete material' });
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
                const { fabricJson, thumbnail } = await new Promise<{ fabricJson: string, thumbnail: string }>((resolve) => {
                    fabric.loadSVGFromString(text, (objects, options) => {
                        const tempCanvas = new fabric.Canvas(null, {
                            width: options.width || 1000,
                            height: options.height || 1000
                        });
                        objects.forEach((obj, i) => tempCanvas.add(obj));
                        resolve({
                            fabricJson: JSON.stringify(tempCanvas.toJSON()),
                            thumbnail: tempCanvas.toDataURL({
                                format: 'png',
                                quality: 0.7,
                                multiplier: 0.2
                            })
                        });
                    });
                });

                if (fabricJson) {
                    formData.append('fabricConfig', fabricJson);
                }
                if (thumbnail) {
                    formData.append('thumbnail', thumbnail);
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

    const fetchSettings = async () => {
        const enabled = await getAppSetting('referral_scheme_enabled', true);
        setReferralEnabled(enabled);

        // Fetch Canvas Settings
        const presets = await getAppSetting('canvas_presets', []);
        setCanvasPresets(presets);

        const limits = await getAppSetting('custom_size_limits', { minWidth: 1, maxWidth: 100, minHeight: 1, maxHeight: 100 });
        setCustomLimits(limits);
    };

    useEffect(() => {
        fetchTemplates();
        fetchProducts();
        fetchCategories();
        if (isAuthenticated) {
            fetchOrders();
            fetchSettings();
        }
        if (activeTab === 'materials' && isAuthenticated) {
            fetchMaterials();
        }
        // Initialize with default size on client side to avoid hydration mismatch
        setSizes([{ id: 'standard', name: 'Standard', dimensions: { width: 24, height: 16, unit: 'in' }, priceMultiplier: 1 }]);
    }, [isAuthenticated, pin, activeTab]);

    const handleSaveCanvasSettings = async () => {
        if (!pin) return;
        setIsLoading(true);
        try {
            await updateAppSetting('canvas_presets', canvasPresets, pin);
            await updateAppSetting('custom_size_limits', customLimits, pin);
            setMessage({ type: 'success', text: 'Canvas settings saved successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save canvas settings' });
        }
        setIsLoading(false);
    };

    const addPreset = (preset?: any) => {
        const defaultPreset = { name: 'New Preset', width: 10, height: 10, unit: 'in' };
        setCanvasPresets([...canvasPresets, preset || defaultPreset]);
    };

    const removePreset = (index: number) => {
        setCanvasPresets(canvasPresets.filter((_, i) => i !== index));
    };

    const updatePreset = (index: number, field: string, value: any) => {
        const newPresets = [...canvasPresets];
        newPresets[index] = { ...newPresets[index], [field]: value };
        setCanvasPresets(newPresets);
    };

    const handleToggleReferral = async () => {
        if (!pin) return;
        setIsLoading(true);
        const newValue = !referralEnabled;
        const res = await updateAppSetting('referral_scheme_enabled', newValue, pin);
        if (res.success) {
            setReferralEnabled(newValue);
            setMessage({ type: 'success', text: `Referral scheme ${newValue ? 'enabled' : 'disabled'}` });
        } else {
            setMessage({ type: 'error', text: res.error || 'Failed to update setting' });
        }
        setIsLoading(false);
    };

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

    async function handleNormalizeAll() {
        if (!pin) {
            setMessage({ type: 'error', text: 'Please enter Admin PIN' });
            return;
        }
        if (!confirm('This will normalize ALL templates and GENERATE NEW THUMBNAILS for them. This may take a moment. Continue?')) return;

        setIsLoading(true);
        setMessage({ type: 'success', text: 'Starting bulk normalization & thumbnail generation...' });

        try {
            // 1. Run server-side normalization first (for data consistency)
            const normRes = await normalizeAllTemplates(pin);
            if (!normRes.success) throw new Error(normRes.error);

            // 2. Fetch all templates to iterate over them
            const allTemplates = await getTemplates();
            let processedCount = 0;

            for (const template of allTemplates) {
                if (!template.fabric_config) continue;

                // 3. Generate thumbnail using Fabric (Client-side required)
                const thumbRes = await new Promise<{ success: boolean, url?: string }>((resolve) => {
                    const canvasWidth = template.dimensions?.width || 1000;
                    const canvasHeight = template.dimensions?.height || 1000;

                    const tempCanvas = new fabric.Canvas(null, {
                        width: canvasWidth,
                        height: canvasHeight
                    });

                    tempCanvas.loadFromJSON(template.fabric_config, async () => {
                        const dataUrl = tempCanvas.toDataURL({
                            format: 'png',
                            quality: 0.7,
                            multiplier: 0.2
                        });

                        const uploadRes = await uploadThumbnail(dataUrl, template.id);
                        resolve(uploadRes);
                        tempCanvas.dispose();
                    });
                });

                if (thumbRes.success && thumbRes.url) {
                    // 4. Update template with new thumbnail URL
                    await updateTemplateConfig(template.id, template.fabric_config, pin, thumbRes.url);
                    processedCount++;
                }
            }

            setMessage({ type: 'success', text: `Successfully normalized and thumbnailed ${processedCount} templates!` });
            fetchTemplates();
        } catch (error: any) {
            console.error('Bulk update error:', error);
            setMessage({ type: 'error', text: error.message || 'Bulk update failed' });
        }
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
            <AdminLogin
                loginPin={loginPin}
                setLoginPin={setLoginPin}
                handleLogin={handleLogin}
                message={message}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 font-sans">
            <AdminHeader
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                handleLogout={handleLogout}
            />

            <div className="max-w-7xl mx-auto p-6 text-white min-h-[calc(100vh-80px)]">
                {/* Header Section removed as it's now in AdminHeader */}

                {activeTab === 'orders' && (
                    <OrdersTab
                        orders={orders}
                        expandedOrder={expandedOrder}
                        setExpandedOrder={setExpandedOrder}
                        fetchOrders={fetchOrders}
                        handleUpdateOrderStatus={handleUpdateOrderStatus}
                    />
                )}

                {activeTab === 'products' && (
                    <ProductsTab
                        products={products}
                        selectedProductsForDelete={selectedProductsForDelete}
                        handleBulkDeleteProducts={handleBulkDeleteProducts}
                        setEditingProduct={setEditingProduct}
                        setShowProductForm={setShowProductForm}
                        setSizes={setSizes}
                        selectedImages={selectedImages}
                        setSelectedImages={setSelectedImages}
                        setExistingImages={setExistingImages}
                        showProductForm={showProductForm}
                        editingProduct={editingProduct}
                        handleSaveProduct={handleSaveProduct}
                        categories={categories}
                        handleFormat={handleFormat}
                        sizes={sizes}
                        existingImages={existingImages}
                        isLoading={isLoading}
                        toggleAllProducts={toggleAllProducts}
                        toggleProductSelection={toggleProductSelection}
                        handleDeleteProduct={handleDeleteProduct}
                    />
                )}

                {activeTab === 'templates' && (
                    <TemplatesTab
                        templates={templates}
                        products={products}
                        categories={categories}
                        templateType={templateType}
                        setTemplateType={setTemplateType}
                        selectedProductIds={selectedProductIds}
                        setSelectedProductIds={setSelectedProductIds}
                        templateCategory={templateCategory}
                        setTemplateCategory={setTemplateCategory}
                        handleSubmit={handleSubmit}
                        handleDelete={handleDelete}
                        selectedTemplateIds={selectedTemplateIds}
                        toggleTemplateSelection={toggleTemplateSelection}
                        toggleAllTemplates={toggleAllTemplates}
                        handleBulkDeleteTemplates={handleBulkDeleteTemplates}
                        isLoading={isLoading}
                        pin={pin}
                        handleNormalizeAll={handleNormalizeAll}
                    />
                )}

                {activeTab === 'categories' && (
                    <CategoriesTab
                        categories={categories}
                        showCategoryForm={showCategoryForm}
                        setShowCategoryForm={setShowCategoryForm}
                        editingCategory={editingCategory}
                        setEditingCategory={setEditingCategory}
                        handleSaveCategory={handleSaveCategory}
                        handleDeleteCategory={handleDeleteCategory}
                        isLoading={isLoading}
                    />
                )}

                {activeTab === 'materials' && (
                    <MaterialsTab
                        materials={materials}
                        showMaterialForm={showMaterialForm}
                        setShowMaterialForm={setShowMaterialForm}
                        editingMaterial={editingMaterial}
                        setEditingMaterial={setEditingMaterial}
                        handleSaveMaterial={handleSaveMaterial}
                        handleDeleteMaterial={handleDeleteMaterial}
                        isLoading={isLoading}
                    />
                )}

                {activeTab === 'settings' && (
                    <SettingsTab
                        referralEnabled={referralEnabled}
                        handleToggleReferral={handleToggleReferral}
                        isLoading={isLoading}
                    />
                )}

                {activeTab === 'canvas-presets' && (
                    <CanvasPresetsTab
                        canvasPresets={canvasPresets}
                        addPreset={addPreset}
                        removePreset={removePreset}
                        updatePreset={updatePreset}
                        customLimits={customLimits}
                        setCustomLimits={setCustomLimits}
                        handleSaveCanvasSettings={handleSaveCanvasSettings}
                        isLoading={isLoading}
                    />
                )}

                {message && (
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
                )}
            </div>
        </div>
    );
}
