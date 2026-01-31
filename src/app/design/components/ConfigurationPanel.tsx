'use client';

import React, { useState, useEffect } from 'react';
import { Download, ArrowRight, Loader2, Settings, Info, Tag, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MaterialSelector } from '@/components/MaterialSelector';
import { DesignConfig, SignageData } from '@/lib/types';
import { MaterialId } from '@/lib/utils';

interface ConfigurationPanelProps {
    data?: SignageData;
    design: DesignConfig;
    setDesign: (design: DesignConfig) => void;
    material: MaterialId;
    setMaterial: (material: MaterialId) => void;
    deliveryType: 'standard' | 'fast';
    setDeliveryType: (type: 'standard' | 'fast') => void;
    includeInstallation: boolean;
    setIncludeInstallation: (include: boolean) => void;
    paymentScheme: 'full' | 'part';
    setPaymentScheme: (scheme: 'full' | 'part') => void;
    advanceAmount: number;
    setAdvanceAmount: (amount: number) => void;
    price: number;
    isProcessing: boolean;
    isPriceLoading?: boolean;
    isFixedProduct: boolean;
    handleDownload: (format: 'svg' | 'pdf') => void;
    setShowReviewModal: (show: boolean) => void;
    setReviewCanvasJSON: (json: any) => void;
    FAST_DELIVERY_COST: number;
    INSTALLATION_COST: number;
    selectedObject?: any;
    isAdmin?: boolean;
    usedTemplateKeys?: string[];
    onUpdateObject?: (props: any) => void;
    onAddText?: (type: 'heading' | 'subheading' | 'body', options?: { name?: string; text?: string }) => void;
}

