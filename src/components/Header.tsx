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
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center text-indigo-600">
                            <Sparkles className="w-6 h-6 fill-current" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                            SignagePro
                        </span>
                    </Link>

                    {/* Centered Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
                        {['Features', 'Pricing', 'Gallery'].map((item) => (
                            <Link
                                key={item}
                                href={`#${item.toLowerCase()}`}
                                className="text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                    </nav>

                    <div className="hidden md:flex items-center gap-6">
                        {user ? (
                            <div className="relative">
                                {/* User Dropdown Logic remains same, visuals simplified */}
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-50 transition-colors"
                                >
                                    {user.user_metadata.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt={user.user_metadata.full_name}
                                            className="w-8 h-8 rounded-full border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                            <User className="w-4 h-4" />
                                        </div>
                                    )}
                                </button>
                                {/* Dropdown menu content... */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
                                        <Link href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</Link>
                                        <button onClick={() => signOut()} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <button
                                    onClick={signInWithGoogle}
                                    className="text-[15px] font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                                >
                                    Sign In
                                </button>
                                <Link href="/design">
                                    <Button variant="primary" size="md" className="rounded-full px-6 bg-gradient-to-r from-[var(--brand-gradient-start)] to-[var(--brand-gradient-end)] hover:brightness-110 shadow-lg shadow-indigo-200/50 font-semibold text-sm h-10 transition-transform hover:scale-105 border-0">
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
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Content... (Simplifying for brevity in this update) */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white absolute w-full left-0 shadow-lg">
                    <div className="px-4 py-4 space-y-3">
                        {['Features', 'Pricing', 'Gallery'].map((item) => (
                            <Link key={item} href={`#${item.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="block py-2 text-base font-medium text-gray-700">
                                {item}
                            </Link>
                        ))}
                        <div className="pt-3 border-t border-gray-50">
                            {!user ? (
                                <div className="flex flex-col gap-3">
                                    <button onClick={signInWithGoogle} className="font-semibold text-gray-900 py-2">Sign In</button>
                                    <Button className="w-full justify-center rounded-full bg-blue-600">Get Started</Button>
                                </div>
                            ) : (
                                <Button onClick={() => signOut()} variant="outline" className="w-full justify-center rounded-full">Sign Out</Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
