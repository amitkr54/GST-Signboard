'use client';

import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

// WhatsApp button component
interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
  variant?: 'primary' | 'secondary' | 'floating';
  text?: string;
  className?: string;
}

export function WhatsAppButton({
  phoneNumber = '919876543210',
  message = 'Hi, I need help designing my business signage',
  variant = 'primary',
  text = 'Chat on WhatsApp',
  className = ''
}: WhatsAppButtonProps) {

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={handleWhatsAppClick}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group",
          className
        )}
        title="Chat with us on WhatsApp"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
        <span className="absolute right-16 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Need help? Chat with us
        </span>
      </button>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        onClick={handleWhatsAppClick}
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-green-500 text-green-700 rounded-lg hover:bg-green-50 transition-colors font-medium",
          className
        )}
      >
        <MessageCircle className="w-5 h-5" />
        {text}
      </button>
    );
  }

  return (
    <button
      onClick={handleWhatsAppClick}
      className={cn(
        "flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg",
        className
      )}
    >
      <MessageCircle className="w-5 h-5 flex-shrink-0" />
      {text}
    </button>
  );
}
