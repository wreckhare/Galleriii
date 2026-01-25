'use client';

import React, { useState } from 'react';
import { XCircle } from 'lucide-react';

interface GifBlockProps {
  url: string;
  alt?: string;
}

export function GifBlock({ url, alt = 'Gallery GIF' }: GifBlockProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
        <XCircle className="w-12 h-12 mb-2" />
        <p className="text-sm">GIF unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-lg min-h-[200px]" />
      )}
      <img
        src={url}
        alt={alt}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        className={`w-full h-auto rounded-lg ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
      />
    </div>
  );
}
