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
import { ArrowRight, Truck, Wrench, ChevronLeft, Undo2, Redo2, Type, Image as ImageIcon, Square, QrCode, X, Loader2, Check, Maximize, Minimize, Phone, Mail, MapPin, Globe, Star, Heart, Clock, Calendar, User, Building, Palette, Grid3X3, Download, Plus, Circle, Triangle, Minus, Sparkles } from 'lucide-react';
import { PreviewSection } from '@/components/PreviewSection';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PRODUCTS } from '@/lib/products';
import { useAuth } from '@/components/AuthProvider';
import { CheckoutDetailsModal } from '@/components/CheckoutDetailsModal';
import { DesignHeader } from './components/DesignHeader';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { MobileDesignFooter } from './components/MobileDesignFooter';
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
    const [isMounted, setIsMounted] = useState(false);

    // Safety check to prevent resets to 24x16 if URL suggests otherwise
    const isInitializedRef = useRef(false);
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
    const [initialDesignJSON, setInitialDesignJSON] = useState<any>(null);
    const [reviewCanvasJSON, setReviewCanvasJSON] = useState<any>(null);
    const [selectedObject, setSelectedObject] = useState<any>(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

    const [isMobile, setIsMobile] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
    const onHistoryActionRef = useRef<((action: 'undo' | 'redo') => void) | null>(null);

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
    const [addShapeSVGFn, setAddShapeSVGFn] = useState<((url: string) => void) | null>(null);
    const registerAddShapeSVG = useCallback((fn: any) => setAddShapeSVGFn(() => fn), []);
    const registerAddImage = useCallback((fn: any) => setAddImageFn(() => fn), []);

    const handleUndo = () => onHistoryActionRef.current?.('undo');
    const handleRedo = () => onHistoryActionRef.current?.('redo');

    useEffect(() => {
        setIsMounted(true);
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

    // Fix for background leakage in mobile landscape
    useEffect(() => {
        if (isMobile) {
            const originalBackground = document.body.style.background;
            const originalMinHeight = document.body.style.minHeight;

            // Set body background to a solid neutral color
            document.body.style.background = '#f9fafb';
            document.body.style.minHeight = '100dvh';

            return () => {
                document.body.style.background = originalBackground;
                document.body.style.minHeight = originalMinHeight;
            };
        }
    }, [isMobile]);

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

        // Apply template's saved dimensions if URL doesn't specify custom size
        const hasUrlDimensions = !!searchParams.get('width');
        if (!skipResize && !hasUrlDimensions && template?.dimensions) {
            setDesign(prev => ({
                ...prev,
                templateId: id,
                width: template.dimensions.width,
                height: template.dimensions.height,
                unit: template.dimensions.unit || prev.unit
            }));
        } else {
            setDesign(prev => ({ ...prev, templateId: id }));
        }

        if (isMobile) setMobileTab('design');
    }, [templates, isMobile, setDesign, setMobileTab, searchParams]);

    useEffect(() => {
        if (user) {
            setContactDetails(prev => ({
                ...prev,
                name: prev.name || user.user_metadata?.full_name || '',
                email: prev.email || user.email || '',
            }));
        }
    }, [user]);

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

        if (width && height && !isInitializedRef.current) {
            setDesign(prev => ({
                ...prev,
                width: Number(width),
                height: Number(height),
                unit: (unit as any) || prev.unit
            }));
            isInitializedRef.current = true;
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
            const canvasWidth = canvas.width || 1800;
            const canvasHeight = canvas.height || 900;

            const res = await updateTemplateConfig(
                design.templateId,
                fabricConfig,
                pin,
                thumbRes.success ? thumbRes.url : undefined,
                // CRITICAL: Pass actual canvas pixels to normalization to detect ratio correctly
                { width: canvasWidth, height: canvasHeight, unit: 'px' }
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

    if (!isMounted) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

    if (isMobile) {
        return (
            <div className="fixed inset-0 bg-gray-50 font-sans flex flex-col overflow-hidden z-[40]">
                <header className={`shrink-0 bg-white px-4 flex items-center justify-between shadow-sm z-30 transition-all ${isLandscape ? 'py-1' : 'py-2'}`}>
                    <div className="flex items-center gap-1 overflow-hidden flex-1">
                        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full dark:text-gray-900 shrink-0">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <Link href="/" className="flex items-center gap-1.5 overflow-hidden active:opacity-70 transition-opacity">
                            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
                            <span className="font-black text-gray-900 leading-tight truncate text-lg tracking-tight" style={{ fontFamily: '"Playfair Display", serif' }}>
                                SignagePro
                            </span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 px-2 border-l border-gray-100 ml-2">
                        <button
                            onClick={handleUndo}
                            disabled={!historyState.canUndo}
                            className={`p-2 rounded-full transition-all ${historyState.canUndo ? 'text-gray-900 hover:bg-gray-100' : 'text-gray-200 cursor-not-allowed'}`}
                        >
                            <Undo2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={!historyState.canRedo}
                            className={`p-2 rounded-full transition-all ${historyState.canRedo ? 'text-gray-900 hover:bg-gray-100' : 'text-gray-200 cursor-not-allowed'}`}
                        >
                            <Redo2 className="w-5 h-5" />
                        </button>
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
                                <PreviewSection
                                    uploadedDesign={uploadedDesign}
                                    data={data}
                                    design={design}
                                    material={material}
                                    isLandscape={isLandscape}
                                    compact={true}
                                    onDesignChange={setDesign}
                                    onAddText={registerAddText}
                                    onAddIcon={registerAddIcon}
                                    onAddShape={registerAddShape}
                                    onAddImage={registerAddImage}
                                    onHistoryStateChange={setHistoryState}
                                    onHistoryAction={(fn) => onHistoryActionRef.current = fn}
                                    initialJSON={initialDesignJSON}
                                />
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

                <MobileDesignFooter
                    mobileTab={mobileTab}
                    setMobileTab={setMobileTab}
                    activePicker={activePicker}
                    setActivePicker={setActivePicker}
                    addTextFn={addTextFn}
                    addImageFn={addImageFn}
                    addShapeFn={addShapeFn}
                    isFixedProduct={isFixedProduct}
                    MOBILE_SHAPES={MOBILE_SHAPES}
                />
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">
            <DesignHeader
                handleUpdateMaster={handleUpdateMaster}
                isSaving={isSaving}
                handleDownload={handleDownload}
                handleWhatsApp={handleWhatsApp}
                isDownloading={isDownloading}
                isAdmin={searchParams.get('mode') === 'admin'}
            />

            <div className="flex-1 flex overflow-hidden">
                <div className="shrink-0 h-full relative z-10">
                    <EditorSidebar
                        selectedTemplateId={design.templateId}
                        onSelectTemplate={handleTemplateSelect}
                        onAddText={(type) => addTextFn?.(type)}
                        onAddIcon={(iconName) => addIconFn?.(iconName)}
                        onAddShape={(shape) => addShapeFn?.(shape)}
                        onAddShapeSVG={(url) => addShapeSVGFn?.(url)}
                        onAddImage={(url) => addImageFn?.(url)}
                        templates={templates}
                        aspectRatio={design.width / design.height}
                        currentProductId={productId || undefined}
                        isAdmin={searchParams.get('mode') === 'admin'}
                    />
                </div>

                <div className="flex-1 bg-gray-200/50 relative overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                        <PreviewSection
                            uploadedDesign={uploadedDesign}
                            data={data}
                            design={design}
                            onDesignChange={setDesign}
                            material={material}
                            onAddText={registerAddText}
                            onAddIcon={registerAddIcon}
                            onAddShape={registerAddShape}
                            onAddShapeSVG={registerAddShapeSVG}
                            onAddImage={registerAddImage}
                            onHistoryStateChange={setHistoryState}
                            onHistoryAction={(fn) => onHistoryActionRef.current = fn}
                            initialJSON={initialDesignJSON}
                            onObjectSelected={setSelectedObject}
                        />
                    </div>
                </div>

                <ConfigurationPanel
                    design={design}
                    setDesign={setDesign}
                    material={material}
                    setMaterial={setMaterial}
                    deliveryType={deliveryType}
                    setDeliveryType={setDeliveryType}
                    includeInstallation={includeInstallation}
                    setIncludeInstallation={setIncludeInstallation}
                    paymentScheme={paymentScheme}
                    setPaymentScheme={setPaymentScheme}
                    advanceAmount={advanceAmount}
                    setAdvanceAmount={setAdvanceAmount}
                    price={price}
                    isProcessing={isProcessing}
                    isFixedProduct={isFixedProduct}
                    handleDownload={handleDownload}
                    setShowReviewModal={setShowReviewModal}
                    setReviewCanvasJSON={setReviewCanvasJSON}
                    FAST_DELIVERY_COST={FAST_DELIVERY_COST}
                    INSTALLATION_COST={INSTALLATION_COST}
                    selectedObject={selectedObject}
                />
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
        </div >
    );
}
