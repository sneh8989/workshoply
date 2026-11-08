import React from 'react';
import { WorkshopCard } from './WorkshopCard';
import { WorkshopGridSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { ErrorState } from '../common/ErrorState';

export const WorkshopGrid = ({
  workshops = [],
  isLoading = false,
  error = null,
  onRetry,
  emptyActionText,
  onEmptyAction
}) => {
  if (isLoading) {
    return <WorkshopGridSkeleton count={6} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load workshops"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (!workshops || workshops.length === 0) {
    return (
      <EmptyState
        title="No workshops found"
        description="We couldn't find any workshops matching your active search criteria or filters."
        actionText={emptyActionText}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {workshops.map((workshop) => (
        <WorkshopCard key={workshop._id || workshop.slug} workshop={workshop} />
      ))}
    </div>
  );
};
