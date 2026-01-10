'use client';

import React from 'react';
import { X, Loader2, QrCode } from 'lucide-react';

interface QRGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrText: string;
    setQrText: (text: string) => void;
    isGenerating: boolean;
    onGenerate: () => void;
}

export function QRGeneratorModal({
    isOpen,
    onClose,
    qrText,
    setQrText,
    isGenerating,
    onGenerate
}: QRGeneratorModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Add QR Code</h3>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Enter a URL or text to generate a QR code for your signage.</p>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={qrText}
                            onChange={(e) => setQrText(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && onGenerate()}
                        />
                        <button
                            onClick={onGenerate}
                            disabled={!qrText.trim() || isGenerating}
                            className="w-full py-3.5 bg-[#7D2AE8] text-white rounded-xl font-bold shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <QrCode className="w-5 h-5" />
                                    Generate QR Code
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
