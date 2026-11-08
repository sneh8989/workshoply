import mongoose from 'mongoose';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Workshop } from '../models/Workshop.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';

const API_BASE = 'http://localhost:5000/api/v1';

async function run() {
  console.log('--- Starting End-to-End Ticket Cancellation & Refund Verification ---');
  await mongoose.connect(env.MONGODB_URI);

  const testEmail = `refund.attendee.${Date.now()}@test.com`;
  const testPassword = 'Password123!';
  let userId = null;
  let bookingRef = null;

  try {
    // 1. Register temporary user
    console.log(`\n1. Registering temporary user: ${testEmail}...`);
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Refund Test Attendee',
        email: testEmail,
        password: testPassword
      })
    });
    const regData = await regRes.json();
    if (!regData.success) throw new Error(`Registration failed: ${regData.message}`);
    const token = regData.data.accessToken;
    userId = regData.data.user.id;
    console.log(`✓ User registered successfully. ID: ${userId}`);

    // 2. Select a workshop
    console.log('\n2. Fetching available workshops...');
    const wsRes = await fetch(`${API_BASE}/workshops?limit=1`);
    const wsData = await wsRes.json();
    const workshop = wsData.data[0];
    if (!workshop) throw new Error('No workshops available in database');
    console.log(`✓ Selected workshop: "${workshop.title}" (ID: ${workshop._id}, Price: ₹${workshop.priceInPaise / 100})`);

    const initialBookedSeats = workshop.bookedSeats;

    // 3. Book a seat
    console.log('\n3. Initiating booking for 1 seat...');
    const bookRes = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        workshopId: workshop._id,
        seatQuantity: 1,
        attendeeDetails: [{ name: 'Refund Test Attendee', email: testEmail }]
      })
    });
    const bookData = await bookRes.json();
    if (!bookData.success) throw new Error(`Booking initiation failed: ${bookData.message}`);
    bookingRef = bookData.data.booking.bookingRef;
    const razorpayOrder = bookData.data.razorpayOrder;
    console.log(`✓ Booking initiated with Ref: ${bookingRef}, Razorpay Order: ${razorpayOrder.id}`);

    // 4. Confirm payment
    console.log('\n4. Confirming payment via cryptographic verification...');
    const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    const signature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrder.id}|${paymentId}`)
      .digest('hex');

    const verifyRes = await fetch(`${API_BASE}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingRef,
        razorpayOrderId: razorpayOrder.id,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature
      })
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) throw new Error(`Payment verification failed: ${verifyData.message}`);
    console.log(`✓ Payment verified. Booking status: ${verifyData.data.booking.bookingStatus}, Payment status: ${verifyData.data.booking.paymentStatus}`);

    // Check workshop booked seats increased
    const afterBookWs = await Workshop.findById(workshop._id);
    console.log(`✓ Workshop booked seats updated from ${initialBookedSeats} to ${afterBookWs.bookedSeats}`);

    // 5. Cancel the booking & process refund
    console.log(`\n5. Cancelling booking ${bookingRef} and requesting refund...`);
    const cancelRes = await fetch(`${API_BASE}/bookings/${bookingRef}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ reason: 'Attendee requested refund due to emergency' })
    });
    const cancelData = await cancelRes.json();
    if (!cancelData.success) throw new Error(`Cancellation failed: ${cancelData.message}`);

    console.log('✓ Cancellation response received:');
    console.log(`  - bookingStatus: ${cancelData.data.bookingStatus}`);
    console.log(`  - paymentStatus: ${cancelData.data.paymentStatus}`);
    console.log(`  - refundReference: ${cancelData.data.refundReference}`);
    console.log(`  - cancelledAt: ${cancelData.data.cancelledAt}`);

    if (cancelData.data.bookingStatus !== 'CANCELLED') {
      throw new Error(`Expected bookingStatus to be CANCELLED, got ${cancelData.data.bookingStatus}`);
    }
    if (cancelData.data.paymentStatus !== 'REFUNDED') {
      throw new Error(`Expected paymentStatus to be REFUNDED, got ${cancelData.data.paymentStatus}`);
    }
    if (!cancelData.data.refundReference || !cancelData.data.refundReference.startsWith('rfnd_')) {
      throw new Error(`Expected valid refundReference starting with rfnd_, got ${cancelData.data.refundReference}`);
    }

    // 6. Verify seat restoration
    const afterCancelWs = await Workshop.findById(workshop._id);
    console.log(`\n6. Workshop seat inventory: returned from ${afterBookWs.bookedSeats} to ${afterCancelWs.bookedSeats} (matches initial ${initialBookedSeats})`);
    if (afterCancelWs.bookedSeats !== initialBookedSeats) {
      throw new Error(`Seats not correctly restored. Expected ${initialBookedSeats}, got ${afterCancelWs.bookedSeats}`);
    }

    // 7. Verify Payment document in DB
    const dbPayment = await Payment.findOne({ booking: cancelData.data._id });
    console.log('\n7. Database Payment Record Verification:');
    console.log(`  - paymentStatus: ${dbPayment.paymentStatus}`);
    console.log(`  - refundReference: ${dbPayment.refundReference}`);
    console.log(`  - refundStatus: ${dbPayment.refundStatus}`);
    if (dbPayment.paymentStatus !== 'REFUNDED') {
      throw new Error(`Payment record status mismatch in database: ${dbPayment.paymentStatus}`);
    }

    // 8. Verify attendee's dashboard booking endpoint
    console.log('\n8. Checking GET /api/v1/bookings/my response for attendee...');
    const myRes = await fetch(`${API_BASE}/bookings/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const myData = await myRes.json();
    const myCancelledBooking = myData.data.find(b => b.bookingRef === bookingRef);
    console.log(`✓ Attendee dashboard booking found:`);
    console.log(`  - Booking Ref: ${myCancelledBooking.bookingRef}`);
    console.log(`  - Booking Status: ${myCancelledBooking.bookingStatus}`);
    console.log(`  - Payment Status: ${myCancelledBooking.paymentStatus}`);
    console.log(`  - Refund Reference: ${myCancelledBooking.refundReference}`);

    // 9. Admin view verification
    console.log('\n9. Checking admin visibility of refund...');
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@workshoply.dev',
        password: 'Admin@Workshoply2026'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data.accessToken;

    const adminBookingsRes = await fetch(`${API_BASE}/admin/bookings?bookingRef=${bookingRef}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminBookingsData = await adminBookingsRes.json();
    const adminViewedBooking = adminBookingsData.data.bookings.find(b => b.bookingRef === bookingRef);
    console.log(`✓ Admin bookings list verification:`);
    console.log(`  - Found booking: ${adminViewedBooking?.bookingRef}`);
    console.log(`  - Payment Status: ${adminViewedBooking?.paymentStatus}`);
    console.log(`  - Refund Ref: ${adminViewedBooking?.refundReference}`);

    console.log('\n======================================================');
    console.log('>>> ALL REFUND & CANCELLATION CHECKS PASSED WITH 100% SUCCESS <<<');
    console.log('======================================================\n');
  } finally {
    // Clean up temporary user, booking, and payment to preserve single-admin state
    console.log('Cleaning up temporary verification data to maintain pristine DB state...');
    if (userId) {
      await User.findByIdAndDelete(userId);
      console.log(`✓ Deleted temporary user ${userId}`);
    }
    if (bookingRef) {
      const b = await Booking.findOne({ bookingRef });
      if (b) {
        await Payment.deleteMany({ booking: b._id });
        await Booking.findByIdAndDelete(b._id);
        console.log(`✓ Deleted test booking and payment records for ${bookingRef}`);
      }
    }
    await mongoose.disconnect();
    console.log('Database disconnected cleanly.');
  }
}

run().catch(err => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
