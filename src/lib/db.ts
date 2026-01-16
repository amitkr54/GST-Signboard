
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
        popularTemplates: row.popular_templates || []
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

    async getProduct(id: string): Promise<Product | undefined> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return undefined; // Not found code
            console.error('Supabase error:', error);
            throw new Error(error.message);
        }

        return mapRowToProduct(data);
    },

    async saveProduct(product: Product): Promise<void> {
        // Map Product (camelCase) to DB row (snake_case)
        const row = {
            id: product.id, // Explicit ID usage if provided, or let DB generate? 
            // Current logical flow generates UUID in API route, so we use it.
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
            .select('*');

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
            // New Fields
            category: row.category,
            isUniversal: row.is_universal,
            productIds: row.product_ids || [],
            dimensions: row.dimensions
        }));

        // Filter in memory since some logic (aspect ratio) is complex for simplified SQL
        return templates.filter(t => {
            // 1. Search Filter
            if (options.search) {
                const searchLower = options.search.toLowerCase();
                if (!t.name.toLowerCase().includes(searchLower) &&
                    !t.description?.toLowerCase().includes(searchLower) &&
                    !t.category?.toLowerCase().includes(searchLower)) {
                    return false;
                }
            }

            // 2. Category/Product Eligibility Filter
            if (options.category || options.productId) {
                // If it's a "Specific" template, it MUST display if the product ID matches, regardless of category
                if (!t.isUniversal) {
                    if (options.productId && t.productIds.includes(options.productId)) {
                        // Keep it (match specific product)
                    } else {
                        return false; // Skip if specific but product doesn't match
                    }
                } else {
                    // It's Universal
                    // We formerly filtered by category here, but "Universal" should often mean it works for ANY product of that size.
                    // If we STRICTLY match category, a "Business" card template won't show on a "Signage" product even if sizes match.
                    // Let's relax this: Only filter if specific category requested via Search, OR if we decide to enforce categories later.
                    // For now, allow Universal to show on ALL products if size matches.
                    // if (options.category && t.category !== options.category) { return false; } 
                }
            }

            // 3. Aspect Ratio Filter (Tolerance +/- 0.1)
            if (options.aspectRatio && t.dimensions) {
                const tRatio = t.dimensions.width / t.dimensions.height;
                const diff = Math.abs(tRatio - options.aspectRatio);
                if (diff > 0.15) { // Slightly loose tolerance
                    return false;
                }
            }

            return true;
        });
    }
};
