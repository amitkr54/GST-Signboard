import React from 'react';
import { AlertCircle, Package, FileText, Filter, Layers, Wrench } from 'lucide-react';

export type AdminTab = 'templates' | 'products' | 'orders' | 'categories' | 'settings' | 'materials' | 'canvas-presets';

interface AdminTabsProps {
    activeTab: AdminTab;
    setActiveTab: (tab: AdminTab) => void;
    isMenubar?: boolean;
}

const AdminTabs = ({ activeTab, setActiveTab, isMenubar = false }: AdminTabsProps) => {
    const tabs = [
        { id: 'orders', label: 'Orders', icon: AlertCircle },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'templates', label: 'Templates', icon: FileText },
        { id: 'categories', label: 'Categories', icon: Filter },
        { id: 'materials', label: 'Materials', icon: Layers },
        { id: 'canvas-presets', label: 'Canvas', icon: Layers },
        { id: 'settings', label: 'Settings', icon: Wrench },
    ];

    return (
        <div className={`flex gap-1 ${!isMenubar ? 'mb-6 border-b border-white/10' : ''}`}>
            {tabs.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    onClick={() => setActiveTab(id as AdminTab)}
                    className={`px-4 py-2 text-sm font-bold transition-all relative rounded-xl flex items-center gap-2 ${activeTab === id
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5'
                            : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                >
                    <Icon className={`w-4 h-4 ${activeTab === id ? 'text-indigo-400' : 'text-slate-500'}`} />
                    {label}
                    {!isMenubar && activeTab === id && (
                        <div className="absolute bottom-[-9px] left-0 right-0 h-1 bg-indigo-500 rounded-t-full shadow-[0_-4px_10px_rgba(99,102,241,0.5)]" />
                    )}
                </button>
            ))}
        </div>
    );
};

export default AdminTabs;
