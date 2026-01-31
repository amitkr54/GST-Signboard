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
import { calculateDynamicPrice, MaterialId, cn } from '@/lib/utils';
import { createOrder, processPayment, trackReferral, initiatePhonePePayment, syncDesign, generateQRCode, getReferrerByCode, getTemplates, updateTemplateConfig, uploadThumbnail } from '@/app/actions';
import { MaterialProvider, useMaterials } from '@/context/MaterialContext';
import { ArrowRight, Truck, Wrench, ChevronLeft, Undo2, Redo2, Type, Image as ImageIcon, Square, QrCode, X, Loader2, Check, Maximize, Minimize, Phone, Mail, MapPin, Globe, Star, Heart, Clock, Calendar, User, Building, Palette, Grid3X3, Download, Plus, Circle, Triangle, Minus, Sparkles, ShieldCheck } from 'lucide-react';
import { PreviewSection } from '@/components/PreviewSection';
import { FontWarning } from '@/components/FontWarning';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { PRODUCTS } from '@/lib/products';
import { useAuth } from '@/components/AuthProvider';
import { CheckoutDetailsModal } from '@/components/CheckoutDetailsModal';
import { DesignHeader } from './components/DesignHeader';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { MobileToolbar } from './components/MobileToolbar';
import { MobileDrawer } from './components/MobileDrawer';
import { MobileHeader } from './components/MobileHeader';
import { getFontBase64, SUPPORTED_FONTS } from '@/lib/font-utils';
import { SignageForm } from '@/components/SignageForm';

// New modular hooks
import { useDesignState } from './hooks/useDesignState';
import { useDesignExport } from './hooks/useDesignExport';

const MOBILE_SHAPES = [
    { id: 'rect', icon: Square, label: 'Square' },
    { id: 'circle', icon: Circle, label: 'Circle' },
    { id: 'triangle', icon: Triangle, label: 'Triangle' },
    { id: 'line', icon: Minus, label: 'Line' },
];

