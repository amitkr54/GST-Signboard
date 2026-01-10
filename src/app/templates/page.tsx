import TemplateGallery from '@/components/TemplateGallery';
import { getTemplates } from '../actions';

export default async function TemplatesPage() {
    const templates = await getTemplates();
    const allTemplates = Array.isArray(templates) ? templates : [];

    return (
        <section className="py-20 min-h-screen relative">
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-12 text-center md:text-left">
                    <p className="text-sm font-bold text-indigo-400 mb-2 uppercase tracking-wider">Start Designing</p>
                    <h1 className="text-4xl lg:text-5xl font-black text-white mb-4">Professional Templates</h1>
                    <p className="text-lg text-indigo-100 max-w-3xl">
                        Choose a template to jumpstart your signage design. Fully customizable to fit your brand.
                    </p>
                </div>

                <TemplateGallery initialTemplates={allTemplates} />
            </div>
        </section>
    );
}
