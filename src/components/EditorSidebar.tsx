'use client';

import React, { useState, useRef } from 'react';
import { Layout, Type, Shapes, Upload, Grid3X3, Image as ImageIcon, ChevronLeft, Download, X, QrCode, Loader2, Hexagon, ArrowRight, Square, Pentagon, ArrowLeft, ArrowUp, ArrowDown, ChevronRight as ChevronIcon } from 'lucide-react';
import { generateQRCode } from '@/app/actions';
import { TemplateSelector } from './TemplateSelector';
import { TemplateId, DesignConfig } from '@/lib/types';
import { Button } from './ui/Button';

// Reusing icons from DesignSidebar
import { Phone, Mail, MapPin, Globe, Star, Heart, Clock, Calendar, User, Building, Facebook, Instagram, Twitter, Linkedin, Youtube, MessageCircle } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface EditorSidebarProps {
    // Template Props
    selectedTemplateId: TemplateId | undefined;
    onSelectTemplate: (id: TemplateId) => void;

    // Design Props
    onAddText: (type: 'heading' | 'subheading' | 'body') => void;
    onAddIcon: (iconName: string) => void;
    onAddShape: (type: 'rect' | 'circle' | 'line' | 'triangle') => void;
    onAddImage: (imageUrl: string) => void;
    onTabChange?: (tab: TabType | null) => void; // New prop
    currentProductId?: string;
    aspectRatio?: number;
}

export type TabType = 'templates' | 'text' | 'elements' | 'uploads';

