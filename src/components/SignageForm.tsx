'use client';

import React from 'react';
import { SignageData } from '@/lib/types';
import { Plus, X, Upload, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignageFormProps {
    data: SignageData;
    onChange: (data: SignageData) => void;
    onLogoUpload?: (file: File, tempUrl: string) => void;
    className?: string;
    usedTemplateKeys?: string[];
}

const InputField = ({ label, icon: Icon, name, value, type = "text", placeholder, isTextArea = false, onChange }: any) => (
    <div className="relative group/input">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 mb-1 block group-focus-within/input:text-indigo-400 transition-colors">
            {label}
        </label>
        {isTextArea ? (
            <textarea
                name={name}
                value={value || ''}
                onChange={onChange}
                rows={2}
                className={cn(
                    "w-full bg-white/5 border border-white/5 rounded-lg pr-4 py-2.5 pl-4 text-white placeholder-slate-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none font-medium text-sm transition-all resize-none shadow-inner"
                )}
                placeholder={placeholder || label}
            />
        ) : (
            <input
                type={type}
                name={name}
                value={value || ''}
                onChange={onChange}
                className={cn(
                    "w-full bg-white/5 border border-white/5 rounded-lg pr-4 py-2.5 pl-4 text-white placeholder-slate-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none font-medium text-sm transition-all shadow-inner"
                )}
                placeholder={placeholder || label}
            />
        )}
    </div>
);

export function SignageForm({ data, onChange, onLogoUpload, className = "", usedTemplateKeys = [] }: SignageFormProps) {
    const [focusedIndex, setFocusedIndex] = React.useState<number | null>(null);
    const [newFieldName, setNewFieldName] = React.useState('');
    const [isAddingField, setIsAddingField] = React.useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('custom_')) {
            const fieldKey = name.replace('custom_', '');
            const newCustom = { ...(data.customFields || {}), [fieldKey]: value };
            onChange({ ...data, customFields: newCustom });
        } else {
            onChange({ ...data, [name]: value });
        }
    };

    const processImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(URL.createObjectURL(file));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;
                const threshold = 240;
                for (let i = 0; i < pixels.length; i += 4) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    if (r > threshold && g > threshold && b > threshold) {
                        pixels[i + 3] = 0;
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && onLogoUpload) {
            const file = e.target.files[0];
            const processedUrl = await processImage(file);
            onLogoUpload(file, processedUrl);
        }
    };

    const standardKeys = ['template_company', 'template_address', 'template_details', 'template_gstin', 'template_cin', 'template_mobile', 'template_email', 'template_website'];
    const customKeys = Array.from(new Set([
        ...usedTemplateKeys
            .filter(k => k.startsWith('template_') && !standardKeys.includes(k) && !k.startsWith('template_additional_'))
            .map(k => k.replace('template_', '')),
        ...Object.keys(data.customFields || {})
    ]));

    const isUsed = (key: string) => usedTemplateKeys.includes(key);

    return (
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${className}`}>
            <div className="flex flex-col gap-3">
                {/* Standard Business Fields - Adaptive */}
                {isUsed('template_company') && (
                    <InputField
                        label="Company Name"
                        name="companyName"
                        value={data.companyName}
                        onChange={handleChange}
                    />
                )}
                {isUsed('template_address') && (
                    <InputField
                        label="Address"
                        name="address"
                        value={data.address}
                        isTextArea={true}
                        onChange={handleChange}
                    />
                )}
                {isUsed('template_gstin') && (
                    <InputField
                        label="GSTIN"
                        name="gstin"
                        value={data.gstin}
                        onChange={handleChange}
                    />
                )}
                {isUsed('template_cin') && (
                    <InputField
                        label="CIN"
                        name="cin"
                        value={data.cin}
                        onChange={handleChange}
                    />
                )}
                {isUsed('template_mobile') && (
                    <InputField
                        label="Phone"
                        name="mobile"
                        value={data.mobile}
                        onChange={handleChange}
                    />
                )}
                {isUsed('template_email') && (
                    <InputField
                        label="Email"
                        name="email"
                        value={data.email}
                        onChange={handleChange}
                    />
                )}
                {isUsed('template_website') && (
                    <InputField
                        label="Website"
                        name="website"
                        value={data.website}
                        onChange={handleChange}
                    />
                )}

                {/* Custom Label Fields */}
                {customKeys.map(key => (
                    <div key={key} className="flex gap-2 group/field items-end">
                        <div className="flex-1">
                            <InputField
                                label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                name={`custom_${key}`}
                                value={data.customFields?.[key]}
                                onChange={handleChange}
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                const newCustom = { ...(data.customFields || {}) };
                                delete newCustom[key];
                                onChange({ ...data, customFields: newCustom });
                            }}
                            className="p-2.5 mb-0.5 text-slate-500 hover:text-rose-400 opacity-0 group-hover/field:opacity-100 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}

                {/* Additional Text Section - Always Visible */}
                <div className="space-y-2 mt-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1 block mb-2 opacity-80">
                        Additional Details
                    </label>
                    <div className="space-y-2">
                        {(data.additionalText || []).map((text, index) => (
                            <div key={`additional-${index}`} className="flex gap-2 group">
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        value={text}
                                        onFocus={() => setFocusedIndex(index)}
                                        onBlur={() => setTimeout(() => setFocusedIndex(null), 200)}
                                        onChange={(e) => {
                                            const newText = [...(data.additionalText || [])];
                                            newText[index] = e.target.value;
                                            onChange({ ...data, additionalText: newText });
                                        }}
                                        placeholder="Enter details..."
                                        className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:border-indigo-500 outline-none font-medium text-sm transition-all"
                                    />
                                </div>
                                {focusedIndex === index && (
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            if (document.activeElement instanceof HTMLElement) {
                                                document.activeElement.blur();
                                            }
                                            setFocusedIndex(null);
                                        }}
                                        className="p-2.5 text-emerald-400"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const newText = (data.additionalText || []).filter((_, i) => i !== index);
                                        onChange({ ...data, additionalText: newText });
                                    }}
                                    className="p-2.5 text-slate-500 hover:text-rose-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                const newText = [...(data.additionalText || []), ''];
                                onChange({ ...data, additionalText: newText });
                            }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold rounded-[0.75rem] transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Add Detail Line
                        </button>

                        {isAddingField ? (
                            <div className="flex gap-2 animate-in slide-in-from-top-1 duration-200 mt-1">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newFieldName}
                                    onChange={(e) => setNewFieldName(e.target.value)}
                                    placeholder="Field Label (e.g. Hours)"
                                    className="flex-1 bg-white/5 border border-indigo-500/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 outline-none font-medium text-sm"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newFieldName.trim()) {
                                            const key = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
                                            onChange({
                                                ...data,
                                                customFields: { ...(data.customFields || {}), [key]: '' }
                                            });
                                            setNewFieldName('');
                                            setIsAddingField(false);
                                        } else if (e.key === 'Escape') {
                                            setIsAddingField(false);
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        if (newFieldName.trim()) {
                                            const key = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
                                            onChange({
                                                ...data,
                                                customFields: { ...(data.customFields || {}), [key]: '' }
                                            });
                                            setNewFieldName('');
                                            setIsAddingField(false);
                                        }
                                    }}
                                    className="bg-indigo-600 p-2.5 rounded-lg text-white"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIsAddingField(false)} className="bg-slate-800 p-2.5 rounded-lg text-slate-400">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsAddingField(true)}
                                className="w-full py-2 text-slate-500 hover:text-indigo-400 text-[9px] font-black uppercase tracking-[0.25em] transition-colors"
                            >
                                + Create Custom Label
                            </button>
                        )}
                    </div>
                </div>

                {/* Logo Upload - Adaptive */}
                {isUsed('template_logo') && (
                    <label className="flex items-center justify-center w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-semibold rounded-lg transition-all border border-white/5 cursor-pointer gap-2 text-sm mt-1">
                        <Upload className="w-4 h-4" />
                        Upload Logo
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                )}
            </div>
        </div>
    );
}
