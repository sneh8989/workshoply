import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="card-surface max-w-md w-full p-8 shadow-card border border-border space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 text-secondary flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-4xl font-extrabold text-primary">404</span>
          <h1 className="text-xl font-bold text-main">Page Not Found</h1>
          <p className="text-xs text-muted leading-relaxed">
            The page you are looking for doesn't exist, was moved, or has an outdated link.
          </p>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <Link to="/" className="btn-primary text-xs flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Link>
          <Link to="/workshops" className="btn-outline text-xs">
            <span>Explore Workshops</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