const SOCIAL_ICONS = [
    { name: 'facebook', icon: Facebook, label: 'Facebook', color: '#1877F2' },
    { name: 'instagram', icon: Instagram, label: 'Instagram', color: '#E4405F' },
    { name: 'x', icon: X, label: 'X', color: '#000000' },
    { name: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
    { name: 'youtube', icon: Youtube, label: 'YouTube', color: '#FF0000' },
    { name: 'whatsapp', icon: WhatsAppIcon, label: 'WhatsApp', color: '#25D366' },
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
    onTabChange,
    currentProductId,
    aspectRatio
}: EditorSidebarProps) {
    const [activeTab, setActiveTab] = useState<TabType | null>(null);

    // Notify parent of tab changes
    React.useEffect(() => {
        onTabChange?.(activeTab);
    }, [activeTab, onTabChange]);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [customIcons, setCustomIcons] = useState<string[]>([]);
    const [qrText, setQrText] = useState('');
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const iconFileInputRef = useRef<HTMLInputElement>(null);

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
                setUploadedImages(prev => [...prev, imageUrl]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                setCustomIcons(prev => [...prev, imageUrl]);
                onAddImage(imageUrl); // Automatically add to canvas
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex h-full bg-slate-900 border-r border-white/10">
            {/* 1. Slim Vertical Navigation Rail */}
            <div id="tutorial-sidebar-rail" className="w-[72px] flex flex-col items-center py-4 gap-2 bg-slate-900 border-r border-white/10 z-30 shrink-0 h-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        id={tab.id === 'templates' ? 'tutorial-tab-templates' : undefined}
                        onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                        className={`group relative w-full h-[68px] flex flex-col items-center justify-center gap-1 transition-all duration-200 ${activeTab === tab.id
                            ? 'text-white bg-indigo-600 relative after:content-[""] after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-1 after:bg-white after:rounded-r-full'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <tab.icon className={`w-5 h-5 transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                        <span className="text-[10px] font-bold tracking-wide">
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* 2. Side Panel Content Area */}
            {activeTab && (
                <div className="w-[280px] bg-slate-900 border-r border-white/10 flex flex-col h-full animate-in slide-in-from-left-4 duration-300 z-20 shadow-[4px_0_24px_-8px_rgba(0,0,0,0.5)] relative">

                    {/* Collapse Button - Outside Panel */}
                    <button
                        onClick={() => setActiveTab(null)}
                        className="absolute -right-3 top-1/2 -translate-y-1/2 bg-slate-800 border-2 border-slate-700 text-slate-400 hover:text-white rounded-full p-1 shadow-lg z-50 flex items-center justify-center w-6 h-6 hover:bg-slate-700 hover:scale-110 transition-all"
                        title="Collapse Sidebar"
                    >
                        <ChevronLeft className="w-3 h-3" />
                    </button>
                    {/* Panel Header */}
                    <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-slate-900 sticky top-0 z-10">
                        <h2 className="font-bold text-white text-base tracking-tight">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                    </div>

                    {/* Scrollable Content */}
                    {activeTab === 'templates' && (
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <TemplateSelector
                                selectedTemplateId={selectedTemplateId}
                                onSelect={onSelectTemplate}
                                currentProductId={currentProductId}
                                aspectRatio={aspectRatio}
                            />
                        </div>
                    )}

                    {activeTab === 'text' && (
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <button
                                onClick={() => onAddText('heading')}
                                className="w-full bg-indigo-600 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                            >
                                <Type className="w-5 h-5" />
                                Add Text Box
                            </button>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 mt-6">Typography Styles</p>
                                <div className="grid gap-3">
                                    <button onClick={() => onAddText('heading')} className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-white/5 hover:border-indigo-500/50 transition-all group glass-panel shadow-lg">
                                        <h1 className="text-3xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors leading-none">Heading</h1>
                                    </button>
                                    <button onClick={() => onAddText('subheading')} className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-white/5 hover:border-indigo-500/50 transition-all group glass-panel shadow-lg">
                                        <h2 className="text-xl font-bold text-slate-200 group-hover:text-indigo-400 transition-colors leading-none">Subheading</h2>
                                    </button>
                                    <button onClick={() => onAddText('body')} className="w-full text-left p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-white/5 hover:border-indigo-500/50 transition-all group glass-panel shadow-lg">
                                        <p className="text-base text-slate-300 group-hover:text-indigo-400 transition-colors leading-none">Body text paragraph</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'elements' && (
                        <div className="space-y-8 p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="relative group">
                                <input
                                    type="text"
                                    placeholder="Search elements..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800 transition-all text-sm outline-none text-white placeholder-slate-500"
                                />
                                <Grid3X3 className="w-5 h-5 text-slate-500 absolute left-4 top-3.5 group-focus-within:text-indigo-400 transition-colors" />
                            </div>

                            <input
                                ref={iconFileInputRef}
                                type="file"
                                accept="image/*,image/svg+xml"
                                onChange={handleIconUpload}
                                className="hidden"
                            />

                            {customIcons.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Custom Elements</p>
                                    <div className="grid grid-cols-4 gap-3">
                                        {customIcons.map((icon, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => onAddImage(icon)}
                                                className="aspect-square bg-slate-800/50 border border-white/5 rounded-xl flex items-center justify-center p-2 hover:bg-slate-800 hover:border-indigo-500/50 transition-all glass-panel shadow-lg"
                                            >
                                                <img src={icon} alt="Custom" className="w-full h-full object-contain" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Basic Shapes</p>
                                    <button
                                        onClick={() => iconFileInputRef.current?.click()}
                                        className="py-1 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-400/20 rounded-full transition-colors flex items-center gap-1.5"
                                        title="Upload custom shape"
                                    >
                                        <Upload className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {['rect', 'rect-sharp', 'circle', 'triangle', 'pentagon', 'hexagon', 'star', 'line', 'arrow', 'arrow-left', 'arrow-up', 'arrow-down', 'chevron'].map((shape: any) => (
                                        <button
                                            key={shape}
                                            onClick={() => onAddShape(shape)}
                                            className="aspect-square bg-slate-800/50 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-indigo-400 hover:border-indigo-500/50 transition-all glass-panel shadow-lg"
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

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Social Media</p>
                                    <button
                                        onClick={() => iconFileInputRef.current?.click()}
                                        className="py-1 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-400/20 rounded-full transition-colors flex items-center gap-1.5"
                                        title="Upload custom social icon"
                                    >
                                        <Upload className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {SOCIAL_ICONS.map((iconItem) => (
                                        <button
                                            key={iconItem.name}
                                            onClick={() => onAddIcon(iconItem.name)}
                                            className="aspect-square bg-slate-800/50 border border-white/5 rounded-xl flex items-center justify-center transition-all glass-panel shadow-lg hover:border-indigo-500/50 hover:scale-105 overflow-hidden"
                                            title={iconItem.label}
                                        >
                                            <div
                                                className={`relative flex items-center justify-center transition-transform duration-300 ${iconItem.name === 'youtube' ? 'w-12 h-8 rounded-[8px]' :
                                                    iconItem.name === 'instagram' ? 'w-10 h-10 rounded-[10px]' :
                                                        iconItem.name === 'whatsapp' ? 'w-10 h-10' :
                                                            'w-10 h-10 rounded-full'
                                                    }`}
                                                style={{
                                                    background: iconItem.name === 'instagram'
                                                        ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                                                        : (iconItem.name === 'whatsapp' ? 'transparent' : iconItem.color),
                                                }}
                                            >
                                                {iconItem.name === 'whatsapp' && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <svg viewBox="0 0 24 24" className="w-full h-full text-[#25D366] fill-current">
                                                            <path d="M2.18418 21.3314C2.10236 21.6284 2.37285 21.9025 2.6709 21.8247L7.27824 20.6213C8.7326 21.409 10.37 21.8275 12.0371 21.8275H12.0421C17.5281 21.8275 22 17.3815 22 11.9163C22 9.26735 20.966 6.77594 19.0863 4.90491C17.2065 3.03397 14.7084 2 12.042 2C6.55607 2 2.08411 6.44605 2.08411 11.9114C2.08348 13.65 2.5424 15.3582 3.41479 16.8645L2.18418 21.3314Z" />
                                                        </svg>
                                                        <svg viewBox="0 0 24 24" className="absolute w-5 h-5 text-white fill-current rotate-[15deg] translate-y-[-0.5px]">
                                                            <path d="M8.88595 7.16985C9.06891 7.17475 9.27175 7.18465 9.46474 7.61303C9.59271 7.89821 9.80829 8.42321 9.9839 8.85087C10.1206 9.18366 10.233 9.45751 10.2611 9.51356C10.3254 9.64156 10.365 9.78926 10.2809 9.96156C10.271 9.98188 10.2617 10.0013 10.2526 10.02C10.1852 10.16 10.1372 10.2597 10.0237 10.3899C9.97709 10.4435 9.9285 10.5022 9.88008 10.5607C9.79494 10.6636 9.71035 10.7658 9.63785 10.838C9.50924 10.9659 9.37563 11.1039 9.52402 11.3599C9.6725 11.6159 10.1919 12.4579 11.0087 13.1373C11.833 13.8712 12.4998 14.1805 12.8622 14.3368C12.9325 14.3672 12.9895 14.3918 13.0313 14.4126C13.2886 14.5406 13.4419 14.5209 13.5903 14.3486C13.7388 14.1762 14.2334 13.6001 14.4066 13.3441C14.5748 13.0881 14.7479 13.1275 14.9854 13.2161C15.2228 13.3047 16.4892 13.9251 16.7464 14.0531C16.7972 14.0784 16.8448 14.1012 16.8889 14.1224C17.0678 14.2082 17.1895 14.2665 17.2411 14.3535C17.3054 14.4618 17.3054 14.9739 17.0927 15.5746C16.8751 16.1752 15.8263 16.7513 15.3514 16.7956C15.3064 16.7999 15.2617 16.8053 15.2156 16.8108C14.7804 16.8635 14.228 16.9303 12.2596 16.1555C9.83424 15.2018 8.23322 12.8354 7.90953 12.357C7.88398 12.3192 7.86638 12.2932 7.85698 12.2806L7.8515 12.2733C7.70423 12.0762 6.80328 10.8707 6.80328 9.62685C6.80328 8.43682 7.38951 7.81726 7.65689 7.53467C7.67384 7.51676 7.6895 7.50021 7.70366 7.48494C7.94107 7.22895 8.21814 7.16495 8.39125 7.16495C8.56445 7.16495 8.73756 7.16495 8.88595 7.16985Z" />
                                                        </svg>
                                                    </div>
                                                )}
                                                {iconItem.name === 'facebook' ? (
                                                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current translate-x-[0.5px] translate-y-[0.5px]">
                                                        <path d="M15.12 10.353h-2.803v-1.85c0-.813.539-.999.925-.999.385 0 2.39 0 2.39 0V4.097L12.55 4.09C9.13 4.09 8.356 6.64 8.356 8.328v2.025h-2.01v3.425h2.01v9.64h4.084V13.78H15.12l.465-3.427z" />
                                                    </svg>
                                                ) : iconItem.name === 'linkedin' ? (
                                                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                                                        <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                                                    </svg>
                                                ) : iconItem.name !== 'whatsapp' && (
                                                    <iconItem.icon className="w-5 h-5 text-white" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Icons</p>
                                    <button
                                        onClick={() => iconFileInputRef.current?.click()}
                                        className="py-1 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-400/20 rounded-full transition-colors flex items-center gap-1.5"
                                        title="Upload custom icon"
                                    >
                                        <Upload className="w-3 h-3" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                    {GENERIC_ICONS.map((iconItem) => (
                                        <button
                                            key={iconItem.name}
                                            onClick={() => onAddIcon(iconItem.name)}
                                            className="aspect-square bg-slate-800/50 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-indigo-400 hover:border-indigo-500/50 transition-all glass-panel shadow-lg"
                                            title={iconItem.label}
                                        >
                                            <iconItem.icon className="w-6 h-6" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'uploads' && (
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-indigo-500/10 text-indigo-400 py-10 px-4 rounded-2xl border-2 border-dashed border-indigo-500/20 hover:border-indigo-500/50 hover:bg-indigo-500/20 transition-all flex flex-col items-center justify-center gap-4 group shadow-lg"
                            >
                                <div className="w-14 h-14 bg-slate-800 rounded-full shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform border border-white/5">
                                    <Upload className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-sm uppercase tracking-widest text-indigo-100">Upload Media</p>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">JPG, PNG or SVG</p>
                                </div>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            <div className="mt-8">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-4">Your Library</p>
                                {uploadedImages.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {uploadedImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => onAddImage(img)}
                                                className="group relative aspect-square bg-slate-800/50 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 hover:shadow-xl transition-all"
                                            >
                                                <img src={img} alt="Uploaded" className="w-full h-full object-cover p-2" />
                                                <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <div className="bg-white p-2 rounded-full shadow-lg scale-75 group-hover:scale-100 transition-transform">
                                                        <ArrowRight className="w-4 h-4 text-indigo-600" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border-2 border-dashed border-white/5">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No uploads yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
}
