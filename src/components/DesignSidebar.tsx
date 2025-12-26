'use client';

import React, { useState, useRef } from 'react';
import { Type, Shapes, Upload, Grid3X3, Phone, Mail, MapPin, Globe, Star, Heart, Clock, Calendar, User, Building, ChevronRight } from 'lucide-react';

interface DesignSidebarProps {
    onAddText: (type: 'heading' | 'subheading' | 'body') => void;
    onAddIcon: (iconName: string) => void;
    onAddShape: (type: 'rect' | 'circle' | 'line' | 'triangle') => void;
    onAddImage: (imageUrl: string) => void;
}

type TabType = 'text' | 'elements' | 'shapes' | 'uploads';

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

export function DesignSidebar({ onAddText, onAddIcon, onAddShape, onAddImage }: DesignSidebarProps) {
    const [activeTab, setActiveTab] = useState<TabType>('text');
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const tabs = [
        { id: 'text' as TabType, icon: Type, label: 'Text' },
        { id: 'elements' as TabType, icon: Grid3X3, label: 'Elements' },
        { id: 'shapes' as TabType, icon: Shapes, label: 'Shapes' },
        { id: 'uploads' as TabType, icon: Upload, label: 'Uploads' },
    ];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;

                // Process image to remove white background
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');

                    if (ctx) {
                        ctx.drawImage(img, 0, 0);

                        // Get image data to manipulate pixels
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const data = imageData.data;

                        // Threshold for "white" (0-255)
                        // Higher means only very bright whites are removed
                        // Lower means light grays are also removed
                        const threshold = 240;

                        for (let i = 0; i < data.length; i += 4) {
                            const r = data[i];
                            const g = data[i + 1];
                            const b = data[i + 2];

                            // Check if pixel is white or near-white
                            if (r > threshold && g > threshold && b > threshold) {
                                data[i + 3] = 0; // Set alpha to 0 (transparent)
                            }
                        }

                        // Put modified data back
                        ctx.putImageData(imageData, 0, 0);

                        const processedUrl = canvas.toDataURL('image/png');
                        setUploadedImages(prev => [...prev, processedUrl]);
                    }
                };
                img.src = imageUrl;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border h-full flex overflow-hidden">
            {/* Tab Icons */}
            <div className="w-16 bg-gray-50 border-r flex flex-col items-center py-4 gap-3 rounded-l-xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-11 h-11 flex flex-col items-center justify-center rounded-lg transition-all ${activeTab === tab.id
                            ? 'bg-purple-100 text-purple-600'
                            : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        title={tab.label}
                    >
                        <tab.icon className="w-4.5 h-4.5" />
                        <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-4 overflow-y-auto">
                {activeTab === 'text' && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 text-lg mb-2">Add Text</h3>

                        <button
                            onClick={() => onAddText('heading')}
                            className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Type className="w-5 h-5" />
                            Add a text box
                        </button>

                        <div className="pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-500 mb-4">Default text styles</p>

                            <button
                                onClick={() => onAddText('heading')}
                                className="w-full text-left p-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                                <span className="text-2xl font-bold text-gray-800 group-hover:text-purple-600">Add a heading</span>
                            </button>

                            <button
                                onClick={() => onAddText('subheading')}
                                className="w-full text-left p-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                                <span className="text-lg font-semibold text-gray-700 group-hover:text-purple-600">Add a subheading</span>
                            </button>

                            <button
                                onClick={() => onAddText('body')}
                                className="w-full text-left p-2.5 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                                <span className="text-base text-gray-600 group-hover:text-purple-600">Add a little bit of body text</span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'elements' && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 text-lg mb-2">Graphics</h3>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search elements"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>

                        <div className="pt-6">
                            <p className="text-sm text-gray-500 mb-4">Common Icons</p>
                            <div className="grid grid-cols-4 gap-2">
                                {ICONS.map((iconItem) => (
                                    <button
                                        key={iconItem.name}
                                        onClick={() => onAddIcon(iconItem.name)}
                                        className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors group"
                                        title={iconItem.label}
                                    >
                                        <iconItem.icon className="w-5 h-5" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'shapes' && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 text-lg mb-2">Shapes</h3>

                        <div className="pt-4">
                            <p className="text-sm text-gray-500 mb-4">Basic Shapes</p>
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={() => onAddShape('rect')}
                                    className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center hover:bg-purple-100 transition-colors"
                                    title="Rectangle"
                                >
                                    <div className="w-8 h-6 bg-gray-600 rounded-sm"></div>
                                </button>
                                <button
                                    onClick={() => onAddShape('circle')}
                                    className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center hover:bg-purple-100 transition-colors"
                                    title="Circle"
                                >
                                    <div className="w-6 h-6 bg-gray-600 rounded-full"></div>
                                </button>
                                <button
                                    onClick={() => onAddShape('triangle')}
                                    className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center hover:bg-purple-100 transition-colors"
                                    title="Triangle"
                                >
                                    <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-b-[24px] border-l-transparent border-r-transparent border-b-gray-600"></div>
                                </button>
                                <button
                                    onClick={() => onAddShape('line')}
                                    className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center hover:bg-purple-100 transition-colors"
                                    title="Line"
                                >
                                    <div className="w-8 h-1 bg-gray-600 rounded-full"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'uploads' && (
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-800 text-lg mb-2">Uploads</h3>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Upload className="w-5 h-5" />
                            Upload an image
                        </button>

                        {uploadedImages.length > 0 && (
                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-500 mb-4">Your uploads</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {uploadedImages.map((img, index) => (
                                        <button
                                            key={index}
                                            onClick={() => onAddImage(img)}
                                            className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                                        >
                                            <img src={img} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {uploadedImages.length === 0 && (
                            <div className="text-center py-6 text-gray-400">
                                <Upload className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No uploads yet</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
