import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workshopApi } from '../api/workshop.api';
import { bookingApi } from '../api/booking.api';
import { useAuth } from '../context/AuthContext';
import { BookingSummary } from '../components/booking/BookingSummary';
import { RazorpaySimulatorModal } from '../components/booking/RazorpaySimulatorModal';
import { TicketModal } from '../components/booking/TicketModal';
import { formatPrice } from '../utils/formatters';
import { loadRazorpayScript } from '../utils/razorpay';
import {
  ArrowLeft,
  Users,
  Lock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const CheckoutPage = () => {
  const { workshopId } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState(null);
  const [seatQuantity, setSeatQuantity] = useState(1);
  const [attendees, setAttendees] = useState([
    { name: user?.name || '', email: user?.email || '', phone: user?.phone || '' }
  ]);
  const [notes, setNotes] = useState('');
  const [isLoadingWorkshop, setIsLoadingWorkshop] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Payment state
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [activeOrderData, setActiveOrderData] = useState(null);
  const [activeBookingRef, setActiveBookingRef] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Success state
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  useEffect(() => {
    const initData = async () => {
      try {
        const [wRes, pRes] = await Promise.all([
          workshopApi.getWorkshop(workshopId),
          bookingApi.getPaymentConfig()
        ]);
        setWorkshop(wRes.data);
        setPaymentConfig(pRes.data);
      } catch (err) {
        console.error('Failed to initialize checkout:', err);
        setErrorMessage(err.response?.data?.message || 'Failed to initialize booking session.');
      } finally {
        setIsLoadingWorkshop(false);
      }
    };
    initData();
  }, [workshopId]);

  // Adjust attendee inputs when seat quantity changes
  const handleQuantityChange = (newQty) => {
    const qty = Math.max(1, Math.min(newQty, workshop?.availableSeats || 1, 10));
    setSeatQuantity(qty);

    const updated = [...attendees];
    if (qty > updated.length) {
      for (let i = updated.length; i < qty; i++) {
        updated.push({ name: '', email: '', phone: '' });
      }
    } else {
      updated.splice(qty);
    }
    setAttendees(updated);
  };

  const handleAttendeeChange = (index, field, value) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  // Submit and Initiate Razorpay
  const handleInitiatePayment = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isAdmin || user?.role === 'ADMIN') {
      setErrorMessage('Administrators are not permitted to book workshops. Only regular users can book.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Call backend to reserve seats and create order
      const res = await bookingApi.createBooking({
        workshopId: workshop._id,
        seatQuantity,
        attendeeDetails: attendees,
        notes
      });

      const { booking, razorpayOrder, razorpayKeyId, isFree } = res.data;

      // Handle Free Workshop registration
      if (isFree) {
        setConfirmedBooking(booking);
        setIsSubmitting(false);
        return;
      }

      setActiveBookingRef(booking.bookingRef);
      setActiveOrderData(razorpayOrder);

      // Check if developer explicitly requested the offline simulator via URL query parameter (?simulator=true)
      const isExplicitSimulatorParam = new URLSearchParams(window.location.search).get('simulator') === 'true';
      const allowSimulator = isExplicitSimulatorParam && Boolean(paymentConfig?.allowSimulator) && !paymentConfig?.isProduction;

      if (allowSimulator) {
        // Only when explicitly requested for offline testing via ?simulator=true in dev mode
        setIsSimulatorOpen(true);
        setIsSubmitting(false);
        return;
      }

      // Default Customer Flow: Genuine Razorpay Standard Checkout
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay Checkout failed to initialize. Please check your network connection and retry.');
      }

      const keyToUse = razorpayKeyId || paymentConfig?.keyId;
      if (!keyToUse) {
        throw new Error('Razorpay Key configuration missing from server.');
      }

      // Real Razorpay Standard Checkout
      const options = {
        key: keyToUse,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency || 'INR',
        name: 'Workshoply',
        description: `${workshop.title} (${seatQuantity} ${seatQuantity > 1 ? 'seats' : 'seat'})`,
        order_id: razorpayOrder.id,
        image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=128&q=80',
        handler: async (response) => {
          // This callback is invoked ONLY after genuine Razorpay payment success
          await handleVerifyPayment({
            bookingRef: booking.bookingRef,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature
          });
        },
        prefill: {
          name: attendees[0]?.name || user?.name || '',
          email: attendees[0]?.email || user?.email || '',
          contact: attendees[0]?.phone || user?.phone || ''
        },
        notes: {
          bookingRef: booking.bookingRef,
          workshopId: String(workshop._id),
          workshopTitle: workshop.title,
          seatQuantity: String(seatQuantity)
        },
        theme: {
          color: '#14213D'
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            // Customer closed Razorpay Checkout without paying
            // Booking remains in PENDING_PAYMENT state and seats remain reserved
          },
          escape: true,
          backdropclose: false
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setIsSubmitting(false);
        setErrorMessage(
          response.error?.description ||
          response.error?.reason ||
          'Payment was declined by your bank or payment provider. Please retry.'
        );
      });
      rzp.open();
    } catch (err) {
      console.error('Booking creation error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to initiate booking. Please retry.');
      setIsSubmitting(false);
    }
  };

  // Verify Razorpay Payment with Backend
  const handleVerifyPayment = async (verificationPayload) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await bookingApi.verifyPayment(verificationPayload);
      setConfirmedBooking(res.data.booking);
      setIsSimulatorOpen(false);
    } catch (err) {
      console.error('Payment verification failed:', err);
      setErrorMessage(err.response?.data?.message || 'Payment signature verification failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingWorkshop) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-secondary rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-muted">Securing real-time seat inventory...</p>
      </div>
    );
  }

  // Admin users are strictly restricted from booking workshops
  if (isAdmin || user?.role === 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">
            Booking Disabled for Administrators
          </h1>
          <p className="text-sm text-muted max-w-md mx-auto">
            Administrators are not permitted to book workshops. Only regular attendee accounts can reserve seats.
          </p>
        </div>
        <div className="flex justify-center gap-4 pt-2">
          <Link to="/workshops" className="btn-outline text-xs">
            Browse Workshops
          </Link>
          <Link to="/admin" className="btn-primary text-xs">
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Confirmation Success View
  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-sm text-muted">
            Your seat has been reserved and your payment verified. A confirmation receipt has been issued.
          </p>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border shadow-card max-w-md mx-auto text-left space-y-3">
          <div className="flex justify-between items-baseline pb-2 border-b border-border">
            <span className="text-xs text-muted">Booking Reference</span>
            <span className="font-mono font-bold text-primary">{confirmedBooking.bookingRef}</span>
          </div>
          <div className="flex justify-between items-baseline pb-2 border-b border-border">
            <span className="text-xs text-muted">Seats Confirmed</span>
            <span className="font-bold text-main">{confirmedBooking.seatQuantity}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted">Amount Paid</span>
            <span className="font-extrabold text-primary">
              {formatPrice(confirmedBooking.totalAmountInPaise)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => setIsTicketModalOpen(true)}
            className="btn-primary text-sm px-6 py-3"
          >
            View & Print Admission Ticket
          </button>
          <Link
            to="/dashboard"
            className="btn-outline text-sm px-6 py-3"
          >
            Go to My Bookings
          </Link>
        </div>

        {/* Ticket Modal */}
        <TicketModal
          booking={{ ...confirmedBooking, workshop }}
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-secondary transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workshop Overview</span>
        </button>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
          Checkout & Seat Reservation
        </h1>
        <p className="text-xs text-muted">
          Complete attendee details. All tuition amounts are calculated securely by the backend.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form and Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Inputs (Left 2 cols) */}
        <form onSubmit={handleInitiatePayment} className="lg:col-span-2 space-y-6">
          {/* Seat Counter Card */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="text-sm font-bold text-main uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-secondary" />
              1. Select Seat Quantity
            </h3>

            <div className="flex items-center justify-between p-4 bg-background rounded-xl">
              <div>
                <p className="font-bold text-main text-sm">Number of Attendees</p>
                <p className="text-xs text-muted">Max {Math.min(workshop?.availableSeats || 1, 10)} seats per transaction</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(seatQuantity - 1)}
                  disabled={seatQuantity <= 1}
                  className="w-9 h-9 rounded-lg border border-border bg-surface text-main font-bold hover:bg-stone-100 disabled:opacity-40"
                >
                  -
                </button>
                <span className="font-extrabold text-base w-6 text-center text-primary">
                  {seatQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(seatQuantity + 1)}
                  disabled={seatQuantity >= Math.min(workshop?.availableSeats || 1, 10)}
                  className="w-9 h-9 rounded-lg border border-border bg-surface text-main font-bold hover:bg-stone-100 disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Attendee Details Form */}
          <div className="card-surface p-6 space-y-5">
            <h3 className="text-sm font-bold text-main uppercase tracking-wider">
              2. Attendee Information
            </h3>

            {attendees.map((att, idx) => (
              <div key={idx} className="p-4 bg-background rounded-xl border border-border space-y-3">
                <span className="text-xs font-bold text-secondary">
                  Attendee #{idx + 1}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-main mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={att.name}
                      onChange={(e) => handleAttendeeChange(idx, 'name', e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full text-xs p-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-main mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={att.email}
                      onChange={(e) => handleAttendeeChange(idx, 'email', e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full text-xs p-2.5 bg-surface border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-main mb-1">
                Special Requests or Questions (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any dietary restrictions for in-person workshops, or topics you specifically hope to cover..."
                rows="2"
                className="w-full text-xs p-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            id="checkout-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-secondary text-sm py-4 tracking-wide font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            {isSubmitting ? (
              <span>Locking Seats & Initializing Gateway...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>
                  {workshop?.priceInPaise === 0
                    ? 'Confirm Free Reservation'
                    : `Proceed to Pay ${formatPrice(workshop?.priceInPaise * seatQuantity)}`}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Summary Card (Right 1 col) */}
        <div className="lg:col-span-1 sticky top-24">
          <BookingSummary
            workshop={workshop}
            seatQuantity={seatQuantity}
          />
        </div>
      </div>

      {/* Test Simulator Modal */}
      <RazorpaySimulatorModal
        isOpen={isSimulatorOpen}
        orderData={activeOrderData}
        totalAmountInPaise={workshop?.priceInPaise * seatQuantity}
        onSuccess={async (simResponse) => {
          await handleVerifyPayment({
            bookingRef: activeBookingRef,
            razorpayOrderId: simResponse.razorpay_order_id,
            razorpayPaymentId: simResponse.razorpay_payment_id,
            razorpaySignature: simResponse.razorpay_signature
          });
        }}
        onFailure={(err) => {
          setIsSimulatorOpen(false);
          setErrorMessage(err.description || 'Payment was declined.');
        }}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
};
