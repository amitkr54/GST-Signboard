/**
 * Utility to load local fonts and convert to base64 for jsPDF embedding
 * Fonts are stored in public/fonts/ and loaded via browser cache
 */

// System fonts that should NOT be fetched (they're already available in PDF viewers)
const SYSTEM_FONTS = new Set([
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Times',
    'Courier New',
    'Courier',
    'Verdana',
    'Georgia',
    'Palatino',
    'Garamond',
    'Bookman',
    'Comic Sans MS',
    'Trebuchet MS',
    'Arial Black',
    'Impact',
    'sans-serif',
    'serif',
    'monospace',
    'cursive',
    'fantasy'
]);

// Map font names to local file paths
const LOCAL_FONTS_MAP: Record<string, string> = {
    'Roboto': '/fonts/Roboto.ttf',
    'Open Sans': '/fonts/OpenSans.ttf',
    'Lato': '/fonts/Lato.ttf',
    'Montserrat': '/fonts/Montserrat.ttf',
    'Oswald': '/fonts/Oswald.ttf',
    'Raleway': '/fonts/Raleway.ttf',
    'PT Sans': '/fonts/PTSans.ttf',
    'Merriweather': '/fonts/Merriweather.ttf',
    'Nunito': '/fonts/Nunito.ttf',
    'Playfair Display': '/fonts/PlayfairDisplay.ttf',
    'Poppins': '/fonts/Poppins.ttf',
    'Source Sans Pro': '/fonts/SourceSansPro.ttf',
    'Ubuntu': '/fonts/Ubuntu.ttf',
    'Roboto Slab': '/fonts/RobotoSlab.ttf',
    'Lora': '/fonts/Lora.ttf',
    'Pacifico': '/fonts/Pacifico.ttf',
    'Dancing Script': '/fonts/DancingScript.ttf',
    'Bebas Neue': '/fonts/BebasNeue.ttf',
    'Lobster': '/fonts/Lobster.ttf',
    'Abril Fatface': '/fonts/AbrilFatface.ttf'
};

// Cache for loaded fonts (in-memory, per session)
const fontCache = new Map<string, string>();

async function fetchFontAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Font fetch failed');

        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Remove the data URL prefix (e.g., "data:font/ttf;base64,")
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error fetching font:', error);
        return null;
    }
}

export async function getFontBase64(fontFamily: string): Promise<string | null> {
    // Skip system fonts - they're already available in PDF viewers
    if (SYSTEM_FONTS.has(fontFamily)) {
        return null;
    }

    // Check cache first
    if (fontCache.has(fontFamily)) {
        console.log(`Using cached font: ${fontFamily}`);
        return fontCache.get(fontFamily)!;
    }

    const fontPath = LOCAL_FONTS_MAP[fontFamily];
    if (!fontPath) {
        console.warn(`Font not available: ${fontFamily}`);
        return null;
    }

    console.log(`Loading font: ${fontFamily}`);
    const base64 = await fetchFontAsBase64(fontPath);

    if (base64) {
        // Cache the font for future use
        fontCache.set(fontFamily, base64);
        console.log(`✓ Loaded font: ${fontFamily}`);
    } else {
        console.warn(`✗ Failed to load: ${fontFamily}`);
    }

    return base64;
}
