'use client';

import { MediaImageLoader } from './shared/MediaImageLoader';

interface GifBlockProps {
  url: string;
  alt?: string;
  onLoad?: () => void;
  isRevealed?: boolean;
}

export function GifBlock({ url, alt = 'Gallery GIF', onLoad, isRevealed }: GifBlockProps) {
  return <MediaImageLoader url={url} alt={alt} mediaType="GIF" onLoad={onLoad} isRevealed={isRevealed} />;
}
