import React from 'react';
import { MaterialId, calculateDynamicPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useMaterials } from '@/context/MaterialContext';

interface MaterialSelectorProps {
    selectedMaterial: MaterialId;
    onSelect: (id: MaterialId) => void;
    compact?: boolean;
    dimensions?: { width: number; height: number; unit: any };
}

export function MaterialSelector({ selectedMaterial, onSelect, compact = false, dimensions }: MaterialSelectorProps) {
    const { materials, loading } = useMaterials();

    // Sort materials by price (cheapest first)
    // We need a reference price to sort, lets use 1 sqft price or the actual calculated price
    const sortedMaterials = [...materials].sort((a, b) => a.price_per_sqin - b.price_per_sqin);

    if (loading) return <div className="text-white/50 text-sm">Loading materials...</div>;
    return (
        <div className="space-y-2 flex flex-col">
            {sortedMaterials.map((material) => {
                const price = dimensions
                    ? calculateDynamicPrice(dimensions.width, dimensions.height, dimensions.unit, material.price_per_sqin)
                    : 0;

                return (
                    <button
                        key={material.id}
                        onClick={() => onSelect(material.slug)}
                        className={cn(
                            "w-full flex items-center justify-between transition-all border rounded-xl px-4 py-3",
                            selectedMaterial === material.slug
                                ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500"
                                : "border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10"
                        )}
                    >
                        <span className={cn(
                            "font-bold text-sm tracking-tight",
                            selectedMaterial === material.slug ? "text-white" : "text-white/70"
                        )}>{material.name}</span>

                        <span className={cn(
                            "font-black text-sm",
                            selectedMaterial === material.slug ? "text-indigo-400" : "text-white/40"
                        )}>
                            {price > 0 ? `₹${price}` : `₹${material.price_per_sqin}/sqin`}
                        </span>
                    </button>
                )
            })}
        </div>
    );
}
