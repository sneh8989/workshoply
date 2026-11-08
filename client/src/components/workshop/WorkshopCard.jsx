import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Video, Users } from 'lucide-react';
import { AvailabilityBadge } from '../common/AvailabilityBadge';
import { PriceDisplay } from '../common/PriceDisplay';
import { RatingDisplay } from '../common/RatingDisplay';
import { formatDate, formatTime } from '../../utils/formatters';

export const WorkshopCard = ({ workshop }) => {
  if (!workshop) return null;

  const isOnline = workshop.deliveryMode === 'ONLINE';

  return (
    <article className="card-surface overflow-hidden group hover:shadow-card-hover flex flex-col h-full">
      {/* Cover Image & Badges */}
      <div className="relative h-48 overflow-hidden bg-stone-100">
        <img
          src={workshop.coverImage}
          alt={workshop.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-surface/90 backdrop-blur-sm text-primary shadow-sm">
            {workshop.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <AvailabilityBadge
            state={workshop.availabilityState}
            availableSeats={workshop.availableSeats}
          />
        </div>
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/80 backdrop-blur-sm text-white">
            {isOnline ? <Video className="w-3.5 h-3.5 text-accent" /> : <MapPin className="w-3.5 h-3.5 text-secondary" />}
            {isOnline ? 'Online Masterclass' : (workshop.venue?.city || 'In-Person')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Schedule Info */}
          <div className="flex items-center gap-3 text-xs text-muted mb-2.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(workshop.startDateTime)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(workshop.startDateTime)}
            </span>
          </div>

          {/* Title */}
          <Link to={`/workshops/${workshop.slug || workshop._id}`}>
            <h3 className="font-bold text-base text-main group-hover:text-secondary transition-colors line-clamp-2 leading-snug mb-2">
              {workshop.title}
            </h3>
          </Link>

          {/* Description snippet */}
          <p className="text-xs text-muted line-clamp-2 mb-4 leading-relaxed">
            {workshop.shortDescription}
          </p>
        </div>

        <div>
          {/* Instructor and Rating */}
          <div className="flex items-center justify-between py-3 border-t border-border">
            <div className="flex items-center gap-2">
              <img
                src={workshop.instructor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={workshop.instructor?.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
              />
              <span className="text-xs font-medium text-main truncate max-w-[120px]">
                {workshop.instructor?.name}
              </span>
            </div>
            <RatingDisplay
              rating={workshop.ratingAverage}
              count={workshop.ratingCount}
            />
          </div>

          {/* Price & Action */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Tuition</span>
              <PriceDisplay priceInPaise={workshop.priceInPaise} currency={workshop.currency} />
            </div>

            <Link
              to={`/workshops/${workshop.slug || workshop._id}`}
              className="btn-primary text-xs px-3.5 py-1.5"
            >
              Explore Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};
