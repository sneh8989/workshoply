import React from 'react';
import { Calendar, Clock, MapPin, Video, ShieldCheck } from 'lucide-react';
import { formatPrice, formatDate, formatTime } from '../../utils/formatters';

export const BookingSummary = ({
  workshop,
  seatQuantity = 1,
  totalAmountInPaise
}) => {
  if (!workshop) return null;

  const calculatedTotal = totalAmountInPaise !== undefined
    ? totalAmountInPaise
    : workshop.priceInPaise * seatQuantity;

  const isOnline = workshop.deliveryMode === 'ONLINE';

  return (
    <div className="card-surface p-6 space-y-6">
      <h3 className="text-base font-bold text-main pb-3 border-b border-border">
        Reservation Summary
      </h3>

      {/* Workshop Mini Card */}
      <div className="flex gap-4">
        <img
          src={workshop.coverImage}
          alt={workshop.title}
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
            {workshop.category}
          </span>
          <h4 className="text-sm font-bold text-main line-clamp-2 leading-snug">
            {workshop.title}
          </h4>
          <p className="text-xs text-muted">
            Instructor: {workshop.instructor?.name}
          </p>
        </div>
      </div>

      {/* Schedule & Venue */}
      <div className="bg-background rounded-xl p-3.5 space-y-2 text-xs text-muted">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="font-medium text-main">{formatDate(workshop.startDateTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>{formatTime(workshop.startDateTime)} - {formatTime(workshop.endDateTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <>
              <Video className="w-3.5 h-3.5 text-accent" />
              <span>Online Masterclass</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-secondary" />
              <span>{workshop.venue?.address || workshop.venue?.city || 'Physical Venue'}</span>
            </>
          )}
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2.5 text-sm pt-2 border-t border-border">
        <div className="flex justify-between text-muted">
          <span>Price per seat</span>
          <span className="font-medium text-main">{formatPrice(workshop.priceInPaise, workshop.currency)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Seat Quantity</span>
          <span className="font-medium text-main">{seatQuantity} {seatQuantity === 1 ? 'seat' : 'seats'}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Platform & Tax fees</span>
          <span className="font-medium text-emerald-600">Included</span>
        </div>

        <div className="flex justify-between items-baseline pt-3 border-t border-border">
          <span className="text-base font-bold text-main">Total Payable</span>
          <span className="text-xl font-extrabold text-primary">
            {formatPrice(calculatedTotal, workshop.currency)}
          </span>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-muted pt-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span>Authoritative backend price calculation & Razorpay encrypted checkout.</span>
      </div>
    </div>
  );
};
