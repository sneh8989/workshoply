import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Calendar, Clock, MapPin, Video, CheckCircle2, QrCode } from 'lucide-react';
import { formatDate, formatTime, formatPrice } from '../../utils/formatters';
import { PaymentStatusBadge } from '../common/PaymentStatusBadge';

export const TicketModal = ({ booking, isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling while modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('ticket-modal-open');

    // Close on Escape key press
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('ticket-modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const workshop = booking.workshop || {};
  const isOnline = workshop.deliveryMode === 'ONLINE';

  const handlePrint = () => {
    window.print();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const modalContent = (
    <div
      id="ticket-modal-portal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-modal-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-primary/60 backdrop-blur-md overflow-hidden animate-fade-in print:p-0 print:bg-transparent print:static print:overflow-visible"
    >
      <div
        className="ticket-modal-card bg-surface rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-modal border border-border print:shadow-none print:border-none print:max-h-none print:overflow-visible my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 bg-primary text-white print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-secondary" />
            <span id="ticket-modal-title" className="font-bold text-sm">Official Workshoply Ticket</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface/10 hover:bg-surface/20 text-xs font-semibold transition"
              aria-label="Print Ticket"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Ticket
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface/10 text-stone-300 hover:text-white transition"
              aria-label="Close Ticket Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 print:p-0 print:overflow-visible">
          {/* Top Brand & Status */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <span className="text-xl font-extrabold tracking-tight text-primary">
                Workshop<span className="text-secondary">ly</span>
              </span>
              <p className="text-xs text-muted">Booking Confirmation & Admission Pass</p>
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold text-muted">Status</span>
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>
          </div>

          {/* Workshop Details */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              {workshop.category}
            </span>
            <h3 className="text-lg font-bold text-main mt-0.5 mb-2 leading-snug">
              {workshop.title}
            </h3>
            <p className="text-xs text-muted">
              Led by <span className="font-semibold text-main">{workshop.instructor?.name}</span>
            </p>
          </div>

          {/* Schedule & Venue Grid */}
          <div className="grid grid-cols-2 gap-4 bg-background p-4 rounded-xl text-xs">
            <div>
              <span className="text-muted block mb-1">Date & Time</span>
              <div className="font-semibold text-main space-y-0.5">
                <p className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {formatDate(workshop.startDateTime)}
                </p>
                <p className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  {formatTime(workshop.startDateTime)} - {formatTime(workshop.endDateTime)}
                </p>
              </div>
            </div>

            <div>
              <span className="text-muted block mb-1">Location / Format</span>
              <div className="font-semibold text-main">
                {isOnline ? (
                  <p className="flex items-center gap-1 text-accent">
                    <Video className="w-3.5 h-3.5" />
                    Online Masterclass
                  </p>
                ) : (
                  <p className="flex items-center gap-1 text-main">
                    <MapPin className="w-3.5 h-3.5 text-secondary" />
                    {workshop.venue?.address || workshop.venue?.city || 'Venue'}
                  </p>
                )}
                {isOnline && workshop.venue?.meetingLink && (
                  <p className="text-[11px] text-muted truncate mt-1">
                    Link: {workshop.venue.meetingLink}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div>
            <h4 className="text-xs font-bold text-main uppercase tracking-wider mb-2">
              Registered Attendees ({booking.seatQuantity} {booking.seatQuantity === 1 ? 'seat' : 'seats'})
            </h4>
            <div className="border border-border rounded-xl divide-y divide-border text-xs">
              {booking.attendeeDetails?.map((att, i) => (
                <div key={i} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-main">{att.name}</p>
                    <p className="text-muted">{att.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600">
                    Seat #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Footer & Reference */}
          <div className="flex items-center justify-between pt-4 border-t border-dashed border-border">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted">Booking Reference</span>
              <p className="font-mono text-base font-extrabold text-primary tracking-wider">
                {booking.bookingRef}
              </p>
              {booking.razorpayPaymentId && (
                <p className="text-[10px] font-mono text-muted">
                  Razorpay ID: {booking.razorpayPaymentId}
                </p>
              )}
            </div>

            {/* QR Code Graphic Placeholder */}
            <div className="flex flex-col items-center">
              <div className="p-2 border border-border rounded-lg bg-surface">
                <QrCode className="w-14 h-14 text-primary" />
              </div>
              <span className="text-[10px] text-muted mt-1">Scan at check-in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};
