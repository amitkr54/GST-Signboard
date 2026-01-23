
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const products = await db.getProducts();
        return new Response(JSON.stringify({ products }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to fetch products',
            details: error instanceof Error ? error.message : String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.name || !body.category || !body.priceFrom) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const newProduct = {
            id: randomUUID(),
            ...body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await db.saveProduct(newProduct);

        return new Response(JSON.stringify({ product: newProduct }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: 'Failed to create product' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
