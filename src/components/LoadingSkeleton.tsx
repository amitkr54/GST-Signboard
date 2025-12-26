import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export function Skeleton({ 
  className = '', 
  variant = 'text',
  width,
  height,
  count = 1
}: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-lg';
      case 'text':
      default:
        return 'rounded h-4';
    }
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? '40px' : '100%'),
    height: height || (variant === 'circular' ? '40px' : undefined),
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`skeleton ${getVariantStyles()} ${className}`}
          style={style}
        />
      ))}
    </>
  );
}

interface CardSkeletonProps {
  showImage?: boolean;
}

export function CardSkeleton({ showImage = false }: CardSkeletonProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      {showImage && (
        <Skeleton variant="rectangular" height="200px" className="mb-4" />
      )}
      <Skeleton width="60%" className="mb-3" />
      <Skeleton width="100%" className="mb-2" />
      <Skeleton width="80%" />
    </div>
  );
}

interface FormSkeletonProps {
  fields?: number;
}

export function FormSkeleton({ fields = 3 }: FormSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <Skeleton width="30%" className="mb-2" />
          <Skeleton variant="rectangular" height="48px" />
        </div>
      ))}
    </div>
  );
}

export function PreviewSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <Skeleton width="150px" />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width="80px" height="32px" />
          <Skeleton variant="rectangular" width="80px" height="32px" />
        </div>
      </div>
      <Skeleton variant="rectangular" height="500px" />
    </div>
  );
}
