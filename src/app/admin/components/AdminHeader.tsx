import React from 'react';
import Link from 'next/link';
import { Sparkles, LogOut, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import AdminTabs, { AdminTab } from './AdminTabs';

interface AdminHeaderProps {
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
    handleLogout: () => void;
}

const AdminHeader = ({ activeTab, setActiveTab, handleLogout }: AdminHeaderProps) => {
    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/50 border-b border-white/10 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="flex items-center justify-center text-indigo-400 group-hover:text-white transition-colors">
                                <Sparkles className="w-6 h-6 fill-current" />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                                SignagePro
                                <span className="ml-2 text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Admin</span>
                            </span>
                        </Link>

                        {/* Admin Navigation (Old Tabs refactored into menubar) */}
                        <nav className="hidden xl:flex items-center ml-4">
                            <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} isMenubar />
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="rounded-xl border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all font-bold flex items-center gap-2 px-4 h-10"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </Button>
                    </div>
                </div>

                {/* Scrollable menu for smaller desktop screens */}
                <div className="xl:hidden pb-2 overflow-x-auto scrollbar-hide">
                    <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} isMenubar />
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
