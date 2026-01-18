/**
 * Script to download all Google Fonts locally
 * Run this once: node scripts/download-fonts.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const FONTS = {
    'Roboto': 'https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Regular.ttf',
    'OpenSans': 'https://github.com/google/fonts/raw/main/apache/opensans/static/OpenSans-Regular.ttf',
    'Lato': 'https://github.com/google/fonts/raw/main/ofl/lato/Lato-Regular.ttf',
    'Montserrat': 'https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Regular.ttf',
    'Oswald': 'https://github.com/google/fonts/raw/main/ofl/oswald/static/Oswald-Regular.ttf',
    'Raleway': 'https://github.com/google/fonts/raw/main/ofl/raleway/static/Raleway-Regular.ttf',
    'PTSans': 'https://github.com/google/fonts/raw/main/ofl/ptsans/PT_Sans-Web-Regular.ttf',
    'Merriweather': 'https://github.com/google/fonts/raw/main/ofl/merriweather/Merriweather-Regular.ttf',
    'Nunito': 'https://github.com/google/fonts/raw/main/ofl/nunito/static/Nunito-Regular.ttf',
    'PlayfairDisplay': 'https://github.com/google/fonts/raw/main/ofl/playfairdisplay/static/PlayfairDisplay-Regular.ttf',
    'Poppins': 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf',
    'SourceSansPro': 'https://github.com/google/fonts/raw/main/ofl/sourcesanspro/SourceSansPro-Regular.ttf',
    'Ubuntu': 'https://github.com/google/fonts/raw/main/ufl/ubuntu/Ubuntu-Regular.ttf',
    'RobotoSlab': 'https://github.com/google/fonts/raw/main/apache/robotoslab/static/RobotoSlab-Regular.ttf',
    'Lora': 'https://github.com/google/fonts/raw/main/ofl/lora/static/Lora-Regular.ttf',
    'Pacifico': 'https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf',
    'DancingScript': 'https://github.com/google/fonts/raw/main/ofl/dancingscript/static/DancingScript-Regular.ttf',
    'BebasNeue': 'https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf',
    'Lobster': 'https://github.com/google/fonts/raw/main/ofl/lobster/Lobster-Regular.ttf',
    'AbrilFatface': 'https://github.com/google/fonts/raw/main/ofl/abrilfatface/AbrilFatface-Regular.ttf'
};

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'fonts');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function downloadFont(name, url) {
    return new Promise((resolve, reject) => {
        const outputPath = path.join(OUTPUT_DIR, `${name}.ttf`);

        // Skip if already exists
        if (fs.existsSync(outputPath)) {
            console.log(`✓ ${name} (already exists)`);
            resolve();
            return;
        }

        const file = fs.createWriteStream(outputPath);

        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`✓ Downloaded ${name}`);
                        resolve();
                    });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✓ Downloaded ${name}`);
                    resolve();
                });
            }
        }).on('error', (err) => {
            fs.unlink(outputPath, () => { }); // Delete partial file
            console.error(`✗ Failed to download ${name}: ${err.message}`);
            reject(err);
        });
    });
}

async function downloadAll() {
    console.log('Downloading fonts to public/fonts/...\n');

    const entries = Object.entries(FONTS);
    for (const [name, url] of entries) {
        try {
            await downloadFont(name, url);
        } catch (error) {
            console.error(`Error downloading ${name}:`, error.message);
        }
    }

    console.log('\n✓ Font download complete!');
}

downloadAll();
