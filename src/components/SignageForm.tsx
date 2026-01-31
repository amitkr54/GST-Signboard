import React from 'react';
import { SignageData } from '@/lib/types';
import { Type, Plus, X, Upload, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignageFormProps {
    data: SignageData;
    onChange: (data: SignageData) => void;
    onLogoUpload?: (file: File, tempUrl: string) => void;
    className?: string;
    usedTemplateKeys?: string[];
}

const InputField = ({ label, icon: Icon, name, value, type = "text", placeholder, isTextArea = false, onChange }: any) => (
    <div className="relative group">
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

    // ... (keep processImage and handleFileChange exactly as is)
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

    // Filter custom keys that aren't standard
    const standardKeys = ['template_company', 'template_address', 'template_details', 'template_gstin', 'template_cin', 'template_mobile', 'template_email', 'template_website'];
    const customKeys = usedTemplateKeys
        .filter(k => k.startsWith('template_') && !standardKeys.includes(k) && !k.startsWith('template_additional_'))
        .map(k => k.replace('template_', ''));

    const isUsed = (key: string) => usedTemplateKeys.includes(key);

    return (
        <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${className}`}>
            <div className="flex flex-col gap-2">
                {[
                    isUsed('template_company') && (
                        <InputField
                            key="company"
                            label="Company Name"
                            name="companyName"
                            value={data.companyName}
                            placeholder="Company Name"
                            onChange={handleChange}
                        />
                    ),
                    isUsed('template_address') && (
                        <InputField
                            key="address"
                            label="Address"
                            name="address"
                            value={data.address}
                            placeholder="Address"
                            isTextArea={true}
                            onChange={handleChange}
                        />
                    ),
                    ...customKeys.map(key => (
                        <InputField
                            key={key}
                            label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            name={`custom_${key}`}
                            value={data.customFields?.[key]}
                            onChange={handleChange}
                        />
                    )),
                    isUsed('template_gstin') && (
                        <InputField
                            key="gstin"
                            label="GSTIN"
                            name="gstin"
                            value={data.gstin}
                            placeholder="GSTIN"
                            onChange={handleChange}
                        />
                    ),
                    isUsed('template_cin') && (
                        <InputField
                            key="cin"
                            label="CIN"
                            name="cin"
                            value={data.cin}
                            placeholder="CIN"
                            onChange={handleChange}
                        />
                    ),
                    isUsed('template_mobile') && (
                        <InputField
                            key="mobile"
                            label="Phone"
                            name="mobile"
                            value={data.mobile}
                            placeholder="Phone"
                            onChange={handleChange}
                        />
                    ),
                    isUsed('template_email') && (
                        <InputField
                            key="email"
                            label="Email"
                            name="email"
                            value={data.email}
                            placeholder="Email"
                            onChange={handleChange}
                        />
                    ),
                    isUsed('template_website') && (
                        <InputField
                            key="website"
                            label="Website"
                            name="website"
                            value={data.website}
                            placeholder="Website"
                            onChange={handleChange}
                        />
                    ),
                    (isUsed('template_details') || usedTemplateKeys.some(k => k.startsWith('template_additional_'))) && (
                        <React.Fragment key="additional-details-container">
                            {(data.additionalText || []).map((text, index) => (
                                <div key={`additional-${index}`} className="flex gap-2 animate-in slide-in-from-right-4 duration-300">
                                    <div className="relative flex-1 group">
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
                                            className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:border-indigo-500 outline-none font-medium text-sm transition-all shadow-inner"
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
                                            className="p-2.5 text-slate-500 hover:text-emerald-400 transition-colors animate-in fade-in zoom-in duration-200"
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
                            <button
                                type="button"
                                onClick={() => {
                                    const newText = [...(data.additionalText || []), ''];
                                    onChange({ ...data, additionalText: newText });
                                }}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Additional Detail
                            </button>
                        </React.Fragment>
                    ),
                    isUsed('template_logo') && (
                        <label key="logo-upload" className="flex items-center justify-center w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-semibold rounded-lg transition-all shadow-lg shadow-indigo-600/10 cursor-pointer gap-2 text-sm mt-1">
                            <Upload className="w-4 h-4" />
                            Upload Business Logo
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                    )
                ].filter(Boolean)}
            </div>
        </div>
    );
}
