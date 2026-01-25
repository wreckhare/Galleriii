'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Gallery, User, MediaBlock } from '@/types/gallery';
import { MediaBlock as MediaBlockComponent } from '@/components/media-blocks/MediaBlock';
import PullToRefresh from 'react-pull-to-refresh';
import { RefreshCw } from 'lucide-react';

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
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

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
      // Fetch all non-hidden galleries
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

  // Handle pull-to-refresh
  const handlePullRefresh = async () => {
    if (!user || isPullRefreshing) return;
    setIsPullRefreshing(true);
    await loadRandomGallery(user.id);
    setIsPullRefreshing(false);
  };

  // Handle button click
  const handleNextClick = async () => {
    if (!user || loadingNext) return;
    setLoadingNext(true);
    await loadRandomGallery(user.id);
    setLoadingNext(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center">
        <div className="text-foreground text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {error === 'User not found' ? '404' : 'Error'}
          </h1>
          <p className="text-foreground/70 mb-4">{error || 'Something went wrong'}</p>
          {error === 'User not found' && (
            <p className="text-sm text-foreground/50">
              The user @{username} does not exist
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!currentGallery || mediaBlocks.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">No Galleries Yet</h1>
          <p className="text-foreground/70">
            @{username} hasn't created any public galleries yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <PullToRefresh onRefresh={handlePullRefresh} resistance={3}>
        {/* Loading spinner for pull-to-refresh */}
        {isPullRefreshing && (
          <div className="flex justify-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin text-foreground/50" />
          </div>
        )}
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Gallery Title */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {currentGallery.title}
            </h1>
            <p className="text-sm text-foreground/50">@{username}</p>
          </div>

          {/* Media Blocks */}
          <div className="space-y-6">
            {mediaBlocks.map((block) => (
              <div key={block.id} className="w-full">
                <MediaBlockComponent block={block} />
              </div>
            ))}
          </div>

          {/* Next Gallery Button */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <button
              onClick={handleNextClick}
              disabled={loadingNext}
              className="bg-foreground text-background px-8 py-3 rounded-lg font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Next Gallery
            </button>
            <p className="text-sm text-foreground/40">
              or pull down to refresh
            </p>
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}
