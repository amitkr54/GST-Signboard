import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const MATERIALS = [
    { id: 'flex', name: 'Flex', price: 700 },
    { id: 'sunboard', name: 'Sun Board', price: 2000 },
    { id: 'acrylic', name: 'Acrylic Board', price: 3500 },
    { id: 'steel', name: 'Stainless Steel', price: 4500 },
] as const;

export type MaterialId = typeof MATERIALS[number]['id'];

export function calculatePrice(materialId: string): number {
    const material = MATERIALS.find(m => m.id === materialId);
    return material ? material.price : 0;
}
