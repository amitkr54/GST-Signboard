'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PRODUCT_CATEGORIES } from '@/lib/products';
import { Loader2, ChevronLeft } from 'lucide-react';

export default function NewProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        const product = {
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
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });

            if (response.ok) {
                router.push('/admin/products');
            } else {
                alert('Failed to create product');
            }
        } catch (error) {
            alert('Error creating product');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
            <div className="max-w-3xl mx-auto">
                <Link href="/admin/products" className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold mb-6">
                    <ChevronLeft className="w-5 h-5" />
                    Back to Products
                </Link>

                <div className="bg-white rounded-2xl p-8 shadow-lg">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Product</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold mb-2">Product Name *</label>
                            <input
                                name="name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                                placeholder="e.g., Visiting Cards"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Category *</label>
                            <select
                                name="category"
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
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={3}
                                required
                                placeholder="Brief description of the product"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Starting Price (₹) *</label>
                            <input
                                name="priceFrom"
                                type="number"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                required
                                placeholder="200"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Features (one per line) *</label>
                            <textarea
                                name="features"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                rows={5}
                                required
                                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Materials (comma separated)</label>
                            <input
                                name="materials"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="flex, sunboard, acrylic"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Sizes (JSON) *</label>
                            <textarea
                                name="sizes"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                                rows={8}
                                required
                                defaultValue={JSON.stringify([{
                                    id: 'standard',
                                    name: 'Standard',
                                    dimensions: { width: 24, height: 16, unit: 'in' },
                                    priceMultiplier: 1
                                }], null, 2)}
                            />
                            <p className="text-xs text-gray-500 mt-2">Format: [{'{'}id, name, dimensions, priceMultiplier{'}'}]</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Image URL</label>
                            <input
                                name="image"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                placeholder="/products/image.jpg"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 py-4"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                                Create Product
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
