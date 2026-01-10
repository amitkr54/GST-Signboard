'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TEMPLATE_DEFAULTS } from '@/lib/templates';
import { MaterialSelector } from '@/components/MaterialSelector';
import { EditorSidebar } from '@/components/EditorSidebar';
import { Button } from '@/components/ui/Button';
import { TemplateSelector } from '@/components/TemplateSelector';
import { DesignUpload } from '@/components/DesignUpload';
import { ReviewApproval } from '@/components/ReviewApproval';
import { SignageData, DesignConfig, DEFAULT_DESIGN, TemplateId } from '@/lib/types';
import { calculatePrice, MaterialId } from '@/lib/utils';
import { createOrder, processPayment, trackReferral, initiatePhonePePayment, syncDesign, generateQRCode } from '@/app/actions';
import { ArrowRight, Truck, Wrench, ChevronLeft, Undo2, Redo2, Type, Image as ImageIcon, Square, QrCode, X, Loader2, Check, Maximize, Minimize, Phone, Mail, MapPin, Globe, Star, Heart, Clock, Calendar, User, Building, Palette, Grid3X3, Download } from 'lucide-react';
import { PreviewSection } from '@/components/PreviewSection';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { Circle, Triangle, Minus } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

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
            <DesignContent />
        </Suspense>
    );
}

