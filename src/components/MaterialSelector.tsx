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
    const sortedMaterials = [...materials].sort((a, b) => a.price_per_sqft - b.price_per_sqft);

    if (loading) return <div className="text-white/50 text-sm">Loading materials...</div>;
    return (
        <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2",
            compact ? "gap-2" : "gap-4"
        )}>
            {sortedMaterials.map((material) => {
                const price = dimensions
                    ? calculateDynamicPrice(dimensions.width, dimensions.height, dimensions.unit, material.price_per_sqft)
                    : 0; // Or display rate if no dimensions

                return (
                    <button
                        key={material.id}
                        onClick={() => onSelect(material.slug)} // Use slug as ID for compatibility
                        className={cn(
                            "border rounded-xl text-left transition-all bg-slate-900/40 backdrop-blur-sm",
                            compact ? "p-3" : "p-4",
                            selectedMaterial === material.slug
                                ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                                : "border-white/5 hover:border-indigo-500/30 hover:bg-slate-800/40"
                        )}
                    >
                        <div className={cn(
                            "font-black tracking-tight",
                            selectedMaterial === material.slug ? "text-white" : "text-slate-200",
                            compact ? "text-base" : "text-lg"
                        )}>{material.name}</div>
                        <div className={cn(
                            "font-bold",
                            selectedMaterial === material.slug ? "text-indigo-400" : "text-slate-500",
                            compact ? "text-xs" : "text-sm"
                        )}>
                            {price > 0 ? `₹${price}` : `₹${material.price_per_sqft}/sqft`}
                        </div>
                    </button>
                )
            })}
        </div>
    );
}
