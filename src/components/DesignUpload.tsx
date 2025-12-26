'use client';

import React, { useState } from 'react';
import { Upload, FileImage, X } from 'lucide-react';

interface DesignUploadProps {
    onUpload: (file: File, previewUrl: string) => void;
    currentDesign?: string;
}

export function DesignUpload({ onUpload, currentDesign }: DesignUploadProps) {
    const [preview, setPreview] = useState<string | undefined>(currentDesign);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'application/pdf'];
            if (!validTypes.includes(file.type)) {
                alert('Please upload a valid image file (PNG, JPG, SVG, or PDF)');
                return;
            }

            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreview(url);
            onUpload(file, url);
        }
    };

    const handleClear = () => {
        setPreview(undefined);
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                <FileImage className="w-5 h-5" />
                Upload Pre-Designed Signage
            </h2>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-purple-400 transition-colors">
                {preview ? (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Uploaded design"
                            className="max-h-48 mx-auto rounded-lg border shadow-sm"
                        />
                        <button
                            onClick={handleClear}
                            className="absolute top-2 right-2 bg-gray-900/80 text-white p-1 rounded-full hover:bg-gray-900 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <p className="text-sm text-gray-600 mt-2">Design uploaded successfully!</p>
                    </div>
                ) : (
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Upload className="w-12 h-12 mx-auto text-purple-400 mb-2" />
                        <p className="text-sm font-medium text-gray-800">
                            Click to upload your design
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, SVG or PDF (max 10MB)
                        </p>
                    </label>
                )}
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-xs text-purple-800">
                    <strong>Note:</strong> If you upload a pre-designed file, it will replace the custom design options below.
                </p>
            </div>
        </div>
    );
}
