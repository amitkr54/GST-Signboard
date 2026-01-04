'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/AuthButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { StartDesignModal } from '@/components/StartDesignModal';
import { ArrowRight, Wand2, Diamond, Truck, Check, Facebook, Twitter, Linkedin, Instagram, Play, PenTool, Sparkles, Layout } from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white font-sans text-gray-900">
      <StartDesignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {/* Hero Section */}
      <section className="relative pt-6 pb-0 lg:pt-6 lg:pb-4 overflow-visible">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column: Text */}
            <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0 order-2 lg:order-1">
              <h1 className="text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight mb-6">
                Create Professional Signage in Minutes
              </h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Craft custom business signs, banners, and displays effortlessly with our intuitive design tools. No design experience needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-full px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg h-12"
                >
                  Start Designing
                </Button>
                <WhatsAppButton
                  text="Get Custom Design"
                  message="Hi, I would like to inquire about your custom design services."
                  variant="secondary"
                  className="rounded-full px-8 h-12 border-2 border-[#25D366] text-[#128C7E] hover:bg-[#25D366]/10 font-bold shadow-sm transition-all"
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

      {/* Popular Templates Section */}
      <section className="py-12 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Start with a Template</h2>
              <p className="text-gray-600">Choose a professional layout and customize it to fit your brand.</p>
            </div>
            <Link href="/design?tab=templates">
              <Button variant="outline" className="mt-4 md:mt-0 gap-2">
                View All Templates <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEMPLATES.slice(0, 4).map((template) => (
              <div key={template.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200 group">
                {/* Preview Area */}
                <div
                  className="h-40 w-full relative flex items-center justify-center bg-gray-100"
                  style={{ backgroundColor: template.thumbnailColor }}
                >
                  {/* Simple CSS representation of layout */}
                  <div className="opacity-60 scale-75 transform transition-transform group-hover:scale-90">
                    <Layout className="w-16 h-16 text-gray-400" />
                  </div>

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Link href={`/design?template=${template.id}`}>
                      <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-50 shadow-sm border border-gray-200">
                        Customize
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="pt-0 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <Wand2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Easy Design</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Intuitive drag-and-drop interface with thousands of templates. Customize text, images, and colors in a few clicks.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <Diamond className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">High Quality</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Premium materials and vibrant, professional printing for durable, attention-grabbing signs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Quick turnaround times and reliable shipping options to get your signage when you need it.
              </p>
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
      <footer className="bg-gray-50 pt-16 pb-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Product</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'Templates', 'Gallery'].map(item => (
                  <li key={item}><Link href="#" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Company</h4>
              <ul className="space-y-2">
                {['About Us', 'Careers', 'Press', 'Blog'].map(item => (
                  <li key={item}><Link href="#" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Support</h4>
              <ul className="space-y-2">
                {['Help Center', 'Contact Us', 'Tutorials'].map(item => (
                  <li key={item}><Link href="#" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 text-sm">Legal</h4>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service'].map(item => (
                  <li key={item}><Link href="#" className="text-gray-600 hover:text-gray-900 text-sm transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-4 md:mb-0">
              © 2024 SignagePro Inc. All rights reserved.
            </div>
            <div className="flex gap-4">
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
                <Linkedin className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-gray-600 hover:text-gray-900 transition-colors">
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
  );
}
