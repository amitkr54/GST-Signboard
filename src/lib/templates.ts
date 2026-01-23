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
    dimensions?: { width: number; height: number; unit?: string };
}


// Templates are now managed in the database
// This array serves as a fallback only if database is unavailable
export const TEMPLATES: Template[] = [];

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

// Template defaults are now stored in the database with each template
// This object is no longer needed
