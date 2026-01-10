import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const MATERIALS = [
    { id: 'flex', name: 'Flex', price: 700 },
    { id: 'vinyl', name: 'Vinyl', price: 800 },
    { id: 'sunboard', name: 'Sun Board', price: 2000 },
    { id: 'acp_non_lit', name: 'ACP Non-Lit', price: 2500 },
    { id: 'acp_lit', name: 'ACP Lit', price: 3500 },
    { id: 'acrylic', name: 'Acrylic Board', price: 3500 },
    { id: 'acrylic_non_lit', name: 'Acrylic Non-Lit', price: 4000 },
    { id: 'acrylic_lit', name: 'Acrylic Lit', price: 5000 },
    { id: 'steel', name: 'Stainless Steel', price: 4500 },
    { id: 'neon', name: 'Neon Sign', price: 6000 },
] as const;

export type MaterialId = typeof MATERIALS[number]['id'];

export function calculatePrice(materialId: string): number {
    const material = MATERIALS.find(m => m.id === materialId);
    return material ? material.price : 0;
}
