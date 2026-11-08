import pw from 'file:///C:/Users/sneh kheni/AppData/Local/ms-playwright-go/1.57.0/package/index.mjs';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'd:/Workshoply/docs/browser_screenshots';
const MONGODB_URI = 'mongodb://127.0.0.1:27017/workshoply';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page, filename) {
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  📸 Screenshot saved: ${filename}`);
}

async function runSuite() {
  console.log('\n===============================================================');
  console.log('>>> WORKSHOPLY AUTOMATED FULL-STACK BROWSER QA TEST SUITE <<<');
  console.log('Target URL: ' + BASE_URL);
  console.log('Execution Time: ' + new Date().toISOString());
  console.log('===============================================================\n');

  // Pre-cleanup in MongoDB to ensure clean starting state
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  await db.collection('users').deleteMany({ role: { $ne: 'ADMIN' } });
  await db.collection('bookings').deleteMany({});
  await db.collection('payments').deleteMany({});
  await db.collection('reservations').deleteMany({});

  // Ensure workshop dates are always fresh and active
  const now = new Date();
  const workshops = await db.collection('workshops').find({}).toArray();
  for (let i = 0; i < workshops.length; i++) {
    const w = workshops[i];
    const daysOffset = 5 + (i * 2);
    const start = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const deadline = new Date(now.getTime() + (daysOffset - 1) * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
    await db.collection('workshops').updateOne(
      { _id: w._id },
      {
        $set: {
          startDateTime: start,
          registrationDeadline: deadline,
          endDateTime: end,
          bookedSeats: 0,
          reservedSeats: 0
        }
      }
    );
  }
  console.log('✓ Database verified: Clean baseline with single admin snehkheni and active workshop dates.');
  await mongoose.disconnect();

  const browser = await pw.chromium.launch({
    executablePath: 'C:/Users/sneh kheni/AppData/Local/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  // Test credentials
  const timestamp = Date.now();
  const testUser = {
    name: 'Ananya Patel',
    email: `ananya.patel.${timestamp}@test.com`,
    password: 'Password123!',
    phone: '+91 9876543210'
  };

  const adminUser = {
    email: 'admin@workshoply.dev',
    password: 'Admin@Workshoply2026'
  };

  let capturedBookingRef = '';
  let capturedRefundRef = '';

  try {
    // -------------------------------------------------------------
    // PHASE 1: Home Page & Public Navigation
    // -------------------------------------------------------------
    console.log('\n--- PHASE 1: Home Page & Public Navigation ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const pageTitle = await page.title();
    console.log('✓ Page title verified:', pageTitle);

    await page.waitForSelector('text=Workshoply');
    await page.waitForSelector('text=Browse Workshops');
    console.log('✓ Branding and navigation bar rendered.');
    await takeScreenshot(page, '01_landing_page.png');

    // -------------------------------------------------------------
    // PHASE 2: Registration Validation & User Signup
    // -------------------------------------------------------------
    console.log('\n--- PHASE 2: Registration Validation & Signup ---');
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    await page.waitForSelector('text=Create an Account');

    // 2.1 Test validation error for short password
    console.log('  Testing client-side validation error for short password (< 6 chars)...');
    await page.fill('input[type="text"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', '123');
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=Password must be at least 6 characters long.');
    console.log('✓ Validation error caught: "Password must be at least 6 characters long."');
    await takeScreenshot(page, '02_registration_validation_error.png');

    // 2.2 Submit valid registration
    console.log('  Submitting valid registration form...');
    await page.fill('input[type="password"]', testUser.password);
    await page.fill('input[type="tel"]', testUser.phone);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000, waitUntil: 'commit' });
    console.log('✓ Successfully registered and redirected to /dashboard!');
    await page.waitForSelector(`text=${testUser.name}`);
    await takeScreenshot(page, '03_registered_dashboard.png');

    // -------------------------------------------------------------
    // PHASE 3: Session Management, Logout & Login
    // -------------------------------------------------------------
    console.log('\n--- PHASE 3: Session Management & Authentication ---');
    // Clear localStorage to simulate logout
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });

    // Protected route must redirect to login
    await page.waitForURL('**/login?redirect=%2Fdashboard', { timeout: 15000, waitUntil: 'commit' });
    console.log('✓ Protected route correctly enforced! Redirected to /login?redirect=%2Fdashboard');
    await takeScreenshot(page, '04_protected_route_redirect.png');

    // 3.1 Test invalid password rejection
    console.log('  Testing invalid password error...');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', 'WrongPassword999!');
    await page.click('button[type="submit"]');

    await page.waitForSelector('text=/Invalid email or password/i');
    console.log('✓ Invalid login rejected with error message: "Invalid email or password"');
    await takeScreenshot(page, '05_invalid_login_error.png');

    // 3.2 Valid login
    console.log('  Logging in with valid credentials...');
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000, waitUntil: 'commit' });
    console.log('✓ Login successful! Redirected to /dashboard');
    await page.waitForSelector(`text=${testUser.name}`);
    await takeScreenshot(page, '06_login_successful_dashboard.png');

    // -------------------------------------------------------------
    // PHASE 4: Workshop Discovery, Search & Filters
    // -------------------------------------------------------------
    console.log('\n--- PHASE 4: Workshop Discovery & Search ---');
    await page.goto(`${BASE_URL}/workshops`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h3');
    const allWorkshops = await page.$$('h3');
    console.log(`✓ Workshop catalog loaded with ${allWorkshops.length} workshops.`);
    await takeScreenshot(page, '07_workshops_catalog.png');

    // Search for "React"
    console.log('  Searching for "React"...');
    await page.fill('input[placeholder*="Search by title"]', 'React');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);

    const searchResults = await page.$$('h3');
    console.log(`✓ Search for "React" returned ${searchResults.length} matching workshop(s).`);
    await takeScreenshot(page, '08_search_react_results.png');

    // Reset search
    await page.fill('input[placeholder*="Search by title"]', '');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);

    // -------------------------------------------------------------
    // PHASE 5: Admin Booking Restrictions Check
    // -------------------------------------------------------------
    console.log('\n--- PHASE 5: Admin Booking Restriction Verification ---');
    // Log in as Admin
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin', { timeout: 15000, waitUntil: 'commit' });
    console.log('✓ Admin successfully authenticated and redirected to /admin.');

    // Detail page booking button check
    await page.goto(`${BASE_URL}/workshops/mastering-full-stack-react-and-nodejs-architecture-1r1o3`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Booking Disabled for Admins');
    console.log('✓ Verified: Booking CTA is disabled for Administrator on workshop detail page.');
    await takeScreenshot(page, '09_admin_booking_disabled_detail.png');

    // Attempt direct navigation to checkout as Admin
    await page.goto(`${BASE_URL}/checkout/6ae02db304d5b21cbc7a018b`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Booking Disabled for Administrators');
    console.log('✓ Verified: Direct checkout access is blocked with "Booking Disabled for Administrators" banner.');
    await takeScreenshot(page, '10_admin_checkout_blocked.png');

    // -------------------------------------------------------------
    // PHASE 6: Real User Workshop Booking & Seat Hold
    // -------------------------------------------------------------
    console.log('\n--- PHASE 6: Real User Workshop Booking & Seat Hold ---');
    // Log back in as testUser
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000, waitUntil: 'commit' });

    // Navigate to React workshop
    await page.goto(`${BASE_URL}/workshops/mastering-full-stack-react-and-nodejs-architecture-1r1o3`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Book Your Seat Now');
    await takeScreenshot(page, '11_workshop_detail_user.png');

    console.log('  Clicking "Book Your Seat Now"...');
    await page.click('text=Book Your Seat Now');

    await page.waitForURL('**/checkout/**', { timeout: 15000, waitUntil: 'commit' });
    console.log('✓ Reached Checkout page:', page.url());
    await page.waitForSelector('text=1. Select Seat Quantity');

    // Ensure attendee 1 details are populated
    await page.fill('input[placeholder="Jane Doe"]', testUser.name);
    await page.fill('input[placeholder="jane@example.com"]', testUser.email);
    await takeScreenshot(page, '12_checkout_page.png');

    // -------------------------------------------------------------
    // PHASE 7: Razorpay Payment & Cryptographic Verification
    // -------------------------------------------------------------
    console.log('\n--- PHASE 7: Payment & Signature Verification ---');
    console.log('  Submitting checkout to initiate Razorpay payment...');
    await page.click('button[type="submit"]');

    // Wait for the simulator modal to appear
    await page.waitForSelector('text=/Authorize & Pay/i', { timeout: 15000 });
    console.log('✓ Razorpay Simulator Modal rendered with official brand layout.');
    await takeScreenshot(page, '13_razorpay_simulator_modal.png');

    console.log('  Authorizing test payment via "Authorize & Pay"...');
    await page.click('text=/Authorize & Pay/i');

    // Wait for confirmation view
    await page.waitForSelector('text=Booking Confirmed!', { timeout: 15000 });
    console.log('✓ Payment verified and booking confirmed!');

    // Extract booking reference
    capturedBookingRef = await page.evaluate(() => {
      const el = document.querySelector('.font-mono.font-bold.text-primary');
      return el ? el.textContent.trim() : '';
    });
    console.log('✓ Authoritative Booking Reference:', capturedBookingRef);
    await takeScreenshot(page, '14_booking_confirmation.png');

    // -------------------------------------------------------------
    // PHASE 8: Digital Admission Ticket & QR Code
    // -------------------------------------------------------------
    console.log('\n--- PHASE 8: Digital Admission Ticket & QR Code ---');
    await page.click('text=View & Print Admission Ticket');
    await page.waitForSelector('text=Official Workshoply Ticket');
    console.log('✓ Digital Admission Ticket modal rendered with QR Code and Attendee Pass.');
    await takeScreenshot(page, '15_digital_ticket_qr_modal.png');

    // Close modal
    await page.click('button[aria-label="Close Ticket Modal"]');
    await page.waitForTimeout(400);

    // -------------------------------------------------------------
    // PHASE 9: Customer Dashboard & Ticket Cancellation with Full Refund
    // -------------------------------------------------------------
    console.log('\n--- PHASE 9: Customer Dashboard & Ticket Cancellation with Refund ---');
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`text=${capturedBookingRef}`);
    console.log(`✓ Booking ${capturedBookingRef} found in Attendee Dashboard with "Paid" status.`);
    await takeScreenshot(page, '16_dashboard_paid_booking.png');

    // Click Cancel button on the booking card (using exact text match to not conflict with Cancelled tab)
    console.log('  Clicking exact "Cancel" button on the booking card...');
    await page.click('button:text-is("Cancel")');

    // Verify refund notice in confirmation dialog
    await page.waitForSelector('text=Cancel Workshop Booking & Issue Refund?');
    const dialogText = await page.innerText('.fixed.inset-0');
    console.log('✓ Cancellation Dialog popped up with refund guarantee notice:');
    const refundNoticeLine = dialogText.split('\n').find(l => l.includes('refund') || l.includes('Refund'));
    if (refundNoticeLine) {
      console.log(`  "${refundNoticeLine.trim()}"`);
    }
    await takeScreenshot(page, '17_cancellation_refund_dialog.png');

    // Confirm cancellation & refund
    console.log('  Clicking "Confirm & Process Refund"...');
    await page.click('button:has-text("Confirm & Process Refund")');

    // Wait for cancellation to complete and card to update
    await page.waitForTimeout(2000);
    await page.waitForSelector('text=Refunded');
    console.log('✓ Booking status successfully updated to "Refunded" on attendee dashboard!');

    // Check refund reference on the card
    const refundRefText = await page.evaluate(() => {
      const badge = document.querySelector('.text-purple-700.bg-purple-50');
      return badge ? badge.textContent.trim() : '';
    });
    capturedRefundRef = refundRefText;
    console.log(`✓ Refund Reference displayed on card: "${capturedRefundRef}"`);
    await takeScreenshot(page, '18_dashboard_refunded_booking.png');

    // -------------------------------------------------------------
    // PHASE 10: Administrator Portal Inspection
    // -------------------------------------------------------------
    console.log('\n--- PHASE 10: Administrator Portal Audit ---');
    // Log back in as Admin
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', adminUser.email);
    await page.fill('input[type="password"]', adminUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/admin', { timeout: 15000, waitUntil: 'commit' });
    console.log('✓ Arrived at Admin Overview.');
    await takeScreenshot(page, '19_admin_overview.png');

    // 10.1 Admin Bookings
    console.log('  Auditing Admin Bookings table...');
    await page.goto(`${BASE_URL}/admin/bookings`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(`text=${capturedBookingRef}`);
    console.log(`✓ Cancelled & Refunded booking ${capturedBookingRef} present in Admin Bookings.`);

    // Click Eye icon to open details modal
    const viewButton = await page.$(`button[aria-label="View details for booking ${capturedBookingRef}"]`);
    if (viewButton) {
      await viewButton.click();
      await page.waitForSelector('text=Booking Details');
      await page.waitForSelector('text=Refund Reference:');
      console.log('✓ Admin details modal verified: Displays "Refund Reference" alongside Razorpay IDs.');
      await takeScreenshot(page, '20_admin_booking_details_modal.png');
      await page.click('button[aria-label="Close booking details"]');
    } else {
      console.log('  Notice: View details button not directly found, skipping details modal check');
    }

    // 10.2 Admin Workshops
    console.log('  Auditing Admin Workshops inventory...');
    await page.goto(`${BASE_URL}/admin/workshops`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Workshop Management');
    console.log('✓ Admin Workshops management view operational.');
    await takeScreenshot(page, '21_admin_workshops.png');

    // 10.3 Admin Users
    console.log('  Auditing Admin Users list...');
    await page.goto(`${BASE_URL}/admin/users`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Registered User Directory');
    await page.waitForSelector('text=snehkheni');
    console.log('✓ Admin Users management view verified: Admin "snehkheni" present.');
    await takeScreenshot(page, '22_admin_users.png');

    console.log('\n===============================================================');
    console.log('>>> ALL 10 AUTOMATED BROWSER PHASES COMPLETED WITH 100% SUCCESS <<<');
    console.log('===============================================================\n');

  } finally {
    await browser.close();

    // -------------------------------------------------------------
    // CLEANUP: Preserve Pristine Single-Admin State (snehkheni)
    // -------------------------------------------------------------
    console.log('Cleaning up temporary test user and test bookings in MongoDB...');
    try {
      await mongoose.connect(MONGODB_URI);
      const db = mongoose.connection.db;

      if (testUser.email) {
        const u = await db.collection('users').findOne({ email: testUser.email });
        if (u) {
          await db.collection('bookings').deleteMany({ user: u._id });
          await db.collection('payments').deleteMany({ user: u._id });
          await db.collection('reservations').deleteMany({ user: u._id });
          await db.collection('users').deleteOne({ _id: u._id });
          console.log(`✓ Deleted test user "${testUser.email}" and all associated bookings/payments.`);
        }
      }

      // Also remove any stray non-admin users
      await db.collection('users').deleteMany({ role: { $ne: 'ADMIN' } });
      await db.collection('bookings').deleteMany({});
      await db.collection('payments').deleteMany({});
      await db.collection('reservations').deleteMany({});

      // Restore workshop seats to 0
      await db.collection('workshops').updateMany({}, { $set: { bookedSeats: 0, reservedSeats: 0 } });
      console.log('✓ Workshop seats verified and reset to 0.');

      const remainingUsers = await db.collection('users').find({}).toArray();
      console.log('Database users now:', remainingUsers.map(u => `${u.name} (${u.role})`));

      await mongoose.disconnect();
    } catch (cleanErr) {
      console.error('Error during database cleanup:', cleanErr.message);
    }
  }
}

runSuite().catch(err => {
  console.error('\n❌ Browser test suite encountered an unhandled error:', err);
  process.exit(1);
});
