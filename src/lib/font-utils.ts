/**
 * Utility to load fonts with error handling for jsPDF
 * Falls back gracefully if a font can't be embedded
 */

// System fonts that should NOT be fetched (only generic fallbacks)
const SYSTEM_FONTS = new Set<string>([
    'Helvetica', 'Times', 'Courier',
    'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'
]);

// Fonts that jsPDF's internal parser can't handle
// These fonts load fine but cause errors during PDF generation
const JSPDF_INCOMPATIBLE_FONTS = new Set<string>([
    // Previously: 'Dancing Script', 'Oswald', 'Bebas Neue', 'Lobster', 'Abril Fatface'
    // testing if fixed files work now
]);

//Map font names to local file paths
const LOCAL_FONTS_MAP: Record<string, string> = {
    'Roboto': '/fonts/Roboto.ttf',
    'Roboto-Bold': '/fonts/Roboto-Bold.ttf',
    'Roboto-Italic': '/fonts/Roboto-Italic.ttf',
    'Roboto-BoldItalic': '/fonts/Roboto-BoldItalic.ttf',
    'Open Sans': '/fonts/OpenSans.ttf',
    'Open Sans-Bold': '/fonts/OpenSans-Bold.ttf',
    'Open Sans-Italic': '/fonts/OpenSans-Italic.ttf',
    'Open Sans-BoldItalic': '/fonts/OpenSans-BoldItalic.ttf',
    'Lato': '/fonts/Lato.ttf',
    'Lato-Bold': '/fonts/Lato-Bold.ttf',
    'Lato-Italic': '/fonts/Lato-Italic.ttf',
    'Lato-BoldItalic': '/fonts/Lato-BoldItalic.ttf',
    'Montserrat': '/fonts/Montserrat.ttf',
    'Montserrat-Bold': '/fonts/Montserrat-Bold.ttf',
    'Montserrat-Italic': '/fonts/Montserrat-Italic.ttf',
    'Montserrat-BoldItalic': '/fonts/Montserrat-BoldItalic.ttf',
    'Oswald': '/fonts/Oswald.ttf',
    'Oswald-Bold': '/fonts/Oswald-Bold.ttf',
    'Raleway': '/fonts/Raleway.ttf',
    'Raleway-Bold': '/fonts/Raleway-Bold.ttf',
    'Raleway-Italic': '/fonts/Raleway-Italic.ttf',
    'Raleway-BoldItalic': '/fonts/Raleway-BoldItalic.ttf',
    'PT Sans': '/fonts/PTSans.ttf',
    'PT Sans-Bold': '/fonts/PTSans-Bold.ttf',
    'PT Sans-Italic': '/fonts/PTSans-Italic.ttf',
    'PT Sans-BoldItalic': '/fonts/PTSans-BoldItalic.ttf',
    'Merriweather': '/fonts/Merriweather.ttf',
    'Merriweather-Bold': '/fonts/Merriweather-Bold.ttf',
    'Merriweather-Italic': '/fonts/Merriweather-Italic.ttf',
    'Nunito': '/fonts/Nunito.ttf',
    'Nunito-Bold': '/fonts/Nunito-Bold.ttf',
    'Nunito-Italic': '/fonts/Nunito-Italic.ttf',
    'Nunito-BoldItalic': '/fonts/Nunito-BoldItalic.ttf',
    'Playfair Display': '/fonts/PlayfairDisplay.ttf',
    'Playfair Display-Bold': '/fonts/PlayfairDisplay-Bold.ttf',
    'Playfair Display-Italic': '/fonts/PlayfairDisplay-Italic.ttf',
    'Playfair Display-BoldItalic': '/fonts/PlayfairDisplay-BoldItalic.ttf',
    'Poppins': '/fonts/Poppins.ttf',
    'Poppins-Bold': '/fonts/Poppins-Bold.ttf',
    'Poppins-Italic': '/fonts/Poppins-Italic.ttf',
    'Poppins-BoldItalic': '/fonts/Poppins-BoldItalic.ttf',
    'Source Sans Pro': '/fonts/SourceSansPro.ttf',
    'Source Sans Pro-Bold': '/fonts/SourceSansPro-Bold.ttf',
    'Source Sans Pro-Italic': '/fonts/SourceSansPro-Italic.ttf',
    'Source Sans Pro-BoldItalic': '/fonts/SourceSansPro-BoldItalic.ttf',
    'Ubuntu': '/fonts/Ubuntu.ttf',
    'Ubuntu-Bold': '/fonts/Ubuntu-Bold.ttf',
    'Ubuntu-Italic': '/fonts/Ubuntu-Italic.ttf',
    'Roboto Slab': '/fonts/RobotoSlab.ttf',
    'Roboto Slab-Bold': '/fonts/RobotoSlab-Bold.ttf',
    'Lora': '/fonts/Lora.ttf',
    'Lora-Bold': '/fonts/Lora-Bold.ttf',
    'Lora-Italic': '/fonts/Lora-Italic.ttf',
    'Lora-BoldItalic': '/fonts/Lora-BoldItalic.ttf',
    'Pacifico': '/fonts/Pacifico.ttf',
    'Dancing Script': '/fonts/DancingScript.ttf',
    'Dancing Script-Bold': '/fonts/DancingScript-Bold.ttf',
    'Bebas Neue': '/fonts/BebasNeue.ttf',
    'Lobster': '/fonts/Lobster.ttf',
    'Abril Fatface': '/fonts/AbrilFatface.ttf',

    // Windows Default Fonts (New)
    'Arial': '/fonts/Arial.ttf',
    'Arial-Bold': '/fonts/Arial-Bold.ttf',
    'Arial-Italic': '/fonts/Arial-Italic.ttf',
    'Arial-BoldItalic': '/fonts/Arial-BoldItalic.ttf',
    'Times New Roman': '/fonts/TimesNewRoman.ttf',
    'Times New Roman-Bold': '/fonts/TimesNewRoman-Bold.ttf',
    'Times New Roman-Italic': '/fonts/TimesNewRoman-Italic.ttf',
    'Times New Roman-BoldItalic': '/fonts/TimesNewRoman-BoldItalic.ttf',
    'Courier New': '/fonts/CourierNew.ttf',
    'Courier New-Bold': '/fonts/CourierNew-Bold.ttf',
    'Courier New-Italic': '/fonts/CourierNew-Italic.ttf',
    'Courier New-BoldItalic': '/fonts/CourierNew-BoldItalic.ttf',
    'Georgia': '/fonts/Georgia.ttf',
    'Georgia-Bold': '/fonts/Georgia-Bold.ttf',
    'Georgia-Italic': '/fonts/Georgia-Italic.ttf',
    'Georgia-BoldItalic': '/fonts/Georgia-BoldItalic.ttf',
    'Verdana': '/fonts/Verdana.ttf',
    'Verdana-Bold': '/fonts/Verdana-Bold.ttf',
    'Verdana-Italic': '/fonts/Verdana-Italic.ttf',
    'Verdana-BoldItalic': '/fonts/Verdana-BoldItalic.ttf',
    'Comic Sans MS': '/fonts/ComicSansMS.ttf',
    'Comic Sans MS-Bold': '/fonts/ComicSansMS-Bold.ttf',
    'Comic Sans MS-Italic': '/fonts/ComicSansMS-Italic.ttf',
    'Comic Sans MS-BoldItalic': '/fonts/ComicSansMS-BoldItalic.ttf',
    'Impact': '/fonts/Impact.ttf'
};

