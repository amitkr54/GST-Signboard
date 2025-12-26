'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { uploadTemplate } from '@/app/actions';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setMessage(null);

        const formData = new FormData(event.currentTarget);
        const res = await uploadTemplate(formData);

        if (res.success) {
            setMessage({ type: 'success', text: 'Template uploaded successfully!' });
            (event.target as HTMLFormElement).reset();
            router.refresh();
        } else {
            setMessage({ type: 'error', text: res.error || 'Upload failed' });
        }
        setIsLoading(false);
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">Admin Dashboard</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Admin PIN</label>
                        <input
                            type="password"
                            name="pin"
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
                    <a href="/design" className="text-blue-600 hover:underline text-sm">
                        Go to Design Editor &rarr;
                    </a>
                </div>
            </div>
        </div>
    );
}
