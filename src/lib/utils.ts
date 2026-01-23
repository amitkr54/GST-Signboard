import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export type MaterialId = string;

export function toSqFt(value: number, unit: 'in' | 'cm' | 'mm' | 'ft' | 'px'): number {
    switch (unit) {
        case 'ft': return value;
        case 'in': return value / 12;
        case 'cm': return value / 30.48;
        case 'mm': return value / 304.8;
        case 'px': return value / 96; // Rough approximation: 96px = 1 inch
        default: return value;
    }
}

export function calculateDynamicPrice(
    width: number,
    height: number,
    unit: 'in' | 'cm' | 'mm' | 'ft' | 'px',
    pricePerSqFt: number
): number {
    const wFt = toSqFt(width, unit);
    const hFt = toSqFt(height, unit);
    const areaSqFt = wFt * hFt;
    const price = Math.ceil(areaSqFt * pricePerSqFt);

    // Minimum price logic (optional, e.g. min 1 sqft charge)
    return Math.max(price, 100);
}
export function getNormalizedDimensions(width: number, height: number): { width: number, height: number } {
    const aspect = width / height;

    // Target normalized size (Base 1800px width for landscape, or adjusted for others)
    let viewWidth = 1800;
    let viewHeight = 1200;

    if (aspect >= 1) {
        // Landscape or Square
        viewWidth = 1800;
        viewHeight = 1800 / aspect;
    } else {
        // Portrait
        viewHeight = 1800;
        viewWidth = 1800 * aspect;
    }

    return { width: Math.round(viewWidth), height: Math.round(viewHeight) };
}
