import { useState, useEffect, useRef } from 'react';
import { getMasterAssets, saveToLibrary } from '@/app/actions';

export function useEditorAssets(isAdmin: boolean) {
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [masterAssets, setMasterAssets] = useState<string[]>([]);
    const [isLoadingMaster, setIsLoadingMaster] = useState(false);

    // File inputs refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const iconFileInputRef = useRef<HTMLInputElement>(null);
    const svgFileInputRef = useRef<HTMLInputElement>(null);

    // Fetch master assets on mount
    useEffect(() => {
        const fetchMaster = async () => {
            setIsLoadingMaster(true);
            try {
                const assets = await getMasterAssets();
                setMasterAssets(assets);
            } catch (err) {
                console.error('Failed to fetch master assets:', err);
            } finally {
                setIsLoadingMaster(false);
            }
        };
        fetchMaster();
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                setUploadedImages(prev => [imageUrl, ...prev]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUploadCallback = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                callback(imageUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSvgUploadCallback = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            callback(url);
        }
    };

    const handleSaveToLibrary = async (imageUrl: string) => {
        if (!isAdmin) return;
        try {
            const res = await saveToLibrary(imageUrl, '1234');
            if (res.success) {
                alert('Saved to Master Library!');
                const assets = await getMasterAssets();
                setMasterAssets(assets);
            } else {
                alert('Failed to save: ' + res.error);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while saving.');
        }
    };

    return {
        uploadedImages,
        masterAssets,
        isLoadingMaster,
        fileInputRef,
        iconFileInputRef,
        svgFileInputRef,
        handleFileUpload,
        handleImageUploadCallback,
        handleSvgUploadCallback,
        handleSaveToLibrary
    };
}
