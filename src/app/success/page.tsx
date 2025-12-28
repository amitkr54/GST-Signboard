'use client';

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Download, Home, ArrowLeft, Loader2 } from 'lucide-react';
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

    const handleDownload = () => {
        // Use stored visual proof if available, otherwise regenerate
        if (orderInfo?.visual_proof) {
            downloadSVG(orderInfo.visual_proof, `approved-signage-${orderId}.svg`);
            return;
        }

        if (!designData) return;

        try {
            const svgContent = generateSVG(
                designData.data,
                designData.design,
                designData.material
            );
            downloadSVG(svgContent, `signage-${orderId}.svg`);
        } catch (error) {
            console.error('Error downloading:', error);
            alert('Failed to download. Please try again.');
        }
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
                        onClick={handleDownload}
                        className="w-full group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        size="lg"
                        disabled={!designData && !orderInfo}
                    >
                        <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                        Download Your Design (Vector SVG)
                    </Button>

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
