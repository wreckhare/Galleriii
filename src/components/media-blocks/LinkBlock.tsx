'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

interface LinkBlockProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
}

export function LinkBlock({ url, title, description, image }: LinkBlockProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200"
    >
      {image && (
        <div className="w-full h-48 bg-gray-100 overflow-hidden">
          <img
            src={image}
            alt={title || 'Link preview'}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="font-semibold text-foreground mb-1 truncate">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-foreground/70 line-clamp-2 mb-2">
                {description}
              </p>
            )}
            <p className="text-xs text-foreground/50 truncate">{url}</p>
          </div>
          <ExternalLink className="w-4 h-4 text-foreground/50 flex-shrink-0 mt-1" />
        </div>
      </div>
    </a>
  );
}
