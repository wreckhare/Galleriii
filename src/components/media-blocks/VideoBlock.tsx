'use client';

import React, { useState } from 'react';
import { XCircle } from 'lucide-react';

interface VideoBlockProps {
  url: string;
  platform: 'youtube';
}

export function VideoBlock({ url }: VideoBlockProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
        <XCircle className="w-12 h-12 mb-2" />
        <p className="text-sm">Video unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
      <iframe
        src={url}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onError={() => setHasError(true)}
        className="absolute inset-0"
      />
    </div>
  );
}
