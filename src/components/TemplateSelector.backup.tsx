import React, { useEffect, useState } from 'react';
import { TEMPLATES, Template } from '@/lib/templates';
import { TemplateId } from '@/lib/types';
import { Check } from 'lucide-react';
import { getTemplates } from '@/app/actions';

interface TemplateSelectorProps {
    selectedTemplateId: TemplateId | undefined;
    onSelect: (id: TemplateId) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selectedTemplateId, onSelect }) => {
    const [templates, setTemplates] = useState<Template[]>(TEMPLATES);

    useEffect(() => {
        const fetchTemplates = async () => {
            const data = await getTemplates();
            if (data && data.length > 0) {
                // Ensure local hardcoded ones are replaced or merged?
                // Since we seeded JSON with all of them, replacement is safe.
                setTemplates(data);
            }
        };
        fetchTemplates();
    }, []);

    return (
        <div className="grid grid-cols-2 gap-3 p-1">
            {/* Custom Design Option */}
            <button
                key="custom-blank"
                onClick={() => onSelect('custom' as TemplateId)}
                className={`relative group rounded-xl border-2 transition-all overflow-hidden text-left bg-gray-50
                    ${selectedTemplateId === 'custom' || !selectedTemplateId
                        ? 'border-purple-600 shadow-md ring-1 ring-purple-600'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                    }`}
            >
                <div className="h-24 w-full relative flex items-center justify-center bg-white">
                    <div className="w-16 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400">
                        <span className="text-xl font-light">+</span>
                    </div>
                    {/* Validated Badge */}
                    {(selectedTemplateId === 'custom' || !selectedTemplateId) && (
                        <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full">
                            <Check className="w-3 h-3" />
                        </div>
                    )}
                </div>
                <div className="p-3 bg-white">
                    <h4 className="text-sm font-semibold text-gray-900">Custom Design</h4>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">Start from scratch</p>
                </div>
            </button>
            {templates.map((template) => (
                <button
                    key={template.id}
                    onClick={() => onSelect(template.id as TemplateId)}
                    className={`relative group rounded-xl border-2 transition-all overflow-hidden text-left
                        ${selectedTemplateId === template.id
                            ? 'border-purple-600 shadow-md ring-1 ring-purple-600'
                            : 'border-gray-200 hover:border-purple-300 hover:shadow-sm'
                        }`}
                >
                    {/* Preview Area */}
                    <div
                        className="h-24 w-full relative"
                        style={{ backgroundColor: template.thumbnailColor }}
                    >
                        {/* Thumbnail or Mock Layout */}
                        {template.thumbnail ? (
                            <img
                                src={template.thumbnail}
                                alt={template.name}
                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        ) : template.svgPath ? (
                            /* SVG Preview - Simple Iframe or Image? Image src='path.svg' works */
                            <img
                                src={template.svgPath}
                                alt={template.name}
                                className="w-full h-full object-contain p-2 opacity-90 group-hover:opacity-100 transition-opacity"
                            />
                        ) : (
                            <div className="absolute inset-0 p-3 opacity-50 flex items-center justify-center">
                                {template.layoutType === 'default' && (
                                    <div className="flex flex-col items-center gap-2 w-full">
                                        <div className="w-8 h-8 rounded-full bg-gray-400"></div>
                                        <div className="w-3/4 h-2 bg-gray-300 rounded"></div>
                                        <div className="w-1/2 h-2 bg-gray-300 rounded"></div>
                                    </div>
                                )}
                                {template.layoutType === 'split-left' && (
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-8 h-8 rounded bg-gray-400"></div>
                                        <div className="flex-1 space-y-1">
                                            <div className="w-full h-2 bg-gray-300 rounded"></div>
                                            <div className="w-2/3 h-2 bg-gray-300 rounded"></div>
                                        </div>
                                    </div>
                                )}
                                {template.layoutType === 'split-right' && (
                                    <div className="flex items-center gap-3 w-full flex-row-reverse">
                                        <div className="w-8 h-8 rounded bg-gray-400"></div>
                                        <div className="flex-1 space-y-1">
                                            <div className="w-full h-2 bg-gray-300 rounded"></div>
                                            <div className="w-2/3 h-2 bg-gray-300 rounded"></div>
                                        </div>
                                    </div>
                                )}
                                {template.layoutType === 'centered' && (
                                    <div className="flex flex-col items-center gap-3 w-full">
                                        <div className="w-12 h-12 rounded-lg bg-gray-800"></div>
                                        <div className="w-3/4 h-3 bg-gray-700 rounded"></div>
                                    </div>
                                )}
                                {template.layoutType === 'banner' && (
                                    <div className="flex items-center justify-between w-full px-2">
                                        <div className="w-2/3 h-4 bg-gray-300 rounded"></div>
                                        <div className="w-6 h-6 rounded-full bg-gray-400"></div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Validated Badge */}
                        {selectedTemplateId === template.id && (
                            <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full">
                                <Check className="w-3 h-3" />
                            </div>
                        )}
                    </div>

                    {/* Info Area */}
                    <div className="p-3 bg-white">
                        <h4 className="text-sm font-semibold text-gray-900">{template.name}</h4>
                        <p className="text-[10px] text-gray-500 line-clamp-2 mt-0.5">{template.description}</p>
                    </div>
                </button>
            ))}
        </div>
    );
};

