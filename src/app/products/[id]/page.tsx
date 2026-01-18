import React from 'react';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';
import { db } from '@/lib/db';
import { ProductDetailClient } from '@/components/ProductDetailClient';
import { generateProductSEO, generateProductSchema, generateBreadcrumbSchema } from '@/lib/seo';
import { siteConfig } from '@/config/site';
import { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const product = await db.getProduct(id);
    if (!product) return {};

    return generateProductSEO(product);
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await db.getProduct(id);

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
                    <Link href="/">
                        <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg">Back to Home</button>
                    </Link>
                </div>
            </div>
        );
    }

    const productSchema = generateProductSchema({
        name: product.name,
        description: product.description.replace(/<[^>]*>/g, ''),
        image: product.image,
        priceFrom: product.priceFrom,
        id: product.id,
        rating: product.rating,
        reviewCount: product.reviewCount,
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: siteConfig.url },
        { name: 'Products', url: `${siteConfig.url}/#products` },
        { name: product.name, url: `${siteConfig.url}/products/${product.seo?.slug || product.id}` },
    ]);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

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
                    <ProductDetailClient product={product} />
                </div>
            </div>
        </>
    );
}

