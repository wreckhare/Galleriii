# Media Blocks Component Library

Core content units in Galleriii galleries. Each gallery can have 1-3 blocks of different types.

## Block Types

| Type | Component | Content Source | Notes |
|------|-----------|----------------|-------|
| text | TextBlock | User input | Supports bold/italic/underline, quote mode with author |
| image | ImageBlock | URL | Uses shared MediaImageLoader |
| gif | GifBlock | URL | Uses shared MediaImageLoader |
| music | MusicBlock | Spotify URL | Auto-converts to embed URL |
| video | VideoBlock | YouTube URL | Auto-converts to embed URL |
| link | LinkBlock | URL | Fetches Open Graph metadata via /api/og |

## File Structure

```
media-blocks/
├── MediaBlock.tsx       # Router - renders correct block type
├── BlockEditor.tsx      # Modal for creating/editing blocks
├── ReorderableBlock.tsx # Block wrapper with reorder controls
├── TextBlock.tsx
├── ImageBlock.tsx
├── GifBlock.tsx
├── MusicBlock.tsx
├── VideoBlock.tsx
├── LinkBlock.tsx
└── shared/
    ├── MediaErrorFallback.tsx  # Error state UI
    └── MediaImageLoader.tsx    # Image loading with skeleton
```

## Adding a New Block Type

1. Create component: `src/components/media-blocks/NewBlock.tsx`
2. Add type to `src/types/gallery.ts` MediaBlockType union
3. Add case to `MediaBlock.tsx` switch statement
4. Add form section in `BlockEditor.tsx`:
   - Add to `blockTypes` array
   - Add form UI in the conditional rendering
   - Handle save in `handleSave` function

## Shared Components

### MediaErrorFallback
Standard error UI when media fails to load.
```tsx
<MediaErrorFallback mediaType="Image" />
```

### MediaImageLoader
Handles image loading state and errors.
```tsx
<MediaImageLoader url={url} alt={alt} mediaType="Image" />
```

## URL Utilities

Located in `src/lib/utils/mediaEmbed.ts`:
- `convertSpotifyUrl(url)` - Converts Spotify share URL to embed URL
- `convertYouTubeUrl(url)` - Converts YouTube watch URL to embed format
- `validateUrl(url)` / `isValidUrl(url)` - URL validation
- `getDomainFromUrl(url)` - Extract domain for display
