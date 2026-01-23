
import { supabase } from './supabase';
import { Product } from './products';

// Helper to map DB row (snake_case) to Product (camelCase)
function mapRowToProduct(row: any): Product {
    return {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        image: row.image,
        images: row.images || [],
        priceFrom: Number(row.price_from), // Ensure number
        rating: Number(row.rating),
        reviewCount: Number(row.review_count),
        features: row.features || [],
        sizes: row.sizes || [],
        materials: row.materials || [],
        popularTemplates: row.popular_templates || [],
        seo: {
            metaTitle: row.meta_title,
            metaDescription: row.meta_description,
            keywords: row.keywords || [],
            slug: row.slug
        }
    };
}

export const db = {
    async getProducts(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            throw new Error(error.message);
        }

        return (data || []).map(mapRowToProduct);
    },

    async getProduct(idOrSlug: string): Promise<Product | undefined> {
        // 1. Try to fetch by ID first
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', idOrSlug)
                .single();

            if (!error && data) return mapRowToProduct(data);
        } catch (e) {
            // Ignore UUID format errors and fall back to slug
        }

        // 2. Try to fetch by slug as fallback
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('slug', idOrSlug)
                .single();

            if (!error && data) return mapRowToProduct(data);
        } catch (e) {
            // Slug column might not exist or other error
        }

        return undefined;
    },

    async saveProduct(product: Product): Promise<void> {
        // Map Product (camelCase) to DB row (snake_case)
        const row = {
            id: product.id,
            name: product.name,
            category: product.category,
            description: product.description,
            image: product.image,
            images: product.images || [],
            price_from: product.priceFrom,
            rating: product.rating,
            review_count: product.reviewCount,
            features: product.features,
            sizes: product.sizes,
            materials: product.materials,
            popular_templates: product.popularTemplates,
            meta_title: product.seo?.metaTitle,
            meta_description: product.seo?.metaDescription,
            keywords: product.seo?.keywords || [],
            slug: product.seo?.slug,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('products')
            .upsert(row);

        if (error) {
            console.error('Supabase save error:', error);
            throw new Error(error.message);
        }
    },

    async updateProduct(product: Product): Promise<void> {
        return this.saveProduct(product); // Upsert handles update too
    },

    async deleteProduct(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Supabase delete error:', error);
            throw new Error(error.message);
        }
    },

    async getTemplates(options: { category?: string, productId?: string, aspectRatio?: number, search?: string } = {}): Promise<any[]> {
        let query = supabase
            .from('templates')
            .select('*')
            .order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Supabase templates error:', error);
            throw new Error(error.message);
        }

        let templates = (data || []).map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            thumbnailColor: row.thumbnail_color,
            thumbnail: row.thumbnail,
            svgPath: row.svg_path,
            layoutType: row.layout_type,
            isCustom: row.is_custom,
            components: row.components,
            fabricConfig: row.fabric_config,
            defaults: row.defaults,
            category: row.category,
            isUniversal: row.is_universal,
            productIds: row.product_ids || [],
            dimensions: row.dimensions
        }));

        return templates.filter(t => {
            if (options.search) {
                const searchLower = options.search.toLowerCase();
                if (!t.name.toLowerCase().includes(searchLower) &&
                    !t.description?.toLowerCase().includes(searchLower) &&
                    !t.category?.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            // Category filtering
            if (options.category) {
                // Universal templates appear in ALL categories
                if (t.isUniversal) {
                    // Keep it (universal templates show everywhere)
                } else {
                    // Non-universal templates only show in their specific category
                    const templateCategory = (t.category || '').toLowerCase();
                    const filterCategory = options.category.toLowerCase();
                    if (templateCategory !== filterCategory) {
                        return false;
                    }
                }
            }

            // Product-specific filtering
            if (options.productId) {
                if (!t.isUniversal && !t.productIds.includes(options.productId)) {
                    return false;
                }
            }

            if (options.aspectRatio && t.dimensions) {
                const tRatio = t.dimensions.width / t.dimensions.height;
                const diff = Math.abs(tRatio - options.aspectRatio);
                if (diff > 0.15) {
                    return false;
                }
            }

            return true;
        });
    },

    async getTemplate(id: string): Promise<any | undefined> {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined;
            console.error('Supabase getTemplate error:', error);
            throw new Error(error.message);
        }

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            thumbnailColor: data.thumbnail_color,
            thumbnail: data.thumbnail,
            svgPath: data.svg_path,
            layoutType: data.layout_type,
            isCustom: data.is_custom,
            components: data.components,
            fabricConfig: data.fabric_config,
            defaults: data.defaults,
            category: data.category,
            isUniversal: data.is_universal,
            productIds: data.product_ids || [],
            dimensions: data.dimensions
        };
    }
};
