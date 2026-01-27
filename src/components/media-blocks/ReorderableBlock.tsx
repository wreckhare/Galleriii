'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import { MediaBlock } from '@/types/gallery';
import { MediaBlock as MediaBlockComponent } from './MediaBlock';

interface ReorderableBlockProps {
  block: MediaBlock;
  index: number;
  totalBlocks: number;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * A media block wrapper with reorder controls (up/down arrows) and edit/delete actions.
 * Used in the gallery editor to display and manage individual blocks.
 */
export function ReorderableBlock({
  block,
  index,
  totalBlocks,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ReorderableBlockProps) {
  const isFirst = index === 0;
  const isLast = index === totalBlocks - 1;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex flex-row gap-1">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className={`p-1 ${
                isFirst
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Move up"
            >
              <ChevronUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className={`p-1 ${
                isLast
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Move down"
            >
              <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
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
