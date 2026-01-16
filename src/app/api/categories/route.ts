import { NextResponse } from 'next/server';
import { getCategories } from '@/app/actions';

export async function GET() {
    const result = await getCategories();
    return NextResponse.json(result);
}
