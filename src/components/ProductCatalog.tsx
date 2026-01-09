'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';
import { PRODUCT_CATEGORIES } from '@/lib/products';
import type { Product } from '@/lib/products';
import { Layout, ChevronRight } from 'lucide-react';

export function ProductCatalog() {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const filteredProducts = activeCategory === 'all'
        ? products
        : products.filter(p => p.category === activeCategory);

    if (isLoading) {
        return (
            <section id="products" className="py-20 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="products" className="py-20 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <p className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wider">Our Products</p>
                    <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Browse Signage Products</h2>
                    <p className="text-lg text-gray-600 max-w-3xl">Professional signage solutions for every business need</p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-3 mb-10">
                    {PRODUCT_CATEGORIES.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${activeCategory === category.id
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12">
                    {filteredProducts.slice(0, 6).map((product, index) => (
                        <Link
                            href={`/products/${product.id}`}
                            key={product.id}
                            className="group"
                        >
                            <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 relative animate-in fade-in slide-in-from-bottom-4 duration-700"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Price Badge */}
                                <div className="absolute top-3 left-3 z-10 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xs font-black rounded-full shadow-lg">
                                    BUY 1 @ ₹{product.priceFrom}
                                </div>

                                {/* Product Image */}
                                <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    {product.image && product.image !== '/products/placeholder.jpg' ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 to-gray-50">
                                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-3xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                                                <Layout className="w-10 h-10 text-indigo-600" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>

                                {/* Product Name */}
                                <div className="p-4 text-center">
                                    <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-1">{product.name}</h3>
                                    <div className="flex items-center justify-center gap-1 text-yellow-500 text-xs">
                                        <span>★</span>
                                        <span className="text-gray-600 font-semibold">{product.rating}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All Button */}
                {filteredProducts.length > 6 && (
                    <div className="text-center">
                        <Button
                            variant="outline"
                            className="gap-2 group  border-2 hover:border-indigo-600 hover:text-indigo-600 px-8 py-3"
                        >
                            View All {activeCategory !== 'all' ? PRODUCT_CATEGORIES.find(c => c.id === activeCategory)?.name : 'Products'}
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
