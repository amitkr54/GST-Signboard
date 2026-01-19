/**
 * Script to download all Google Fonts locally
 * Run this once: node scripts/download-fonts.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const FONTS = [
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Oswald',
    'Raleway',
    'PT Sans',
    'Merriweather',
    'Nunito',
    'Playfair Display',
    'Poppins',
    'Source Sans Pro',
    'Ubuntu',
    'Roboto Slab',
    'Lora',
    'Pacifico',
    'Dancing Script',
    'Bebas Neue',
    'Lobster',
    'Abril Fatface'
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'fonts');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function getFontUrl(family, weight = '400') {
    const url = `https://fonts.googleapis.com/css?family=${family.replace(/ /g, '+')}:${weight}`;
    return new Promise((resolve, reject) => {
        // IE8 User Agent forces TTF format
        const options = {
            headers: {
                'User-Agent': 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const match = data.match(/url\((https:\/\/fonts\.gstatic\.com\/s\/[^)]+\.ttf)\)/);
                if (match) {
                    resolve(match[1]);
                } else {
                    resolve(null);
                }
            });
        }).on('error', reject);
    });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Status ${response.statusCode}`));
                return;
            }
            const file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', reject);
    });
}

async function downloadFont(family) {
    const cleanName = family.replace(/ /g, '');
    const regularPath = path.join(OUTPUT_DIR, `${cleanName}.ttf`);
    const boldPath = path.join(OUTPUT_DIR, `${cleanName}-Bold.ttf`);

    // Regular
    if (!fs.existsSync(regularPath)) {
        console.log(`Searching for ${family} Regular...`);
        const url = await getFontUrl(family, '400');
        if (url) {
            try {
                await downloadFile(url, regularPath);
                console.log(`✓ Downloaded ${family} Regular`);
            } catch (e) { console.error(`✗ Failed ${family}: ${e.message}`); }
        } else { console.warn(`? Could not find URL for ${family}`); }
    } else { console.log(`✓ ${family} Regular exists`); }

    // Bold (for Roboto and Poppins specifically, or all if we want)
    if (['Roboto', 'Poppins', 'Open Sans', 'Montserrat'].includes(family) && !fs.existsSync(boldPath)) {
        console.log(`Searching for ${family} Bold...`);
        const url = await getFontUrl(family, '700');
        if (url) {
            try {
                await downloadFile(url, boldPath);
                console.log(`✓ Downloaded ${family} Bold`);
            } catch (e) { console.error(`✗ Failed ${family} Bold: ${e.message}`); }
        }
    }
}

async function downloadAll() {
    console.log('Fetching fonts from Google Fonts API...\n');
    for (const family of FONTS) {
        await downloadFont(family);
    }
    console.log('\n✓ Font download complete!');
}

downloadAll();
