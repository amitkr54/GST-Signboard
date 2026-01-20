import { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { PRODUCTS } from '@/lib/products';
import { TEMPLATES } from '@/lib/templates';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = siteConfig.url;

    // Main pages
    const routes = [
        '',
        '/design',
        '/templates',
        '/contact',
        '/dashboard',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Product pages
    const productRoutes = PRODUCTS.map((product) => ({
        url: `${baseUrl}/products/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    // Template pages (direct custom design)
    const templateRoutes = TEMPLATES.map((template) => ({
        url: `${baseUrl}/design?template=${template.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
    }));

    return [...routes, ...productRoutes, ...templateRoutes];
}
