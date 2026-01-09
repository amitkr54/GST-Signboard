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
                        "border rounded-lg text-left transition-all bg-slate-800",
                        compact ? "p-3" : "p-4",
                        selectedMaterial === material.id
                            ? "border-indigo-500 bg-indigo-900/30 ring-2 ring-indigo-500/20 shadow-md"
                            : "border-slate-700 hover:border-indigo-500/50 hover:bg-slate-700"
                    )}
                >
                    <div className={cn(
                        "font-semibold text-white",
                        compact ? "text-base" : "text-lg"
                    )}>{material.name}</div>
                    <div className={cn(
                        "text-gray-400",
                        compact ? "text-sm" : "text-base"
                    )}>₹{material.price}</div>
                </button>
            ))}
        </div>
    );
}
