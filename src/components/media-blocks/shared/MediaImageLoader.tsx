'use client';

import React, { useState } from 'react';
import { MediaErrorFallback } from './MediaErrorFallback';

interface MediaImageLoaderProps {
  url: string;
  alt: string;
  /** Media type for error message (e.g., "Image", "GIF") */
  mediaType: 'Image' | 'GIF';
  onLoad?: () => void;
  isRevealed?: boolean;
}

/**
 * Reusable image loader with loading state and error handling.
 * Used by ImageBlock and GifBlock.
 */
export function MediaImageLoader({ url, alt, mediaType, onLoad, isRevealed = true }: MediaImageLoaderProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onLoad?.(); // Still notify parent so it doesn't wait forever
  };

  // Show content when both loaded AND revealed
  const showContent = isLoaded && isRevealed;

  if (hasError) {
    return <MediaErrorFallback mediaType={mediaType} />;
  }

  return (
    <div className="relative w-full">
      {!showContent && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse min-h-[200px]" />
      )}
      <img
        src={url}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        className={`w-full h-auto ${showContent ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      />
    </div>
  );
}
