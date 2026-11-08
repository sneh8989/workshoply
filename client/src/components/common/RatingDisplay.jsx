import React from 'react';
import { Star } from 'lucide-react';

export const RatingDisplay = ({ rating = 0, count, showCount = true, size = 'sm' }) => {
  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  const textSize = size === 'lg' ? 'text-base font-bold' : 'text-xs font-semibold';

  return (
    <div className="inline-flex items-center gap-1 text-amber-500">
      <Star className={`${iconSize} fill-amber-400 text-amber-400`} />
      <span className={`${textSize} text-main`}>{Number(rating).toFixed(1)}</span>
      {showCount && count !== undefined && (
        <span className="text-xs text-muted font-normal">({count})</span>
      )}
    </div>
  );
};
