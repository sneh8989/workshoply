import React from 'react';

export const WorkshopCardSkeleton = () => (
  <div className="card-surface overflow-hidden animate-pulse">
    <div className="h-48 bg-stone-200"></div>
    <div className="p-5 space-y-3">
      <div className="flex justify-between items-center">
        <div className="h-4 w-20 bg-stone-200 rounded"></div>
        <div className="h-4 w-16 bg-stone-200 rounded"></div>
      </div>
      <div className="h-6 w-3/4 bg-stone-200 rounded"></div>
      <div className="h-4 w-full bg-stone-200 rounded"></div>
      <div className="h-4 w-2/3 bg-stone-200 rounded"></div>
      <div className="pt-4 border-t border-border flex justify-between items-center">
        <div className="h-5 w-24 bg-stone-200 rounded"></div>
        <div className="h-8 w-24 bg-stone-200 rounded-lg"></div>
      </div>
    </div>
  </div>
);

export const WorkshopGridSkeleton = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <WorkshopCardSkeleton key={i} />
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="w-full animate-pulse space-y-4">
    <div className="h-10 bg-stone-200 rounded"></div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="h-12 bg-stone-100 rounded flex gap-4 p-2">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="h-full bg-stone-200 rounded flex-1"></div>
        ))}
      </div>
    ))}
  </div>
);
