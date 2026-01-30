import React from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface FontWarningProps {
    warnings?: {
        missingFonts?: string[];
    };
}

export const FontWarning: React.FC<FontWarningProps> = ({ warnings }) => {
    if (!warnings?.missingFonts?.length) return null;

    return (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4 rounded-r shadow-sm animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-semibold text-amber-800">
                        Missing Fonts Detected
                    </h3>
                    <div className="mt-1 text-xs text-amber-700">
                        <p>
                            This template uses fonts not supported by our system:
                        </p>
                        <ul className="list-disc list-inside mt-1 font-medium italic">
                            {warnings.missingFonts.map((font, idx) => (
                                <li key={idx}>{font}</li>
                            ))}
                        </ul>
                        <p className="mt-2 text-[10px] opacity-75">
                            Admins: Please select alternative fonts using the toolbar and use <strong>"Update Master"</strong> to fix this template.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
