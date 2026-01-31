'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { Product } from '@/lib/products';
import { PRODUCT_CATEGORIES } from '@/lib/products';
import { Plus, Edit, Trash2, Package, Loader2, Check, AlertCircle } from 'lucide-react';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load products' });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete this product?')) return;

        try {
            const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setMessage({ type: 'success', text: 'Product deleted!' });
                fetchProducts();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete product' });
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">Product Management</h1>
                            <p className="text-gray-600">Manage your signage products catalog</p>
                        </div>
                        <Link href="/admin/products/new">
                            <Button className="bg-indigo-600 hover:bg-ind igo-700">
                                <Plus className="w-5 h-5 mr-2" />
                                Add Product
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Back to Admin */}
                <div className="mb-6">
                    <Link href="/admin" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                        ← Back to Admin Dashboard
                    </Link>
                </div>

                {isLoading ? (
                    <div className="text-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600 mb-4" />
                        <p className="text-gray-600">Loading products...</p>
                    </div>
                ) : (
                    <>
                        {/* Products Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(product => (
                                <div key={product.id} className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{product.name}</h3>
                                            <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-600 rounded-full font-semibold">
                                                {product.category}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link href={`/admin/products/${product.id}/edit`}>
                                                <button className="p-2 hover:bg-blue-50 rounded-lg text-blue-600">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-lg font-bold text-indigo-600">₹{product.priceFrom}+</span>
                                        <span className="text-sm text-gray-500">{product.sizes.length} sizes</span>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <Link href={`/products/${product.id}`} target="_blank" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold">
                                            View on site →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {products.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-xl">
                                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 mb-4">No products yet.</p>
                                <Link href="/admin/products/new">
                                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                                        <Plus className="w-5 h-5 mr-2" />
                                        Add Your First Product
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </>
                )}

                {/* Message Toast */}
                {message && (
                    <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                        {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-semibold">{message.text}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
