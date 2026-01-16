'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronRight, ArrowLeft, Upload, Layout, Search, Grid, LayoutGrid } from 'lucide-react';
import { getTemplates } from '@/app/actions';

export default function TemplateSelectionPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { id: productId } = React.use(params);

    // Get URL Params for forwarding
    const sizeId = searchParams.get('size') || '';
    const width = parseFloat(searchParams.get('width') || '0');
    const height = parseFloat(searchParams.get('height') || '0');
    const unit = searchParams.get('unit') || 'in';
    const price = searchParams.get('price') || '';

    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [aspectRatio, setAspectRatio] = useState<number>(0);
    const [productName, setProductName] = useState('');
    const [productCategory, setProductCategory] = useState('');

    useEffect(() => {
        // Calculate aspect ratio from dimensions
        if (width && height) {
            setAspectRatio(width / height);
        }

        // Fetch product name (optional, could be passed or fetched)
        fetchProductInfo();
    }, [productId, width, height]);

    useEffect(() => {
        if (productCategory) {
            loadTemplates();
        }
    }, [productCategory, searchQuery]);

    async function fetchProductInfo() {
        try {
            const res = await fetch(`/api/products/${productId}`);
            const data = await res.json();
            if (data.product) {
                setProductName(data.product.name);
                setProductCategory(data.product.category);
            }
        } catch (e) {
            console.error('Failed to fetch product info', e);
        }
    }

    async function loadTemplates() {
        if (!productCategory) return;
        setIsLoading(true);
        try {
            const ratio = width && height ? width / height : undefined;
            const data = await getTemplates({
                productId: productId,
                // We pass generic category logic if needed, but for now specific product ID + ratio is key
                // Ideally we'd map productId to a category string, but let's rely on backend 'isUniversal' logic 
                // which might need category. For now, let's fetch matching ratio.
                aspectRatio: ratio,
                search: searchQuery,
                category: productCategory
            });
            setTemplates(data || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSelectTemplate = (templateId: string) => {
        // Navigate to editor with template ID and all original params
        router.push(`/design?product=${productId}&size=${sizeId}&width=${width}&height=${height}&unit=${unit}&price=${price}&template=${templateId}`);
    };

    const handleCreateCustom = () => {
        // Navigate to editor directly (blank)
        router.push(`/design?product=${productId}&size=${sizeId}&width=${width}&height=${height}&unit=${unit}&price=${price}`);
    };

    const handleUploadDesign = () => {
        // Navigate to upload page (or handle upload here if preferred, but keeping separate upload flow logic for now)
        router.push(`/products/${productId}/upload?size=${sizeId}`);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans">
            {/* Header */}
            <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/products/${productId}`} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-indigo-300" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Choose a Design</h1>
                            <p className="text-sm text-indigo-300">
                                {productName} • {width}{unit} x {height}{unit}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-12 relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                    <input
                        type="text"
                        placeholder="Search designs (e.g. Modern, Minimal, Food)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-full text-white placeholder-indigo-300/50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                </div>

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Option 1: Create Custom / Upload */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-3xl p-6 text-center hover:scale-[1.02] transition-transform duration-300 cursor-pointer group" onClick={handleCreateCustom}>
                            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                                <Layout className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Create Custom Design</h3>
                            <p className="text-sm text-indigo-200 mb-4">Start with a blank canvas and add text, images, and shapes.</p>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-500">Starts Blank</Button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center hover:bg-white/10 transition-colors cursor-pointer group" onClick={handleUploadDesign}>
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-indigo-300" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Upload Design</h3>
                            <p className="text-sm text-slate-400 mb-4">Already have a design? Upload your PDF, AI, or Image.</p>
                            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">Upload File</Button>
                        </div>
                    </div>

                    {/* Option 2: Templates Grid */}
                    <div className="lg:col-span-3">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Grid className="w-5 h-5 text-indigo-400" />
                                Available Templates
                            </h2>
                            <span className="text-sm text-slate-400">{templates.length} designs found</span>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-[3/2] bg-white/5 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : templates.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {templates.map(template => (
                                    <div
                                        key={template.id}
                                        onClick={() => handleSelectTemplate(template.id)}
                                        className="group bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer hover:-translate-y-1"
                                    >
                                        <div className="aspect-[3/2] relative bg-white/5 p-4 flex items-center justify-center overflow-hidden">
                                            {/* Preview Image (using thumbnail or fallback) */}
                                            {template.thumbnail || template.svgPath ? (
                                                <img src={template.thumbnail || template.svgPath} alt={template.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="text-center">
                                                    <LayoutGrid className="w-12 h-12 text-slate-600 mx-auto mb-2 opacity-50" />
                                                </div>
                                            )}

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <Button className="rounded-full px-6 bg-indigo-600 hover:bg-indigo-500">Customize</Button>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-white truncate">{template.name}</h3>
                                            <p className="text-xs text-indigo-300 mt-1 truncate">{template.category || 'General'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                                <p className="text-slate-400 mb-4">No templates found matching your criteria.</p>
                                <Button variant="outline" onClick={() => setSearchQuery('')}>Clear Filters</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
