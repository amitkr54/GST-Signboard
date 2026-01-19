'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

import { usePathname } from 'next/navigation';

export function Header() {
    const { user, signInWithGoogle, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const pathname = usePathname();

    // Do not show the main floating header on the design page
    if (pathname?.startsWith('/design')) return null;

    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/50 border-b border-white/10 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="flex items-center justify-center text-indigo-400 group-hover:text-white transition-colors">
                            <Sparkles className="w-6 h-6 fill-current" />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                            SignagePro
                        </span>
                    </Link>

                    {/* Centered Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
                        {[
                            { name: 'Home', href: '/' },
                            { name: 'Products', href: '/#products' },
                            { name: 'Templates', href: '/templates' },
                            { name: 'Gallery', href: '/#gallery' },
                        ].map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="text-[15px] font-medium text-indigo-100 hover:text-white transition-colors"
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-6">
                        {user ? (
                            <div className="relative">
                                {/* User Dropdown Logic remains same, visuals simplified */}
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-white/10 transition-colors"
                                >
                                    {user.user_metadata.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt={user.user_metadata.full_name}
                                            className="w-8 h-8 rounded-full border border-white/20"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-300">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                                {/* Dropdown menu content... */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-xl py-1 overflow-hidden backdrop-blur-md">
                                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-indigo-100 hover:bg-white/10">Dashboard</Link>
                                        <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10">Sign Out</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={signInWithGoogle}
                                    className="text-[15px] font-semibold text-white hover:text-indigo-300 transition-colors"
                                >
                                    Sign In
                                </button>
                                <Link href="/design">
                                    <Button variant="primary" size="md" className="rounded-full px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-500/20 font-semibold text-sm h-10 transition-transform hover:scale-105 border-0 text-white">
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-indigo-100 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Content... (Simplifying for brevity in this update) */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-white/10 bg-slate-900 absolute w-full left-0 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 z-50">
                    <div className="px-4 py-6 space-y-4">
                        {[
                            { name: 'Home', href: '/' },
                            { name: 'Products', href: '/#products' },
                            { name: 'Templates', href: '/templates' },
                            { name: 'Gallery', href: '/#gallery' },
                        ].map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="block py-3 px-4 text-base font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                                {item.name}
                            </Link>
                        ))}
                        <div className="pt-4 mt-4 border-t border-white/10 space-y-4 px-4">
                            {!user ? (
                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => {
                                            signInWithGoogle();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full py-3 font-bold text-white hover:bg-white/5 rounded-xl transition-colors border border-white/10"
                                    >
                                        Sign In
                                    </button>
                                    <Link href="/design" onClick={() => setIsMenuOpen(false)}>
                                        <Button className="w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border-0 py-6 text-lg font-bold shadow-lg shadow-indigo-500/20">
                                            Get Started
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 px-2 mb-4">
                                        {user.user_metadata.avatar_url ? (
                                            <img
                                                src={user.user_metadata.avatar_url}
                                                alt={user.user_metadata.full_name}
                                                className="w-10 h-10 rounded-full border-2 border-indigo-500/30"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-300">
                                                <User className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold">{user.user_metadata.full_name}</span>
                                            <span className="text-xs text-indigo-300">{user.email}</span>
                                        </div>
                                    </div>
                                    <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                                        <Button variant="outline" className="w-full justify-center rounded-xl border-white/10 hover:bg-white/5 text-slate-300 hover:text-white">
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <Button
                                        onClick={() => {
                                            signOut();
                                            setIsMenuOpen(false);
                                        }}
                                        variant="outline"
                                        className="w-full justify-center rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        Sign Out
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
