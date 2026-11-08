# Workshoply — Comprehensive Automated Browser QA & Audit Report

**Author / Project Owner:** Sneh Kheni ([@sneh8989](https://github.com/sneh8989))  
**Target Application:** Workshoply Full-Stack Platform  
**Target URLs:** Frontend: `http://localhost:5173`, Backend: `http://localhost:5000/api/v1`  
**Execution Timestamp:** 2026-11-08T03:47:51Z  
**Total Browser Test Phases:** 10 Phases  
**Overall Result:** 100% PASSED (All 10 Phases Passed, 22 Visual Screenshots Captured)  
**Database State After Execution:** Clean Baseline Preserved (Single Admin `snehkheni`, 0 Residual Bookings, 0 Residual Payments)  

---

## 1. Executive Summary & Verification Matrix

| Phase | Description | Observed Result | Screenshots Captured | Status |
| :--- | :--- | :--- | :--- | :---: |
| **Phase 1** | Landing Page & Public Navigation | Branding, hero search, value props, and 12 workshops rendered | `01_landing_page.png` | **PASSED** |
| **Phase 2** | Registration & Form Validation | Caught short password (< 6 chars); registered unique student | `02_registration_validation_error.png`<br>`03_registered_dashboard.png` | **PASSED** |
| **Phase 3** | Session Management & Authentication | Protected route redirection; invalid password rejection; login | `04_protected_route_redirect.png`<br>`05_invalid_login_error.png`<br>`06_login_successful_dashboard.png` | **PASSED** |
| **Phase 4** | Workshop Discovery & Search | Catalog loaded 12 workshops; filtered query for "React" | `07_workshops_catalog.png`<br>`08_search_react_results.png` | **PASSED** |
| **Phase 5** | Admin Booking Restriction Guard | Admin CTA disabled on detail; direct checkout blocked with banner | `09_admin_booking_disabled_detail.png`<br>`10_admin_checkout_blocked.png` | **PASSED** |
| **Phase 6** | Real User Booking & Seat Hold | Student view enabled; checkout opened with seat quantity & attendees | `11_workshop_detail_user.png`<br>`12_checkout_page.png` | **PASSED** |
| **Phase 7** | Payment & Signature Verification | Razorpay simulator modal opened; authorized payment confirmed | `13_razorpay_simulator_modal.png`<br>`14_booking_confirmation.png` | **PASSED** |
| **Phase 8** | Digital Admission Ticket & QR Code | Modal rendered official admission pass with dynamic QR code | `15_digital_ticket_qr_modal.png` | **PASSED** |
| **Phase 9** | Cancellation & Full Refund | Cancellation dialog with refund notice; status -> "Refunded" | `16_dashboard_paid_booking.png`<br>`17_cancellation_refund_dialog.png`<br>`18_dashboard_refunded_booking.png` | **PASSED** |
| **Phase 10**| Administrator Portal Audit | Overview metrics, Bookings audit (refund ref verified), Users audit | `19_admin_overview.png`<br>`20_admin_booking_details_modal.png`<br>`21_admin_workshops.png`<br>`22_admin_users.png` | **PASSED** |

---

## 2. Detailed Phase-by-Phase Verification Log

### Phase 1: Home Page & Public Navigation
- **Actions:** Navigated to `http://localhost:5173/` using headless Chromium.
- **Verification:** Verified page title: `"Workshoply | Discover & Book Masterclasses with Expert Instructors"`. Verified navigation links (`Browse Workshops`, `Categories`, `How It Works`), `Sign In`, and `Get Started`.
- **Artifact:** `01_landing_page.png`

### Phase 2: Registration Validation & Signup
- **Validation Test:** Filled signup form with short password `"123"`. Form blocked submission and displayed error: `"Password must be at least 6 characters long."`
  - **Artifact:** `02_registration_validation_error.png`
- **Registration Test:** Filled valid credentials (`Ananya Patel`, `ananya.patel.XXXXX@test.com`, `Password123!`). Form submitted successfully (HTTP 201), JWT tokens saved, and browser redirected to `/dashboard`.
  - **Artifact:** `03_registered_dashboard.png`

### Phase 3: Session Management & Authentication
- **Protected Route Test:** Cleared localStorage and directly navigated to `/dashboard`. Client guard intercepted and redirected to `/login?redirect=%2Fdashboard`.
  - **Artifact:** `04_protected_route_redirect.png`
- **Invalid Password Test:** Attempted login with `"WrongPassword999!"`. Server rejected with HTTP 401: `"Invalid email or password"`.
  - **Artifact:** `05_invalid_login_error.png`
- **Valid Login Test:** Authenticated with valid student credentials. Received fresh JWT tokens and redirected to `/dashboard`.
  - **Artifact:** `06_login_successful_dashboard.png`

### Phase 4: Workshop Discovery & Search
- **Catalog Inspection:** Loaded `/workshops`. Verified 12 published workshops displayed with category pills, instructor avatars, date badges, and remaining seat counts.
  - **Artifact:** `07_workshops_catalog.png`
- **Search Query Test:** Typed `"React"` into search box and pressed enter. Workshop list filtered in real time to 1 matching workshop: `"Mastering Full-Stack React & Node.js Architecture"`.
  - **Artifact:** `08_search_react_results.png`

### Phase 5: Admin Booking Restriction Verification
- **Admin Authentication:** Authenticated as platform administrator `snehkheni` (`admin@workshoply.dev`).
- **Detail CTA Check:** Navigated to workshop detail page. Evaluated `isAdmin === true`. Verified that the booking CTA is replaced by a disabled button: `"Booking Disabled for Admins"` with an informative banner.
  - **Artifact:** `09_admin_booking_disabled_detail.png`
- **Direct Route Guard Check:** Attempted direct navigation to `/checkout/6ae02db304d5b21cbc7a018b`. Checkout component evaluated administrator role, blocked form rendering, and displayed: `"Booking Disabled for Administrators"`.
  - **Artifact:** `10_admin_checkout_blocked.png`

### Phase 6: Real User Workshop Booking & Seat Hold
- **Student Navigation:** Logged in as regular student account. Navigated to React workshop detail page. Verified `"Book Your Seat Now"` button is active and enabled.
  - **Artifact:** `11_workshop_detail_user.png`
- **Checkout Preparation:** Clicked `"Book Your Seat Now"`. Reached `/checkout/:id`. Verified seat selector (`1. Select Seat Quantity`), attendee inputs, price breakdown (`₹1,999`), and backend seat hold.
  - **Artifact:** `12_checkout_page.png`

### Phase 7: Razorpay Payment & Cryptographic Verification
- **Payment Initiation:** Clicked submit to initiate checkout. Backend validated seat availability, created temporary reservation hold, created Razorpay order, and returned payment config.
- **Simulator Rendering:** Built-in Razorpay developer simulator modal opened displaying official `#0C2340` header, amount `₹1,999`, and payment methods.
  - **Artifact:** `13_razorpay_simulator_modal.png`
- **Payment Verification:** Clicked `"Authorize & Pay ₹1,999"`. Backend cryptographically verified payment signature, converted reserved seat hold into a booked seat, and returned HTTP 200 with confirmed booking.
- **Confirmation View:** UI displayed `"Booking Confirmed!"` with authoritative booking reference `WKL-20261108-10D54F`.
  - **Artifact:** `14_booking_confirmation.png`

### Phase 8: Digital Admission Ticket & QR Code
- **Ticket Modal:** Clicked `"View & Print Admission Ticket"`. Modal rendered `"Official Workshoply Ticket"` with attendee pass details, workshop schedule, Google Meet link, and dynamic SVG QR code.
  - **Artifact:** `15_digital_ticket_qr_modal.png`

### Phase 9: Customer Dashboard & Ticket Cancellation with Refund
- **Dashboard Inspection:** Navigated to `/dashboard`. Confirmed booking was displayed under `"All Bookings"` and `"Confirmed & Upcoming"` with `"Paid"` status.
  - **Artifact:** `16_dashboard_paid_booking.png`
- **Cancellation Dialog:** Clicked `"Cancel"` on booking card. Confirmation dialog opened with notice: `"Cancel Workshop Booking & Issue Refund? This booking has a completed payment of ₹1,999. A full refund will be processed back to your original payment method immediately."`
  - **Artifact:** `17_cancellation_refund_dialog.png`
- **Refund Execution:** Clicked `"Confirm & Process Refund"`. Backend called `processRefund`, generated refund reference `rfnd_...`, updated booking status to `CANCELLED`, updated payment status to `REFUNDED`, and released the seat back to available inventory.
- **Dashboard Update:** Card status updated to `"Refunded"` with refund reference badge.
  - **Artifact:** `18_dashboard_refunded_booking.png`

### Phase 10: Administrator Portal Inspection
- **Overview KPIs:** Logged in as admin `snehkheni`. Navigated to `/admin`. Verified Verified Captured Revenue, Confirmed Bookings count, and Workshop Seat Utilization table.
  - **Artifact:** `19_admin_overview.png`
- **Bookings Audit:** Navigated to `/admin/bookings`. Located cancelled booking `WKL-20261108-10D54F`. Opened booking details modal: verified that Razorpay Order ID, Razorpay Payment ID, and `"Refund Reference:"` are prominently displayed.
  - **Artifact:** `20_admin_booking_details_modal.png`
- **Workshops Inventory:** Navigated to `/admin/workshops`. Verified workshop management table with edit, toggle publish, and cancel controls.
  - **Artifact:** `21_admin_workshops.png`
- **User Directory:** Navigated to `/admin/users`. Verified registered user directory displaying single administrator `snehkheni`.
  - **Artifact:** `22_admin_users.png`

### Phase 11: Genuine Razorpay Standard Checkout & Signature Security Verification
- **Default Checkout Flow:** Navigated to checkout as a registered attendee user. Clicked `"Proceed to Pay"`.
- **Razorpay Checkout.js Integration:** The application dynamically verified `window.Razorpay` script readiness and opened the genuine Razorpay Standard Checkout iframe (`iframe.razorpay-checkout-frame` from `https://api.razorpay.com/v1/checkout/public`).
- **Simulator Bypassed:** Confirmed the custom developer simulator modal was completely bypassed.
  - **Artifact:** `genuine_razorpay_checkout.png`
- **Pre-Payment Invariant:** Confirmed booking remained strictly in `PENDING_PAYMENT` state with payment status `PENDING` prior to backend verification.
- **Dismissal Safety:** Simulated customer closing the checkout modal. Confirmed the booking remained unconfirmed and `isSubmitting` was safely reset to allow payment retry.
- **Security Check 1 (Tampered Signature Rejection):** Submitted tampered signature to `POST /api/v1/payments/verify`. Backend rejected with HTTP 400 Bad Request and marked payment `FAILED`.
- **Security Check 2 (Mismatched Order Rejection):** Submitted altered order ID. Backend rejected with HTTP 400 Bad Request.
- **Security Check 3 (Authentic HMAC-SHA256 Verification):** Verified genuine payment with authentic signature. Backend confirmed booking (`CONFIRMED`), captured payment (`PAID`), and allocated seat inventory (`bookedSeats: 1`, `reservedSeats: 0`).
- **Security Check 4 (Idempotency):** Duplicate verification call returned existing confirmed booking without double-allocating seats (`alreadyConfirmed: true`).
- **Post-Payment Ticket View:** Customer dashboard displayed verified booking and scannable digital ticket pass modal with QR code.
  - **Artifact:** `ticket_after_genuine_razorpay.png`

---

## 3. Database Cleanup & Invariant Verification

Upon completion of the automated browser test suite, the runner executed the automated cleanup block:
- Deleted temporary test user `ananya.patel.XXXX@test.com`.
- Deleted all associated test bookings, payments, and reservations.
- Reset workshop seats (`bookedSeats: 0`, `reservedSeats: 0`).
- Confirmed database users: `[ 'snehkheni (ADMIN)' ]`.
- Confirmed residual bookings: `0`.
- Confirmed residual payments: `0`.
