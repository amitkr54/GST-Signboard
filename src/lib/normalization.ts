/**
 * Standardized pixel dimensions for common aspect ratios.
 * This ensures all templates of the same ratio are saved at the same resolution.
 */
export const NORMALIZED_SIZES: Record<number, { width: number, height: number }> = {
    1.5: { width: 1800, height: 1200 },    // 3:2 (Landscape)
    0.67: { width: 1200, height: 1800 },   // 2:3 (Portrait)

    1.78: { width: 1600, height: 900 },    // 16:9 (Landscape)
    0.56: { width: 900, height: 1600 },    // 9:16 (Portrait)

    1.33: { width: 1600, height: 1200 },   // 4:3 (Landscape)
    0.75: { width: 1200, height: 1600 },   // 3:4 (Portrait)

    2.0: { width: 1800, height: 900 },     // 2:1 (Landscape)
    0.5: { width: 900, height: 1800 },     // 1:2 (Portrait)

    1.0: { width: 1200, height: 1200 },    // 1:1 (Square)

    3.0: { width: 1800, height: 600 },     // 3:1 (Banner)
    0.33: { width: 600, height: 1800 },    // 1:3 (Vertical Banner)
};

/**
 * Calculates the greatest common divisor
 */
export function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

/**
 * Calculates aspect ratio from dimensions
 */
export function getAspectRatio(width: number, height: number): number {
    if (!height) return 0;
    return Number((width / height).toFixed(2));
}

/**
 * Normalizes a fabric configuration to a standard pixel size based on its aspect ratio.
 * This prevents templates from having arbitrary pixel sizes (e.g., 2400x1600 vs 1800x1200).
 */
export function normalizeFabricConfig(fabricConfig: any, width: number, height: number): any {
    if (!fabricConfig || !fabricConfig.objects) return fabricConfig;

    const ratio = getAspectRatio(width, height);

    // Find closest standard size or default to 1800 width maintaining ratio
    let targetSize = NORMALIZED_SIZES[ratio];

    if (!targetSize) {
        // If non-standard ratio, normalize to width 1800
        targetSize = {
            width: 1800,
            height: Math.round(1800 / (width / height))
        };
    }

    // Clone config to avoid mutating original
    const newConfig = JSON.parse(JSON.stringify(fabricConfig));

    // Detect current size from background or use provided dimensions
    const bgObj = newConfig.objects.find((o: any) => o.name === 'background' || o.isBackground);

    // Use background size if available, otherwise we assume the provided input dimensions 
    // mapped to some density, but ultimately we need the CURRENT pixel size of the objects 
    // to scale them. 
    // IF the canvas was just created/saved, the objects are relative to whatever the canvas size was.
    // If we assume the incoming fabricConfig matches the `width/height` passed in (which should be the 
    // current canvas dimensions at save time), we use that.

    // Use background visual size if available, otherwise use provided pixels
    // We want the CURRENT visual pixel size of the canvas objects to scale them.
    let currentWidth = bgObj ? (bgObj.width * (bgObj.scaleX || 1)) : width;
    let currentHeight = bgObj ? (bgObj.height * (bgObj.scaleY || 1)) : height;

    if (!bgObj) {
        console.warn("No background object found in fabric config during normalization");
        // If we only have inches (width/height passed in), we need to know the SOURCE pixel density.
        // Usually, the canvas size (width/height) passed from updateTemplateConfig is already pixels if normalized.
        // But let's assume if it's small (<100) it's inches, and map it to a base resolution.
        if (currentWidth < 100) {
            // Map 24in -> 1800px approx
            const baseScale = 1800 / currentWidth;
            currentWidth *= baseScale;
            currentHeight *= baseScale;
        }
    }

    const scaleX = targetSize.width / currentWidth;
    const scaleY = targetSize.height / currentHeight;

    console.log(`Normalizing template: Ratio ${ratio}, Source ${currentWidth}x${currentHeight} -> Target ${targetSize.width}x${targetSize.height}`);

    // Scale all objects
    newConfig.objects.forEach((obj: any) => {
        // Heal logic: Identify template rectangles that lost their name and are stretched
        if (!obj.name && obj.type === 'rect' && (obj.fill === '#FEFEFE' || obj.fill === '#ffffff' || (obj.fill && typeof obj.fill === 'string' && obj.fill.toLowerCase() === '#fefefe'))) {
            if (obj.width > 50000) {
                obj.name = 'template_svg_background_object';
                console.log("Healed stretched rectangle: Assigned name 'template_svg_background_object'");
            }
        }

        obj.left = (obj.left || 0) * scaleX;
        obj.top = (obj.top || 0) * scaleY;
        obj.scaleX = (obj.scaleX || 1) * scaleX;
        obj.scaleY = (obj.scaleY || 1) * scaleY;

        // Ensure we reset background scales if they were scaled
        if (obj.name === 'background' || obj.isBackground) {
            obj.width = targetSize.width;
            obj.height = targetSize.height;
            obj.scaleX = 1;
            obj.scaleY = 1;
        }

        // Clamp background-related template objects to prevent stretching (Unify logic)
        const isStretchedRect = obj.type === 'rect' && (obj.width || 0) > 50000;
        const isSeparator = obj.name === 'template_svg_background_object' || (isStretchedRect && (obj.fill === '#FEFEFE' || obj.fill === '#ffffff' || (typeof obj.fill === 'string' && obj.fill.toLowerCase() === '#fefefe')));

        if (isSeparator) {
            const targetSafeWidth = targetSize.width * 0.92; // 92% safe zone
            const currentPixelWidth = (obj.width || 0) * (obj.scaleX || 1);
            const threshold = targetSize.width * 0.01; // 1% precision threshold (User requested)

            if (Math.abs(currentPixelWidth - targetSafeWidth) > threshold) {
                const newScale = targetSafeWidth / (obj.width || 1);
                obj.scaleX = newScale;
                obj.scaleY = newScale;
                // Force name for persistence if it was missing
                if (!obj.name) obj.name = 'template_svg_background_object';
                console.log(`Normalized stretched separator: ${obj.name} to safe scale ${newScale}`);
            }
        }
    });

    return newConfig;
}
