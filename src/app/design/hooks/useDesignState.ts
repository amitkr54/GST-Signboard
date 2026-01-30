import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { DesignConfig, DEFAULT_DESIGN, TemplateId, SignageData } from '@/lib/types';
import { MaterialId } from '@/lib/utils';
import { getTemplates, getReferrerByCode } from '@/app/actions';
import { PRODUCTS } from '@/lib/products';

export function useDesignState() {
    const searchParams = useSearchParams();
    const productId = searchParams.get('product');
    const product = productId ? PRODUCTS.find(p => p.id === productId) : null;

    // State
    const [data, setData] = useState<SignageData>({
        companyName: '',
        address: '',
        email: '',
        website: '',
        customFields: {}
    });
    const [design, setDesign] = useState<DesignConfig>(DEFAULT_DESIGN);
    const [material, setMaterial] = useState<MaterialId>('flex');
    const [templates, setTemplates] = useState<any[]>([]);
    const [initialDesignJSON, setInitialDesignJSON] = useState<any>(null);

    // Referral
    const [referralCode, setReferralCode] = useState('');
    const [isValidatingCode, setIsValidatingCode] = useState(false);
    const [codeValidated, setCodeValidated] = useState(false);

    // Refs
    const isInitializedRef = useRef(false);
    const hasAutoLoadedRef = useRef(false);

    const isFixedProduct = (!!productId && (!product || product.materials.length <= 1)) || !!searchParams.get('material');

    // Referral validation
    const validateReferralCode = useCallback(async (code: string) => {
        if (!code) { setCodeValidated(false); return; }
        setIsValidatingCode(true);
        const result = await getReferrerByCode(code);
        setCodeValidated(result.success && result.referrer !== null);
        setIsValidatingCode(false);
    }, []);

    // Template selection
    const handleTemplateSelect = useCallback((id: TemplateId, skipResize = false, isMobile = false) => {
        const template = templates.find(t => t.id === id);

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
    }, [templates, searchParams]);

    // Fetch templates
    useEffect(() => {
        const fetchAllTemplates = async () => {
            try {
                const data = await getTemplates();
                if (data && data.length > 0) setTemplates(data);
            } catch (err) { console.error('Failed to pre-fetch templates:', err); }
        };
        fetchAllTemplates();
    }, []);

    // Referral code from URL or cookie
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
    }, [searchParams, validateReferralCode]);

    // Auto-load template from URL
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

    // Initialize dimensions and material from URL
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

    // Restore from draft
    useEffect(() => {
        const pendingDraft = localStorage.getItem('design_draft_pending');
        if (pendingDraft) {
            try {
                const draft = JSON.parse(pendingDraft);
                if (Date.now() - draft.timestamp < 30 * 60 * 1000) {
                    if (draft.design) setInitialDesignJSON(draft.design);
                    if (draft.designConfig) setDesign(draft.designConfig);
                    if (draft.signageData) setData(draft.signageData);
                }
            } catch (e) {
                console.error('Failed to parse draft', e);
            } finally {
                localStorage.removeItem('design_draft_pending');
            }
        }
    }, []);

    return {
        // State
        data,
        setData,
        design,
        setDesign,
        material,
        setMaterial,
        templates,
        selectedTemplate: templates.find(t => t.id === design.templateId),
        initialDesignJSON,
        setInitialDesignJSON,

        // Referral
        referralCode,
        setReferralCode,
        isValidatingCode,
        codeValidated,
        validateReferralCode,

        // Handlers
        handleTemplateSelect,

        // Product
        product,
        productId,
        isFixedProduct,
    };
}
