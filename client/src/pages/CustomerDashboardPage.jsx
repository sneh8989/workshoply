import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../api/booking.api';
import api from '../api/axios';
import { PaymentStatusBadge } from '../components/common/PaymentStatusBadge';
import { TicketModal } from '../components/booking/TicketModal';
import { ConfirmationDialog } from '../components/common/ConfirmationDialog';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate, formatTime, formatPrice } from '../utils/formatters';
import {
  Ticket,
  User,
  Calendar,
  Clock,
  MapPin,
  Video,
  Printer,
  XCircle,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const CustomerDashboardPage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [bookings, setBookings] = useState([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  // Selected booking for ticket modal
  const [selectedTicketBooking, setSelectedTicketBooking] = useState(null);

  // Cancellation dialog state
  const [cancelTargetBooking, setCancelTargetBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Profile edit state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileBio, setProfileBio] = useState(user?.bio || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState('');
  const [passwordErrorMsg, setPasswordErrorMsg] = useState('');

  const fetchBookings = async () => {
    setIsLoadingBookings(true);
    try {
      const res = await bookingApi.getMyBookings();
      setBookings(res.data || []);
    } catch (err) {
      console.error('Failed to load user bookings:', err);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelTargetBooking) return;
    setIsCancelling(true);
    try {
      await bookingApi.cancelBooking(cancelTargetBooking.bookingRef, 'Cancelled by user from dashboard');
      await fetchBookings();
      setCancelTargetBooking(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccessMsg('');
    try {
      const res = await api.patch('/users/me', {
        name: profileName,
        phone: profilePhone,
        bio: profileBio
      });
      updateUser(res.data.data);
      setProfileSuccessMsg('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordErrorMsg('');
    setPasswordSuccessMsg('');
    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post('/users/change-password', {
        currentPassword,
        newPassword
      });
      setPasswordSuccessMsg('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordErrorMsg(err.response?.data?.message || 'Could not change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Filter bookings based on active subtab
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'ALL') return true;
    if (bookingFilter === 'CONFIRMED') return b.bookingStatus === 'CONFIRMED';
    if (bookingFilter === 'CANCELLED') return b.bookingStatus === 'CANCELLED';
    if (bookingFilter === 'PENDING') return b.bookingStatus === 'PENDING_PAYMENT';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Profile Summary */}
      <div className="card-surface p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-2xl shadow-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary">{user?.name}</h1>
            <p className="text-xs text-muted">{user?.email}</p>
            {user?.role === 'ADMIN' && (
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-secondary">
                PLATFORM ADMINISTRATOR
              </span>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-background p-1 border border-border text-xs font-semibold">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'bookings'
                ? 'bg-surface text-primary shadow-subtle'
                : 'text-muted hover:text-main'
            }`}
          >
            My Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'profile'
                ? 'bg-surface text-primary shadow-subtle'
                : 'text-muted hover:text-main'
            }`}
          >
            Account Settings
          </button>
        </div>
      </div>

      {/* Main Content Tab */}
      {activeTab === 'bookings' ? (
        <div className="space-y-6">
          {/* Subfilter Pills */}
          <div className="flex items-center gap-2 border-b border-border pb-3">
            {[
              { id: 'ALL', label: 'All Bookings' },
              { id: 'CONFIRMED', label: 'Confirmed & Upcoming' },
              { id: 'CANCELLED', label: 'Cancelled' },
              { id: 'PENDING', label: 'Pending Payment' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setBookingFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  bookingFilter === f.id
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-stone-100 hover:text-main'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Bookings List */}
          {isLoadingBookings ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-primary border-t-secondary rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-muted">Retrieving your bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No bookings in this category"
              description="You have no bookings matching the selected status."
              actionText="Explore Workshops"
              onAction={() => window.location.href = '/workshops'}
            />
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((b) => {
                const workshop = b.workshop || {};
                const isOnline = workshop.deliveryMode === 'ONLINE';
                const canCancel = b.bookingStatus === 'CONFIRMED' && new Date() < new Date(workshop.startDateTime);

                return (
                  <div
                    key={b._id}
                    className="card-surface p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-card-hover"
                  >
                    <div className="flex gap-4 items-start">
                      <img
                        src={workshop.coverImage || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200'}
                        alt={workshop.title}
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                            {workshop.category}
                          </span>
                          <span className="text-xs text-muted">•</span>
                          <span className="font-mono text-xs font-bold text-muted">
                            Ref: {b.bookingRef}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-main leading-snug">
                          {workshop.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted pt-1">
                          <span className="flex items-center gap-1 font-medium text-main">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            {formatDate(workshop.startDateTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {formatTime(workshop.startDateTime)}
                          </span>
                          <span className="flex items-center gap-1">
                            {isOnline ? <Video className="w-3.5 h-3.5 text-accent" /> : <MapPin className="w-3.5 h-3.5 text-secondary" />}
                            {isOnline ? 'Online' : (workshop.venue?.city || 'In-Person')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-border">
                      <div className="text-left md:text-right">
                        <span className="block text-xs font-bold text-primary">
                          {formatPrice(b.totalAmountInPaise)}
                        </span>
                        <div className="mt-1 flex flex-col md:items-end gap-1">
                          <PaymentStatusBadge status={b.paymentStatus} />
                          {b.refundReference && (
                            <span className="inline-block text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-mono">
                              Refund: {b.refundReference}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.bookingStatus === 'CONFIRMED' && (
                          <button
                            onClick={() => setSelectedTicketBooking(b)}
                            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5"
                          >
                            <Printer className="w-3.5 h-3.5 text-primary" />
                            <span>Ticket</span>
                          </button>
                        )}

                        {canCancel && (
                          <button
                            onClick={() => setCancelTargetBooking(b)}
                            className="text-xs font-semibold px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Account Settings Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Edit Profile */}
          <div className="card-surface p-6 space-y-5">
            <h3 className="text-base font-bold text-main flex items-center gap-2">
              <User className="w-4 h-4 text-secondary" />
              Personal Information
            </h3>

            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Email (Read only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full text-xs p-2.5 bg-stone-100 border border-border rounded-lg text-muted cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs p-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Bio / Headline</label>
                <textarea
                  value={profileBio}
                  onChange={(e) => setProfileBio(e.target.value)}
                  rows="3"
                  placeholder="Share a few words about your professional background..."
                  className="w-full text-xs p-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="btn-primary text-xs"
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card-surface p-6 space-y-5">
            <h3 className="text-base font-bold text-main flex items-center gap-2">
              <Lock className="w-4 h-4 text-secondary" />
              Security & Password
            </h3>

            {passwordErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            {passwordSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-main mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">New Password (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-main mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-xs p-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="btn-outline text-xs"
              >
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Modal */}
      <TicketModal
        booking={selectedTicketBooking}
        isOpen={Boolean(selectedTicketBooking)}
        onClose={() => setSelectedTicketBooking(null)}
      />

      {/* Confirmation Dialog for Cancellation */}
      <ConfirmationDialog
        isOpen={Boolean(cancelTargetBooking)}
        title="Cancel Workshop Booking & Issue Refund?"
        message={`Are you sure you want to cancel your reservation for "${cancelTargetBooking?.workshop?.title}"? ${cancelTargetBooking?.paymentStatus === 'PAID' && cancelTargetBooking?.totalAmountInPaise > 0 ? `A full refund of ${formatPrice(cancelTargetBooking.totalAmountInPaise)} will be returned to your original payment method, and ` : ''}${cancelTargetBooking?.seatQuantity} seats will be returned to the workshop inventory.`}
        confirmText="Confirm & Process Refund"
        isDanger={true}
        isLoading={isCancelling}
        onConfirm={handleCancelBooking}
        onCancel={() => setCancelTargetBooking(null)}
      />
    </div>
  );
};
