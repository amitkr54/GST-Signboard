import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export type MaterialId = string;

export function toInches(value: number, unit: 'in' | 'cm' | 'mm' | 'ft' | 'px'): number {
    switch (unit) {
        case 'ft': return value * 12;
        case 'in': return value;
        case 'cm': return value / 2.54;
        case 'mm': return value / 25.4;
        case 'px': return value / 96; // Rough approximation: 96px = 1 inch
        default: return value;
    }
}

export function calculateDynamicPrice(
    width: number,
    height: number,
    unit: 'in' | 'cm' | 'mm' | 'ft' | 'px',
    pricePerSqIn: number
): number {
    const wIn = toInches(width, unit);
    const hIn = toInches(height, unit);
    const areaSqIn = wIn * hIn;
    const price = Math.ceil(areaSqIn * pricePerSqIn);

    // Minimum price logic (optional, e.g. min 1 sqft charge ~ 144 sqin)
    // Adjusting min price to reflect potentially lower unit cost but keeping base minimum
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

export function getSimplifiedRatio(width: number, height: number): string {
    if (!width || !height || isNaN(width) || isNaN(height)) return '';

    const gcd = (a: number, b: number): number => {
        return b === 0 ? a : gcd(b, a % b);
    };

    // Scale to integers to handle common decimals (0.5, 0.25 etc)
    const scale = 100;
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);

    if (w === 0 || h === 0) return '';

    const common = gcd(w, h);
    return `${w / common}:${h / common}`;
}

