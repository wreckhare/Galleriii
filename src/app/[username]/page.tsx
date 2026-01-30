'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Gallery, User, MediaBlock } from '@/types/gallery';
import { MediaBlock as MediaBlockComponent } from '@/components/media-blocks/MediaBlock';

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

  const supabase = createClient();

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
      // Fetch all non-hidden galleries with their media blocks
      const { data: galleriesWithBlocks, error: galleriesError } = await supabase
        .from('galleries')
        .select(`
          *,
          media_blocks(id)
        `)
        .eq('user_id', userId)
        .eq('is_hidden', false)
        .order('position', { ascending: true });

      if (galleriesError || !galleriesWithBlocks) {
        setError('No galleries available');
        setLoading(false);
        return;
      }

      // Filter out galleries that have no media blocks
      const galleries = galleriesWithBlocks.filter(
        g => g.media_blocks && g.media_blocks.length > 0
      );

      if (galleries.length === 0) {
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
      let nextGallery = galleries.find(g => g.id === shuffledIds[currentIndex]);

      if (!nextGallery) {
        // Fallback: pick first gallery if something went wrong
        nextGallery = galleries[0];
      }

      // Move index forward for next time (wraps around)
      const nextIndex = (currentIndex + 1) % shuffledIds.length;
      localStorage.setItem(indexKey, nextIndex.toString());

      setCurrentGallery(nextGallery as Gallery);

      // Load media blocks for this gallery
      const { data: blocks } = await supabase
        .from('media_blocks')
        .select('*')
        .eq('gallery_id', nextGallery.id)
        .order('position', { ascending: true });

      setMediaBlocks((blocks as MediaBlock[]) || []);
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

  return (
    <div className={`min-h-screen bg-[#F9F8F6] ${shouldCenterVertically ? 'flex flex-col' : ''}`}>
      <div className={`max-w-2xl mx-auto px-6 md:px-8 w-full ${shouldCenterVertically ? 'flex flex-col flex-1' : 'py-8'}`}>
        {/* Header with title and Next button */}
        <div className={`flex items-center justify-between mb-8 ${shouldCenterVertically ? 'pt-8' : ''}`}>
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

        {/* Media Blocks - centered vertically when setting enabled */}
        <div className={shouldCenterVertically ? 'flex-1 flex flex-col justify-center' : ''}>
          <div className="space-y-6">
            {mediaBlocks.map((block) => (
              <div key={block.id} className="w-full">
                <MediaBlockComponent block={block} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Branding */}
        <div className={`flex flex-col items-center ${shouldCenterVertically ? 'pb-8' : 'mt-8 pb-4'}`}>
          <a
            href="/"
            className="text-sm font-medium text-foreground/20 tracking-wide hover:text-foreground/40 transition-colors"
          >
            galleriii
          </a>
        </div>
      </div>
    </div>
  );
}
