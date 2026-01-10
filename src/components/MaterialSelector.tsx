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
                        "border rounded-xl text-left transition-all bg-slate-900/40 backdrop-blur-sm",
                        compact ? "p-3" : "p-4",
                        selectedMaterial === material.id
                            ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                            : "border-white/5 hover:border-indigo-500/30 hover:bg-slate-800/40"
                    )}
                >
                    <div className={cn(
                        "font-black tracking-tight",
                        selectedMaterial === material.id ? "text-white" : "text-slate-200",
                        compact ? "text-base" : "text-lg"
                    )}>{material.name}</div>
                    <div className={cn(
                        "font-bold",
                        selectedMaterial === material.id ? "text-indigo-400" : "text-slate-500",
                        compact ? "text-xs" : "text-sm"
                    )}>₹{material.price}</div>
                </button>
            ))}
        </div>
    );
}
