import React from 'react';
import Link from 'next/link';
import { getTemplates } from '@/app/actions';
import { ChevronRight, Layout } from 'lucide-react';

export default async function TemplatesPage() {
    const templates = await getTemplates();
    const allTemplates = Array.isArray(templates) ? templates : [];

    return (
        <section className="py-20 min-h-screen relative">
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-12 text-center md:text-left">
                    <p className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">Start Designing</p>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">Professional Templates</h1>
                    <p className="text-lg text-indigo-100 max-w-3xl">
                        Choose a template to jumpstart your signage design. Fully customizable to fit your brand.
                    </p>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {allTemplates?.map((template: any) => (
                        <Link
                            href={`/design?template=${template.id}`}
                            key={template.id}
                            className="group flex flex-col bg-slate-900/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                        >
                            {/* Template Title */}
                            <div className="p-6 pb-4">
                                <h3
                                    className="font-bold text-2xl leading-tight mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300"
                                    style={{ fontFamily: '"Playfair Display", serif' }}
                                >
                                    {template.name}
                                </h3>
                                <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest opacity-80 bg-indigo-500/10 inline-block px-2 py-1 rounded-md font-sans">
                                    {template.category || 'Business'}
                                </p>
                            </div>

                            {/* Image Container */}
                            <div className="px-2">
                                <div className="aspect-[4/3] rounded-lg overflow-hidden relative bg-white">
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
                            <div className="p-6 mt-auto flex items-center justify-between gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ready to use</span>
                                    <span className="text-sm font-black text-white">Customizable</span>
                                </div>
                                <div className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-500/25 group-hover:scale-105">
                                    <div className="flex items-center gap-2 font-bold text-sm px-2">
                                        Use This <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
