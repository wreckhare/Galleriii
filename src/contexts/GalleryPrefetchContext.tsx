'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Gallery, MediaBlock } from '@/types/gallery';

interface PrefetchedGallery {
  gallery: Gallery;
  mediaBlocks: MediaBlock[];
  prefetchedAt: number;
}

type PrefetchStatus = 'pending' | 'success' | 'error';

interface GalleryPrefetchContextType {
  prefetchGallery: (galleryId: string) => void;
  getPrefetchedGallery: (galleryId: string) => PrefetchedGallery | null;
  clearPrefetchedGallery: (galleryId: string) => void;
  prefetchStatus: Record<string, PrefetchStatus>;
}

const GalleryPrefetchContext = createContext<GalleryPrefetchContextType | undefined>(undefined);

const PREFETCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHED_GALLERIES = 5;

export function GalleryPrefetchProvider({ children }: { children: React.ReactNode }) {
  const [prefetchedGalleries, setPrefetchedGalleries] = useState<Map<string, PrefetchedGallery>>(new Map());
  const [prefetchStatus, setPrefetchStatus] = useState<Record<string, PrefetchStatus>>({});
  const pendingRequests = useRef<Set<string>>(new Set());

  const supabase = createClient();

  const pruneCache = useCallback((currentMap: Map<string, PrefetchedGallery>) => {
    if (currentMap.size <= MAX_CACHED_GALLERIES) return currentMap;

    const entries = Array.from(currentMap.entries());
    entries.sort((a, b) => a[1].prefetchedAt - b[1].prefetchedAt);

    const newMap = new Map<string, PrefetchedGallery>();
    const toKeep = entries.slice(entries.length - MAX_CACHED_GALLERIES);
    toKeep.forEach(([id, data]) => newMap.set(id, data));

    return newMap;
  }, []);

  const prefetchGallery = useCallback((galleryId: string) => {
    // Prevent duplicate requests
    if (pendingRequests.current.has(galleryId)) return;

    // Check if already cached and not stale
    const existing = prefetchedGalleries.get(galleryId);
    if (existing && Date.now() - existing.prefetchedAt < PREFETCH_CACHE_TTL) {
      return;
    }

    pendingRequests.current.add(galleryId);
    setPrefetchStatus(prev => ({ ...prev, [galleryId]: 'pending' }));

    // Fetch gallery and media blocks in parallel
    Promise.all([
      supabase.from('galleries').select('*').eq('id', galleryId).single(),
      supabase.from('media_blocks').select('*').eq('gallery_id', galleryId).order('position', { ascending: true })
    ]).then(([galleryResult, blocksResult]) => {
      if (galleryResult.error || blocksResult.error) {
        setPrefetchStatus(prev => ({ ...prev, [galleryId]: 'error' }));
        return;
      }

      setPrefetchedGalleries(prev => {
        const newMap = new Map(prev);
        newMap.set(galleryId, {
          gallery: galleryResult.data as Gallery,
          mediaBlocks: (blocksResult.data as MediaBlock[]) || [],
          prefetchedAt: Date.now()
        });
        return pruneCache(newMap);
      });

      setPrefetchStatus(prev => ({ ...prev, [galleryId]: 'success' }));
    }).catch(() => {
      setPrefetchStatus(prev => ({ ...prev, [galleryId]: 'error' }));
    }).finally(() => {
      pendingRequests.current.delete(galleryId);
    });
  }, [supabase, prefetchedGalleries, pruneCache]);

  const getPrefetchedGallery = useCallback((galleryId: string): PrefetchedGallery | null => {
    const cached = prefetchedGalleries.get(galleryId);
    if (!cached) return null;

    // Check if stale
    if (Date.now() - cached.prefetchedAt > PREFETCH_CACHE_TTL) {
      return null;
    }

    return cached;
  }, [prefetchedGalleries]);

  const clearPrefetchedGallery = useCallback((galleryId: string) => {
    setPrefetchedGalleries(prev => {
      const newMap = new Map(prev);
      newMap.delete(galleryId);
      return newMap;
    });
  }, []);

  return (
    <GalleryPrefetchContext.Provider value={{
      prefetchGallery,
      getPrefetchedGallery,
      clearPrefetchedGallery,
      prefetchStatus
    }}>
      {children}
    </GalleryPrefetchContext.Provider>
  );
}

export function useGalleryPrefetch() {
  const context = useContext(GalleryPrefetchContext);
  if (context === undefined) {
    throw new Error('useGalleryPrefetch must be used within a GalleryPrefetchProvider');
  }
  return context;
}
