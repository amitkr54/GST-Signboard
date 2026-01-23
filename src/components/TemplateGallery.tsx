'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Layout, Search } from 'lucide-react';

interface TemplateGalleryProps {
    initialTemplates: any[];
    categories: any[];
}

export default function TemplateGallery({ initialTemplates, categories }: TemplateGalleryProps) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const displayCategories = [
        { id: 'all', name: 'All Templates' },
        ...categories
    ];

    const filteredTemplates = initialTemplates.filter(template => {
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div>
            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
                <div className="flex overflow-x-auto gap-1 p-1 w-full md:w-auto scrollbar-hide">
                    {displayCategories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search templates..."
                        className="block w-full pl-10 pr-3 py-3 bg-black/20 border border-white/10 rounded-xl text-sm font-bold text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length > 0 ? (
                <div className="columns-1 sm:columns-2 lg:columns-4 gap-8 space-y-8">
                    {filteredTemplates.map((template: any) => (
                        <Link
                            href={`/configure?template=${template.id}`}
                            key={template.id}
                            className="group flex flex-col bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 break-inside-avoid mb-8 w-full"
                        >
                            {/* Template Title */}
                            <div className="p-6 pb-4">
                                <h3
                                    className="font-bold text-2xl leading-tight mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 line-clamp-1"
                                    style={{ fontFamily: '"Playfair Display", serif' }}
                                    title={template.name}
                                >
                                    {template.name}
                                </h3>
                                <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest opacity-80 bg-indigo-500/10 inline-block px-2 py-1 rounded-md font-sans">
                                    {template.category || 'Business'}
                                </p>
                            </div>

                            {/* Image Container */}
                            <div className="px-2">
                                <div
                                    className="rounded-none overflow-hidden relative bg-slate-800/50 w-full shadow-inner"
                                    style={{
                                        aspectRatio: template.dimensions ? `${template.dimensions.width}/${template.dimensions.height}` : '4/3'
                                    }}
                                >
                                    {template.thumbnail || template.svgPath ? (
                                        <img
                                            src={template.thumbnail || template.svgPath}
                                            alt={template.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                                            <Layout className="w-16 h-16 text-indigo-400/50" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Area */}
                            <div className="p-4 mt-auto">
                                <div className="w-full py-3 bg-white/5 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-500/25">
                                    <span className="text-sm">Customize Template</span>
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-24 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/10 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                        <Search className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">No templates found</h3>
                    <p className="text-indigo-200">Try adjusting your filters or search query.</p>
                    <button
                        onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                        className="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            )
            }
        </div>
    );
}
