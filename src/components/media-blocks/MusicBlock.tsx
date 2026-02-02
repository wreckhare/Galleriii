'use client';

import { useState } from 'react';
import { XCircle } from 'lucide-react';

interface MusicBlockProps {
  platform: 'spotify';
  embedUrl: string;
  originalUrl: string;
}

export function MusicBlock({ embedUrl }: MusicBlockProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

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
      {!isLoaded && (
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
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
      />
    </div>
  );
}
