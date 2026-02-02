'use client';

import { MediaImageLoader } from './shared/MediaImageLoader';

interface GifBlockProps {
  url: string;
  alt?: string;
}

export function GifBlock({ url, alt = 'Gallery GIF' }: GifBlockProps) {
  return <MediaImageLoader url={url} alt={alt} mediaType="GIF" />;
}
