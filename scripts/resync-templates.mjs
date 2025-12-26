import fs from 'fs';
import path from 'path';

// Mocking the getStyles logic from actions.ts since we can't easily import it
function getStyles(attrStr: string, styleMap: any) {
    const s: any = {};
    const classMatch = attrStr.match(/class=["']([^"']+)["']/i);
    if (classMatch) {
        const classes = classMatch[1].split(/\s+/);
        classes.forEach(c => {
            if (styleMap[c]) Object.assign(s, styleMap[c]);
        });
    }
    ['font-size', 'font-family', 'font-weight', 'font-style', 'text-anchor', 'fill', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'points', 'd'].forEach(a => {
        const m = attrStr.match(new RegExp(`\\b${a}=["']([^"']+)["']`, 'i'));
        if (m) s[a] = m[1];
    });
    return s;
}

const templatesPath = path.join(process.cwd(), 'src/data/templates.json');
const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));

console.log('🔄 Re-processing templates...');

for (const template of templates) {
    if (template.isCustom && template.svgPath && template.svgPath.endsWith('.svg')) {
        console.log(`📦 Processing ${template.name}...`);
        const fullPath = path.join(process.cwd(), 'public', template.svgPath);
        if (!fs.existsSync(fullPath)) {
            console.warn(`⚠️ File not found: ${fullPath}`);
            continue;
        }

        const svgContent = fs.readFileSync(fullPath, 'utf8');

        // Extract viewBox
        const vbMatch = svgContent.match(/viewBox=["']([^"']+)["']/i);
        const viewBox = vbMatch ? vbMatch[1].split(/[\s,]+/).map(Number) : [0, 0, 1000, 1000];

        // Extract style maps
        const styleMap: any = {};
        const styleMatch = svgContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (styleMatch) {
            const css = styleMatch[1];
            const rules = css.match(/\.([^{]+)\{[^}]+\}/g) || [];
            rules.forEach(rule => {
                const nameMatch = rule.match(/\.([^{]+)\{/);
                const contentMatch = rule.match(/\{([^}]+)\}/);
                if (nameMatch && contentMatch) {
                    const name = nameMatch[1].trim();
                    const content = contentMatch[1].trim();
                    const styles: any = {};
                    content.split(';').forEach(s => {
                        const [k, v] = s.split(':').map(x => x.trim());
                        if (k && v) styles[k] = v;
                    });
                    styleMap[name] = styles;
                }
            });
        }

        const components: any = {
            text: [],
            logo: null,
            backgroundObjects: [],
            originalViewBox: viewBox
        };

        // Extract text
        const textRegex = /<text([^>]*)>([\s\S]*?)<\/text>/gi;
        let match;
        while ((match = textRegex.exec(svgContent)) !== null) {
            const attrStr = match[1];
            const content = match[2];
            const styles = getStyles(attrStr, styleMap);

            // Simple text extraction (no tspan recursion for this script)
            const textValue = content.replace(/<[^>]+>/g, ' ').trim();
            if (textValue) {
                components.text.push({
                    text: textValue,
                    left: parseFloat(styles.x || '0'),
                    top: parseFloat(styles.y || '0'),
                    fontSize: parseFloat(styles['font-size'] || '40'),
                    fontFamily: (styles['font-family'] || 'serif').replace(/['"]/g, ''),
                    fontWeight: styles['font-weight'] || 'normal',
                    fontStyle: styles['font-style'] || 'normal',
                    textAlign: styles['text-anchor'] === 'middle' ? 'center' : (styles['text-anchor'] === 'end' ? 'right' : 'left'),
                    fill: styles.fill || '#000000',
                    originalViewBox: viewBox
                });
            }
        }

        // Extract Shapes
        const shapeRegex = /<(path|rect|circle|ellipse|polygon|polyline)([^>]*)\/?>/gi;
        while ((match = shapeRegex.exec(svgContent)) !== null) {
            const type = match[1];
            const attrStr = match[2];
            const styles = getStyles(attrStr, styleMap);
            components.backgroundObjects.push({
                type,
                attributes: attrStr,
                styles
            });
        }

        template.components = components;
    }
}

fs.writeFileSync(templatesPath, JSON.stringify(templates, null, 2));
console.log('✅ All templates re-processed successfully!');
