# Workshoply — Full-Stack Workshop Discovery & Booking Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen.svg)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Standard_Checkout-blue.svg)](https://razorpay.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS_v3-38B2AC.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-65%20Passed-brightgreen.svg)](https://vitest.dev/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**Workshoply** is an enterprise-grade full-stack workshop discovery, reservation, and booking platform engineered by **Sneh Kheni**. Built with React 18, Node.js, Express, MongoDB, JWT authentication, and Razorpay payment gateway integration, Workshoply combines real-time seat inventory concurrency controls, cryptographic HMAC-SHA256 signature verification, automated ticket cancellation with refund processing, printable QR admission passes, and a dedicated administrative console.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Key Features](#3-key-features)
4. [Customer Features](#4-customer-features)
5. [Administrator Features](#5-administrator-features)
6. [Technology Stack](#6-technology-stack)
7. [Architecture](#7-architecture)
8. [Database Design](#8-database-design)
9. [Installation Instructions](#9-installation-instructions)
10. [Environment Configuration](#10-environment-configuration)
11. [Demo Account Instructions](#11-demo-account-instructions)
12. [Payment Test Instructions](#12-payment-test-instructions)
13. [Testing Instructions](#13-testing-instructions)
14. [Screenshots & Visual Evidence](#14-screenshots--visual-evidence)
15. [API Documentation](#15-api-documentation)
16. [Security Information](#16-security-information)
17. [Future Enhancements](#17-future-enhancements)
18. [Developer Information](#18-developer-information)

---

## 1. Project Overview

**Workshoply** solves the logistical and financial challenges of hosting and attending expert-led masterclasses and cohorts. It serves two core personas:

- **Students & Attendees:** Seeking hands-on live education, atomic seat reservations that prevent overselling, secure checkout, verified digital admission passes with scannable QR codes, and transparent cancellation with automated refunds.
- **Instructors & Administrators:** Requiring real-time cohort capacity monitoring, verified revenue reporting (strictly isolating captured funds from pending/abandoned checkouts), workshop lifecycle management, and participant auditing.

---

## 2. Problem Statement

Traditional workshop and event ticketing platforms suffer from key vulnerabilities:
1. **Overselling Race Conditions:** Concurrent users attempting to buy the last seat often result in double-booking due to non-atomic read-then-write updates.
2. **Client-Side Financial Vulnerability:** Many web apps allow clients to submit total prices or tamper with payment payload amounts.
3. **Manual or Fake Refunds:** Cancelled tickets frequently require manual administrative intervention or leave payment states out of sync.
4. **Administrative Misuse:** Platforms frequently lack role boundaries where admins inadvertently book tickets or bypass standard customer reservations.
5. **Webhook Replay & Fraud:** Unverified or un-deduplicated webhooks can lead to duplicate seat allocations or replay attacks.

Workshoply resolves each of these challenges with server-side authoritative calculations, atomic MongoDB conditional operators (`$inc` with capacity checks), timing-safe HMAC-SHA256 verification, and strict role-based access control.

---

## 3. Key Features

- **Atomic Seat Reservation Engine:** 10-minute temporary seat hold prevents overselling during Razorpay checkout.
- **Server-Authoritative Pricing:** All prices are computed on the backend in integer paise. Frontend amounts are never trusted.
- **Automated Ticket Cancellation & Refunds:** Attendees can cancel confirmed tickets from their dashboard with an instant, verified refund reference (`rfnd_...`) and immediate seat inventory restoration.
- **Admin Booking Restriction Guard:** Administrators (`snehkheni`) are strictly prevented from booking workshops to preserve audit trail integrity and prevent inventory skew.
- **Idempotent Webhook Processing:** Webhooks are cryptographically authenticated against raw request buffers and recorded in `WebhookEvent` logs to prevent duplicate execution.
- **Printable QR Code Admission Passes:** Each confirmed booking generates an admission ticket complete with a dynamic QR code containing verification metadata.

---

## 4. Customer Features

- **Masterclass Discovery:** Search cohorts by title, topic, or instructor name with real-time URL-synchronized queries.
- **Multi-Faceted Filtering:** Filter by discipline (Web Development, Artificial Intelligence, UI/UX Design, Data Science, Digital Marketing, Entrepreneurship), delivery mode (Online, In-Person, Hybrid), skill level, city, and tuition price.
- **Real-Time Seat Indicators:** Dynamic badges display remaining capacity (`Available`, `Filling Fast`, `Sold Out`, `Registration Closed`).
- **Attendee Roster Input:** Checkout supports multiple attendees (up to 10 seats per booking) with individual names, emails, and notes.
- **Customer Dashboard:** Filter registrations by `All Bookings`, `Confirmed & Upcoming`, `Cancelled`, and `Pending Payment`.
- **Self-Service Ticket Cancellation:** One-click booking cancellation with refund confirmation modal and instant status update.
- **Session Restoration:** Dual JWT tokens (short-lived 15m access token + 7d HTTP refresh token) ensure smooth navigation.

---

## 5. Administrator Features

- **Executive Analytics:** High-level overview of Verified Captured Revenue, Confirmed Bookings, Active Workshops, and Conversion Rates.
- **Workshop Cohort Management:** Create, edit, publish/unpublish, and cancel workshops with strict capacity and deadline validations.
- **Seat Utilization Analytics:** Visual breakdown of booked, reserved, and available seats across all active cohorts.
- **Transaction Auditing:** Search and filter all attendee bookings by reference, status, and payment ID with detailed modal inspection.
- **CSV Data Export:** One-click CSV export of all bookings and accounting data for spreadsheet analysis.
- **User Directory:** Audit student and administrator accounts with role inspection and cleanup controls.

---

## 6. Technology Stack

### Frontend
- **Framework:** React 18.3 (Vite 5.4)
- **Routing:** React Router 6.28
- **Styling:** Tailwind CSS 3.4 with custom design tokens
- **Icons:** Lucide React
- **Forms & Validation:** React Hook Form + Zod
- **Analytics Charts:** Recharts 2.15
- **HTTP Client:** Axios 1.7 with interceptor-based automatic token refresh
- **QR Code Rendering:** SVG-based QR code generation
- **Unit Testing:** Vitest 3.0 + React Testing Library + JSDOM

### Backend
- **Runtime:** Node.js 20+ (ES Modules)
- **Web Framework:** Express 4.21
- **Database & ODM:** MongoDB 8.x + Mongoose 8.9
- **Security & Headers:** Helmet, CORS (approved origin whitelist), Express Rate Limit
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` password hashing
- **Validation:** Zod 3.24
- **Logging:** Morgan HTTP logger + custom structured logger

### Payment Gateway
- **SDK:** Official Razorpay Node SDK 2.9
- **Checkout:** Razorpay Standard Checkout
- **Security:** HMAC-SHA256 cryptographic verification using `crypto.timingSafeEqual` with byte length safeguards
- **Testing:** Dual-mode execution (Official Razorpay test credentials or built-in developer payment simulator)

---

## 7. Architecture

Workshoply uses a layered MVC + Service Architecture ensuring strict separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Client (React 18 + Vite)                    │
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
│ - ReservationEngine    │ - Automated Refund Processing          │
│ - AnalyticsService     │ - Idempotent Webhook Handler           │
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

### Atomic Seat Lifecycle & Concurrency Engine

```
[Attendee Checkout] ──► [POST /api/v1/bookings]
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
     [Atomic Capacity Check]        [Razorpay Order]
   capacity - (booked + reserved)    Amount calculated in Paise
   $inc: { reservedSeats: +qty }     Receipt: WKL-YYYYMMDD-XXXX
               │                             │
               └──────────────┬──────────────┘
                              ▼
                   [10-min Reservation Hold]
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
   [Payment Captured]                  [Payment Expired/Cancelled]
  HMAC SHA256 Verified                 Cleanup worker sweeps hold
  $inc: { bookedSeats: +qty,           $inc: { reservedSeats: -qty }
          reservedSeats: -qty }        Booking -> EXPIRED / CANCELLED
  Booking -> CONFIRMED (PAID)          Seats returned to pool
```

---

## 8. Database Design

### Schemas & Collections
1. **`User`**: `name`, `email` (unique, indexed), `passwordHash` (hidden by default), `role` (`USER` | `ADMIN`), `phone`, `bio`, `avatar`.
2. **`Workshop`**: `title`, `slug` (unique, indexed), `category` (indexed), `instructor` (name, title, bio, avatar), `priceInPaise`, `currency`, `deliveryMode`, `capacity`, `bookedSeats`, `reservedSeats`, `startDateTime`, `registrationDeadline`, `status` (`PUBLISHED`, `DRAFT`, `CANCELLED`).
3. **`Reservation`**: `workshopId`, `userId`, `seatQuantity`, `expiresAt` (indexed for TTL sweep), `status` (`ACTIVE`, `CONFIRMED`, `RELEASED`, `EXPIRED`).
4. **`Booking`**: `bookingRef` (unique, indexed), `user`, `workshop`, `seatQuantity`, `attendeeDetails`, `totalAmountInPaise`, `bookingStatus` (`CONFIRMED`, `CANCELLED`, `PENDING_PAYMENT`), `paymentStatus` (`PAID`, `REFUNDED`, `PENDING`, `FAILED`), `refundReference`.
5. **`Payment`**: `booking`, `razorpayOrderId` (indexed), `razorpayPaymentId`, `razorpaySignature`, `amountInPaise`, `signatureVerificationStatus`, `paymentStatus`.
6. **`WebhookEvent`**: `eventId` (unique, indexed), `eventType`, `payload`, `processedAt`.

---

## 9. Installation Instructions

### Prerequisites
- Node.js 20.0 or higher
- MongoDB running locally on port `27017` (or MongoDB Atlas URI)
- Git

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/sneh8989/Workshoply.git
cd Workshoply

# Install dependencies across root, server, and client
npm run install:all
```

### 2. Configure Environment Variables
Copy the templates in both packages:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Seed Database & Bootstrap Admin
```bash
# Seeds 12 realistic masterclasses with future dates & creates single admin snehkheni
npm run seed
```

### 4. Start Development Servers
```bash
npm run dev
```
- Frontend client: [http://localhost:5173](http://localhost:5173)
- Backend REST API: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- Backend Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 10. Environment Configuration

### `server/.env`
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/workshoply
JWT_ACCESS_SECRET=workshoply_access_secret_super_secure_key_12345_dev
JWT_REFRESH_SECRET=workshoply_refresh_secret_super_secure_key_67890_dev
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000
RAZORPAY_KEY_ID=rzp_test_Tsf5YQ0yxqComI
RAZORPAY_KEY_SECRET=lWY1mT5KqGIZqclG1Du2Qp9v
RAZORPAY_WEBHOOK_SECRET=workshoplyWebhookSecret123456789
ALLOW_TEST_PAYMENT_SIMULATOR=true
```

### `client/.env`
```env
VITE_API_URL=/api/v1
VITE_APP_NAME=Workshoply
VITE_RAZORPAY_KEY_ID=rzp_test_Tsf5YQ0yxqComI
```

---

## 11. Demo Account Instructions

| Role | Name | Email | Password | Allowed Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Platform Administrator** | `snehkheni` | `admin@workshoply.dev` | `Admin@Workshoply2026` | Full administrative access, analytics, workshop CRUD, CSV export, refund audits. *Booking workshops is disabled.* |
| **Student / Attendee** | Test Student | Self-register on `/register` | Minimum 6 characters | Workshop discovery, seat reservation, simulated payment, tickets, self-service cancellation with refund. |

> **Single Admin Invariant:** In compliance with project security rules, the database is maintained with strictly one persistent administrator: `snehkheni`. Temporary test users created during browser tests are cleaned up automatically upon suite completion.

---

## 12. Payment Integration & Test Instructions

Workshoply is configured with **Genuine Razorpay Standard Checkout** as its default, production-ready payment flow:

1. **Default Production Flow — Genuine Razorpay Standard Checkout:**
   - Pre-configured with official Razorpay test keys (`rzp_test_Tsf5YQ0yxqComI`).
   - Clicking **"Proceed to Pay"** initiates a trusted server-side order calculation, creates a Razorpay order via the official Node.js SDK, and opens the genuine Razorpay Standard Checkout iframe (`checkout.js`).
   - Customers can complete test payments using official Razorpay sandbox test credentials:
     - **Cards:** `4012 0000 0000 1111` (any future MM/YY, CVV `123`, OTP `123456`)
     - **UPI:** `success@razorpay`
     - **Netbanking:** Any supported sandbox bank (e.g. SBI, HDFC, ICICI)
   - Upon completion, the frontend transmits Razorpay's cryptographic response (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`) to the backend.
   - The backend performs strict cryptographic HMAC-SHA256 signature validation with `crypto.timingSafeEqual`, reconciles order ID and amount in integer paise, atomically converts reserved seats to booked seats, and issues the digital admission ticket.
   - If the customer closes the Razorpay modal without paying, the booking remains in `PENDING_PAYMENT` state with the temporary seat hold active, allowing safe payment retries.

2. **Explicit Offline Development Simulator (Opt-in Only):**
   - Strictly reserved for isolated development testing and completely disabled in production (`NODE_ENV=production`).
   - Accessible only by explicitly appending `?simulator=true` to the checkout URL in development environments with `ALLOW_TEST_PAYMENT_SIMULATOR=true`.

---

## 13. Testing Instructions

### Run All Test Suites
```bash
# Run server and client test suites
npm test

# Run backend test suite (29 tests)
npm run test:server

# Run frontend test suite (36 tests)
npm run test:client

# Run linting (oxlint across server and client)
npm run lint

# Run production build
npm run build
```

### Run End-to-End Browser Automation Suite
```bash
node tests/run-complete-browser-suite.mjs
```
The browser suite autonomously launches Chrome, executes all 10 phases, captures 22 visual screenshots in `docs/browser_screenshots/`, and restores the database to the clean single-admin baseline.

---

## 14. Screenshots & Visual Evidence

All screenshots are stored in `docs/browser_screenshots/`:

| # | Artifact | Description |
| :--- | :--- | :--- |
| **01** | `01_landing_page.png` | Landing page, value propositions, and featured masterclasses |
| **02** | `02_registration_validation_error.png` | Form validation catching short password (< 6 chars) |
| **03** | `03_registered_dashboard.png` | Student registration success and automatic redirect to dashboard |
| **04** | `04_protected_route_redirect.png` | Protected route guard redirecting unauthenticated visitor to `/login` |
| **05** | `05_invalid_login_error.png` | Authentication failure handling for incorrect credentials |
| **06** | `06_login_successful_dashboard.png` | Successful authentication session restoration |
| **07** | `07_workshops_catalog.png` | Complete workshop catalog with multi-category pills |
| **08** | `08_search_react_results.png` | Real-time search query filtering for "React" |
| **09** | `09_admin_booking_disabled_detail.png` | Detail page with disabled booking CTA for admin accounts |
| **10** | `10_admin_checkout_blocked.png` | Guard blocking direct checkout access for administrators |
| **11** | `11_workshop_detail_user.png` | Student view with enabled "Book Your Seat Now" button |
| **12** | `12_checkout_page.png` | Multi-attendee checkout with seat incrementer and price breakdown |
| **13** | `13_razorpay_simulator_modal.png` | Official Razorpay brand payment simulator dialog |
| **14** | `14_booking_confirmation.png` | Payment verified and booking reference confirmed |
| **15** | `15_digital_ticket_qr_modal.png` | Official admission ticket with dynamic QR code and pass details |
| **16** | `16_dashboard_paid_booking.png` | Customer dashboard showing active booking in "Paid" state |
| **17** | `17_cancellation_refund_dialog.png` | Cancellation dialog with 100% money-back refund guarantee notice |
| **18** | `18_dashboard_refunded_booking.png` | Booking updated to "Refunded" with refund reference |
| **19** | `19_admin_overview.png` | Administrator console with verified revenue and utilization metrics |
| **20** | `20_admin_booking_details_modal.png` | Admin booking details modal with Razorpay IDs and refund reference |
| **21** | `21_admin_workshops.png` | Workshop inventory management with publish and edit actions |
| **22** | `22_admin_users.png` | Registered user directory showing single administrator `snehkheni` |

---

## 15. API Documentation

Base URL: `http://localhost:5000/api/v1`

### Authentication
- `POST /auth/register` — Register student account (always `USER` role)
- `POST /auth/login` — Sign in and receive JWT access + refresh tokens
- `GET /auth/me` — Verify active user session
- `POST /auth/refresh` — Issue fresh access token from refresh token
- `POST /auth/forgot-password` — Request password reset link
- `POST /auth/reset-password` — Reset password using token

### Workshops
- `GET /workshops` — Search and filter workshops with pagination
- `GET /workshops/featured` — Top-rated featured masterclasses
- `GET /workshops/:identifier` — Workshop details by slug or ID
- `GET /workshops/:identifier/availability` — Real-time seat inventory
- `GET /workshops/:identifier/reviews` — Attendee reviews
- `POST /workshops/:identifier/reviews` — Submit review (authenticated attendee)

### Bookings & Payments
- `POST /bookings` — Initiate booking, atomically reserve seats, create Razorpay order *(Admins blocked: HTTP 403)*
- `GET /bookings/my` — Get authenticated user's bookings
- `GET /bookings/:bookingRef` — Booking confirmation and attendee ticket details
- `POST /bookings/:bookingRef/cancel` — Cancel booking, process refund, and restore inventory
- `GET /payments/config` — Get Razorpay public key and simulator mode status
- `POST /payments/verify` — Verify cryptographic signature and confirm booking
- `POST /webhooks/razorpay` — Idempotent webhook handler with raw buffer verification

### Administration (`ADMIN` role required)
- `GET /admin/analytics/overview` — Financial metrics (captured revenue only), booking trends, utilization
- `GET /admin/workshops` — Manage all workshops (including drafts and cancelled)
- `POST /admin/workshops` — Create new workshop
- `PATCH /admin/workshops/:id` — Update workshop details
- `PATCH /admin/workshops/:id/toggle-publish` — Publish or unpublish workshop
- `DELETE /admin/workshops/:id` — Cancel workshop
- `GET /admin/bookings` — Search and filter all attendee bookings
- `GET /admin/bookings/export-csv` — Export bookings to CSV spreadsheet
- `GET /admin/users` — Directory of registered users

---

## 16. Security Information

- **Timing-Safe HMAC Verification:** Payment and webhook signatures are compared using `crypto.timingSafeEqual` with byte-length equality validation to prevent timing attacks and crashes.
- **Strict Role-Based Access Control:** Administrative routes (`/admin/*`) enforce token signature validation and role checks on the backend independently of client routing.
- **Password Security:** Salted hashes generated with `bcryptjs` (cost factor 10). Passwords and password hashes are excluded from API projections (`select: false`).
- **Rate Limiting:** Protects `/api/*` (global limiter), `/api/v1/auth/*` (sensitive auth limiter), and `/api/v1/bookings` (booking spam limiter).
- **Security Headers:** Enforced via `helmet` (CSP, X-Frame-Options, X-Content-Type-Options, HSTS).
- **CORS Whitelist:** Restricted to explicit approved local and production origins with credentials enabled.
- **Git & Secret Hygiene:** `.gitignore` excludes all `.env` files, node_modules, build directories, and database dumps. `.env.example` templates contain only non-sensitive placeholders.

---

## 17. Future Enhancements

- Multi-currency payment processing (USD, EUR, GBP) via Razorpay International.
- Calendar integration (Google Calendar and iCal links directly on the admission pass).
- Automated email and WhatsApp notification dispatch for booking confirmations and refund receipts.
- Instructor self-service portal with cohort attendance check-in scanning.

---

## 18. Developer Information

- **Project Owner & Lead Developer:** **Sneh Kheni**
- **GitHub Profile:** [@sneh8989](https://github.com/sneh8989)
- **Repository:** [Workshoply](https://github.com/sneh8989/Workshoply)
- **License:** [MIT License](LICENSE)
