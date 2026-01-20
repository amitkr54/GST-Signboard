'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TEMPLATE_DEFAULTS } from '@/lib/templates';
import { MaterialSelector } from '@/components/MaterialSelector';
import { EditorSidebar, TabType } from '@/components/EditorSidebar';
import { Button } from '@/components/ui/Button';
import { TemplateSelector } from '@/components/TemplateSelector';
import { DesignUpload } from '@/components/DesignUpload';
import { ReviewApproval } from '@/components/ReviewApproval';
import { SignageData, DesignConfig, DEFAULT_DESIGN, TemplateId } from '@/lib/types';
import { calculatePrice, MaterialId } from '@/lib/utils';
import { createOrder, processPayment, trackReferral, initiatePhonePePayment, syncDesign, generateQRCode, getReferrerByCode, updateTemplateConfig, uploadProductImages, getTemplateById, getAppSetting } from '@/app/actions';
import {
    ArrowRight, Truck, Wrench, ChevronLeft, Undo2, Redo2, Type, Image as ImageIcon,
    Square, QrCode, X, Loader2, Check, Maximize, Minimize, Phone, Mail, MapPin,
    Globe, Star, Heart, Clock, Calendar, User, Building, Palette, Grid3X3,
    Download, Save, Circle, Triangle, Minus, Sparkles
} from 'lucide-react';

import { PreviewSection } from '@/components/PreviewSection';
import { TextFormatToolbar } from '@/components/TextFormatToolbar';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { ShareMenu } from '@/components/ShareMenu';
import { useAuth } from '@/components/AuthProvider';
import { OnboardingTour } from '@/components/OnboardingTour';

