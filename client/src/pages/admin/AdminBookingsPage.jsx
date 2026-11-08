import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/admin.api';
import { PaymentStatusBadge, BookingStatusBadge } from '../../components/common/PaymentStatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { formatPrice, formatDate } from '../../utils/formatters';
import {
  Download,
  Search,
  Eye,
  X,
  Ticket,
  Edit3,
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  RotateCcw,
  Copy,
  CreditCard,
  TrendingUp,
  Check
} from 'lucide-react';

export const AdminBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedRef, setCopiedRef] = useState(null);

  // Status Change Modal State
  const [statusModalBooking, setStatusModalBooking] = useState(null);
  const [editBookingStatus, setEditBookingStatus] = useState('CONFIRMED');
  const [editPaymentStatus, setEditPaymentStatus] = useState('PAID');
  const [editNotes, setEditNotes] = useState('');
  const [editCancellationReason, setEditCancellationReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Lock body scroll and handle Escape key for admin modals
  useEffect(() => {
    const isAnyModalOpen = Boolean(statusModalBooking || selectedBooking);
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setStatusModalBooking(null);
        setSelectedBooking(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [statusModalBooking, selectedBooking]);

  const fetchBookings = async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await adminApi.getBookings({
        search,
        bookingStatus,
        paymentStatus,
        page,
        limit: 12
      });
      setBookings(res.data || []);
      setPagination(res.meta || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to load bookings:', err);
      toast.error('Failed to load booking records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1);
  }, [search, bookingStatus, paymentStatus]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await adminApi.exportBookingsCsv();
      toast.success('Bookings exported to CSV');
    } catch (err) {
      toast.error('Failed to export CSV report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyRef = (ref) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(ref);
    }
    setCopiedRef(ref);
    toast.success(`Copied ${ref} to clipboard`);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleOpenStatusModal = (booking) => {
    setStatusModalBooking(booking);
    setEditBookingStatus(booking.bookingStatus);
    setEditPaymentStatus(booking.paymentStatus);
    setEditNotes(booking.notes || '');
    setEditCancellationReason(booking.cancellationReason || '');
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!statusModalBooking) return;
    setIsUpdatingStatus(true);
    try {
      const res = await adminApi.updateBookingStatus(statusModalBooking._id, {
        bookingStatus: editBookingStatus,
        paymentStatus: editPaymentStatus,
        notes: editNotes,
        cancellationReason: editBookingStatus === 'CANCELLED' ? editCancellationReason : undefined
      });
      toast.success('Booking & Payment status updated successfully!');
      const updatedBooking = res.data;

      setBookings((prev) =>
        prev.map((b) => (b._id === statusModalBooking._id ? { ...b, ...updatedBooking } : b))
      );
      if (selectedBooking && selectedBooking._id === statusModalBooking._id) {
        setSelectedBooking((prev) => ({ ...prev, ...updatedBooking }));
      }
      setStatusModalBooking(null);
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update booking status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Genuine Summary Statistics from currently loaded data
  const totalBookingsCount = pagination.total || bookings.length;
  const confirmedCount = bookings.filter((b) => b.bookingStatus === 'CONFIRMED').length;
  const paidCount = bookings.filter((b) => b.paymentStatus === 'PAID').length;
  const totalRevenuePaise = bookings
    .filter((b) => b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + (b.totalAmountInPaise || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header and Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">
            Bookings & Transactions
          </h1>
          <p className="text-xs text-muted">
            Manage registrations, update booking & payment statuses, and export accounting reports.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="btn-outline text-xs flex items-center gap-2 cursor-pointer flex-shrink-0"
        >
          <Download className="w-4 h-4 text-secondary flex-shrink-0" />
          <span>{isExporting ? 'Generating CSV...' : 'Export Bookings CSV'}</span>
        </button>
      </div>

      {/* Genuine Summary Cards using real booking data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <Ticket className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider truncate">
              Total Records
            </p>
            <p className="text-xl font-extrabold text-primary">{totalBookingsCount}</p>
          </div>
        </div>

        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider truncate">
              Confirmed
            </p>
            <p className="text-xl font-extrabold text-main">{confirmedCount}</p>
          </div>
        </div>

        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-secondary flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider truncate">
              Paid / Captured
            </p>
            <p className="text-xl font-extrabold text-main">{paidCount}</p>
          </div>
        </div>

        <div className="card-surface p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-accent flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider truncate">
              Paid Revenue
            </p>
            <p className="text-xl font-extrabold text-primary truncate">
              {formatPrice(totalRevenuePaise)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-surface p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ref or transaction ID..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
          <select
            value={bookingStatus}
            onChange={(e) => setBookingStatus(e.target.value)}
            className="text-xs p-2 bg-background border border-border rounded-lg focus:outline-none flex-1 sm:flex-initial"
          >
            <option value="">All Booking Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="text-xs p-2 bg-background border border-border rounded-lg focus:outline-none flex-1 sm:flex-initial"
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid / Captured</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Bookings Table Container */}
      <div className="card-surface overflow-hidden shadow-card border border-border">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[880px] text-left text-xs divide-y divide-border">
            <thead className="bg-stone-100/90 border-b border-border text-muted uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="py-3 px-3 whitespace-nowrap min-w-[145px]">
                  Booking Ref
                </th>
                <th scope="col" className="py-3 px-3 whitespace-nowrap min-w-[140px]">
                  Workshop
                </th>
                <th scope="col" className="py-3 px-3 whitespace-nowrap min-w-[125px]">
                  Attendee
                </th>
                <th scope="col" className="py-3 px-2 text-center whitespace-nowrap min-w-[50px]">
                  Seats
                </th>
                <th scope="col" className="py-3 px-3 text-right whitespace-nowrap min-w-[75px]">
                  Amount
                </th>
                <th scope="col" className="py-3 px-3 whitespace-nowrap min-w-[95px]">
                  Booking Status
                </th>
                <th scope="col" className="py-3 px-3 whitespace-nowrap min-w-[90px]">
                  Payment
                </th>
                <th scope="col" className="py-3 px-3 whitespace-nowrap min-w-[85px]">
                  Date
                </th>
                <th
                  scope="col"
                  className="py-3 px-4 text-right whitespace-nowrap min-w-[125px] sticky right-0 bg-stone-100 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.08)] z-10"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="py-14 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-secondary" />
                      <span>Loading booking records...</span>
                    </div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-14 text-center text-muted">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Ticket className="w-8 h-8 text-stone-300" />
                      <p className="font-semibold text-main">No bookings found</p>
                      <p className="text-[11px] text-muted">
                        Try adjusting your search query or status filter.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b._id} className="group hover:bg-stone-50/90 transition-colors">
                    {/* Booking Reference with Copy Action */}
                    <td className="py-3 px-3 font-mono font-bold text-primary whitespace-nowrap min-w-[145px]">
                      <div className="flex items-center gap-1.5">
                        <span className="select-all tracking-tight">{b.bookingRef}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyRef(b.bookingRef)}
                          className="p-1 rounded text-stone-400 hover:text-primary hover:bg-stone-200/60 transition-colors cursor-pointer"
                          title="Copy booking reference"
                          aria-label={`Copy booking reference ${b.bookingRef}`}
                        >
                          {copiedRef === b.bookingRef ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Workshop Title with Accessible Full Title Tooltip */}
                    <td className="py-3 px-3 min-w-[140px] max-w-[200px]">
                      <div
                        className="cursor-default"
                        tabIndex={0}
                        title={b.workshop?.title || 'Workshop'}
                      >
                        <p className="font-semibold text-main truncate hover:text-secondary transition-colors">
                          {b.workshop?.title || 'Workshop'}
                        </p>
                        {b.workshop?.category && (
                          <p className="text-[10px] text-muted truncate mt-0.5">
                            {b.workshop.category}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Attendee / User */}
                    <td className="py-3 px-3 min-w-[125px] max-w-[160px]">
                      <div className="truncate">
                        <p className="font-semibold text-main truncate" title={b.user?.name}>
                          {b.user?.name || 'Attendee'}
                        </p>
                        <p className="text-[10px] text-muted truncate" title={b.user?.email}>
                          {b.user?.email}
                        </p>
                      </div>
                    </td>

                    {/* Seats */}
                    <td className="py-3 px-2 text-center font-bold text-main min-w-[50px]">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs font-bold">
                        {b.seatQuantity}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right font-extrabold text-primary whitespace-nowrap min-w-[75px]">
                      {formatPrice(b.totalAmountInPaise)}
                    </td>

                    {/* Booking Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap min-w-[95px]">
                      <BookingStatusBadge status={b.bookingStatus} />
                    </td>

                    {/* Payment Status Badge */}
                    <td className="py-3 px-3 whitespace-nowrap min-w-[90px]">
                      <PaymentStatusBadge status={b.paymentStatus} />
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 text-muted whitespace-nowrap min-w-[85px] text-[11px]">
                      {formatDate(b.createdAt)}
                    </td>

                    {/* Actions Column: Sticky Right so it is ALWAYS accessible */}
                    <td className="py-3 px-4 text-right whitespace-nowrap min-w-[125px] sticky right-0 bg-surface group-hover:bg-stone-50/90 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.08)] z-10 transition-colors">
                      <div className="flex items-center justify-end gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-main font-semibold text-xs transition-colors cursor-pointer border border-stone-200 flex-shrink-0 shadow-xs"
                          title="Change Booking / Payment Status"
                          aria-label={`Change status for booking ${b.bookingRef}`}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
                          <span>Status</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 rounded-lg text-muted hover:text-secondary hover:bg-stone-100 transition-colors cursor-pointer flex-shrink-0 border border-transparent hover:border-border"
                          title="View Details"
                          aria-label={`View details for booking ${b.bookingRef}`}
                        >
                          <Eye className="w-4 h-4 flex-shrink-0" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={(page) => fetchBookings(page)}
        />
      </div>

      {/* Admin Status Change Modal (Portaled for clean viewport stacking) */}
      {statusModalBooking &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setStatusModalBooking(null);
            }}
          >
            <div
              className="bg-surface rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-modal border border-border space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-secondary" />
                  <div>
                    <h3 id="status-modal-title" className="font-bold text-main">
                      Change Booking & Payment Status
                    </h3>
                    <p className="text-[11px] font-mono text-muted">
                      {statusModalBooking.bookingRef}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusModalBooking(null)}
                  className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-stone-100 transition-colors cursor-pointer"
                  aria-label="Close status modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Context Card */}
              <div className="p-3 bg-background rounded-xl border border-border text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Workshop:</span>
                  <span
                    className="font-semibold text-main truncate max-w-[250px]"
                    title={statusModalBooking.workshop?.title}
                  >
                    {statusModalBooking.workshop?.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Attendee:</span>
                  <span className="font-semibold text-main">
                    {statusModalBooking.user?.name} ({statusModalBooking.user?.email})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Seats Reserved:</span>
                  <span className="font-bold text-main">
                    {statusModalBooking.seatQuantity} seat(s)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Total Amount:</span>
                  <span className="font-extrabold text-primary">
                    {formatPrice(statusModalBooking.totalAmountInPaise)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveStatus} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Booking Status Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-main block">Booking Status</label>
                    <select
                      value={editBookingStatus}
                      onChange={(e) => setEditBookingStatus(e.target.value)}
                      className="w-full text-xs p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    >
                      <option value="CONFIRMED">CONFIRMED (Active Seat)</option>
                      <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                      <option value="CANCELLED">CANCELLED (Release Seat)</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>

                  {/* Payment Status Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-main block">Payment Status</label>
                    <select
                      value={editPaymentStatus}
                      onChange={(e) => setEditPaymentStatus(e.target.value)}
                      className="w-full text-xs p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                    >
                      <option value="PAID">PAID (Captured)</option>
                      <option value="PENDING">PENDING</option>
                      <option value="FAILED">FAILED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Inventory Impact Alert */}
                {statusModalBooking.bookingStatus === 'CONFIRMED' &&
                  editBookingStatus === 'CANCELLED' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Changing to <strong>CANCELLED</strong> will automatically release{' '}
                        <strong>{statusModalBooking.seatQuantity} seat(s)</strong> back into the
                        workshop inventory.
                      </span>
                    </div>
                  )}

                {statusModalBooking.bookingStatus !== 'CONFIRMED' &&
                  editBookingStatus === 'CONFIRMED' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-900 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>
                        Changing to <strong>CONFIRMED</strong> will allocate{' '}
                        <strong>{statusModalBooking.seatQuantity} seat(s)</strong> in the workshop.
                      </span>
                    </div>
                  )}

                {/* Cancellation Reason if cancelled */}
                {editBookingStatus === 'CANCELLED' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-main block">
                      Cancellation Reason
                    </label>
                    <input
                      type="text"
                      value={editCancellationReason}
                      onChange={(e) => setEditCancellationReason(e.target.value)}
                      placeholder="e.g. Cancelled upon customer phone request"
                      className="w-full text-xs p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Admin Internal Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-main block">
                    Admin Internal Notes <span className="text-muted font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Reason for manual adjustment, ticket reference, etc."
                    className="w-full text-xs p-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Modal Action Buttons */}
                <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setStatusModalBooking(null)}
                    className="btn-outline text-xs px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingStatus}
                    className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Save Status Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Booking Details Modal (Portaled for clean viewport stacking) */}
      {selectedBooking &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-md animate-fade-in"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedBooking(null);
            }}
          >
            <div
              className="bg-surface rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-modal border border-border space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-secondary" />
                  <h3 id="details-modal-title" className="font-bold text-main">
                    Booking Details
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="p-1.5 rounded-lg text-muted hover:text-main hover:bg-stone-100 transition-colors cursor-pointer"
                  aria-label="Close booking details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted">Booking Reference:</span>
                  <span className="font-mono font-bold text-primary select-all">
                    {selectedBooking.bookingRef}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted">Workshop:</span>
                  <span
                    className="font-bold text-main max-w-[220px] text-right truncate"
                    title={selectedBooking.workshop?.title}
                  >
                    {selectedBooking.workshop?.title}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted">Seats Reserved:</span>
                  <span className="font-bold text-main">{selectedBooking.seatQuantity}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted">Total Amount:</span>
                  <span className="font-extrabold text-primary">
                    {formatPrice(selectedBooking.totalAmountInPaise)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border items-center">
                  <span className="text-muted">Booking Status:</span>
                  <BookingStatusBadge status={selectedBooking.bookingStatus} />
                </div>
                <div className="flex justify-between py-1 border-b border-border items-center">
                  <span className="text-muted">Payment Status:</span>
                  <PaymentStatusBadge status={selectedBooking.paymentStatus} />
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted">Razorpay Order ID:</span>
                  <span className="font-mono text-muted select-all">
                    {selectedBooking.razorpayOrderId || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted">Razorpay Payment ID:</span>
                  <span className="font-mono text-muted select-all">
                    {selectedBooking.razorpayPaymentId || 'N/A'}
                  </span>
                </div>
                {selectedBooking.refundReference && (
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted">Refund Reference:</span>
                    <span className="font-mono text-purple-700 font-bold select-all">
                      {selectedBooking.refundReference}
                    </span>
                  </div>
                )}
                {selectedBooking.cancellationReason && (
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted">Cancellation Reason:</span>
                    <span className="text-main">{selectedBooking.cancellationReason}</span>
                  </div>
                )}
                {selectedBooking.notes && (
                  <div className="flex justify-between py-1 border-b border-border">
                    <span className="text-muted">Admin Notes:</span>
                    <span className="text-main">{selectedBooking.notes}</span>
                  </div>
                )}

                {selectedBooking.attendeeDetails?.length > 0 && (
                  <div className="pt-2">
                    <span className="font-bold text-main block mb-1">Attendee List:</span>
                    <div className="space-y-1.5 bg-background p-2.5 rounded-lg border border-border">
                      {selectedBooking.attendeeDetails.map((a, i) => (
                        <p key={i} className="text-[11px] text-muted">
                          {i + 1}. <strong className="text-main">{a.name}</strong> ({a.email})
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    handleOpenStatusModal(b);
                  }}
                  className="btn-outline text-xs px-3 py-2 flex items-center gap-1.5 text-secondary hover:text-main cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Change Status</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="btn-outline text-xs px-4 py-2 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
