'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { uploadTemplate, getTemplates, deleteTemplate } from '@/app/actions';
import { Loader2, Check, AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fabric } from 'fabric';

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
        const file = formData.get('file') as File;

        if (file && file.name.endsWith('.svg')) {
            try {
                const text = await file.text();
                // We need to wait for Fabric to load the SVG
                await new Promise<void>((resolve) => {
                    fabric.loadSVGFromString(text, (objects, options) => {
                        const tempCanvas = new fabric.Canvas(null, {
                            width: options.width || 1000,
                            height: options.height || 1000
                        });

                        // --- SMART TEXT MERGER ---
                        // CorelDRAW/Illustrator often export paragraphs as separate lines.
                        // We try to merge them back into a single Textbox.

                        // Add objects to canvas first to get dimensions
                        objects.forEach((obj, i) => {
                            if (!(obj as any).name) (obj as any).name = `object_${i}`;
                            tempCanvas.add(obj);
                        });

                        const textObjects = tempCanvas.getObjects().filter(o => o.type === 'text' || o.type === 'i-text');

                        // Sort by Y position to process top-down
                        textObjects.sort((a, b) => (a.top || 0) - (b.top || 0));

                        const mergedGroups: fabric.Object[][] = [];
                        let currentGroup: fabric.Object[] = [];

                        textObjects.forEach((obj, index) => {
                            if (currentGroup.length === 0) {
                                currentGroup.push(obj);
                                return;
                            }

                            const prev = currentGroup[currentGroup.length - 1] as any;
                            const curr = obj as any;

                            // Check compatibility
                            const isSameFont = prev.fontFamily === curr.fontFamily;
                            const isSameSize = Math.abs((prev.fontSize || 0) - (curr.fontSize || 0)) < 2;
                            const isSameColor = prev.fill === curr.fill;

                            // Check layout (Vertical proximity & Horizontal alignment)
                            // Line height factor approx 1.2 to 1.5
                            const verticalGap = (curr.top || 0) - ((prev.top || 0) + (prev.height || 0));
                            const isCloseVertically = verticalGap > -5 && verticalGap < ((prev.fontSize || 20) * 1.5);
                            const isAlignedLeft = Math.abs((prev.left || 0) - (curr.left || 0)) < 10;
                            const isAlignedCenter = Math.abs(((prev.left || 0) + (prev.width || 0) / 2) - ((curr.left || 0) + (curr.width || 0) / 2)) < 10;

                            if (isSameFont && isSameSize && isSameColor && isCloseVertically && (isAlignedLeft || isAlignedCenter)) {
                                currentGroup.push(curr);
                            } else {
                                mergedGroups.push([...currentGroup]);
                                currentGroup = [curr];
                            }
                        });
                        if (currentGroup.length > 0) mergedGroups.push(currentGroup);

                        // Process groups and replace with Textbox
                        mergedGroups.forEach(group => {
                            if (group.length > 1) {
                                const first = group[0];
                                const combinedText = group.map((o: any) => o.text).join('\n');

                                // Create new Textbox
                                const newTextbox = new fabric.Textbox(combinedText, {
                                    ...first.toObject(['left', 'top', 'fill', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'shadow', 'opacity']),
                                    width: Math.max(...group.map(o => o.getScaledWidth())), // Use widest line
                                    splitByGrapheme: false
                                });

                                // Remove old objects
                                group.forEach(o => tempCanvas.remove(o));

                                // Add new merged object
                                tempCanvas.add(newTextbox);
                            }
                        });

                        // Re-render to ensure bounds are correct before export
                        tempCanvas.renderAll();

                        let textCount = 0;
                        let pathCount = 0;
                        tempCanvas.getObjects().forEach(obj => {
                            if (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') textCount++;
                            if (obj.type === 'path') pathCount++;
                        });

                        if (textCount === 0 && pathCount > 0) {
                            alert('⚠️ Warning: No editable text found in this SVG.\n\nIt looks like all text has been converted to shapes (paths).\n\nTo keep text editable:\n1. Open your design software (Illustrator/Inkscape)\n2. Export as SVG\n3. Ensure "Convert to Outlines" is UNCHECKED\n4. Select "Embed Fonts" or "SVG" for font options.');
                        }

                        const json = tempCanvas.toJSON();
                        formData.append('fabricConfig', JSON.stringify(json));
                        tempCanvas.dispose();
                        resolve();
                    });
                });
            } catch (err) {
                console.error('Error generating Fabric JSON:', err);
                // Continue anyway, maybe the server-side extraction will work
            }
        }

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
                            <div className="mt-2 text-xs text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="font-semibold mb-1">💡 For Editable Text:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>Export as <strong>SVG</strong></li>
                                    <li>Fonts: Set to <strong>"SVG"</strong> or <strong>"Embed"</strong></li>
                                    <li><strong>DO NOT</strong> use "Create Outlines" or "Convert to Curves"</li>
                                </ul>
                            </div>
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
