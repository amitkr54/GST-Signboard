export interface SignageData {
    companyName: string;
    address: string;
    gstin?: string;
    cin?: string;
    mobile?: string;
    logoUrl?: string;
    additionalText?: string[];
}

export interface OrderContactDetails {
    name: string;
    email: string;
    mobile: string;
    shippingAddress: string;
}

export type TemplateId = 'custom' | 'modern' | 'classic' | 'minimal' | 'bold' | 'corporate' | 'luxury' | 'tech' | 'retail' | 'professional' | 'industrial' | 'modern-split' | 'boxed' | 'foundation' | 'svg-sample';

export interface DesignConfig {
    templateId: TemplateId;
    width: number;
    height: number;
    unit: 'px' | 'in' | 'cm' | 'mm'; // Added unit
    backgroundColor: string;
    backgroundGradientEnabled: boolean;
    backgroundColor2: string;
    backgroundGradientAngle: number;
    textColor: string;
    fontFamily: string;
    borderColor: string;
    fontSize: number; // Base font size for details
    companyNameSize: number; // Specific size for company name
    logoSize: number; // Logo height in pixels
}

export const DEFAULT_DESIGN: DesignConfig = {
    templateId: 'modern',
    width: 24,
    height: 16,
    unit: 'in',
    backgroundColor: '#ffffff',
    backgroundGradientEnabled: false,
    backgroundColor2: '#f3f4f6',
    backgroundGradientAngle: 90,
    textColor: '#1a1a1a',
    fontFamily: 'Inter',
    borderColor: '#e5e7eb',
    fontSize: 60, // Increased from 20 for 1800px width
    companyNameSize: 120, // Increased from 40 for 1800px width
    logoSize: 300 // Increased from 80 for 1800px width
};
