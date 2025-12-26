const fs = require('fs');
const path = require('path');

function processSvgUsingActionsLogic(svgContent) {
    // 1. Extract viewBox for normalization
    const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/i);
    const viewBox = viewBoxMatch ? viewBoxMatch[1].split(/[\s,]+/).map(Number) : [0, 0, 1000, 1000];

    const components = {
        text: [],
        logo: null,
        backgroundObjects: [],
        originalViewBox: viewBox
    };

    // --- 1b. Extract CSS Styles from <style> blocks ---
    const styleMap = {};
    const styleBlocks = svgContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleBlocks) {
        styleBlocks.forEach(block => {
            const css = block.replace(/<\/?style[^>]*>/gi, '');
            const rules = css.match(/\.([a-z0-9_-]+)\s*\{([^}]*)\}/gi);
            if (rules) {
                rules.forEach(rule => {
                    const rMatch = rule.match(/\.([a-z0-9_-]+)\s*\{([^}]*)\}/i);
                    if (rMatch) {
                        const [, className, content] = rMatch;
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
        ['font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor', 'fill', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'points', 'd'].forEach(a => {
            const m = attrStr.match(new RegExp(`\\b${a}=["']([^"']+)["']`, 'i'));
            if (m) s[a] = m[1];
        });
        return s;
    };

    // --- 1c. Clean content for extraction ---
    const extractionContent = svgContent.replace(/<defs[\s\S]*?<\/defs>/gi, '');

    // 2. Extract Text elements
    const textRegex = /<text\s+([^>]*?)>([\s\S]*?)<\/text>/gi;
    let tMatch;
    while ((tMatch = textRegex.exec(svgContent)) !== null) {
        const textAttrs = tMatch[1];
        let textBody = tMatch[2];
        const baseStyles = getStyles(textAttrs);

        const tspanRegex = /<tspan\s+([^>]*?)>([\s\S]*?)<\/tspan>/gi;
        let tspanMatch;
        let lines = [];
        let firstY = NaN;
        let mergedStyles = Object.assign({}, baseStyles);

        while ((tspanMatch = tspanRegex.exec(textBody)) !== null) {
            const spanAttrs = tspanMatch[1];
            const spanContent = tspanMatch[2].replace(/<[^>]*>?/gm, '').trim();
            if (spanContent) {
                lines.push(spanContent);
                const spanStyles = getStyles(spanAttrs);
                if (lines.length === 1) {
                    Object.assign(mergedStyles, spanStyles);
                    firstY = parseFloat(spanStyles['y'] || 'NaN');
                }
            }
        }

        if (lines.length === 0) {
            const directContent = textBody.replace(/<[^>]*>?/gm, '').trim();
            if (directContent) {
                lines.push(directContent);
                firstY = parseFloat(mergedStyles['y'] || 'NaN');
            }
        }

        if (lines.length > 0) {
            const content = lines.join('\n');
            let fontSize = parseFloat((mergedStyles['font-size'] || '').toString().replace(/[a-z]/g, '') || 'NaN');
            if (isNaN(fontSize)) fontSize = 40;

            const rawY = isNaN(firstY) ? parseFloat((mergedStyles['y'] || '0').toString().replace(/[a-z]/g, '')) : firstY;
            const correctedTop = rawY - (fontSize * 0.82);

            components.text.push({
                text: content,
                left: parseFloat((mergedStyles['x'] || '0').toString().replace(/[a-z]/g, '')),
                top: correctedTop,
                fontSize: fontSize,
                fill: mergedStyles['fill'] || '#000000'
            });
        }
    }

    // 3. Extract Rects and Paths
    const shapeRegex = /<(path|rect|circle|ellipse|polygon|polyline)\s+([^>]*?)\/?>/gi;
    while ((tMatch = shapeRegex.exec(extractionContent)) !== null) {
        const tag = tMatch[1].toLowerCase();
        const attrs = tMatch[2];
        const styles = getStyles(attrs);
        components.backgroundObjects.push({ type: tag, styles });
    }

    // --- 4. Content-Based Normalization ---
    if (components.text.length > 0 || components.backgroundObjects.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        components.text.forEach(t => {
            minX = Math.min(minX, t.left);
            minY = Math.min(minY, t.top);
            const estimatedWidth = (t.text.split('\n')[0].length * t.fontSize * 0.6);
            maxX = Math.max(maxX, t.left + estimatedWidth);
            maxY = Math.max(maxY, t.top + t.fontSize);
        });

        components.backgroundObjects.forEach(o => {
            const s = o.styles;
            let x = parseFloat(s.x || s.cx || 0);
            let y = parseFloat(s.y || s.cy || 0);
            let w = parseFloat(s.width || s.r || 0);
            let h = parseFloat(s.height || s.r || 0);
            if (o.type === 'path' && s.d) {
                const m = s.d.match(/M\s*(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/i);
                if (m) { x = parseFloat(m[1]); y = parseFloat(m[2]); w = 10; h = 10; }
            }
            if (!isNaN(x)) { minX = Math.min(minX, x); maxX = Math.max(maxX, x + w); }
            if (!isNaN(y)) { minY = Math.min(minY, y); maxY = Math.max(maxY, y + h); }
        });

        if (minX !== Infinity && maxX > minX) {
            const padW = (maxX - minX) * 0.05 + 1;
            const padH = (maxY - minY) * 0.05 + 1;
            components.originalViewBox = [
                minX - padW,
                minY - padH,
                (maxX - minX) + (padW * 2),
                (maxY - minY) + (padH * 2)
            ];
        }
    }
    return components;
}

const dbPath = './src/data/templates.json';
const templates = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

templates.forEach(t => {
    if (t.isCustom && t.svgPath) {
        const svgPath = path.join('./public', t.svgPath);
        if (fs.existsSync(svgPath)) {
            console.log('Migrating (Robust):', t.name);
            const svgContent = fs.readFileSync(svgPath, 'utf8');
            t.components = processSvgUsingActionsLogic(svgContent);
            console.log('Result ViewBox:', t.components.originalViewBox);
        }
    }
});

fs.writeFileSync(dbPath, JSON.stringify(templates, null, 2));
console.log('Migration complete.');
