'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import type { Product, ProductSize } from '@/lib/products';
import { Check, ChevronRight, Home, Wand2, Upload, Star, MapPin, Loader2 } from 'lucide-react';
import { generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { siteConfig } from '@/config/site';
import Head from 'next/head';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = React.use(params);
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
    const [activeImage, setActiveImage] = useState<string>('');

    // Update document meta tags when product loads
    useEffect(() => {
        if (product) {
            // Update meta tags
            document.title = `${product.name} - Custom ${product.category} Signage | SignagePro`;
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', `${product.description.replace(/<[^>]*>/g, '').substring(0, 150)}... Starting from ₹${product.priceFrom}. Design and order online.`);
            }

            // Add Open Graph meta tags
            let ogTitle = document.querySelector('meta[property="og:title"]');
            if (!ogTitle) {
                ogTitle = document.createElement('meta');
                ogTitle.setAttribute('property', 'og:title');
                document.head.appendChild(ogTitle);
            }
            ogTitle.setAttribute('content', `${product.name} | SignagePro`);

            let ogImage = document.querySelector('meta[property="og:image"]');
            if (!ogImage) {
                ogImage = document.createElement('meta');
                ogImage.setAttribute('property', 'og:image');
                document.head.appendChild(ogImage);
            }
            ogImage.setAttribute('content', product.image || `${siteConfig.url}${siteConfig.ogImage}`);
        }
    }, [product]);

    useEffect(() => {
        fetchProduct(id);
    }, [id]);

    async function fetchProduct(productId: string) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) throw new Error('Product not found');
            const data = await response.json();
            setProduct(data.product);
            // Set initial active image from product data
            if (data.product) {
                setActiveImage(data.product.image || data.product.images?.[0] || '');
            }
        } catch (error) {
            console.error('Failed to fetch product:', error);
            setProduct(null);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
                    <Link href="/">
                        <Button>Back to Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const handleBrowseDesigns = () => {
        if (!selectedSize) {
            alert('Please select a size first');
            return;
        }
        router.push(`/design?product=${product.id}&size=${selectedSize.id}&width=${selectedSize.dimensions.width}&height=${selectedSize.dimensions.height}&unit=${selectedSize.dimensions.unit}`);
    };

    const handleUploadDesign = () => {
        if (!selectedSize) {
            alert('Please select a size first');
            return;
        }
        router.push(`/products/${product.id}/upload?size=${selectedSize.id}`);
    };

    // Generate structured data
    const productSchema = product ? generateProductSchema({
        name: product.name,
        description: product.description.replace(/<[^>]*>/g, ''),
        image: product.image,
        priceFrom: product.priceFrom,
        id: product.id,
        rating: product.rating,
        reviewCount: product.reviewCount,
    }) : null;

    const breadcrumbSchema = product ? generateBreadcrumbSchema([
        { name: 'Home', url: siteConfig.url },
        { name: 'Products', url: `${siteConfig.url}/#products` },
        { name: product.name, url: `${siteConfig.url}/products/${product.id}` },
    ]) : null;

    return (
        <>
            <Head>
                {productSchema && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
                    />
                )}
                {breadcrumbSchema && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
                    />
                )}
            </Head>
            <div className="min-h-screen">
                {/* Breadcrumbs */}
                <div className="backdrop-blur-md bg-white/5 border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link href="/" className="text-indigo-200 hover:text-white transition-colors flex items-center gap-1">
                                <Home className="w-4 h-4" />
                                Home
                            </Link>
                            <ChevronRight className="w-4 h-4 text-indigo-300/50" />
                            <Link href="/#products" className="text-indigo-200 hover:text-white transition-colors">
                                Products
                            </Link>
                            <ChevronRight className="w-4 h-4 text-indigo-300/50" />
                            <span className="text-white font-semibold">{product.name}</span>
                        </nav>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid lg:grid-cols-2 gap-12">

                        {/* Left: Product Image Gallery */}
                        <div>
                            <div className="aspect-square bg-slate-900/50 backdrop-blur-xl rounded-3xl mb-4 flex items-center justify-center border border-white/10 shadow-xl relative overflow-hidden group">
                                {/* Gradient orb decoration */}
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

                            {/* Trust Badges */}
                            <div className="flex flex-wrap gap-3">
                                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-400 flex items-center gap-2 backdrop-blur-sm">
                                    <Check className="w-4 h-4" />
                                    Quality Guaranteed
                                </div>
                                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-bold text-blue-400 flex items-center gap-2 backdrop-blur-sm">
                                    <MapPin className="w-4 h-4" />
                                    Fast Delivery
                                </div>
                            </div>
                        </div>

                        {/* Right: Product Info & Actions */}
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">{product.name}</h1>

                            {/* Rating */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-slate-600'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-lg font-bold text-white">{product.rating}</span>
                                <span className="text-sm text-indigo-300">({product.reviewCount} reviews)</span>
                            </div>

                            <div
                                className="text-xl text-indigo-100 mb-8 leading-relaxed prose prose-indigo prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: product.description }}
                            />

                            {/* Features */}
                            <div className="mb-8">
                                <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">Features</h3>
                                <ul className="space-y-3">
                                    {product.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-indigo-200 leading-relaxed font-medium">
                                            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                            </div>
                                            <span dangerouslySetInnerHTML={{ __html: feature }} />
                                        </li>
                                    ))}
                                </ul>
                            </div>

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

                            {/* Price Info */}
                            <div className="mb-8 p-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/10">
                                <div className="flex items-baseline gap-2 mb-2">
                                    <span className="text-sm font-bold text-indigo-300 uppercase">Starting from</span>
                                    <span className="text-3xl font-black text-white">₹{product.priceFrom}</span>
                                </div>
                                <p className="text-sm text-indigo-300">Final price depends on size, material, and quantity</p>
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

                            {!selectedSize && (
                                <p className="text-sm text-amber-600 font-semibold mt-4 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                                    Please select a size to continue
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