export function ConfigurationPanel({
    design,
    setDesign,
    material,
    setMaterial,
    deliveryType,
    setDeliveryType,
    includeInstallation,
    setIncludeInstallation,
    paymentScheme,
    setPaymentScheme,
    advanceAmount,
    setAdvanceAmount,
    price,
    isProcessing,
    isPriceLoading,
    isFixedProduct,
    handleDownload,
    setShowReviewModal,
    setReviewCanvasJSON,
    FAST_DELIVERY_COST,
    INSTALLATION_COST,
    selectedObject,
    isAdmin,
    usedTemplateKeys = [],
    onUpdateObject,
    onAddText,
    data
}: ConfigurationPanelProps) {
    const [layerName, setLayerName] = useState('');

    useEffect(() => {
        if (selectedObject) {
            setLayerName(selectedObject.name || '');
        } else {
            setLayerName('');
        }
    }, [selectedObject]);

    return (
        <div className="w-[340px] bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shrink-0 z-10 flex flex-col custom-scrollbar">
            <div className="p-0 flex-1">
                <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        {isAdmin ? <Settings className="w-4 h-4 text-indigo-400" /> : null}
                        {isAdmin ? 'Admin Tools' : 'Configuration'}
                    </h3>
                    <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">Need Help?</button>
                </div>

                <div className="p-6 space-y-8">
                    {/* ADMIN LAYER MANAGEMENT */}
                    {isAdmin && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="p-5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag className="w-4 h-4 text-indigo-400" />
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Smart Mapping</h4>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-400 font-bold uppercase block px-1">Selected Layer Name</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={layerName}
                                            disabled={!selectedObject && !isAdmin}
                                            onChange={(e) => setLayerName(e.target.value)}
                                            onBlur={(e) => {
                                                const val = e.target.value.trim();
                                                if (selectedObject && val) {
                                                    const finalKey = val.startsWith('template_') ? val : `template_${val}`;
                                                    setLayerName(finalKey);
                                                    onUpdateObject?.({ name: finalKey });
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = (e.target as HTMLInputElement).value.trim();
                                                    if (val) {
                                                        const finalKey = val.startsWith('template_') ? val : `template_${val}`;
                                                        setLayerName(finalKey);
                                                        if (selectedObject) {
                                                            onUpdateObject?.({ name: finalKey });
                                                        } else if (isAdmin) {
                                                            onAddText?.('body', { name: finalKey });
                                                        }
                                                        (e.target as HTMLInputElement).blur();
                                                    }
                                                }
                                            }}
                                            placeholder={isAdmin ? "e.g. template_hours" : (selectedObject ? "e.g. template_company" : "Select an object...")}
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all disabled:opacity-30"
                                        />
                                        <button
                                            onClick={() => {
                                                const val = layerName.trim();
                                                if (val) {
                                                    const finalKey = val.startsWith('template_') ? val : `template_${val}`;
                                                    setLayerName(finalKey);
                                                    if (selectedObject) {
                                                        onUpdateObject?.({ name: finalKey });
                                                    } else if (isAdmin) {
                                                        onAddText?.('body', { name: finalKey });
                                                    }
                                                }
                                            }}
                                            disabled={!selectedObject && !isAdmin}
                                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 px-4 rounded-lg text-xs font-bold text-white transition-all shadow-lg shadow-indigo-600/20"
                                        >
                                            {selectedObject ? 'Set' : 'Add'}
                                        </button>
                                    </div>
                                    {!selectedObject && (
                                        <p className="text-[10px] text-amber-400 font-medium px-1 flex items-center gap-1.5 mt-2">
                                            <Info className="w-3 h-3" /> Select a text layer to enable mapping
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2">
                                    <h5 className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest mb-3 border-b border-indigo-500/10 pb-2">Valid Smart Keys</h5>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {(() => {
                                            const predefined = [
                                                { key: 'template_company', label: 'Business Name' },
                                                { key: 'template_address', label: 'Office Address' },
                                                { key: 'template_logo', label: 'Company Logo' },
                                                { key: 'template_gstin', label: 'GST Number' },
                                                { key: 'template_cin', label: 'CIN Number' },
                                                { key: 'template_mobile', label: 'Contact/WhatsApp' },
                                                { key: 'template_email', label: 'Company Email' },
                                                { key: 'template_website', label: 'Website' }
                                            ];

                                            // Find any keys used on canvas OR in data state that aren't predefined
                                            const combinedKeys = Array.from(new Set([
                                                ...usedTemplateKeys,
                                                ...Object.keys(data?.customFields || {}).map(k => `template_${k}`)
                                            ]));

                                            const customOnCanvas = combinedKeys
                                                .filter(k => !predefined.some(p => p.key === k))
                                                .map(k => ({
                                                    key: k,
                                                    label: k.replace('template_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                                    isCustom: true
                                                }));

                                            const allKeys = [...predefined, ...customOnCanvas];

                                            return allKeys.map(item => {
                                                const isSelected = layerName === item.key;
                                                const isUsed = usedTemplateKeys.includes(item.key);

                                                return (
                                                    <div
                                                        key={item.key}
                                                        onClick={() => {
                                                            if (selectedObject) {
                                                                setLayerName(item.key);
                                                                onUpdateObject?.({ name: item.key });
                                                            }
                                                        }}
                                                        className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white' : (isUsed ? 'bg-green-500/20 border-green-500/50 text-green-100 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-slate-900/50 border-slate-700 text-gray-400 hover:border-indigo-500/50 hover:text-white')}`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isUsed && (
                                                                <div className={`flex items-center justify-center w-4 h-4 rounded-full ${isSelected ? 'bg-white/20' : 'bg-green-500'}`}>
                                                                    <Check className={`w-2.5 h-2.5 ${isSelected ? 'text-white' : 'text-slate-900'}`} />
                                                                </div>
                                                            )}
                                                            <code className={`text-[10px] font-mono ${isUsed && !isSelected ? 'text-green-300' : ''}`}>{item.key}</code>
                                                        </div>
                                                        <span className={`text-[10px] font-bold ${isSelected ? 'opacity-100' : 'opacity-60'}`}>→ {item.label}</span>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            </div>
                            <div className="h-px bg-slate-800 mx-[-24px]" />
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-400 uppercase">Dimensions</label>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-gray-300 rounded border border-slate-700">
                                {design.unit}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg flex justify-between text-white"><span className="text-gray-400">W</span>{design.width}</div>
                            <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg flex justify-between text-white"><span className="text-gray-400">H</span>{design.height}</div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-800 space-y-5">
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-white block">Background</label>
                            <div className="grid grid-cols-2 p-1 bg-slate-900/50 rounded-lg border border-slate-700">
                                <button
                                    onClick={() => setDesign({ ...design, backgroundGradientEnabled: false })}
                                    className={`py-2 text-xs font-bold rounded-lg transition-all ${!design.backgroundGradientEnabled ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Solid
                                </button>
                                <button
                                    onClick={() => setDesign({ ...design, backgroundGradientEnabled: true })}
                                    className={`py-2 text-xs font-bold rounded-lg transition-all ${design.backgroundGradientEnabled ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Gradient
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-5">
                                {/* Primary Color Section */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] text-gray-500 font-bold uppercase">{design.backgroundGradientEnabled ? 'Color 1' : 'Pick Color'}</label>
                                        {!design.backgroundGradientEnabled && <span className="text-[10px] text-indigo-400 font-medium">{design.backgroundColor.toUpperCase()}</span>}
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {['#ffffff', '#000000', '#7D2AE8', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#ec4899'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setDesign({ ...design, backgroundColor: c })}
                                                className={`w-7 h-7 rounded-full border transition-all hover:scale-110 ${design.backgroundColor === c ? 'ring-2 ring-indigo-500 scale-110 z-10' : 'border-slate-700'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                        <div className={`relative w-7 h-7 rounded-full ring-black/5 overflow-hidden shadow-sm hover:ring-black/20 transition-all ${!['#ffffff', '#000000', '#7D2AE8', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#ec4899'].includes(design.backgroundColor) ? 'ring-2 ring-indigo-500 scale-110 z-10' : 'ring-1'}`}>
                                            <div className="absolute inset-0 w-full h-full bg-[conic-gradient(from_180deg_at_50%_50%,#FF0000_0deg,#00FF00_120deg,#0000FF_240deg,#FF0000_360deg)] opacity-80 pointer-events-none" />
                                            <input
                                                type="color"
                                                value={design.backgroundColor}
                                                onChange={(e) => setDesign({ ...design, backgroundColor: e.target.value })}
                                                className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0 z-10"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Gradient Specific Options */}
                                {design.backgroundGradientEnabled && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-500 font-bold uppercase px-1">Color 2</label>
                                            <div className="flex flex-wrap gap-2.5">
                                                {['#ffffff', '#f3f4f6', '#000000', '#7D2AE8', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'].map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setDesign({ ...design, backgroundColor2: c })}
                                                        className={`w-7 h-7 rounded-full border transition-all hover:scale-110 ${design.backgroundColor2 === c ? 'ring-2 ring-indigo-500 scale-110 z-10' : 'border-slate-700'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                                <div className={`relative w-7 h-7 rounded-full ring-black/5 overflow-hidden shadow-sm hover:ring-black/20 transition-all ${!['#ffffff', '#f3f4f6', '#000000', '#7D2AE8', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'].includes(design.backgroundColor2) ? 'ring-2 ring-indigo-500 scale-110 z-10' : 'ring-1'}`}>
                                                    <div className="absolute inset-0 w-full h-full bg-[conic-gradient(from_180deg_at_50%_50%,#FF0000_0deg,#00FF00_120deg,#0000FF_240deg,#FF0000_360deg)] opacity-80 pointer-events-none" />
                                                    <input
                                                        type="color"
                                                        value={design.backgroundColor2 || '#ffffff'}
                                                        onChange={(e) => setDesign({ ...design, backgroundColor2: e.target.value })}
                                                        className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0 z-10"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center px-1">
                                                <label className="text-[10px] text-gray-500 font-bold uppercase">Angle</label>
                                                <span className="text-[10px] text-indigo-400 font-medium">{design.backgroundGradientAngle || 0}°</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="360"
                                                value={design.backgroundGradientAngle || 0}
                                                onChange={(e) => setDesign({ ...design, backgroundGradientAngle: parseInt(e.target.value) })}
                                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={() => handleDownload('svg')} variant="outline" className="flex-1 gap-2 h-9 text-xs border-slate-700 bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-indigo-400 hover:border-indigo-500 rounded-full">
                                    <Download className="w-3.5 h-3.5" />
                                    SVG
                                </Button>
                                <Button onClick={() => handleDownload('pdf')} variant="outline" className="flex-1 gap-2 h-9 text-xs border-slate-700 bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-red-400 hover:border-red-500 rounded-full">
                                    <Download className="w-3.5 h-3.5" />
                                    PDF
                                </Button>
                            </div>
                        </div>
                    </div>

                    {!isFixedProduct && (
                        <div className="pt-6 border-t border-slate-800">
                            <label className="text-sm font-bold text-white mb-3 block">Material</label>
                            <MaterialSelector selectedMaterial={material} onSelect={setMaterial} dimensions={{ width: design.width, height: design.height, unit: design.unit }} />
                        </div>
                    )}

                    <div className="pt-6 border-t border-slate-800 space-y-4">
                        <label className="text-sm font-bold text-white block">Delivery Speed</label>
                        <div className="space-y-3">
                            <button
                                onClick={() => setDeliveryType('standard')}
                                className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${deliveryType === 'standard' ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${deliveryType === 'standard' ? 'border-indigo-400 bg-indigo-400' : 'border-slate-600'}`}>
                                        {deliveryType === 'standard' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">Standard Delivery</p>
                                        <p className="text-xs text-gray-400">Arrives in 3-5 days</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Free</span>
                            </button>
                            <button
                                onClick={() => setDeliveryType('fast')}
                                className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${deliveryType === 'fast' ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${deliveryType === 'fast' ? 'border-indigo-400 bg-indigo-400' : 'border-slate-600'}`}>
                                        {deliveryType === 'fast' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">Next Day Delivery</p>
                                        <p className="text-xs text-gray-400 text-indigo-300">Fastest shipping</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">+₹{FAST_DELIVERY_COST}</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-bold text-white">Professional Installation</p>
                            <p className="text-xs text-gray-400">+₹{INSTALLATION_COST}</p>
                        </div>
                        <input type="checkbox" checked={includeInstallation} onChange={e => setIncludeInstallation(e.target.checked)} className="w-5 h-5 accent-indigo-500" />
                    </div>

                    <div className="pt-6 border-t border-slate-800">
                        <label className="text-sm font-bold text-white mb-3 block">Payment Scheme</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setPaymentScheme('part')} className={`p-3 rounded-lg border-2 text-left transition-all ${paymentScheme === 'part' ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                                <p className="font-bold text-white text-xs">Part Pay</p>
                                <p className="text-[9px] text-gray-400">25% Advance</p>
                            </button>
                            <button onClick={() => setPaymentScheme('full')} className={`p-3 rounded-lg border-2 text-left transition-all ${paymentScheme === 'full' ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                                <p className="font-bold text-white text-xs">Full Pay</p>
                                <p className="text-[9px] text-gray-400">100% Upfront</p>
                            </button>
                        </div>

                        {paymentScheme === 'part' && (
                            <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-lg animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Advance Amount</label>
                                    <span className="text-[10px] text-indigo-400 font-bold">MIN: ₹{Math.ceil(price * 0.25)}</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white font-bold">₹</span>
                                    <input
                                        type="number"
                                        value={advanceAmount}
                                        onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                                        onBlur={(e) => {
                                            const min = Math.ceil(price * 0.25);
                                            if (parseFloat(e.target.value) < min) setAdvanceAmount(min);
                                        }}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-7 pr-3 text-white font-bold text-sm focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-900/80 space-y-4">
                <div className="flex justify-between items-center bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 shadow-inner">
                    <span className="text-white/60 font-bold text-sm tracking-widest uppercase">Total Payable</span>
                    {isPriceLoading ? (
                        <div className="flex items-center gap-2 text-indigo-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-bold animate-pulse">Calculating...</span>
                        </div>
                    ) : (
                        <span className="text-3xl font-bold text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]">₹{price}</span>
                    )}
                </div>
                <button
                    onClick={() => {
                        const canvas = (window as any).fabricCanvas;
                        if (canvas) {
                            setReviewCanvasJSON(canvas.toJSON([
                                'name', 'id', 'isBackground',
                                'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation',
                                'selectable', 'evented', 'editable',
                                'hasControls', 'hoverCursor', 'moveCursor'
                            ]));
                        }
                        setShowReviewModal(true);
                    }}
                    disabled={isProcessing}
                    className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                    Proceed to Review <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
}
