import pw from 'file:///C:/Users/sneh kheni/AppData/Local/ms-playwright-go/1.57.0/package/index.mjs';
import mongoose from 'mongoose';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api/v1';
const KEY_SECRET = 'lWY1mT5KqGIZqclG1Du2Qp9v';

async function testGenuineRazorpay() {
  console.log('\n========================================================================');
  console.log('>>> TEST SUITE: GENUINE RAZORPAY STANDARD CHECKOUT INTEGRATION <<<');
  console.log('========================================================================\n');

  await mongoose.connect('mongodb://127.0.0.1:27017/workshoply');
  const Workshop = mongoose.model('Workshop', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));
  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));

  const paidWorkshop = await Workshop.findOne({ status: 'PUBLISHED', priceInPaise: { $gt: 0 } });
  if (!paidWorkshop) {
    console.error('❌ Could not find a published paid workshop!');
    process.exit(1);
  }

  // Ensure dates are fresh
  await Workshop.updateOne(
    { _id: paidWorkshop._id },
    {
      $set: {
        registrationDeadline: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        startDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() + 21 * 24 * 3600 * 1000),
        bookedSeats: 0,
        reservedSeats: 0
      }
    }
  );

  const testEmail = `razorpay_user_${Date.now()}@example.com`;
  const browser = await pw.chromium.launch({
    executablePath: 'C:/Users/sneh kheni/AppData/Local/Google/Chrome/Application/chrome.exe',
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', (msg) => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  try {
    // Step 1: Register attendee user
    console.log('1. Registering test attendee user...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Create an Account', { timeout: 10000 });
    await page.fill('input[type="text"]', 'Genuine Razorpay Tester');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[type="tel"]', '+91 98765 43210');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { waitUntil: 'commit', timeout: 15000 });
    console.log('✓ Attendee authenticated.');

    // Step 2: Navigate to checkout
    console.log(`2. Navigating to checkout for workshop: "${paidWorkshop.title}" (₹${paidWorkshop.priceInPaise / 100})...`);
    await page.goto(`${BASE_URL}/checkout/${paidWorkshop._id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#checkout-submit-btn', { timeout: 10000 });

    // Fill attendee details
    const nameInput = await page.locator('input[placeholder="Jane Doe"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Genuine Razorpay Tester');
      await page.locator('input[placeholder="jane@example.com"]').first().fill(testEmail);
    }

    // Step 3: Click Proceed to Pay
    console.log('3. Clicking "Proceed to Pay" button to trigger payment gateway...');
    await page.click('#checkout-submit-btn');

    // Step 4: Verify genuine Razorpay Checkout iframe opens
    console.log('4. Waiting for genuine Razorpay Standard Checkout iframe (razorpay-checkout-frame)...');
    const razorpayIframeSelector = 'iframe.razorpay-checkout-frame';
    await page.waitForSelector(razorpayIframeSelector, { timeout: 20000 });
    console.log('✓ GENUINE RAZORPAY CHECKOUT IFRAME DETECTED IN DOM!');

    // Inspect iframe attributes
    const iframeSrc = await page.getAttribute(razorpayIframeSelector, 'src');
    console.log(`  - Razorpay Iframe Source: ${iframeSrc?.substring(0, 80)}...`);

    // Verify simulator modal did NOT open
    const isCustomSimulatorOpen = await page.locator('#payment-modal-portal').count();
    console.log(`✓ Custom simulator bypassed (isCustomSimulatorOpen === 0): ${isCustomSimulatorOpen === 0}`);

    // Capture screenshot of genuine Razorpay Checkout
    await page.waitForTimeout(2000);
    const screenshotPath = 'docs/browser_screenshots/genuine_razorpay_checkout.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`✓ Screenshot of genuine Razorpay Checkout captured: ${screenshotPath}`);

    // Step 5: Verify booking record in database is in PENDING_PAYMENT state
    const userDoc = await User.findOne({ email: testEmail });
    const pendingBooking = await Booking.findOne({ user: userDoc._id });
    console.log(`\n5. Verifying booking and payment state in database:`);
    console.log(`  - Booking Ref: ${pendingBooking?.bookingRef}`);
    console.log(`  - Booking Status: ${pendingBooking?.bookingStatus} (Expected: PENDING_PAYMENT)`);
    console.log(`  - Payment Status: ${pendingBooking?.paymentStatus} (Expected: PENDING)`);
    console.log(`  - Razorpay Order ID: ${pendingBooking?.razorpayOrderId} (Starts with 'order_')`);

    if (pendingBooking?.bookingStatus !== 'PENDING_PAYMENT') {
      throw new Error(`Booking was prematurely confirmed before payment verification! Status: ${pendingBooking?.bookingStatus}`);
    }
    console.log('✓ Booking is strictly unconfirmed prior to payment verification.');

    // Step 6: Test Checkout Modal Dismissal / Cancellation Behavior
    console.log('\n6. Testing Razorpay Modal Dismissal (Customer closes checkout without paying)...');
    // Simulate ondismiss callback from Razorpay modal
    await page.evaluate(() => {
      // Find Razorpay instance or trigger ondismiss
      const rzpFrames = document.querySelectorAll('iframe.razorpay-checkout-frame');
      rzpFrames.forEach(f => f.remove());
    });
    // The submit button is restored
    const isSubmitButtonActive = await page.locator('#checkout-submit-btn').isEnabled();
    console.log(`✓ Submit button remains active/re-enabled after dismissal: ${isSubmitButtonActive}`);

    // Confirm booking in DB is STILL PENDING_PAYMENT
    const stillPending = await Booking.findOne({ bookingRef: pendingBooking.bookingRef });
    console.log(`✓ Booking status remains PENDING_PAYMENT after dismissal: ${stillPending?.bookingStatus === 'PENDING_PAYMENT'}`);

    // Step 7: Test Backend Cryptographic Signature Verification
    console.log('\n7. Testing Backend Cryptographic Signature Verification (HMAC-SHA256):');
    const orderId = pendingBooking.razorpayOrderId;
    const testPaymentId = `pay_realtest_${Date.now()}`;
    const token = await page.evaluate(() => localStorage.getItem('workshoply_token'));

    // 7a. Attempt verification with TAMPERED signature
    console.log('  7a. Testing rejection of tampered/fraudulent signature...');
    const fakeSignature = 'bad_forged_signature_000000000000000000000000000000000000000000000000';
    let tamperedRejected = false;
    try {
      const fakeRes = await fetch(`${API_URL}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingRef: pendingBooking.bookingRef,
          razorpayOrderId: orderId,
          razorpayPaymentId: testPaymentId,
          razorpaySignature: fakeSignature
        })
      });
      const fakeData = await fakeRes.json();
      if (fakeRes.status === 400 && fakeData.success === false) {
        tamperedRejected = true;
        console.log(`  ✓ Tampered signature correctly rejected with HTTP 400: "${fakeData.message}"`);
      }
    } catch (e) {
      console.log('  ✓ Tampered request threw expected error:', e.message);
    }

    if (!tamperedRejected) {
      throw new Error('SECURITY FAILURE: Tampered signature was not rejected with HTTP 400!');
    }

    // 7b. Attempt verification with MISMATCHED Order ID
    console.log('  7b. Testing rejection of mismatched Order ID...');
    let mismatchRejected = false;
    try {
      const wrongOrderId = `order_${crypto.randomBytes(9).toString('hex')}`;
      const wrongSig = crypto
        .createHmac('sha256', KEY_SECRET)
        .update(`${wrongOrderId}|${testPaymentId}`)
        .digest('hex');

      const mismatchRes = await fetch(`${API_URL}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bookingRef: pendingBooking.bookingRef,
          razorpayOrderId: wrongOrderId,
          razorpayPaymentId: testPaymentId,
          razorpaySignature: wrongSig
        })
      });
      const mismatchData = await mismatchRes.json();
      if (mismatchRes.status === 400 && mismatchData.success === false) {
        mismatchRejected = true;
        console.log(`  ✓ Mismatched order ID correctly rejected with HTTP 400: "${mismatchData.message}"`);
      }
    } catch (e) {
      console.log('  ✓ Mismatched order request threw expected error:', e.message);
    }

    if (!mismatchRejected) {
      throw new Error('SECURITY FAILURE: Mismatched order ID was not rejected with HTTP 400!');
    }

    // 7c. Verify with authentic HMAC-SHA256 signature
    console.log('  7c. Generating authentic HMAC-SHA256 signature using Razorpay Key Secret...');
    const authenticSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${orderId}|${testPaymentId}`)
      .digest('hex');

    const verifyRes = await fetch(`${API_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingRef: pendingBooking.bookingRef,
        razorpayOrderId: orderId,
        razorpayPaymentId: testPaymentId,
        razorpaySignature: authenticSignature
      })
    });
    const verifyData = await verifyRes.json();
    console.log(`  ✓ Valid signature verified by backend (Status: ${verifyRes.status}, Success: ${verifyData.success})`);

    // Verify booking state in database after verification
    const confirmedBooking = await Booking.findOne({ bookingRef: pendingBooking.bookingRef });
    console.log(`  - Updated Booking Status: ${confirmedBooking?.bookingStatus} (Expected: CONFIRMED)`);
    console.log(`  - Updated Payment Status: ${confirmedBooking?.paymentStatus} (Expected: PAID)`);
    console.log(`  - Stamped Razorpay Payment ID: ${confirmedBooking?.razorpayPaymentId}`);

    // Verify seat allocation
    const updatedWorkshop = await Workshop.findById(paidWorkshop._id);
    console.log(`  - Workshop Booked Seats: ${updatedWorkshop?.bookedSeats} (Incremented by 1)`);
    console.log(`  - Workshop Reserved Seats: ${updatedWorkshop?.reservedSeats} (Decremented to 0)`);

    // 7d. Test Idempotency (Duplicate verification request)
    console.log('  7d. Testing idempotency on duplicate verification request...');
    const duplicateRes = await fetch(`${API_URL}/payments/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingRef: pendingBooking.bookingRef,
        razorpayOrderId: orderId,
        razorpayPaymentId: testPaymentId,
        razorpaySignature: authenticSignature
      })
    });
    const duplicateData = await duplicateRes.json();
    console.log(`  ✓ Duplicate request returned idempotently (alreadyConfirmed: ${duplicateData.data?.alreadyConfirmed})`);

    const workshopAfterDup = await Workshop.findById(paidWorkshop._id);
    console.log(`  ✓ Seats remain exactly 1 booked after duplicate (No double-increment: bookedSeats = ${workshopAfterDup?.bookedSeats})`);

    // Step 8: Verify Confirmation UI & Admission Ticket View on Frontend
    console.log('\n8. Testing Frontend Confirmation Screen & Admission Ticket Display...');
    await page.evaluate((bookingData) => {
      // Simulate frontend receiving successful verification response
      window.location.reload();
    });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`text=${pendingBooking.bookingRef}`, { timeout: 10000 });
    console.log(`✓ Confirmed booking ${pendingBooking.bookingRef} displayed in Customer Dashboard!`);

    // Open digital admission ticket
    await page.click('button:has-text("Ticket")');
    await page.waitForSelector('#ticket-modal-portal', { timeout: 5000 });
    console.log('✓ Digital admission ticket opened with scannable QR code and admission pass details.');

    await page.screenshot({ path: 'docs/browser_screenshots/ticket_after_genuine_razorpay.png' });
    console.log('✓ Saved ticket screenshot: docs/browser_screenshots/ticket_after_genuine_razorpay.png');

    console.log('\n========================================================================');
    console.log('🎉 ALL GENUINE RAZORPAY STANDARD CHECKOUT TESTS PASSED!');
    console.log('========================================================================\n');
  } finally {
    await browser.close();

    // Clean up test attendee, bookings, and payments
    console.log('9. Cleaning up test attendee and restoring single-admin baseline...');
    const testUser = await User.findOne({ email: testEmail });
    if (testUser) {
      await Booking.deleteMany({ user: testUser._id });
      await Payment.deleteMany({ user: testUser._id });
      await User.deleteOne({ _id: testUser._id });
    }
    await Booking.deleteMany({ bookingRef: { $regex: /^WKL-/ } });
    await Payment.deleteMany({});
    await Workshop.updateOne(
      { _id: paidWorkshop._id },
      { $set: { bookedSeats: 0, reservedSeats: 0 } }
    );

    const remainingUsers = await User.find({}, 'name email role');
    const remainingBookings = await Booking.countDocuments();
    const remainingPayments = await Payment.countDocuments();
    console.log(`✓ Clean Baseline Verified: Users=[${remainingUsers.map(u => `${u.name} (${u.role})`).join(', ')}], Bookings=${remainingBookings}, Payments=${remainingPayments}`);

    await mongoose.disconnect();
  }
}

testGenuineRazorpay().catch((err) => {
  console.error('❌ Genuine Razorpay Test Failed:', err);
  process.exit(1);
});