const PRESET_COLORS = [
    '#ffffff', '#000000', '#f8fafc', '#f1f5f9', '#e2e8f0',
    '#6366f1', '#4f46e5', '#3730a3', '#1e1b4b',
    '#ef4444', '#dc2626', '#b91c1c', '#f97316', '#ea580c',
    '#eab308', '#ca8a04', '#22c55e', '#16a34a', '#065f46',
    '#06b6d4', '#0891b2', '#3b82f6', '#2563eb', '#1d4ed8',
    '#8b5cf6', '#7c3aed', '#6d28d9', '#d946ef', '#c026d3',
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
    // Use the new modular hooks
    const designState = useDesignState();
    const { handleDownload: handleExport, getExportDimensions } = useDesignExport(designState.design);

    // Local UI state
    const [isMounted, setIsMounted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [uploadedDesign, setUploadedDesign] = useState<string | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const { materials, loading: materialsLoading, getMaterial } = useMaterials();

    // Checkout state
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

    // Canvas action registration
    const [addTextFn, setAddTextFn] = useState<((type: 'heading' | 'subheading' | 'body', options?: { name?: string; text?: string }) => void) | null>(null);
    const [addIconFn, setAddIconFn] = useState<((iconName: string) => void) | null>(null);
    const [addShapeFn, setAddShapeFn] = useState<((type: 'rect' | 'circle' | 'line' | 'triangle') => void) | null>(null);
    const [addImageFn, setAddImageFn] = useState<((imageUrl: string) => void) | null>(null);
    const [addShapeSVGFn, setAddShapeSVGFn] = useState<((url: string) => void) | null>(null);

    // Mobile UI state
    const [mobileTab, setMobileTab] = useState<'design' | 'order'>('design');
    const [activeDrawer, setActiveDrawer] = useState<'font' | 'text-color' | 'profile' | 'bg-color' | 'templates' | null>(null);
    const [textLayers, setTextLayers] = useState<{ id: string, text: string }[]>([]);
    const [activePicker, setActivePicker] = useState<'shapes' | 'icons' | 'background' | null>(null);
    const [showQRInput, setShowQRInput] = useState(false);
    const [qrText, setQrText] = useState('');
    const [reviewCanvasJSON, setReviewCanvasJSON] = useState<any>(null);
    const [selectedObject, setSelectedObject] = useState<any>(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);
    const [dynamicMissingFonts, setDynamicMissingFonts] = useState<string[]>([]);

    // Device detection
    const [isMobile, setIsMobile] = useState(false);
    const [isLandscape, setIsLandscape] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
    const onHistoryActionRef = useRef<((action: 'undo' | 'redo') => void) | null>(null);

    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const isAdmin = searchParams.get('mode') === 'admin';

    const registerAddText = useCallback((fn: any) => setAddTextFn(() => fn), []);
    const registerAddIcon = useCallback((fn: any) => setAddIconFn(() => fn), []);
    const registerAddShape = useCallback((fn: any) => setAddShapeFn(() => fn), []);
    const registerAddShapeSVG = useCallback((fn: any) => setAddShapeSVGFn(() => fn), []);
    const registerAddImage = useCallback((fn: any) => setAddImageFn(() => fn), []);

    const handleUndo = () => onHistoryActionRef.current?.('undo');
    const handleRedo = () => onHistoryActionRef.current?.('redo');

    const handleUpdateObject = useCallback((props: any) => {
        const canvas = (window as any).fabricCanvas;
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (active) {
            // FIX: If we are mapping a template field, preserve the existing text by forcing an update to state
            if (props.name && props.name.startsWith('template_')) {
                const key = props.name.replace('template_', '');
                let textToPreserve = '';

                // Extract text from object
                if (active.type.includes('text')) {
                    textToPreserve = (active as any).text;
                }

                // If we found text, sync it to the corresponding data field locally
                if (textToPreserve) {
                    const newData = { ...designState.data };
                    // Map key to data field
                    if (key === 'company' || key === 'companyName') newData.companyName = textToPreserve;
                    else if (key === 'address' || key === 'details') newData.address = textToPreserve;
                    else if (key === 'mobile') newData.mobile = textToPreserve;
                    else if (key === 'email') newData.email = textToPreserve;
                    else if (key === 'website') newData.website = textToPreserve;
                    else if (key === 'gstin') newData.gstin = textToPreserve;
                    else if (key === 'cin') newData.cin = textToPreserve;
                    else {
                        // custom fields support
                        if (!newData.customFields) newData.customFields = {};
                        newData.customFields[key] = textToPreserve;
                    }

                    // Update state silently so that useCanvasTemplates sees the NEW data when it re-renders
                    designState.setData(newData);
                }
            }

            if (props.name && props.name.startsWith('template_')) {
                // Persist as custom property for robustness
                props.templateKey = props.name;
            }

            if (active.type === 'activeSelection' || active.type === 'group') {
                (active as any).getObjects().forEach((obj: any) => {
                    obj.set(props);
                });
            }
            active.set(props);

            // CRITICAL FIX: Refresh textbox rendering when mapping to avoid layout issues
            if (props.name && props.name.startsWith('template_') && active.type === 'textbox') {
                // Force textbox to recalculate text wrapping/dimensions
                (active as any).initDimensions?.();
                active.setCoords();
            }

            active.setCoords();
            console.log('DEBUG: Firing object:modified for', props); // DEBUG LOG
            canvas.fire('object:modified', { target: active });
            canvas.requestRenderAll();


            // Forces a re-sync after a short delay to ensure prop persistence
            setTimeout(() => {
                console.log('DEBUG: Forced re-sync check');
                canvas.fire('object:modified', { target: active });

                // CRITICAL: Manually scan canvas for mapped keys since syncLayers might not catch it
                const objects = canvas.getObjects();
                const actualObjects = objects.filter((obj: any) =>
                    !obj.name?.startsWith('__') && obj.selectable !== false
                );

                console.log('[SMART MAPPING] Manual scan - Processing objects:', actualObjects.map((o: any) => ({
                    type: o.type,
                    name: o.name,
                    templateKey: o.templateKey
                })));

                const usedKeys = actualObjects
                    .map((obj: any) => obj.name || obj.templateKey)
                    .filter((name: string) => name && name.startsWith('template_'));

                if (usedKeys.length > 0) {
                    console.log('[SMART MAPPING] Manual scan - Found keys:', usedKeys);
                    setUsedTemplateKeys(Array.from(new Set(usedKeys)));
                }
            }, 100);

            // Re-sync template data immediately so user sees the result of mapping
            designState.setDesign({ ...designState.design });
            // Trigger a re-selection to update the UI
            setSelectedObject({ ...active.toObject(['name', 'templateKey', 'id', 'selectable', 'evented', 'editable']), __fabricObj: active });
        }
    }, [designState]);

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

    const [usedTemplateKeys, setUsedTemplateKeys] = useState<string[]>([]);

    // Sync text layers & used keys from canvas
    useEffect(() => {
        const getLabel = (name: string, text: string) => {
            if (!name) return 'Custom Text';
            const mapping: Record<string, string> = {
                companyName: 'Company Name',
                address: 'Address',
                mobile: 'Phone',
                email: 'Email',
                website: 'Website',
                gstin: 'GSTIN',
                cin: 'CIN',
                template_company: 'Company Name',
                template_address: 'Address',
                template_mobile: 'Phone',
                template_email: 'Email',
                template_website: 'Website',
                template_tagline: 'Tagline',
                template_message: 'Message',
                template_hours: 'Hours',
                template_jobTitle: 'Job Title'
            };
            return mapping[name] || name.replace('template_', '').replace(/([A-Z])/g, ' $1').trim();
        };

        const syncLayers = () => {
            const canvas = (window as any).fabricCanvas;
            if (canvas) {
                const objects = canvas.getObjects();

                // 1. Sync Text Layers for Mobile Drawer
                // DEBUG: Log all object names to see what's actually on the canvas
                const allObjects = objects.map((o: any) => ({ type: o.type, name: o.name }));
                console.log('DEBUG: All canvas objects:', JSON.stringify(allObjects));

                const layers = objects
                    .filter((obj: any) => (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox') && !obj.name?.startsWith('__'))
                    .map((obj: any) => ({
                        id: obj.id || Math.random().toString(36).substring(2, 9),
                        text: obj.text || '',
                        label: getLabel(obj.name, obj.text),
                        font: obj.fontFamily,
                        size: obj.fontSize,
                        color: obj.fill
                    }));
                setTextLayers(layers);

                // 2. Sync Used Template Keys for Admin Config
                // Filter out guide objects and get all actual canvas objects
                const actualObjects = objects.filter((obj: any) =>
                    !obj.name?.startsWith('__') && // Not a guide
                    obj.selectable !== false // Is selectable
                );

                // Log what we're actually processing
                if (actualObjects.length > 0) {
                    console.log('[SMART MAPPING] Processing objects:', actualObjects.map((o: any) => ({
                        type: o.type,
                        name: o.name,
                        templateKey: o.templateKey
                    })));
                }

                const usedKeys = (actualObjects
                    .map((obj: any) => obj.name || obj.templateKey)
                    .filter((name: string) => name && name.startsWith('template_'))) as string[];

                const usedKeysSet = Array.from(new Set(usedKeys));
                setUsedTemplateKeys(usedKeysSet);

                // 3. Cleanup Unused Mappings
                // If a key exists in data.customFields but is not present on canvas, remove it
                const currentUsedKeyBases = new Set(usedKeysSet.map(k => k.replace('template_', '')));
                designState.setData((prev: any) => {
                    const currentCustomFields = prev.customFields || {};
                    const currentCustomKeys = Object.keys(currentCustomFields);
                    const unusedKeys = currentCustomKeys.filter(k =>
                        !currentUsedKeyBases.has(k) &&
                        !k.startsWith('additional_') // Don't clean up additional text lines here
                    );

                    // Standard fields cleanup map
                    const standardToDataKey: Record<string, string> = {
                        template_company: 'companyName',
                        template_address: 'address',
                        template_gstin: 'gstin',
                        template_cin: 'cin',
                        template_mobile: 'mobile',
                        template_email: 'email',
                        template_website: 'website',
                        template_logo: 'logoUrl'
                    };

                    let hasStandardCleanup = false;
                    const cleanedStandard: any = {};
                    Object.entries(standardToDataKey).forEach(([tKey, dKey]) => {
                        if (!usedKeysSet.includes(tKey) && prev[dKey]) {
                            cleanedStandard[dKey] = '';
                            hasStandardCleanup = true;
                        }
                    });

                    if (unusedKeys.length > 0 || hasStandardCleanup) {
                        console.log('[SMART MAPPING] Cleaning up unused fields:', { unusedKeys, hasStandardCleanup });
                        const newCustomFields = { ...currentCustomFields };
                        unusedKeys.forEach(k => delete newCustomFields[k]);
                        return { ...prev, ...cleanedStandard, customFields: newCustomFields };
                    }
                    return prev;
                });

                return layers.length > 0;
            }
            return false;
        };

        const canvas = (window as any).fabricCanvas;
        if (canvas) {
            canvas.on('object:added', syncLayers);
            canvas.on('object:removed', syncLayers);
            canvas.on('text:changed', syncLayers);
            canvas.on('object:modified', syncLayers);
            // Ensure we sync on selection changes too, just in case
            canvas.on('selection:created', syncLayers);
            canvas.on('selection:updated', syncLayers);
            canvas.on('selection:cleared', syncLayers);

            // Try syncing a few times with delay in case objects are still loading
            syncLayers();
            const timer1 = setTimeout(syncLayers, 500);
            const timer2 = setTimeout(syncLayers, 1500);

            return () => {
                canvas.off('object:added', syncLayers);
                canvas.off('object:removed', syncLayers);
                canvas.off('text:changed', syncLayers);
                canvas.off('object:modified', syncLayers);
                canvas.off('selection:created', syncLayers);
                canvas.off('selection:updated', syncLayers);
                canvas.off('selection:cleared', syncLayers);
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        } else {
            // If canvas not ready, retry in 1s
            const timer = setTimeout(syncLayers, 1000);
            return () => clearTimeout(timer);
        }
    }, [isMounted, activeDrawer]);

    // Fix for background leakage in mobile landscape
    useEffect(() => {
        if (isMobile) {
            const originalBackground = document.body.style.background;
            const originalMinHeight = document.body.style.minHeight;

            document.body.style.background = '#f9fafb';
            document.body.style.minHeight = '100dvh';

            return () => {
                document.body.style.background = originalBackground;
                document.body.style.minHeight = originalMinHeight;
            };
        }
    }, [isMobile]);

    // Auto-populate contact details from user
    useEffect(() => {
        if (user) {
            setContactDetails(prev => ({
                ...prev,
                name: prev.name || user.user_metadata?.full_name || '',
                email: prev.email || user.email || '',
            }));
        }
    }, [user]);

    // Restore contact details from draft
    useEffect(() => {
        const pendingDraft = localStorage.getItem('design_draft_pending');
        if (pendingDraft) {
            try {
                const draft = JSON.parse(pendingDraft);
                if (Date.now() - draft.timestamp < 30 * 60 * 1000) {
                    if (draft.contactDetails) setContactDetails(draft.contactDetails);
                    if (draft.action === 'continue_checkout') {
                        setShowCheckoutModal(true);
                    }
                }
            } catch (e) {
                console.error('Failed to parse draft', e);
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
    const MINIMUM_ORDER_PRICE = 100;

    const initialPriceParam = searchParams.get('price');
    const initialPrice = initialPriceParam ? parseInt(initialPriceParam) : 0;


    const currentMaterial = getMaterial(designState.material);
    const calculatedBasePrice = currentMaterial ? calculateDynamicPrice(designState.design.width, designState.design.height, designState.design.unit as any, currentMaterial.price_per_sqin) : Math.max(initialPrice, MINIMUM_ORDER_PRICE);
    const discount = (designState.codeValidated && designState.referralCode) ? REFERRAL_DISCOUNT : 0;
    const deliveryCost = deliveryType === 'fast' ? FAST_DELIVERY_COST : 0;
    const installationCost = includeInstallation ? INSTALLATION_COST : 0;
    const price = Math.max(MINIMUM_ORDER_PRICE, calculatedBasePrice - discount + deliveryCost + installationCost);
    const isPriceLoading = Boolean((materialsLoading && (materials?.length || 0) === 0) || (designState.material && !currentMaterial && materialsLoading));

    useEffect(() => {
        const minAdvance = Math.ceil(price * 0.25);
        if (advanceAmount < minAdvance) {
            setAdvanceAmount(minAdvance);
        }
    }, [price, advanceAmount]);

    useEffect(() => { if (paymentScheme === 'part') setAdvanceAmount(Math.ceil(price * 0.25)); }, [price, paymentScheme]);


    // Use handleExport from the hook instead
    const handleDownload = (format: 'svg' | 'pdf') => {
        handleExport(format, setIsDownloading);
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

            const res = await createOrder(designState.data, designState.design, designState.material, { deliveryType, includeInstallation, referralCode: designState.codeValidated ? designState.referralCode : undefined, contactDetails, paymentScheme, advanceAmount: paymentScheme === 'part' ? advanceAmount : undefined, approvalProof });
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
        if (!designState.design.templateId) {
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

            const thumbRes = await uploadThumbnail(thumbnailDataUrl, designState.design.templateId);

            // 2. Save Config
            const fabricConfig = canvas.toJSON([
                'name', 'id', 'isBackground', 'ignoreSafety',
                'lockMovementX', 'lockMovementY', 'lockScalingX', 'lockScalingY', 'lockRotation',
                'selectable', 'evented', 'editable',
                'hasControls', 'hoverCursor', 'moveCursor'
            ]);

            // Add metadata about used mapping keys so they are recognized as "valid" for this template
            fabricConfig.metadata = {
                usedTemplateKeys: usedTemplateKeys
            };
            const canvasWidth = canvas.width || 1800;
            const canvasHeight = canvas.height || 900;

            const res = await updateTemplateConfig(
                designState.design.templateId,
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
            <div className="fixed inset-0 bg-[#0a0f1d] font-sans flex flex-col overflow-hidden z-[40]">
                <MobileHeader
                    title={designState.product?.name}
                    onMenuClick={() => { }}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyState.canUndo}
                    canRedo={historyState.canRedo}
                    showHistoryControls={mobileTab === 'design'}
                />

                <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col bg-[#f1f5f9]">

                    {/* Design Tab */}
                    <div className={`flex-1 min-h-0 flex flex-col relative overflow-hidden ${mobileTab === 'design' ? '' : 'hidden'}`}>
                        <div className="flex-1 w-full flex flex-col p-4 md:h-auto items-center justify-center">
                            <PreviewSection
                                uploadedDesign={uploadedDesign}
                                data={designState.data}
                                design={designState.design}
                                material={designState.material}
                                isLandscape={isLandscape}
                                compact={true}
                                onDesignChange={designState.setDesign}
                                onAddText={registerAddText}
                                onAddIcon={registerAddIcon}
                                onAddShape={registerAddShape}
                                onAddImage={registerAddImage}
                                onDataChange={designState.mergeData}
                                onHistoryStateChange={setHistoryState}
                                onHistoryAction={(fn) => onHistoryActionRef.current = fn}
                                onFontWarningChange={setDynamicMissingFonts}
                                initialJSON={designState.initialDesignJSON}
                                isAdmin={isAdmin}
                            />
                        </div>
                    </div>

                    {/* Configuration & Summary Tab */}
                    <div className={cn(
                        "w-full h-full pb-32 px-4 py-4 overflow-y-auto custom-scrollbar transition-all bg-[#0a0f1d]",
                        mobileTab === 'order' ? "block" : "hidden"
                    )}>
                        <div className="max-w-md mx-auto space-y-6">
                            {!designState.isFixedProduct && (
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-white/50 block px-1">Choose Material</label>
                                    <MaterialSelector selectedMaterial={designState.material} onSelect={designState.setMaterial} dimensions={{ width: designState.design.width, height: designState.design.height, unit: designState.design.unit }} />
                                </div>
                            )}

                            {/* Delivery Options */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-white/50 block px-1">Delivery Speed</label>
                                <div className="grid grid-cols-1 gap-3">
                                    <button onClick={() => setDeliveryType('standard')} className={`p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${deliveryType === 'standard' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}>
                                        <div className="flex items-center gap-3">
                                            <Truck className={`w-5 h-5 ${deliveryType === 'standard' ? 'text-indigo-400' : 'text-white/30'}`} />
                                            <div>
                                                <p className="font-bold text-sm text-white">Standard Delivery</p>
                                                <p className="text-[10px] text-white/50">Arrives in 3-5 days</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-indigo-400">Free</span>
                                    </button>
                                    <button onClick={() => setDeliveryType('fast')} className={`p-4 rounded-lg border-2 text-left transition-all flex items-center justify-between ${deliveryType === 'fast' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Truck className={`w-5 h-5 ${deliveryType === 'fast' ? 'text-indigo-400' : 'text-white/30'}`} />
                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-white">Next Day Delivery</p>
                                                <p className="text-[10px] text-indigo-400 font-medium">Fastest shipping</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-indigo-400">+₹{FAST_DELIVERY_COST}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Professional Installation */}
                            <div className="p-4 bg-white/5 rounded-lg border-2 border-white/5 flex justify-between items-center transition-all has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-500/10">
                                <div className="flex items-center gap-3">
                                    <Wrench className="w-5 h-5 text-indigo-400" />
                                    <div>
                                        <p className="text-sm font-bold text-white">Professional Installation</p>
                                        <p className="text-[10px] text-white/50">+₹{INSTALLATION_COST}</p>
                                    </div>
                                </div>
                                <input type="checkbox" checked={includeInstallation} onChange={e => setIncludeInstallation(e.target.checked)} className="w-5 h-5 accent-indigo-500" />
                            </div>

                            {/* Payment Scheme */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-white/50 block px-1">Payment Scheme</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setPaymentScheme('part')} className={`p-4 rounded-lg border-2 text-left transition-all ${paymentScheme === 'part' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}>
                                        <p className="font-bold text-white text-xs">Part Pay</p>
                                        <p className="text-[9px] text-white/50">25% Advance</p>
                                    </button>
                                    <button onClick={() => setPaymentScheme('full')} className={`p-4 rounded-lg border-2 text-left transition-all ${paymentScheme === 'full' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/5'}`}>
                                        <p className="font-bold text-white text-xs">Full Pay</p>
                                        <p className="text-[9px] text-white/50">100% Upfront</p>
                                    </button>
                                </div>

                                {paymentScheme === 'part' && (
                                    <div className="mt-3 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-bold text-indigo-400">Advance Amount</label>
                                            <span className="text-[10px] text-white/50 font-bold text-right italic">MIN: ₹{Math.ceil(price * 0.25)}</span>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={advanceAmount}
                                                onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
                                                onBlur={(e) => {
                                                    const min = Math.ceil(price * 0.25);
                                                    if (parseFloat(e.target.value) < min) setAdvanceAmount(min);
                                                }}
                                                className="w-full bg-white/5 border border-indigo-500/30 rounded-md py-2.5 pl-7 pr-3 text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Order Summary Integrated */}
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    Order Summary
                                </h3>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm font-medium text-white/60">
                                        <span>Base Product</span>
                                        <span className="text-white">₹{calculatedBasePrice}</span>
                                    </div>
                                    {deliveryCost > 0 && (
                                        <div className="flex justify-between text-sm font-medium text-white/60">
                                            <span>Fast Delivery</span>
                                            <span className="text-white">+₹{deliveryCost}</span>
                                        </div>
                                    )}
                                    {installationCost > 0 && (
                                        <div className="flex justify-between text-sm font-medium text-white/60">
                                            <span>Professional Installation</span>
                                            <span className="text-white">+₹{installationCost}</span>
                                        </div>
                                    )}
                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm font-medium text-green-400/80">
                                            <span>Referral Discount</span>
                                            <span>-₹{discount}</span>
                                        </div>
                                    )}
                                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-xs font-bold text-white">{paymentScheme === 'part' ? 'Pay Advance' : 'Total Payable'}</span>
                                        {isPriceLoading ? (
                                            <div className="flex items-center gap-2 text-indigo-400">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span className="text-xs font-bold animate-pulse">Calculating...</span>
                                            </div>
                                        ) : (
                                            <span className="text-3xl font-bold text-indigo-400">₹{paymentScheme === 'part' ? advanceAmount : price}</span>
                                        )}
                                    </div>
                                    {paymentScheme === 'part' && (
                                        <div className="text-[10px] font-bold text-white/30 text-right italic">
                                            Remaining Balance: ₹{price - advanceAmount}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-4 pb-2 text-center text-[10px] font-bold text-white/20 px-4">
                                Instant preview & payment verification next ✨
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrated Bottom Toolbar with shared navigation */}
                <MobileToolbar
                    activeDrawer={activeDrawer}
                    setActiveDrawer={setActiveDrawer}
                    onNext={() => {
                        if (mobileTab === 'design') setMobileTab('order');
                        else if (mobileTab === 'order') {
                            const canvas = (window as any).fabricCanvas;
                            if (canvas) {
                                setReviewCanvasJSON(canvas.toJSON(['name', 'id', 'isBackground', 'selectable', 'evented', 'editable']));
                            }
                            setShowReviewModal(true);
                        }
                    }}
                    onBack={mobileTab !== 'design' ? () => {
                        if (mobileTab === 'order') setMobileTab('design');
                    } : undefined}
                    nextLabel={mobileTab === 'order' ? 'Proceed to Review' : 'Next'}
                    showTools={mobileTab === 'design'}
                />

                <MobileDrawer
                    isOpen={activeDrawer === 'profile'}
                    onClose={() => setActiveDrawer(null)}
                    title="Edit Business Details"
                    variant="dark"
                    disableBackdrop={true}
                >
                    <SignageForm
                        data={designState.data}
                        onChange={designState.mergeData}
                        onLogoUpload={(file, url) => addImageFn?.(url)}
                        usedTemplateKeys={usedTemplateKeys}
                    />
                </MobileDrawer>

                <MobileDrawer
                    isOpen={activeDrawer === 'bg-color'}
                    onClose={() => setActiveDrawer(null)}
                    title="Signboard Color"
                    disableBackdrop={true}
                >
                    <div className="flex gap-3 justify-center pb-2 px-1">
                        {/* Basic Colors */}
                        {['#000000', '#ffffff', '#eab308', '#ef4444', '#3b82f6'].map(color => (
                            <button
                                key={color}
                                onClick={() => {
                                    designState.setDesign({ ...designState.design, backgroundColor: color });
                                    const canvas = (window as any).fabricCanvas;
                                    if (canvas) {
                                        canvas.backgroundColor = color;
                                        canvas.renderAll();
                                    }
                                }}
                                className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-white/20 shadow-md transition-transform active:scale-90 hover:scale-110"
                                style={{ backgroundColor: color }}
                            />
                        ))}

                        {/* Custom Color Picker */}
                        <button
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'color';
                                input.value = designState.design.backgroundColor || '#ffffff';
                                input.onchange = (e: any) => {
                                    const color = e.target.value;
                                    designState.setDesign({ ...designState.design, backgroundColor: color });
                                    const canvas = (window as any).fabricCanvas;
                                    if (canvas) {
                                        canvas.backgroundColor = color;
                                        canvas.renderAll();
                                    }
                                };
                                input.click();
                            }}
                            className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-white/20 shadow-md transition-transform active:scale-90 hover:scale-110"
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)'
                            }}
                        />
                    </div>
                </MobileDrawer>

                <MobileDrawer
                    isOpen={activeDrawer === 'font'}
                    onClose={() => setActiveDrawer(null)}
                    title="Select Font"
                    disableBackdrop={true}
                >
                    <div className="grid grid-cols-2 gap-2 p-1">
                        {SUPPORTED_FONTS.map(font => (
                            <button
                                key={font}
                                onClick={() => {
                                    designState.setDesign({ ...designState.design, fontFamily: font });
                                    const canvas = (window as any).fabricCanvas;
                                    if (canvas) {
                                        const objects = canvas.getObjects().filter((obj: any) => obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox');
                                        objects.forEach((obj: any) => {
                                            obj.set('fontFamily', font);
                                        });
                                        canvas.renderAll();
                                    }
                                }}
                                className={cn(
                                    "px-3 py-3 text-left rounded-md border text-sm flex items-center justify-between transition-colors",
                                    designState.design.fontFamily === font
                                        ? "bg-indigo-500/20 border-indigo-500 text-white"
                                        : "bg-white/5 border-white/5 text-slate-300 active:bg-white/10"
                                )}
                                style={{ fontFamily: font }}
                            >
                                <span className="truncate">{font}</span>
                                {designState.design.fontFamily === font && <Check size={14} className="text-indigo-400 shrink-0 ml-2" />}
                            </button>
                        ))}
                    </div>
                </MobileDrawer>

                <MobileDrawer
                    isOpen={activeDrawer === 'text-color'}
                    onClose={() => setActiveDrawer(null)}
                    title="Text Color"
                    disableBackdrop={true}
                >
                    <div className="flex gap-3 justify-center pb-2 px-1">
                        {/* Basic Colors */}
                        {['#000000', '#ffffff', '#eab308', '#ef4444', '#3b82f6'].map(color => (
                            <button
                                key={color}
                                onClick={() => {
                                    designState.setDesign({ ...designState.design, textColor: color });
                                    const canvas = (window as any).fabricCanvas;
                                    if (canvas) {
                                        const objects = canvas.getObjects().filter((obj: any) => obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox');
                                        objects.forEach((obj: any) => {
                                            obj.set('fill', color);
                                        });
                                        canvas.renderAll();
                                    }
                                }}
                                className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-white/20 shadow-md transition-transform active:scale-90 hover:scale-110"
                                style={{ backgroundColor: color }}
                            />
                        ))}

                        {/* Custom Color Picker */}
                        <button
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'color';
                                input.value = designState.design.textColor || '#000000';
                                input.onchange = (e: any) => {
                                    const color = e.target.value;
                                    designState.setDesign({ ...designState.design, textColor: color });
                                    const canvas = (window as any).fabricCanvas;
                                    if (canvas) {
                                        const objects = canvas.getObjects().filter((obj: any) => obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox');
                                        objects.forEach((obj: any) => {
                                            obj.set('fill', color);
                                        });
                                        canvas.renderAll();
                                    }
                                };
                                input.click();
                            }}
                            className="w-12 h-12 rounded-full flex-shrink-0 border-2 border-white/20 shadow-md transition-transform active:scale-90 hover:scale-110"
                            style={{
                                background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)'
                            }}
                        />
                    </div>
                </MobileDrawer>

                <MobileDrawer
                    isOpen={activeDrawer === 'templates'}
                    onClose={() => setActiveDrawer(null)}
                    title="Design Gallery"
                >
                    <TemplateSelector
                        selectedTemplateId={designState.design.templateId}
                        onSelect={(id, skipResize) => {
                            designState.handleTemplateSelect(id, skipResize, isMobile);
                            setActiveDrawer(null);
                        }}
                    />
                </MobileDrawer>

                <ReviewApproval
                    data={designState.data}
                    design={designState.design}
                    material={designState.material}
                    isOpen={showReviewModal}
                    canvasJSON={reviewCanvasJSON}
                    onClose={() => setShowReviewModal(false)}
                    onEdit={() => {
                        setShowReviewModal(false);
                        if (isMobile) setMobileTab('design');
                    }}
                    onDownloadPDF={() => handleDownload('pdf')}
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
                    designConfig={designState.design}
                    signageData={designState.data}
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
                        selectedTemplateId={designState.design.templateId}
                        onSelectTemplate={(id, skipResize) => { designState.handleTemplateSelect(id, skipResize, false); }}
                        onAddText={(type) => addTextFn?.(type)}
                        onAddIcon={(iconName) => addIconFn?.(iconName)}
                        onAddShape={(shape) => addShapeFn?.(shape)}
                        onAddShapeSVG={(url) => addShapeSVGFn?.(url)}
                        onAddImage={(url) => addImageFn?.(url)}
                        templates={designState.templates}
                        aspectRatio={designState.design.width / designState.design.height}
                        currentProductId={designState.productId || undefined}
                        isAdmin={searchParams.get('mode') === 'admin'}
                    />
                </div>

                <div className="flex-1 bg-gray-200/50 relative overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                        {dynamicMissingFonts.length > 0 && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-md px-4 pointer-events-none">
                                <div className="pointer-events-auto">
                                    <FontWarning warnings={{ missingFonts: dynamicMissingFonts }} />
                                </div>
                            </div>
                        )}
                        <PreviewSection
                            uploadedDesign={uploadedDesign}
                            data={designState.data}
                            design={designState.design}
                            onDesignChange={designState.setDesign}
                            material={designState.material}
                            onAddText={registerAddText}
                            onAddIcon={registerAddIcon}
                            onAddShape={registerAddShape}
                            onAddShapeSVG={registerAddShapeSVG}
                            onAddImage={registerAddImage}
                            onHistoryStateChange={setHistoryState}
                            onHistoryAction={(fn) => onHistoryActionRef.current = fn}
                            onFontWarningChange={setDynamicMissingFonts}
                            initialJSON={designState.initialDesignJSON}
                            onObjectSelected={setSelectedObject}
                            isAdmin={isAdmin}
                        />
                    </div>
                </div>

                <ConfigurationPanel
                    data={designState.data}
                    design={designState.design}
                    setDesign={designState.setDesign}
                    material={designState.material}
                    setMaterial={designState.setMaterial}
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
                    isPriceLoading={isPriceLoading}
                    isFixedProduct={designState.isFixedProduct}
                    handleDownload={handleDownload}
                    setShowReviewModal={setShowReviewModal}
                    setReviewCanvasJSON={setReviewCanvasJSON}
                    FAST_DELIVERY_COST={FAST_DELIVERY_COST}
                    INSTALLATION_COST={INSTALLATION_COST}
                    selectedObject={selectedObject}
                    isAdmin={isAdmin}
                    onUpdateObject={handleUpdateObject}
                    usedTemplateKeys={usedTemplateKeys}
                />
            </div>

            <ReviewApproval
                data={designState.data}
                design={designState.design}
                material={designState.material}
                isOpen={showReviewModal}
                canvasJSON={reviewCanvasJSON}
                onClose={() => setShowReviewModal(false)}
                onEdit={() => {
                    setShowReviewModal(false);
                    if (isMobile) setMobileTab('design');
                }}
                onDownloadPDF={() => handleDownload('pdf')}
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
                designConfig={designState.design}
                signageData={designState.data}
            />
            <WhatsAppButton variant="floating" message="Hi! I need help with my signage design." />
        </div>
    );
}
