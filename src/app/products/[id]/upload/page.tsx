'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { PRODUCTS } from '@/lib/products';
import { Check, ChevronRight, Home, Upload, FileText, AlertCircle, X } from 'lucide-react';

export default function UploadDesignPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sizeId = searchParams.get('size');

    const product = PRODUCTS.find(p => p.id === params.id);
    const selectedSize = product?.sizes.find(s => s.id === sizeId);

    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    if (!product) {
        return <div className="min-h-screen flex items-center justify-center">Product not found</div>;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setUploadedFile(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleContinue = () => {
        // In a real app, this would upload the file and proceed to checkout
        // For now, redirecting to design page with upload context or correct checkout flow
        router.push(`/checkout?product=${product.id}&size=${sizeId}&hasDesign=true`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Breadcrumbs */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="flex items-center gap-2 text-sm">
                        <Link href="/" className="text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            Home
                        </Link>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <Link href={`/products/${product.id}`} className="text-gray-600 hover:text-indigo-600 transition-colors">
                            {product.name}
                        </Link>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 font-semibold">Upload Design</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Upload Your Design</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Upload your ready-made design file for <span className="font-bold text-indigo-600">{product.name}</span>
                    </p>
                    {selectedSize && (
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-200">
                            <span className="text-sm font-semibold text-indigo-900">Selected Size:</span>
                            <span className="text-sm font-bold text-indigo-600">{selectedSize.name}</span>
                        </div>
                    )}
                </div>

                {/* Upload Area */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ${isDragging
                        ? 'border-indigo-600 bg-indigo-50 scale-105'
                        : uploadedFile
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-gray-50'
                        }`}
                >
                    {uploadedFile ? (
                        <div className="space-y-6">
                            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                                <Check className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">File Uploaded Successfully!</h3>
                                <p className="text-gray-600 mb-4">
                                    <FileText className="w-5 h-5 inline mr-2" />
                                    <span className="font-semibold">{uploadedFile.name}</span>
                                    <span className="text-sm ml-2">({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                </p>
                                <button
                                    onClick={() => setUploadedFile(null)}
                                    className="text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 mx-auto"
                                >
                                    <X className="w-4 h-4" />
                                    Remove File
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto">
                                <Upload className="w-10 h-10 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Drop your file here</h3>
                                <p className="text-gray-600 mb-6">or click to browse</p>
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg,.ai,.psd"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <span className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                                        <Upload className="w-5 h-5" />
                                        Choose File
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* File Requirements */}
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-blue-900 mb-2">File Requirements</h4>
                            <ul className="space-y-1 text-sm text-blue-800">
                                <li>• Accepted formats: PDF, PNG, JPG, AI, PSD</li>
                                <li>• Maximum file size: 50MB</li>
                                <li>• Resolution: At least 300 DPI for best print quality</li>
                                {selectedSize && (
                                    <li>• Dimensions: {selectedSize.dimensions.width}{selectedSize.dimensions.unit} × {selectedSize.dimensions.height}{selectedSize.dimensions.unit}</li>
                                )}
                                <li>• Color mode: CMYK preferred for print</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-4">
                    <Button
                        onClick={handleContinue}
                        disabled={!uploadedFile}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-5 rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        Continue to Checkout
                        <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>

                    <Link href={`/products/${product.id}`}>
                        <Button variant="outline" className="w-full border-2 py-5 rounded-xl">
                            Back to Product Details
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
