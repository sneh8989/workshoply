import React from 'react';
import { SearchX, CalendarX, Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = SearchX,
  title = 'No results found',
  description = 'Try adjusting your search terms or filters to find what you are looking for.',
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-surface border border-dashed border-border rounded-2xl max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-muted mb-4">
        <Icon className="w-7 h-7 text-muted" />
      </div>
      <h3 className="text-lg font-bold text-main mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="btn-outline text-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
