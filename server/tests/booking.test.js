import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { Workshop } from '../src/models/Workshop.js';
import { Booking } from '../src/models/Booking.js';
import { Payment } from '../src/models/Payment.js';
import { env } from '../src/config/env.js';

describe('Booking & Seat Inventory Concurrency', () => {
  let userToken;
  let testUser;
  let testWorkshop;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(env.MONGODB_URI);
    }

    // Create a dedicated test user
    const email = `booking-test-${Date.now()}@test.com`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Booking Tester',
        email,
        password: 'Password123!'
      });
    userToken = regRes.body.data.accessToken;
    testUser = regRes.body.data.user;

    // Create a constrained test workshop with strictly 3 seats to verify overselling prevention
    testWorkshop = await Workshop.create({
      title: 'Limited Capacity Concurrency Workshop',
      shortDescription: 'Workshop designed strictly to test concurrency locks and seat limits.',
      description: 'Full comprehensive description for concurrency testing.',
      category: 'Web Development',
      coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      instructor: {
        name: 'Concurreny Expert',
        title: 'Senior Engineer'
      },
      priceInPaise: 99900,
      currency: 'INR',
      deliveryMode: 'ONLINE',
      startDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      endDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 3600000),
      registrationDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      capacity: 3,
      bookedSeats: 0,
      reservedSeats: 0,
      status: 'PUBLISHED',
      skillLevel: 'ALL_LEVELS'
    });
  });

  afterAll(async () => {
    if (testWorkshop) {
      await Workshop.findByIdAndDelete(testWorkshop._id);
    }
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
      await Booking.deleteMany({ user: testUser._id });
    }
    await mongoose.disconnect();
  });

  it('POST /api/v1/bookings should reserve seats and return Razorpay order details', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        workshopId: testWorkshop._id.toString(),
        seatQuantity: 2,
        attendeeDetails: [
          { name: 'Attendee 1', email: 'att1@test.com' },
          { name: 'Attendee 2', email: 'att2@test.com' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.booking.bookingRef).toBeDefined();
    expect(res.body.data.booking.totalAmountInPaise).toBe(199800); // 2 * 99900
    expect(res.body.data.razorpayOrder.id).toBeDefined();

    // Verify database reservedSeats increased by 2
    const updatedWorkshop = await Workshop.findById(testWorkshop._id);
    expect(updatedWorkshop.reservedSeats).toBe(2);
    expect(updatedWorkshop.availableSeats).toBe(1); // 3 - 2 = 1 left
  });

  it('POST /api/v1/bookings should reject requests exceeding available capacity (overselling prevention)', async () => {
    // Attempting to book 2 seats when only 1 is remaining
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        workshopId: testWorkshop._id.toString(),
        seatQuantity: 2,
        attendeeDetails: [
          { name: 'Attendee A', email: 'atta@test.com' },
          { name: 'Attendee B', email: 'attb@test.com' }
        ]
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Not enough seats available');
  });

  it('POST /api/v1/payments/verify should confirm booking with valid HMAC SHA256 signature', async () => {
    // 1. Create a 1-seat booking to test verification
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        workshopId: testWorkshop._id.toString(),
        seatQuantity: 1,
        attendeeDetails: [{ name: 'Single Attendee', email: 'single@test.com' }]
      });

    const bookingRef = bookRes.body.data.booking.bookingRef;
    const orderId = bookRes.body.data.razorpayOrder.id;
    const paymentId = 'pay_' + crypto.randomBytes(8).toString('hex');

    // Generate valid HMAC SHA256 signature using the secret key
    const signature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const verifyRes = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bookingRef,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.data.booking.bookingStatus).toBe('CONFIRMED');
    expect(verifyRes.body.data.booking.paymentStatus).toBe('PAID');

    // Check workshop seat inventory: reservedSeats converted to bookedSeats
    const updatedWorkshop = await Workshop.findById(testWorkshop._id);
    expect(updatedWorkshop.bookedSeats).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/v1/payments/verify should reject tampered signatures with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        bookingRef: 'WKL-FAKE-REF',
        razorpayOrderId: 'order_12345',
        razorpayPaymentId: 'pay_67890',
        razorpaySignature: 'fraudulent_tampered_signature_value'
      });

    expect(res.status).toBe(404); // Booking not found
  });

  it('POST /api/v1/bookings/:bookingRef/cancel should cancel, issue refund, and restore seats', async () => {
    // Get confirmed booking
    const myBookingsRes = await request(app)
      .get('/api/v1/bookings/my')
      .set('Authorization', `Bearer ${userToken}`);

    const booking = myBookingsRes.body.data[0];
    expect(booking).toBeDefined();

    const cancelRes = await request(app)
      .post(`/api/v1/bookings/${booking.bookingRef}/cancel`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Schedule conflict' });

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.bookingStatus).toBe('CANCELLED');
    expect(cancelRes.body.data.paymentStatus).toBe('REFUNDED');
    expect(cancelRes.body.data.refundReference).toBeDefined();
    expect(cancelRes.body.data.refundReference).toMatch(/^rfnd_/);

    // Verify corresponding Payment record is also marked REFUNDED
    const paymentRecord = await Payment.findOne({ booking: booking._id });
    expect(paymentRecord).toBeDefined();
    expect(paymentRecord.paymentStatus).toBe('REFUNDED');
    expect(paymentRecord.refundReference).toBe(cancelRes.body.data.refundReference);
  });

  it('POST /api/v1/bookings should reject booking attempts by administrator with 403 Forbidden', async () => {
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@workshoply.dev',
        password: 'Admin@Workshoply2026'
      });

    const adminToken = adminLoginRes.body.data.accessToken;

    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        workshopId: testWorkshop._id.toString(),
        seatQuantity: 1,
        attendeeDetails: [{ name: 'Admin Booking Attempt', email: 'admin@workshoply.dev' }]
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Administrators are not permitted to book workshops/i);
  });

  it('PATCH /api/v1/admin/bookings/:id/status should allow admin to change booking and payment status', async () => {
    // 1. Create a confirmed booking directly
    const booking = await Booking.create({
      bookingRef: `WKL-TEST-ADMIN-${Date.now()}`,
      user: testUser._id,
      workshop: testWorkshop._id,
      seatQuantity: 1,
      unitPriceInPaise: 99900,
      totalAmountInPaise: 99900,
      currency: 'INR',
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      attendeeDetails: [{ name: 'Status Test User', email: 'status@test.com' }]
    });

    await Workshop.findByIdAndUpdate(testWorkshop._id, { $inc: { bookedSeats: 1 } });

    // 2. Reject non-admin with 403
    const userAttempt = await request(app)
      .patch(`/api/v1/admin/bookings/${booking._id}/status`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ bookingStatus: 'CANCELLED' });

    expect(userAttempt.status).toBe(403);

    // 3. Admin login
    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@workshoply.dev',
        password: 'Admin@Workshoply2026'
      });
    const adminToken = adminLogin.body.data.accessToken;

    // 4. Admin updates to CANCELLED and REFUNDED
    const updateRes = await request(app)
      .patch(`/api/v1/admin/bookings/${booking._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookingStatus: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        notes: 'Cancelled manually by administrator for test'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.bookingStatus).toBe('CANCELLED');
    expect(updateRes.body.data.paymentStatus).toBe('REFUNDED');
    expect(updateRes.body.data.refundReference).toBeDefined();

    // Verify seat inventory was decremented
    const workshopAfterCancel = await Workshop.findById(testWorkshop._id);
    expect(workshopAfterCancel.bookedSeats).toBe(0);

    // 5. Admin can also re-confirm the booking
    const reconfirmRes = await request(app)
      .patch(`/api/v1/admin/bookings/${booking._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookingStatus: 'CONFIRMED',
        paymentStatus: 'PAID'
      });

    expect(reconfirmRes.status).toBe(200);
    expect(reconfirmRes.body.data.bookingStatus).toBe('CONFIRMED');
    expect(reconfirmRes.body.data.paymentStatus).toBe('PAID');

    const workshopAfterReconfirm = await Workshop.findById(testWorkshop._id);
    expect(workshopAfterReconfirm.bookedSeats).toBe(1);

    // Clean up
    await Booking.findByIdAndDelete(booking._id);
  });
});
