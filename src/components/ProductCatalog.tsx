'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';
import type { Product } from '@/lib/products';
import { Layout, ChevronRight } from 'lucide-react';

export function ProductCatalog() {
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<any[]>([{ id: 'all', name: 'All Products' }]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
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

    async function fetchCategories() {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            if (data.success && data.categories) {
                setCategories([{ id: 'all', name: 'All Products' }, ...data.categories]);
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
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
        <section id="products" className="py-20 relative">
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-12">
                    <p className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">Our Products</p>
                    <h2 className="text-4xl lg:text-5xl font-black text-white mb-4">Browse Signage Products</h2>
                    <p className="text-lg text-indigo-100 max-w-3xl">Professional signage solutions for every business need</p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-3 mb-10">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setActiveCategory(category.id)}
                            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${activeCategory === category.id
                                ? 'bg-white text-indigo-900 shadow-lg shadow-white/20 scale-105'
                                : 'bg-white/10 text-indigo-100 hover:bg-white/20'
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {filteredProducts.slice(0, 8).map((product, index) => (
                        <Link
                            href={`/products/${product.id}`}
                            key={product.id}
                            className="group flex flex-col bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                        >
                            {/* Product Title (Above Image) */}
                            <div className="p-6 pb-4">
                                <h3 className="font-bold text-2xl leading-tight mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300" style={{ fontFamily: '"Playfair Display", serif' }}>
                                    {product.name}
                                </h3>
                                <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest opacity-80 bg-indigo-500/10 inline-block px-2 py-1 rounded-md font-sans">
                                    {product.category}
                                </p>
                            </div>

                            {/* Image Container */}
                            <div className="px-2">
                                <div className="aspect-[4/3] rounded-lg overflow-hidden relative bg-black/20">
                                    {product.image && product.image !== '/products/placeholder.jpg' ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                                            <Layout className="w-16 h-16 text-indigo-400/50" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Area: Price & CTA */}
                            <div className="p-6 mt-auto flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Starting at</span>
                                    <span className="text-2xl font-black text-white">₹{product.priceFrom}</span>
                                </div>
                                <div className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-500/25 group-hover:scale-105">
                                    <div className="flex items-center gap-2 font-bold text-sm px-2">
                                        Customize <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* View All Button */}
                {filteredProducts.length > 8 && (
                    <div className="text-center">
                        <Button
                            variant="outline"
                            className="gap-2 group border-2 border-white/10 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-white px-8 py-3 rounded-full text-indigo-200"
                        >
                            View All {activeCategory !== 'all' ? categories.find(c => c.id === activeCategory)?.name : 'Products'}
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
