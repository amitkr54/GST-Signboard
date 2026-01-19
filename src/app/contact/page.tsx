import React from 'react';
import { Mail, MapPin, Phone, MessageCircle, Globe } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { WhatsAppQRCode } from '@/components/WhatsAppQRCode';

export default function ContactPage() {
    const contactInfo = {
        address: "F-713, Lado Sarai, New Delhi – 110030",
        phone: "9958657208",
        email: "pankaj_thakur87@yahoo.com",
        website: "signageworks.in"
    };

    return (
        <div className="min-h-screen bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                        Get in Touch
                    </h1>
                    <p className="text-lg text-indigo-200/80 max-w-2xl mx-auto">
                        Have a question or ready to start your project? We're here to help you create stunning signage.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-start">
                    {/* Contact Information Card */}
                    <div className="bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl">
                                    <MapPin className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-indigo-200 mb-1">Visit Us</h3>
                                    <p className="text-white text-lg">{contactInfo.address}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl">
                                    <Phone className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-indigo-200 mb-1">Call Us</h3>
                                    <a href={`tel:${contactInfo.phone}`} className="text-white text-lg hover:text-indigo-400 transition-colors">
                                        {contactInfo.phone}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl">
                                    <Mail className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-indigo-200 mb-1">Email Us</h3>
                                    <a href={`mailto:${contactInfo.email}`} className="text-white text-lg hover:text-indigo-400 transition-colors break-all">
                                        {contactInfo.email}
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-500/10 rounded-xl">
                                    <Globe className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-indigo-200 mb-1">Website</h3>
                                    <a href={`https://${contactInfo.website}`} target="_blank" rel="noopener noreferrer" className="text-white text-lg hover:text-indigo-400 transition-colors hidden sm:block">
                                        {contactInfo.website}
                                    </a>
                                    <a href={`https://${contactInfo.website}`} target="_blank" rel="noopener noreferrer" className="text-white text-base hover:text-indigo-400 transition-colors sm:hidden break-all">
                                        {contactInfo.website}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp / Action Card */}
                    <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-center h-full text-center">
                        <div className="mb-8">
                            <div className="w-16 h-16 bg-[#25D366]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-[#25D366]" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Chat on WhatsApp</h2>
                            <p className="text-indigo-200/80">
                                Fastest way to get a quote or discuss your design. We're active during business hours!
                            </p>
                        </div>

                        <a
                            href={`https://wa.me/91${contactInfo.phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full mb-8 block"
                        >
                            <Button className="w-full py-6 text-lg font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white border-0 shadow-lg shadow-[#25d366]/20 rounded-xl flex items-center justify-center gap-3 group transition-all hover:scale-[1.02]">
                                <MessageCircle className="w-6 h-6 fill-current" />
                                Open WhatsApp
                            </Button>
                        </a>

                        <div className="mt-auto">
                            <p className="mb-4 text-sm text-indigo-300">
                                Or scan to start chat instantly
                            </p>
                            <WhatsAppQRCode phone={contactInfo.phone} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
