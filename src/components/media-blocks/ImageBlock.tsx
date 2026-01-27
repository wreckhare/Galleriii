'use client';

import { MediaImageLoader } from './shared/MediaImageLoader';

interface ImageBlockProps {
  url: string;
  alt?: string;
}

export function ImageBlock({ url, alt = 'Gallery image' }: ImageBlockProps) {
  return <MediaImageLoader url={url} alt={alt} mediaType="Image" />;
}
