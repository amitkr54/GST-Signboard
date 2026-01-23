'use client';

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { MaterialSelector } from '@/components/MaterialSelector';
import { EditorSidebar } from '@/components/EditorSidebar';
import { Button } from '@/components/ui/Button';
import { TemplateSelector } from '@/components/TemplateSelector';
import { DesignUpload } from '@/components/DesignUpload';
import { ReviewApproval } from '@/components/ReviewApproval';
import { ShareMenu } from '@/components/ShareMenu';
import { SignageData, DesignConfig, DEFAULT_DESIGN, TemplateId } from '@/lib/types';
import { calculateDynamicPrice, MaterialId } from '@/lib/utils';
import { createOrder, processPayment, trackReferral, initiatePhonePePayment, syncDesign, generateQRCode, getReferrerByCode, getTemplates, updateTemplateConfig, uploadThumbnail } from '@/app/actions';
import { MaterialProvider, useMaterials } from '@/context/MaterialContext';
import { ArrowRight, Truck, Wrench, ChevronLeft, Undo2, Redo2, Type, Image as ImageIcon, Square, QrCode, X, Loader2, Check, Maximize, Minimize, Phone, Mail, MapPin, Globe, Star, Heart, Clock, Calendar, User, Building, Palette, Grid3X3, Download, Plus } from 'lucide-react';
import { PreviewSection } from '@/components/PreviewSection';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Circle, Triangle, Minus } from 'lucide-react';
import { PRODUCTS } from '@/lib/products';
import { useAuth } from '@/components/AuthProvider';
import { CheckoutDetailsModal } from '@/components/CheckoutDetailsModal';
import { getFontBase64 } from '@/lib/font-utils';

const MOBILE_SHAPES = [
    { id: 'rect', icon: Square, label: 'Square' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'line', icon: Minus, label: 'Line' },
];

const MOBILE_ICONS = [
    { id: 'phone', icon: Phone, label: 'Phone' },
    { id: 'mail', icon: Mail, label: 'Email' },
    { id: 'location', icon: MapPin, label: 'Location' },
    { id: 'globe', icon: Globe, label: 'Globe' },
    { id: 'star', icon: Star, label: 'Star' },
    { id: 'heart', icon: Heart, label: 'Heart' },
    { id: 'clock', icon: Clock, label: 'Clock' },
    { id: 'calendar', icon: Calendar, label: 'Date' },
    { id: 'user', icon: User, label: 'User' },
    { id: 'building', icon: Building, label: 'Office' },
];

export default function DesignPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" />}>
            <MaterialProvider>
                <DesignContent />
            </MaterialProvider>
        </Suspense>
    );
}

