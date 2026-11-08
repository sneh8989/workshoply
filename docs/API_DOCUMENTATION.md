# Workshoply REST API Documentation

Base URL: `http://localhost:5000/api/v1`

---

## 1. Authentication Endpoints

### Register User
- **Route:** `POST /auth/register`
- **Access:** Public
- **Rate Limit:** 30 requests / 15 mins
- **Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "phone": "+91 98765 43210"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "_id": "67...",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "USER",
      "phone": "+91 98765 43210"
    },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

### Login
- **Route:** `POST /auth/login`
- **Access:** Public
- **Body:**
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Current User Profile
- **Route:** `GET /auth/me`
- **Access:** Authenticated (`Authorization: Bearer <token>`)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "User profile retrieved",
  "data": {
    "user": {
      "id": "67...",
      "email": "jane@example.com",
      "role": "USER",
      "name": "Jane Doe"
    }
  }
}
```

---

## 2. Workshops Endpoints

### List Workshops
- **Route:** `GET /workshops`
- **Access:** Public
- **Query Parameters:**
  - `search`: string (keyword in title/description/instructor)
  - `category`: string (e.g. `Web Development`, `Artificial Intelligence`)
  - `minPrice`: integer (in INR)
  - `maxPrice`: integer (in INR)
  - `deliveryMode`: `ONLINE` | `IN_PERSON` | `HYBRID`
  - `skillLevel`: `BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `ALL_LEVELS`
  - `sort`: `date_asc` | `date_desc` | `price_asc` | `price_desc` | `rating` | `popular`
  - `page`: integer (default 1)
  - `limit`: integer (default 12)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Workshops retrieved",
  "data": [
    {
      "_id": "...",
      "title": "Mastering Full-Stack React & Node.js Architecture",
      "slug": "mastering-full-stack-react-and-nodejs-architecture-1r1o3",
      "category": "Web Development",
      "priceInPaise": 199900,
      "availableSeats": 27,
      "availabilityState": "AVAILABLE"
    }
  ],
  "meta": {
    "total": 9,
    "page": 1,
    "limit": 12,
    "pages": 1
  }
}
```

### Workshop Availability Check
- **Route:** `GET /workshops/:identifier/availability`
- **Access:** Public
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "capacity": 35,
    "bookedSeats": 8,
    "reservedSeats": 0,
    "availableSeats": 27,
    "availabilityState": "AVAILABLE",
    "status": "PUBLISHED"
  }
}
```

---

## 3. Booking & Payment Endpoints

### Initiate Booking & Seat Hold
- **Route:** `POST /bookings`
- **Access:** Authenticated (`USER` role only; `ADMIN` accounts are rejected with `403 Forbidden` and code `ADMIN_CANNOT_BOOK`)
- **Body:**
```json
{
  "workshopId": "67...",
  "seatQuantity": 2,
  "attendeeDetails": [
    { "name": "Jane Doe", "email": "jane@example.com" },
    { "name": "John Smith", "email": "john@example.com" }
  ],
  "notes": "Interested in system architecture."
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "booking": {
      "bookingRef": "WKL-20261027-A8B9CD",
      "totalAmountInPaise": 399800,
      "bookingStatus": "PENDING_PAYMENT",
      "paymentStatus": "PENDING"
    },
    "razorpayOrder": {
      "id": "order_...",
      "amount": 399800,
      "currency": "INR"
    },
    "razorpayKeyId": "rzp_test_...",
    "expiresAt": "2026-10-27T05:25:00.000Z"
  }
}
```

### Verify Razorpay Payment Signature
- **Route:** `POST /payments/verify`
- **Access:** Authenticated
- **Body:**
```json
{
  "bookingRef": "WKL-20261027-A8B9CD",
  "razorpayOrderId": "order_...",
  "razorpayPaymentId": "pay_...",
  "razorpaySignature": "hmac_sha256_hex_string"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment verified and booking confirmed",
  "data": {
    "booking": {
      "bookingRef": "WKL-20261027-A8B9CD",
      "bookingStatus": "CONFIRMED",
      "paymentStatus": "PAID"
    },
    "alreadyConfirmed": false
  }
}
```

### Cancel Booking (With Automated Refund)
- **Route:** `POST /bookings/:bookingRef/cancel`
- **Access:** Authenticated (Booking owner or Admin)
- **Body:**
```json
{
  "reason": "Schedule conflict"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Booking cancelled and refund processed successfully",
  "data": {
    "bookingRef": "WKL-20261027-A8B9CD",
    "bookingStatus": "CANCELLED",
    "paymentStatus": "REFUNDED",
    "refundReference": "rfnd_sim_k91b4...",
    "refundAmountInPaise": 399800
  }
}
```

---

## 4. Razorpay Webhook Endpoint

### Webhook Event Ingestion
- **Route:** `POST /webhooks/razorpay`
- **Access:** Razorpay Server Callback
- **Header:** `x-razorpay-signature: <hmac_hex>`
- **Payload:** Raw Razorpay webhook event JSON payload.
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Webhook processed",
  "data": {
    "status": "PROCESSED",
    "eventType": "payment.captured"
  }
}
```

---

## 5. Administration Endpoints

*(Requires `Authorization: Bearer <admin_token>` and `role: "ADMIN"`)*

### Overview & Revenue Analytics
- **Route:** `GET /admin/analytics/overview`
- **Response (200 OK):** Returns total revenue (from captured payments only), booking trends, workshop performance.

### Workshop Management
- `GET /admin/workshops` — List all workshops (including drafts and cancelled)
- `POST /admin/workshops` — Create new workshop
- `PATCH /admin/workshops/:id` — Update workshop
- `PATCH /admin/workshops/:id/toggle-publish` — Toggle status between `PUBLISHED` and `DRAFT`
- `DELETE /admin/workshops/:id` — Cancel workshop

### Bookings Management & Export
- `GET /admin/bookings` — Search and filter bookings
- `GET /admin/bookings/export-csv` — Download CSV report of all transactions
- `GET /admin/users` — Directory of registered accounts