function DesignContent() {
    const [data, setData] = useState<SignageData>({
        companyName: '',
        address: '',
    });
    const [design, setDesign] = useState<DesignConfig>(DEFAULT_DESIGN);
    const [material, setMaterial] = useState<MaterialId>('flex');
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadedDesign, setUploadedDesign] = useState<string | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [canvasSnapshot, setCanvasSnapshot] = useState<string | undefined>(undefined);

    // Referral State
    const [referralCode, setReferralCode] = useState('');
    const [isValidatingCode, setIsValidatingCode] = useState(false);
    const [codeValidated, setCodeValidated] = useState(false);

    // Delivery & Installation State
    const [deliveryType, setDeliveryType] = useState<'standard' | 'fast'>('standard');
    const [includeInstallation, setIncludeInstallation] = useState(false);

    // Checkout Contact Details
    const [contactDetails, setContactDetails] = useState({
        name: '',
        email: '',
        mobile: '',
        shippingAddress: ''
    });

    // Payment Scheme State
    const [paymentScheme, setPaymentScheme] = useState<'full' | 'part'>('full');
    const [advanceAmount, setAdvanceAmount] = useState<number>(0);

    // Sidebar add functions (will be set by FabricPreview)
    const [addTextFn, setAddTextFn] = useState<((type: 'heading' | 'subheading' | 'body') => void) | null>(null);
    const [addIconFn, setAddIconFn] = useState<((iconName: string) => void) | null>(null);
    const [addShapeFn, setAddShapeFn] = useState<((type: 'rect' | 'circle' | 'line' | 'triangle') => void) | null>(null);
    const [addImageFn, setAddImageFn] = useState<((imageUrl: string) => void) | null>(null);
    const [mobileTab, setMobileTab] = useState<'templates' | 'design' | 'material' | 'order'>('templates');
    const [activePicker, setActivePicker] = useState<'shapes' | 'icons' | 'background' | null>(null);
    const [showQRInput, setShowQRInput] = useState(false);
    const [qrText, setQrText] = useState('');
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

    // Responsive State
    const [isMobile, setIsMobile] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    // Stabilized registration callbacks to prevent infinite loops
    const registerAddText = useCallback((fn: any) => setAddTextFn(() => fn), []);
    const registerAddIcon = useCallback((fn: any) => setAddIconFn(() => fn), []);
    const registerAddShape = useCallback((fn: any) => setAddShapeFn(() => fn), []);
    const registerAddImage = useCallback((fn: any) => setAddImageFn(() => fn), []);

    // 1. Initial Load from URL or localStorage
    useEffect(() => {
        const savedDesign = localStorage.getItem('signage_draft_design');
        const savedData = localStorage.getItem('signage_draft_data');

        // Check for URL params first (New Project Flow)
        const widthParam = searchParams.get('width');
        const heightParam = searchParams.get('height');
        const unitParam = searchParams.get('unit');

        if (widthParam && heightParam && unitParam) {
            setDesign(prev => ({
                ...prev,
                width: parseFloat(widthParam),
                height: parseFloat(heightParam),
                unit: unitParam as 'in' | 'cm' | 'mm' | 'px'
            }));
            // Also clear old local storage if starting fresh to avoid conflicts
            localStorage.removeItem('signage_canvas_json');
        } else if (savedDesign) {
            // Restore from local storage only if no URL params
            try {
                setDesign(JSON.parse(savedDesign));
            } catch (e) {
                console.error('Failed to parse saved design', e);
            }
        }

        if (savedData) {
            try {
                setData(JSON.parse(savedData));
            } catch (e) {
                console.error('Failed to parse saved data', e);
            }
        }
    }, [searchParams]);

    // 2. Auto-save to localStorage (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsSaving(true);
            localStorage.setItem('signage_draft_design', JSON.stringify(design));
            localStorage.setItem('signage_draft_data', JSON.stringify(data));

            // If user exists, sync to Supabase
            if (user) {
                syncDesign(user.id, data, design).catch(err => {
                    console.error('Failed to sync to Supabase', err);
                });
            }

            setTimeout(() => setIsSaving(false), 800);
        }, 2000); // 2 second debounce

        return () => clearTimeout(timer);
    }, [design, data, user]);

    // Handle Fullscreen Toggle
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = async () => {
            const isFS = !!document.fullscreenElement;
            setIsFullscreen(isFS);

            if (isFS && isMobile && screen.orientation?.lock) {
                try {
                    // @ts-expect-error - orientation.lock is not standard in all types
                    await screen.orientation.lock('landscape');
                } catch (err) {
                    console.error('Orientation lock failed:', err);
                }
            } else if (!isFS && screen.orientation?.unlock) {
                // @ts-expect-error - orientation.unlock is not standard in all types
                screen.orientation.unlock();
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [isMobile]);

    // Handle Resize for Responsive Layout
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

    // Track referral code from URL or manual entry
    useEffect(() => {
        const refCode = searchParams.get('ref');
        if (refCode) {
            setReferralCode(refCode);
            validateReferralCode(refCode);
            // Store in cookie for 30 days
            document.cookie = `ref_code=${refCode}; max-age=${30 * 24 * 60 * 60}; path=/`;
        } else {
            // Check cookie
            const cookies = document.cookie.split('; ');
            const refCookie = cookies.find(c => c.startsWith('ref_code='));
            if (refCookie) {
                const code = refCookie.split('=')[1];
                setReferralCode(code);
                validateReferralCode(code);
            }
        }
    }, [searchParams]);

    const validateReferralCode = async (code: string) => {
        if (!code) {
            setCodeValidated(false);
            return;
        }

        setIsValidatingCode(true);
        const { getReferrerByCode } = await import('@/app/actions');
        const result = await getReferrerByCode(code);
        setCodeValidated(result.success && result.referrer !== null);
        setIsValidatingCode(false);
    };

    const handleTemplateSelect = (id: TemplateId) => {
        setDesign(prev => ({ ...prev, templateId: id }));

        // Automatically switch to design tab on mobile
        if (isMobile) {
            setMobileTab('design');
        }

        const defaults = TEMPLATE_DEFAULTS[id] || {
            companyName: '',
            address: '',
            additionalText: []
        };

        setData(prev => {
            // Check if current company name is a "default" name from any template or empty
            const currentName = prev.companyName;

            // Collect all possible default names to check against
            const defaultNames = [
                ...Object.values(TEMPLATE_DEFAULTS).map(d => d.companyName),
                'ABC Company Name', // legacy or SVG hardcoded default
                'YOUR BRAND',       // recently removed global default
                ''
            ];

            const isDefaultName = !currentName || defaultNames.includes(currentName);

            if (isDefaultName) {
                return {
                    ...prev,
                    companyName: defaults.companyName || '',
                    address: defaults.address || '',
                    additionalText: defaults.additionalText || []
                };
            }
            return prev;
        });
    };

    // Check for template query param
    useEffect(() => {
        const templateId = searchParams.get('template');
        if (templateId) {
            // @ts-expect-error - templateId is dynamic based on query param
            setDesign(prev => ({ ...prev, templateId: templateId }));

            // If on mobile, switch to design tab
            if (isMobile) {
                setMobileTab('design');
            }
        }
    }, [searchParams, isMobile]);

    const handleQRGenerate = async () => {
        if (!qrText.trim()) return;
        setIsGeneratingQR(true);
        try {
            const result = await generateQRCode(qrText);
            if (result.success && result.dataUrl) {
                addImageFn?.(result.dataUrl);
                setShowQRInput(false);
                setQrText('');
            } else {
                alert('Failed to generate QR Code');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingQR(false);
        }
    };

    const handleLogoUpload = (file: File, tempUrl: string) => {
        setData(prev => ({ ...prev, logoUrl: tempUrl }));
    };

    const handleDesignUpload = (file: File, previewUrl: string) => {
        setUploadedDesign(previewUrl);
    };

    // Pricing Constants
    const REFERRAL_DISCOUNT = 150;
    const FAST_DELIVERY_COST = 200;
    const INSTALLATION_COST = 500;

    const basePrice = calculatePrice(material);
    const discount = (codeValidated && referralCode) ? REFERRAL_DISCOUNT : 0;
    const deliveryCost = deliveryType === 'fast' ? FAST_DELIVERY_COST : 0;
    const installationCost = includeInstallation ? INSTALLATION_COST : 0;
    const price = basePrice - discount + deliveryCost + installationCost;

    // Update advance amount when price changes
    useEffect(() => {
        if (paymentScheme === 'part') {
            setAdvanceAmount(Math.ceil(price * 0.25));
        }
    }, [price, paymentScheme]);

    const handleDownload = async (format: 'svg' | 'pdf') => {
        // @ts-expect-error - fabricCanvas is globally attached to window
        const canvas = window.fabricCanvas;
        if (!canvas) {
            alert('Preview not ready yet');
            return;
        }

        if (format === 'svg') {
            const svg = canvas.toSVG({
                suppressPreamble: false,
                width: 1800,
                height: 1200,
                viewBox: { x: 0, y: 0, width: 1800, height: 1200 }
            });
            const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `signage-${Date.now()}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            try {
                const { jsPDF } = await import('jspdf');
                const svg2pdfModule = await import('svg2pdf.js');

                const svg = canvas.toSVG({
                    suppressPreamble: false,
                    width: 1800,
                    height: 1200,
                    viewBox: { x: 0, y: 0, width: 1800, height: 1200 }
                });

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = svg;
                const svgElement = tempDiv.querySelector('svg');

                if (!svgElement) {
                    alert('Failed to generate SVG for PDF');
                    return;
                }

                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'in',
                    format: [12, 18]
                });

                await svg2pdfModule.svg2pdf(svgElement, pdf, {
                    x: 0, y: 0, width: 18, height: 12
                });

                pdf.save(`signage-${Date.now()}.pdf`);
            } catch (error) {
                console.error('PDF generation error:', error);
                alert('Failed to generate PDF. Please try again.');
            }
        }
    };

    const handleOpenReview = () => {
        const canvas = (window as any).fabricCanvas;
        if (canvas) {
            const json = JSON.stringify(canvas.toJSON(['name', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'selectable', 'evented', 'id', 'data']));
            console.log(`[DesignPage] Capturing canvas snapshot for review modal. Length: ${json.length}`);
            setCanvasSnapshot(json);
        } else {
            console.warn('[DesignPage] No fabricCanvas found on window to capture snapshot.');
        }
        setShowReviewModal(true);
    };

    const handleCheckout = async () => {
        // Validate Contact Details
        if (!contactDetails.name || !contactDetails.email || !contactDetails.mobile || !contactDetails.shippingAddress) {
            alert('Please fill in all shipping and contact details before placing the order.');
            return;
        }

        // Validate Advance Amount
        if (paymentScheme === 'part') {
            const minAdvance = Math.ceil(price * 0.25);
            if (advanceAmount < minAdvance) {
                alert(`Minimum advance payment is ₹${minAdvance} (25%)`);
                return;
            }
        }

        setIsProcessing(true);
        try {
            // 0. Capture Approval Proof (SVG)
            // @ts-expect-error - fabricCanvas is globally attached to window
            const canvas = window.fabricCanvas;
            let approvalProof = undefined;
            if (canvas) {
                approvalProof = canvas.toSVG({
                    suppressPreamble: false,
                    width: 1800,
                    height: 1200,
                    viewBox: { x: 0, y: 0, width: 1800, height: 1200 }
                });
            }

            // 1. Create Order
            const { success, orderId, error, payableAmount } = await createOrder(data, design, material, {
                deliveryType,
                includeInstallation,
                referralCode: codeValidated ? referralCode : undefined,
                contactDetails,
                paymentScheme,
                advanceAmount: paymentScheme === 'part' ? advanceAmount : undefined,
                approvalProof
            });

            if (!success || !orderId) {
                alert('Failed to create order: ' + error);
                setIsProcessing(false);
                return;
            }

            // 2. Initiate PhonePe Payment
            const paymentResult = await initiatePhonePePayment(orderId, payableAmount || price, contactDetails.mobile);

            if (paymentResult.success && paymentResult.url) {
                window.location.href = paymentResult.url;
            } else {
                alert('Payment initiation failed: ' + paymentResult.error);
                setIsProcessing(false);
            }
        } catch (err) {
            console.error(err);
            alert('An unexpected error occurred');
            setIsProcessing(false);
        }
    };

    // Mobile Layout
    if (isMobile) {
        return (
            <div className="min-h-[100dvh] bg-gray-50 font-sans flex flex-col overflow-hidden">
                {/* Mobile Header - Sticky Top */}
                <header className={`shrink-0 bg-white px-4 py-2 flex items-center justify-between shadow-sm z-30 transition-all ${isLandscape ? 'h-0 overflow-hidden py-0 opacity-0' : 'h-auto'}`}>
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1 text-center px-4">
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="font-bold text-gray-900 leading-tight">Design signage</h1>
                        </div>
                        {!isLandscape && <p className="text-[10px] text-gray-500">Canvas editor for this playlist</p>}
                    </div>
                    <div className="flex items-center gap-3">
                        {isSaving && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-100 animate-pulse">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Saving...</span>
                            </div>
                        )}
                        {!isSaving && typeof window !== 'undefined' && localStorage.getItem('signage_draft_design') && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                <Check className="w-3 h-3 text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saved</span>
                            </div>
                        )}
                        <div className="flex gap-1">
                            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><Undo2 className="w-5 h-5" /></button>
                            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><Redo2 className="w-5 h-5" /></button>
                        </div>
                    </div>
                </header>

                {/* Steps & Tabs - Sticky Below Header */}
                <div className={`shrink-0 bg-white px-4 transition-all duration-300 z-20 shadow-sm border-b border-gray-100 ${isLandscape && mobileTab === 'design' ? 'h-0 overflow-hidden py-0 border-0 opacity-0' : 'pb-3'}`}>
                    {!isLandscape && (
                        <div className="mb-3">
                            <p className="text-[10px] font-semibold text-gray-500 mb-0.5">
                                Step {mobileTab === 'templates' ? '1' : mobileTab === 'design' ? '2' : mobileTab === 'material' ? '3' : '4'} of 4
                            </p>
                            <h2 className="text-base font-bold text-gray-900">
                                {mobileTab === 'templates' ? 'Select Template' : mobileTab === 'design' ? 'Design Your Signage' : mobileTab === 'material' ? 'Choose Material' : 'Finalize Order'}
                            </h2>
                        </div>
                    )}
                    <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto no-scrollbar gap-1">
                        <button
                            onClick={() => setMobileTab('templates')}
                            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${mobileTab === 'templates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Templates
                        </button>
                        <button
                            onClick={() => setMobileTab('design')}
                            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${mobileTab === 'design' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Design
                        </button>
                        <button
                            onClick={() => setMobileTab('material')}
                            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${mobileTab === 'material' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Material
                        </button>
                        <button
                            onClick={() => setMobileTab('order')}
                            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${mobileTab === 'order' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Order
                        </button>
                    </div>
                </div>

                {/* Content Area - Scrollable but Design is Flex */}
                <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
                    {/* Templates Tab */}
                    {mobileTab === 'templates' && (
                        <div className={`${isLandscape ? 'fixed right-4 top-4 bottom-4 w-72 h-auto z-40 rounded-2xl shadow-2xl border border-gray-100' : 'w-full h-full pb-24'} bg-white px-4 py-4 overflow-y-auto`}>
                            <div className="max-w-md mx-auto space-y-4">
                                {/* Close button for side panel in landscape */}
                                {isLandscape && (
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-gray-900">Templates</h3>
                                        <button onClick={() => setMobileTab('design')} className="p-2 bg-gray-100 rounded-full">
                                            <X className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                )}
                                {/* Contextual Hint */}
                                <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-xs text-purple-900 flex items-start gap-2">
                                    <span className="text-base">💡</span>
                                    <span>Start by selecting a layout template that fits your needs</span>
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-4">Choose a Template</h3>
                                    <TemplateSelector
                                        selectedTemplateId={design.templateId}
                                        onSelect={(id) => {
                                            handleTemplateSelect(id);
                                        }}
                                    />
                                </div>

                                <button
                                    onClick={() => setMobileTab('design')}
                                    className="w-full bg-[#7D2AE8] hover:bg-[#6a23c4] text-white px-6 py-3 rounded-xl shadow-lg shadow-purple-300 flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:shadow-xl"
                                >
                                    Continue to Design
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Design Tab - Canvas View */}
                    {mobileTab === 'design' && (
                        <div className="flex-1 min-h-0 bg-[#E5E7EB] flex flex-col relative overflow-hidden">
                            {!isLandscape && (
                                <div className="p-3">
                                    <div className="bg-purple-50 border border-purple-200 p-2 rounded-lg text-xs text-purple-900 flex items-start gap-2">
                                        <span className="text-base leading-none">💡</span>
                                        <span>Add text, images, or shapes using the toolbar below</span>
                                    </div>
                                </div>
                            )}

                            {/* Fullscreen Button - Only in design tab landscape */}
                            {isLandscape && (
                                <button
                                    onClick={toggleFullscreen}
                                    className="absolute top-4 right-4 z-50 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg border border-gray-200 text-gray-700 hover:bg-white transition-all active:scale-90"
                                    title={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
                                >
                                    {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                                </button>
                            )}

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
                                />
                            </div>

                            {/* Rotation Notification Banner - Non-intrusive */}
                            {!isLandscape && (
                                <div className="absolute top-4 left-4 right-4 z-[60] animate-in fade-in slide-in-from-top duration-500">
                                    <div className="bg-slate-900/90 backdrop-blur text-white px-4 py-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                                            <div className="w-4 h-2 border-2 border-indigo-400 rounded-sm rotate-90 animate-pulse"></div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold">Best in Landscape</p>
                                            <p className="text-[10px] text-slate-400">Rotate phone for better design view</p>
                                        </div>
                                        <button
                                            onClick={toggleFullscreen}
                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-[10px] font-bold transition-colors"
                                        >
                                            Fullscreen
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mobile Bottom Toolbar - Sticky Bottom */}
                    {(mobileTab === 'design') && (
                        <div className={`shrink-0 bg-white border-t border-gray-100 flex justify-between items-center transition-all ${isLandscape ? 'px-8 py-1.5 shadow-[0_-2px_15px_rgba(0,0,0,0.1)]' : 'px-6 py-2 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'} z-50`}>
                            {/* Text */}
                            <button onClick={() => addTextFn?.('heading')} className={`flex flex-col items-center gap-0.5 text-gray-500 hover:text-purple-600 transition-colors ${isLandscape ? 'scale-90' : ''}`}>
                                <Type className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                <span className="text-[10px] font-medium">Text</span>
                            </button>

                            {/* Image */}
                            <button onClick={() => { setActivePicker(null); document.getElementById('mobile-image-upload')?.click(); }} className={`flex flex-col items-center gap-0.5 text-gray-500 hover:text-purple-600 transition-colors ${isLandscape ? 'scale-90' : ''}`}>
                                <ImageIcon className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                <span className="text-[10px] font-medium">Image</span>
                            </button>

                            {/* Shapes Picker Toggle */}
                            <div className="relative">
                                <button
                                    onClick={() => setActivePicker(activePicker === 'shapes' ? null : 'shapes')}
                                    className={`flex flex-col items-center gap-0.5 ${activePicker === 'shapes' ? 'text-purple-600' : 'text-gray-500'} hover:text-purple-600 transition-colors ${isLandscape ? 'scale-90' : ''}`}
                                >
                                    <Square className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                    <span className="text-[10px] font-medium">Shapes</span>
                                </button>
                                {activePicker === 'shapes' && (
                                    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 grid grid-cols-4 gap-2 min-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        {MOBILE_SHAPES.map(shape => (
                                            <button
                                                key={shape.id}
                                                onClick={() => {
                                                    // @ts-expect-error - shape.id is compatible
                                                    addShapeFn?.(shape.id);
                                                    setActivePicker(null);
                                                }}
                                                className="flex flex-col items-center gap-1 p-2 hover:bg-purple-50 rounded-xl transition-colors group"
                                            >
                                                <shape.icon className="w-5 h-5 text-gray-600 group-hover:text-purple-600" />
                                                <span className="text-[9px] text-gray-500 uppercase font-bold">{shape.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Icons Picker Toggle */}
                            <div className="relative">
                                <button
                                    onClick={() => setActivePicker(activePicker === 'icons' ? null : 'icons')}
                                    className={`flex flex-col items-center gap-0.5 ${activePicker === 'icons' ? 'text-purple-600' : 'text-gray-500'} hover:text-purple-600 transition-colors ${isLandscape ? 'scale-90' : ''}`}
                                >
                                    <Grid3X3 className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                    <span className="text-[10px] font-medium">Icons</span>
                                </button>
                                {activePicker === 'icons' && (
                                    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 grid grid-cols-5 gap-2 min-w-[250px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        {MOBILE_ICONS.map(icon => (
                                            <button
                                                key={icon.id}
                                                onClick={() => {
                                                    addIconFn?.(icon.id);
                                                    setActivePicker(null);
                                                }}
                                                className="flex flex-col items-center gap-1 p-2 hover:bg-purple-50 rounded-xl transition-colors group"
                                            >
                                                <icon.icon className="w-5 h-5 text-gray-600 group-hover:text-purple-600" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Background Color Picker Toggle */}
                            <div className="relative">
                                <button
                                    onClick={() => setActivePicker(activePicker === 'background' ? null : 'background')}
                                    className={`flex flex-col items-center gap-0.5 ${activePicker === 'background' ? 'text-purple-600' : 'text-gray-500'} hover:text-purple-600 transition-colors ${isLandscape ? 'scale-90' : ''}`}
                                >
                                    <Palette className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                    <span className="text-[10px] font-medium">Board</span>
                                </button>
                                {activePicker === 'background' && (
                                    <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 min-w-[280px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Board Style</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400">Solid</span>
                                                <button
                                                    onClick={() => setDesign({ ...design, backgroundGradientEnabled: !design.backgroundGradientEnabled })}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${design.backgroundGradientEnabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${design.backgroundGradientEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </button>
                                                <span className="text-[10px] text-gray-400">Gradient</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-5 gap-2 mb-4">
                                            {['#ffffff', '#000000', '#f1f1f1', '#e5e7eb', '#7D2AE8', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#ec4899'].map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => {
                                                        setDesign({ ...design, backgroundColor: color });
                                                        // setActivePicker(null); // Keep open for gradient tweaks
                                                    }}
                                                    className={`aspect-square rounded-lg border-2 transition-all ${design.backgroundColor === color ? 'border-purple-600 scale-110 shadow-sm' : 'border-gray-100 hover:border-gray-300'}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>

                                        <div className="space-y-4 pt-3 border-t border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <label className="text-xs font-medium text-gray-500 whitespace-nowrap">{design.backgroundGradientEnabled ? 'Start Color:' : 'Custom:'}</label>
                                                <input
                                                    type="color"
                                                    value={design.backgroundColor}
                                                    onChange={(e) => setDesign({ ...design, backgroundColor: e.target.value })}
                                                    className="flex-1 h-8 rounded cursor-pointer border border-gray-200"
                                                />
                                            </div>

                                            {design.backgroundGradientEnabled && (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <label className="text-xs font-medium text-gray-500 whitespace-nowrap">End Color:</label>
                                                        <input
                                                            type="color"
                                                            value={design.backgroundColor2}
                                                            onChange={(e) => setDesign({ ...design, backgroundColor2: e.target.value })}
                                                            className="flex-1 h-8 rounded cursor-pointer border border-gray-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Angle</label>
                                                            <span className="text-[10px] font-bold text-purple-600">{design.backgroundGradientAngle}°</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="360"
                                                            value={design.backgroundGradientAngle}
                                                            onChange={(e) => setDesign({ ...design, backgroundGradientAngle: parseInt(e.target.value) })}
                                                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* QR Code Tool */}
                            <button
                                onClick={() => setShowQRInput(true)}
                                className={`flex flex-col items-center gap-0.5 text-gray-500 hover:text-purple-600 transition-colors ${isLandscape ? 'scale-90' : ''}`}
                            >
                                <QrCode className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'}`} />
                                <span className="text-[10px] font-medium">QR</span>
                            </button>

                            <button onClick={toggleFullscreen} className={`flex flex-col items-center gap-0.5 text-gray-500 hover:text-purple-600 transition-colors ${isLandscape ? 'scale-90' : ''}`}>
                                {isFullscreen ? <Minimize className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'}`} /> : <Maximize className={`${isLandscape ? 'w-4 h-4' : 'w-5 h-5'}`} />}
                                <span className="text-[10px] font-medium">{isFullscreen ? 'Exit' : 'Full'}</span>
                            </button>

                            {/* Continue to Material Button */}
                            <button
                                onClick={() => setMobileTab('material')}
                                className={`${isLandscape ? 'px-4 py-2' : 'px-5 py-2.5'} bg-[#7D2AE8] text-white rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:bg-[#6a23c4] active:scale-95 font-bold text-sm`}
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* QR Code Input Modal */}
                    {showQRInput && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold text-gray-900">Add QR Code</h3>
                                        <button onClick={() => setShowQRInput(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                            <X className="w-5 h-5 text-gray-500" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">Enter a URL or text to generate a QR code for your signage.</p>
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={qrText}
                                            onChange={(e) => setQrText(e.target.value)}
                                            placeholder="https://example.com"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && handleQRGenerate()}
                                        />
                                        <button
                                            onClick={handleQRGenerate}
                                            disabled={!qrText.trim() || isGeneratingQR}
                                            className="w-full py-3.5 bg-[#7D2AE8] text-white rounded-xl font-bold shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                                        >
                                            {isGeneratingQR ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <QrCode className="w-5 h-5" />
                                                    Generate QR Code
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Material Tab - Material Selector */}
                    {mobileTab === 'material' && (
                        <div className={`${isLandscape ? 'fixed right-4 top-4 bottom-4 w-72 h-auto z-40 rounded-2xl shadow-2xl border border-gray-100' : 'w-full h-full pb-24'} bg-white px-4 py-4 overflow-y-auto`}>
                            <div className="max-w-md mx-auto space-y-4">
                                {/* Close button for side panel in landscape */}
                                {isLandscape && (
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-gray-900">Material</h3>
                                        <button onClick={() => setMobileTab('design')} className="p-2 bg-gray-100 rounded-full">
                                            <X className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                )}
                                {/* Contextual Hint */}
                                <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-xs text-purple-900 flex items-start gap-2">
                                    <span className="text-base">💡</span>
                                    <span>Select the material type for your signage to see pricing and options</span>
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-4">Choose Material</h3>
                                    <MaterialSelector
                                        selectedMaterial={material}
                                        onSelect={setMaterial}
                                    />
                                </div>

                                {/* Next Step Button */}
                                <button
                                    onClick={() => setMobileTab('order')}
                                    className="w-full bg-[#7D2AE8] hover:bg-[#6a23c4] text-white px-6 py-3 rounded-xl shadow-lg shadow-purple-300 flex items-center justify-center gap-2 text-sm font-semibold transition-all hover:shadow-xl"
                                >
                                    Continue to Order
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Order Tab - Checkout Form */}
                    {mobileTab === 'order' && (
                        <div className={`${isLandscape ? 'fixed right-4 top-4 bottom-4 w-72 h-auto z-40 rounded-2xl shadow-2xl border border-gray-100' : 'w-full h-full pb-24'} bg-white px-4 py-4 overflow-y-auto`}>
                            <div className="max-w-md mx-auto space-y-4">
                                {/* Close button for side panel in landscape */}
                                {isLandscape && (
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-bold text-gray-900">Order</h3>
                                        <button onClick={() => setMobileTab('design')} className="p-2 bg-gray-100 rounded-full">
                                            <X className="w-4 h-4 text-gray-600" />
                                        </button>
                                    </div>
                                )}
                                {/* Contextual Hint */}
                                <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-xs text-purple-900 flex items-start gap-2">
                                    <span className="text-base">💡</span>
                                    <span>Complete your order details and choose payment option to proceed</span>
                                </div>

                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <h3 className="font-semibold text-gray-900 mb-4">Finalize Order</h3>

                                    {/* Delivery Options */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">Delivery Options</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            <button
                                                onClick={() => setDeliveryType('standard')}
                                                className={`p-4 rounded-lg border-2 text-left transition-all ${deliveryType === 'standard'
                                                    ? 'border-purple-600 bg-purple-50 shadow-sm'
                                                    : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Truck className={`w-5 h-5 ${deliveryType === 'standard' ? 'text-purple-600' : 'text-gray-500'}`} />
                                                    <span className="font-semibold text-sm">Standard</span>
                                                </div>
                                                <p className="text-xs text-gray-500">5-7 Days &middot; Free</p>
                                            </button>

                                            <button
                                                onClick={() => setDeliveryType('fast')}
                                                className={`p-4 rounded-lg border-2 text-left transition-all ${deliveryType === 'fast'
                                                    ? 'border-purple-600 bg-purple-50 shadow-sm'
                                                    : 'border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Truck className={`w-5 h-5 ${deliveryType === 'fast' ? 'text-purple-600' : 'text-gray-500'}`} />
                                                    <span className="font-semibold text-sm">Fast Delivery</span>
                                                </div>
                                                <p className="text-xs text-gray-500">Within 2 Days</p>
                                                <p className="text-sm font-medium mt-1 text-purple-600">+&nbsp;₹{FAST_DELIVERY_COST}</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Installation */}
                                    <div className="mb-6">
                                        <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all has-[:checked]:border-purple-600 has-[:checked]:bg-purple-50">
                                            <input
                                                type="checkbox"
                                                checked={includeInstallation}
                                                onChange={(e) => setIncludeInstallation(e.target.checked)}
                                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                                            />
                                            <div className="ml-3 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Wrench className="w-4 h-4 text-gray-500" />
                                                    <span className="font-semibold text-sm">Professional Installation</span>
                                                </div>
                                                <p className="text-xs text-gray-500">Expert installation</p>
                                            </div>
                                            <span className="font-medium text-sm text-purple-600">+&nbsp;₹{INSTALLATION_COST}</span>
                                        </label>
                                    </div>

                                    {/* Contact Details */}
                                    <div className="space-y-3 mb-6">
                                        <h4 className="font-medium text-gray-900 border-t pt-4">Contact Details</h4>
                                        <input
                                            type="text"
                                            value={contactDetails.name}
                                            onChange={(e) => setContactDetails({ ...contactDetails, name: e.target.value })}
                                            placeholder="Name"
                                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
                                        />
                                        <input
                                            type="email"
                                            value={contactDetails.email}
                                            onChange={(e) => setContactDetails({ ...contactDetails, email: e.target.value })}
                                            placeholder="Email"
                                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
                                        />
                                        <input
                                            type="tel"
                                            value={contactDetails.mobile}
                                            onChange={(e) => setContactDetails({ ...contactDetails, mobile: e.target.value })}
                                            placeholder="Mobile"
                                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
                                        />
                                        <input
                                            type="text"
                                            value={contactDetails.shippingAddress}
                                            onChange={(e) => setContactDetails({ ...contactDetails, shippingAddress: e.target.value })}
                                            placeholder="Shipping Address"
                                            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    {/* Payment Scheme */}
                                    <div className="mb-6">
                                        <h4 className="font-medium text-gray-900 mb-3 border-t pt-4">Payment</h4>
                                        <div className="flex gap-2 mb-3">
                                            <button
                                                onClick={() => setPaymentScheme('part')}
                                                className={`flex-1 py-2 text-xs font-semibold rounded-md border ${paymentScheme === 'part' ? 'bg-purple-50 border-purple-600 text-purple-700' : 'border-gray-200'}`}
                                            >
                                                Pay Advance (₹{advanceAmount})
                                            </button>
                                            <button
                                                onClick={() => setPaymentScheme('full')}
                                                className={`flex-1 py-2 text-xs font-semibold rounded-md border ${paymentScheme === 'full' ? 'bg-purple-50 border-purple-600 text-purple-700' : 'border-gray-200'}`}
                                            >
                                                Pay Full (₹{price})
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleOpenReview}
                                            disabled={isProcessing}
                                            className="w-full py-3 bg-[#7D2AE8] hover:bg-[#6a23c4] text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    Pay ₹{paymentScheme === 'part' ? advanceAmount : price} &amp; Order
                                                    <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Standard Desktop Layout
    return (
        <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">
            {/* Minimal Header */}
            <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
                    <span className="font-bold text-gray-900 tracking-tight">Signage Studio</span>
                </div>
                <div className="flex items-center gap-4">
                    {isSaving && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 rounded-full border border-green-100 animate-pulse">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Saving to Cloud...</span>
                        </div>
                    )}
                    {!isSaving && typeof window !== 'undefined' && localStorage.getItem('signage_draft_design') && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                            <Check className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">All changes saved</span>
                        </div>
                    )}
                    <div className="text-sm text-gray-500">
                        {design.width}in x {design.height}in
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { }}>Saved to Local</Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* 1. Main Editor Sidebar (Left) */}
                <div className="shrink-0 h-full relative z-10">
                    <EditorSidebar
                        selectedTemplateId={design.templateId}
                        onSelectTemplate={handleTemplateSelect}
                        onAddText={(type) => addTextFn?.(type)}
                        onAddIcon={(iconName) => addIconFn?.(iconName)}
                        onAddShape={(shape) => addShapeFn?.(shape)}
                        onAddImage={(url) => addImageFn?.(url)}
                    />
                </div>

                {/* 2. Main Canvas Area (Center) */}
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
                            onAddImage={registerAddImage}
                        />
                    </div>
                </div>

                {/* 3. Properties & Checkout Panel (Right) */}
                <div className="w-[340px] bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shrink-0 z-10 custom-scrollbar flex flex-col">
                    <div className="p-0 flex-1">
                        {/* Header */}
                        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                Configuration
                            </h3>
                            <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">Need Help?</button>
                        </div>

                        <div className="p-6 space-y-8">

                            {/* Materials & Installation Card */}
                            <div className="space-y-6">
                                {/* Size Controls (ReadOnly) */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dimensions</label>
                                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 text-gray-300 rounded border border-slate-700">
                                            {design.unit}
                                        </span>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg flex justify-between items-center group">
                                            <span className="text-xs text-gray-400 font-medium group-hover:text-indigo-400 transition-colors">W</span>
                                            <span className="text-sm font-bold text-white">{design.width}</span>
                                        </div>
                                        <div className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg flex justify-between items-center group">
                                            <span className="text-xs text-gray-400 font-medium group-hover:text-indigo-400 transition-colors">H</span>
                                            <span className="text-sm font-bold text-white">{design.height}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Background & Export Row */}
                                <div className="grid grid-cols-1 gap-6 pt-6 border-t border-slate-800">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-white block">Background</label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-400">Solid</span>
                                                <button
                                                    onClick={() => setDesign({ ...design, backgroundGradientEnabled: !design.backgroundGradientEnabled })}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${design.backgroundGradientEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${design.backgroundGradientEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                                                </button>
                                                <span className="text-[10px] text-gray-400">Gradient</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2.5">
                                                {['#ffffff', '#000000', '#f1f1f1', '#e5e7eb', '#7D2AE8', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#ec4899'].map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setDesign({ ...design, backgroundColor: color })}
                                                        className={`w-7 h-7 rounded-full shadow-sm transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${design.backgroundColor === color ? 'ring-2 ring-offset-1 ring-indigo-600 scale-110 z-10' : 'ring-1 ring-black/5 hover:ring-black/10'}`}
                                                        style={{ backgroundColor: color }}
                                                        title={color}
                                                    />
                                                ))}
                                                <div className="relative w-7 h-7 rounded-full ring-1 ring-black/5 overflow-hidden shadow-sm hover:ring-black/20 transition-all">
                                                    <input
                                                        type="color"
                                                        value={design.backgroundColor}
                                                        onChange={(e) => setDesign({ ...design, backgroundColor: e.target.value })}
                                                        className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0"
                                                        title="Custom Color"
                                                    />
                                                    <div className="w-full h-full bg-[conic-gradient(from_180deg_at_50%_50%,#FF0000_0deg,#00FF00_120deg,#0000FF_240deg,#FF0000_360deg)] opacity-80 hover:opacity-100" />
                                                </div>
                                            </div>

                                            {design.backgroundGradientEnabled && (
                                                <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[10px] font-bold text-gray-300 uppercase">End Color</label>
                                                            <div className="relative h-8 w-full rounded-lg border border-slate-600 overflow-hidden group">
                                                                <input
                                                                    type="color"
                                                                    value={design.backgroundColor2}
                                                                    onChange={(e) => setDesign({ ...design, backgroundColor2: e.target.value })}
                                                                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0 z-10"
                                                                />
                                                                <div
                                                                    className="w-full h-full transition-transform group-hover:scale-110 duration-200"
                                                                    style={{ backgroundColor: design.backgroundColor2 }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-[10px] font-bold text-gray-300 uppercase">Angle</label>
                                                                <span className="text-[10px] font-bold text-indigo-400">{design.backgroundGradientAngle}°</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="360"
                                                                value={design.backgroundGradientAngle}
                                                                onChange={(e) => setDesign({ ...design, backgroundGradientAngle: parseInt(e.target.value) })}
                                                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Export Options */}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() => handleDownload('svg')}
                                            variant="outline"
                                            className="flex-1 gap-2 h-9 text-xs border-slate-700 bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-indigo-400 hover:border-indigo-500"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            SVG
                                        </Button>
                                        <Button
                                            onClick={() => handleDownload('pdf')}
                                            variant="outline"
                                            className="flex-1 gap-2 h-9 text-xs border-slate-700 bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-red-400 hover:border-red-500"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            PDF
                                        </Button>
                                    </div>
                                </div>

                                {/* Material Select */}
                                <div className="pt-6 border-t border-slate-800">
                                    <label className="text-sm font-bold text-white mb-3 block">Material</label>
                                    <MaterialSelector
                                        selectedMaterial={material}
                                        onSelect={setMaterial}
                                    />
                                </div>

                                {/* Professional Installation */}
                                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-all shadow-sm ${includeInstallation ? 'bg-indigo-600 border-indigo-600 scale-110' : 'bg-slate-700 border-slate-600 group-hover:border-indigo-500'}`}>
                                            {includeInstallation && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={includeInstallation}
                                            onChange={e => setIncludeInstallation(e.target.checked)}
                                            className="hidden"
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="text-sm font-bold text-white">Professional Installation</span>
                                                <span className="text-xs font-bold text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded-full">+₹{INSTALLATION_COST}</span>
                                            </div>
                                            <p className="text-xs text-gray-400">Our expert team handles the mounting.</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Payment Section */}
                            <div className="pt-2">
                                <label className="text-sm font-bold text-white mb-3 block">Payment Scheme</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPaymentScheme('part')}
                                        className={`relative p-3 rounded-xl border-2 text-left transition-all ${paymentScheme === 'part' ? 'border-indigo-500 bg-indigo-900/30 shadow-sm' : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border mb-2 flex items-center justify-center ${paymentScheme === 'part' ? 'border-indigo-500' : 'border-slate-600'}`}>
                                            {paymentScheme === 'part' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                        </div>
                                        <p className="font-bold text-sm text-white">Part Pay</p>
                                        <p className="text-[10px] text-gray-400 leading-tight mt-1">Pay 25% now, rest on delivery</p>
                                    </button>

                                    <button
                                        onClick={() => setPaymentScheme('full')}
                                        className={`relative p-3 rounded-xl border-2 text-left transition-all ${paymentScheme === 'full' ? 'border-indigo-500 bg-indigo-900/30 shadow-sm' : 'border-slate-700 hover:border-slate-600 bg-slate-800'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full border mb-2 flex items-center justify-center ${paymentScheme === 'full' ? 'border-indigo-500' : 'border-slate-600'}`}>
                                            {paymentScheme === 'full' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                        </div>
                                        <p className="font-bold text-sm text-white">Full Pay</p>
                                        <p className="text-[10px] text-gray-400 leading-tight mt-1">Pay 100% upfront</p>
                                    </button>
                                </div>

                                {paymentScheme === 'part' && (
                                    <div className="mt-3 p-3 bg-slate-800 border border-slate-700 rounded-lg animate-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-semibold text-gray-300">Advance Amount</label>
                                            <span className="text-[10px] text-indigo-400 font-medium">Min: ₹{Math.ceil(price * 0.25)}</span>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-white font-semibold">₹</span>
                                            <input
                                                type="number"
                                                value={advanceAmount}
                                                onChange={(e) => setAdvanceAmount(Math.max(Math.ceil(price * 0.25), parseFloat(e.target.value) || 0))}
                                                min={Math.ceil(price * 0.25)}
                                                max={price}
                                                className="w-full pl-6 pr-3 py-1.5 text-sm font-bold text-white bg-slate-700 border border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer / Checkout */}
                    <div className="p-5 border-t border-slate-800 bg-slate-900/80 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.4)] z-20">
                        {/* Price Rows */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Subtotal</span>
                                <span>₹{basePrice}</span>
                            </div>
                            {(deliveryCost > 0 || installationCost > 0) && (
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Extras (Delivery/Install)</span>
                                    <span>₹{deliveryCost + installationCost}</span>
                                </div>
                            )}
                            {discount > 0 && (
                                <div className="flex justify-between text-xs text-green-400 font-medium">
                                    <span>Discount</span>
                                    <span>-₹{discount}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end pt-2 border-t border-slate-700 mt-2">
                                <span className="font-bold text-white text-lg">Total</span>
                                <div className="text-right">
                                    <span className="font-black text-2xl text-indigo-400 leading-none">₹{price}</span>
                                </div>
                            </div>
                        </div>

                        {/* Referral Code */}
                        <div className="relative">
                            <input
                                type="text"
                                value={referralCode}
                                onChange={(e) => {
                                    const code = e.target.value.toUpperCase();
                                    setReferralCode(code);
                                    if (code) {
                                        validateReferralCode(code);
                                    } else {
                                        setCodeValidated(false);
                                    }
                                }}
                                placeholder="Referral Code (Optional)"
                                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${codeValidated ? 'border-green-500 ring-green-500 bg-green-900/30 text-green-300 placeholder-green-500' : 'border-slate-700 focus:border-indigo-500 bg-slate-800 text-white placeholder-gray-500'}`}
                            />
                            {codeValidated && <div className="absolute right-3 top-2 text-green-400 text-xs font-bold">✓ APPLIED</div>}
                        </div>

                        <button
                            onClick={handleOpenReview}
                            disabled={isProcessing}
                            className="w-full group bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                        >
                            {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                            {!isProcessing && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </div>
            </div>

            <ReviewApproval
                data={data}
                design={design}
                material={material}
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onApprove={async () => {
                    setShowReviewModal(false);
                    await handleCheckout();
                }}
                canvasJSON={canvasSnapshot}
            />

            <WhatsAppButton
                variant="floating"
                message="Hi! I&apos;m on the design page and need help with my signage. Can you assist?"
            />
        </div>
    );
}
