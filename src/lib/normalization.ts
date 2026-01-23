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

    // However, usually we can rely on the background object for the "source" dimensions
    let currentWidth = bgObj ? bgObj.width : width;
    let currentHeight = bgObj ? bgObj.height : height;

    if (!bgObj) {
        // If no background, we might be normalizing a config that doesn't have explicit bounds.
        // In that case, we can try to infer from objects or just use the target directly if we can't scale.
        // But usually there is a background.
        console.warn("No background object found in fabric config during normalization");
    }

    const scaleX = targetSize.width / currentWidth;
    const scaleY = targetSize.height / currentHeight;

    console.log(`Normalizing template: Ratio ${ratio}, Source ${currentWidth}x${currentHeight} -> Target ${targetSize.width}x${targetSize.height}`);

    // Scale all objects
    newConfig.objects.forEach((obj: any) => {
        obj.left = (obj.left || 0) * scaleX;
        obj.top = (obj.top || 0) * scaleY;
        obj.scaleX = (obj.scaleX || 1) * scaleX;
        obj.scaleY = (obj.scaleY || 1) * scaleY;

        // Some objects might store width/height directly (like images/rects)
        // Fabric objects generally scale via scaleX/scaleY, but if specific width/height needed:
        if (obj.width && obj.type === 'b-rect') {
            // custom types might behave differently, but standard fabric uses scale
        }
    });

    // Update background object dimensions if it exists (it's also scaled above, but for bg we often want exact bounds)
    if (bgObj) {
        // Validating the background is exactly the target size
        // If we scaled via scaleX/scaleY it should be correct.
        // Sometimes valid to reset scale and set new width/height for background
        // bgObj.width = targetSize.width;
        // bgObj.height = targetSize.height;
        // bgObj.scaleX = 1;
        // bgObj.scaleY = 1;
        // But let's stick to uniform scaling for now to be safe with images
    }

    return newConfig;
}
