# Workshoply Architecture Documentation

## 1. System Overview
Workshoply is a full-stack workshop discovery and booking platform featuring:
- Accurate seat inventory management with atomic reservation checks
- Integrated Razorpay payments with cryptographic verification and webhook resilience
- Role-Based Access Control (RBAC) separating regular attendees (`USER`) from administrators (`ADMIN`)
- Real-time/prompt seat updates preventing overselling under concurrent load
- Comprehensive reporting, workshop management, and revenue analytics

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client (React 19 + Vite)                    │
│   Tailwind CSS (Tokens) | React Router | Axios | Lucide Icons   │
└────────────────┬───────────────────────────────▲────────────────┘
                 │ HTTP / REST                   │ JSON Responses
                 ▼                               │
┌────────────────────────────────────────────────┴────────────────┐
│                   Server (Node.js + Express)                    │
│   Rate Limiter | Helmet | Auth Middleware | Zod Validation      │
├────────────────────────┬────────────────────────────────────────┤
│ Services:              │ Payment & Webhook Engine:              │
│ - AuthService          │ - Razorpay Order Creation (Paise)     │
│ - WorkshopService      │ - HMAC-SHA256 Signature Verification   │
│ - ReservationEngine    │ - Idempotent Webhook Handler           │
│ - AnalyticsService     │ - Test Payment Simulator               │
└───────────┬────────────┴───────────────────────┬────────────────┘
            │ Mongoose ODM                       │ Webhook Events
            ▼                                    ▼
┌─────────────────────────┐            ┌──────────────────────────┐
│   MongoDB 8.x Database  │            │     Razorpay Gateway     │
│ Users | Workshops       │            │ Test / Live Mode Orders  │
│ Bookings | Payments     │            └──────────────────────────┘
│ Reservations | Webhooks │
└─────────────────────────┘
```

## 2. Seat Inventory & Reservation Lifecycle
To prevent overselling workshop seats:
1. **Capacity Validation:** Available seats = `capacity - (bookedSeats + reservedSeats)`.
2. **Atomic Reservation:** An atomic MongoDB operation guarantees that seats are only reserved if `capacity - (bookedSeats + reservedSeats) >= requestedSeats`.
3. **Reservation TTL:** Each reservation is valid for 10 minutes.
4. **Fulfillment on Verification:** Upon verified payment confirmation, `bookedSeats` is incremented and `reservedSeats` is decremented.
5. **Background Release Worker:** A periodic worker sweeps reservations that passed their `expiresAt` without payment and restores `reservedSeats`.

## 3. Financial Integrity & Razorpay Integration
- **Integer Paise Representation:** All prices are stored and calculated strictly in integer paise (₹1,499.00 = 149,900 paise).
- **Client Un-trusted:** The frontend never submits or calculates the final order amount. The backend computes the amount directly from the workshop's verified price and seat count.
- **Genuine Razorpay Standard Checkout Default:**
  The frontend dynamically loads official Razorpay `checkout.js` and launches `new window.Razorpay(options).open()`. Customers interact directly with the authentic Razorpay checkout iframe supporting UPI, Cards, and Netbanking. The custom simulator is restricted to explicit opt-in development mode (`?simulator=true`) and strictly disabled in production.
- **Cryptographic Verification:** Signatures are validated via:
  `crypto.createHmac('sha256', secret).update(orderId + '|' + paymentId).digest('hex')`
  Compared safely using byte-length validation before `crypto.timingSafeEqual`.
- **Order & Amount Reconciliation:** Verification verifies that the Razorpay order ID matches the booking record, the amount matches the server-calculated total in paise, and currency is strictly `'INR'`.
- **Webhook Raw-body Verification:** Razorpay webhook requests are verified using the raw request buffer to ensure signature authenticity before processing.
- **Automated Refund Pipeline:**
  When a user cancels a confirmed booking:
  1. The booking status is updated to `CANCELLED`.
  2. If a paid transaction exists (`paymentStatus === 'PAID'`), the backend initiates an automated refund (`razorpay.payments.refund` in live mode or generated simulation reference `rfnd_sim_<nanoid>` in test mode).
  3. `paymentStatus` is updated to `REFUNDED` and `refundReference` is stamped on the booking and payment documents.
  4. Workshop seats are atomically returned to inventory (`bookedSeats` decremented).

## 4. Role-Based Access Control & Invariants
- **Strict Role Separation:**
  - `USER`: Can browse workshops, reserve seats, initiate payments, receive tickets, view booking history, and cancel tickets for automated refunds. Users **cannot** access `/admin/*` routes or modify workshops.
  - `ADMIN`: Has administrative control over workshop catalog management, CSV transaction reporting, registered user visibility, and revenue analytics.
- **Admin Booking Invariant:**
  - Administrators are explicitly restricted from booking workshops. The backend checkout endpoint rejects booking attempts by admin accounts with HTTP 403 Forbidden (`ADMIN_CANNOT_BOOK`).
  - The frontend workshop detail view dynamically swaps the booking CTA for an administrative quick-edit badge when an admin is authenticated.
- **Single Admin Baseline:**
  - Baseline configuration preserves exactly one platform administrator (`snehkheni`, `admin@workshoply.dev`). User creation in production is strictly user-driven, with no test or dummy bookings persisting in clean state.
