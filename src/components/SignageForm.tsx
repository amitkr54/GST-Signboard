import React from 'react';
import { SignageData } from '@/lib/types';

interface SignageFormProps {
    data: SignageData;
    onChange: (data: SignageData) => void;
    onLogoUpload: (file: File, tempUrl: string) => void;
}

export function SignageForm({ data, onChange, onLogoUpload }: SignageFormProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onChange({ ...data, [name]: value });
    };

    const processImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(URL.createObjectURL(file));
                    return;
                }
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Threshold for "white"
                const threshold = 240;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // If pixel is white or very light gray, make it transparent
                    if (r > threshold && g > threshold && b > threshold) {
                        data[i + 3] = 0; // Set alpha to 0
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Process image to remove white background
            const processedUrl = await processImage(file);
            onLogoUpload(file, processedUrl);
        }
    };

    return (
        <div className="space-y-4 p-4 bg-white rounded-lg shadow-md border">
            <h2 className="text-xl font-semibold mb-4">Company Details</h2>

            <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <input
                    type="text"
                    name="companyName"
                    value={data.companyName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    placeholder="Enter Company Name"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                    name="address"
                    value={data.address}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    placeholder="Enter Full Address"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">GSTIN (Optional)</label>
                    <input
                        type="text"
                        name="gstin"
                        value={data.gstin || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">CIN (Optional)</label>
                    <input
                        type="text"
                        name="cin"
                        value={data.cin || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Number (Optional)</label>
                <input
                    type="text"
                    name="mobile"
                    value={data.mobile || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Company Logo (Optional)</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </div>

            {/* Additional Text Fields */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Additional Text (Optional)</label>
                    <button
                        type="button"
                        onClick={() => {
                            const newText = [...(data.additionalText || []), ''];
                            onChange({ ...data, additionalText: newText });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        + Add Line
                    </button>
                </div>
                <div className="space-y-2">
                    {(data.additionalText || []).map((text, index) => (
                        <div key={index} className="flex gap-2">
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => {
                                    const newText = [...(data.additionalText || [])];
                                    newText[index] = e.target.value;
                                    onChange({ ...data, additionalText: newText });
                                }}
                                placeholder="e.g. Email, Website, Hindi Text"
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    const newText = (data.additionalText || []).filter((_, i) => i !== index);
                                    onChange({ ...data, additionalText: newText });
                                }}
                                className="text-red-500 hover:text-red-700 px-2"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
