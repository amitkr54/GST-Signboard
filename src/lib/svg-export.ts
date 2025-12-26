import { SignageData, DesignConfig } from './types';
import { MaterialId } from './utils';
import { LAYOUT } from './layout-constants';

export function generateSVG(
    data: SignageData,
    design: DesignConfig,
    material: MaterialId
): string {
    const { WIDTH, HEIGHT, PADDING, LOGO_MB, COMPANY_MB, DETAILS_GAP, LINE_HEIGHT_MULTIPLIER } = LAYOUT;

    // Determine background
    let backgroundFill = design.backgroundColor;
    let borderStyle = '';

    if (material === 'flex') {
        borderStyle = 'stroke="#000000" stroke-width="2"';
    } else if (material === 'steel') {
        backgroundFill = '#e5e5e5';
        borderStyle = 'stroke="#a0a0a0" stroke-width="8"';
    } else if (material === 'acrylic') {
        borderStyle = 'stroke="rgba(255,255,255,0.2)" stroke-width="2"';
    }

    // --- 1. Calculate Content Layout ---

    let currentHeight = 0;
    const elements: { type: string, content?: string, height: number, y?: number, lines?: string[], fontSize?: number, bold?: boolean }[] = [];

    // Logo
    if (data.logoUrl) {
        const logoSize = design.logoSize || 150;
        elements.push({ type: 'logo', height: logoSize });
        currentHeight += logoSize + LOGO_MB;
    }

    // Company Name
    if (data.companyName) {
        const fontSize = design.companyNameSize || 150; // Match DEFAULT_DESIGN
        const lineHeight = fontSize * LINE_HEIGHT_MULTIPLIER;
        const maxWidth = WIDTH - (PADDING * 2);
        const lines = wrapText(data.companyName.toUpperCase(), fontSize, maxWidth, 'Arial', true);

        const blockHeight = lines.length * lineHeight;
        elements.push({
            type: 'companyName',
            lines,
            height: blockHeight,
            fontSize,
            bold: true
        });
        currentHeight += blockHeight + COMPANY_MB;
    }

    // Details Block (GSTIN, Address, Contact, Additional)
    const detailFontSize = design.fontSize || 30;
    const detailLineHeight = detailFontSize * LINE_HEIGHT_MULTIPLIER;
    const detailMaxWidth = WIDTH - (PADDING * 2);

    // GSTIN & CIN
    if (data.gstin || data.cin) {
        let text = '';
        if (data.gstin) text += `GSTIN: ${data.gstin}`;
        if (data.cin) {
            if (text) text += '   |   ';
            text += `CIN: ${data.cin}`;
        }
        elements.push({
            type: 'text',
            content: text,
            height: detailLineHeight,
            fontSize: detailFontSize,
            bold: true
        });
        currentHeight += detailLineHeight + DETAILS_GAP;
    }

    // Address
    if (data.address) {
        // Label
        elements.push({
            type: 'text',
            content: 'Address:',
            height: detailLineHeight,
            fontSize: detailFontSize,
            bold: true
        });
        currentHeight += detailLineHeight; // No gap after label, just next line

        // Lines
        const rawLines = data.address.split('\n');
        rawLines.forEach(line => {
            if (line.trim()) {
                const wrapped = wrapText(line.trim(), detailFontSize, detailMaxWidth, 'Arial', false);
                wrapped.forEach(wLine => {
                    elements.push({
                        type: 'text',
                        content: wLine,
                        height: detailLineHeight,
                        fontSize: detailFontSize,
                        bold: false
                    });
                    currentHeight += detailLineHeight;
                });
            }
        });
        currentHeight += DETAILS_GAP; // Gap after address block
    }

    // Contact
    if (data.mobile) {
        elements.push({
            type: 'text',
            content: `Contact: ${data.mobile}`,
            height: detailLineHeight,
            fontSize: detailFontSize,
            bold: true
        });
        currentHeight += detailLineHeight + DETAILS_GAP;
    }

    // Additional Text
    if (data.additionalText && data.additionalText.length > 0) {
        data.additionalText.forEach(text => {
            const wrapped = wrapText(text, detailFontSize, detailMaxWidth, 'Arial', false);
            wrapped.forEach(wLine => {
                elements.push({
                    type: 'text',
                    content: wLine,
                    height: detailLineHeight,
                    fontSize: detailFontSize,
                    bold: false
                });
                currentHeight += detailLineHeight;
            });
            currentHeight += DETAILS_GAP;
        });
    }

    // Remove last gap if exists
    if (elements.length > 0 && (elements[elements.length - 1].type === 'text' || elements[elements.length - 1].type === 'companyName')) {
        currentHeight -= DETAILS_GAP; // Remove the trailing gap from the last block
    }


    // --- 2. Generate SVG ---

    let startY = (HEIGHT - currentHeight) / 2;
    // Ensure we don't start off-screen if content is huge
    if (startY < PADDING) startY = PADDING;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="18in" height="12in" viewBox="0 0 ${WIDTH} ${HEIGHT}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        <style>
            .text { font-family: Arial, Helvetica, sans-serif; }
            .bold { font-weight: bold; }
        </style>
    </defs>
    
    <!-- Background -->
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="${backgroundFill}" ${borderStyle} />
`;

    let y = startY;

    elements.forEach(el => {
        if (el.type === 'logo') {
            const logoX = (WIDTH - el.height) / 2;
            svg += `    <image x="${logoX}" y="${y}" width="${el.height}" height="${el.height}" href="${data.logoUrl}" preserveAspectRatio="xMidYMid meet" />\n`;
            y += el.height + LOGO_MB;
        } else if (el.type === 'companyName') {
            const lineHeight = el.height / (el.lines?.length || 1);
            el.lines?.forEach((line, i) => {
                svg += `    <text x="${WIDTH / 2}" y="${y + (el.fontSize || 0)}" text-anchor="middle" font-family="Arial" font-weight="bold" font-size="${el.fontSize}" fill="${design.textColor}">${escapeXml(line)}</text>\n`;
                y += lineHeight;
            });
            y += COMPANY_MB;
        } else if (el.type === 'text') {
            // Single line text element
            svg += `    <text x="${WIDTH / 2}" y="${y + (el.fontSize || 0)}" text-anchor="middle" font-family="Arial" font-size="${el.fontSize}" fill="${design.textColor}" ${el.bold ? 'font-weight="bold"' : ''}>${escapeXml(el.content || '')}</text>\n`;
            y += el.height;
        }
    });

    // RE-DOING THE LOOP STRATEGY TO BE SAFER
    // Let's restart the element collection to include gaps explicitly.
    return generateSVGWithGaps(data, design, material, backgroundFill, borderStyle);
}

// Helper to re-implement with explicit gaps for cleaner rendering loop
function generateSVGWithGaps(
    data: SignageData,
    design: DesignConfig,
    material: MaterialId,
    backgroundFill: string,
    borderStyle: string
): string {
    const { WIDTH, HEIGHT, PADDING, LOGO_MB, COMPANY_MB, DETAILS_GAP, LINE_HEIGHT_MULTIPLIER } = LAYOUT;

    const elements: { type: 'logo' | 'text' | 'gap', content?: string, height: number, fontSize?: number, bold?: boolean }[] = [];
    let totalHeight = 0;

    // Logo
    if (data.logoUrl) {
        const logoSize = design.logoSize || 150;
        elements.push({ type: 'logo', height: logoSize });
        totalHeight += logoSize;

        elements.push({ type: 'gap', height: LOGO_MB });
        totalHeight += LOGO_MB;
    }

    // Company Name
    if (data.companyName) {
        const fontSize = design.companyNameSize || 150;
        const lineHeight = fontSize * LINE_HEIGHT_MULTIPLIER;
        const maxWidth = WIDTH - (PADDING * 2);
        const lines = wrapText(data.companyName.toUpperCase(), fontSize, maxWidth, 'Arial', true);

        lines.forEach(line => {
            elements.push({ type: 'text', content: line, height: lineHeight, fontSize, bold: true });
            totalHeight += lineHeight;
        });

        elements.push({ type: 'gap', height: COMPANY_MB });
        totalHeight += COMPANY_MB;
    }

    // Details
    const detailFontSize = design.fontSize || 30;
    const detailLineHeight = detailFontSize * LINE_HEIGHT_MULTIPLIER;
    const detailMaxWidth = WIDTH - (PADDING * 2);

    // GSTIN/CIN
    if (data.gstin || data.cin) {
        let text = '';
        if (data.gstin) text += `GSTIN: ${data.gstin}`;
        if (data.cin) {
            if (text) text += '   |   ';
            text += `CIN: ${data.cin}`;
        }
        elements.push({ type: 'text', content: text, height: detailLineHeight, fontSize: detailFontSize, bold: true });
        totalHeight += detailLineHeight;

        elements.push({ type: 'gap', height: DETAILS_GAP });
        totalHeight += DETAILS_GAP;
    }

    // Address
    if (data.address) {
        elements.push({ type: 'text', content: 'Address:', height: detailLineHeight, fontSize: detailFontSize, bold: true });
        totalHeight += detailLineHeight;

        const rawLines = data.address.split('\n');
        rawLines.forEach(line => {
            if (line.trim()) {
                const wrapped = wrapText(line.trim(), detailFontSize, detailMaxWidth, 'Arial', false);
                wrapped.forEach(wLine => {
                    elements.push({ type: 'text', content: wLine, height: detailLineHeight, fontSize: detailFontSize, bold: false });
                    totalHeight += detailLineHeight;
                });
            }
        });

        elements.push({ type: 'gap', height: DETAILS_GAP });
        totalHeight += DETAILS_GAP;
    }

    // Contact
    if (data.mobile) {
        elements.push({ type: 'text', content: `Contact: ${data.mobile}`, height: detailLineHeight, fontSize: detailFontSize, bold: true });
        totalHeight += detailLineHeight;

        elements.push({ type: 'gap', height: DETAILS_GAP });
        totalHeight += DETAILS_GAP;
    }

    // Additional
    if (data.additionalText && data.additionalText.length > 0) {
        data.additionalText.forEach(text => {
            const wrapped = wrapText(text, detailFontSize, detailMaxWidth, 'Arial', false);
            wrapped.forEach(wLine => {
                elements.push({ type: 'text', content: wLine, height: detailLineHeight, fontSize: detailFontSize, bold: false });
                totalHeight += detailLineHeight;
            });
            elements.push({ type: 'gap', height: DETAILS_GAP });
            totalHeight += DETAILS_GAP;
        });
    }

    // Remove trailing gap
    if (elements.length > 0 && elements[elements.length - 1].type === 'gap') {
        totalHeight -= elements[elements.length - 1].height;
        elements.pop();
    }

    // Render
    let startY = (HEIGHT - totalHeight) / 2;
    if (startY < PADDING) startY = PADDING;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="18in" height="12in" viewBox="0 0 ${WIDTH} ${HEIGHT}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
        <style>
            .text { font-family: Arial, Helvetica, sans-serif; }
            .bold { font-weight: bold; }
        </style>
    </defs>
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="${backgroundFill}" ${borderStyle} />
`;

    let y = startY;
    elements.forEach(el => {
        if (el.type === 'logo') {
            const logoX = (WIDTH - el.height) / 2;
            svg += `    <image x="${logoX}" y="${y}" width="${el.height}" height="${el.height}" href="${data.logoUrl}" preserveAspectRatio="xMidYMid meet" />\n`;
            y += el.height;
        } else if (el.type === 'text') {
            // SVG text y is baseline. Add approx 0.8em or just use fontSize as baseline offset from top of line
            // A simple heuristic for Arial is that baseline is roughly fontSize * 0.8 down from top.
            // Or we can use dominant-baseline="hanging" and y=top? 
            // "hanging" is not always well supported in all viewers.
            // Let's stick to adding fontSize (which puts baseline at bottom of em box roughly).
            // Actually, centering vertically in the line height is better.
            // line height = fontSize * 1.2. 
            // (lineHeight - fontSize) / 2 is top padding.
            // y + (lineHeight - fontSize)/2 + fontSize * 0.8?
            // Simplest: y + fontSize.
            svg += `    <text x="${WIDTH / 2}" y="${y + (el.fontSize || 0)}" text-anchor="middle" font-family="Arial" font-size="${el.fontSize}" fill="${design.textColor}" ${el.bold ? 'font-weight="bold"' : ''}>${escapeXml(el.content || '')}</text>\n`;
            y += el.height;
        } else if (el.type === 'gap') {
            y += el.height;
        }
    });

    svg += `</svg>`;
    return svg;
}

// Text wrapper with precise Canvas measurement
function wrapText(text: string, fontSize: number, maxWidth: number, fontFamily: string, bold: boolean): string[] {
    // Try to use Canvas API if available (Client-side)
    if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
            context.font = `${bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;

            const words = text.split(' ');
            const lines: string[] = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = context.measureText(currentLine + ' ' + word).width;
                if (width < maxWidth) {
                    currentLine += ' ' + word;
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
            lines.push(currentLine);
            return lines;
        }
    }

    // Fallback for Server-side (Approximation)
    const avgCharWidth = fontSize * 0.6 * (bold ? 1.1 : 1.0);
    const maxChars = Math.floor(maxWidth / avgCharWidth);

    if (text.length <= maxChars) return [text];

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if ((currentLine + ' ' + words[i]).length < maxChars) {
            currentLine += ' ' + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);
    return lines;
}

function escapeXml(unsafe: string): string {
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export function downloadSVG(svgContent: string, filename: string) {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
