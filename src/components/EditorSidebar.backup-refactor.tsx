'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Layout, Type, Shapes, Upload, Grid3X3, Image as ImageIcon, ChevronLeft, Download, X, QrCode, Loader2, Hexagon, ArrowRight, Square, Pentagon, ArrowLeft, ArrowUp, ArrowDown, ChevronRight as ChevronIcon, Bookmark, Plus } from 'lucide-react';
import { generateQRCode, saveToLibrary, getMasterAssets } from '@/app/actions';
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
    onAddShapeSVG: (url: string) => void;
    onAddImage: (imageUrl: string) => void;
    onTabChange?: (tab: TabType | null) => void;
    currentProductId?: string;
    aspectRatio?: number;
    templates?: any[];
    isAdmin?: boolean;
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
    onAddShapeSVG,
    onAddImage,
    onTabChange,
    currentProductId,
    aspectRatio,
    templates,
    isAdmin = false
}: EditorSidebarProps) {
    const [activeTab, setActiveTab] = useState<TabType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Notify parent of tab changes
    useEffect(() => {
        onTabChange?.(activeTab);
    }, [activeTab, onTabChange]);

    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [masterAssets, setMasterAssets] = useState<string[]>([]);
    const [isLoadingMaster, setIsLoadingMaster] = useState(false);
    const [qrText, setQrText] = useState('');
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const iconFileInputRef = useRef<HTMLInputElement>(null);
    const svgFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchMaster = async () => {
            setIsLoadingMaster(true);
            const assets = await getMasterAssets();
            setMasterAssets(assets);
            setIsLoadingMaster(false);
        };
        fetchMaster();
    }, []);

    const tabs = [
        { id: 'templates' as TabType, icon: Layout, label: 'Templates' },
        { id: 'text' as TabType, icon: Type, label: 'Text' },
        { id: 'elements' as TabType, icon: Grid3X3, label: 'Elements' },
        { id: 'uploads' as TabType, icon: Upload, label: 'Uploads' },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                setUploadedImages(prev => [imageUrl, ...prev]);
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
                onAddImage(imageUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSvgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            onAddShapeSVG(url);
        }
    };

    const handleSaveToLibrary = async (imageUrl: string) => {
        if (!isAdmin) return;
        try {
            const res = await saveToLibrary(imageUrl, '1234');
            if (res.success) {
                alert('Saved to Master Library!');
                const assets = await getMasterAssets();
                setMasterAssets(assets);
            } else {
                alert('Failed to save: ' + res.error);
            }
        } catch (err) {
            console.error(err);
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
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {activeTab === 'templates' && (
                            <div className="p-6">
                                <TemplateSelector
                                    selectedTemplateId={selectedTemplateId}
                                    onSelect={onSelectTemplate}
                                    currentProductId={currentProductId}
                                    aspectRatio={aspectRatio}
                                    templates={templates}
                                />
                            </div>
                        )}

                        {activeTab === 'text' && (
                            <div className="p-6 space-y-6">
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
                            <div className="space-y-8 p-6">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        placeholder="Search elements..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-slate-800 transition-all text-sm outline-none text-white placeholder-slate-500"
                                    />
                                    <Grid3X3 className="w-5 h-5 text-slate-500 absolute left-4 top-3.5 group-focus-within:text-indigo-400 transition-colors" />
                                </div>

                                <input
                                    ref={iconFileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleIconUpload}
                                    className="hidden"
                                />

                                <input
                                    ref={svgFileInputRef}
                                    type="file"
                                    accept=".svg"
                                    onChange={handleSvgUpload}
                                    className="hidden"
                                />

                                {/* BASIC SHAPES */}
                                {(() => {
                                    const shapes = ['rect', 'rect-sharp', 'circle', 'triangle', 'pentagon', 'hexagon', 'star', 'line', 'arrow', 'arrow-left', 'arrow-up', 'arrow-down', 'chevron'];
                                    const filteredShapes = shapes.filter(s => s.replace('-', ' ').toLowerCase().includes(searchTerm.toLowerCase()));
                                    if (filteredShapes.length === 0 && searchTerm !== '') return null;
                                    return (
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Basic Shapes</p>
                                                {searchTerm === '' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => svgFileInputRef.current?.click()}
                                                            className="py-1 px-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-400/20 rounded-full transition-colors flex items-center gap-1.5"
                                                            title="Upload editable SVG shape"
                                                        >
                                                            <Upload className="w-3 h-3" />
                                                            <span className="text-[10px] font-bold uppercase tracking-wider">Upload SVG</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-4 gap-3">
                                                {filteredShapes.map((shape) => (
                                                    <button
                                                        key={shape}
                                                        onClick={() => onAddShape(shape as any)}
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
                                    );
                                })()}

                                {/* SOCIAL MEDIA */}
                                {(() => {
                                    const filteredSocial = SOCIAL_ICONS.filter(i => i.label.toLowerCase().includes(searchTerm.toLowerCase()));
                                    if (filteredSocial.length === 0) return null;
                                    return (
                                        <div className="pt-4 border-t border-white/5">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-4">Social Media</p>
                                            <div className="grid grid-cols-4 gap-3">
                                                {filteredSocial.map((item) => (
                                                    <button
                                                        key={item.name}
                                                        onClick={() => onAddIcon(item.name)}
                                                        className="aspect-square bg-slate-800/50 border border-white/5 rounded-xl flex items-center justify-center transition-all glass-panel shadow-lg hover:border-indigo-500/50 hover:scale-105 overflow-hidden"
                                                        title={item.label}
                                                    >
                                                        <div
                                                            className={`relative flex items-center justify-center transition-transform duration-300 ${item.name === 'youtube' ? 'w-12 h-8 rounded-[8px]' :
                                                                item.name === 'instagram' ? 'w-10 h-10 rounded-[10px]' :
                                                                    item.name === 'whatsapp' ? 'w-10 h-10' :
                                                                        'w-10 h-10 rounded-full'
                                                                }`}
                                                            style={{
                                                                background: item.name === 'instagram'
                                                                    ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                                                                    : (item.name === 'whatsapp' ? 'transparent' : item.color),
                                                            }}
                                                        >
                                                            {item.name === 'whatsapp' ? (
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <svg viewBox="0 0 24 24" className="w-full h-full text-[#25D366] fill-current">
                                                                        <path d="M2.18418 21.3314C2.10236 21.6284 2.37285 21.9025 2.6709 21.8247L7.27824 20.6213C8.7326 21.409 10.37 21.8275 12.0371 21.8275H12.0421C17.5281 21.8275 22 17.3815 22 11.9163C22 9.26735 20.966 6.77594 19.0863 4.90491C17.2065 3.03397 14.7084 2 12.042 2C6.55607 2 2.08411 6.44605 2.08411 11.9114C2.08348 13.65 2.5424 15.3582 3.41479 16.8645L2.18418 21.3314Z" />
                                                                    </svg>
                                                                </div>
                                                            ) : item.name === 'facebook' ? (
                                                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current translate-x-[0.5px] translate-y-[0.5px]">
                                                                    <path d="M15.12 10.353h-2.803v-1.85c0-.813.539-.999.925-.999.385 0 2.39 0 2.39 0V4.097L12.55 4.09C9.13 4.09 8.356 6.64 8.356 8.328v2.025h-2.01v3.425h2.01v9.64h4.084V13.78H15.12l.465-3.427z" />
                                                                </svg>
                                                            ) : item.name === 'linkedin' ? (
                                                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
                                                                    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                                                                </svg>
                                                            ) : (
                                                                <item.icon className="w-5 h-5 text-white" />
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* GENERIC ICONS */}
                                {(() => {
                                    const filteredIcons = GENERIC_ICONS.filter(i => i.label.toLowerCase().includes(searchTerm.toLowerCase()));
                                    if (filteredIcons.length === 0) return null;
                                    return (
                                        <div className="pt-4 border-t border-white/5">
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-4">Icons</p>
                                            <div className="grid grid-cols-4 gap-3">
                                                {filteredIcons.map((item) => (
                                                    <button
                                                        key={item.name}
                                                        onClick={() => onAddIcon(item.name)}
                                                        className="aspect-square bg-slate-800/50 border border-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-indigo-400 hover:border-indigo-500/50 transition-all glass-panel shadow-lg"
                                                        title={item.label}
                                                    >
                                                        <item.icon className="w-6 h-6" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {activeTab === 'uploads' && (
                            <div className="p-6 space-y-8">
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

                                {(masterAssets.length > 0 || isLoadingMaster) && (
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-4 flex items-center gap-2">
                                            <Bookmark className="w-3 h-3 text-indigo-400" />
                                            Master Library
                                        </p>
                                        {isLoadingMaster ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3 mb-8">
                                                {masterAssets.map((img, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => onAddImage(img)}
                                                        className="group relative aspect-square bg-slate-800/20 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 hover:shadow-xl transition-all"
                                                    >
                                                        <img src={img} alt="Library" className="w-full h-full object-cover p-2" />
                                                        <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="bg-white p-2 rounded-full shadow-lg scale-75 group-hover:scale-100 transition-transform">
                                                                <Plus className="w-4 h-4 text-indigo-600" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 mb-4">Your Uploads</p>
                                    {uploadedImages.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {uploadedImages.map((img, idx) => (
                                                <div key={idx} className="group relative aspect-square bg-slate-800/50 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/50 hover:shadow-xl transition-all">
                                                    <button
                                                        onClick={() => onAddImage(img)}
                                                        className="w-full h-full"
                                                    >
                                                        <img src={img} alt="Uploaded" className="w-full h-full object-cover p-2" />
                                                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <div className="bg-white p-2 rounded-full shadow-lg scale-75 group-hover:scale-100 transition-transform">
                                                                <ArrowRight className="w-4 h-4 text-indigo-600" />
                                                            </div>
                                                        </div>
                                                    </button>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSaveToLibrary(img); }}
                                                            className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-700 shadow-lg"
                                                            title="Save to Master Library"
                                                        >
                                                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                                                        </button>
                                                    )}
                                                </div>
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
                </div>
            )}
        </div>
    );
}
