/**
 * Utility to fetch Google Fonts and convert to base64 for jsPDF embedding
 */

const FONT_MAP: Record<string, string> = {
    'Roboto': 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.ttf',
    'Open Sans': 'https://fonts.gstatic.com/s/opensans/v34/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-muw.ttf',
    'Lato': 'https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wWw.ttf',
    'Montserrat': 'https://fonts.gstatic.com/s/montserrat/v25/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXo.ttf',
    'Oswald': 'https://fonts.gstatic.com/s/oswald/v49/TK3iWkUHHAIjg752GT8G.ttf',
    'Raleway': 'https://fonts.gstatic.com/s/raleway/v28/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrQ.ttf',
    'PT Sans': 'https://fonts.gstatic.com/s/ptsans/v17/jvX72_2_K9ChAtAdCb7V.ttf',
    'Merriweather': 'https://fonts.gstatic.com/s/merriweather/v30/u-440qyLdR-Mqp3V4n3hm86TkdqZ.ttf',
    'Nunito': 'https://fonts.gstatic.com/s/nunito/v25/6xK3dSByY69p1u3dUdc.ttf',
    'Playfair Display': 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD7K8E30Bb8mxpbg67X62EeLu.ttf',
    'Poppins': 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrJJfecg.ttf',
    'Source Sans Pro': 'https://fonts.gstatic.com/s/sourcesanspro/v22/6xK3dSByY69p1u3dUdc.ttf',
    'Ubuntu': 'https://fonts.gstatic.com/s/ubuntu/v20/4iCs6KVjbNBYlgoKcg.ttf',
    'Roboto Slab': 'https://fonts.gstatic.com/s/robotoslab/v24/BngbUXZYTXPIvIBgJJSb6s3B98o.ttf',
    'Lora': 'https://fonts.gstatic.com/s/lora/v32/0UAn46at8_D50626.ttf',
    'Pacifico': 'https://fonts.gstatic.com/s/pacifico/v22/FwZY7-Qmy1X3869u0dfv.ttf',
    'Dancing Script': 'https://fonts.gstatic.com/s/dancingscript/v24/If2cXEE9MRq7uzswM9xyJa8_f8vPbT6H.ttf',
    'Bebas Neue': 'https://fonts.gstatic.com/s/bebasneue/v14/JTUSjIg1_i6t8kCHKm459WRhyzAL.ttf',
    'Lobster': 'https://fonts.gstatic.com/s/lobster/v30/neILzOf9sclmbFgs.ttf',
    'Abril Fatface': 'https://fonts.gstatic.com/s/abrilfatface/v23/z9X748NjtK768nSrGeqI-SXuCg.ttf'
};

export async function getFontBase64(fontFamily: string): Promise<string | null> {
    const url = FONT_MAP[fontFamily];
    if (!url) return null;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Font fetch failed');
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Remove data:application/x-font-ttf;base64, prefix
                resolve(base64.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error(`Error loading font ${fontFamily}:`, error);
        return null;
    }
}
