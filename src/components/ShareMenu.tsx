'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Share,
    Link as LinkIcon,
    Download,
    MessageCircle,
    Instagram,
    Facebook,
    Twitter,
    Copy,
    Check,
    Globe,
    MoreHorizontal,
    Monitor,
    Loader2
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface ShareMenuProps {
    onDownload: (format: 'svg' | 'pdf') => void;
    onWhatsApp: () => void;
    isDownloading?: boolean;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ onDownload, onWhatsApp, isDownloading = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
            >
                <Share className="w-4 h-4" />
                <span>Share</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                        {/* Copy Link Section */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">Copy Link</h4>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="flex-1 overflow-hidden">
                                    <div className="text-xs text-gray-400 truncate px-1">
                                        {typeof window !== 'undefined' ? window.location.href : ''}
                                    </div>
                                </div>
                                <button
                                    onClick={handleCopyLink}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${copied
                                        ? 'bg-green-500 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'
                                        }`}
                                >
                                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Action Grid */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Share & Download</h4>
                            <div className="grid grid-cols-4 gap-4">
                                <ShareOption
                                    icon={isDownloading ? Loader2 : Download}
                                    label={isDownloading ? "Wait..." : "Download"}
                                    onClick={() => {
                                        if (isDownloading) return;
                                        onDownload('pdf');
                                        // Don't close if downloading starts
                                    }}
                                    color={isDownloading ? "bg-blue-50 text-blue-400 cursor-wait" : "bg-blue-50 text-blue-600"}
                                    iconClassName={isDownloading ? "animate-spin" : ""}
                                />
                                <ShareOption
                                    icon={WhatsAppIcon}
                                    label="WhatsApp"
                                    onClick={() => {
                                        onWhatsApp();
                                        setIsOpen(false);
                                    }}
                                    color="bg-green-50 text-green-600"
                                />
                                <ShareOption
                                    icon={Globe}
                                    label="Public link"
                                    onClick={handleCopyLink}
                                    color="bg-purple-50 text-purple-600"
                                />
                                <ShareOption
                                    icon={MoreHorizontal}
                                    label="More"
                                    onClick={() => { }}
                                    color="bg-gray-50 text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Social Placeholders */}
                        <div className="pt-2 border-t border-gray-50">
                            <div className="grid grid-cols-4 gap-4">
                                <ShareOption icon={Instagram} label="Instagram" onClick={() => { }} color="bg-pink-50 text-pink-600" />
                                <ShareOption icon={Facebook} label="Facebook" onClick={() => { }} color="bg-indigo-50 text-indigo-600" />
                                <ShareOption icon={Twitter} label="X / Twitter" onClick={() => { }} color="bg-slate-900 text-white" />
                                <ShareOption icon={Monitor} label="Present" onClick={() => { }} color="bg-indigo-600 text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface ShareOptionProps {
    icon: any;
    label: string;
    onClick: () => void;
    color: string;
    iconClassName?: string;
}

const ShareOption: React.FC<ShareOptionProps> = ({ icon: Icon, label, onClick, color, iconClassName = "" }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center gap-1.5 group outline-none"
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm group-hover:shadow-md group-hover:scale-110 active:scale-95 ${color}`}>
            <Icon className={`w-5 h-5 ${iconClassName}`} />
        </div>
        <span className="text-[10px] font-medium text-gray-500 group-hover:text-gray-900 text-center leading-tight">
            {label}
        </span>
    </button>
);
