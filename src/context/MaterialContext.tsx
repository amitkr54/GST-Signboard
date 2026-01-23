'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Material, getMaterials } from '@/app/actions';

interface MaterialContextType {
    materials: Material[];
    loading: boolean;
    error: string | null;
    refreshMaterials: () => Promise<void>;
    getMaterial: (id: string) => Material | undefined;
}

const MaterialContext = createContext<MaterialContextType | undefined>(undefined);

export function MaterialProvider({ children }: { children: React.ReactNode }) {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMaterials = async () => {
        setLoading(true);
        const res = await getMaterials();
        if (res.success && res.materials) {
            setMaterials(res.materials);
            setError(null);
        } else {
            setError(res.error || 'Failed to load materials');
            // Fallback to empty or legacy if needed, but for now just show error state
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const getMaterial = (id: string) => materials.find(m => m.id === id || m.slug === id);

    return (
        <MaterialContext.Provider value={{
            materials,
            loading,
            error,
            refreshMaterials: fetchMaterials,
            getMaterial
        }}>
            {children}
        </MaterialContext.Provider>
    );
}

export function useMaterials() {
    const context = useContext(MaterialContext);
    if (context === undefined) {
        throw new Error('useMaterials must be used within a MaterialProvider');
    }
    return context;
}
