'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Gallery, User, MediaBlock } from '@/types/gallery';
import { MediaBlock as MediaBlockComponent } from '@/components/media-blocks/MediaBlock';
import { useAdaptiveCentering } from '@/hooks/useAdaptiveCentering';
import { Info, X } from 'lucide-react';

export default function PublicGalleryViewer() {
  const params = useParams();
  const username = params.username as string;

  const [user, setUser] = useState<User | null>(null);
  const [currentGallery, setCurrentGallery] = useState<Gallery | null>(null);
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [loadingNext, setLoadingNext] = useState(false);
  const [showInfoPopup, setShowInfoPopup] = useState(false);

  const supabase = createClient();

  // Adaptive centering for mobile
  const {
    headerRef,
    contentRef,
    footerRef,
    layoutMode,
    headerPadding,
    footerPadding,
    contentPadding,
  } = useAdaptiveCentering({});

  // Initialize session ID
  useEffect(() => {
    let id = localStorage.getItem('galleriii_sessionId');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('galleriii_sessionId', id);
    }
    setSessionId(id);
  }, []);

  // Load user and initial gallery
  useEffect(() => {
    async function loadUserAndGallery() {
      if (!sessionId) return;

      try {
        // Load user by username
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('username', username.toLowerCase())
          .single();

        if (userError || !userData) {
          setError('User not found');
          setLoading(false);
          return;
        }

        setUser(userData as User);

        // Load random gallery
        await loadRandomGallery(userData.id);
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Failed to load user');
        setLoading(false);
      }
    }

    loadUserAndGallery();
  }, [username, sessionId, supabase]);

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Load the next gallery in the shuffled sequence
  const loadRandomGallery = async (userId: string) => {
    try {
      // Fetch all non-hidden galleries (without media blocks)
      const { data: galleries, error: galleriesError } = await supabase
        .from('galleries')
        .select('*')
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .order('position', { ascending: true });

      if (galleriesError || !galleries || galleries.length === 0) {
        setError('No galleries available');
        setLoading(false);
        return;
      }

      const orderKey = `galleriii_order_${username}`;
      const indexKey = `galleriii_index_${username}`;

      // Get or create the shuffled order
      let shuffledIds: string[] = JSON.parse(localStorage.getItem(orderKey) || '[]');
      const currentGalleryIds = new Set(galleries.map(g => g.id));

      // Regenerate shuffled order if it's empty or galleries have changed
      const storedIdsSet = new Set(shuffledIds);
      const needsReshuffle = shuffledIds.length === 0 ||
        shuffledIds.length !== galleries.length ||
        !shuffledIds.every(id => currentGalleryIds.has(id)) ||
        !galleries.every(g => storedIdsSet.has(g.id));

      if (needsReshuffle) {
        shuffledIds = shuffleArray(galleries.map(g => g.id));
        localStorage.setItem(orderKey, JSON.stringify(shuffledIds));
        localStorage.setItem(indexKey, '0');
      }

      // Get current index
      const currentIndex = parseInt(localStorage.getItem(indexKey) || '0', 10);

      // Find the gallery at this index
      const targetGalleryId = shuffledIds[currentIndex];
      let targetGallery = galleries.find(g => g.id === targetGalleryId);

      if (!targetGallery) {
        // Fallback: pick first gallery if something went wrong
        targetGallery = galleries[0];
      }

      // Move index forward for next time (wraps around)
      const nextIndex = (currentIndex + 1) % shuffledIds.length;
      localStorage.setItem(indexKey, nextIndex.toString());

      // Now fetch media blocks for just this gallery
      const { data: blocks, error: blocksError } = await supabase
        .from('media_blocks')
        .select('*')
        .eq('gallery_id', targetGallery.id)
        .order('position', { ascending: true });

      if (blocksError) {
        console.error('Error loading media blocks:', blocksError);
      }

      // If this gallery has no blocks, try the next one
      if (!blocks || blocks.length === 0) {
        // Try to find another gallery with blocks
        for (let i = 0; i < shuffledIds.length; i++) {
          const altIndex = (currentIndex + i) % shuffledIds.length;
          const altGalleryId = shuffledIds[altIndex];
          const altGallery = galleries.find(g => g.id === altGalleryId);

          if (altGallery) {
            const { data: altBlocks } = await supabase
              .from('media_blocks')
              .select('*')
              .eq('gallery_id', altGallery.id)
              .order('position', { ascending: true });

            if (altBlocks && altBlocks.length > 0) {
              setCurrentGallery(altGallery as Gallery);
              setMediaBlocks(altBlocks as MediaBlock[]);
              setLoading(false);
              return;
            }
          }
        }

        setError('No galleries available');
        setLoading(false);
        return;
      }

      setCurrentGallery(targetGallery as Gallery);
      setMediaBlocks(blocks as MediaBlock[]);
      setLoading(false);
    } catch (err) {
      console.error('Error loading gallery:', err);
      setError('Failed to load gallery');
      setLoading(false);
    }
  };

  // Handle button click
  const handleNextClick = useCallback(async () => {
    if (!user || loadingNext) return;
    setLoadingNext(true);
    await loadRandomGallery(user.id);
    setLoadingNext(false);
  }, [user, loadingNext]);

  // Right arrow key navigation (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag !== 'input' && tag !== 'textarea') {
          handleNextClick();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextClick]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center">
        <div className="text-foreground/40 text-sm">Loading...</div>
        <p className="absolute bottom-8 text-sm font-medium text-foreground/20 tracking-wide">
          galleriii
        </p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-5xl font-light text-foreground/15 mb-6">
            {error === 'User not found' ? '404' : '!'}
          </h1>
          <p className="text-foreground/60 mb-2">{error || 'Something went wrong'}</p>
          {error === 'User not found' && (
            <p className="text-sm text-foreground/40">
              @{username} does not exist
            </p>
          )}
        </div>
        <p className="absolute bottom-8 text-sm font-medium text-foreground/20 tracking-wide">
          galleriii
        </p>
      </div>
    );
  }

  if (!currentGallery || mediaBlocks.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-lg font-medium text-foreground mb-2">No Galleries Yet</h1>
          <p className="text-foreground/50 text-sm">
            @{username} hasn't created any public galleries
          </p>
        </div>
        <p className="absolute bottom-8 text-sm font-medium text-foreground/20 tracking-wide">
          galleriii
        </p>
      </div>
    );
  }

  const shouldCenterVertically = user.center_media_vertical;

  // Header content (shared between both layouts)
  const headerContent = (
    <div className="flex items-center justify-between">
      <div>
        {!currentGallery.hide_title && currentGallery.title && (
          <h1 className="text-2xl font-semibold text-foreground leading-tight">
            {currentGallery.title}
          </h1>
        )}
        <p className={`text-sm text-foreground/50 ${!currentGallery.hide_title && currentGallery.title ? 'mt-2' : ''}`}>
          @{username}
        </p>
      </div>
      {/* Button container - holds both mobile info and desktop next buttons */}
      <div className="flex items-center gap-2">
        {/* Info button - mobile only */}
        <button
          onClick={() => setShowInfoPopup(true)}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border-2 border-foreground/20 bg-gradient-to-b from-white to-gray-100 shadow-[0_2px_0_0_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.8)] active:shadow-[0_0px_0_0_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.8)] active:translate-y-[2px] transition-all"
          aria-label="Gallery information"
        >
          <Info className="w-5 h-5 text-foreground/60" />
        </button>
        {/* Next button - desktop only, styled like a keyboard key */}
        <button
          onClick={handleNextClick}
          disabled={loadingNext}
          className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg border-2 border-foreground/20 bg-gradient-to-b from-white to-gray-100 shadow-[0_2px_0_0_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.8)] hover:from-gray-50 hover:to-gray-150 hover:border-foreground/30 active:shadow-[0_0px_0_0_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.8)] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Next gallery (→)"
        >
          {loadingNext ? (
            <span className="text-foreground/50 text-sm">...</span>
          ) : (
            <svg
              className="w-5 h-5 text-foreground/60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  // Media blocks content (shared between both layouts)
  const mediaContent = (
    <div className="space-y-6">
      {mediaBlocks.map((block) => (
        <div key={block.id} className="w-full">
          <MediaBlockComponent block={block} />
        </div>
      ))}
    </div>
  );

  // Footer content (shared between both layouts)
  const footerContent = (
    <a
      href="/"
      className="text-sm font-medium text-foreground/20 tracking-wide hover:text-foreground/40 transition-colors"
    >
      galleriii
    </a>
  );

  // Info popup for mobile users
  const infoPopup = showInfoPopup && (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
      onClick={() => setShowInfoPopup(false)}
    >
      <div
        className="rounded-xl shadow-2xl max-w-sm w-full p-6 relative"
        style={{ backgroundColor: '#FFFFFF' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setShowInfoPopup(false)}
          className="absolute top-4 right-4 text-foreground/50 hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-4 pr-6">
          <p className="text-foreground text-sm leading-relaxed">
            To see next gallery, pull down to refresh page
          </p>
          <p className="text-foreground/70 text-sm leading-relaxed">
            galleriii is a simple tool for simple curation
          </p>
          <p className="text-foreground/70 text-sm leading-relaxed">
            If you want to build a sharable gallery for yourself, send me (Austin) a message
          </p>
        </div>
      </div>
    </div>
  );

  // Adaptive viewport centering layout
  if (shouldCenterVertically) {
    // Centered mode - content fits on screen
    if (layoutMode === 'centered') {
      return (
        <div className="h-dvh bg-[#F9F8F6] flex flex-col overflow-hidden">
          {/* Header with dynamic padding */}
          <div
            ref={headerRef}
            className="flex-shrink-0"
            style={{ paddingTop: `${headerPadding}px` }}
          >
            <div className="max-w-2xl mx-auto px-6 md:px-8">
              {headerContent}
            </div>
          </div>

          {/* Content - centered in remaining space */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div
              ref={contentRef}
              className="max-w-2xl mx-auto px-6 md:px-8 w-full"
              style={{
                paddingTop: `${contentPadding}px`,
                paddingBottom: `${contentPadding}px`,
              }}
            >
              {mediaContent}
            </div>
          </div>

          {/* Footer with dynamic padding */}
          <div
            ref={footerRef}
            className="flex-shrink-0 flex justify-center"
            style={{ paddingBottom: `${footerPadding}px` }}
          >
            {footerContent}
          </div>
          {infoPopup}
        </div>
      );
    }

    // Scroll mode - content exceeds viewport, start at top
    return (
      <div className="min-h-dvh bg-[#F9F8F6]">
        {/* Header */}
        <div
          ref={headerRef}
          style={{ paddingTop: `${headerPadding}px` }}
        >
          <div className="max-w-2xl mx-auto px-6 md:px-8">
            {headerContent}
          </div>
        </div>

        {/* Content - no centering, flows from top */}
        <div
          ref={contentRef}
          className="max-w-2xl mx-auto px-6 md:px-8"
          style={{
            paddingTop: `${contentPadding}px`,
            paddingBottom: `${contentPadding}px`,
          }}
        >
          {mediaContent}
        </div>

        {/* Footer */}
        <div
          ref={footerRef}
          className="flex justify-center"
          style={{ paddingBottom: `${footerPadding}px` }}
        >
          {footerContent}
        </div>
        {infoPopup}
      </div>
    );
  }

  // Standard layout (non-centered)
  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <div className="max-w-2xl mx-auto px-6 md:px-8 w-full py-8">
        {/* Header */}
        <div className="mb-8">
          {headerContent}
        </div>

        {/* Media Blocks */}
        {mediaContent}

        {/* Footer Branding */}
        <div className="flex flex-col items-center mt-8 pb-4">
          {footerContent}
        </div>
      </div>
      {infoPopup}
    </div>
  );
}
