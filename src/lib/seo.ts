import { Metadata } from 'next';
import { siteConfig } from '@/config/site';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string[];
    image?: string;
    url?: string;
    noIndex?: boolean;
}

/**
 * Generate comprehensive metadata for a page
 */
export function generateSEO({
    title,
    description,
    keywords = [],
    image,
    url,
    noIndex = false,
}: SEOProps): Metadata {
    const pageUrl = url || siteConfig.url;
    const ogImage = image || `${siteConfig.url}${siteConfig.ogImage}`;

    return {
        title,
        description,
        keywords: keywords.join(', '),
        authors: [{ name: siteConfig.name }],
        creator: siteConfig.name,
        publisher: siteConfig.name,
        robots: noIndex
            ? { index: false, follow: false }
            : { index: true, follow: true },
        alternates: {
            canonical: pageUrl,
        },
        openGraph: {
            type: 'website',
            locale: 'en_US',
            url: pageUrl,
            title,
            description,
            siteName: siteConfig.name,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
            creator: '@signagepro',
        },
    };
}

/**
 * Generate SEO metadata for product pages
 */
export function generateProductSEO(product: any) {
    const seo = product.seo || {};

    const title = seo.metaTitle || `${product.name} - Custom ${product.category} Signage | SignagePro`;
    const description = seo.metaDescription || `${product.description?.replace(/<[^>]*>/g, '').substring(0, 150)}... Starting from ₹${product.priceFrom}. Design and order online.`;

    // Combine custom keywords with default ones
    const defaultKeywords = [
        product.name.toLowerCase(),
        `${product.category} signage`,
        'custom signage',
        'business signs',
        'professional signage'
    ];
    const keywords = seo.keywords && seo.keywords.length > 0 ? seo.keywords : defaultKeywords;

    // Use slug if available for the URL
    const urlId = seo.slug || product.id;

    return generateSEO({
        title,
        description,
        keywords,
        image: product.image,
        url: `${siteConfig.url}/products/${urlId}`,
    });
}

/**
 * Generate Organization JSON-LD structured data
 */
export function generateOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        logo: `${siteConfig.url}/logo.png`,
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: siteConfig.contact.phone,
            contactType: 'customer service',
            email: siteConfig.contact.email,
        },
        address: {
            '@type': 'PostalAddress',
            streetAddress: siteConfig.contact.address.street,
            addressLocality: siteConfig.contact.address.city,
            addressRegion: siteConfig.contact.address.state,
            postalCode: siteConfig.contact.address.zip,
            addressCountry: siteConfig.contact.address.country,
        },
        sameAs: [
            siteConfig.links.twitter,
            siteConfig.links.facebook,
            siteConfig.links.linkedin,
            siteConfig.links.instagram,
        ],
    };
}

/**
 * Generate LocalBusiness JSON-LD structured data
 */
export function generateLocalBusinessSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: siteConfig.name,
        description: siteConfig.description,
        url: siteConfig.url,
        telephone: siteConfig.contact.phone,
        email: siteConfig.contact.email,
        priceRange: siteConfig.business.priceRange,
        openingHours: siteConfig.business.openingHours,
        address: {
            '@type': 'PostalAddress',
            streetAddress: siteConfig.contact.address.street,
            addressLocality: siteConfig.contact.address.city,
            addressRegion: siteConfig.contact.address.state,
            postalCode: siteConfig.contact.address.zip,
            addressCountry: siteConfig.contact.address.country,
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '1000',
        },
    };
}

/**
 * Generate Product JSON-LD structured data
 */
export function generateProductSchema(product: {
    name: string;
    description: string;
    image?: string;
    priceFrom: number;
    id: string;
    rating?: number;
    reviewCount?: number;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image || `${siteConfig.url}${siteConfig.ogImage}`,
        sku: product.id,
        brand: {
            '@type': 'Brand',
            name: siteConfig.name,
        },
        offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: product.priceFrom,
            availability: 'https://schema.org/InStock',
            url: `${siteConfig.url}/products/${product.id}`,
        },
        aggregateRating: product.rating
            ? {
                '@type': 'AggregateRating',
                ratingValue: product.rating.toString(),
                reviewCount: (product.reviewCount || 0).toString(),
            }
            : undefined,
    };
}

/**
 * Generate Breadcrumb JSON-LD structured data
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Generate WebApplication JSON-LD structured data for design tool
 */
export function generateWebApplicationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'SignagePro Design Editor',
        description: 'Online design tool for creating custom business signage',
        url: `${siteConfig.url}/design`,
        applicationCategory: 'DesignApplication',
        operatingSystem: 'Web Browser',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'INR',
        },
        browserRequirements: 'Requires JavaScript. Modern web browser recommended.',
    };
}
