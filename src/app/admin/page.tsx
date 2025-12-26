'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { uploadTemplate, getTemplates, deleteTemplate } from '@/app/actions';
import { Loader2, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [pin, setPin] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    const fetchTemplates = async () => {
        const data = await getTemplates();
        setTemplates(data || []);
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        const res = await uploadTemplate(formData);

        if (res.success) {
            setMessage({ type: 'success', text: 'Template uploaded successfully!' });
            (event.target as HTMLFormElement).reset();
            fetchTemplates();
            router.refresh();
        } else {
            setMessage({ type: 'error', text: res.error || 'Upload failed' });
        }
        setIsLoading(false);
    }

    async function handleDelete(id: string) {
        if (!pin) {
            setMessage({ type: 'error', text: 'Please enter Admin PIN above to delete' });
            return;
        }

        if (!confirm('Are you sure you want to delete this template?')) return;

        setIsLoading(true);
        const res = await deleteTemplate(id, pin);
        if (res.success) {
            setMessage({ type: 'success', text: 'Template deleted' });
            fetchTemplates();
            router.refresh();
        } else {
            setMessage({ type: 'error', text: res.error || 'Delete failed' });
        }
        setIsLoading(false);
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="bg-white p-8 rounded-xl shadow-lg h-fit">
                    <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">Admin Dashboard</h1>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin PIN</label>
                            <input
                                type="password"
                                name="pin"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="Enter PIN"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="e.g. Summer Sale"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                                type="text"
                                name="description"
                                placeholder="Brief description"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">File (SVG or PDF)</label>
                            <input
                                type="file"
                                name="file"
                                accept=".svg, .pdf"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                            <p className="text-xs text-gray-500 mt-1">Accepts .svg and .pdf files.</p>
                        </div>

                        {message && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                                {message.text}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin mr-2" /> : null}
                            Upload Template
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t text-center">
                        <a href="/design" className="text-blue-600 hover:underline text-sm font-medium">
                            Go to Design Editor &rarr;
                        </a>
                    </div>
                </div>

                {/* Templates List */}
                <div className="bg-white p-8 rounded-xl shadow-lg min-h-[500px]">
                    <h2 className="text-xl font-bold mb-6 text-gray-900 border-b pb-4">Manage Templates</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {templates.length === 0 && (
                            <p className="text-gray-500 italic text-center py-10">No custom templates found.</p>
                        )}
                        {templates.map((template) => (
                            <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-200 transition-colors group">
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center shrink-0 border">
                                        {template.svgPath?.endsWith('.pdf') ? (
                                            <span className="text-[10px] font-bold text-red-600">PDF</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-blue-600">SVG</span>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                                        <p className="text-xs text-gray-500 truncate">{template.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(template.id)}
                                    disabled={isLoading}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                    title="Delete Template"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