const MOBILE_SHAPES = [
    { id: 'rect', icon: Square, label: 'Square' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'line', icon: Minus, label: 'Line' },
] as const;

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
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showContactForm, setShowContactForm] = useState(false);
    const [authChoice, setAuthChoice] = useState<'google' | 'guest' | null>(null);
    const [canvasSnapshot, setCanvasSnapshot] = useState<string | null>(null);
    const [showMaterialSection, setShowMaterialSection] = useState(false);
    const [priceFromUrl, setPriceFromUrl] = useState<number | null>(null);

    // Referral State
    const [referralCode, setReferralCode] = useState('');
    const [isValidatingCode, setIsValidatingCode] = useState(false);
    const [codeValidated, setCodeValidated] = useState(false);
    const [isReferralEnabled, setIsReferralEnabled] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            const enabled = await getAppSetting('referral_scheme_enabled', true);
            setIsReferralEnabled(enabled);
        };
        fetchSettings();
    }, []);

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

    const router = useRouter();
    const searchParams = useSearchParams();
    const isProductPath = !!searchParams.get('product');
    const isAdminMode = searchParams.get('mode') === 'admin';
    const adminPin = searchParams.get('pin');
    const { user, signInWithGoogle } = useAuth();

    // Auto-fill contact details if user is logged in
    useEffect(() => {
        if (user) {
            setContactDetails(prev => ({
                ...prev,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || prev.name,
                email: user.email || prev.email,
            }));
        }
    }, [user]);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedObject, setSelectedObject] = useState<any>(null);
    const [toolbarActionFn, setToolbarActionFn] = useState<((action: string) => void) | null>(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState<TabType | null>(null);
    const [isTourOpen, setIsTourOpen] = useState(false);

    // Responsive State
    const [isMobile, setIsMobile] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [qrText, setQrText] = useState('');
    const [showQRInput, setShowQRInput] = useState(false);
    const [activePicker, setActivePicker] = useState<'shapes' | 'icons' | 'background' | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleUpdateMasterTemplate = async () => {
        if (!isAdminMode || !adminPin) return;
        const templateId = searchParams.get('template');
        if (!templateId) {
            alert('No template loaded to update');
            return;
        }

        const confirmUpdate = window.confirm('Are you sure you want to overwrite the MASTER template with this design? (Thumbnail will also be updated)');
        if (!confirmUpdate) return;

        setIsSaving(true);
        try {
            const canvas = (window as any).fabricCanvas;
            let thumbnailUrl = undefined;

            if (canvas) {
                // Generate Thumbnail
                const dataUrl = canvas.toDataURL({
                    format: 'png',
                    multiplier: 0.5, // Smaller size for thumbnail
                    quality: 0.8
                });

                // Convert DataURL to File
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], `thumb-${templateId}-${Date.now()}.png`, { type: 'image/png' });

                // Upload Thumbnail
                const formData = new FormData();
                formData.append('images', file);

                const uploadRes = await uploadProductImages(formData);
                if (uploadRes.success && uploadRes.urls && uploadRes.urls.length > 0) {
                    thumbnailUrl = uploadRes.urls[0];
                } else {
                    console.warn('Thumbnail upload failed, proceeding with config update only');
                }
            }

            // Get current canvas JSON
            const canvasJson = JSON.parse(localStorage.getItem('signage_canvas_json') || '{}');

            const result = await updateTemplateConfig(templateId, canvasJson, adminPin, thumbnailUrl, {
                width: design.width,
                height: design.height,
                unit: design.unit
            });

            if (result.success) {
                alert('Master Template & Thumbnail Updated Successfully!');
            } else {
                alert('Failed to update: ' + result.error);
            }
        } catch (e: any) {
            alert('Error updating template: ' + e.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Stabilized registration callbacks to prevent infinite loops
    const registerAddText = useCallback((fn: any) => setAddTextFn(() => fn), []);
    const registerAddIcon = useCallback((fn: any) => setAddIconFn(() => fn), []);
    const registerAddShape = useCallback((fn: any) => setAddShapeFn(() => fn), []);
    const registerAddImage = useCallback((fn: any) => setAddImageFn(() => fn), []);
    const registerToolbarAction = useCallback((fn: any) => setToolbarActionFn(() => fn), []);

    // 1. Initial Load and Synchronization (URL & LocalStorage)
    useEffect(() => {
        const savedDesign = localStorage.getItem('signage_draft_design');
        const savedData = localStorage.getItem('signage_draft_data');

        // URL Parameters (Source of Truth)
        const widthParam = searchParams.get('width');
        const heightParam = searchParams.get('height');
        const unitParam = searchParams.get('unit');
        const productParam = searchParams.get('product');
        const templateId = searchParams.get('template');
        const priceParam = searchParams.get('price');

        async function initializeEditor() {
            // Priority 1: URL Parameters (Manual or Project Start)
            if (widthParam && heightParam && unitParam) {
                setDesign(prev => ({
                    ...prev,
                    width: parseFloat(widthParam),
                    height: parseFloat(heightParam),
                    unit: unitParam as 'in' | 'cm' | 'mm' | 'px'
                }));
                localStorage.removeItem('signage_canvas_json');
            }
            // Priority 2: Restore from LocalStorage (Draft recovery)
            else if (savedDesign && !templateId) {
                try {
                    setDesign(JSON.parse(savedDesign));
                } catch (e) {
                    console.error('Failed to parse saved design', e);
                }
            }

            // Load Template Dimensions if present
            if (templateId) {
                try {
                    const template = await getTemplateById(templateId);
                    if (template && template.dimensions) {
                        setDesign(prev => ({
                            ...prev,
                            templateId: templateId as TemplateId,
                            width: widthParam ? parseFloat(widthParam) : Number(template.dimensions.width),
                            height: heightParam ? parseFloat(heightParam) : Number(template.dimensions.height),
                            unit: (unitParam as any) || (template.dimensions.unit as any) || 'in'
                        }));
                    }
                } catch (error) {
                    console.error('Failed to load template dimensions:', error);
                }
            }

            // Material/Product Sync
            if (productParam) {
                const mat = productParam.toLowerCase();
                const validMaterials: MaterialId[] = ['flex', 'vinyl', 'acp_non_lit', 'acp_lit', 'acrylic_non_lit', 'acrylic_lit', 'neon'];
                if (validMaterials.includes(mat as MaterialId)) {
                    setMaterial(mat as MaterialId);
                }

                // Set Product Name as Company Name fallback
                if (!savedData) {
                    fetch(`/api/products/${productParam}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.product && data.product.name) {
                                setData(prev => ({
                                    ...prev,
                                    companyName: prev.companyName || data.product.name
                                }));
                            }
                        })
                        .catch(err => {
                            const formattedName = productParam
                                .split('-')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                            setData(prev => ({
                                ...prev,
                                companyName: prev.companyName || formattedName
                            }));
                        });
                }
            }

            if (priceParam) {
                setPriceFromUrl(parseFloat(priceParam));
            }

            if (savedData) {
                try {
                    setData(JSON.parse(savedData));
                } catch (e) {
                    console.error('Failed to parse saved data', e);
                }
            }
        }

        initializeEditor();
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

            if (isFS && isMobile && (screen.orientation as any)?.lock) {
                try {
                    await (screen.orientation as any).lock('landscape');
                } catch (err) {
                    console.error('Orientation lock failed:', err);
                }
            } else if (!isFS && (screen.orientation as any)?.unlock) {
                (screen.orientation as any).unlock();
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [isMobile]);

    // Implementation of Back Button as Undo for Mobile
    useEffect(() => {
        if (!isMobile) return;

        // Push a dummy state to history so we can intercept the back button
        window.history.pushState({ noBack: true }, "");

        const handlePopState = (e: PopStateEvent) => {
            // If the user tries to go back, we trigger Undo and push the state again
            if (mobileTab === 'design') {
                toolbarActionFn?.('undo');
                // Re-push state to keep intercepting
                window.history.pushState({ noBack: true }, "");
            } else {
                // If in other tabs like 'material' or 'order', back button should go to 'design' tab
                setMobileTab('design');
                window.history.pushState({ noBack: true }, "");
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isMobile, mobileTab, toolbarActionFn]);

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
        const result = await getReferrerByCode(code);
        setCodeValidated(result.success && result.referrer !== null);
        setIsValidatingCode(false);
    };

    // Warning on leaving page
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isSaving || (localStorage.getItem('signage_draft_design'))) {
                e.preventDefault();
                e.returnValue = ''; // Standard for modern browsers
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isSaving]);

    const handleTemplateSelect = async (id: TemplateId) => {
        // 1. Logic Update: Sync state and URL
        const params = new URLSearchParams(searchParams.toString());
        params.set('template', id);
        // Remove manual overrides to ensure we use template defaults
        params.delete('width');
        params.delete('height');

        router.push(`/design?${params.toString()}`);

        if (isMobile) {
            setMobileTab('design');
        }

        // 2. Immediate State Update for dimensions (no wait for router push if possible)
        try {
            const template = await getTemplateById(id);
            if (template && template.dimensions) {
                setDesign(prev => ({
                    ...prev,
                    width: Number(template.dimensions.width),
                    height: Number(template.dimensions.height),
                    unit: (template.dimensions.unit as 'px' | 'in' | 'cm' | 'mm') || 'in',
                    templateId: id
                }));
            }
        } catch (error) {
            console.error('Error fetching template for direct selection:', error);
        }

        const defaults = TEMPLATE_DEFAULTS[id] || {
            companyName: '',
            address: '',
            additionalText: []
        };

        setData(prev => {
            const currentName = prev.companyName;
            const defaultNames = [
                ...Object.values(TEMPLATE_DEFAULTS).map(d => d.companyName),
                'ABC Company Name',
                'YOUR BRAND',
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

    // URL Template Sync
    useEffect(() => {
        const templateId = searchParams.get('template');
        if (templateId) {
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

    const basePrice = priceFromUrl ?? calculatePrice(material);
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

        setIsDownloading(true);
        try {
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
                const { jsPDF } = await import('jspdf');
                const svg2pdfModule = await import('svg2pdf.js');
                const { getFontBase64 } = await import('@/lib/font-utils');

                // 1. Find all font families used in the canvas
                const objects = canvas.getObjects();
                const fontFamilies = new Set<string>();
                objects.forEach((obj: any) => {
                    if (obj.fontFamily) fontFamilies.add(obj.fontFamily);
                });

                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'in',
                    format: [12, 18]
                });

                // 2. Load and register fonts with error handling
                const registeredFonts = new Set<string>();
                for (const rawFamily of Array.from(fontFamilies)) {
                    const family = rawFamily.replace(/['"]/g, '').trim();
                    try {
                        const regularBase64 = await getFontBase64(family);
                        if (regularBase64) {
                            pdf.addFileToVFS(`${family}.ttf`, regularBase64);
                            pdf.addFont(`${family}.ttf`, family, 'normal');

                            // Check for Bold variant
                            const boldBase64 = await getFontBase64(`${family}-Bold`);
                            if (boldBase64) {
                                pdf.addFileToVFS(`${family}-Bold.ttf`, boldBase64);
                                pdf.addFont(`${family}-Bold.ttf`, family, 'bold');
                            } else {
                                pdf.addFont(`${family}.ttf`, family, 'bold');
                            }

                            // Check for Italic variant
                            const italicBase64 = await getFontBase64(`${family}-Italic`);
                            if (italicBase64) {
                                pdf.addFileToVFS(`${family}-Italic.ttf`, italicBase64);
                                pdf.addFont(`${family}-Italic.ttf`, family, 'italic');
                            } else {
                                pdf.addFont(`${family}.ttf`, family, 'italic');
                            }

                            // Check for Bold-Italic variant
                            const boldItalicBase64 = await getFontBase64(`${family}-BoldItalic`);
                            if (boldItalicBase64) {
                                pdf.addFileToVFS(`${family}-BoldItalic.ttf`, boldItalicBase64);
                                pdf.addFont(`${family}-BoldItalic.ttf`, family, 'bolditalic');
                            } else {
                                // Fallback to bold or italic or regular
                                const fallback = boldBase64 ? `${family}-Bold.ttf` : (italicBase64 ? `${family}-Italic.ttf` : `${family}.ttf`);
                                pdf.addFont(fallback, family, 'bolditalic');
                            }

                            registeredFonts.add(family);
                            console.log(`✓ Embedded: ${family}`);
                        }
                    } catch (fontError) {
                        console.warn(`✗ Could not embed ${family}, using fallback`);
                    }
                }

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

                // Manually replace font-family attributes
                const textElements = svgElement.querySelectorAll('text, tspan');
                textElements.forEach((el: any) => {
                    const fontFamily = el.getAttribute('font-family') || el.style.fontFamily;
                    if (fontFamily) {
                        const cleanFamily = fontFamily.replace(/['"]/g, '').trim();
                        if (registeredFonts.has(cleanFamily)) {
                            el.setAttribute('font-family', cleanFamily);
                        } else {
                            el.setAttribute('font-family', 'Helvetica');
                        }
                    }
                });

                await svg2pdfModule.svg2pdf(svgElement, pdf, {
                    x: 0, y: 0, width: 18, height: 12
                });

                pdf.save(`signage-${Date.now()}.pdf`);
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to generate file. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleOpenReview = () => {
        console.log('=== handleOpenReview called ===');
        console.log('showReviewModal before:', showReviewModal);
        // Step 1: Quality Check (Review Design)
        // Capture a clean snapshot for the review modal
        captureCanvasSnapshot();
        console.log('Setting showReviewModal to true');
        setShowReviewModal(true);
        console.log('showReviewModal after setState:', showReviewModal);
    };

    const captureCanvasSnapshot = () => {
        // @ts-expect-error - fabricCanvas is globally attached to window
        const canvas = window.fabricCanvas;
        console.log('Canvas exists:', !!canvas);

        if (canvas) {
            // Canvas is available - capture from live canvas
            const json = JSON.stringify(canvas.toJSON(['name', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'selectable', 'evented', 'id', 'data']));
            console.log('Canvas JSON captured from live canvas, length:', json.length);
            setCanvasSnapshot(json);
        } else {
            // Canvas not available (e.g., on mobile Order tab) - try localStorage
            console.warn('Canvas not found! Trying localStorage fallback...');
            const storedJson = localStorage.getItem('signage_canvas_json');
            if (storedJson) {
                console.log('Canvas JSON loaded from localStorage, length:', storedJson.length);
                setCanvasSnapshot(storedJson);
            } else {
                console.error('No canvas data found in localStorage either. Modal will show empty preview.');
                setCanvasSnapshot(null);
            }
        }
    };

    // Handle Google Sign In from Auth Modal
    const handleGoogleSignIn = async () => {
        // Explicitly save canvas state to localStorage before redirect
        const canvas = (window as any).fabricCanvas;
        if (canvas) {
            const json = JSON.stringify(canvas.toJSON(['name', 'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation', 'selectable', 'evented', 'id', 'data']));
            localStorage.setItem('signage_canvas_json', json);
        }

        // Save current order state to localStorage before redirecting to Google
        const pendingOrder = {
            data,
            design,
            material,
            contactDetails,
            deliveryType,
            includeInstallation,
            paymentScheme,
            advanceAmount,
            referralCode,
            timestamp: Date.now()
        };
        localStorage.setItem('pending_order', JSON.stringify(pendingOrder));

        // This will redirect to Google OAuth
        await signInWithGoogle();
    };

    // Handle Guest Checkout from Auth Modal
    const handleGuestCheckout = () => {
        // Set auth choice and show contact form
        setAuthChoice('guest');
        setShowAuthModal(false);
        setShowContactForm(true);
    };

    // Post-Auth: Restore pending order and show contact form
    useEffect(() => {
        const pendingOrderStr = localStorage.getItem('pending_order');
        if (pendingOrderStr && user) {
            try {
                const pendingOrder = JSON.parse(pendingOrderStr);

                // Restore all order state
                setData(pendingOrder.data);
                setDesign(pendingOrder.design);
                setMaterial(pendingOrder.material);
                setContactDetails({
                    ...pendingOrder.contactDetails,
                    email: user.email || pendingOrder.contactDetails.email // Pre-fill email from Google
                });
                setDeliveryType(pendingOrder.deliveryType);
                setIncludeInstallation(pendingOrder.includeInstallation);
                setPaymentScheme(pendingOrder.paymentScheme);
                setAdvanceAmount(pendingOrder.advanceAmount);
                if (pendingOrder.referralCode) setReferralCode(pendingOrder.referralCode);

                // Clear pending order
                localStorage.removeItem('pending_order');

                // Set auth choice and show contact form (not review modal)
                setAuthChoice('google');
                setShowContactForm(true);
            } catch (e) {
                console.error('Failed to restore pending order:', e);
                localStorage.removeItem('pending_order');
            }
            setIsProcessing(false);
        }
    }, [user]);

    const handleContactFormSubmit = async () => {
        // Step 4: Final Step - Initiate Payment
        // Don't close modal yet, wait for processing
        await handleCheckout();
    };

    // Check for first-time tour
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenDesignTour');
        if (!hasSeenTour) {
            // Slight delay to ensure layout is ready
            const timer = setTimeout(() => {
                setIsTourOpen(true);
                localStorage.setItem('hasSeenDesignTour', 'true');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleCheckout = async () => {
        console.log('Starting Checkout Process...', contactDetails);
        if (!contactDetails.name || !contactDetails.email || !contactDetails.mobile || !contactDetails.shippingAddress) {
            alert('Please fill in all shipping and contact details before placing the order.');
            // Modal is already open
            return;
        }

        if (paymentScheme === 'part') {
            const minAdvance = Math.ceil(price * 0.25);
            if (advanceAmount < minAdvance) {
                alert(`Minimum advance payment is ₹${minAdvance} (25%)`);
                return;
            }
        }

        setIsProcessing(true);
        try {
            const canvas = (window as any).fabricCanvas;
            let approvalProof = '';

            if (canvas) {
                try {
                    const { jsPDF } = await import('jspdf');
                    const svg2pdfModule = await import('svg2pdf.js');
                    const { getFontBase64 } = await import('@/lib/font-utils');

                    // Find all font families used in the canvas
                    const objects = canvas.getObjects();
                    const fontFamilies = new Set<string>();
                    objects.forEach((obj: any) => {
                        if (obj.fontFamily) fontFamilies.add(obj.fontFamily);
                    });

                    const pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'in',
                        format: [12, 18]
                    });

                    // Load and register fonts with error handling
                    const registeredFonts = new Set<string>();
                    for (const rawFamily of Array.from(fontFamilies)) {
                        const family = rawFamily.replace(/['"]/g, '').trim();
                        try {
                            const regularBase64 = await getFontBase64(family);
                            if (regularBase64) {
                                pdf.addFileToVFS(`${family}.ttf`, regularBase64);
                                pdf.addFont(`${family}.ttf`, family, 'normal');

                                // Check for Bold variant
                                const boldBase64 = await getFontBase64(`${family}-Bold`);
                                if (boldBase64) {
                                    pdf.addFileToVFS(`${family}-Bold.ttf`, boldBase64);
                                    pdf.addFont(`${family}-Bold.ttf`, family, 'bold');
                                } else {
                                    pdf.addFont(`${family}.ttf`, family, 'bold');
                                }

                                // Check for Italic variant
                                const italicBase64 = await getFontBase64(`${family}-Italic`);
                                if (italicBase64) {
                                    pdf.addFileToVFS(`${family}-Italic.ttf`, italicBase64);
                                    pdf.addFont(`${family}-Italic.ttf`, family, 'italic');
                                } else {
                                    pdf.addFont(`${family}.ttf`, family, 'italic');
                                }

                                // Check for Bold-Italic variant
                                const boldItalicBase64 = await getFontBase64(`${family}-BoldItalic`);
                                if (boldItalicBase64) {
                                    pdf.addFileToVFS(`${family}-BoldItalic.ttf`, boldItalicBase64);
                                    pdf.addFont(`${family}-BoldItalic.ttf`, family, 'bolditalic');
                                } else {
                                    const fallback = boldBase64 ? `${family}-Bold.ttf` : (italicBase64 ? `${family}-Italic.ttf` : `${family}.ttf`);
                                    pdf.addFont(fallback, family, 'bolditalic');
                                }

                                registeredFonts.add(family);
                            }
                        } catch (fontError) {
                            console.warn(`Could not embed ${family} in order proof`);
                        }
                    }

                    // Generate high-res SVG for the PDF
                    const svg = canvas.toSVG({
                        suppressPreamble: false,
                        width: 1800,
                        height: 1200,
                        viewBox: { x: 0, y: 0, width: 1800, height: 1200 }
                    });

                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = svg;
                    const svgElement = tempDiv.querySelector('svg');

                    if (svgElement) {
                        // Manually replace font-family attributes in SVG to ensure they match registered names
                        const textElements = svgElement.querySelectorAll('text, tspan');
                        textElements.forEach((el: any) => {
                            const fontFamily = el.getAttribute('font-family') || el.style.fontFamily;
                            if (fontFamily) {
                                const cleanFamily = fontFamily.replace(/['"]/g, '').trim();
                                if (registeredFonts.has(cleanFamily)) {
                                    el.setAttribute('font-family', cleanFamily);
                                } else {
                                    el.setAttribute('font-family', 'Helvetica');
                                }
                            }
                        });

                        await svg2pdfModule.svg2pdf(svgElement, pdf, {
                            x: 0, y: 0, width: 18, height: 12
                        });

                        // Convert PDF to Data URL (base64)
                        approvalProof = pdf.output('datauristring');
                    }
                } catch (pdfErr) {
                    console.error('PDF generation failed, falling back to SVG:', pdfErr);
                    // Fallback to SVG if PDF fails
                    approvalProof = canvas.toSVG({
                        suppressPreamble: false,
                        width: 1800,
                        height: 1200,
                        viewBox: { x: 0, y: 0, width: 1800, height: 1200 }
                    });
                }
            }

            const { success, orderId, error, payableAmount } = await createOrder(data, design, material, {
                deliveryType,
                includeInstallation,
                referralCode: codeValidated ? referralCode : undefined,
                contactDetails,
                paymentScheme,
                advanceAmount: paymentScheme === 'part' ? advanceAmount : undefined,
                approvalProof,
                customBasePrice: priceFromUrl || undefined
            });

            if (!success || !orderId) {
                alert('Failed to create order: ' + error);
                setIsProcessing(false);
                return;
            }

            const paymentResult = await initiatePhonePePayment(orderId, payableAmount || price, contactDetails.mobile);
            console.log('Payment Result:', paymentResult);

            if (paymentResult.success && paymentResult.url) {
                console.log('Redirecting to:', paymentResult.url);
                window.location.href = paymentResult.url;
            } else {
                alert('Payment initiation failed: ' + paymentResult.error);
                setIsProcessing(false);
            }
        } catch (err: any) {
            console.error(err);
            alert('An unexpected error occurred: ' + (err.message || err));
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
                        {/* Savings Status Hidden */}
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
                        {!isProductPath && (
                            <button
                                onClick={() => setMobileTab('material')}
                                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${mobileTab === 'material' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Material
                            </button>
                        )}
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
                                    onObjectSelected={setSelectedObject}
                                    onToolbarAction={registerToolbarAction}
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
                                onClick={() => setMobileTab(isProductPath ? 'order' : 'material')}
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



                                    {/* Payment Scheme */}
                                    <div className="mb-6 border-t pt-4">
                                        <h4 className="font-medium text-gray-900 mb-3">Payment Option</h4>
                                        <div className="flex gap-2 mb-3">
                                            <button
                                                onClick={() => setPaymentScheme('part')}
                                                className={`flex-1 py-2 text-xs font-semibold rounded-md border ${paymentScheme === 'part' ? 'bg-purple-50 border-purple-600 text-purple-700' : 'border-gray-200'}`}
                                            >
                                                Pay Advance (₹{advanceAmount})
                                            </button>
                                            <button
                                                onClick={() => setPaymentScheme('full')}
                                                className={`flex-1 py-2 text-xs font-semibold rounded-md border ${paymentScheme === 'full' ? 'bg-purple-600 text-white' : 'border-gray-200'}`}
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
                                                    Proceed to Review
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

                {/* Review Approval Modal - Mobile */}
                <ReviewApproval
                    data={data}
                    design={design}
                    material={material}
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onEdit={() => {
                        setShowReviewModal(false);
                        setMobileTab('design');
                    }}
                    onApprove={() => {
                        setShowReviewModal(false);
                        if (user) {
                            setAuthChoice('google');
                            setContactDetails(prev => ({
                                ...prev,
                                email: user.email || prev.email
                            }));
                            setShowContactForm(true);
                        } else {
                            setShowAuthModal(true);
                        }
                    }}
                    canvasJSON={canvasSnapshot || undefined}
                />

                {/* Auth Modal - Mobile */}
                {showAuthModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full p-8 transform animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Save Your Design?
                                </h2>
                                <p className="text-slate-400 text-sm">
                                    Choose how you'd like to proceed with your order
                                </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-4 mb-6">
                                {/* Google Sign In */}
                                <button
                                    onClick={handleGoogleSignIn}
                                    className="w-full p-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-left transition-all group border border-indigo-500/50 hover:border-indigo-400 shadow-lg hover:shadow-indigo-500/50"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-base mb-1">
                                                Sign In with Google
                                            </h3>
                                            <p className="text-indigo-200 text-xs leading-relaxed">
                                                Save design to your account for future edits and easy reorders
                                            </p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                                    </div>
                                </button>

                                {/* Guest Checkout */}
                                <button
                                    onClick={handleGuestCheckout}
                                    className="w-full p-5 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all group border border-slate-600 hover:border-slate-500"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <User className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-base mb-1">
                                                Continue as Guest
                                            </h3>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                Complete your order without creating an account
                                            </p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all shrink-0" />
                                    </div>
                                </button>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="w-full py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                )}

                {/* Contact Form Modal - Mobile */}
                {showContactForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full p-8 transform animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-8 h-8  text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Contact & Shipping
                                </h2>
                                <p className="text-slate-400 text-sm">
                                    {authChoice === 'google' ? 'Almost there! Just confirm your details' : 'Please provide your delivery information'}
                                </p>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={contactDetails.name}
                                        onChange={(e) => setContactDetails({ ...contactDetails, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={contactDetails.email}
                                        onChange={(e) => setContactDetails({ ...contactDetails, email: e.target.value })}
                                        placeholder="john@example.com"
                                        disabled={authChoice === 'google' && !!user?.email}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    {authChoice === 'google' && !!user?.email && (
                                        <p className="text-xs text-slate-500 mt-1">✓ Pre-filled from your Google account</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={contactDetails.mobile}
                                        onChange={(e) => setContactDetails({ ...contactDetails, mobile: e.target.value })}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Address</label>
                                    <textarea
                                        value={contactDetails.shippingAddress}
                                        onChange={(e) => setContactDetails({ ...contactDetails, shippingAddress: e.target.value })}
                                        placeholder="123 Main Street, Apt 4B, City, State, ZIP"
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={handleContactFormSubmit}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Confirm & Proceed to Payment
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowContactForm(false)}
                                    className="w-full py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* WhatsApp Button - Mobile */}
                <WhatsAppButton
                    variant="floating"
                    message="Hi! I'm on the design page and need help with my signage. Can you assist?"
                />
            </div>
        );
    }

    const sidebarWidth = activeSidebarTab ? 352 : 72;
    const rightPanelWidth = 340;
    const toolbarOffset = (sidebarWidth - rightPanelWidth) / 2;

    // Standard Desktop Layout
    return (
        <div className="h-screen bg-gray-50 font-sans overflow-hidden flex flex-col">
            {/* 3-Column Header / Relocated Toolbar */}
            <div id="tutorial-header" className={`bg-white border-b border-gray-200 flex items-center px-6 shrink-0 z-40 transition-all duration-300 ${selectedObject ? 'h-24 py-2' : 'h-12'}`}>

                {/* 1. Left Pillar: Logo & Title (Matched to Sidebar Width) */}
                <div className="flex items-center shrink-0 transition-all duration-300 overflow-hidden" style={{ width: sidebarWidth - 24 }}>
                    <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                        <div className="flex items-center justify-center text-indigo-600 group-hover:text-indigo-500 transition-colors">
                            <Sparkles className="w-6 h-6 fill-current" />
                        </div>
                        {!selectedObject && (
                            <span className="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap" style={{ fontFamily: '"Playfair Display", serif' }}>
                                SignagePro
                            </span>
                        )}
                    </Link>
                </div>

                {/* 2. Center Pillar: Formatting Toolbar (Centered to Canvas) */}
                <div className="flex-1 flex justify-center min-w-0">
                    {selectedObject && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                            <TextFormatToolbar
                                selectedObject={selectedObject}
                                onUpdate={() => { (window as any).fabricCanvas?.requestRenderAll(); }}
                                onAction={(action) => toolbarActionFn?.(action)}
                                onDuplicate={() => toolbarActionFn?.('duplicate')}
                                onDelete={() => toolbarActionFn?.('delete')}
                                onLockToggle={() => toolbarActionFn?.('lock')}
                            />
                        </div>
                    )}
                </div>

                {/* 3. Right Pillar: Status & User (Matched to Right Panel Width) */}
                <div className="flex items-center justify-end gap-3 shrink-0 transition-all duration-300" style={{ width: rightPanelWidth - 24 }}>
                    {!isMobile && (
                        <div className="flex items-center gap-3 mr-2">
                            {isAdminMode && (
                                <button
                                    onClick={handleUpdateMasterTemplate}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-[10px] font-bold transition-colors shadow-sm animate-pulse"
                                    title="Overwrite global master template with current design"
                                >
                                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    <span className="hidden xl:inline tracking-tighter">UPDATE MASTER</span>
                                </button>
                            )}
                            {/* Savings Status Hidden */}

                        </div>
                    )}

                    <ShareMenu
                        isDownloading={isDownloading}
                        onDownload={handleDownload}
                        onWhatsApp={() => {
                            const message = "Hi! I'm on the design page and need help with my signage. Can you assist?";
                            window.open(`https://wa.me/919876543210?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                    />

                    <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                    {/* User Verification Indicator */}
                    {user ? (
                        <div className="flex items-center gap-2 shrink-0" title={`Logged in as ${user.email}`}>
                            {user.user_metadata?.avatar_url ? (
                                <img
                                    src={user.user_metadata.avatar_url}
                                    alt="User"
                                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                                />
                            ) : (
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 text-xs">
                                    {user.email?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400 shrink-0" title="Guest Mode">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4" />
                            </div>
                        </div>
                    )}
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
                        onTabChange={setActiveSidebarTab}
                    />
                </div>

                {/* 2. Main Canvas Area (Center) */}
                <div className="flex-1 bg-gray-200/50 relative overflow-hidden flex flex-col min-h-0 z-30">
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
                            onObjectSelected={setSelectedObject}
                            onToolbarAction={registerToolbarAction}
                        />
                    </div>
                </div>

                {/* 3. Properties & Checkout Panel (Right) */}
                <div id="tutorial-right-panel" className="w-[340px] bg-slate-900 border-l border-slate-800 h-full overflow-y-auto shrink-0 z-10 custom-scrollbar flex flex-col">
                    <div className="p-0 flex-1">
                        {/* Header */}
                        <div className="h-14 px-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                Configuration
                            </h3>
                            <button
                                id="tutorial-help-button"
                                onClick={() => setIsTourOpen(true)}
                                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                            >
                                Need Help?
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Design Info Section - Always Visible */}
                            <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-5 space-y-4">
                                <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
                                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Design Info</h3>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400 font-medium">Dimensions</span>
                                        <span className="text-sm font-bold text-white">{design.width}" × {design.height}" {design.unit}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-400 font-medium">Material</span>
                                        <span className="text-sm font-bold text-indigo-300 capitalize">{material}</span>
                                    </div>
                                    {isProductPath && (
                                        <div className="pt-2">
                                            <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded">Selected via Product</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Design Tools (Always Visible) */}
                            <div className="space-y-6 pt-2">
                                {/* Background & Export Row */}
                                <div className="grid grid-cols-1 gap-6 pt-2">
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
                                            disabled={isDownloading}
                                            variant="outline"
                                            className={`flex-1 gap-2 h-9 text-xs border-slate-700 bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-indigo-400 hover:border-indigo-500 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isDownloading ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Download className="w-3.5 h-3.5" />
                                            )}
                                            {isDownloading ? '...' : 'SVG'}
                                        </Button>
                                        <Button
                                            onClick={() => handleDownload('pdf')}
                                            disabled={isDownloading}
                                            variant="outline"
                                            className={`flex-1 gap-2 h-9 text-xs border-slate-700 bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-red-400 hover:border-red-500 ${isDownloading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isDownloading ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Download className="w-3.5 h-3.5" />
                                            )}
                                            {isDownloading ? '...' : 'PDF'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Order Prep Flow - Installation & Payment (REQUIRED ALWAYS VISIBLE) */}
                                <div className="space-y-6 pt-6 border-t border-slate-800">
                                    {/* Delivery Speed */}
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-white block">Delivery Speed</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setDeliveryType('standard')}
                                                className={`relative px-3 py-2.5 rounded-lg border text-left transition-all flex items-center gap-3 ${deliveryType === 'standard' ? 'border-indigo-500 bg-indigo-900/30' : 'border-transparent bg-slate-800 hover:bg-slate-700'}`}
                                            >
                                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${deliveryType === 'standard' ? 'border-indigo-500' : 'border-slate-500'}`}>
                                                    {deliveryType === 'standard' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs text-white">Standard</p>
                                                    <p className="text-[9px] text-gray-400">Free</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => setDeliveryType('fast')}
                                                className={`relative px-3 py-2.5 rounded-lg border text-left transition-all flex items-center gap-3 ${deliveryType === 'fast' ? 'border-indigo-500 bg-indigo-900/30' : 'border-transparent bg-slate-800 hover:bg-slate-700'}`}
                                            >
                                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${deliveryType === 'fast' ? 'border-indigo-500' : 'border-slate-500'}`}>
                                                    {deliveryType === 'fast' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs text-white">Fast</p>
                                                    <p className="text-[9px] text-gray-400">+₹{FAST_DELIVERY_COST}</p>
                                                </div>
                                            </button>
                                        </div>
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

                                    {/* Payment Section */}
                                    <div className="space-y-4">
                                        {/* Price Summary (Moved Up) */}
                                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400">Subtotal</span>
                                                <span className="text-white font-medium">₹{basePrice - discount}</span>
                                            </div>
                                            {(deliveryCost > 0 || includeInstallation) && (
                                                <div className="space-y-1 pt-2 border-t border-slate-700/50">
                                                    {deliveryCost > 0 && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-400">Delivery</span>
                                                            <span className="text-gray-300">+₹{deliveryCost}</span>
                                                        </div>
                                                    )}
                                                    {includeInstallation && (
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-400">Installation</span>
                                                            <span className="text-gray-300">+₹{INSTALLATION_COST}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                                <span className="text-sm font-bold text-white">Total Amount</span>
                                                <span className="text-lg font-bold text-indigo-400">₹{price}</span>
                                            </div>
                                        </div>

                                        <label className="text-sm font-bold text-white block">Payment Scheme</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setPaymentScheme('part')}
                                                className={`relative px-3 py-2.5 rounded-lg border text-left transition-all flex items-center gap-3 ${paymentScheme === 'part' ? 'border-indigo-500 bg-indigo-900/30 shadow-sm' : 'border-transparent bg-slate-800 hover:bg-slate-700'}`}
                                            >
                                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${paymentScheme === 'part' ? 'border-indigo-500' : 'border-slate-500'}`}>
                                                    {paymentScheme === 'part' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs text-white">Part Pay</p>
                                                    <p className="text-[9px] text-gray-400 leading-tight">25% Advance</p>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => setPaymentScheme('full')}
                                                className={`relative px-3 py-2.5 rounded-lg border text-left transition-all flex items-center gap-3 ${paymentScheme === 'full' ? 'border-indigo-500 bg-indigo-900/30 shadow-sm' : 'border-transparent bg-slate-800 hover:bg-slate-700'}`}
                                            >
                                                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${paymentScheme === 'full' ? 'border-indigo-500' : 'border-slate-500'}`}>
                                                    {paymentScheme === 'full' && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs text-white">Full Pay</p>
                                                    <p className="text-[9px] text-gray-400 leading-tight">100% Upfront</p>
                                                </div>
                                            </button>
                                        </div>

                                        {paymentScheme === 'part' && (
                                            <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg animate-in slide-in-from-top-2">
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-xs font-semibold text-gray-300">Advance Amount</label>
                                                    <span className="text-[10px] text-indigo-400 font-medium">Min: ₹{Math.ceil(price * 0.25)}</span>
                                                </div>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2 text-white font-semibold">₹</span>
                                                    <input
                                                        type="number"
                                                        value={advanceAmount}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            if (isNaN(val)) {
                                                                setAdvanceAmount(0);
                                                            } else {
                                                                setAdvanceAmount(Math.min(val, price));
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            const minAmt = Math.ceil(price * 0.25);
                                                            if (advanceAmount < minAmt) setAdvanceAmount(minAmt);
                                                        }}
                                                        min={Math.ceil(price * 0.25)}
                                                        max={price}
                                                        className="w-full pl-6 pr-3 py-1.5 text-sm font-bold text-white bg-slate-700 border border-slate-600 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Final Step Reveal - Always Visible Now */}
                                {!isProductPath && (
                                    <div className="pt-8 border-t border-slate-800">
                                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                            {/* Material Select - Hidden if Product Path */}
                                            <div className="space-y-3">
                                                <label className="text-sm font-bold text-white block">Material selection</label>
                                                <MaterialSelector
                                                    selectedMaterial={material}
                                                    onSelect={setMaterial}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer / Checkout - Always visible */}
                            <div className="p-5 border-t border-slate-800 bg-slate-900/80 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.4)] z-20">
                                {/* Referral Code */}
                                {isReferralEnabled && (
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
                                )}

                                <button
                                    onClick={handleOpenReview}
                                    disabled={isProcessing}
                                    className="w-full group bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
                                >
                                    {isProcessing ? 'Processing...' : 'Proceed to Review'}
                                    {!isProcessing && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auth Modal - Choose between Sign In or Guest Checkout */}
            {
                showAuthModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full p-8 transform animate-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Save Your Design?
                                </h2>
                                <p className="text-slate-400 text-sm">
                                    Choose how you'd like to proceed with your order
                                </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-4 mb-6">
                                {/* Google Sign In */}
                                <button
                                    onClick={handleGoogleSignIn}
                                    className="w-full p-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-left transition-all group border border-indigo-500/50 hover:border-indigo-400 shadow-lg hover:shadow-indigo-500/50"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-base mb-1">
                                                Sign In with Google
                                            </h3>
                                            <p className="text-indigo-200 text-xs leading-relaxed">
                                                Save design to your account for future edits and easy reorders
                                            </p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                                    </div>
                                </button>

                                {/* Guest Checkout */}
                                <button
                                    onClick={handleGuestCheckout}
                                    className="w-full p-5 bg-slate-800 hover:bg-slate-700 rounded-xl text-left transition-all group border border-slate-600 hover:border-slate-500"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                            <User className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-base mb-1">
                                                Continue as Guest
                                            </h3>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                Complete your order without creating an account
                                            </p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-1 transition-all shrink-0" />
                                    </div>
                                </button>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setShowAuthModal(false)}
                                className="w-full py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Contact Form Modal - Shown after auth choice */}
            {
                showContactForm && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full p-8 transform animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                            {/* Header */}
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-8 h-8  text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Contact & Shipping
                                </h2>
                                <p className="text-slate-400 text-sm">
                                    {authChoice === 'google' ? 'Almost there! Just confirm your details' : 'Please provide your delivery information'}
                                </p>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        value={contactDetails.name}
                                        onChange={(e) => setContactDetails({ ...contactDetails, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={contactDetails.email}
                                        onChange={(e) => setContactDetails({ ...contactDetails, email: e.target.value })}
                                        placeholder="john@example.com"
                                        disabled={authChoice === 'google' && !!user?.email}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    {authChoice === 'google' && !!user?.email && (
                                        <p className="text-xs text-slate-500 mt-1">✓ Pre-filled from your Google account</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={contactDetails.mobile}
                                        onChange={(e) => setContactDetails({ ...contactDetails, mobile: e.target.value })}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Shipping Address</label>
                                    <textarea
                                        value={contactDetails.shippingAddress}
                                        onChange={(e) => setContactDetails({ ...contactDetails, shippingAddress: e.target.value })}
                                        placeholder="123 Main Street, Apt 4B, City, State, ZIP"
                                        rows={3}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={handleContactFormSubmit}
                                    disabled={isProcessing}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Confirm & Proceed to Payment
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowContactForm(false)}
                                    className="w-full py-3 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                >
                                    Go Back
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <ReviewApproval
                data={data}
                design={design}
                material={material}
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onEdit={() => setShowReviewModal(false)}
                onApprove={() => {
                    setShowReviewModal(false);
                    if (user) {
                        setAuthChoice('google');
                        setContactDetails(prev => ({
                            ...prev,
                            email: user.email || prev.email
                        }));
                        setShowContactForm(true);
                    } else {
                        setShowAuthModal(true);
                    }
                }}
                canvasJSON={canvasSnapshot || undefined}
            />

            <WhatsAppButton
                variant="floating"
                message="Hi! I&apos;m on the design page and need help with my signage. Can you assist?"
            />
            <OnboardingTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
        </div >
    );
}
