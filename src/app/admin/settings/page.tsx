'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Undo2 } from 'lucide-react';

export default function Settings() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [centerMediaVertical, setCenterMediaVertical] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error || !data) {
          // New user - set up initial form
          setIsNewUser(true);
          setDisplayName(user.user_metadata?.full_name || '');
          setCenterMediaVertical(false);
        } else {
          setUsername(data.username);
          setDisplayName(data.display_name || '');
          setCenterMediaVertical(data.center_media_vertical || false);
          setIsNewUser(false);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setIsNewUser(true);
      }
    }

    if (!loading && user) {
      loadUser();
    }
  }, [user, loading, supabase]);

  const validateUsername = (value: string): string | null => {
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be 20 characters or less';
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return 'Username can only contain letters, numbers, hyphens, and underscores';
    }

    // Reserved usernames
    const reserved = ['admin', 'api', 'auth', 'settings', 'gallery'];
    if (reserved.includes(value.toLowerCase())) {
      return 'This username is reserved';
    }

    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validate username
      const validationError = validateUsername(username);
      if (validationError) {
        setError(validationError);
        setSaving(false);
        return;
      }

      if (isNewUser) {
        // Create new user record
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user!.id,
            username: username.toLowerCase(),
            display_name: displayName || null,
            center_media_vertical: centerMediaVertical,
          });

        if (insertError) {
          if (insertError.code === '23505') {
            // Unique violation
            setError('This username is already taken');
          } else {
            setError(insertError.message);
          }
          setSaving(false);
          return;
        }

        // Redirect to dashboard
        router.push('/admin');
      } else {
        // Update existing user
        const { error: updateError } = await supabase
          .from('users')
          .update({
            username: username.toLowerCase(),
            display_name: displayName || null,
            center_media_vertical: centerMediaVertical,
          })
          .eq('id', user!.id);

        if (updateError) {
          if (updateError.code === '23505') {
            setError('This username is already taken');
          } else {
            setError(updateError.message);
          }
          setSaving(false);
          return;
        }

        // Show "Saving..." for 0.5 seconds, then show "Changes Saved"
        await new Promise(resolve => setTimeout(resolve, 500));
        setSaving(false);
        setSaveSuccess(true);
        return;
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setError('An unexpected error occurred');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isNewUser ? 'Welcome to Galleriii!' : 'Settings'}
            </h1>
            <p className="text-foreground/70 mt-1">
              {isNewUser
                ? 'Choose your username to get started'
                : 'Manage your account settings'}
            </p>
          </div>
          {!isNewUser && (
            <Link
              href="/admin"
              className="px-4 py-2 border border-gray-300 rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-100 transition-colors"
              aria-label="Back to Dashboard"
            >
              <Undo2 className="w-6 h-6" />
            </Link>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                Username *
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setSaveSuccess(false); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-username"
                required
                disabled={saving}
              />
              <p className="text-sm text-foreground/60 mt-1">
                Your public URL will be: galleriii.vercel.app/{username || 'your-username'}
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-2">
                Display Name (optional)
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setSaveSuccess(false); }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your Name"
                disabled={saving}
              />
            </div>

            {/* Center Media on Public Gallery */}
            {!isNewUser && (
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={centerMediaVertical}
                    onChange={(e) => { setCenterMediaVertical(e.target.checked); setSaveSuccess(false); }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={saving}
                  />
                  <span className="text-sm font-medium text-foreground">
                    Center Media on Public Gallery
                  </span>
                </label>
                <p className="text-sm text-foreground/60 mt-1 ml-7">
                  Vertically centers media blocks on the viewing screen
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving || !username}
                className="bg-foreground text-background px-6 py-2 rounded-lg font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : isNewUser ? 'Continue' : saveSuccess ? 'Changes Saved' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

        {/* Sign Out */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={signOut}
            className="text-sm text-red-600 hover:text-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