function DesignContent() {
    const [data, setData] = useState<SignageData>({
        companyName: '',
        address: '',
    });
    const [design, setDesign] = useState<DesignConfig>(DEFAULT_DESIGN);
    const [templates, setTemplates] = useState<any[]>([]);
    const [material, setMaterial] = useState<MaterialId>('flex');
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadedDesign, setUploadedDesign] = useState<string | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const { getMaterial } = useMaterials();

    const [referralCode, setReferralCode] = useState('');
    const [isValidatingCode, setIsValidatingCode] = useState(false);
    const [codeValidated, setCodeValidated] = useState(false);

    const [deliveryType, setDeliveryType] = useState<'standard' | 'fast'>('standard');
    const [includeInstallation, setIncludeInstallation] = useState(false);

    const [contactDetails, setContactDetails] = useState({
        name: '',
        email: '',
        mobile: '',
        shippingAddress: ''
    });

    const [paymentScheme, setPaymentScheme] = useState<'full' | 'part'>('full');
    const [advanceAmount, setAdvanceAmount] = useState<number>(0);

    const [addTextFn, setAddTextFn] = useState<((type: 'heading' | 'subheading' | 'body') => void) | null>(null);
    const [addIconFn, setAddIconFn] = useState<((iconName: string) => void) | null>(null);
    const [addShapeFn, setAddShapeFn] = useState<((type: 'rect' | 'circle' | 'line' | 'triangle') => void) | null>(null);
    const [addImageFn, setAddImageFn] = useState<((imageUrl: string) => void) | null>(null);
    const [mobileTab, setMobileTab] = useState<'templates' | 'design' | 'material' | 'order'>('templates');
    const [activePicker, setActivePicker] = useState<'shapes' | 'icons' | 'background' | null>(null);
    const [showQRInput, setShowQRInput] = useState(false);
    const [qrText, setQrText] = useState('');
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [initialDesignJSON, setInitialDesignJSON] = useState<any>(null);
    const [reviewCanvasJSON, setReviewCanvasJSON] = useState<any>(null);

    const [isMobile, setIsMobile] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const productId = searchParams.get('product');
    const product = productId ? PRODUCTS.find(p => p.id === productId) : null;
    // Hide material selection if a product is provided AND it has only one (or zero) supported material
    const isFixedProduct = !!productId && (!product || product.materials.length <= 1);

    const registerAddText = useCallback((fn: any) => setAddTextFn(() => fn), []);
    const registerAddIcon = useCallback((fn: any) => setAddIconFn(() => fn), []);
    const registerAddShape = useCallback((fn: any) => setAddShapeFn(() => fn), []);
    const registerAddImage = useCallback((fn: any) => setAddImageFn(() => fn), []);

    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            setIsMobile(width < 1024);
            setIsLandscape(width > height && height < 600);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchAllTemplates = async () => {
            try {
                const data = await getTemplates();
                if (data && data.length > 0) setTemplates(data);
            } catch (err) { console.error('Failed to pre-fetch templates:', err); }
        };
        fetchAllTemplates();
    }, []);

    const hasAutoLoadedRef = useRef(false);

    const validateReferralCode = async (code: string) => {
        if (!code) { setCodeValidated(false); return; }
        setIsValidatingCode(true);
        const result = await getReferrerByCode(code);
        setCodeValidated(result.success && result.referrer !== null);
        setIsValidatingCode(false);
    };

    const handleTemplateSelect = useCallback((id: TemplateId, skipResize = false) => {
        const template = templates.find(t => t.id === id);

        // Don't resize canvas to match template - templates should scale to fit current canvas
        setDesign(prev => ({ ...prev, templateId: id }));

        if (isMobile) setMobileTab('design');

        // Template defaults are now stored in the database with each template
        // No need to auto-populate defaults here
    }, [templates, isMobile, setDesign, setMobileTab]);

    useEffect(() => {
        const refCode = searchParams.get('ref');
        if (refCode) {
            setReferralCode(refCode);
            validateReferralCode(refCode);
            document.cookie = `ref_code=${refCode}; max-age=${30 * 24 * 60 * 60}; path=/`;
        } else {
            const cookies = document.cookie.split('; ');
            const refCookie = cookies.find(c => c.startsWith('ref_code='));
            if (refCookie) {
                const code = refCookie.split('=')[1];
                setReferralCode(code);
                validateReferralCode(code);
            }
        }
    }, [searchParams]);

    // Auto-load template from URL parameter
    useEffect(() => {
        const templateParam = searchParams.get('template');
        if (templateParam && templates.length > 0 && !hasAutoLoadedRef.current) {
            const template = templates.find(t => t.id === templateParam);
            if (template) {
                const hasCustomSize = !!searchParams.get('width');
                handleTemplateSelect(templateParam as TemplateId, hasCustomSize);
                hasAutoLoadedRef.current = true;
            }
        }
    }, [searchParams, templates, handleTemplateSelect]);

    // Initialize dimensions and material from URL parameters
    useEffect(() => {
        const width = searchParams.get('width');
        const height = searchParams.get('height');
        const unit = searchParams.get('unit');

        if (width && height) {
            setDesign(prev => ({
                ...prev,
                width: Number(width),
                height: Number(height),
                unit: (unit as any) || prev.unit
            }));
        }

        const materialParam = searchParams.get('material');
        if (materialParam) {
            setMaterial(materialParam as MaterialId);
        } else if (product && product.materials.length > 0) {
            setMaterial(product.materials[0] as MaterialId);
        }
    }, [searchParams, product]);

    // RESTORE FROM DRAFT AFTER LOGIN
    useEffect(() => {
        const pendingDraft = localStorage.getItem('design_draft_pending');
        if (pendingDraft) {
            try {
                const draft = JSON.parse(pendingDraft);
                // Only restore if draft is recent (within 30 mins)
                if (Date.now() - draft.timestamp < 30 * 60 * 1000) {
                    if (draft.design) setInitialDesignJSON(draft.design);
                    if (draft.designConfig) setDesign(draft.designConfig);
                    if (draft.signageData) setData(draft.signageData);
                    if (draft.contactDetails) setContactDetails(draft.contactDetails);
                    if (draft.action === 'continue_checkout') {
                        setShowCheckoutModal(true);
                    }
                }
            } catch (e) {
                console.error('Failed to parse draft', e);
            } finally {
                localStorage.removeItem('design_draft_pending');
            }
        }
    }, []);

    const handleQRGenerate = async () => {
        if (!qrText.trim()) return;
        setIsGeneratingQR(true);
        try {
            const result = await generateQRCode(qrText);
            if (result.success && result.dataUrl) {
                addImageFn?.(result.dataUrl);
                setShowQRInput(false);
                setQrText('');
            } else alert('Failed to generate QR Code');
        } catch (err) { console.error(err); } finally { setIsGeneratingQR(false); }
    };

    const handleDesignUpload = (file: File, previewUrl: string) => setUploadedDesign(previewUrl);

    // Pricing Constants
    const REFERRAL_DISCOUNT = 150;
    const FAST_DELIVERY_COST = 200;
    const INSTALLATION_COST = 500;

    const initialPriceParam = searchParams.get('price');
    const initialPrice = initialPriceParam ? parseInt(initialPriceParam) : 0;

    const currentMaterial = getMaterial(material);
    const basePrice = currentMaterial ? calculateDynamicPrice(design.width, design.height, design.unit as any, currentMaterial.price_per_sqin) : initialPrice;
    const discount = (codeValidated && referralCode) ? REFERRAL_DISCOUNT : 0;
    const deliveryCost = deliveryType === 'fast' ? FAST_DELIVERY_COST : 0;
    const installationCost = includeInstallation ? INSTALLATION_COST : 0;
    const price = Math.max(initialPrice, basePrice - discount + deliveryCost + installationCost);

    useEffect(() => {
        const minAdvance = Math.ceil(price * 0.25);
        if (advanceAmount < minAdvance) {
            setAdvanceAmount(minAdvance);
        }
    }, [price, advanceAmount]);

    useEffect(() => { if (paymentScheme === 'part') setAdvanceAmount(Math.ceil(price * 0.25)); }, [price, paymentScheme]);

    const getExportDimensions = () => {
        const DPI = 100;
        const u = design.unit || 'in';

        // Exact print dimensions in inches
        let wIn = design.width;
        let hIn = design.height;
        if (u === 'ft') { wIn *= 12; hIn *= 12; }
        else if (u === 'cm') { wIn /= 2.54; hIn /= 2.54; }
        else if (u === 'mm') { wIn /= 25.4; hIn /= 25.4; }

        // Pixel dimensions for SVG sizing (multiplier)
        const widthPx = wIn * DPI;
        const heightPx = hIn * DPI;

        return { width: Math.round(widthPx), height: Math.round(heightPx), widthIn: wIn, heightIn: hIn };
    };

    const handleDownload = async (format: 'svg' | 'pdf') => {
        const canvas = (window as any).fabricCanvas;
        if (!canvas) { alert('Preview not ready yet'); return; }
        const { width, height, widthIn, heightIn } = getExportDimensions();

        setIsDownloading(true);
        try {
            const fontStyles = (() => {
                let s = '';
                try {
                    Array.from(document.styleSheets).forEach(sheet => {
                        try {
                            Array.from(sheet.cssRules).forEach(rule => {
                                if (rule instanceof CSSFontFaceRule) s += rule.cssText + '\n';
                            });
                        } catch (e) { }
                    });
                } catch (e) { }
                return s;
            })();

            if (format === 'svg') {
                const svg = canvas.toSVG({
                    suppressPreamble: false,
                    width: width,
                    height: height,
                    viewBox: { x: 0, y: 0, width: canvas.width, height: canvas.height }
                });

                // Embed fonts into SVG
                const finalSvg = svg.replace('</defs>', `<style type="text/css"><![CDATA[\n${fontStyles}]]></style></defs>`);

                const blob = new Blob([finalSvg], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `signage-${Math.round(design.width)}x${Math.round(design.height)}${design.unit}-${Date.now()}.svg`;
                document.body.appendChild(link); link.click();
                document.body.removeChild(link); URL.revokeObjectURL(url);
            } else {
                const { jsPDF } = await import('jspdf');
                const svg2pdfModule = await import('svg2pdf.js');

                const svg = canvas.toSVG({
                    suppressPreamble: false,
                    width: width,
                    height: height,
                    viewBox: { x: 0, y: 0, width: canvas.width, height: canvas.height }
                });

                // Embed fonts for PDF conversion too
                const styledSvg = svg.replace('</defs>', `<style type="text/css"><![CDATA[\n${fontStyles}]]></style></defs>`);

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = styledSvg;
                const svgElement = tempDiv.querySelector('svg');
                if (!svgElement) { alert('Failed to generate SVG for PDF'); return; }

                const pdf = new jsPDF({
                    orientation: widthIn > heightIn ? 'landscape' : 'portrait',
                    unit: 'in',
                    format: [heightIn, widthIn]
                });

                // --- FONT EMBEDDING FOR JSPDF ---
                const objects = canvas.getObjects();
                const usedFonts = new Set<string>();
                objects.forEach((obj: any) => {
                    if (obj.fontFamily) {
                        usedFonts.add(obj.fontFamily);
                        // Also check for bold/italic variants if font-utils supports them
                        if (obj.fontWeight === 'bold') usedFonts.add(`${obj.fontFamily}-Bold`);
                        if (obj.fontStyle === 'italic') usedFonts.add(`${obj.fontFamily}-Italic`);
                        if (obj.fontWeight === 'bold' && obj.fontStyle === 'italic') usedFonts.add(`${obj.fontFamily}-BoldItalic`);
                    }
                });

                for (const fontName of Array.from(usedFonts)) {
                    const base64 = await getFontBase64(fontName);
                    if (base64) {
                        const filename = `${fontName}.ttf`;

                        // Parse font name and style for jsPDF registration
                        let style = 'normal';
                        let family = fontName;
                        if (fontName.includes('-BoldItalic')) {
                            family = fontName.replace('-BoldItalic', '');
                            style = 'bolditalic';
                        } else if (fontName.includes('-Bold')) {
                            family = fontName.replace('-Bold', '');
                            style = 'bold';
                        } else if (fontName.includes('-Italic')) {
                            family = fontName.replace('-Italic', '');
                            style = 'italic';
                        }

                        // Use a safe ID for the virtual file system
                        const vfsId = fontName.replace(/\s+/g, '_') + '.ttf';

                        pdf.addFileToVFS(vfsId, base64);
                        pdf.addFont(vfsId, family, style);
                        console.log(`Successfully embedded font: ${family} (${style})`);
                    }
                }
                // --------------------------------

                await svg2pdfModule.svg2pdf(svgElement, pdf, { x: 0, y: 0, width: widthIn, height: heightIn });
                pdf.save(`signage-${Math.round(design.width)}x${Math.round(design.height)}${design.unit}-${Date.now()}.pdf`);
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to generate file');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleWhatsApp = () => {
        const message = encodeURIComponent(`Hi! Check out my signage design: ${window.location.href}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const handleCheckout = async () => {
        if (!contactDetails.name || !contactDetails.email || !contactDetails.mobile || !contactDetails.shippingAddress) {
            alert('Please fill in all details');
            return;
        }
        if (paymentScheme === 'part' && advanceAmount < Math.ceil(price * 0.25)) {
            alert(`Minimum advance is ₹${Math.ceil(price * 0.25)}`);
            return;
        }
        setIsProcessing(true);
        try {
            const canvas = (window as any).fabricCanvas;
            const { width, height } = getExportDimensions();

            let approvalProof: string | undefined;

            if (canvas) {
                const { jsPDF } = await import('jspdf');
                const svg2pdfModule = await import('svg2pdf.js');

                const fontStyles = (() => {
                    let s = '';
                    try {
                        Array.from(document.styleSheets).forEach(sheet => {
                            try {
                                Array.from(sheet.cssRules).forEach(rule => {
                                    if (rule instanceof CSSFontFaceRule) s += rule.cssText + '\n';
                                });
                            } catch (e) { }
                        });
                    } catch (e) { }
                    return s;
                })();

                const svg = canvas.toSVG({
                    suppressPreamble: false,
                    width: width,
                    height: height,
                    viewBox: { x: 0, y: 0, width: canvas.width, height: canvas.height }
                });

                const styledSvg = svg.replace('</defs>', `<style type="text/css"><![CDATA[\n${fontStyles}]]></style></defs>`);
                approvalProof = styledSvg;
            }

            const res = await createOrder(data, design, material, { deliveryType, includeInstallation, referralCode: codeValidated ? referralCode : undefined, contactDetails, paymentScheme, advanceAmount: paymentScheme === 'part' ? advanceAmount : undefined, approvalProof });
            if (!res.success) { alert('Order failed: ' + res.error); setIsProcessing(false); return; }
            const payRes = await initiatePhonePePayment(res.orderId!, res.payableAmount || price, contactDetails.mobile);
            if (payRes.success && payRes.url) window.location.href = payRes.url;
            else { alert('Payment failed: ' + payRes.error); setIsProcessing(false); }
        } catch (err) { console.error(err); alert('Unexpected error'); setIsProcessing(false); }
    };

    const handleUpdateMaster = async () => {
        const mode = searchParams.get('mode');
        const pin = searchParams.get('pin');
        if (mode !== 'admin' || pin !== '1234') return;
        if (!design.templateId) {
            alert('No template selected to update');
            return;
        }

        const canvas = (window as any).fabricCanvas;
        if (!canvas) {
            alert('Canvas not initialized');
            return;
        }

        setIsSaving(true);
        try {
            // 1. Generate Thumbnail (Hide safety guides temporarily)
            const guides = canvas.getObjects().filter((o: any) => o.name === 'safetyGuide' || o.name === 'safety_bleed_rect' || (o.name && o.name.includes('safety')));
            const originalVisibilities = guides.map((o: any) => o.visible);
            guides.forEach((o: any) => o.visible = false);

            const thumbnailDataUrl = canvas.toDataURL({
                format: 'png',
                quality: 0.7,
                multiplier: 0.2 // Small size for gallery thumbnail
            });

            // Restore visibility
            guides.forEach((o: any, i: number) => o.visible = originalVisibilities[i]);

            const thumbRes = await uploadThumbnail(thumbnailDataUrl, design.templateId);

            // 2. Save Config
            const fabricConfig = canvas.toJSON([
                'name', 'id', 'isBackground',
                'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation',
                'selectable', 'evented', 'editable',
                'hasControls', 'hoverCursor', 'moveCursor'
            ]);
            const res = await updateTemplateConfig(
                design.templateId,
                fabricConfig,
                pin,
                thumbRes.success ? thumbRes.url : undefined, // NEW: Updated Thumbnail URL
                { width: design.width, height: design.height, unit: design.unit }
            );

            if (res.success) {
                // Clear local storage drafts so that refresh loads from DB
                localStorage.removeItem('signage_canvas_json');
                localStorage.removeItem('design_draft_pending');
                alert('Master Template & Thumbnail Updated Successfully!');
            } else {
                alert('Failed to update: ' + res.error);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while saving.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(e => console.error(e));
        else document.exitFullscreen();
    };

    if (isMobile) {
        return (
            <div className="min-h-[100dvh] bg-gray-50 font-sans flex flex-col overflow-hidden">
                <header className={`shrink-0 bg-white px-4 py-2 flex items-center justify-between shadow-sm z-30 transition-all ${isLandscape ? 'h-0 overflow-hidden py-0 opacity-0' : 'h-auto'}`}>
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-6 h-6" /></button>
                    <div className="flex-1 text-center px-4"><h1 className="font-bold text-gray-900 leading-tight">Design signage</h1></div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><Undo2 className="w-5 h-5" /></button>
                            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><Redo2 className="w-5 h-5" /></button>
                        </div>
                    </div>
                </header>

                <div className={`shrink-0 bg-white px-4 transition-all duration-300 z-20 shadow-sm border-b border-gray-100 ${isLandscape && mobileTab === 'design' ? 'h-0 overflow-hidden py-0 border-0 opacity-0' : 'pb-3'}`}>
                    <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar gap-1">
                        {['templates', 'design', 'material', 'order']
                            .filter(tab => !isFixedProduct || tab !== 'material')
                            .map((tab) => (
                                <button key={tab} onClick={() => setMobileTab(tab as any)} className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all capitalize ${mobileTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                                    {tab}
                                </button>
                            ))}
                    </div>
                </div>

                <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                    {mobileTab === 'templates' && (
                        <div className="w-full h-full pb-24 bg-white px-4 py-4 overflow-y-auto">
                            <div className="max-w-md mx-auto space-y-4">
                                <TemplateSelector selectedTemplateId={design.templateId} onSelect={handleTemplateSelect} />
                                <button onClick={() => setMobileTab('design')} className="w-full bg-[#7D2AE8] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">Continue <ArrowRight size={16} /></button>
                            </div>
                        </div>
                    )}
                    {mobileTab === 'design' && (
                        <div className="flex-1 min-h-0 bg-[#E5E7EB] flex flex-col relative overflow-hidden">
                            <div className="flex-1 min-h-0 w-full flex flex-col p-2">
                                <PreviewSection uploadedDesign={uploadedDesign} data={data} design={design} material={material} isLandscape={isLandscape} compact={true} onDesignChange={setDesign} onAddText={registerAddText} onAddIcon={registerAddIcon} onAddShape={registerAddShape} onAddImage={registerAddImage} initialJSON={initialDesignJSON} />
                            </div>
                        </div>
                    )}
                    {mobileTab === 'material' && (
                        <div className="w-full h-full pb-24 bg-white px-4 py-4 overflow-y-auto">
                            <div className="max-w-md mx-auto space-y-4">
                                <MaterialSelector selectedMaterial={material} onSelect={setMaterial} dimensions={{ width: design.width, height: design.height, unit: design.unit }} />
                                <button onClick={() => setMobileTab('order')} className="w-full bg-[#7D2AE8] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">Continue <ArrowRight size={16} /></button>
                            </div>
                        </div>
                    )}
                    {mobileTab === 'order' && (
                        <div className="w-full h-full pb-32 bg-white px-4 py-4 overflow-y-auto custom-scrollbar">
                            <div className="max-w-md mx-auto space-y-6">
                                {/* Delivery Options */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-900 block">Delivery Speed</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button onClick={() => setDeliveryType('standard')} className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${deliveryType === 'standard' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <Truck className={`w-5 h-5 ${deliveryType === 'standard' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                <div>
                                                    <p className="font-bold text-sm">Standard Delivery</p>
                                                    <p className="text-[10px] text-gray-500">Arrives in 3-5 days</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase">Free</span>
                                        </button>
                                        <button onClick={() => setDeliveryType('fast')} className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${deliveryType === 'fast' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <Truck className={`w-5 h-5 ${deliveryType === 'fast' ? 'text-indigo-600' : 'text-gray-400'}`} />
                                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">Next Day Delivery</p>
                                                    <p className="text-[10px] text-indigo-500 font-medium">Fastest shipping</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-indigo-600 uppercase">+₹{FAST_DELIVERY_COST}</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Professional Installation */}
                                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-100 flex justify-between items-center transition-all has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50">
                                    <div className="flex items-center gap-3">
                                        <Wrench className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Professional Installation</p>
                                            <p className="text-[10px] text-gray-500">+₹{INSTALLATION_COST}</p>
                                        </div>
                                    </div>
                                    <input type="checkbox" checked={includeInstallation} onChange={e => setIncludeInstallation(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
                                </div>

                                {/* Contact Details */}
                                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-1">Contact & Shipping</h3>
                                    <input type="text" placeholder="Full Name" value={contactDetails.name} onChange={e => setContactDetails({ ...contactDetails, name: e.target.value })} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                    <input type="email" placeholder="Email Address" value={contactDetails.email} onChange={e => setContactDetails({ ...contactDetails, email: e.target.value })} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                    <input
                                        type="tel"
                                        placeholder="Mobile Number"
                                        value={contactDetails.mobile}
                                        onChange={e => {
                                            let val = e.target.value;
                                            if (contactDetails.mobile.startsWith('+91 ') && !val.startsWith('+91 ')) {
                                                val = '';
                                            }
                                            const digits = val.replace(/\D/g, '').replace(/^91/, '');
                                            const truncated = digits.slice(0, 10);
                                            let formatted = '';
                                            if (truncated.length > 0) {
                                                formatted = '+91 ';
                                                if (truncated.length > 5) {
                                                    formatted += truncated.slice(0, 5) + ' ' + truncated.slice(5);
                                                } else {
                                                    formatted += truncated;
                                                }
                                            }
                                            setContactDetails({ ...contactDetails, mobile: formatted });
                                        }}
                                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                    <textarea placeholder="Complete Shipping Address" value={contactDetails.shippingAddress} onChange={e => setContactDetails({ ...contactDetails, shippingAddress: e.target.value })} className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all h-20 resize-none" />
                                </div>

                                {/* Payment Scheme */}
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-900 block">Payment Scheme</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setPaymentScheme('part')} className={`p-3 rounded-xl border-2 text-left transition-all ${paymentScheme === 'part' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                                            <p className="font-bold text-gray-900 text-xs">Part Pay</p>
                                            <p className="text-[9px] text-gray-500">25% Advance</p>
                                        </button>
                                        <button onClick={() => setPaymentScheme('full')} className={`p-3 rounded-xl border-2 text-left transition-all ${paymentScheme === 'full' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}>
                                            <p className="font-bold text-gray-900 text-xs">Full Pay</p>
                                            <p className="text-[9px] text-gray-500">100% Upfront</p>
                                        </button>
                                    </div>

                                    {paymentScheme === 'part' && (
                                        <div className="mt-3 p-4 bg-indigo-50 border border-indigo-100 rounded-xl animate-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest">Advance Amount</label>
                                                <span className="text-[10px] text-indigo-600 font-bold text-right">MIN: ₹{Math.ceil(price * 0.25)}</span>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900 font-bold">₹</span>
                                                <input
                                                    type="number"
                                                    value={advanceAmount}
                                                    onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                                                    onBlur={(e) => {
                                                        const min = Math.ceil(price * 0.25);
                                                        if (parseFloat(e.target.value) < min) setAdvanceAmount(min);
                                                    }}
                                                    className="w-full bg-white border border-indigo-200 rounded-lg py-2.5 pl-7 pr-3 text-gray-900 font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Summary & Actions */}
                                <div className="p-4 bg-slate-900 rounded-2xl shadow-xl space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Payable</p>
                                            <p className="text-2xl font-black text-white">₹{paymentScheme === 'part' ? advanceAmount : price}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Price</p>
                                            <p className="text-sm font-bold text-slate-300">₹{price}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isProcessing}
                                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <>Pay &amp; Place Order <ArrowRight className="w-5 h-5" /></>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {mobileTab === 'design' && (
                    <div className="shrink-0 bg-white border-t px-6 py-2 flex justify-between items-center z-50">
                        <button onClick={() => addTextFn?.('heading')} className="flex flex-col items-center gap-1 text-gray-500"><Type size={20} /><span className="text-[10px]">Text</span></button>
                        <button onClick={() => document.getElementById('mobile-upload')?.click()} className="flex flex-col items-center gap-1 text-gray-500"><ImageIcon size={20} /><span className="text-[10px]">Image</span></button>
                        <input id="mobile-upload" type="file" className="hidden" onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const url = URL.createObjectURL(file);
                                addImageFn?.(url);
                            }
                        }} />
                        <button onClick={() => setActivePicker(activePicker === 'shapes' ? null : 'shapes')} className={`flex flex-col items-center gap-1 ${activePicker === 'shapes' ? 'text-purple-600' : 'text-gray-500'}`}><Square size={20} /><span className="text-[10px]">Shapes</span></button>
                        {activePicker === 'shapes' && (
                            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white p-3 rounded-2xl shadow-2xl border flex gap-4">
                                {MOBILE_SHAPES.map(s => <button key={s.id} onClick={() => { addShapeFn?.(s.id as any); setActivePicker(null); }}><s.icon size={24} /></button>)}
                            </div>
                        )}
                        <button
                            onClick={() => setMobileTab(isFixedProduct ? 'order' : 'material')}
                            className="bg-[#7D2AE8] text-white px-4 py-2 rounded-lg font-bold text-xs"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">
            <div className="h-12 bg-white border-b grid grid-cols-[1fr_auto_1fr] items-center px-6 shrink-0 z-20">
                <div className="flex items-center">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="text-[#6366f1] w-6 h-6 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                <path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.2-6.2-4.5-6.2 4.5 2.3-7.2-6.1-4.5h7.6z" />
                            </svg>
                        </div>
                        <span className="font-black text-gray-900 text-lg tracking-tight">SignagePro</span>
                    </Link>
                </div>

                <div className="flex justify-center min-w-[400px]">
                    <div id="toolbar-header-target" className="w-full flex justify-center h-12 relative pointer-events-auto" />
                </div>

                <div className="flex items-center justify-end gap-4">
                    {searchParams.get('mode') === 'admin' && (
                        <Button
                            onClick={handleUpdateMaster}
                            disabled={isSaving}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-1.5 h-auto text-xs uppercase tracking-wider rounded-lg flex items-center gap-2 shadow-lg shadow-red-500/20"
                        >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
                            Update Master
                        </Button>
                    )}

                    <ShareMenu onDownload={handleDownload} onWhatsApp={handleWhatsApp} isDownloading={isDownloading} />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="shrink-0 h-full relative z-10">
                    <EditorSidebar
                        selectedTemplateId={design.templateId}
                        onSelectTemplate={handleTemplateSelect}
                        onAddText={(type) => addTextFn?.(type)}
                        onAddIcon={(iconName) => addIconFn?.(iconName)}
                        onAddShape={(shape) => addShapeFn?.(shape)}
                        onAddImage={(url) => addImageFn?.(url)}
                        templates={templates}
                        aspectRatio={design.width / design.height}
                        currentProductId={productId || undefined}
                    />
                </div>

                <div className="flex-1 bg-gray-200/50 relative overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                        <PreviewSection uploadedDesign={uploadedDesign} data={data} design={design} onDesignChange={setDesign} material={material} onAddText={registerAddText} onAddIcon={registerAddIcon} onAddShape={registerAddShape} onAddImage={registerAddImage} initialJSON={initialDesignJSON} />
                    </div>
                </div>

                <div className="w-[340px] bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shrink-0 z-10 flex flex-col custom-scrollbar">
                    <div className="p-0 flex-1">
                        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                            <h3 className="font-bold text-white">Configuration</h3>
                            <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">Need Help?</button>
                        </div>

                        <div className="p-6 space-y-8">
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
                                    <div className="grid grid-cols-2 p-1 bg-slate-900/50 rounded-xl border border-slate-700">
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
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${deliveryType === 'standard' ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}
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
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${deliveryType === 'fast' ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}
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

                            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-white">Professional Installation</p>
                                    <p className="text-xs text-gray-400">+₹{INSTALLATION_COST}</p>
                                </div>
                                <input type="checkbox" checked={includeInstallation} onChange={e => setIncludeInstallation(e.target.checked)} className="w-5 h-5 accent-indigo-500" />
                            </div>

                            <div className="pt-6 border-t border-slate-800">
                                <label className="text-sm font-bold text-white mb-3 block">Payment Scheme</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setPaymentScheme('part')} className={`p-3 rounded-xl border-2 text-left transition-all ${paymentScheme === 'part' ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                                        <p className="font-bold text-white text-xs">Part Pay</p>
                                        <p className="text-[9px] text-gray-400">25% Advance</p>
                                    </button>
                                    <button onClick={() => setPaymentScheme('full')} className={`p-3 rounded-xl border-2 text-left transition-all ${paymentScheme === 'full' ? 'border-indigo-500 bg-indigo-900/30' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}>
                                        <p className="font-bold text-white text-xs">Full Pay</p>
                                        <p className="text-[9px] text-gray-400">100% Upfront</p>
                                    </button>
                                </div>

                                {paymentScheme === 'part' && (
                                    <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl animate-in slide-in-from-top-2">
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
                        <div className="flex justify-between items-end">
                            <span className="text-white font-bold text-lg">Total</span>
                            <span className="text-2xl font-black text-indigo-400">₹{price}</span>
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
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                        >
                            Proceed to Review <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <ReviewApproval
                data={data}
                design={design}
                material={material}
                isOpen={showReviewModal}
                canvasJSON={reviewCanvasJSON}
                onClose={() => setShowReviewModal(false)}
                onApprove={() => {
                    setShowReviewModal(false);
                    setShowCheckoutModal(true);
                }}
            />

            <CheckoutDetailsModal
                isOpen={showCheckoutModal}
                onClose={() => setShowCheckoutModal(false)}
                contactDetails={contactDetails}
                onUpdateDetails={setContactDetails}
                onComplete={async () => {
                    setShowCheckoutModal(false);
                    await handleCheckout();
                }}
                isProcessing={isProcessing}
                designConfig={design}
                signageData={data}
            />
            <WhatsAppButton variant="floating" message="Hi! I need help with my signage design." />
        </div>
    );
}
