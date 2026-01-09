
const fs = require('fs');
const path = require('path');

// Manually defining data since we can't import TS files in simple node script easily without compilation
// Copy-pasting data structure from src/lib/templates.ts
const TEMPLATES = [
    {
        id: 'svg-sample',
        name: 'Gold Royal Border',
        description: 'Luxury gold border design from SVG',
        thumbnailColor: '#FFD700',
        layoutType: 'centered',
        svgPath: '/templates/fancy-border.svg'
    },
    {
        id: 'modern',
        name: 'Modern Standard',
        description: 'Clean vertical layout with centered logo',
        thumbnailColor: '#ffffff',
        layoutType: 'default'
    },
    {
        id: 'corporate',
        name: 'Corporate Split',
        description: 'Logo on left, details on right',
        thumbnailColor: '#f8f9fa',
        layoutType: 'split-left'
    },
    {
        id: 'bold',
        name: 'Bold Identity',
        description: 'Large logo with minimal text',
        thumbnailColor: '#2d3748',
        layoutType: 'centered'
    },
    {
        id: 'retail',
        name: 'Retail Banner',
        description: 'Horizontal layout optimized for shop boards',
        thumbnailColor: '#fff5f5',
        layoutType: 'banner'
    },
    {
        id: 'classic',
        name: 'Classic Right',
        description: 'Logo on right, classic typography',
        thumbnailColor: '#fffaf0',
        layoutType: 'split-right'
    },
    {
        id: 'professional',
        name: 'Professional Border',
        description: 'Clean design with professional double border',
        thumbnailColor: '#ffffff',
        thumbnail: '/templates/professional.png',
        layoutType: 'default'
    },
    {
        id: 'industrial',
        name: 'Industrial Dark',
        description: 'Dark theme with rivet details',
        thumbnailColor: '#333333',
        thumbnail: '/templates/industrial.png',
        layoutType: 'centered'
    },
    {
        id: 'modern-split',
        name: 'Modern Side',
        description: 'Bold side strip layout',
        thumbnailColor: '#ffffff',
        thumbnail: '/templates/modern-split.png',
        layoutType: 'split-left'
    },
    {
        id: 'boxed',
        name: 'Boxed Frame',
        description: 'Simple framed layout for formal details',
        thumbnailColor: '#ffffff',
        thumbnail: '/templates/boxed.png',
        layoutType: 'default'
    },
    {
        id: 'foundation',
        name: 'Foundation Blue',
        description: 'Solid color background with white text',
        thumbnailColor: '#1e3a8a',
        thumbnail: '/templates/foundation.png',
        layoutType: 'centered'
    }
];

const TEMPLATE_DEFAULTS = {
    'svg-sample': {
        companyName: 'ROYAL PALACE',
        address: '1 Royal Way, Castle District',
        additionalText: ['EST. 1800']
    },
    'professional': {
        companyName: 'ATHMA',
        address: '#123, Street Name, City, State - 560001',
        additionalText: ['ARCHITECTURE | INTERIORS']
    },
    'industrial': {
        companyName: 'CRAFTBY',
        address: 'Industrial Area, Phase 1',
        additionalText: ['THE ART OF DESIGN']
    },
    'modern-split': {
        companyName: 'VARAPRADA',
        address: '123 Business Park, Tech City, Bangalore - 560100',
        additionalText: ['ENTERPRISES', 'GSTIN: 29ABCDE1234F1Z5']
    },
    'boxed': {
        companyName: 'PWLO',
        address: 'Premium World License Org, Official HQ',
        additionalText: ['EST. 2024']
    },
    'foundation': {
        companyName: 'IMW',
        address: 'Industrial Manufacturing Works, Sector 45',
        additionalText: ['SINCE 1995']
    },
    'modern': { companyName: 'YOUR BRAND', address: '123 Main Street, City' },
    'corporate': { companyName: 'CORPORATE INC', address: 'Business District, City' },
    'bold': { companyName: 'BOLD', address: '' },
    'retail': { companyName: 'STORE NAME', address: 'Shop 12, Market Complex' },
    'classic': { companyName: 'Classic Co.', address: 'Est. 1980' },
    'minimal': { companyName: 'MINIMAL', address: '' },
    'luxury': { companyName: 'LUXURY', address: 'Paris • London • New York' },
    'tech': { companyName: 'TECH SYSTEMS', address: 'Innovation Park' }
};

function generateSQL() {
    let sql = `-- Seed Data for Templates\n`;

    for (const t of TEMPLATES) {
        const defaults = TEMPLATE_DEFAULTS[t.id] || {};

        // Escape single quotes for SQL
        const escape = (str) => str ? str.replace(/'/g, "''") : null;

        const vals = {
            id: `'${t.id}'`,
            name: `'${escape(t.name)}'`,
            description: t.description ? `'${escape(t.description)}'` : 'NULL',
            thumbnail_color: `'${t.thumbnailColor}'`,
            thumbnail: t.thumbnail ? `'${t.thumbnail}'` : 'NULL',
            svg_path: t.svgPath ? `'${t.svgPath}'` : 'NULL',
            layout_type: `'${t.layoutType}'`,
            is_custom: false,
            components: `'${JSON.stringify(t.components || {})}'`,
            fabric_config: `'${JSON.stringify(t.fabricConfig || {})}'`,
            defaults: `'${JSON.stringify(defaults)}'`
        };

        sql += `INSERT INTO public.templates (id, name, description, thumbnail_color, thumbnail, svg_path, layout_type, is_custom, components, fabric_config, defaults) VALUES (${vals.id}, ${vals.name}, ${vals.description}, ${vals.thumbnail_color}, ${vals.thumbnail}, ${vals.svg_path}, ${vals.layout_type}, ${vals.is_custom}, ${vals.components}, ${vals.fabric_config}, ${vals.defaults}) ON CONFLICT (id) DO NOTHING;\n`;
    }

    return sql;
}

const sqlOutput = generateSQL();
console.log(sqlOutput);
fs.writeFileSync('supabase/seed_templates.sql', sqlOutput);
