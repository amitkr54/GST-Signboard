'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/AuthButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { StartDesignModal } from '@/components/StartDesignModal';
import { ArrowRight, Wand2, Diamond, Truck, Check, Facebook, Twitter, Linkedin, Instagram, Play, PenTool, Sparkles, Layout, ChevronRight } from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';
import { PRODUCTS, PRODUCT_CATEGORIES } from '@/lib/products';
import { ProductCatalog } from '@/components/ProductCatalog';
import { generateLocalBusinessSchema } from '@/lib/seo';
import Head from 'next/head';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredProducts = activeCategory === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeCategory);

  const localBusinessSchema = generateLocalBusinessSchema();

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans text-gray-900 relative overflow-hidden">
        {/* Animated background gradient orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <StartDesignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

        {/* Hero Section */}
        <section className="relative pt-8 pb-4 lg:pt-12 lg:pb-8 overflow-visible">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left Column: Text */}
              <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0 order-2 lg:order-1 relative z-10">
                {/* Floating Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200/50 shadow-lg mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-sm">4.9</span>
                  </div>
                  <span className="text-sm text-gray-600">from 1,000+ customers</span>
                </div>

                <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700" style={{ animationDelay: '100ms' }}>
                  Create Professional
                  <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
                    Signage in Minutes
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-gray-600 mb-10 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: '200ms' }}>
                  Craft custom business signs, banners, and displays with our intuitive design tools.
                  <span className="block text-indigo-600 font-semibold mt-1">No design experience needed.</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-10 duration-700" style={{ animationDelay: '300ms' }}>
                  <Button
                    size="lg"
                    onClick={() => setIsModalOpen(true)}
                    className="group relative rounded-full px-10 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-600/60 transition-all duration-300 hover:scale-105 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Designing
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </Button>
                  <WhatsAppButton
                    text="Get Custom Design"
                    message="Hi, I would like to inquire about your custom design services."
                    variant="secondary"
                    className="rounded-full px-8 py-4 border-2 border-[#25D366] text-[#128C7E] hover:bg-[#25D366] hover:text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  />
                </div>
              </div>

              {/* Right Column: Device Mockups */}
              <div className="relative h-[320px] lg:h-[420px] w-full flex items-center justify-center order-1 lg:order-2 perspective-1000">

                {/* Desktop Monitor - Back */}
                <div className="absolute right-0 top-4 w-[260px] sm:w-[350px] z-10 transition-transform hover:scale-[1.02] duration-500">
                  <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200">
                    {/* Browser bar */}
                    <div className="h-6 bg-gray-50 border-b border-gray-100 flex items-center px-3 gap-1.5">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      </div>
                    </div>
                    {/* SaaS Dashboard Interface */}
                    <div className="aspect-[16/10] bg-white flex">
                      {/* Sidebar */}
                      <div className="w-12 border-r border-gray-100 flex flex-col items-center py-3 gap-3">
                        <div className="w-6 h-6 rounded bg-indigo-100 mb-2"></div>
                        <div className="w-4 h-4 rounded-sm bg-gray-100"></div>
                        <div className="w-4 h-4 rounded-sm bg-gray-100"></div>
                        <div className="w-4 h-4 rounded-sm bg-gray-100"></div>
                      </div>
                      {/* Main Canvas Area */}
                      <div className="flex-1 p-4 bg-gray-50/50">
                        <div className="w-full h-full bg-white rounded border border-gray-200 shadow-sm flex items-center justify-center relative overflow-hidden">
                          <div className="absolute top-2 left-2 flex gap-2">
                            <div className="h-4 w-16 bg-gray-100 rounded"></div>
                          </div>
                          {/* Canvas Content */}
                          <div className="w-3/4 h-3/4 bg-gradient-to-br from-slate-900 to-slate-800 rounded flex items-center justify-center shadow-lg">
                            <div className="text-center text-white">
                              <div className="text-xl font-black tracking-widest mb-1">EVENT</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Right Panel */}
                      <div className="w-16 border-l border-gray-100 p-2 hidden sm:block">
                        <div className="space-y-2">
                          <div className="h-2 w-full bg-gray-100 rounded"></div>
                          <div className="h-2 w-2/3 bg-gray-100 rounded"></div>
                          <div className="h-8 w-full bg-indigo-50 rounded mt-4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Stand */}
                  <div className="h-8 w-24 mx-auto bg-gradient-to-b from-gray-200 to-gray-300"></div>
                  <div className="h-1.5 w-32 mx-auto bg-gray-300 rounded-full shadow-md"></div>
                </div>

                {/* Tablet - Front Left */}
                <div className="absolute left-0 bottom-12 w-[110px] sm:w-[140px] z-20 hover:-translate-y-1 transition-transform duration-500">
                  <div className="bg-white rounded-[1.5rem] p-1.5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] ring-1 ring-gray-900/5">
                    <div className="bg-gray-50 rounded-[1rem] overflow-hidden border border-gray-100">
                      <div className="aspect-[3/4] p-3 flex flex-col relative">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="w-4 h-4 rounded bg-indigo-100"></div>
                          <div className="w-4 h-4 rounded-full bg-gray-100"></div>
                        </div>
                        {/* Content */}
                        <div className="flex-1 bg-white rounded-lg border border-gray-100 shadow-sm p-2 flex flex-col items-center justify-center">
                          <div className="w-full aspect-square bg-indigo-50 rounded mb-2 flex items-center justify-center">
                            <span className="text-indigo-600 font-bold text-xs">T</span>
                          </div>
                          <div className="h-1 w-10 bg-gray-100 rounded mb-1"></div>
                          <div className="h-1 w-6 bg-gray-100 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Horizontal Screen - Front Right (Glow Effect) */}
                <div className="absolute right-4 bottom-4 w-[160px] sm:w-[200px] z-30 hover:-translate-y-1 transition-transform duration-500">
                  {/* Glow Effect */}
                  <div className="absolute -inset-4 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                  <div className="relative bg-gray-900 rounded-xl p-1.5 shadow-[0_20px_60px_-15px_rgba(59,130,246,0.5)] ring-1 ring-white/10">
                    <div className="bg-gray-800 rounded-lg overflow-hidden relative">
                      <div className="aspect-[16/9] relative">
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80')" }}></div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="border-2 border-white/80 p-3 rounded-lg backdrop-blur-sm">
                            <div className="text-white text-center">
                              <div className="text-xs font-serif italic tracking-wider">Coffee Shop</div>
                              <div className="h-px w-full bg-white/50 my-1"></div>
                              <div className="text-[8px] uppercase tracking-widest">Open Late</div>
                            </div>
                          </div>
                        </div>
                        {/* Reflection/Glare */}
                        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-b from-white/10 to-transparent rotate-45 pointer-events-none"></div>
                      </div>
                    </div>
                  </div>
                  {/* Floating Elements for "Magic" feel */}
                  <Sparkles className="absolute -top-3 -right-3 w-6 h-6 text-blue-400 animate-bounce" />
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Product Catalog */}
        <ProductCatalog />

        {/* Popular Templates Section */}
        <section className="py-20 bg-gradient-to-b from-white to-gray-50/50 border-b border-gray-100 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12">
              <div>
                <p className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wider">Templates</p>
                <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-3">Start with a Template</h2>
                <p className="text-lg text-gray-600 max-w-2xl">Choose a professional layout and customize it to fit your brand in seconds.</p>
              </div>
              <Link href="/design?tab=templates">
                <Button variant="outline" className="mt-6 md:mt-0 gap-2 group border-2 hover:border-indigo-600 hover:text-indigo-600 transition-all">
                  View All Templates
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {TEMPLATES.slice(0, 4).map((template, index) => (
                <div
                  key={template.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 group hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Preview Area */}
                  <div
                    className="h-48 w-full relative flex items-center justify-center overflow-hidden"
                    style={{ background: `linear-gradient(135deg, ${template.thumbnailColor}, ${template.thumbnailColor}dd)` }}
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/5 to-white/20" />

                    {/* Icon */}
                    <div className="relative z-10 opacity-40 scale-75 transform transition-all duration-500 group-hover:scale-90 group-hover:opacity-60">
                      <Layout className="w-20 h-20 text-white drop-shadow-lg" />
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                      <Link href={`/design?template=${template.id}`}>
                        <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-50 shadow-xl border-2 border-white/50 backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Customize
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{template.name}</h3>
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wide">Pro</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{template.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wider">Why Choose Us</p>
              <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Key Features</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">Everything you need to create stunning signage for your business</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {/* Feature 1 */}
              <div className="group relative bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-200 hover:-translate-y-2">
                {/* Gradient border effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center text-white mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-purple-500/50">
                    <Wand2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">Easy Design</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Intuitive drag-and-drop interface with thousands of templates. Customize text, images, and colors in a few clicks.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-purple-600">
                    <Check className="w-5 h-5" />
                    <span>1000+ Templates</span>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-blue-200 hover:-translate-y-2">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-blue-500/50">
                    <Diamond className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">High Quality</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Premium materials and vibrant, professional printing for durable, attention-grabbing signs.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
                    <Check className="w-5 h-5" />
                    <span>Premium Materials</span>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative bg-white p-10 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-200 hover:-translate-y-2">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl shadow-indigo-500/50">
                    <Truck className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">Fast Delivery</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    Quick turnaround times and reliable shipping options to get your signage when you need it.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
                    <Check className="w-5 h-5" />
                    <span>3-5 Day Shipping</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl">
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-black text-white mb-2">5K+</div>
                <div className="text-sm lg:text-base text-white/80 font-medium">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-black text-white mb-2">1K+</div>
                <div className="text-sm lg:text-base text-white/80 font-medium">Templates</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-black text-white mb-2">4.9★</div>
                <div className="text-sm lg:text-base text-white/80 font-medium">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-4xl lg:text-5xl font-black text-white mb-2">24/7</div>
                <div className="text-sm lg:text-base text-white/80 font-medium">Support</div>
              </div>
            </div>
          </div>
        </section>

        {/* Stunning Examples Showcase */}
        <section className="py-6 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Preview Showcase</p>
              <h2 className="text-3xl font-bold text-gray-900">Stunning Examples</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[160px]">
              {/* 1. Retail Store (Sidewalk Sign) - Tall (Left) */}
              <div className="row-span-2 group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-gray-200">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541560052-77ec1bbc0941?auto=format&fit=crop&q=80')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <div className="text-center">
                    <h3 className="text-3xl font-black mb-1 uppercase tracking-tight">RETAIL</h3>
                    <h3 className="text-3xl font-light uppercase tracking-tight">STORE</h3>
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-medium text-white">Sidewalk Sign</span>
                </div>
              </div>

              {/* 2. Window Decal (Top Middle Left) */}
              <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-gray-900">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&q=80')" }}></div>
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/30 backdrop-blur-md p-3 rounded-lg text-center border border-white/20">
                    <h3 className="text-white font-serif text-xl italic">Salon</h3>
                  </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-medium text-white">Window Decal</span>
                </div>
              </div>

              {/* 3. Event Banner (Top Middle Right) */}
              <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-indigo-900">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-700"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <h3 className="text-2xl font-black tracking-widest uppercase mb-1">EVENT</h3>
                    <p className="text-[10px] font-semibold opacity-80">SignagePro</p>
                  </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-medium text-white">Banner</span>
                </div>
              </div>

              {/* 6. Restaurant Hanging Banner (Tall Right) - Moved here for visual balance in code, displayed in Col 4 */}
              <div className="row-span-2 col-start-2 md:col-start-4 group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-amber-950">
                <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80')" }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-amber-100/30 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-amber-50 text-center">
                    <div className="font-serif text-lg">Restaurant</div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-medium text-white">Hanging Banner</span>
                </div>
              </div>

              {/* 4. Directory Sign (Bottom Middle Left) */}
              <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-slate-800">
                <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')" }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-lg text-slate-300 w-32 backdrop-blur-sm">
                    <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wide">Directory</div>
                    <div className="space-y-1 text-[8px]">
                      <div className="flex justify-between"><span className="text-white">Lobby</span><span className="text-slate-500">1F</span></div>
                      <div className="flex justify-between"><span className="text-white">Office</span><span className="text-slate-500">2F</span></div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-medium text-white">Directory</span>
                </div>
              </div>

              {/* 5. Vehicle Magnet (Bottom Middle Right) */}
              <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 bg-blue-50">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1605218427306-03fc51b52643?auto=format&fit=crop&q=80')" }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-lg scale-90">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-600 text-white p-1 rounded"><Truck className="w-3 h-3" /></div>
                      <div>
                        <div className="font-black text-gray-900 text-[10px]">CONTRACTOR</div>
                        <div className="text-[6px] text-gray-500">PRO SERVICES</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-3 left-0 right-0 text-center">
                  <span className="bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-medium text-white">Magnet</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gradient-to-b from-gray-50 to-white pt-20 pb-8 border-t border-gray-200 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Newsletter Section */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-10 lg:p-12 mb-16 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

              <div className="relative z-10 max-w-3xl mx-auto text-center">
                <h3 className="text-3xl lg:text-4xl font-black text-white mb-4">
                  Get Design Tips & Exclusive Offers
                </h3>
                <p className="text-lg text-white/90 mb-8">
                  Subscribe to our newsletter for the latest templates, design inspiration, and special discounts.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-6 py-4 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md text-white placeholder-white/60 focus:outline-none focus:border-white/40 focus:bg-white/20 transition-all"
                  />
                  <Button className="px-8 py-4 bg-white text-indigo-600 hover:bg-gray-50 font-bold rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                    Subscribe
                  </Button>
                </div>
                <p className="text-xs text-white/70 mt-4">
                  ✓ No spam, unsubscribe anytime
                </p>
              </div>
            </div>

            {/* Footer Links */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
              {/* Brand Column */}
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                    S
                  </div>
                  <span className="font-black text-xl text-gray-900">SignagePro</span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  Professional signage design made simple.
                </p>
                {/* Trust Badges */}
                <div className="flex gap-2">
                  <div className="px-2 py-1 bg-green-50 border border-green-200 rounded text-[10px] font-bold text-green-700 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Secure
                  </div>
                  <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-[10px] font-bold text-blue-700">
                    24/7
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wider">Product</h4>
                <ul className="space-y-3">
                  {['Features', 'Pricing', 'Templates', 'Gallery'].map(item => (
                    <li key={item}><Link href="#" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors font-medium">{item}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wider">Company</h4>
                <ul className="space-y-3">
                  {['About Us', 'Careers', 'Press', 'Blog'].map(item => (
                    <li key={item}><Link href="#" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors font-medium">{item}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wider">Support</h4>
                <ul className="space-y-3">
                  {['Help Center', 'Contact Us', 'Tutorials'].map(item => (
                    <li key={item}><Link href="#" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors font-medium">{item}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wider">Legal</h4>
                <ul className="space-y-3">
                  {['Privacy Policy', 'Terms of Service'].map(item => (
                    <li key={item}><Link href="#" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors font-medium">{item}</Link></li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200">
              <div className="text-sm text-gray-600 mb-4 md:mb-0">
                © 2024 SignagePro Inc. All rights reserved. Made with ♥ for creators.
              </div>
              <div className="flex gap-6">
                <Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors transform hover:scale-110">
                  <Twitter className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors transform hover:scale-110">
                  <Facebook className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors transform hover:scale-110">
                  <Linkedin className="w-5 h-5" />
                </Link>
                <Link href="#" className="text-gray-600 hover:text-indigo-600 transition-colors transform hover:scale-110">
                  <Instagram className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </footer>

        <WhatsAppButton
          variant="floating"
          message="Hi! I'm interested in SignagePro services."
        />
      </div>
    </>
  );
}
