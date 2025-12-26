'use client';

import React, { useState, useRef } from 'react';
import { Layout, Type, Shapes, Upload, Grid3X3, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import { TemplateSelector } from './TemplateSelector';
import { TemplateId } from '@/lib/types';
import { Button } from './ui/Button';

// Reusing icons from DesignSidebar
import { Phone, Mail, MapPin, Globe, Star, Heart, Clock, Calendar, User, Building } from 'lucide-react';

interface EditorSidebarProps {
    // Template Props
    selectedTemplateId: TemplateId | undefined;
    onSelectTemplate: (id: TemplateId) => void;

    // Design Props
    onAddText: (type: 'heading' | 'subheading' | 'body') => void;
    onAddIcon: (iconName: string) => void;
    onAddShape: (type: 'rect' | 'circle' | 'line' | 'triangle') => void;
    onAddImage: (imageUrl: string) => void;
}

type TabType = 'templates' | 'text' | 'elements' | 'uploads';

const ICONS = [
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
    onAddImage
}: EditorSidebarProps) {
    const [activeTab, setActiveTab] = useState<TabType | null>('templates');
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                // Simple pass-through for now, can add bg removal logic if needed
                setUploadedImages(prev => [...prev, imageUrl]);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex h-full bg-white border-r border-gray-200">
            {/* 1. Slim Vertical Navigation Rail */}
            <div className="w-[72px] flex flex-col items-center py-4 gap-4 bg-slate-900 text-slate-400 z-10 shrink-0 h-full">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-14 h-14 flex flex-col items-center justify-center rounded-lg transition-all duration-200 group ${activeTab === tab.id
                                ? 'bg-slate-800 text-white'
                                : 'hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                        title={tab.label}
                    >
                        <tab.icon className={`w-6 h-6 mb-1 ${activeTab === tab.id ? 'text-indigo-400' : ''}`} />
                        <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* 2. Side Panel Content Area */}
            {activeTab && (
                <div className="w-[320px] bg-white border-r border-gray-200 flex flex-col h-full animate-slide-in-right">

                    {/* Panel Header */}
                    <div className="h-14 px-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <h2 className="font-bold text-gray-900 text-lg capitalize">{activeTab}</h2>
                        <button
                            onClick={() => setActiveTab(null)}
                            className="p-1 hover:bg-gray-100 rounded-full md:hidden"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                        {/* TEMPLATES PANEL */}
                        {activeTab === 'templates' && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500">Choose a layout to start designed.</p>
                                <TemplateSelector
                                    selectedTemplateId={selectedTemplateId}
                                    onSelect={onSelectTemplate}
                                />
                            </div>
                        )}

                        {/* TEXT PANEL */}
                        {activeTab === 'text' && (
                            <div className="space-y-6">
                                <button
                                    onClick={() => onAddText('heading')}
                                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Type className="w-5 h-5" />
                                    Add a text box
                                </button>

                                <div className="space-y-3 pt-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Default Styles</p>

                                    <button onClick={() => onAddText('heading')} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all group">
                                        <h1 className="text-3xl font-black text-gray-800 group-hover:text-indigo-600">Add a heading</h1>
                                    </button>

                                    <button onClick={() => onAddText('subheading')} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all group">
                                        <h2 className="text-xl font-bold text-gray-700 group-hover:text-indigo-600">Add a subheading</h2>
                                    </button>

                                    <button onClick={() => onAddText('body')} className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-all group">
                                        <p className="text-base text-gray-600 group-hover:text-indigo-600">Add a little bit of body text</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ELEMENTS PANEL */}
                        {activeTab === 'elements' && (
                            <div className="space-y-6">
                                {/* Search Placeholder */}
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search shapes & icons..."
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                                    />
                                    <Grid3X3 className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                </div>

                                {/* Basic Shapes */}
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 mb-3">Shapes</p>
                                    <div className="grid grid-cols-4 gap-3">
                                        {['rect', 'circle', 'triangle', 'line'].map((shape: any) => (
                                            <button
                                                key={shape}
                                                onClick={() => onAddShape(shape)}
                                                className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                                            >
                                                {shape === 'rect' && <div className="w-8 h-6 bg-current rounded-sm" />}
                                                {shape === 'circle' && <div className="w-7 h-7 bg-current rounded-full" />}
                                                {shape === 'triangle' && <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-current" />}
                                                {shape === 'line' && <div className="w-8 h-1 bg-current rounded-full" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Icons */}
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 mb-3">Icons</p>
                                    <div className="grid grid-cols-4 gap-3">
                                        {ICONS.map((iconItem) => (
                                            <button
                                                key={iconItem.name}
                                                onClick={() => onAddIcon(iconItem.name)}
                                                className="aspect-square bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-sm transition-all"
                                                title={iconItem.label}
                                            >
                                                <iconItem.icon className="w-5 h-5" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* UPLOADS PANEL */}
                        {activeTab === 'uploads' && (
                            <div className="space-y-6">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Upload className="w-5 h-5" />
                                    Upload Image
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                {uploadedImages.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {uploadedImages.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => onAddImage(img)}
                                                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-indigo-500 transition-all"
                                            >
                                                <img src={img} alt="Uploaded" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-gray-400">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">No media yet</p>
                                        <p className="text-xs text-gray-500 mt-1">Upload images to use in your design</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </div>
    );
}
