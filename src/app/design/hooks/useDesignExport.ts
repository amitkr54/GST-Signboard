import { DesignConfig } from '@/lib/types';
import { getFontBase64 } from '@/lib/font-utils';

export function useDesignExport(design: DesignConfig) {
    const getExportDimensions = () => {
        const DPI = 100;
        const u = design.unit || 'in';

        let wIn = design.width;
        let hIn = design.height;
        if (u === 'ft') { wIn *= 12; hIn *= 12; }
        else if (u === 'cm') { wIn /= 2.54; hIn /= 2.54; }
        else if (u === 'mm') { wIn /= 25.4; hIn /= 25.4; }

        const widthPx = wIn * DPI;
        const heightPx = hIn * DPI;

        return { width: Math.round(widthPx), height: Math.round(heightPx), widthIn: wIn, heightIn: hIn };
    };

    const getFontStyles = () => {
        let s = '';
        try {
            Array.from(document.styleSheets).forEach(sheet => {
                try {
                    Array.from(sheet.cssRules).forEach(rule => {
                        if (rule instanceof CSSFontFaceRule) s += rule.cssText + '\\n';
                    });
                } catch (e) { }
            });
        } catch (e) { }
        return s;
    };

    const handleDownload = async (format: 'svg' | 'pdf', setIsDownloading: (val: boolean) => void) => {
        const canvas = (window as any).fabricCanvas;
        if (!canvas) { alert('Preview not ready yet'); return; }
        const { width, height, widthIn, heightIn } = getExportDimensions();

        setIsDownloading(true);
        try {
            const fontStyles = getFontStyles();

            if (format === 'svg') {
                const svg = canvas.toSVG({
                    suppressPreamble: false,
                    width: width,
                    height: height,
                    viewBox: { x: 0, y: 0, width: canvas.width, height: canvas.height }
                });

                const finalSvg = svg.replace('</defs>', `<style type="text/css"><![CDATA[\\n${fontStyles}]]></style></defs>`);

                const blob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `signage-${Math.round(design.width)}x${Math.round(design.height)}${design.unit}-${Date.now()}.svg`;
                document.body.appendChild(link); link.click();
                document.body.removeChild(link); URL.revokeObjectURL(url);
            } else {
                const { jsPDF } = await import('jspdf');
                const svg2pdfModule = await import('svg2pdf.js');

                const svg = canvas.toSVG({
                    suppressPreamble: false,
                    width: width,
                    height: height,
                    viewBox: { x: 0, y: 0, width: canvas.width, height: canvas.height }
                });

                const styledSvg = svg.replace('</defs>', `<style type="text/css"><![CDATA[\\n${fontStyles}]]></style></defs>`);

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = styledSvg;
                const svgElement = tempDiv.querySelector('svg');
                if (!svgElement) { alert('Failed to generate SVG for PDF'); return; }

                const pdf = new jsPDF({
                    orientation: widthIn > heightIn ? 'landscape' : 'portrait',
                    unit: 'in',
                    format: [heightIn, widthIn]
                });

                const objects = canvas.getObjects();
                const usedFonts = new Set<string>();
                objects.forEach((obj: any) => {
                    if (obj.fontFamily) {
                        usedFonts.add(obj.fontFamily);
                        if (obj.fontWeight === 'bold') usedFonts.add(`${obj.fontFamily}-Bold`);
                        if (obj.fontStyle === 'italic') usedFonts.add(`${obj.fontFamily}-Italic`);
                        if (obj.fontWeight === 'bold' && obj.fontStyle === 'italic') usedFonts.add(`${obj.fontFamily}-BoldItalic`);
                    }
                });

                for (const fontName of Array.from(usedFonts)) {
                    const base64 = await getFontBase64(fontName);
                    if (base64) {
                        let style = 'normal';
                        let family = fontName;
                        if (fontName.includes('-BoldItalic')) {
                            family = fontName.replace('-BoldItalic', '');
                            style = 'bolditalic';
                        } else if (fontName.includes('-Bold')) {
                            family = fontName.replace('-Bold', '');
                            style = 'bold';
                        } else if (fontName.includes('-Italic')) {
                            family = fontName.replace('-Italic', '');
                            style = 'italic';
                        }

                        const vfsId = fontName.replace(/\\s+/g, '_') + '.ttf';
                        pdf.addFileToVFS(vfsId, base64);
                        pdf.addFont(vfsId, family, style);
                    }
                }

                await svg2pdfModule.svg2pdf(svgElement, pdf, { x: 0, y: 0, width: widthIn, height: heightIn });
                pdf.save(`signage-${Math.round(design.width)}x${Math.round(design.height)}${design.unit}-${Date.now()}.pdf`);
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to generate file');
        } finally {
            setIsDownloading(false);
        }
    };

    return {
        handleDownload,
        getExportDimensions,
    };
}
