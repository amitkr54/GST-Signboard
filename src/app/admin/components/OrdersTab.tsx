import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, ChevronRight, X } from 'lucide-react';
import { getFontBase64 } from '@/lib/font-utils';

interface OrdersTabProps {
    orders: any[];
    expandedOrder: string | null;
    setExpandedOrder: (id: string | null) => void;
    fetchOrders: () => void;
    handleUpdateOrderStatus: (orderId: string, newStatus: string) => void;
}

const OrdersTab = ({
    orders,
    expandedOrder,
    setExpandedOrder,
    fetchOrders,
    handleUpdateOrderStatus
}: OrdersTabProps) => {

    const downloadDesignAsPDF = async (visualProof: string, orderId: string, designConfig?: any) => {
        if (!visualProof) return;

        // If it's already a PDF data URL, just download it
        if (visualProof.startsWith('data:application/pdf')) {
            const base64 = visualProof.split(',')[1];
            const binary = atob(base64);
            const array = [];
            for (let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
            const blob = new Blob([new Uint8Array(array)], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `signage-${Math.round(designConfig?.width || 12)}x${Math.round(designConfig?.height || 12)}${designConfig?.unit || 'in'}-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return;
        }

        // If it's an SVG (or something else), convert to PDF on-the-fly
        try {
            const [jsPDFModule, svg2pdfModule] = await Promise.all([
                import('jspdf'),
                import('svg2pdf.js')
            ]);

            const jsPDF = jsPDFModule.jsPDF;

            // Extract fonts from SVG - Handle both attributes (=) and styles (:)
            const fontFamilies = new Set<string>();
            const fontMatch = visualProof.match(/(?:font-family)[:=]\s*['"]?([^'";\),]+)['"]?/gi);
            if (fontMatch) {
                fontMatch.forEach((m: string) => {
                    const family = m.replace(/font-family[:=]\s*['"]?/, '').replace(/['"]?$/, '').trim();
                    if (family) fontFamilies.add(family);
                });
            }

            // Get dimensions from designConfig or default
            const widthIn = designConfig?.width || 12;
            const heightIn = designConfig?.height || 12;

            const pdf = new jsPDF({
                orientation: widthIn > heightIn ? 'landscape' : 'portrait',
                unit: 'in',
                format: [heightIn, widthIn]
            });

            // Embed fonts
            for (const family of Array.from(fontFamilies)) {
                // Try to embed Normal, Bold, Italic, and BoldItalic variants if they exist
                const variants = ['', '-Bold', '-Italic', '-BoldItalic'];
                for (const variant of variants) {
                    const fontName = `${family}${variant}`;
                    const base64 = await getFontBase64(fontName);
                    if (base64) {
                        let style = 'normal';
                        if (variant === '-Bold') style = 'bold';
                        else if (variant === '-Italic') style = 'italic';
                        else if (variant === '-BoldItalic') style = 'bolditalic';

                        const vfsId = fontName.replace(/\s+/g, '_') + '.ttf';
                        pdf.addFileToVFS(vfsId, base64);
                        pdf.addFont(vfsId, family, style);
                    }
                }
            }

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = visualProof;
            const svgElement = tempDiv.querySelector('svg');

            if (svgElement) {
                await svg2pdfModule.svg2pdf(svgElement, pdf, {
                    x: 0,
                    y: 0,
                    width: widthIn,
                    height: heightIn
                });
                pdf.save(`signage-${Math.round(widthIn)}x${Math.round(heightIn)}${designConfig?.unit || 'in'}-${Date.now()}.pdf`);
            } else {
                // Fallback: If no SVG found, just download as text/SVG
                const blob = new Blob([visualProof], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `design-${orderId.split('-')[0]}.svg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Downloading original design instead.');
            const blob = new Blob([visualProof], { type: visualProof.startsWith('data:application/pdf') ? 'application/pdf' : 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `signage-${Math.round(designConfig?.width || 12)}x${Math.round(designConfig?.height || 12)}${designConfig?.unit || 'in'}-${Date.now()}.${visualProof.startsWith('data:application/pdf') ? 'pdf' : 'svg'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Product Orders ({orders.length})</h2>
                <Button
                    onClick={fetchOrders}
                    variant="outline"
                    className="border-white/10 text-white hover:bg-white/5"
                >
                    Refresh
                </Button>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2rem] shadow-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Order Info</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {orders.map(order => (
                                <React.Fragment key={order.id}>
                                    <tr className={`group transition-all duration-300 ${expandedOrder === order.id ? 'bg-indigo-500/10' : 'hover:bg-white/5'}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-mono text-[10px] text-indigo-400 font-bold tracking-tight">#{order.id.split('-')[0].toUpperCase()}</span>
                                                <span className="text-xs text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-sm">{order.customer_name}</span>
                                                <span className="text-[10px] text-slate-400">{order.customer_phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-emerald-400">₹{order.amount}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-black/20 border transition-all ${order.status === 'paid' ? 'text-emerald-400 border-emerald-500/30' : 'text-amber-400 border-amber-500/30'}`}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="paid">Paid</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="completed">Completed</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all"
                                            >
                                                {expandedOrder === order.id ? <X size={16} /> : <ChevronRight size={16} className={expandedOrder === order.id ? 'rotate-90' : ''} />}
                                            </button>
                                        </td>
                                    </tr>
                                    {/* Expanded Details */}
                                    {expandedOrder === order.id && (
                                        <tr className="bg-black/20 border-b border-indigo-500/20 animate-in slide-in-from-top-4 duration-300">
                                            <td colSpan={5} className="px-8 py-6">
                                                <div className="grid md:grid-cols-2 gap-8">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">Customer Info & Shipping</h4>
                                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-slate-200 space-y-2">
                                                                <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Name:</span> {order.customer_name}</p>
                                                                <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Email:</span> {order.customer_email}</p>
                                                                <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Phone:</span> {order.customer_phone}</p>
                                                                <div className="pt-2 border-t border-white/5">
                                                                    <span className="text-slate-500 font-bold uppercase text-[9px] block mb-1">Address:</span>
                                                                    {order.customer_address}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">Company Details</h4>
                                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-slate-200">
                                                                <p className="font-bold">{order.company_details?.companyName}</p>
                                                                <p className="opacity-70">{order.company_details?.address}</p>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">Service Options</h4>
                                                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-slate-200 space-y-2">
                                                                <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Delivery:</span> {order.design_config?.deliveryType === 'fast' ? 'Express (24-48h)' : 'Standard (3-5 days)'}</p>
                                                                <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Installation:</span> {order.design_config?.includeInstallation ? 'Required' : 'Not Required'}</p>
                                                                <p><span className="text-slate-500 font-bold uppercase text-[9px] mr-2">Payment Scheme:</span> {order.design_config?.paymentScheme === 'part' ? 'Partial (Advance)' : 'Full Payment'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2">Design Proof</h4>
                                                        <div className="aspect-[16/10] bg-white rounded-2xl border-4 border-slate-800 overflow-hidden flex items-center justify-center p-2">
                                                            {order.visual_proof ? (
                                                                <div className="w-full h-full relative group/proof">
                                                                    {order.visual_proof.startsWith('data:application/pdf') ? (
                                                                        <iframe
                                                                            src={`${order.visual_proof}#toolbar=0&navpanes=0&scrollbar=0`}
                                                                            className="w-full h-full pointer-events-none scale-[1.01] origin-top-left"
                                                                            title="Design Proof"
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            dangerouslySetInnerHTML={{ __html: order.visual_proof }}
                                                                            className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                                                                        />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/proof:opacity-100 transition-opacity z-10">
                                                                        <button
                                                                            onClick={() => downloadDesignAsPDF(order.visual_proof, order.id, order.design_config)}
                                                                            className="px-4 py-2 bg-white text-black font-bold text-xs rounded-full hover:scale-105 transition-transform flex items-center gap-2 shadow-xl"
                                                                        >
                                                                            Download PDF
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400 font-bold">No visual proof</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {orders.length === 0 && (
                <div className="text-center py-20 bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-white/10">
                    <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white">No Orders Found</h3>
                    <p className="text-slate-400">Wait for your first customer to place an order.</p>
                </div>
            )}
        </div>
    );
};

export default OrdersTab;
