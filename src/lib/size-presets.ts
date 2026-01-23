export interface SizePreset {
    id: string;
    name: string;
    dimensions: {
        width: number;
        height: number;
        unit: 'in' | 'ft' | 'mm' | 'cm' | 'px';
    };
    ratio?: string;
}

const generateSizes = (ratioW: number, ratioH: number, maxLongestSide: number = 48): SizePreset[] => {
    const sizes: SizePreset[] = [];
    const ratio = ratioW / ratioH;
    const ratioStr = `${ratioW}:${ratioH}`;

    // 1. Generate based on 6" increments in the smallest unit (height)
    for (let h = 12; h <= maxLongestSide; h += 6) {
        const w = Math.round(h * ratio);
        if (w <= maxLongestSide && h <= maxLongestSide) {
            sizes.push({
                id: `${w}x${h}`,
                name: `${w}in × ${h}in`,
                dimensions: { width: w, height: h, unit: 'in' },
                ratio: ratioStr
            });
        }
    }

    // 2. Always add the absolute maximum size where the longest side is exactly 48"
    let maxW, maxH;
    if (ratioW >= ratioH) {
        maxW = maxLongestSide;
        maxH = Math.round(maxLongestSide / ratio);
    } else {
        maxH = maxLongestSide;
        maxW = Math.round(maxLongestSide * ratio);
    }

    const maxId = `${maxW}x${maxH}`;
    if (!sizes.find(s => s.id === maxId)) {
        sizes.push({
            id: maxId,
            name: `${maxW}in × ${maxH}in`,
            dimensions: { width: maxW, height: maxH, unit: 'in' },
            ratio: ratioStr
        });
    }

    return sizes;
};

export const STANDARD_RATIOS = [
    { name: 'Classic (3:2)', w: 3, h: 2 },
    { name: 'Standard (4:3)', w: 4, h: 3 },
    { name: 'Wide (2:1)', w: 2, h: 1 },
    { name: 'Square', w: 1, h: 1 },
];

const BLACKLISTED_SIZES = [
    '27x18', '45x30', '48x32', // 3:2 removals
    '16x12', '32x24', '40x30', // 4:3 removals
    '12x12', '30x30', '42x42'  // 1:1 removals
];

export const ALL_STANDARD_SIZES: SizePreset[] = [
    ...generateSizes(3, 2),
    ...generateSizes(4, 3),
    ...generateSizes(2, 1),
    ...generateSizes(1, 1),
].filter(size => !BLACKLISTED_SIZES.includes(size.id));

// Helper to get formatted sizes for UI components
export const getStandardSizes = () => ALL_STANDARD_SIZES;
