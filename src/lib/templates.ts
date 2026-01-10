import { TemplateId } from './types';
import { db } from './db';

export interface Template {
    id: TemplateId;
    name: string;
    description: string;
    thumbnailColor: string; // CSS color for simple preview
    thumbnail?: string; // Path to thumbnail image
    svgPath?: string; // Optional path to SVG template file
    layoutType: 'default' | 'split-left' | 'split-right' | 'centered' | 'banner' | 'centered';
    isCustom?: boolean;
    components?: {
        text?: Array<{
            text: string;
            top: number;
            left: number;
            fontSize?: number;
            lineHeight?: number;
            fontFamily?: string;
            fontWeight?: string | number;
            fontStyle?: string;
            textAlign?: string;
            fill?: string;
            originalViewBox?: number[];
        }>;
        logo?: any;
    };
    fabricConfig?: any;
    // Categorization
    category?: string;
    isUniversal?: boolean;
    productIds?: string[]; // strings or jsonb array
    dimensions?: { width: number; height: number };
}


export const TEMPLATES: Template[] = [
    {
        id: 'svg-sample',
        name: 'Gold Royal Border',
        description: 'Luxury gold border design from SVG',
        thumbnailColor: '#FFD700',
        layoutType: 'centered',
        svgPath: '/templates/fancy-border.svg'
    },
    {
        id: 'modern',
        name: 'Modern Standard',
        description: 'Clean vertical layout with centered logo',
        thumbnailColor: '#ffffff',
        layoutType: 'default'
    },
    {
        id: 'corporate',
        name: 'Corporate Split',
        description: 'Logo on left, details on right',
        thumbnailColor: '#f8f9fa',
        layoutType: 'split-left'
    },
    {
        id: 'bold',
        name: 'Bold Identity',
        description: 'Large logo with minimal text',
        thumbnailColor: '#2d3748',
        layoutType: 'centered'
    },
    {
        id: 'retail',
        name: 'Retail Banner',
        description: 'Horizontal layout optimized for shop boards',
        thumbnailColor: '#fff5f5',
        layoutType: 'banner'
    },
    {
        id: 'classic',
        name: 'Classic Right',
        description: 'Logo on right, classic typography',
        thumbnailColor: '#fffaf0',
        layoutType: 'split-right'
    },
    {
        id: 'professional',
        name: 'Professional Border',
        description: 'Clean design with professional double border',
        thumbnailColor: '#ffffff',
        thumbnail: '/templates/professional.png',
        layoutType: 'default'
    },
    {
        id: 'industrial',
        name: 'Industrial Dark',
        description: 'Dark theme with rivet details',
        thumbnailColor: '#333333',
        thumbnail: '/templates/industrial.png',
        layoutType: 'centered'
    },
    {
        id: 'modern-split',
        name: 'Modern Side',
        description: 'Bold side strip layout',
        thumbnailColor: '#ffffff',
        thumbnail: '/templates/modern-split.png',
        layoutType: 'split-left'
    },
    {
        id: 'boxed',
        name: 'Boxed Frame',
        description: 'Simple framed layout for formal details',
        thumbnailColor: '#ffffff',
        thumbnail: '/templates/boxed.png',
        layoutType: 'default'
    },
    {
        id: 'foundation',
        name: 'Foundation Blue',
        description: 'Solid color background with white text',
        thumbnailColor: '#1e3a8a',
        thumbnail: '/templates/foundation.png',
        layoutType: 'centered'
    }
];

// New dynamic fetcher
export async function getTemplates(): Promise<Template[]> {
    try {
        const templates = await db.getTemplates();
        if (templates.length === 0) {
            console.warn('No templates found in DB, falling back to static list');
            return TEMPLATES;
        }
        return templates;
    } catch (error) {
        console.error('Failed to fetch templates from DB:', error);
        // @ts-ignore
        if (error.message) console.error('Error detail:', error.message);
        return TEMPLATES; // Fallback
    }
}

export const TEMPLATE_DEFAULTS: Record<TemplateId, Partial<{ companyName: string; address: string; additionalText: string[] }>> = {
    // ... keep existing defaults map for now as it maps ID to default text ...
    // BUT checking logic: if DB returns 'defaults' json column, we should use that instead.
    // The UI likely uses this object directly. We should update the UI to use the template object's `defaults` property if available.
    'svg-sample': {
        companyName: 'ROYAL PALACE',
        address: '1 Royal Way, Castle District',
        additionalText: ['EST. 1800']
    },
    'professional': {
        companyName: 'ATHMA',
        address: '#123, Street Name, City, State - 560001',
        additionalText: ['ARCHITECTURE | INTERIORS']
    },
    'industrial': {
        companyName: 'CRAFTBY',
        address: 'Industrial Area, Phase 1',
        additionalText: ['THE ART OF DESIGN']
    },
    'modern-split': {
        companyName: 'VARAPRADA',
        address: '123 Business Park, Tech City, Bangalore - 560100',
        additionalText: ['ENTERPRISES', 'GSTIN: 29ABCDE1234F1Z5']
    },
    'boxed': {
        companyName: 'PWLO',
        address: 'Premium World License Org, Official HQ',
        additionalText: ['EST. 2024']
    },
    'foundation': {
        companyName: 'IMW',
        address: 'Industrial Manufacturing Works, Sector 45',
        additionalText: ['SINCE 1995']
    },
    // Defaults for existing templates to improve UX
    'modern': { companyName: 'YOUR BRAND', address: '123 Main Street, City' },
    'corporate': { companyName: 'CORPORATE INC', address: 'Business District, City' },
    'bold': { companyName: 'BOLD', address: '' },
    'retail': { companyName: 'STORE NAME', address: 'Shop 12, Market Complex' },
    'classic': { companyName: 'Classic Co.', address: 'Est. 1980' },
    'minimal': { companyName: 'MINIMAL', address: '' },
    'luxury': { companyName: 'LUXURY', address: 'Paris • London • New York' },
    'tech': { companyName: 'TECH SYSTEMS', address: 'Innovation Park' }
};
