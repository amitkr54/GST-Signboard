import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  animated?: boolean;
  glass?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, animated = false, glass = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl transition-all duration-300',
        glass ? 'glass-panel' : 'bg-white border border-gray-100 shadow-sm',
        hover && 'hover:shadow-xl hover:-translate-y-1 hover:border-indigo-100 cursor-pointer',
        animated && 'animate-fade-in',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}
