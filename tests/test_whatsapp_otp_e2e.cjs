// tests/test_whatsapp_otp_e2e.cjs
// Comprehensive E2E tests for WhatsApp OTP Delivery System in TecnoRexa

const assert = require('assert');
const DB = require('better-sqlite3');

const BASE = 'http://localhost:5000/api';

async function req(method, path, body, token, extraHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...extraHeaders };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function getDbUser(phone) {
  const db = new DB('./tecnorexa.db');
  const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  db.close();
  return user;
}

function updateDbUser(id, updates) {
  const db = new DB('./tecnorexa.db');
  const sets = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  db.prepare(`UPDATE users SET ${sets} WHERE id = ?`).run(...values, id);
  db.close();
}

async function run() {
  console.log('=== WhatsApp OTP System Comprehensive E2E Tests ===\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ ${name}: ${err.message}`);
      failed++;
    }
  }

  const testPhone = '01011112222'; // Owner user with password 123456
  let loginTempToken = '';
  let generatedOtp = '';
  let whatsappUrl = '';

  // ─── Test 1: Egyptian Phone Format & WhatsApp URL Structure ───
  await test('Test 1: Egyptian phone converted to 2010... with properly encoded message in whatsappUrl', async () => {
    // Reset cooldown
    const user = getDbUser(testPhone);
    assert(user, 'User exists');
    updateDbUser(user.id, { lastOtpSentAt: null, otpAttempts: 0 });

    const res = await req('POST', '/auth/login', { phone: testPhone, password: 'password_or_default' });
    // In our seed, owner password is '123456'
    const loginRes = await req('POST', '/auth/login', { phone: testPhone, password: '123456' });
    assert.strictEqual(loginRes.status, 200, JSON.stringify(loginRes.data));
    assert.strictEqual(loginRes.data.requireOtp, true);
    assert(loginRes.data.tempToken, 'Must provide tempToken');
    assert(loginRes.data.whatsappUrl, 'Must provide whatsappUrl');

    loginTempToken = loginRes.data.tempToken;
    whatsappUrl = loginRes.data.whatsappUrl;

    // Check phone conversion: 01011112222 -> 201011112222
    assert(whatsappUrl.startsWith('https://wa.me/201011112222?text='), `Expected 201011112222 wa.me link, got ${whatsappUrl}`);

    // Decode message and verify contents
    const textPart = whatsappUrl.split('?text=')[1];
    const decodedMessage = decodeURIComponent(textPart);
    assert(decodedMessage.includes('رمز التحقق الخاص بك في TecnoRexa هو:'), 'Message missing greeting');
    assert(decodedMessage.includes('صالح لمدة 10 دقائق'), 'Message missing validity duration');
    assert(decodedMessage.includes('لا تشاركه مع أي شخص'), 'Message missing warning');

    // Extract OTP from message
    const match = decodedMessage.match(/(\d{6})/);
    assert(match, '6-digit OTP not found in WhatsApp message');
    generatedOtp = match[1];

    // Verify OTP matches DB
    const freshUser = getDbUser(testPhone);
    assert.strictEqual(freshUser.otpCode, generatedOtp, 'DB otpCode must match WhatsApp message OTP');
    assert.strictEqual(freshUser.otp, generatedOtp, 'DB otp must match WhatsApp message OTP');

    // Verify 10-minute expiry
    const expiresAt = new Date(freshUser.otpExpires).getTime();
    const now = Date.now();
    const diffMinutes = (expiresAt - now) / (60 * 1000);
    assert(diffMinutes >= 9 && diffMinutes <= 11, `Expected ~10 minutes expiry, got ${diffMinutes.toFixed(1)} mins`);
  });

  // ─── Test 2: Invalid / Wrong OTP ───
  await test('Test 4: Wrong OTP rejected and increments otpAttempts', async () => {
    const wrongOtp = '000000';
    const res = await req('POST', '/auth/verify-login-otp', {
      tempToken: loginTempToken,
      phone: testPhone,
      otp: wrongOtp,
    });
    assert.strictEqual(res.status, 400, 'Should reject incorrect OTP');
    assert(res.data.error.includes('غير صحيح'), `Expected error message about invalid code, got: ${res.data.error}`);

    const user = getDbUser(testPhone);
    assert.strictEqual(user.otpAttempts, 1, `Expected otpAttempts to be 1, got ${user.otpAttempts}`);
  });

  // ─── Test 3: Expired OTP ───
  await test('Test 5: Expired OTP rejected', async () => {
    const user = getDbUser(testPhone);
    // Artificially set expiry in the past
    updateDbUser(user.id, { otpExpires: new Date(Date.now() - 5000).toISOString() });

    const res = await req('POST', '/auth/verify-login-otp', {
      tempToken: loginTempToken,
      phone: testPhone,
      otp: generatedOtp,
    });
    assert.strictEqual(res.status, 400, 'Should reject expired OTP');
    assert(res.data.error.includes('انتهت صلاحية'), `Expected expiry error, got: ${res.data.error}`);
  });

  // ─── Test 4: Rate Limiting / 5 Max Attempts ───
  await test('Test 7: Exceeding 5 invalid attempts locks verification', async () => {
    const user = getDbUser(testPhone);
    // Reset valid expiry and set attempts = 5
    updateDbUser(user.id, {
      otpExpires: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      otpAttempts: 5,
    });

    const res = await req('POST', '/auth/verify-login-otp', {
      tempToken: loginTempToken,
      phone: testPhone,
      otp: generatedOtp,
    });
    assert.strictEqual(res.status, 429, 'Should return 429 when max attempts reached');
    assert(res.data.error.includes('الحد الأقصى للمحاولات'), `Expected max attempts error, got: ${res.data.error}`);
  });

  // ─── Test 5: Resend OTP Cooldown (60 seconds) ───
  await test('Test 6a: Resend OTP throttled under 60-second cooldown', async () => {
    const user = getDbUser(testPhone);
    updateDbUser(user.id, { lastOtpSentAt: new Date().toISOString() });

    const res = await req('POST', '/auth/resend-otp', {
      tempToken: loginTempToken,
      phone: testPhone,
    });
    assert.strictEqual(res.status, 429, 'Should throttle resend under 60 seconds');
    assert.strictEqual(res.data.cooldown, true, 'Cooldown flag should be true');
    assert(res.data.remainingSeconds > 0, 'Remaining seconds should be > 0');
  });

  // ─── Test 6: Resend OTP Invalidation & New WhatsApp URL ───
  await test('Test 6b: Resend OTP invalidates old OTP and generates fresh WhatsApp URL', async () => {
    const user = getDbUser(testPhone);
    // Clear cooldown to allow resend
    updateDbUser(user.id, { lastOtpSentAt: new Date(Date.now() - 70 * 1000).toISOString() });

    const res = await req('POST', '/auth/resend-otp', {
      tempToken: loginTempToken,
      phone: testPhone,
    });
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(res.data.whatsappUrl, 'Must return new whatsappUrl');
    assert(res.data.tempToken, 'Must return new tempToken');

    const newUrl = res.data.whatsappUrl;
    const textPart = newUrl.split('?text=')[1];
    const match = decodeURIComponent(textPart).match(/(\d{6})/);
    assert(match, 'New OTP not in message');
    const newOtp = match[1];

    assert.notStrictEqual(newOtp, generatedOtp, 'New OTP must differ from old OTP');

    // Old OTP should fail now
    const oldAttempt = await req('POST', '/auth/verify-login-otp', {
      tempToken: res.data.tempToken,
      phone: testPhone,
      otp: generatedOtp,
    });
    assert.strictEqual(oldAttempt.status, 400, 'Old OTP must be invalidated');

    // Update references
    loginTempToken = res.data.tempToken;
    generatedOtp = newOtp;
  });

  // ─── Test 7: Correct OTP Verifies & Invalidates (Single-use) ───
  await test('Test 3: Correct OTP successfully logs in, returns session token, and clears OTP fields', async () => {
    const res = await req('POST', '/auth/verify-login-otp', {
      tempToken: loginTempToken,
      phone: testPhone,
      otp: generatedOtp,
    });
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(res.data.token, 'Must return final session token');
    assert(res.data.user, 'Must return user object');
    assert.strictEqual(res.data.user.role, 'owner');

    // Verify OTP cleared in DB (single-use protection)
    const user = getDbUser(testPhone);
    assert.strictEqual(user.otpCode, null, 'otpCode must be cleared after verification');
    assert.strictEqual(user.otp, null, 'otp must be cleared after verification');
    assert.strictEqual(user.otpExpires, null, 'otpExpires must be cleared after verification');
    assert.strictEqual(user.phoneVerified, 1, 'phoneVerified must be 1');

    // Replay attack: using same OTP again must fail
    const replayRes = await req('POST', '/auth/verify-login-otp', {
      tempToken: loginTempToken,
      phone: testPhone,
      otp: generatedOtp,
    });
    assert.strictEqual(replayRes.status, 400, 'Replayed OTP must be rejected');
  });

  // ─── Test 8: Registration with WhatsApp OTP ───
  await test('Test 8: Registration generates WhatsApp URL and requires OTP verification', async () => {
    const uniquePhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
    const regRes = await req('POST', '/auth/register', {
      name: 'عميل واتساب تجريبي',
      phone: uniquePhone,
      password: 'password123',
      role: 'customer',
    });
    assert.strictEqual(regRes.status, 201, JSON.stringify(regRes.data));
    assert.strictEqual(regRes.data.requireOtp, true, 'Registration must require OTP');
    assert(regRes.data.whatsappUrl, 'Registration must provide whatsappUrl');
    assert(regRes.data.whatsappUrl.includes(`wa.me/2${uniquePhone}`), 'WhatsApp URL must match registered phone');

    // Extract OTP and verify via /api/auth/verify-otp
    const user = getDbUser(uniquePhone);
    assert(user.otpCode, 'DB has registered OTP');
    assert.strictEqual(user.phoneVerified, 0, 'User must not be verified before OTP');

    const verifyRes = await req('POST', '/auth/verify-otp', {
      phone: uniquePhone,
      otp: user.otpCode,
    });
    assert.strictEqual(verifyRes.status, 200, JSON.stringify(verifyRes.data));
    assert(verifyRes.data.token, 'Must return final token');

    const verifiedUser = getDbUser(uniquePhone);
    assert.strictEqual(verifiedUser.phoneVerified, 1, 'User must now be phoneVerified');
    assert.strictEqual(verifiedUser.otpCode, null, 'OTP must be cleared');
  });

  // ─── Test 9: Forgot Password with WhatsApp OTP ───
  await test('Test 9: Forgot Password generates WhatsApp URL and requires OTP to reset', async () => {
    // Reset cooldown for testPhone
    const user = getDbUser(testPhone);
    updateDbUser(user.id, { lastOtpSentAt: null });

    const forgotRes = await req('POST', '/auth/forgot-password', { phone: testPhone });
    assert.strictEqual(forgotRes.status, 200, JSON.stringify(forgotRes.data));
    assert(forgotRes.data.whatsappUrl, 'Must return whatsappUrl');
    assert(forgotRes.data.whatsappUrl.includes('201011112222'), 'Must be international format');

    const freshUser = getDbUser(testPhone);
    assert(freshUser.otpCode, 'OTP stored in DB');

    // Reset password using the OTP
    const resetRes = await req('POST', '/auth/reset-password', {
      phone: testPhone,
      otp: freshUser.otpCode,
      newPassword: 'newPassword123',
    });
    assert.strictEqual(resetRes.status, 200, JSON.stringify(resetRes.data));

    // Reset password back to 123456 for subsequent tests
    const resetBack = await req('POST', '/auth/reset-password', {
      phone: testPhone,
      otp: getDbUser(testPhone).otpCode || (await req('POST', '/auth/forgot-password', { phone: testPhone })).data && getDbUser(testPhone).otpCode,
      newPassword: '123456',
    });
    // Or update DB directly
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('123456', 10);
    updateDbUser(user.id, { password: hash, lastOtpSentAt: null });
  });

  // ─── Test 10: Production Safety (No Plaintext OTP in Prod) ───
  await test('Test 10: Production safety check — devOtp excluded when NODE_ENV is production', async () => {
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const user = getDbUser(testPhone);
    updateDbUser(user.id, { lastOtpSentAt: null });

    const loginRes = await req('POST', '/auth/login', { phone: testPhone, password: '123456' }, undefined, { 'x-test-env': 'production' });

    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.data.otp, undefined, 'Must not return otp in response');
    assert.strictEqual(loginRes.data.devOtp, undefined, 'Must not return devOtp in production');
    assert(loginRes.data.whatsappUrl, 'Must still return whatsappUrl');
  });

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
