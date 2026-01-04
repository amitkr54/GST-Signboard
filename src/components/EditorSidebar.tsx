'use client';

import React, { useState, useRef } from 'react';
import { Layout, Type, Shapes, Upload, Grid3X3, Image as ImageIcon, ChevronLeft, Palette, Download, X, QrCode, Loader2, Hexagon, ArrowRight, Square, Pentagon, ArrowLeft, ArrowUp, ArrowDown, ChevronRight as ChevronIcon } from 'lucide-react';
import { generateQRCode } from '@/app/actions';
import { TemplateSelector } from './TemplateSelector';
import { TemplateId, DesignConfig } from '@/lib/types';
import { Button } from './ui/Button';

// Reusing icons from DesignSidebar

import { Phone, Mail, MapPin, Globe, Star, Heart, Clock, Calendar, User, Building, Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle } from 'lucide-react';

interface EditorSidebarProps {
    // Template Props
    selectedTemplateId: TemplateId | undefined;
    onSelectTemplate: (id: TemplateId) => void;

    // Design Props
    onAddText: (type: 'heading' | 'subheading' | 'body') => void;
    onAddIcon: (iconName: string) => void;
    onAddShape: (type: 'rect' | 'circle' | 'line' | 'triangle') => void;
    onAddImage: (imageUrl: string) => void;

    // Design Controls Props
    design: DesignConfig;
    onDesignChange: (design: DesignConfig) => void;
}

type TabType = 'templates' | 'text' | 'elements' | 'uploads';

