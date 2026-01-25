import React from 'react';

interface TextBlockProps {
  text: string;
  format?: 'normal' | 'quote';
  author?: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
  };
}

export function TextBlock({ text, format = 'normal', author, styles = {} }: TextBlockProps) {
  const baseClasses = 'text-foreground whitespace-pre-wrap';

  const styleClasses = [
    styles.bold && 'font-bold',
    styles.italic && 'italic',
    styles.underline && 'underline',
  ].filter(Boolean).join(' ');

  if (format === 'quote') {
    return (
      <blockquote className="border-l-4 border-gray-300 pl-4 py-2 italic text-foreground/80">
        <p className={`${baseClasses} ${styleClasses}`}>{text}</p>
        {author && (
          <footer className="mt-2 text-sm text-foreground/60 not-italic">
            — {author}
          </footer>
        )}
      </blockquote>
    );
  }

  return <p className={`${baseClasses} ${styleClasses}`}>{text}</p>;
}
