import React from 'react';
import { Triangle } from 'lucide-react';

interface LogoProps {
    className?: string;
    iconClassName?: string;
    size?: 'sm' | 'md' | 'lg' | number;
}

export function Logo({ className = '', iconClassName = '', size = 'md' }: LogoProps) {
    const getSize = () => {
        if (typeof size === 'number') return size;
        switch (size) {
            case 'sm': return 24;
            case 'md': return 32;
            case 'lg': return 40;
            default: return 32;
        }
    };

    const pixelSize = getSize();
    const iconSize = Math.round(pixelSize * 0.55);

    return (
        <div
            className={`flex items-center justify-center bg-black rounded-full shrink-0 ${className}`}
            style={{ width: pixelSize, height: pixelSize }}
        >
            <Triangle
                className={`text-white fill-current ${iconClassName}`}
                style={{ width: iconSize, height: iconSize }}
            />
        </div>
    );
}
