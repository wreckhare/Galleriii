import React from 'react';

interface TextBlockProps {
  text: string;
  format?: 'normal' | 'quote';
  author?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    alignment?: 'left' | 'center';
  };
}

export function TextBlock({ text, format = 'normal', author, sourceTitle, sourceUrl, styles = {} }: TextBlockProps) {
  const baseClasses = 'text-foreground whitespace-pre-wrap';

  const styleClasses = [
    styles.bold && 'font-bold',
    styles.italic && 'italic',
  ].filter(Boolean).join(' ');

  const alignmentClass = styles.alignment === 'center' ? 'text-center' : 'text-left';

  if (format === 'quote') {
    return (
      <blockquote className={`border-l-4 border-gray-300 pl-4 py-2 italic text-foreground/80 ${alignmentClass}`}>
        <p className={`${baseClasses} ${styleClasses}`}>{text}</p>
        {(author || sourceTitle) && (
          <footer className="mt-2 text-sm text-foreground/60 not-italic">
            {author && <>— {author}</>}
            {sourceTitle && (
              <>
                {author && ' '}
                [
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="italic text-blue-600 hover:text-blue-800"
                  >
                    {sourceTitle}
                  </a>
                ) : (
                  <span className="italic">{sourceTitle}</span>
                )}
                ]
              </>
            )}
          </footer>
        )}
      </blockquote>
    );
  }

  return <p className={`${baseClasses} ${styleClasses} ${alignmentClass}`}>{text}</p>;
}
