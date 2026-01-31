'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PRODUCT_CATEGORIES } from '@/lib/products';
import { Loader2, ChevronLeft } from 'lucide-react';
import type { Product } from '@/lib/products';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = React.use(params);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [product, setProduct] = useState<Product | null>(null);

    useEffect(() => {
        fetchProduct(id);
    }, [id]);

    async function fetchProduct(productId: string) {
        try {
            const response = await fetch(`/api/products/${productId}`);
            if (!response.ok) throw new Error('Product not found');
            const data = await response.json();
            setProduct(data.product);
        } catch (error) {
            alert('Failed to load product');
            router.push('/admin/products');
        } finally {
            setIsFetching(false);
        }
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        const updatedProduct = {
            name: formData.get('name'),
            category: formData.get('category'),
            description: formData.get('description'),
            priceFrom: parseInt(formData.get('priceFrom') as string),
            features: (formData.get('features') as string).split('\n').filter(f => f.trim()),
            materials: (formData.get('materials') as string).split(',').map(m => m.trim()),
            sizes: JSON.parse(formData.get('sizes') as string),
            image: formData.get('image') || '/products/placeholder.jpg'
        };

        try {
            const response = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct)
            });

            if (response.ok) {
                router.push('/admin/products');
            } else {
                alert('Failed to update product');
            }
        } catch (error) {
            alert('Error updating product');
        } finally {
            setIsLoading(false);
        }
    }

    if (isFetching) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/admin/products" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold mb-6">
                    <ChevronLeft className="w-5 h-5" />
                    Back to Products
                </Link>

                <div className="bg-white rounded-2xl p-8 shadow-lg">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Product</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold mb-2">Product Name *</label>
                            <input
                                name="name"
                                defaultValue={product.name}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Category *</label>
                            <select
                                name="category"
                                defaultValue={product.category}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            >
                                {PRODUCT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Description *</label>
                            <textarea
                                name="description"
                                defaultValue={product.description}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={3}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Starting Price (₹) *</label>
                            <input
                                name="priceFrom"
                                type="number"
                                defaultValue={product.priceFrom}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Features (one per line) *</label>
                            <textarea
                                name="features"
                                defaultValue={product.features.join('\n')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={5}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Materials (comma separated)</label>
                            <input
                                name="materials"
                                defaultValue={product.materials.join(', ')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Sizes (JSON) *</label>
                            <textarea
                                name="sizes"
                                defaultValue={JSON.stringify(product.sizes, null, 2)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                rows={8}
                                required
                            />
                            <p className="text-xs text-gray-500 mt-2">Format: [{'{'}id, name, dimensions, priceMultiplier{'}'}]</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Image URL</label>
                            <input
                                name="image"
                                defaultValue={product.image}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-4"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                                Save Changes
                            </Button>
                            <Link href="/admin/products" className="flex-1">
                                <Button type="button" variant="outline" className="w-full py-4">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
