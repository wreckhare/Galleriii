'use client';

import { XCircle } from 'lucide-react';

interface MediaErrorFallbackProps {
  /** Media type for display message (e.g., "Image", "GIF", "Video") */
  mediaType: string;
}

/**
 * Fallback UI displayed when a media block fails to load.
 * Used by ImageBlock, GifBlock, VideoBlock, and MusicBlock.
 */
export function MediaErrorFallback({ mediaType }: MediaErrorFallbackProps) {
  return (
    <div className="bg-gray-100 border border-gray-300 p-8 flex flex-col items-center justify-center text-gray-500 min-h-[200px]">
      <XCircle className="w-12 h-12 mb-2" />
      <p className="text-sm">{mediaType} unavailable</p>
    </div>
  );
}
