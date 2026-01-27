'use client';

import React, { useState } from 'react';
import { MediaErrorFallback } from './MediaErrorFallback';

interface MediaImageLoaderProps {
  url: string;
  alt: string;
  /** Media type for error message (e.g., "Image", "GIF") */
  mediaType: 'Image' | 'GIF';
}

/**
 * Reusable image loader with loading state and error handling.
 * Used by ImageBlock and GifBlock.
 */
export function MediaImageLoader({ url, alt, mediaType }: MediaImageLoaderProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return <MediaErrorFallback mediaType={mediaType} />;
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
