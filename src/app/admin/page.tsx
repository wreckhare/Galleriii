'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Gallery } from '@/types/gallery';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingGalleries, setLoadingGalleries] = useState(true);
  const [creating, setCreating] = useState(false);
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
          title: 'Untitled Gallery',
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
      router.push(`/admin/gallery/${newGallery.id}/edit`);
    } catch (err) {
      console.error('Error creating gallery:', err);
      alert('An unexpected error occurred');
      setCreating(false);
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {dbUser.display_name || dbUser.username}!
            </h1>
            <p className="text-foreground/70 mt-1">
              Manage your galleries
            </p>
          </div>
          <Link
            href="/admin/settings"
            className="text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            Settings
          </Link>
        </div>

        {/* Gallery List or Empty State */}
        {galleries.length > 0 ? (
          <>
            {/* Create New Button */}
            <div className="mb-6">
              <button
                onClick={handleCreateGallery}
                disabled={creating}
                className="bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : '+ Create New Gallery'}
              </button>
            </div>

            {/* Galleries Grid */}
            <div className="grid gap-4">
              {galleries.map((gallery) => (
                <div
                  key={gallery.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground mb-1">
                        {gallery.title}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-foreground/60">
                        <span>
                          {gallery.is_hidden ? (
                            <span className="text-gray-500">Hidden</span>
                          ) : (
                            <span className="text-green-600">Visible</span>
                          )}
                        </span>
                        <span>•</span>
                        <span>
                          Updated {new Date(gallery.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/gallery/${gallery.id}/edit`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-foreground mb-3">
                Create your first gallery!
              </h2>
              <p className="text-foreground/70 mb-6">
                Galleries let you curate 1-3 media blocks to express yourself and showcase your aesthetic.
              </p>
              <button
                onClick={handleCreateGallery}
                disabled={creating}
                className="bg-foreground text-background px-6 py-3 rounded-lg font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create New Gallery'}
              </button>
            </div>
          </div>
        )}

        {/* Public URL */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Your public gallery:</strong>{' '}
            <a
              href={`/${dbUser.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-700"
            >
              {typeof window !== 'undefined' ? window.location.origin : ''}/{dbUser.username}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