export interface FontVariantSupport {
    bold: boolean;
    italic: boolean;
    boldItalic: boolean;
}

export const FONT_VARIANTS_METADATA: Record<string, FontVariantSupport> = {
    'Arial': { bold: true, italic: true, boldItalic: true },
    'Roboto': { bold: true, italic: true, boldItalic: true },
    'Open Sans': { bold: true, italic: true, boldItalic: true },
    'Lato': { bold: true, italic: true, boldItalic: true },
    'Montserrat': { bold: true, italic: true, boldItalic: true },
    'Oswald': { bold: true, italic: false, boldItalic: false }, // Only Bold
    'Raleway': { bold: true, italic: true, boldItalic: true },
    'PT Sans': { bold: true, italic: true, boldItalic: true },
    'Merriweather': { bold: true, italic: true, boldItalic: false },
    'Nunito': { bold: true, italic: true, boldItalic: true },
    'Playfair Display': { bold: true, italic: true, boldItalic: true },
    'Poppins': { bold: true, italic: true, boldItalic: true },
    'Source Sans Pro': { bold: true, italic: true, boldItalic: true },
    'Ubuntu': { bold: true, italic: true, boldItalic: false },
    'Roboto Slab': { bold: true, italic: false, boldItalic: false },
    'Lora': { bold: true, italic: true, boldItalic: true },
    'Pacifico': { bold: false, italic: false, boldItalic: false },
    'Dancing Script': { bold: true, italic: false, boldItalic: false },
    'Bebas Neue': { bold: false, italic: false, boldItalic: false },
    'Lobster': { bold: false, italic: false, boldItalic: false },
    'Abril Fatface': { bold: false, italic: false, boldItalic: false },
    'Times New Roman': { bold: true, italic: true, boldItalic: true },
    'Courier New': { bold: true, italic: true, boldItalic: true },
    'Georgia': { bold: true, italic: true, boldItalic: true },
    'Verdana': { bold: true, italic: true, boldItalic: true },
    'Comic Sans MS': { bold: true, italic: true, boldItalic: true },
    'Impact': { bold: false, italic: false, boldItalic: false }
};

// Cache for loaded fonts (in-memory, per session)
const fontCache = new Map<string, string>();
const failedFonts = new Set<string>();

async function fetchFontAsBase64(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Font fetch failed');

        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const base64Data = base64.split(',')[1];
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        return null;
    }
}

export async function getFontBase64(fontFamily: string): Promise<string | null> {
    // Strip quotes from font family name
    fontFamily = fontFamily.replace(/['"]/g, '').trim();

    // Skip system fonts
    if (SYSTEM_FONTS.has(fontFamily)) {
        return null;
    }

    // Skip fonts incompatible with jsPDF's parser
    if (JSPDF_INCOMPATIBLE_FONTS.has(fontFamily)) {
        console.log(`⊘ Skipping ${fontFamily} (jsPDF incompatible)`);
        return null;
    }

    // Skip fonts that have previously failed
    if (failedFonts.has(fontFamily)) {
        return null;
    }

    // Check cache first
    if (fontCache.has(fontFamily)) {
        return fontCache.get(fontFamily)!;
    }

    const fontPath = LOCAL_FONTS_MAP[fontFamily];
    if (!fontPath) {
        return null;
    }

    const base64 = await fetchFontAsBase64(fontPath);

    if (base64) {
        fontCache.set(fontFamily, base64);
        console.log(`✓ Loaded: ${fontFamily}`);
    } else {
        failedFonts.add(fontFamily);
        console.warn(`✗ Could not load: ${fontFamily}`);
    }

    return base64;
}
