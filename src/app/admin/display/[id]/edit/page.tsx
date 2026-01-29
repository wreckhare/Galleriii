'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Gallery, User, MediaBlock } from '@/types/gallery';
import Link from 'next/link';
import { BlockEditor } from '@/components/media-blocks/BlockEditor';
import { ReorderableBlock } from '@/components/media-blocks/ReorderableBlock';
import { Eye, EyeOff, Undo2 } from 'lucide-react';
import { debounce } from '@/lib/utils/debounce';

export default function EditDisplay() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const galleryId = params.id as string;

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<MediaBlock | null>(null);
  const [saveIndicatorText, setSaveIndicatorText] = useState('Changes Save Automatically');
  const [saveChangesButtonText, setSaveChangesButtonText] = useState('Save Changes');
  const saveIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createClient();

  // Trigger save indicator animation
  const triggerSaveIndicator = useCallback(() => {
    if (saveIndicatorTimeoutRef.current) {
      clearTimeout(saveIndicatorTimeoutRef.current);
    }
    setSaveIndicatorText('Saving Changes...');
    saveIndicatorTimeoutRef.current = setTimeout(() => {
      setSaveIndicatorText('Changes Saved');
    }, 1500);
  }, []);

  // Move block up in the list
  const moveBlockUp = async (index: number) => {
    if (index === 0) return;

    const blockToMove = mediaBlocks[index];
    const blockAbove = mediaBlocks[index - 1];

    // Swap in local state
    const newBlocks = [...mediaBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
    const reorderedBlocks = newBlocks.map((block, i) => ({ ...block, position: i }));
    setMediaBlocks(reorderedBlocks);
    triggerSaveIndicator();

    // Delete both blocks and re-insert with swapped positions
    try {
      // Delete the two blocks being swapped
      const { error: deleteError1 } = await supabase
        .from('media_blocks')
        .delete()
        .eq('id', blockToMove.id);

      if (deleteError1) {
        console.error('Delete error 1:', deleteError1);
        return;
      }

      const { error: deleteError2 } = await supabase
        .from('media_blocks')
        .delete()
        .eq('id', blockAbove.id);

      if (deleteError2) {
        console.error('Delete error 2:', deleteError2);
        return;
      }

      // Re-insert with swapped positions
      const { error: insertError1 } = await supabase
        .from('media_blocks')
        .insert({
          id: blockToMove.id,
          gallery_id: blockToMove.gallery_id,
          type: blockToMove.type,
          position: index - 1,
          content: blockToMove.content,
        });

      if (insertError1) {
        console.error('Insert error 1:', insertError1);
      }

      const { error: insertError2 } = await supabase
        .from('media_blocks')
        .insert({
          id: blockAbove.id,
          gallery_id: blockAbove.gallery_id,
          type: blockAbove.type,
          position: index,
          content: blockAbove.content,
        });

      if (insertError2) {
        console.error('Insert error 2:', insertError2);
      }
    } catch (err) {
      console.error('Error swapping blocks:', err);
    }
  };

  // Move block down in the list
  const moveBlockDown = async (index: number) => {
    if (index === mediaBlocks.length - 1) return;

    const blockToMove = mediaBlocks[index];
    const blockBelow = mediaBlocks[index + 1];

    // Swap in local state
    const newBlocks = [...mediaBlocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    const reorderedBlocks = newBlocks.map((block, i) => ({ ...block, position: i }));
    setMediaBlocks(reorderedBlocks);
    triggerSaveIndicator();

    // Delete both blocks and re-insert with swapped positions
    try {
      // Delete the two blocks being swapped
      const { error: deleteError1 } = await supabase
        .from('media_blocks')
        .delete()
        .eq('id', blockToMove.id);

      if (deleteError1) {
        console.error('Delete error 1:', deleteError1);
        return;
      }

      const { error: deleteError2 } = await supabase
        .from('media_blocks')
        .delete()
        .eq('id', blockBelow.id);

      if (deleteError2) {
        console.error('Delete error 2:', deleteError2);
        return;
      }

      // Re-insert with swapped positions
      const { error: insertError1 } = await supabase
        .from('media_blocks')
        .insert({
          id: blockToMove.id,
          gallery_id: blockToMove.gallery_id,
          type: blockToMove.type,
          position: index + 1,
          content: blockToMove.content,
        });

      if (insertError1) {
        console.error('Insert error 1:', insertError1);
      }

      const { error: insertError2 } = await supabase
        .from('media_blocks')
        .insert({
          id: blockBelow.id,
          gallery_id: blockBelow.gallery_id,
          type: blockBelow.type,
          position: index,
          content: blockBelow.content,
        });

      if (insertError2) {
        console.error('Insert error 2:', insertError2);
      }
    } catch (err) {
      console.error('Error swapping blocks:', err);
    }
  };

  // Load gallery and user data
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      try {
        // Load user data
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userData) {
          setDbUser(userData as User);
        }

        // Load gallery
        const { data: galleryData, error: galleryError } = await supabase
          .from('galleries')
          .select('*')
          .eq('id', galleryId)
          .eq('user_id', user.id)
          .single();

        if (galleryError || !galleryData) {
          setError('Gallery not found');
          setLoading(false);
          return;
        }

        setGallery(galleryData as Gallery);

        // Load media blocks
        const { data: blocksData } = await supabase
          .from('media_blocks')
          .select('*')
          .eq('gallery_id', galleryId)
          .order('position', { ascending: true });

        if (blocksData) {
          setMediaBlocks(blocksData as MediaBlock[]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading gallery:', err);
        setError('Failed to load gallery');
        setLoading(false);
      }
    }

    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading, galleryId, supabase]);

  // Save gallery to database
  const saveGallery = useCallback(async (updates: Partial<Gallery>) => {
    if (!gallery) return;

    setSaving(true);
    triggerSaveIndicator();
    try {
      const { error: updateError } = await supabase
        .from('galleries')
        .update(updates)
        .eq('id', gallery.id);

      if (updateError) {
        console.error('Error saving gallery:', updateError);
      } else {
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error('Error saving gallery:', err);
    } finally {
      setSaving(false);
    }
  }, [gallery, supabase, triggerSaveIndicator]);

  // Debounced save
  const debouncedSave = useMemo(
    () => debounce(saveGallery, 1500),
    [saveGallery]
  );

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    if (!gallery) return;

    const updatedGallery = { ...gallery, title: newTitle };
    setGallery(updatedGallery);
    debouncedSave({ title: newTitle });
  };

  // Toggle visibility
  const toggleVisibility = async () => {
    if (!gallery) return;

    const newVisibility = !gallery.is_hidden;
    setGallery({ ...gallery, is_hidden: newVisibility });
    await saveGallery({ is_hidden: newVisibility });
  };

  // Delete gallery
  const handleDelete = async () => {
    if (!gallery) return;

    const confirmed = confirm('Are you sure you want to delete this gallery? This cannot be undone.');
    if (!confirmed) return;

    try {
      const { error: deleteError } = await supabase
        .from('galleries')
        .delete()
        .eq('id', gallery.id);

      if (deleteError) {
        alert('Failed to delete gallery');
        return;
      }

      router.push('/admin');
    } catch (err) {
      console.error('Error deleting gallery:', err);
      alert('Failed to delete gallery');
    }
  };

  // Add or update media block
  const handleSaveBlock = async (blockData: { type: string; content: any }) => {
    if (!gallery) return;

    try {
      if (editingBlock) {
        // Update existing block
        const { error: updateError } = await supabase
          .from('media_blocks')
          .update({
            type: blockData.type,
            content: blockData.content,
          })
          .eq('id', editingBlock.id);

        if (updateError) {
          console.error('Error updating block:', updateError);
          alert('Failed to update block');
          return;
        }

        // Update in state
        setMediaBlocks(
          mediaBlocks.map((block) =>
            block.id === editingBlock.id
              ? { ...block, type: blockData.type as any, content: blockData.content }
              : block
          )
        );
        setEditingBlock(null);
      } else {
        // Add new block
        if (mediaBlocks.length >= 3) return;

        const nextPosition = mediaBlocks.length;

        const { data: newBlock, error: insertError } = await supabase
          .from('media_blocks')
          .insert({
            gallery_id: gallery.id,
            type: blockData.type,
            position: nextPosition,
            content: blockData.content,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error adding block:', insertError);
          alert('Failed to add block');
          return;
        }

        // Add to state
        setMediaBlocks([...mediaBlocks, newBlock as MediaBlock]);
      }
    } catch (err) {
      console.error('Error saving block:', err);
      alert('Failed to save block');
    }
  };

  // Handle Save Changes button click
  const handleSaveChanges = () => {
    setSaveChangesButtonText('Saved!');
    setTimeout(() => {
      router.push('/admin');
    }, 750);
  };

  // Delete media block
  const handleDeleteBlock = async (blockId: string) => {
    const confirmed = confirm('Are you sure you want to delete this block?');
    if (!confirmed) return;

    try {
      const { error: deleteError } = await supabase
        .from('media_blocks')
        .delete()
        .eq('id', blockId);

      if (deleteError) {
        console.error('Error deleting block:', deleteError);
        alert('Failed to delete block');
        return;
      }

      // Remove from state and update positions
      const updatedBlocks = mediaBlocks
        .filter((block) => block.id !== blockId)
        .map((block, index) => ({ ...block, position: index }));

      setMediaBlocks(updatedBlocks);

      // Update positions in database
      for (const block of updatedBlocks) {
        await supabase
          .from('media_blocks')
          .update({ position: block.position })
          .eq('id', block.id);
      }
    } catch (err) {
      console.error('Error deleting block:', err);
      alert('Failed to delete block');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !gallery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Display Not Found</h2>
          <p className="text-foreground/70 mb-4">{error || 'This display does not exist or you do not have permission to view it.'}</p>
          <Link href="/admin" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Edit Display</h1>
            <p className="text-sm text-foreground/70 mt-1 h-5">
              {saveIndicatorText}
            </p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 border border-gray-300 rounded-lg text-foreground/70 hover:text-foreground hover:bg-gray-100 transition-colors"
            aria-label="Back to Dashboard"
          >
            <Undo2 className="w-6 h-6" />
          </Link>
        </div>

        {/* Gallery Title */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="title" className="block text-sm font-medium text-foreground">
                Display Title
              </label>
              <span className={`text-sm ${gallery.title.length >= 40 ? 'text-red-500' : 'text-foreground/60'}`}>
                {gallery.title.length}/40
              </span>
            </div>
            <input
              type="text"
              id="title"
              value={gallery.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              maxLength={40}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Untitled Display"
            />

            {/* Hide Title Checkbox */}
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={gallery.hide_title}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setGallery({ ...gallery, hide_title: newValue });
                  saveGallery({ hide_title: newValue });
                }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-foreground">Hide Title</span>
            </label>
          </div>
        </div>

        {/* Media Blocks Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Media Blocks</h2>
            <span className="text-sm text-foreground/60">{mediaBlocks.length} / 3</span>
          </div>

          {/* Media Blocks List */}
          {mediaBlocks.length > 0 ? (
            <div className="space-y-4 mb-4">
              {mediaBlocks.map((block, index) => (
                <ReorderableBlock
                  key={block.id}
                  block={block}
                  index={index}
                  totalBlocks={mediaBlocks.length}
                  onEdit={() => {
                    setEditingBlock(block);
                    setIsBlockEditorOpen(true);
                  }}
                  onDelete={() => handleDeleteBlock(block.id)}
                  onMoveUp={() => moveBlockUp(index)}
                  onMoveDown={() => moveBlockDown(index)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-foreground/60">
              <p>Add your first block to get started!</p>
            </div>
          )}

          {/* Add Block Button */}
          <button
            disabled={mediaBlocks.length >= 3}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-foreground/70 hover:border-gray-400 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setIsBlockEditorOpen(true)}
          >
            {mediaBlocks.length >= 3 ? 'Maximum 3 blocks reached' : '+ Add Media Block'}
          </button>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="space-y-4">
            {/* Visibility Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Display Visibility</h3>
                <p className="text-sm text-foreground/60">
                  {gallery.is_hidden ? 'This display is hidden from your public page' : 'This display is visible on your public page'}
                </p>
              </div>
              <button
                onClick={toggleVisibility}
                className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                aria-label={gallery.is_hidden ? 'Show gallery' : 'Hide gallery'}
              >
                {gallery.is_hidden ? (
                  <EyeOff className="w-6 h-6" />
                ) : (
                  <Eye className="w-6 h-6" />
                )}
              </button>
            </div>

            <hr className="border-gray-200" />

            {/* Delete Gallery */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-600">Delete Display</h3>
                <p className="text-sm text-foreground/60">
                  Permanently delete this display and all its blocks
                </p>
              </div>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Save Changes Button */}
        <button
          onClick={handleSaveChanges}
          className="w-full py-3 bg-[#000000] rounded-lg font-medium hover:bg-gray-900 transition-colors mt-6 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
        >
          {saveChangesButtonText}
          <Undo2 className="w-5 h-5" />
        </button>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-foreground/40">galleriii</p>
        </div>

        {/* Block Editor Modal */}
        <BlockEditor
          isOpen={isBlockEditorOpen}
          onClose={() => {
            setIsBlockEditorOpen(false);
            setEditingBlock(null);
          }}
          onSave={handleSaveBlock}
          editingBlock={editingBlock}
        />
      </div>
    </div>
  );
}