const SOCIAL_ICONS = [
    { name: 'facebook', icon: Facebook, label: 'Facebook', color: '#1877F2' },
    { name: 'instagram', icon: Instagram, label: 'Instagram', color: '#E4405F' },
    { name: 'twitter', icon: Twitter, label: 'Twitter', color: '#1DA1F2' },
    { name: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
    { name: 'youtube', icon: Youtube, label: 'YouTube', color: '#FF0000' },
    { name: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: '#25D366' },
];

const GENERIC_ICONS = [
    { name: 'phone', icon: Phone, label: 'Phone' },
    { name: 'mail', icon: Mail, label: 'Email' },
    { name: 'location', icon: MapPin, label: 'Location' },
    { name: 'globe', icon: Globe, label: 'Website' },
    { name: 'star', icon: Star, label: 'Star' },
    { name: 'heart', icon: Heart, label: 'Heart' },
    { name: 'clock', icon: Clock, label: 'Clock' },
    { name: 'calendar', icon: Calendar, label: 'Calendar' },
    { name: 'user', icon: User, label: 'User' },
    { name: 'building', icon: Building, label: 'Building' },
];

export function EditorSidebar({
    selectedTemplateId,
    onSelectTemplate,
    onAddText,
    onAddIcon,
    onAddShape,
    onAddImage,
    design,
    onDesignChange
}: EditorSidebarProps) {
    const [activeTab, setActiveTab] = useState<TabType | null>(null);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [qrText, setQrText] = useState('');
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const tabs = [
        { id: 'templates' as TabType, icon: Layout, label: 'Templates' },
        { id: 'text' as TabType, icon: Type, label: 'Text' },
        { id: 'elements' as TabType, icon: Grid3X3, label: 'Elements' },
        { id: 'uploads' as TabType, icon: Upload, label: 'Uploads' },
    ];

    const handleQRSubmit = async () => {
        if (!qrText.trim()) return;
        setIsGeneratingQR(true);
        try {
            const result = await generateQRCode(qrText);
            if (result.success && result.dataUrl) {
                onAddImage(result.dataUrl);
                setQrText('');
            } else {
                alert('Failed to generate QR Code');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingQR(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                // Simple pass-through for now, can add bg removal logic if needed
                setUploadedImages(prev => [...prev, imageUrl]);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex h-full bg-white border-r border-gray-200">
            {/* 1. Slim Vertical Navigation Rail */}
            <div className="w-[72px] flex flex-col items-center py-6 gap-4 bg-slate-900 text-slate-400 z-10 shrink-0 h-full shadow-xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                        className={`group relative w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all duration-300 ${activeTab === tab.id
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'hover:bg-slate-800 hover:text-white'
                            }`}
                    >
                        <tab.icon className={`w-5 h-5 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                        {/* Tooltip-like Label on Hover (if not active) */}
                        <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* 2. Side Panel Content Area */}
            {activeTab && (
                <div className="w-[340px] bg-white border-r border-gray-200 flex flex-col h-full animate-in slide-in-from-left duration-300 shadow-2xl z-20">
                    {/* Panel Header */}
                    <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                        <h2 className="font-bold text-gray-900 text-xl tracking-tight">{tabs.find(t => t.id === activeTab)?.label}</h2>
                        <button
                            onClick={() => setActiveTab(null)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {activeTab === 'templates' && (
                            <div className="space-y-6">
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <h3 className="text-indigo-900 font-semibold mb-1">Start with a Template</h3>
                                    <p className="text-sm text-indigo-700/80">Select a layout below to jumpstart your design.</p>
                                </div>
                                <TemplateSelector
                                    selectedTemplateId={selectedTemplateId}
                                    onSelect={(id) => {
                                        onSelectTemplate(id);
                                        // Auto-switch to text tab instead of design since design is gone
                                        setActiveTab('text');
                                    }}
                                />
                            </div>
                        )}

                        {activeTab === 'text' && (
                            <div className="space-y-8">
                                <button
                                    onClick={() => onAddText('heading')}
                                    className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                                >
                                    <Type className="w-5 h-5" />
                                    Add Text Box
                                </button>

                                <div className="space-y-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Typography Styles</p>
                                    <div className="grid gap-3">
                                        <button onClick={() => onAddText('heading')} className="w-full text-left p-4 hover:bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all group bg-white shadow-sm hover:shadow-md">
                                            <h1 className="text-3xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">Heading</h1>
                                            <p className="text-xs text-gray-400 mt-1 font-medium">Extra Bold • 32pt</p>
                                        </button>
                                        <button onClick={() => onAddText('subheading')} className="w-full text-left p-4 hover:bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all group bg-white shadow-sm hover:shadow-md">
                                            <h2 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">Subheading</h2>
                                            <p className="text-xs text-gray-400 mt-1 font-medium">Bold • 24pt</p>
                                        </button>
                                        <button onClick={() => onAddText('body')} className="w-full text-left p-4 hover:bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all group bg-white shadow-sm hover:shadow-md">
                                            <p className="text-base text-gray-600 group-hover:text-indigo-600 transition-colors">Body text paragraph</p>
                                            <p className="text-xs text-gray-400 mt-1 font-medium">Regular • 16pt</p>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'elements' && (
                            <div className="space-y-8">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Search elements..."
                                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm outline-none"
                                    />
                                    <Grid3X3 className="w-5 h-5 text-gray-400 absolute left-4 top-3.5 group-focus-within:text-indigo-500 transition-colors" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-sm font-bold text-gray-900">Basic Shapes</p>
                                    </div>
                                    <div className="grid grid-cols-4 gap-3">
                                        {['rect', 'rect-sharp', 'circle', 'triangle', 'pentagon', 'hexagon', 'star', 'line', 'arrow', 'arrow-left', 'arrow-up', 'arrow-down', 'chevron'].map((shape: any) => (
                                            <button
                                                key={shape}
                                                onClick={() => onAddShape(shape)}
                                                className="aspect-square bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm hover:shadow-md"
                                                title={shape.replace('-', ' ')}
                                            >
                                                {shape === 'rect' && <div className="w-8 h-6 bg-current rounded-sm" />}
                                                {shape === 'rect-sharp' && <Square className="w-6 h-6 fill-current" />}
                                                {shape === 'circle' && <div className="w-7 h-7 bg-current rounded-full" />}
                                                {shape === 'triangle' && <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-current" />}
                                                {shape === 'pentagon' && <Pentagon className="w-6 h-6 fill-current" />}
                                                {shape === 'hexagon' && <Hexagon className="w-6 h-6 fill-current" />}
                                                {shape === 'star' && <Star className="w-6 h-6 fill-current" />}
                                                {shape === 'line' && <div className="w-8 h-1 bg-current rounded-full" />}
                                                {shape === 'arrow' && <ArrowRight className="w-6 h-6" />}
                                                {shape === 'arrow-left' && <ArrowLeft className="w-6 h-6" />}
                                                {shape === 'arrow-up' && <ArrowUp className="w-6 h-6" />}
                                                {shape === 'arrow-down' && <ArrowDown className="w-6 h-6" />}
                                                {shape === 'chevron' && <ChevronIcon className="w-6 h-6" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-sm font-bold text-gray-900 mb-4">Social Media</p>
                                    <div className="grid grid-cols-4 gap-3">
                                        {SOCIAL_ICONS.map((iconItem) => (
                                            <button
                                                key={iconItem.name}
                                                onClick={() => onAddIcon(iconItem.name)}
                                                className="aspect-square bg-white border border-gray-100 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-md hover:scale-105"
                                                title={iconItem.label}
                                            >
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300"
                                                    style={{ backgroundColor: iconItem.color }}
                                                >
                                                    <iconItem.icon className="w-5 h-5 text-white" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-sm font-bold text-gray-900 mb-4">Icons</p>
                                    <div className="grid grid-cols-4 gap-3">
                                        {GENERIC_ICONS.map((iconItem) => (
                                            <button
                                                key={iconItem.name}
                                                onClick={() => onAddIcon(iconItem.name)}
                                                className="aspect-square bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-md transition-all shadow-sm"
                                                title={iconItem.label}
                                            >
                                                <iconItem.icon className="w-6 h-6" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <QrCode className="w-4 h-4 text-indigo-600" />
                                        <p className="text-sm font-bold text-gray-900">QR Code</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4">
                                        <input
                                            type="text"
                                            value={qrText}
                                            onChange={(e) => setQrText(e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && handleQRSubmit()}
                                        />
                                        <Button
                                            onClick={handleQRSubmit}
                                            disabled={!qrText.trim() || isGeneratingQR}
                                            className="w-full justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-10 shadow-md"
                                        >
                                            {isGeneratingQR ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate QR'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'uploads' && (
                            <div className="space-y-6">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-indigo-50 text-indigo-600 py-8 px-4 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-100 transition-all flex flex-col items-center justify-center gap-3 group"
                                >
                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <span className="font-semibold text-sm">Upload Image</span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                <div>
                                    <p className="text-sm font-bold text-gray-900 mb-4">Your Uploads</p>
                                    {uploadedImages.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {uploadedImages.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => onAddImage(img)}
                                                    className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all"
                                                >
                                                    <img src={img} alt="Uploaded" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <div className="bg-white/90 p-2 rounded-full shadow-sm">
                                                            <ArrowRight className="w-4 h-4 text-indigo-600" />
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 px-4">
                                            <p className="text-sm text-gray-400">No images uploaded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
