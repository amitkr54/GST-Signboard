import React from 'react';
import { Bold, Italic, Link as LinkIcon, List as ListIcon } from 'lucide-react';

interface FormattingToolbarProps {
    targetId: string;
    onFormat: (tag: string) => void;
}

const FormattingToolbar = ({ onFormat }: FormattingToolbarProps) => (
    <div className="flex items-center gap-1 mb-1 p-1 bg-gray-50 border border-gray-200 rounded-t-lg">
        <button
            type="button"
            onClick={() => onFormat('b')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Bold"
        >
            <Bold className="w-4 h-4" />
        </button>
        <button
            type="button"
            onClick={() => onFormat('i')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Italic"
        >
            <Italic className="w-4 h-4" />
        </button>
        <button
            type="button"
            onClick={() => onFormat('a')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="Link"
        >
            <LinkIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
            type="button"
            onClick={() => onFormat('li')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="List Item"
        >
            <ListIcon className="w-4 h-4" />
        </button>
    </div>
);

export default FormattingToolbar;
