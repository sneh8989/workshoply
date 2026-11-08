import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { workshopApi } from '../api/workshop.api';
import { useAuth } from '../context/AuthContext';
import { AvailabilityBadge } from '../components/common/AvailabilityBadge';
import { PriceDisplay } from '../components/common/PriceDisplay';
import { RatingDisplay } from '../components/common/RatingDisplay';
import { ErrorState } from '../components/common/ErrorState';
import { formatDate, formatTime, formatDuration } from '../../src/utils/formatters';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle2,
  ShieldAlert,
  ArrowLeft,
  Share2,
  Star,
  MessageSquare
} from 'lucide-react';

export const WorkshopDetailPage = () => {
  const { identifier } = useParams();
  const [workshop, setWorkshop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchWorkshopData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [workshopRes, reviewsRes] = await Promise.all([
        workshopApi.getWorkshop(identifier),
        workshopApi.getReviews(identifier).catch(() => ({ data: [] }))
      ]);
      setWorkshop(workshopRes.data);
      setReviews(reviewsRes.data || []);
    } catch (err) {
      console.error('Error fetching workshop details:', err);
      setError(err.response?.data?.message || 'Failed to load workshop details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkshopData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [identifier]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    setReviewMessage('');
    try {
      const res = await workshopApi.addReview(workshop._id, {
        rating: Number(newRating),
        comment: newComment.trim()
      });
      setReviews([res.data, ...reviews.filter((r) => r.user?._id !== res.data.user?._id)]);
      setNewComment('');
      setReviewMessage('Review submitted successfully!');
    } catch (err) {
      setReviewMessage(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-secondary rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-muted">Loading workshop curriculum and instructor profile...</p>
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState
          title="Workshop Not Found"
          message={error || 'The requested workshop does not exist or has been removed.'}
          onRetry={fetchWorkshopData}
        />
        <div className="text-center mt-4">
          <Link to="/workshops" className="btn-outline text-sm">
            Browse Other Workshops
          </Link>
        </div>
      </div>
    );
  }

  const isOnline = workshop.deliveryMode === 'ONLINE';
  const isAvailableForBooking =
    workshop.status === 'PUBLISHED' &&
    workshop.availableSeats > 0 &&
    new Date() <= new Date(workshop.registrationDeadline);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Back navigation */}
      <div>
        <Link
          to="/workshops"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-secondary transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workshops Discovery</span>
        </Link>
      </div>

      {/* Hero Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Main Details (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary text-white">
              {workshop.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
              {workshop.skillLevel.replace('_', ' ')}
            </span>
            <AvailabilityBadge
              state={workshop.availabilityState}
              availableSeats={workshop.availableSeats}
            />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight leading-tight">
            {workshop.title}
          </h1>

          <p className="text-base text-muted leading-relaxed">
            {workshop.shortDescription}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-surface border border-border shadow-subtle text-xs">
            <div>
              <span className="text-muted block mb-1">Date</span>
              <span className="font-bold text-main flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                {formatDate(workshop.startDateTime)}
              </span>
            </div>
            <div>
              <span className="text-muted block mb-1">Duration</span>
              <span className="font-bold text-main flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                {formatDuration(workshop.startDateTime, workshop.endDateTime)}
              </span>
            </div>
            <div>
              <span className="text-muted block mb-1">Format</span>
              <span className="font-bold text-main flex items-center gap-1">
                {isOnline ? <Video className="w-3.5 h-3.5 text-accent" /> : <MapPin className="w-3.5 h-3.5 text-secondary" />}
                {isOnline ? 'Online' : (workshop.venue?.city || 'In-Person')}
              </span>
            </div>
            <div>
              <span className="text-muted block mb-1">Capacity</span>
              <span className="font-bold text-main flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-secondary" />
                {workshop.capacity} Max Seats
              </span>
            </div>
          </div>

          {/* Cover Image */}
          <div className="rounded-2xl overflow-hidden border border-border shadow-card h-80 md:h-96">
            <img
              src={workshop.coverImage}
              alt={workshop.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Instructor Bio */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
              Your Instructor
            </h3>
            <div className="flex items-start gap-4">
              <img
                src={workshop.instructor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={workshop.instructor?.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-border flex-shrink-0"
              />
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-main">{workshop.instructor?.name}</h4>
                <p className="text-xs font-semibold text-accent">{workshop.instructor?.title}</p>
                <p className="text-xs text-muted leading-relaxed pt-1">{workshop.instructor?.bio}</p>
              </div>
            </div>
          </div>

          {/* What You Will Learn */}
          {workshop.whatYouWillLearn?.length > 0 && (
            <div className="card-surface p-6 space-y-4">
              <h3 className="text-lg font-bold text-main">What You Will Master</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {workshop.whatYouWillLearn.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-main">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Description */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-lg font-bold text-main">Detailed Curriculum & Overview</h3>
            <div className="text-sm text-main/90 leading-relaxed whitespace-pre-line space-y-3">
              {workshop.description}
            </div>
          </div>

          {/* Prerequisites */}
          {workshop.prerequisites?.length > 0 && (
            <div className="card-surface p-6 space-y-3">
              <h3 className="text-base font-bold text-main">Prerequisites & Materials</h3>
              <ul className="list-disc list-inside text-xs text-muted space-y-1.5">
                {workshop.prerequisites.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Cancellation Policy */}
          <div className="card-surface p-6 space-y-2 border-l-4 border-l-secondary">
            <h3 className="text-sm font-bold text-main flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-secondary" />
              Cancellation & Refund Policy
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {workshop.cancellationPolicy}
            </p>
          </div>

          {/* Reviews Section */}
          <div className="card-surface p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-main">Attendee Reviews</h3>
                <RatingDisplay rating={workshop.ratingAverage} count={workshop.ratingCount} size="lg" />
              </div>
            </div>

            {/* Existing Reviews */}
            {reviews.length === 0 ? (
              <p className="text-xs text-muted py-4">No reviews yet for this cohort.</p>
            ) : (
              <div className="divide-y divide-border space-y-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                          {rev.user?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-xs font-bold text-main">{rev.user?.name || 'Verified Attendee'}</span>
                      </div>
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted leading-relaxed pl-9">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Review Box */}
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="pt-6 border-t border-border space-y-3">
                <h4 className="text-xs font-bold text-main uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-secondary" />
                  Leave a Review
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Rating:</span>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(e.target.value)}
                    className="text-xs border border-border rounded-lg p-1.5 bg-background"
                  >
                    <option value="5">5 - Excellent</option>
                    <option value="4">4 - Very Good</option>
                    <option value="3">3 - Average</option>
                    <option value="2">2 - Poor</option>
                    <option value="1">1 - Terribe</option>
                  </select>
                </div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your practical experience with this workshop..."
                  rows="3"
                  className="w-full text-xs p-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                {reviewMessage && (
                  <p className="text-xs text-secondary font-medium">{reviewMessage}</p>
                )}
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="btn-primary text-xs"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            ) : (
              <div className="pt-4 border-t border-border text-xs text-muted">
                <Link to="/login" className="text-secondary font-semibold hover:underline">
                  Sign in
                </Link>{' '}
                to leave a review after completing this cohort.
              </div>
            )}
          </div>
        </div>

        {/* Sticky Booking CTA Card (Right col) */}
        <div className="lg:col-span-1 sticky top-24 space-y-4">
          <div className="card-surface p-6 space-y-6 border-2 border-primary/10">
            <div className="flex justify-between items-baseline pb-4 border-b border-border">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted tracking-wider">Tuition Fee</span>
                <PriceDisplay priceInPaise={workshop.priceInPaise} currency={workshop.currency} size="lg" />
              </div>
              <AvailabilityBadge
                state={workshop.availabilityState}
                availableSeats={workshop.availableSeats}
              />
            </div>

            <div className="space-y-3 text-xs text-muted">
              <div className="flex justify-between">
                <span>Total Seats</span>
                <span className="font-semibold text-main">{workshop.capacity}</span>
              </div>
              <div className="flex justify-between">
                <span>Available Seats</span>
                <span className="font-bold text-emerald-600">{workshop.availableSeats}</span>
              </div>
              <div className="flex justify-between">
                <span>Registration Closes</span>
                <span className="font-semibold text-main">{formatDate(workshop.registrationDeadline)}</span>
              </div>
            </div>

            {/* Action Button */}
            {isAdmin ? (
              <div className="space-y-2">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-center">
                  <p className="font-semibold">Administrator Account</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">Admins cannot book workshops. Please use a regular customer account to register.</p>
                </div>
                <button
                  disabled
                  className="w-full btn-outline text-xs py-3 font-semibold opacity-60 cursor-not-allowed text-center"
                >
                  Booking Disabled for Admins
                </button>
              </div>
            ) : isAvailableForBooking ? (
              <button
                onClick={() => navigate(`/checkout/${workshop._id}`)}
                className="w-full btn-secondary text-sm py-3.5 tracking-wide uppercase font-bold shadow-md"
              >
                Book Your Seat Now
              </button>
            ) : (
              <button
                disabled
                className="w-full btn-outline text-sm py-3.5 font-bold opacity-60 cursor-not-allowed text-center"
              >
                {workshop.availabilityState === 'SOLD_OUT' ? 'Sold Out' : 'Registration Closed'}
              </button>
            )}

            <p className="text-[11px] text-center text-muted">
              Secure checkout via Razorpay • 100% money-back guarantee per policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
