const fs = require('fs');
const path = require('path');

function testExtraction(svgContent) {
    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i);
    const viewBox = viewBoxMatch ? viewBoxMatch[1].split(/[\s,]+/).map(Number) : [0, 0, 1000, 1000];

    const styleMap = {};
    const styleBlocks = svgContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleBlocks) {
        styleBlocks.forEach(block => {
            const css = block.replace(/<\/?style[^>]*>/gi, '');
            const rules = css.match(/\.([a-z0-9_-]+)\s*\{([^}]*)\}/gi);
            if (rules) {
                rules.forEach(rule => {
                    const matchArr = rule.match(/\.([a-z0-9_-]+)\s*\{([^}]*)\}/i);
                    if (matchArr) {
                        const className = matchArr[1];
                        const content = matchArr[2];
                        styleMap[className] = {};
                        content.split(';').forEach(p => {
                            const [k, v] = p.split(':').map(s => s.trim());
                            if (k && v) styleMap[className][k.toLowerCase()] = v.replace(/['"]/g, '');
                        });
                    }
                });
            }
        });
    }

    const getStyles = (attrStr) => {
        let s = {};
        const styleMatch = attrStr.match(/style=["']([^"']+)["']/i);
        if (styleMatch) {
            styleMatch[1].split(';').forEach(p => {
                const [k, v] = p.split(':').map(str => str.trim());
                if (k && v) s[k.toLowerCase()] = v.replace(/['"]/g, '');
            });
        }
        const classMatch = attrStr.match(/class=["']([^"']+)["']/i);
        if (classMatch) {
            classMatch[1].split(/\s+/).forEach(c => {
                if (styleMap[c]) Object.assign(s, styleMap[c]);
            });
        }
        ['font-size', 'fill', 'x', 'y', 'width', 'height', 'd'].forEach(a => {
            const m = attrStr.match(new RegExp(`\\b${a}=["']([^"']+)["']`, 'i'));
            if (m) s[a] = m[1];
        });
        return s;
    };

    const extractionContent = svgContent.replace(/<defs[\s\S]*?<\/defs>/gi, '');
    const components = { text: [], backgroundObjects: [], originalViewBox: viewBox };

    const textRegex = /<text\s+([^>]*?)>([\s\S]*?)<\/text>/gi;
    let match;
    while ((match = textRegex.exec(svgContent)) !== null) {
        const styles = getStyles(match[1]);
        components.text.push({
            text: match[2].replace(/<[^>]*>?/gm, '').trim(),
            left: parseFloat(styles.x || 0),
            top: parseFloat(styles.y || 0),
            fontSize: parseFloat(styles['font-size'] || 40)
        });
    }

    const shapeRegex = /<(path|rect|circle|ellipse|polygon|polyline)\s+([^>]*?)\/?>/gi;
    while ((match = shapeRegex.exec(extractionContent)) !== null) {
        const tag = match[1];
        const attrs = match[2];
        const styles = getStyles(attrs);
        components.backgroundObjects.push({ type: tag, styles });
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    components.text.forEach((t) => {
        minX = Math.min(minX, t.left);
        minY = Math.min(minY, t.top);
        const estimatedWidth = (t.text.split('\n')[0].length * t.fontSize * 0.6);
        maxX = Math.max(maxX, t.left + estimatedWidth);
        maxY = Math.max(maxY, t.top + t.fontSize);
    });
    components.backgroundObjects.forEach((o) => {
        const s = o.styles;
        let x = parseFloat(s.x || 0), y = parseFloat(s.y || 0), w = parseFloat(s.width || 0), h = parseFloat(s.height || 0);
        if (o.type === 'path' && s.d) {
            const m = s.d.match(/M\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/i);
            if (m) { x = parseFloat(m[1]); y = parseFloat(m[2]); w = 10; h = 10; }
        }
        if (!isNaN(x)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x + w); }
        if (!isNaN(y)) { minY = Math.min(minY, y); maxY = Math.max(maxY, y + h); }
    });

    if (minX !== Infinity) {
        components.newViewBox = [minX, minY, maxX - minX, maxY - minY];
    }
    return components;
}

const testSvg = fs.readFileSync('c:/Users/Admin/Desktop/signage - Copy/public/templates/070f8bb0-58e0-4100-9c40-61b8ca14e965.svg', 'utf8');
const result = testExtraction(testSvg);

console.log('RESULT_SUMMARY:');
console.log('Text count:', result.text.length);
console.log('Shape count:', result.backgroundObjects.length);
console.log('Original ViewBox:', result.originalViewBox);
console.log('New ViewBox (Normalized):', result.newViewBox);

const tinyPaths = result.backgroundObjects.filter((o) => {
    const d = (o.styles && o.styles.d) || '';
    return d.includes('M11.9995');
});
console.log('Tiny paths found (should be 0):', tinyPaths.length);
