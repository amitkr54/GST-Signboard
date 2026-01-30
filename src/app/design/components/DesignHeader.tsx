'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ShareMenu } from '@/components/ShareMenu';

interface DesignHeaderProps {
    handleUpdateMaster: () => void | Promise<void>;
    isSaving: boolean;
    handleDownload: (format: 'svg' | 'pdf') => void | Promise<void>;
    handleWhatsApp: () => void | Promise<void>;
    isDownloading: boolean;
    isAdmin: boolean;
}

export function DesignHeader({
    handleUpdateMaster,
    isSaving,
    handleDownload,
    handleWhatsApp,
    isDownloading,
    isAdmin
}: DesignHeaderProps) {
    return (
        <div className="h-12 bg-white border-b grid grid-cols-[1fr_auto_1fr] items-center px-6 shrink-0 z-20">
            <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <div className="text-[#6366f1] w-6 h-6 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                            <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.2-6.2-4.5-6.2 4.5 2.3-7.2-6.1-4.5h7.6z" />
                        </svg>
                    </div>
                    <span className="font-bold text-gray-900 text-lg tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>SignagePro</span>
                </Link>
            </div>

            <div className="flex justify-center min-w-[400px]">
                <div id="toolbar-header-target" className="w-full flex justify-center h-12 relative pointer-events-auto" />
            </div>

            <div className="flex items-center justify-end gap-4">
                {isAdmin && (
                    <Button
                        onClick={handleUpdateMaster}
                        disabled={isSaving}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-1.5 h-auto text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-lg shadow-red-500/20"
                    >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
                        Update Master
                    </Button>
                )}

                <ShareMenu onDownload={handleDownload} onWhatsApp={handleWhatsApp} isDownloading={isDownloading} />
            </div>
        </div>
    );
}
