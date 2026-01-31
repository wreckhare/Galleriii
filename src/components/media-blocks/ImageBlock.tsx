'use client';

import { MediaImageLoader } from './shared/MediaImageLoader';

interface ImageBlockProps {
  url: string;
  alt?: string;
  onLoad?: () => void;
  isRevealed?: boolean;
}

export function ImageBlock({ url, alt = 'Gallery image', onLoad, isRevealed }: ImageBlockProps) {
  return <MediaImageLoader url={url} alt={alt} mediaType="Image" onLoad={onLoad} isRevealed={isRevealed} />;
}
