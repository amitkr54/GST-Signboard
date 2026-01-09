const fs = require('fs');
const path = require('path');

// Output file path
const OUTPUT_FILE = path.join(__dirname, '../supabase/migrate_local_templates.sql');
const INPUT_FILE = path.join(__dirname, '../src/data/templates.json');

try {
    if (!fs.existsSync(INPUT_FILE)) {
        console.error('Error: src/data/templates.json not found.');
        process.exit(1);
    }

    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const templates = JSON.parse(rawData);

    console.log(`Found ${templates.length} templates to migrate.`);

    let sqlContent = `-- Migration script for local templates
-- Generated on ${new Date().toISOString()}

`;

    templates.forEach(t => {
        // Escape check for text fields
        const safeText = (txt) => txt ? `'${txt.replace(/'/g, "''")}'` : 'NULL';
        const safeJson = (obj) => obj ? `'${JSON.stringify(obj).replace(/'/g, "''")}'` : "'{}'::jsonb";

        const id = safeText(t.id);
        const name = safeText(t.name);
        const description = safeText(t.description || '');
        const thumbnailColor = safeText(t.thumbnailColor || '#ffffff');
        const thumbnail = safeText(t.thumbnail || null);
        const svgPath = safeText(t.svgPath || null);
        const layoutType = safeText(t.layoutType || 'centered');
        const isCustom = t.isCustom ? 'true' : 'false';

        // JSONB fields
        const components = safeJson(t.components);
        const fabricConfig = safeJson(t.fabricConfig);
        const defaults = safeJson(t.defaults);

        sqlContent += `
INSERT INTO public.templates (
    id, name, description, thumbnail_color, thumbnail, svg_path, layout_type, is_custom, components, fabric_config, defaults
) VALUES (
    ${id}, ${name}, ${description}, ${thumbnailColor}, ${thumbnail}, ${svgPath}, ${layoutType}, ${isCustom}, ${components}, ${fabricConfig}, ${defaults}
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    components = EXCLUDED.components,
    fabric_config = EXCLUDED.fabric_config;
`;
    });

    fs.writeFileSync(OUTPUT_FILE, sqlContent);
    console.log(`Successfully generated SQL migration script at: ${OUTPUT_FILE}`);

} catch (error) {
    console.error('Migration generation failed:', error);
}
