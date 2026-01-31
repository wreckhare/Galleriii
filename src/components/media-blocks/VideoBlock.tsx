'use client';

import React, { useState } from 'react';
import { XCircle } from 'lucide-react';

interface VideoBlockProps {
  url: string;
  platform: 'youtube';
  onLoad?: () => void;
  isRevealed?: boolean;
}

export function VideoBlock({ url, onLoad, isRevealed = true }: VideoBlockProps) {
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
    return (
      <div className="bg-gray-100 border border-gray-300 p-8 flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
        <XCircle className="w-12 h-12 mb-2" />
        <p className="text-sm">Video unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video overflow-hidden">
      {/* Skeleton loader */}
      {!showContent && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}

      <iframe
        src={url}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={handleLoad}
        onError={handleError}
        className="absolute inset-0"
        style={{
          opacity: showContent ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
      />
    </div>
  );
}
