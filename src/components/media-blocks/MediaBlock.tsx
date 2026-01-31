import React from 'react';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { GifBlock } from './GifBlock';
import { MusicBlock } from './MusicBlock';
import { VideoBlock } from './VideoBlock';
import { LinkBlock } from './LinkBlock';
import { MediaBlock as MediaBlockType } from '@/types/gallery';

interface MediaBlockProps {
  block: MediaBlockType;
  onLoad?: () => void;
  isRevealed?: boolean;
}

export function MediaBlock({ block, onLoad, isRevealed }: MediaBlockProps) {
  switch (block.type) {
    case 'text':
      return <TextBlock {...(block.content as any)} onLoad={onLoad} isRevealed={isRevealed} />;

    case 'image':
      return <ImageBlock {...(block.content as any)} onLoad={onLoad} isRevealed={isRevealed} />;

    case 'gif':
      return <GifBlock {...(block.content as any)} onLoad={onLoad} isRevealed={isRevealed} />;

    case 'music':
      return <MusicBlock {...(block.content as any)} onLoad={onLoad} isRevealed={isRevealed} />;

    case 'video':
      return <VideoBlock {...(block.content as any)} onLoad={onLoad} isRevealed={isRevealed} />;

    case 'link':
      return <LinkBlock {...(block.content as any)} onLoad={onLoad} isRevealed={isRevealed} />;

    default:
      return (
        <div className="bg-gray-100 border border-gray-300 p-4 text-gray-500 text-center">
          <p className="text-sm">Unknown block type</p>
        </div>
      );
  }
}
