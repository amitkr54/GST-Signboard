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
        <div className="space-y-4 p-6 bg-white/5 rounded-3xl border border-white/10 shadow-xl backdrop-blur-md">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-white uppercase tracking-tight">
                <FileImage className="w-5 h-5 text-indigo-400" />
                Upload Pre-Designed Signage
            </h2>

            <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-indigo-500/50 hover:bg-white/5 transition-all">
                {preview ? (
                    <div className="relative">
                        <img
                            src={preview}
                            alt="Uploaded design"
                            className="max-h-48 mx-auto rounded-lg border border-white/10 shadow-2xl"
                        />
                        <button
                            onClick={handleClear}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <p className="text-sm text-indigo-300 mt-4 font-bold">Design uploaded successfully!</p>
                    </div>
                ) : (
                    <label className="cursor-pointer group">
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-indigo-400" />
                        </div>
                        <p className="text-sm font-bold text-white">
                            Click to upload your design
                        </p>
                        <p className="text-xs text-indigo-300/50 mt-1 uppercase tracking-widest font-black">
                            PNG, JPG, SVG or PDF (max 10MB)
                        </p>
                    </label>
                )}
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
                <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                    <strong className="text-indigo-400 mr-1 uppercase tracking-wider">Note:</strong>
                    If you upload a pre-designed file, it will replace the custom design options below.
                </p>
            </div>
        </div>
    );
}
