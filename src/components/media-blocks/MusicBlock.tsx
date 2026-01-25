'use client';

import React, { useState } from 'react';
import { XCircle } from 'lucide-react';

interface MusicBlockProps {
  platform: 'spotify';
  embedUrl: string;
  originalUrl: string;
}

export function MusicBlock({ embedUrl }: MusicBlockProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
        <XCircle className="w-12 h-12 mb-2" />
        <p className="text-sm">Music unavailable</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden">
      <iframe
        src={embedUrl}
        width="100%"
        height="152"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        onError={() => setHasError(true)}
        className="rounded-lg"
      />
    </div>
  );
}
