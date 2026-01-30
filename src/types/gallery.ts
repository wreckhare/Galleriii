// TypeScript types for Galleriii

export type MediaBlockType = 'text' | 'image' | 'gif' | 'music' | 'video' | 'link';

export interface User {
  id: string;
  username: string;
  display_name?: string;
  center_media_vertical?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Gallery {
  id: string;
  user_id: string;
  title: string;
  position: number;
  is_hidden: boolean;
  hide_title: boolean;
  created_at: string;
  updated_at: string;
}

export interface MediaBlock {
  id: string;
  gallery_id: string;
  type: MediaBlockType;
  position: number;
  content: MediaBlockContent;
  created_at: string;
  updated_at: string;
}

// Content types for different media blocks
export type MediaBlockContent =
  | TextBlockContent
  | ImageBlockContent
  | GifBlockContent
  | MusicBlockContent
  | VideoBlockContent
  | LinkBlockContent;

export interface TextBlockContent {
  text: string;
  format?: 'quote' | 'normal';
  // Stores formatting information for bold, italic, underline
  // Using Tiptap's HTML format
  html?: string;
}

export interface ImageBlockContent {
  url: string;
  alt?: string;
}

export interface GifBlockContent {
  url: string;
  alt?: string;
}

export interface MusicBlockContent {
  platform: 'spotify';
  embedUrl: string;
  originalUrl: string;
}

export interface VideoBlockContent {
  platform: 'youtube';
  embedUrl: string;
  originalUrl: string;
  videoId: string;
}

export interface LinkBlockContent {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  noPreview?: boolean;
  largePreview?: boolean;
}

// Gallery with populated media blocks
export interface GalleryWithBlocks extends Gallery {
  media_blocks: MediaBlock[];
}

// For creating/updating
export type CreateGalleryInput = Omit<Gallery, 'id' | 'created_at' | 'updated_at' | 'user_id'>;
export type UpdateGalleryInput = Partial<CreateGalleryInput>;

export type CreateMediaBlockInput = Omit<MediaBlock, 'id' | 'created_at' | 'updated_at'>;
export type UpdateMediaBlockInput = Partial<Omit<MediaBlock, 'id' | 'created_at' | 'updated_at' | 'gallery_id'>>;
