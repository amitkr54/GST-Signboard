import { NextResponse } from 'next/server';
import { getCategories } from '@/app/actions';

export const dynamic = 'force-dynamic';

export async function GET() {
    const result = await getCategories();
    return NextResponse.json(result);
}
