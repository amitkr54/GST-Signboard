export const siteConfig = {
    name: 'SignagePro',
    description: 'Design and order professional signage for your business. Flex, Acrylic, Steel, and more.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://signagepro.com',
    ogImage: '/og-image.jpg',
    links: {
        twitter: 'https://twitter.com/signagepro',
        facebook: 'https://facebook.com/signagepro',
        linkedin: 'https://linkedin.com/company/signagepro',
        instagram: 'https://instagram.com/signagepro',
    },
    contact: {
        email: 'info@signagepro.com',
        phone: '+1-800-SIGNAGE',
        address: {
            street: '123 Business Ave',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'United States',
        },
    },
    business: {
        type: 'LocalBusiness',
        priceRange: '$$',
        openingHours: 'Mo-Fr 09:00-18:00',
    },
} as const;

export type SiteConfig = typeof siteConfig;
