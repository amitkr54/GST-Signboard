'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TEMPLATE_DEFAULTS } from '@/lib/templates';
import { MaterialSelector } from '@/components/MaterialSelector';
import { EditorSidebar } from '@/components/EditorSidebar';
import { Button } from '@/components/ui/Button';
import { TemplateSelector } from '@/components/TemplateSelector';
import { DesignUpload } from '@/components/DesignUpload';
import { DesignSidebar } from '@/components/DesignSidebar';
import { ReviewApproval } from '@/components/ReviewApproval';
import { SignageData, DesignConfig, DEFAULT_DESIGN, TemplateId } from '@/lib/types';
import { calculatePrice, MaterialId } from '@/lib/utils';
import { createOrder, processPayment, trackReferral, initiatePhonePePayment } from '@/app/actions';
import { ArrowRight, Truck, Wrench, ChevronLeft, Undo2, Redo2, Type, Image as ImageIcon, Square, QrCode, X, Loader2, Check } from 'lucide-react';
import { PreviewSection } from '@/components/PreviewSection';
import { WhatsAppButton } from '@/components/WhatsAppButton';

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

    // Responsive State
    const [isMobile, setIsMobile] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();

    // Handle Resize for Responsive Layout
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
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

        // Update text with template default if current text is empty or matches another default
        const defaults = TEMPLATE_DEFAULTS[id];
        if (defaults) {
            setData(prev => {
                // Check if current company name is a "default" name from any template or empty
                const currentName = prev.companyName;
                const isDefaultName = !currentName || Object.values(TEMPLATE_DEFAULTS).some(d => d.companyName === currentName);

                if (isDefaultName) {
                    return {
                        ...prev,
                        companyName: defaults.companyName || prev.companyName,
                        address: defaults.address || prev.address,
                        additionalText: defaults.additionalText || prev.additionalText
                    };
                }
                return prev;
            });
        }
    };

    // Check for template query param
    useEffect(() => {
        const templateId = searchParams.get('template');
        if (templateId) {
            // @ts-ignore
            setDesign(prev => ({ ...prev, templateId: templateId }));

            // If on mobile, switch to design tab
            if (isMobile) {
                setMobileTab('design');
            }
        }
    }, [searchParams, isMobile]);

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
            // 1. Create Order
            const { success, orderId, error, payableAmount } = await createOrder(data, design, material, {
                deliveryType,
                includeInstallation,
                referralCode: codeValidated ? referralCode : undefined,
                contactDetails,
                paymentScheme,
                advanceAmount: paymentScheme === 'part' ? advanceAmount : undefined
            });

            if (!success || !orderId) {
                alert('Failed to create order: ' + error);
                setIsProcessing(false);
                return;
            }

            // 2. Initiate PhonePe Payment
            const paymentResult = await initiatePhonePePayment(orderId, payableAmount || price, contactDetails.mobile);

            if (paymentResult.success && paymentResult.url) {
                // Track referral if code exists
                if (referralCode && codeValidated) {
                    await trackReferral(orderId, referralCode);
                }

                // Store design data for download on success page
                sessionStorage.setItem('signageDesign', JSON.stringify({
                    data,
                    design,
                    material,
                    options: {
                        deliveryType,
                        includeInstallation,
                        price,
                        contactDetails,
                        paymentScheme,
                        advanceAmount: paymentScheme === 'part' ? advanceAmount : undefined
                    }
                }));

                // Redirect to PhonePe
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
                {/* Mobile Header - Fixed Top */}
                <header className="fixed top-0 left-0 right-0 bg-white px-4 py-3 flex items-center justify-between shadow-sm z-30">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex-1 text-center px-4">
                        <div className="flex items-center justify-center gap-2">
                            <h1 className="font-bold text-gray-900 leading-tight">Design signage</h1>
                        </div>
                        <p className="text-xs text-gray-500">Canvas editor for this playlist</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><Undo2 className="w-5 h-5" /></button>
                            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-full"><Redo2 className="w-5 h-5" /></button>
                        </div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                            {/* Placeholder for User Avatar */}
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                    </div>
                </header>

                {/* Steps & Tabs - Fixed Below Header */}
                <div className="fixed top-[60px] left-0 right-0 bg-white px-4 pb-4 z-20 shadow-sm border-b border-gray-100">
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">
                            Step {mobileTab === 'templates' ? '1' : mobileTab === 'design' ? '2' : mobileTab === 'material' ? '3' : '4'} of 4
                        </p>
                        <h2 className="text-lg font-bold text-gray-900">
                            {mobileTab === 'templates' ? 'Select Template' : mobileTab === 'design' ? 'Design Your Signage' : mobileTab === 'material' ? 'Choose Material' : 'Finalize Order'}
                        </h2>
                    </div>
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

                {/* Templates Tab */}
                {mobileTab === 'templates' && (
                    <div className="fixed inset-0 bg-gray-50 z-0 pt-[140px] px-4 pb-20 overflow-y-auto">
                        <div className="max-w-md mx-auto space-y-4">
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
                                        // Optional: Auto-advance
                                        // setMobileTab('design'); 
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
                <div className={mobileTab === 'design' ? '' : 'hidden'}>
                    <div className="fixed inset-0 bg-[#E5E7EB] z-0 flex flex-col justify-center items-center pt-[170px] pb-[100px]">
                        <div className="absolute top-[180px] right-4 z-10 text-[10px] font-medium text-gray-500">100%</div>

                        {/* Contextual Hint */}
                        <div className="absolute top-[140px] left-4 right-4 z-10">
                            <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg text-xs text-purple-900 flex items-start gap-2">
                                <span className="text-base">💡</span>
                                <span>Add text, images, shapes, or QR codes using the toolbar below</span>
                            </div>
                        </div>

                        <div className="w-full h-full p-4 flex items-center justify-center">
                            <div className="w-full max-w-[95%] shadow-lg">
                                <PreviewSection
                                    uploadedDesign={uploadedDesign}
                                    data={data}
                                    design={design}
                                    material={material}
                                    compact={true}
                                    onDesignChange={setDesign}
                                    onAddText={(fn) => setAddTextFn(() => fn)}
                                    onAddIcon={(fn) => setAddIconFn(() => fn)}
                                    onAddShape={(fn) => setAddShapeFn(() => fn)}
                                    onAddImage={(fn) => setAddImageFn(() => fn)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Bottom Toolbar */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-between items-center px-8 py-3 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                        {/* Text */}
                        <button onClick={() => addTextFn?.('heading')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors">
                            <Type className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Text</span>
                        </button>

                        {/* Image */}
                        <button onClick={() => document.getElementById('mobile-image-upload')?.click()} className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Image</span>
                        </button>
                        <input
                            id="mobile-image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const url = URL.createObjectURL(file);
                                    addImageFn?.(url);
                                }
                            }}
                        />

                        {/* Shapes */}
                        <button onClick={() => addShapeFn?.('rect')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors">
                            <Square className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Shapes</span>
                        </button>

                        {/* QR / Logo */}
                        <button onClick={() => addIconFn?.('star')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-purple-600 transition-colors">
                            <QrCode className="w-6 h-6" />
                            <span className="text-[10px] font-medium">QR / Logo</span>
                        </button>
                    </div>

                    {/* Next Step Button */}
                    <button
                        onClick={() => setMobileTab('material')}
                        className="fixed bottom-16 right-4 bg-[#7D2AE8] hover:bg-[#6a23c4] text-white px-5 py-2.5 rounded-full shadow-lg shadow-purple-300 flex items-center gap-2 text-sm font-semibold transition-all z-50 hover:shadow-xl"
                    >
                        Continue to Material
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Material Tab - Material Selector */}
                {mobileTab === 'material' && (
                    <div className="fixed inset-0 bg-gray-50 z-0 pt-[140px] px-4 pb-20 overflow-y-auto">
                        <div className="max-w-md mx-auto space-y-4">
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
                    <div className="fixed inset-0 bg-gray-50 z-0 pt-[140px] px-4 pb-20 overflow-y-auto">
                        <div className="max-w-md mx-auto space-y-4">
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
                                            <p className="text-xs text-gray-500">5-7 Days · Free</p>
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
                                            <p className="text-sm font-medium mt-1 text-purple-600">+₹{FAST_DELIVERY_COST}</p>
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
                                        <span className="font-medium text-sm text-purple-600">+₹{INSTALLATION_COST}</span>
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
                                        onClick={handleCheckout}
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
                                                Pay ₹{paymentScheme === 'part' ? advanceAmount : price} & Order
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
        );
    }

    // Standard Desktop Layout
    return (
        <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">
            {/* Minimal Header */}
            <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
                    <span className="font-bold text-gray-900 tracking-tight">Signage Studio</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                        {design.width}in x {design.height}in
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { }}>Save Draft</Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* 1. Main Editor Sidebar (Left) */}
                <div className="shrink-0 h-full relative z-10 shadow-lg">
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
                <div className="flex-1 bg-gray-100/50 relative overflow-hidden flex flex-col">
                    <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
                        <div className="bg-white rounded shadow-2xl overflow-hidden relative" style={{ width: 'fit-content', height: 'fit-content' }}>
                            <PreviewSection
                                uploadedDesign={uploadedDesign}
                                data={data}
                                design={design}
                                onDesignChange={setDesign}
                                material={material}
                                onAddText={(fn) => setAddTextFn(() => fn)}
                                onAddIcon={(fn) => setAddIconFn(() => fn)}
                                onAddShape={(fn) => setAddShapeFn(() => fn)}
                                onAddImage={(fn) => setAddImageFn(() => fn)}
                            />
                        </div>
                    </div>
                </div>

                {/* 3. Properties & Checkout Panel (Right) */}
                <div className="w-[320px] bg-white border-l border-gray-200 h-full overflow-y-auto shrink-0 z-10 custom-scrollbar">
                    <div className="p-6">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            Material & Order
                        </h3>

                        <div className="space-y-8">
                            {/* Size Display */}
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Dimensions</label>
                                <div className="flex items-center justify-between font-mono text-sm">
                                    <span>Width: {design.width}"</span>
                                    <span className="text-gray-300">|</span>
                                    <span>Height: {design.height}"</span>
                                </div>
                            </div>

                            {/* Material Select */}
                            <div>
                                <label className="text-sm font-semibold text-gray-900 mb-3 block">Material</label>
                                <MaterialSelector
                                    selectedMaterial={material}
                                    onSelect={setMaterial}
                                />
                            </div>

                            {/* Installation */}
                            <div className="pt-4 border-t border-gray-100">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${includeInstallation ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                                        {includeInstallation && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={includeInstallation}
                                        onChange={e => setIncludeInstallation(e.target.checked)}
                                        className="hidden"
                                    />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-900">Professional Installation</span>
                                        <p className="text-xs text-gray-500">Expert team setup (+₹{INSTALLATION_COST})</p>
                                    </div>
                                </label>
                            </div>


                            <label className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${paymentScheme === 'part' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                <div className="flex items-center mb-2">
                                    <input
                                        type="radio"
                                        name="paymentScheme"
                                        value="part"
                                        checked={paymentScheme === 'part'}
                                        onChange={() => setPaymentScheme('part')}
                                        className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                                    />
                                    <div className="ml-3">
                                        <span className="font-semibold block">Part Payment</span>
                                        <span className="text-sm text-gray-500">Pay minimum 25% now, balance on delivery</span>
                                    </div>
                                </div>

                                {paymentScheme === 'part' && (
                                    <div className="ml-8 mt-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay Now (Min ₹{Math.ceil(price * 0.25)})</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500">₹</span>
                                            <input
                                                type="number"
                                                value={advanceAmount}
                                                onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                                                min={Math.ceil(price * 0.25)}
                                                max={price}
                                                className="w-full pl-8 pr-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                        <p className="text-sm text-purple-600 mt-1">
                                            Balance Due: ₹{price - (advanceAmount || 0)}
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 pt-6 border-t">
                        <div>
                            <p className="text-gray-600">Selected Material</p>
                            <p className="text-xl font-bold capitalize">{material.replace(/([A-Z])/g, ' $1').trim()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-600">Total Price</p>
                            {discount > 0 ? (
                                <div>
                                    <p className="text-lg text-gray-400 line-through">₹{basePrice + deliveryCost + installationCost}</p>
                                    <p className="text-3xl font-bold text-green-600">₹{price}</p>
                                    <p className="text-xs text-green-600">Saved ₹{discount}</p>
                                </div>
                            ) : (
                                <p className="text-3xl font-bold text-purple-700">₹{price}</p>
                            )}
                        </div>
                    </div>

                    {/* Referral Code Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Have a Referral Code? Get ₹150 OFF!
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={referralCode}
                                onChange={(e) => {
                                    const code = e.target.value.toUpperCase();
                                    setReferralCode(code);
                                    if (code) {
                                        document.cookie = `ref_code=${code}; max-age=${30 * 24 * 60 * 60}; path=/`;
                                        validateReferralCode(code);
                                    } else {
                                        setCodeValidated(false);
                                    }
                                }}
                                placeholder="Enter referral code"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            {isValidatingCode && (
                                <div className="flex items-center px-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <span className="text-sm text-blue-700 font-medium">Checking...</span>
                                </div>
                            )}
                            {!isValidatingCode && referralCode && codeValidated && (
                                <div className="flex items-center px-3 bg-green-50 border border-green-200 rounded-lg">
                                    <span className="text-sm text-green-700 font-medium">✓ Valid</span>
                                </div>
                            )}
                            {!isValidatingCode && referralCode && !codeValidated && (
                                <div className="flex items-center px-3 bg-red-50 border border-red-200 rounded-lg">
                                    <span className="text-sm text-red-700 font-medium">✗ Invalid</span>
                                </div>
                            )}
                        </div>
                        {codeValidated && referralCode && (
                            <p className="text-xs text-green-600 mt-1">
                                🎉 You'll save ₹150!
                            </p>
                        )}
                        {!codeValidated && referralCode && !isValidatingCode && (
                            <p className="text-xs text-red-600 mt-1">
                                Invalid referral code. Please check and try again.
                            </p>
                        )}
                    </div>

                    <div className="pt-6 border-t flex flex-col gap-4">
                        <button
                            onClick={() => setShowReviewModal(true)}
                            disabled={isProcessing}
                            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? 'Processing Order...' : 'Review & Place Order'}
                            {!isProcessing && <ArrowRight className="w-6 h-6" />}
                        </button>

                        {/* Need Help Section */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                            <p className="text-sm font-medium text-gray-700 mb-1">Need help with your order?</p>
                            <p className="text-sm text-gray-600">Call our support team:</p>
                            <a href="tel:+919876543210" className="text-blue-600 font-bold hover:underline">+91 98765 43210</a>
                            <p className="text-xs text-gray-500 mt-1">Mon-Sat, 10 AM - 7 PM</p>
                        </div>
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
            />

            {/* Floating WhatsApp Button */}
            <WhatsAppButton
                variant="floating"
                message="Hi! I'm on the design page and need help with my signage. Can you assist?"
            />
        </div >
    );
}
