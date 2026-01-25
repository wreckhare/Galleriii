'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Gallery, User, MediaBlock } from '@/types/gallery';
import Link from 'next/link';
import { MediaBlock as MediaBlockComponent } from '@/components/media-blocks/MediaBlock';
import { BlockEditor } from '@/components/media-blocks/BlockEditor';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Sortable block component for drag-and-drop
function SortableBlock({
  block,
  index,
  onEdit,
  onDelete,
}: {
  block: MediaBlock;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded-lg overflow-hidden ${
        isDragging ? 'shadow-lg scale-[1.02] opacity-90 z-10' : ''
      }`}
    >
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-gray-600 touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </button>
          <span className="font-mono text-sm text-foreground/60">{index + 1}</span>
          <span className="font-medium text-foreground capitalize">{block.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            onClick={onEdit}
          >
            Edit
          </button>
          <button
            className="text-red-600 hover:text-red-700 text-sm font-medium"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="p-4">
        <MediaBlockComponent block={block} />
      </div>
    </div>
  );
}

export default function EditGallery() {
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
  const [copied, setCopied] = useState(false);
  const [isBlockEditorOpen, setIsBlockEditorOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<MediaBlock | null>(null);

  const supabase = createClient();

  // Setup drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering blocks
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = mediaBlocks.findIndex((block) => block.id === active.id);
      const newIndex = mediaBlocks.findIndex((block) => block.id === over.id);

      const reorderedBlocks = arrayMove(mediaBlocks, oldIndex, newIndex).map(
        (block, index) => ({ ...block, position: index })
      );

      // Update state immediately for smooth UX
      setMediaBlocks(reorderedBlocks);

      // Update positions in database
      try {
        for (const block of reorderedBlocks) {
          await supabase
            .from('media_blocks')
            .update({ position: block.position })
            .eq('id', block.id);
        }
      } catch (err) {
        console.error('Error updating block positions:', err);
      }
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
  }, [gallery, supabase]);

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

  // Copy link
  const handleCopyLink = async () => {
    if (!dbUser) return;

    const url = `${window.location.origin}/${dbUser.username}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          <h2 className="text-2xl font-bold text-foreground mb-2">Gallery Not Found</h2>
          <p className="text-foreground/70 mb-4">{error || 'This gallery does not exist or you do not have permission to view it.'}</p>
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
            <h1 className="text-3xl font-bold text-foreground">Edit Gallery</h1>
            <p className="text-foreground/70 mt-1">
              {saving ? 'Saving...' : lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'All changes auto-save'}
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-foreground/70 hover:text-foreground transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Gallery Title */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="title" className="block text-sm font-medium text-foreground">
                Gallery Title
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
              placeholder="Gallery title"
            />
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={mediaBlocks.map((block) => block.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4 mb-4">
                  {mediaBlocks.map((block, index) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      index={index}
                      onEdit={() => {
                        setEditingBlock(block);
                        setIsBlockEditorOpen(true);
                      }}
                      onDelete={() => handleDeleteBlock(block.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-8 text-foreground/60">
              <p>No media blocks yet. Add your first block to get started!</p>
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
                <h3 className="font-medium text-foreground">Gallery Visibility</h3>
                <p className="text-sm text-foreground/60">
                  {gallery.is_hidden ? 'This gallery is hidden from your public page' : 'This gallery is visible on your public page'}
                </p>
              </div>
              <button
                onClick={toggleVisibility}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  gallery.is_hidden
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {gallery.is_hidden ? 'Show' : 'Hide'}
              </button>
            </div>

            <hr className="border-gray-200" />

            {/* Copy Link */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Share Link</h3>
                <p className="text-sm text-foreground/60">
                  Copy your public gallery link
                </p>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            <hr className="border-gray-200" />

            {/* Delete Gallery */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-600">Delete Gallery</h3>
                <p className="text-sm text-foreground/60">
                  Permanently delete this gallery and all its blocks
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
