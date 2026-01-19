'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface WhatsAppQRCodeProps {
    phone: string;
}

export const WhatsAppQRCode = ({ phone }: WhatsAppQRCodeProps) => {
    const [qrSrc, setQrSrc] = useState<string>('');

    useEffect(() => {
        const generateQR = async () => {
            try {
                // WhatsApp URL format
                const waUrl = `https://wa.me/91${phone}`;
                const url = await QRCode.toDataURL(waUrl, {
                    width: 200,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#ffffff',
                    },
                });
                setQrSrc(url);
            } catch (err) {
                console.error('Error generating QR code:', err);
            }
        };
        generateQR();
    }, [phone]);

    if (!qrSrc) {
        return (
            <div className="w-32 h-32 md:w-40 md:h-40 bg-white/10 animate-pulse rounded-xl mx-auto" />
        );
    }

    return (
        <div className="bg-white p-3 rounded-xl inline-block mx-auto shadow-lg">
            <img
                src={qrSrc}
                alt="Scan to chat on WhatsApp"
                className="w-32 h-32 md:w-40 md:h-40"
            />
        </div>
    );
};
