'use client';

import React, { useState, useEffect } from 'react';
import { X, Type, Image, Film, Music, Video, Link as LinkIcon } from 'lucide-react';
import { MediaBlock } from '@/types/gallery';

type BlockType = 'text' | 'image' | 'gif' | 'music' | 'video' | 'link';

interface BlockEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blockData: {
    type: BlockType;
    content: any;
  }) => void;
  editingBlock?: MediaBlock | null;
}

export function BlockEditor({ isOpen, onClose, onSave, editingBlock }: BlockEditorProps) {
  const [selectedType, setSelectedType] = useState<BlockType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Text block state
  const [text, setText] = useState('');
  const [isQuote, setIsQuote] = useState(false);
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  // URL-based blocks state
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');

  // Link block OG data
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [linkImage, setLinkImage] = useState('');

  const blockTypes = [
    { type: 'text' as BlockType, icon: Type, label: 'Text', description: 'Add formatted text or a quote' },
    { type: 'image' as BlockType, icon: Image, label: 'Image', description: 'Add an image from a URL' },
    { type: 'gif' as BlockType, icon: Film, label: 'GIF', description: 'Add an animated GIF' },
    { type: 'music' as BlockType, icon: Music, label: 'Music', description: 'Embed a Spotify track' },
    { type: 'video' as BlockType, icon: Video, label: 'Video', description: 'Embed a YouTube video' },
    { type: 'link' as BlockType, icon: LinkIcon, label: 'Link', description: 'Add a link with preview' },
  ];

  // Populate form when editing an existing block
  useEffect(() => {
    if (editingBlock && isOpen) {
      setSelectedType(editingBlock.type as BlockType);

      if (editingBlock.type === 'text') {
        const content = editingBlock.content as any;
        setText(content.text || '');
        setIsQuote(content.format === 'quote');
        setQuoteAuthor(content.author || '');
        setIsBold(content.styles?.bold || false);
        setIsItalic(content.styles?.italic || false);
        setIsUnderline(content.styles?.underline || false);
      } else if (editingBlock.type === 'image' || editingBlock.type === 'gif') {
        const content = editingBlock.content as any;
        setUrl(content.url || '');
      } else if (editingBlock.type === 'music') {
        const content = editingBlock.content as any;
        setUrl(content.originalUrl || '');
      } else if (editingBlock.type === 'video') {
        const content = editingBlock.content as any;
        setUrl(content.url || '');
      } else if (editingBlock.type === 'link') {
        const content = editingBlock.content as any;
        setUrl(content.url || '');
        setLinkTitle(content.title || '');
        setLinkDescription(content.description || '');
        setLinkImage(content.image || '');
      }
    }
  }, [editingBlock, isOpen]);

  const resetForm = () => {
    setSelectedType(null);
    setText('');
    setIsQuote(false);
    setQuoteAuthor('');
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setUrl('');
    setUrlError('');
    setLinkTitle('');
    setLinkDescription('');
    setLinkImage('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const convertSpotifyUrl = (url: string): string => {
    // Convert: open.spotify.com/track/ID → open.spotify.com/embed/track/ID
    return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
  };

  const convertYouTubeUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      // Handle youtube.com/watch?v=ID
      if (urlObj.hostname.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      // Handle youtu.be/ID
      if (urlObj.hostname === 'youtu.be') {
        const videoId = urlObj.pathname.slice(1);
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  const fetchOpenGraphData = async (url: string) => {
    try {
      const response = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
      if (response.ok) {
        const data = await response.json();
        setLinkTitle(data.title || '');
        setLinkDescription(data.description || '');
        setLinkImage(data.image || '');
      }
    } catch (error) {
      console.error('Failed to fetch OG data:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedType) return;

    setIsLoading(true);

    try {
      if (selectedType === 'text') {
        if (!text.trim()) {
          alert('Please enter some text');
          setIsLoading(false);
          return;
        }

        onSave({
          type: 'text',
          content: {
            text,
            format: isQuote ? 'quote' : 'normal',
            author: isQuote ? quoteAuthor : '',
            styles: {
              bold: isBold,
              italic: isItalic,
              underline: isUnderline,
            },
          },
        });
      } else if (selectedType === 'image' || selectedType === 'gif') {
        if (!validateUrl(url)) {
          setUrlError('Please enter a valid URL');
          setIsLoading(false);
          return;
        }

        onSave({
          type: selectedType,
          content: { url },
        });
      } else if (selectedType === 'music') {
        if (!validateUrl(url)) {
          setUrlError('Please enter a valid Spotify URL');
          setIsLoading(false);
          return;
        }

        if (!url.includes('spotify.com')) {
          setUrlError('Please enter a Spotify URL');
          setIsLoading(false);
          return;
        }

        const embedUrl = convertSpotifyUrl(url);

        onSave({
          type: 'music',
          content: {
            platform: 'spotify',
            embedUrl,
            originalUrl: url,
          },
        });
      } else if (selectedType === 'video') {
        if (!validateUrl(url)) {
          setUrlError('Please enter a valid YouTube URL');
          setIsLoading(false);
          return;
        }

        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
          setUrlError('Please enter a YouTube URL');
          setIsLoading(false);
          return;
        }

        const embedUrl = convertYouTubeUrl(url);

        onSave({
          type: 'video',
          content: {
            url: embedUrl,
            platform: 'youtube',
          },
        });
      } else if (selectedType === 'link') {
        if (!validateUrl(url)) {
          setUrlError('Please enter a valid URL');
          setIsLoading(false);
          return;
        }

        // Fetch OG data if not already fetched
        if (!linkTitle) {
          await fetchOpenGraphData(url);
        }

        onSave({
          type: 'link',
          content: {
            url,
            title: linkTitle,
            description: linkDescription,
            image: linkImage,
          },
        });
      }

      handleClose();
    } catch (error) {
      console.error('Error saving block:', error);
      alert('Failed to save block');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white opacity-100 shadow-2xl rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-foreground">
            {editingBlock
              ? `Edit ${selectedType?.charAt(0).toUpperCase()}${selectedType?.slice(1)}`
              : selectedType
                ? `Add ${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}`
                : 'Add Media Block'
            }
          </h2>
          <button
            onClick={handleClose}
            className="text-foreground/50 hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedType && !editingBlock ? (
            /* Type Selector */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {blockTypes.map(({ type, icon: Icon, label, description }) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-left"
                >
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{label}</h3>
                    <p className="text-sm text-foreground/60">{description}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : selectedType === 'text' ? (
            /* Text Block Form */
            <div className="space-y-4">
              {/* Formatting Toolbar */}
              <div className="flex gap-2 p-2 bg-gray-50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsBold(!isBold)}
                  className={`px-3 py-1 rounded ${isBold ? 'bg-gray-300' : 'bg-white'} border border-gray-300 font-bold hover:bg-gray-200 transition-colors`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => setIsItalic(!isItalic)}
                  className={`px-3 py-1 rounded ${isItalic ? 'bg-gray-300' : 'bg-white'} border border-gray-300 italic hover:bg-gray-200 transition-colors`}
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => setIsUnderline(!isUnderline)}
                  className={`px-3 py-1 rounded ${isUnderline ? 'bg-gray-300' : 'bg-white'} border border-gray-300 underline hover:bg-gray-200 transition-colors`}
                >
                  U
                </button>
              </div>

              {/* Text Input */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your text..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[150px] resize-y"
              />

              {/* Quote Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isQuote}
                  onChange={(e) => setIsQuote(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-foreground">Format as quote</span>
              </label>

              {/* Quote Author (appears when quote is checked) */}
              {isQuote && (
                <div>
                  <label htmlFor="quoteAuthor" className="block text-sm font-medium text-foreground mb-2">
                    Author (optional)
                  </label>
                  <input
                    type="text"
                    id="quoteAuthor"
                    value={quoteAuthor}
                    onChange={(e) => setQuoteAuthor(e.target.value)}
                    placeholder="Author name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Preview */}
              {text && (
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-foreground/60 mb-2">Preview:</p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {isQuote ? (
                      <blockquote className="border-l-4 border-gray-300 pl-4 py-2 italic text-foreground/80">
                        <p className={`whitespace-pre-wrap ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}>
                          {text}
                        </p>
                        {quoteAuthor && (
                          <footer className="mt-2 text-sm text-foreground/60 not-italic">
                            — {quoteAuthor}
                          </footer>
                        )}
                      </blockquote>
                    ) : (
                      <p className={`whitespace-pre-wrap ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''}`}>
                        {text}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* URL-based Block Forms */
            <div className="space-y-4">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-foreground mb-2">
                  {selectedType === 'music' && 'Spotify URL'}
                  {selectedType === 'video' && 'YouTube URL'}
                  {(selectedType === 'image' || selectedType === 'gif' || selectedType === 'link') && 'URL'}
                </label>
                <input
                  type="url"
                  id="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlError('');
                  }}
                  placeholder={
                    selectedType === 'music' ? 'https://open.spotify.com/track/...' :
                    selectedType === 'video' ? 'https://www.youtube.com/watch?v=...' :
                    'https://example.com/...'
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {urlError && (
                  <p className="text-sm text-red-600 mt-1">{urlError}</p>
                )}
              </div>

              {selectedType === 'link' && url && validateUrl(url) && (
                <button
                  type="button"
                  onClick={() => fetchOpenGraphData(url)}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Fetch link preview
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={() => {
              if (editingBlock) {
                handleClose();
              } else if (selectedType) {
                setSelectedType(null);
              } else {
                handleClose();
              }
            }}
            className="text-foreground/70 hover:text-foreground transition-colors"
          >
            {editingBlock ? 'Cancel' : (selectedType ? 'Back' : 'Cancel')}
          </button>
          {selectedType && (
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-foreground text-background px-6 py-2 rounded-lg font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading
                ? (editingBlock ? 'Saving...' : 'Adding...')
                : (editingBlock ? 'Save Changes' : 'Add Block')
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
