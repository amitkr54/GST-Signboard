import React from 'react';
import { MATERIALS, MaterialId } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MaterialSelectorProps {
    selectedMaterial: MaterialId;
    onSelect: (id: MaterialId) => void;
    compact?: boolean;
}

export function MaterialSelector({ selectedMaterial, onSelect, compact = false }: MaterialSelectorProps) {
    return (
        <div className={cn(
            "grid grid-cols-1 sm:grid-cols-2",
            compact ? "gap-2" : "gap-4"
        )}>
            {MATERIALS.map((material) => (
                <button
                    key={material.id}
                    onClick={() => onSelect(material.id)}
                    className={cn(
                        "border rounded-lg text-left transition-all bg-white",
                        compact ? "p-3" : "p-4",
                        selectedMaterial === material.id
                            ? "border-purple-600 bg-purple-50 ring-2 ring-purple-200 shadow-md"
                            : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                    )}
                >
                    <div className={cn(
                        "font-semibold text-gray-900",
                        compact ? "text-base" : "text-lg"
                    )}>{material.name}</div>
                    <div className={cn(
                        "text-gray-600",
                        compact ? "text-sm" : "text-base"
                    )}>₹{material.price}</div>
                </button>
            ))}
        </div>
    );
}
