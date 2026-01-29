'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Gallery } from '@/types/gallery';
import Link from 'next/link';
import { Eye, EyeOff, Copy, Check, Settings, Plus, Pencil } from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingGalleries, setLoadingGalleries] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function checkUser() {
      if (!user) return;

      try {
        // Check if user exists in our users table
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          // User doesn't exist in our database yet - redirect to settings
          console.log('User not found in database, redirecting to settings');
          router.push('/admin/settings');
        } else {
          setDbUser(data as User);
        }
      } catch (err) {
        console.error('Error checking user:', err);
        router.push('/admin/settings');
      } finally {
        setLoadingUser(false);
      }
    }

    if (!loading && user) {
      checkUser();
    } else if (!loading && !user) {
      // No user after loading completes - redirect to home
      router.push('/');
    }
  }, [user, loading, router, supabase]);

  // Load galleries
  useEffect(() => {
    async function loadGalleries() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('galleries')
          .select('*')
          .eq('user_id', user.id)
          .order('position', { ascending: true });

        if (error) {
          console.error('Error loading galleries:', error);
        } else {
          setGalleries((data as Gallery[]) || []);
        }
      } catch (err) {
        console.error('Error loading galleries:', err);
      } finally {
        setLoadingGalleries(false);
      }
    }

    if (!loading && user) {
      loadGalleries();
    }
  }, [user, loading, supabase]);

  const handleCreateGallery = async () => {
    if (!user || creating) return;

    setCreating(true);
    try {
      // Get the highest position for this user's galleries
      const { data: existingGalleries } = await supabase
        .from('galleries')
        .select('position')
        .eq('user_id', user.id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingGalleries && existingGalleries.length > 0
        ? existingGalleries[0].position + 1
        : 0;

      // Create the gallery with default title
      const { data: newGallery, error: insertError } = await supabase
        .from('galleries')
        .insert({
          user_id: user.id,
          title: '',
          position: nextPosition,
          is_hidden: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating gallery:', insertError);
        alert('Failed to create gallery');
        setCreating(false);
        return;
      }

      // Redirect to edit page
      router.push(`/admin/display/${newGallery.id}/edit`);
    } catch (err) {
      console.error('Error creating gallery:', err);
      alert('An unexpected error occurred');
      setCreating(false);
    }
  };

  const handleToggleVisibility = async (galleryId: string, currentIsHidden: boolean) => {
    if (togglingVisibility) return;

    setTogglingVisibility(galleryId);
    try {
      const newIsHidden = !currentIsHidden;

      const { error } = await supabase
        .from('galleries')
        .update({ is_hidden: newIsHidden })
        .eq('id', galleryId);

      if (error) {
        console.error('Error toggling visibility:', error);
        return;
      }

      setGalleries(galleries.map(g =>
        g.id === galleryId ? { ...g, is_hidden: newIsHidden } : g
      ));
    } catch (err) {
      console.error('Error toggling visibility:', err);
    } finally {
      setTogglingVisibility(null);
    }
  };

  if (loading || loadingUser || loadingGalleries) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !dbUser) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back,<br />
            {dbUser.display_name || dbUser.username}!
          </h1>
          <Link
            href="/admin/settings"
            className="p-2.5 rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-100 transition-colors -mr-0.5"
            aria-label="Settings"
          >
            <Settings className="w-7 h-7" />
          </Link>
        </div>

        {/* Public Gallery Link Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Your Public Gallery:</p>
              <a
                href={`/${dbUser.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground/60 hover:underline"
              >
                {typeof window !== 'undefined' ? window.location.host : 'galleriii.com'}/{dbUser.username}
              </a>
            </div>
            <button
              onClick={() => {
                const url = `${window.location.origin}/${dbUser.username}`;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2 text-foreground/50 hover:text-foreground transition-colors"
              aria-label="Copy URL"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Divider */}
        <hr className="border-gray-200 mb-4" />

        {/* Create New Collection Button */}
        <button
          onClick={handleCreateGallery}
          disabled={creating}
          className="w-full bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
        >
          <Plus className="w-5 h-5" />
          <span>{creating ? 'Creating...' : 'Create New Display'}</span>
        </button>

        {/* Collection List or Empty State */}
        {galleries.length > 0 ? (
          <div className="space-y-3">
            {galleries.map((gallery) => (
              <div
                key={gallery.id}
                className="bg-white rounded-lg border border-gray-200 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-foreground truncate">
                      {gallery.title}
                    </h3>
                    <p className="text-sm text-foreground/60">
                      Updated {new Date(gallery.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {/* Visibility Toggle */}
                    <button
                      onClick={() => handleToggleVisibility(gallery.id, gallery.is_hidden)}
                      disabled={togglingVisibility === gallery.id}
                      className="p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-gray-100 transition-colors disabled:opacity-50"
                      aria-label={gallery.is_hidden ? 'Make visible' : 'Hide collection'}
                    >
                      {gallery.is_hidden ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    {/* Edit Button */}
                    <Link
                      href={`/admin/display/${gallery.id}/edit`}
                      className="p-2 rounded-lg text-foreground/60 hover:text-foreground hover:bg-gray-100 transition-colors"
                      aria-label="Edit collection"
                    >
                      <Pencil className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Create your first collection!
              </h2>
              <p className="text-foreground/70 mb-6">
                Collections let you curate 1-3 media blocks to express yourself and showcase your aesthetic.
              </p>
              <button
                onClick={handleCreateGallery}
                disabled={creating}
                className="bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create New Collection'}
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-foreground/40">galleriii</p>
        </div>
      </div>
    </div>
  );
}
