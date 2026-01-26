'use client';

import React, { useState } from 'react';
import { XCircle } from 'lucide-react';

interface ImageBlockProps {
  url: string;
  alt?: string;
}

export function ImageBlock({ url, alt = 'Gallery image' }: ImageBlockProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div className="bg-gray-100 border border-gray-300 p-8 flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
        <XCircle className="w-12 h-12 mb-2" />
        <p className="text-sm">Image unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse min-h-[200px]" />
      )}
      <img
        src={url}
        alt={alt}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        className={`w-full h-auto ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </div>
  );
}
