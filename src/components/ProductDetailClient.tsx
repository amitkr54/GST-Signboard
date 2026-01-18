'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import type { Product, ProductSize } from '@/lib/products';
import { Check, Wand2, Upload, ChevronRight } from 'lucide-react';

interface ProductDetailClientProps {
    product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
    const router = useRouter();
    const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
    const [activeImage, setActiveImage] = useState<string>(product.image || product.images?.[0] || '');

    const handleBrowseDesigns = () => {
        if (!selectedSize) {
            alert('Please select a size first');
            return;
        }
        router.push(`/products/${product.id}/templates?size=${selectedSize.id}&width=${selectedSize.dimensions.width}&height=${selectedSize.dimensions.height}&unit=${selectedSize.dimensions.unit}&price=${product.priceFrom}`);
    };

    const handleUploadDesign = () => {
        if (!selectedSize) {
            alert('Please select a size first');
            return;
        }
        router.push(`/products/${product.id}/upload?size=${selectedSize.id}`);
    };

    return (
        <div className="grid lg:grid-cols-2 gap-12">
            {/* Left: Product Image Gallery */}
            <div>
                <div className="aspect-square bg-slate-900/50 backdrop-blur-xl rounded-3xl mb-4 flex items-center justify-center border border-white/10 shadow-xl relative overflow-hidden group">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500" />

                    {activeImage ? (
                        <img
                            src={activeImage}
                            alt={product.name}
                            className="w-full h-full object-contain transition-all duration-300 relative z-10 p-8"
                        />
                    ) : (
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                            <div className="w-48 h-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl backdrop-blur-sm border border-white/10">
                                <div className="text-6xl text-indigo-400 font-black">{product.name.charAt(0)}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Thumbnails Gallery */}
                {product.images && product.images.length > 1 && (
                    <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                        {product.images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImage === img
                                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-md scale-105'
                                    : 'border-white/10 hover:border-white/30'
                                    }`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Right: Product Info & Actions */}
            <div>
                <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">{product.name}</h1>

                <div className="flex items-center gap-3 mb-6 font-bold text-white">
                    <span className="text-lg">Rating: {product.rating}</span>
                    <span className="text-sm text-indigo-300">({product.reviewCount} reviews)</span>
                </div>

                <div
                    className="text-xl text-indigo-100 mb-8 leading-relaxed prose prose-indigo prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                />

                {/* Size Selection */}
                <div className="mb-8">
                    <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">Select Size</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {product.sizes.map(size => (
                            <button
                                key={size.id}
                                onClick={() => setSelectedSize(size)}
                                className={`p-4 border-2 rounded-2xl transition-all duration-300 text-left ${selectedSize?.id === size.id
                                    ? 'border-indigo-500 bg-indigo-500/20 ring-4 ring-indigo-500/20 shadow-lg scale-105'
                                    : 'border-white/10 hover:border-indigo-400 hover:bg-white/5 bg-white/5'
                                    }`}
                            >
                                <div className="font-bold text-white">{size.name}</div>
                                <div className="text-sm text-indigo-300 mt-1">
                                    {size.dimensions.width}{size.dimensions.unit} × {size.dimensions.height}{size.dimensions.unit}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                    <Button
                        onClick={handleBrowseDesigns}
                        disabled={!selectedSize}
                        className="w-full group bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        <Wand2 className="w-5 h-5 mr-2" />
                        Browse Designs & Customize
                        <ChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <Button
                        onClick={handleUploadDesign}
                        disabled={!selectedSize}
                        variant="outline"
                        className="w-full group border-2 border-white/20 hover:border-indigo-500 hover:bg-indigo-900/50 py-5 rounded-2xl font-bold transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed text-white"
                    >
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Your Design
                        <ChevronRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition-transform" />
                    </Button>

                    <WhatsAppButton
                        text="Get Custom Design from Our Team"
                        message={`Hi! I need a custom design for ${product.name}. ${selectedSize ? `Size: ${selectedSize.name}` : ''}`}
                        variant="secondary"
                        className="w-full border-2 border-[#25D366] text-[#128C7E] hover:bg-[#25D366] hover:text-white py-5 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    />
                </div>
            </div>
        </div>
    );
}
