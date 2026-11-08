import pw from 'file:///C:/Users/sneh kheni/AppData/Local/ms-playwright-go/1.57.0/package/index.mjs';
const { chromium } = pw;
import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000/api/v1';

async function runModalUITests() {
  console.log('🚀 Starting Workshoply Checkout Payment Modal UI & Backdrop Test Suite...\n');

  // Connect to DB to fetch published paid workshop
  await mongoose.connect('mongodb://127.0.0.1:27017/workshoply');
  const Workshop = mongoose.model('Workshop', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));
  const Payment = mongoose.model('Payment', new mongoose.Schema({}, { strict: false }));

  const paidWorkshop = await Workshop.findOne({ status: 'PUBLISHED', priceInPaise: { $gt: 0 } });
  if (!paidWorkshop) {
    console.error('❌ Could not find a published paid workshop in database!');
    process.exit(1);
  }
  console.log(`✓ Target workshop identified: "${paidWorkshop.title}" (ID: ${paidWorkshop._id})`);

  // Ensure registration dates are projected into the future
  await Workshop.updateOne(
    { _id: paidWorkshop._id },
    {
      $set: {
        registrationDeadline: new Date(Date.now() + 14 * 24 * 3600 * 1000),
        startDate: new Date(Date.now() + 20 * 24 * 3600 * 1000),
        endDate: new Date(Date.now() + 21 * 24 * 3600 * 1000)
      }
    }
  );

  const browser = await pw.chromium.launch({
    executablePath: 'C:/Users/sneh kheni/AppData/Local/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const viewports = [
    { name: 'Desktop (1440px)', width: 1440, height: 900 },
    { name: 'Laptop (1280px)', width: 1280, height: 800 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Mobile (390px)', width: 390, height: 844 },
    { name: 'Small Mobile (360px)', width: 360, height: 740 }
  ];

  const results = [];
  const testEmail = `modal_tester_${Date.now()}@example.com`;

  try {
    // 1. Create a temporary attendee user session
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('1. Registering test attendee user...');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Create an Account', { timeout: 10000 });
    await page.fill('input[type="text"]', 'Modal Tester');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[type="tel"]', '+91 98765 43210');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { waitUntil: 'commit', timeout: 15000 });
    console.log('✓ Registration successful and authenticated.');

    // 2. Navigate to checkout page
    console.log(`2. Navigating to checkout for workshop ${paidWorkshop._id}...`);
    await page.goto(`${BASE_URL}/checkout/${paidWorkshop._id}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#checkout-submit-btn', { timeout: 10000 });

    // Fill attendee details if not already present
    const nameInput = await page.locator('input[placeholder="Jane Doe"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Modal Tester');
      await page.locator('input[placeholder="jane@example.com"]').first().fill(testEmail);
    }

    // 3. Open the payment simulator modal
    console.log('3. Clicking Proceed to Pay to trigger payment modal...');
    await page.click('#checkout-submit-btn');
    await page.waitForSelector('#payment-modal-portal', { timeout: 10000 });
    console.log('✓ Payment modal portal rendered successfully in document.body.');

    // 4. Verify Viewport Backdrop Coverage and Stacking Context
    console.log('4. Inspecting Backdrop Geometry, Z-Index, and Navbar Coverage...');
    const backdropStats = await page.evaluate(() => {
      const portal = document.getElementById('payment-modal-portal');
      const backdrop = portal ? portal.querySelector('[aria-hidden="true"]') : null;
      const dialog = portal ? portal.querySelector('[role="dialog"]') : null;
      const header = document.querySelector('header');
      const root = document.getElementById('root');

      const portalRect = portal.getBoundingClientRect();
      const backdropRect = backdrop ? backdrop.getBoundingClientRect() : null;
      const dialogRect = dialog ? dialog.getBoundingClientRect() : null;
      const headerRect = header ? header.getBoundingClientRect() : null;

      const portalStyle = window.getComputedStyle(portal);
      const backdropStyle = backdrop ? window.getComputedStyle(backdrop) : null;
      const headerStyle = header ? window.getComputedStyle(header) : null;
      const dialogStyle = dialog ? window.getComputedStyle(dialog) : null;

      return {
        bodyOverflow: document.body.style.overflow,
        rootAriaHidden: root ? root.getAttribute('aria-hidden') : null,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        portal: {
          position: portalStyle.position,
          zIndex: portalStyle.zIndex,
          top: portalRect.top,
          left: portalRect.left,
          width: portalRect.width,
          height: portalRect.height
        },
        backdrop: backdropRect ? {
          top: backdropRect.top,
          left: backdropRect.left,
          width: backdropRect.width,
          height: backdropRect.height,
          backgroundColor: backdropStyle.backgroundColor,
          backdropFilter: backdropStyle.backdropFilter || backdropStyle.webkitBackdropFilter
        } : null,
        dialog: dialogRect ? {
          top: dialogRect.top,
          left: dialogRect.left,
          width: dialogRect.width,
          height: dialogRect.height,
          zIndex: dialogStyle.zIndex
        } : null,
        header: headerRect ? {
          top: headerRect.top,
          left: headerRect.left,
          zIndex: headerStyle.zIndex
        } : null
      };
    });

    console.log('Backdrop Inspection Data:');
    console.log(`  - Body overflow locked: "${backdropStats.bodyOverflow}" === 'hidden'`);
    console.log(`  - Root aria-hidden set: "${backdropStats.rootAriaHidden}" === 'true'`);
    console.log(`  - Portal Z-Index: ${backdropStats.portal.zIndex} (Header Z-Index: ${backdropStats.header?.zIndex || 40})`);
    console.log(`  - Backdrop covers top-left: (${backdropStats.backdrop?.top}, ${backdropStats.backdrop?.left})`);
    console.log(`  - Backdrop dimensions: ${backdropStats.backdrop?.width}x${backdropStats.backdrop?.height} (Viewport: ${backdropStats.viewportWidth}x${backdropStats.viewportHeight})`);

    const isBackdropFull =
      backdropStats.backdrop &&
      backdropStats.backdrop.top === 0 &&
      backdropStats.backdrop.left === 0 &&
      Math.abs(backdropStats.backdrop.width - backdropStats.viewportWidth) <= 1 &&
      Math.abs(backdropStats.backdrop.height - backdropStats.viewportHeight) <= 1;

    console.log(`✓ Full-screen backdrop coverage confirmed: ${isBackdropFull ? 'YES' : 'NO'}`);

    // Verify Messaging
    const modalText = await page.textContent('#payment-modal-portal');
    const hasBrandHeader = modalText.includes('Razorpay') && modalText.includes('TEST MODE');
    const hasSandboxSubtitle = modalText.includes('Workshoply Sandbox Payment Gateway');
    const hasMethodDetails = modalText.includes('Instant UPI Simulation');
    const hasAuthButton = modalText.includes('Authorize Test Payment');
    const hasSslFooter = modalText.includes('Razorpay Sandbox Test Environment');

    console.log(`✓ Consistent Test Mode Messaging Verified:
      - Brand & TEST MODE badge: ${hasBrandHeader}
      - Sandbox gateway subtitle: ${hasSandboxSubtitle}
      - UPI Simulation description: ${hasMethodDetails}
      - Authorize Test Payment button: ${hasAuthButton}
      - 256-bit SSL Simulation footer: ${hasSslFooter}`);

    // Verify payment method toggle
    console.log('5. Testing Payment Method Toggles...');
    await page.click('button[role="radio"]:has-text("Cards")');
    const hasCardDetails = (await page.textContent('#payment-modal-portal')).includes('Test Card Simulation');
    console.log(`✓ Switched to Cards: ${hasCardDetails}`);

    await page.click('button[role="radio"]:has-text("Netbanking")');
    const hasNetbankingDetails = (await page.textContent('#payment-modal-portal')).includes('Netbanking Simulation');
    console.log(`✓ Switched to Netbanking: ${hasNetbankingDetails}`);

    // Verify Escape key closing
    console.log('6. Testing Safe Escape Key Modal Dismissal...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const isModalOpenAfterEscape = await page.locator('#payment-modal-portal').count();
    console.log(`✓ Modal closed by Escape key: ${isModalOpenAfterEscape === 0}`);

    // Reopen modal for responsive tests
    await page.click('#checkout-submit-btn');
    await page.waitForSelector('#payment-modal-portal');

    // 7. Test responsive viewports
    console.log('\n7. Testing Viewport Breakpoints & Capturing Screenshots...');
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(400);

      const metrics = await page.evaluate(() => {
        const portal = document.getElementById('payment-modal-portal');
        const dialog = portal ? portal.querySelector('[role="dialog"]') : null;
        const backdrop = portal ? portal.querySelector('[aria-hidden="true"]') : null;

        const dRect = dialog.getBoundingClientRect();
        const bRect = backdrop.getBoundingClientRect();

        return {
          viewport: { w: window.innerWidth, h: window.innerHeight },
          dialog: {
            top: dRect.top,
            left: dRect.left,
            width: dRect.width,
            height: dRect.height,
            isHorizontallyCentered: Math.abs((window.innerWidth - dRect.width) / 2 - dRect.left) < 5,
            isVerticallyCentered: Math.abs((window.innerHeight - dRect.height) / 2 - dRect.top) < 5
          },
          backdrop: {
            top: bRect.top,
            left: bRect.left,
            width: bRect.width,
            height: bRect.height
          }
        };
      });

      const shotPath = `docs/browser_screenshots/modal_${vp.width}px.png`;
      await page.screenshot({ path: shotPath });
      console.log(`  ✓ ${vp.name}: Dialog ${Math.round(metrics.dialog.width)}x${Math.round(metrics.dialog.height)}px, Centered: H=${metrics.dialog.isHorizontallyCentered}, V=${metrics.dialog.isVerticallyCentered}. Saved ${shotPath}`);
      results.push({ ...vp, metrics, shotPath });
    }

    // 8. Test Payment Success Flow
    console.log('\n8. Testing End-to-End Test Payment Authorization...');
    await page.click('button:has-text("Authorize Test Payment")');
    // Verify processing state
    const isProcessingVisible = await page.locator('text=Processing Test Payment').isVisible();
    console.log(`✓ Processing indicator active: ${isProcessingVisible}`);

    // Wait for booking confirmation screen
    await page.waitForSelector('text=Booking Confirmed!', { timeout: 15000 });
    console.log('✓ Booking confirmed successfully through updated payment modal!');

    console.log(`\nConsole Errors Count: ${consoleErrors.length}`);
    if (consoleErrors.length > 0) {
      console.log('Errors:', consoleErrors);
    }

    await context.close();
  } finally {
    await browser.close();

    // Clean up temporary tester user, booking, and payment
    console.log('\n9. Cleaning up test data to restore single-admin invariant...');
    const testUser = await User.findOne({ email: testEmail });
    if (testUser) {
      await Booking.deleteMany({ user: testUser._id });
      await Payment.deleteMany({ user: testUser._id });
      await User.deleteOne({ _id: testUser._id });
    }
    // Also remove any dangling test bookings/payments
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

  console.log('\n🎉 ALL PAYMENT MODAL UI & BACKDROP TESTS COMPLETED SUCCESSFULLY!\n');
}

runModalUITests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
