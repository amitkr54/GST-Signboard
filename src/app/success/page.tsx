'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Download, Home, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { getFontBase64 } from '@/lib/font-utils';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Button } from '@/components/ui/Button';
import { SignageData, DesignConfig } from '@/lib/types';
import { MaterialId } from '@/lib/utils';
import { generateSVG, downloadSVG } from '@/lib/svg-export';
import { SignagePreview } from '@/components/SignagePreview';
import { getOrder } from '@/app/actions';

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <SuccessContent />
        </Suspense>
    );
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [designData, setDesignData] = useState<{
        data: SignageData;
        design: DesignConfig;
        material: MaterialId;
        options?: any;
    } | null>(null);
    const [orderInfo, setOrderInfo] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadOrder = async () => {
            if (!orderId) {
                setIsLoading(false);
                return;
            }

            // 1. Fetch order from DB
            const result = await getOrder(orderId);
            if (result.success) {
                setOrderInfo(result.order);
            }

            // 2. Load design data from sessionStorage
            const stored = sessionStorage.getItem('signageDesign');
            if (stored) {
                try {
                    setDesignData(JSON.parse(stored));
                } catch (error) {
                    console.error('Failed to parse design data:', error);
                }
            }
            setIsLoading(false);
        };

        loadOrder();
    }, [orderId]);

    const downloadDesignAsPDF = async () => {
        const visualProof = orderInfo?.visual_proof;
        const designConfig = orderInfo?.design_config;

        if (!visualProof || !orderId) return;

        setIsLoading(true); // Reuse loading state for process
        try {
            const [jsPDFModule, svg2pdfModule] = await Promise.all([
                import('jspdf'),
                import('svg2pdf.js')
            ]);

            const jsPDF = jsPDFModule.jsPDF;

            // Extract fonts from SVG
            const fontFamilies = new Set<string>();
            const fontMatch = visualProof.match(/(?:font-family)[:=]\s*['"]?([^'";\),]+)['"]?/gi);
            if (fontMatch) {
                fontMatch.forEach((m: string) => {
                    const family = m.replace(/font-family[:=]\s*['"]?/, '').replace(/['"]?$/, '').trim();
                    if (family) fontFamilies.add(family);
                });
            }

            const widthIn = designConfig?.width || 12;
            const heightIn = designConfig?.height || 12;

            const pdf = new jsPDF({
                orientation: widthIn > heightIn ? 'landscape' : 'portrait',
                unit: 'in',
                format: [heightIn, widthIn]
            });

            for (const family of Array.from(fontFamilies)) {
                const variants = ['', '-Bold', '-Italic', '-BoldItalic'];
                for (const variant of variants) {
                    const fontName = `${family}${variant}`;
                    const base64 = await getFontBase64(fontName);
                    if (base64) {
                        let style = 'normal';
                        if (variant === '-Bold') style = 'bold';
                        else if (variant === '-Italic') style = 'italic';
                        else if (variant === '-BoldItalic') style = 'bolditalic';
                        const vfsId = fontName.replace(/\s+/g, '_') + '.ttf';
                        pdf.addFileToVFS(vfsId, base64);
                        pdf.addFont(vfsId, family, style);
                    }
                }
            }

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = visualProof;
            const svgElement = tempDiv.querySelector('svg');

            if (svgElement) {
                await svg2pdfModule.svg2pdf(svgElement, pdf, {
                    x: 0, y: 0, width: widthIn, height: heightIn
                });
                pdf.save(`signage-${Math.round(widthIn)}x${Math.round(heightIn)}${designConfig?.unit || 'in'}-${Date.now()}.pdf`);
            } else {
                const blob = new Blob([visualProof], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `signage-${orderId.split('-')[0]}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Downloading SVG instead.');
            handleDownload();
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (orderInfo?.visual_proof) {
            const blob = new Blob([orderInfo.visual_proof], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `signage-${orderId?.split('-')[0]}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return;
        }

        if (!designData) return;

        try {
            const svgContent = generateSVG(
                designData.data,
                designData.design,
                designData.material
            );
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `signage-${orderId?.split('-')[0]}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading:', error);
            alert('Failed to download. Please try again.');
        }
    };

    const handleWhatsAppShare = () => {
        const text = `Hi, I just placed a signage order!\n\nOrder ID: ${orderId}\nStatus: Payment Successful\n\nYou can view my design here: ${window.location.href}`;
        const wpUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(wpUrl, '_blank');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                    <p className="text-gray-600">Loading order summary...</p>
                </div>
            </div>
        );
    }

    if (!orderId) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">No order found</p>
                    <Link href="/">
                        <Button variant="outline">Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold text-center text-gray-900 mb-3">
                    Payment Successful!
                </h1>
                <p className="text-center text-gray-600 mb-2">
                    Your signage order has been placed successfully.
                </p>
                <p className="text-center text-sm text-gray-500 mb-8">
                    Order ID: <span className="font-mono font-semibold text-blue-600">{orderId}</span>
                </p>

                <div className="bg-purple-50 border-l-4 border-purple-600 p-4 mb-8">
                    <p className="text-sm text-blue-900 mb-2">
                        <strong>What's next?</strong> We'll process your order and send you a confirmation email with production details.
                    </p>
                    {designData?.options?.paymentScheme === 'part' && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                            <p className="text-sm text-blue-900 flex justify-between">
                                <span>Amount Paid:</span>
                                <span className="font-bold text-green-600">₹{designData.options.advanceAmount}</span>
                            </p>
                            <p className="text-sm text-blue-900 flex justify-between mt-1">
                                <span>Balance Due on Delivery:</span>
                                <span className="font-bold text-red-600">₹{designData.options.price - (designData.options.advanceAmount || 0)}</span>
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <Button
                        onClick={downloadDesignAsPDF}
                        className="w-full group bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold h-14"
                        size="lg"
                        disabled={!orderInfo?.visual_proof || isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                        )}
                        Download High-Quality PDF
                    </Button>

                    <Button
                        onClick={handleWhatsAppShare}
                        className="w-full group bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-14"
                        size="lg"
                    >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Share Proof via WhatsApp
                    </Button>

                    <button
                        onClick={handleDownload}
                        className="w-full text-indigo-600 text-sm font-bold hover:underline py-2"
                        disabled={!designData && !orderInfo}
                    >
                        Download Vector SVG (for editing)
                    </button>

                    <Link href="/design" className="block">
                        <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Create Another Design
                        </Button>
                    </Link>

                    <Link href="/" className="block">
                        <Button
                            variant="ghost"
                            className="w-full"
                            size="lg"
                        >
                            <Home className="w-5 h-5 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
