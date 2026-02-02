'use client';

interface LinkBlockProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  noPreview?: boolean;
  largePreview?: boolean;
}

function formatDisplayUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Return domain + pathname + search, without protocol
    const path = parsed.pathname + parsed.search;
    return parsed.host + (path === '/' ? '' : path);
  } catch {
    return url;
  }
}

export function LinkBlock({ url, title, description, image, noPreview, largePreview }: LinkBlockProps) {
  // Minimal display: grey underlined text only
  if (noPreview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4 text-foreground/60 underline hover:text-foreground/80 transition-colors truncate"
      >
        {formatDisplayUrl(url)}
      </a>
    );
  }

  // Large preview - vertical layout (image top, text bottom)
  if (largePreview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200 w-full"
      >
        {image && (
          <div className="w-full aspect-video bg-gray-100">
            <img
              src={image}
              alt={title || 'Link preview'}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-4 min-w-0">
          {title && (
            <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-foreground/70 line-clamp-2 mb-2">
              {description}
            </p>
          )}
          <p className="text-xs text-foreground/50 truncate">{formatDisplayUrl(url)}</p>
        </div>
      </a>
    );
  }

  // Full preview card - horizontal layout (image left, text right)
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200"
    >
      {/* Image - left side */}
      {image && (
        <div className="w-44 h-28 flex-shrink-0 bg-gray-100">
          <img
            src={image}
            alt={title || 'Link preview'}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Text content - right side */}
      <div className="flex-1 p-4 min-w-0 flex flex-col justify-center">
        {title && (
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-foreground/70 line-clamp-2 mb-2">
            {description}
          </p>
        )}
        <p className="text-xs text-foreground/50 truncate">{formatDisplayUrl(url)}</p>
      </div>
    </a>
  );
}
