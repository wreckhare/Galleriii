'use client';

import React, { useState } from 'react';
import { XCircle } from 'lucide-react';

interface MusicBlockProps {
  platform: 'spotify';
  embedUrl: string;
  originalUrl: string;
  onLoad?: () => void;
  isRevealed?: boolean;
}

export function MusicBlock({ embedUrl, onLoad, isRevealed = true }: MusicBlockProps) {
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
      <div className="bg-gray-100 border border-gray-300 p-8 flex flex-col items-center justify-center text-gray-500 min-h-[152px]">
        <XCircle className="w-12 h-12 mb-2" />
        <p className="text-sm">Music unavailable</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden relative">
      {/* Skeleton loader */}
      {!showContent && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse rounded"
          style={{ height: '152px' }}
        />
      )}

      <iframe
        src={embedUrl}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="eager"
        onLoad={handleLoad}
        onError={handleError}
        style={{
          opacity: showContent ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
      />
    </div>
  );
}
