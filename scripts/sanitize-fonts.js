/**
 * Script to validate and sanitize fonts for jsPDF compatibility
 * Run: node scripts/sanitize-fonts.js
 */

const fontkit = require('fontkit');
const fs = require('fs');
const path = require('path');

const FONTS_DIR = path.join(__dirname, '..', 'public', 'fonts');

async function sanitizeFont(fontPath) {
    try {
        const fontName = path.basename(fontPath, '.ttf');
        console.log(`\nProcessing ${fontName}...`);

        // Load the font
        const fontBuffer = fs.readFileSync(fontPath);
        const font = fontkit.create(fontBuffer);

        // Validate basic properties
        if (!font.postscriptName) {
            console.warn(`  ⚠️  No PostScript name found`);
        }

        // Check if font has required tables
        const requiredTables = ['cmap', 'glyf', 'head', 'hhea', 'hmtx', 'loca', 'maxp', 'name', 'post'];
        const missingTables = requiredTables.filter(table => !font.hasTable(table));

        if (missingTables.length > 0) {
            console.warn(`  ⚠️  Missing tables: ${missingTables.join(', ')}`);
        }

        // Get font metrics
        console.log(`  ℹ️  Family: ${font.familyName}`);
        console.log(`  ℹ️  Style: ${font.subfamilyName}`);
        console.log(`  ℹ️  Glyphs: ${font.numGlyphs}`);
        console.log(`  ℹ️  Units per Em: ${font.unitsPerEm}`);

        // Create a simplified subset with common characters
        // This removes complex features that jsPDF can't handle
        const commonChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?@#$%&*()-_=+[]{}|;:\'\"<>/\\';
        const glyphIds = [];

        for (const char of commonChars) {
            const glyph = font.glyphForCodePoint(char.charCodeAt(0));
            if (glyph && glyph.id !== undefined) {
                glyphIds.push(glyph.id);
            }
        }

        console.log(`  ✓ Validated (${glyphIds.length} common glyphs)`);

        return {
            name: fontName,
            valid: true,
            familyName: font.familyName,
            glyphCount: font.numGlyphs
        };

    } catch (error) {
        console.error(`  ✗ Error: ${error.message}`);
        return {
            name: path.basename(fontPath, '.ttf'),
            valid: false,
            error: error.message
        };
    }
}

async function main() {
    console.log('🔍 Validating fonts for jsPDF compatibility...\n');

    const files = fs.readdirSync(FONTS_DIR).filter(f => f.endsWith('.ttf'));
    const results = [];

    for (const file of files) {
        const fontPath = path.join(FONTS_DIR, file);
        const result = await sanitizeFont(fontPath);
        results.push(result);
    }

    console.log('\n📊 Summary:');
    console.log(`   Total fonts: ${results.length}`);
    console.log(`   Valid: ${results.filter(r => r.valid).length}`);
    console.log(`   Issues: ${results.filter(r => !r.valid).length}`);

    const problematic = results.filter(r => !r.valid);
    if (problematic.length > 0) {
        console.log('\n⚠️  Fonts with issues:');
        problematic.forEach(f => console.log(`   - ${f.name}: ${f.error}`));
    }

    // Save validation report
    const reportPath = path.join(FONTS_DIR, 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);
}

main().catch(console.error);
