'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthButton } from '@/components/AuthButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { StartDesignModal } from '@/components/StartDesignModal';
import {
    ArrowRight, Wand2, Diamond, Truck, Check, Facebook, Twitter,
    Linkedin, Instagram, Play, PenTool, Sparkles, Layout, ChevronRight
} from 'lucide-react';
import { TEMPLATES } from '@/lib/templates';
import { PRODUCTS, PRODUCT_CATEGORIES } from '@/lib/products';
import { ProductCatalog } from '@/components/ProductCatalog';
import { ReferralCheckSection } from '@/components/ReferralCheckSection';
import { getAppSetting } from './actions';

export default function HomeClient() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReferralEnabled, setIsReferralEnabled] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const enabled = await getAppSetting('referral_scheme_enabled', true);
            setIsReferralEnabled(enabled);
        };
        fetchSettings();
    }, []);

    return (
        <div className="min-h-screen font-sans relative overflow-hidden text-slate-50">
            {/* Animated background gradient orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-200/40 to-purple-200/40 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

            <StartDesignModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* Product Catalog */}
            <ProductCatalog />

            {/* How it Works Section */}
            <section className="relative pt-16 pb-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-purple-200">
                        Signage Made Simple
                    </h1>
                    <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-16 leading-relaxed">
                        Create professional custom signage for your business in three easy steps. No design skills required.
                    </p>

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-indigo-500/30"></div>

                        {/* Step 1 */}
                        <div className="relative group">
                            <div className="w-24 h-24 mx-auto bg-indigo-800/50 backdrop-blur-sm rounded-3xl border border-indigo-500/30 flex items-center justify-center mb-6 shadow-xl shadow-indigo-900/50 group-hover:scale-110 transition-all duration-300">
                                <Layout className="w-10 h-10 text-white" />
                                <div className="absolute -top-3 -right-3 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center font-bold text-sm border-2 border-indigo-900">1</div>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Choose Your Base</h3>
                            <p className="text-indigo-200 text-sm leading-relaxed px-4">
                                Select from our professional templates or start with a custom size that fits your space perfectly.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="relative group">
                            <div className="w-24 h-24 mx-auto bg-purple-800/50 backdrop-blur-sm rounded-3xl border border-purple-500/30 flex items-center justify-center mb-6 shadow-xl shadow-purple-900/50 group-hover:scale-110 transition-all duration-300">
                                <PenTool className="w-10 h-10 text-white" />
                                <div className="absolute -top-3 -right-3 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center font-bold text-sm border-2 border-indigo-900">2</div>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Customize It</h3>
                            <p className="text-indigo-200 text-sm leading-relaxed px-4">
                                Use our easy editor to add your text, logo, colors, and icons. Watch your design come to life.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="relative group">
                            <div className="w-24 h-24 mx-auto bg-blue-800/50 backdrop-blur-sm rounded-3xl border border-blue-500/30 flex items-center justify-center mb-6 shadow-xl shadow-blue-900/50 group-hover:scale-110 transition-all duration-300">
                                <Truck className="w-10 h-10 text-white" />
                                <div className="absolute -top-3 -right-3 w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center font-bold text-sm border-2 border-indigo-900">3</div>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Order & Delivery</h3>
                            <p className="text-indigo-200 text-sm leading-relaxed px-4">
                                Choose premium materials, place your order, and get fast delivery within 24-48 hours.
                            </p>
                        </div>
                    </div>

                    <div className="mt-16">
                        <Button
                            size="lg"
                            onClick={() => setIsModalOpen(true)}
                            className="rounded-full px-12 py-6 text-lg bg-white text-indigo-900 hover:bg-indigo-50 font-bold shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300"
                        >
                            Start Designing Now
                            <ArrowRight className="ml-2 w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </section>

            {/* Referral Check Section */}
            {isReferralEnabled && <ReferralCheckSection />}

            {/* Footer */}
            <footer className="bg-gradient-to-b from-gray-50 to-white pt-20 pb-8 border-t border-gray-200 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Footer Links */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                        {/* Brand Column */}
                        <div className="col-span-2 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                    S
                                </div>
                                <span className="font-bold text-xl text-gray-900" style={{ fontFamily: '"Playfair Display", serif' }}>SignagePro</span>
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
                            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Product</h4>
                            <ul className="space-y-3">
                                {['Features', 'Pricing', 'Templates', 'Gallery'].map(item => (
                                    <li key={item}><Link href="#" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors font-medium">{item}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Company</h4>
                            <ul className="space-y-3">
                                {['About Us', 'Careers', 'Press', 'Blog'].map(item => (
                                    <li key={item}><Link href="#" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors font-medium">{item}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Support</h4>
                            <ul className="space-y-3">
                                {['Help Center', 'Contact Us', 'Tutorials'].map(item => (
                                    <li key={item}><Link href="#" className="text-gray-600 hover:text-indigo-600 text-sm transition-colors font-medium">{item}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Legal</h4>
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
    );
}
