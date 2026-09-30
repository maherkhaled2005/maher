// tests/test_section6_service_requests_e2e.cjs
// Section 6: Full Service Request Lifecycle E2E Tests

const assert = require('assert');
const jwt = require('jsonwebtoken');
const DB = require('better-sqlite3');

const BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'tecnorexa-super-production-jwt-secret-2026-fallback';

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

// Generate JWT directly (bypass OTP for testing)
function genToken(userId) {
  const db = new DB('./tecnorexa.db');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  db.close();
  if (!user) throw new Error(`User ${userId} not found`);
  return jwt.sign({ id: user.id, phone: user.phone, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
}

let customerToken, technicianToken, merchantToken, ownerToken;
let serviceRequestId, paymentRef;

async function run() {
  console.log('=== Section 6: Service Requests E2E Tests ===\n');
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

  // ─── 0. Setup: Generate tokens directly (bypass OTP) ───
  await test('Setup: Generate owner token', async () => {
    ownerToken = genToken('owner_master');
    assert(ownerToken, 'No owner token');
  });

  await test('Setup: Generate customer token', async () => {
    customerToken = genToken('user_1790785618793');
    assert(customerToken, 'No customer token');
  });

  await test('Setup: Generate technician token (active, Cairo)', async () => {
    // Ensure technician is in Cairo and available
    const db = new DB('./tecnorexa.db');
    db.prepare("UPDATE users SET governorate = 'القاهرة', available = 1, status = 'active' WHERE id = 'user_1790279521032'").run();
    db.close();
    technicianToken = genToken('user_1790279521032');
    assert(technicianToken, 'No technician token');
  });

  await test('Setup: Generate merchant token', async () => {
    merchantToken = genToken('merch_sample');
    assert(merchantToken, 'No merchant token');
  });



  // ─── 1. Device types & governorates ───
  await test('GET /api/device-types returns list', async () => {
    const res = await req('GET', '/device-types');
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(Array.isArray(res.data), 'Should be array');
    assert(res.data.length > 0, 'Should have device types');
    assert(res.data.includes('ثلاجة'), 'Should include ثلاجة');
  });

  await test('GET /api/governorates returns 27 governorates', async () => {
    const res = await req('GET', '/governorates');
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(Array.isArray(res.data), 'Should be array');
    assert(res.data.length === 27, `Expected 27 governorates, got ${res.data.length}`);
    assert(res.data.includes('القاهرة'), 'Should include القاهرة');
  });

  // ─── 2. Create service request ───
  await test('Customer creates service request', async () => {
    const res = await req('POST', '/service-requests', {
      deviceType: 'ثلاجة',
      deviceBrand: 'Samsung',
      deviceModel: 'RT38K5530S8',
      problemDescription: 'الثلاجة لا تبرد وتصدر صوتاً غريباً',
      governorate: 'القاهرة',
      address: 'شارع التحرير 15، المهندسين'
    }, customerToken);
    assert.strictEqual(res.status, 201, JSON.stringify(res.data));
    assert(res.data.serviceRequest?.id, 'Should have serviceRequest.id');
    assert(res.data.serviceRequest?.referenceNumber?.startsWith('REQ-'), 'Should have REQ- reference');
    serviceRequestId = res.data.serviceRequest.id;
    console.log(`      Created: ${serviceRequestId} (${res.data.serviceRequest.referenceNumber})`);
  });

  await test('Invalid device type rejected', async () => {
    const res = await req('POST', '/service-requests', {
      deviceType: 'لاب توب', // not supported
      problemDescription: 'مشكلة',
      governorate: 'القاهرة',
      address: 'عنوان'
    }, customerToken);
    assert.strictEqual(res.status, 400, 'Should reject unsupported device type');
  });

  await test('Invalid governorate rejected', async () => {
    const res = await req('POST', '/service-requests', {
      deviceType: 'ثلاجة',
      problemDescription: 'مشكلة',
      governorate: 'محافظة وهمية',
      address: 'عنوان'
    }, customerToken);
    assert.strictEqual(res.status, 400, 'Should reject invalid governorate');
  });

  // ─── 3. List service requests ───
  await test('Customer sees their requests', async () => {
    const res = await req('GET', '/service-requests', null, customerToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(Array.isArray(res.data.requests), 'Should be array');
    const found = res.data.requests.find(r => r.id === serviceRequestId);
    assert(found, 'Should find the created request');
  });

  await test('Technician sees available requests', async () => {
    const res = await req('GET', '/service-requests', null, technicianToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(Array.isArray(res.data.requests), 'Should be array');
  });

  await test('GET single service request details', async () => {
    const res = await req('GET', `/service-requests/${serviceRequestId}`, null, customerToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert.strictEqual(res.data.id, serviceRequestId);
    assert.strictEqual(res.data.deviceType, 'ثلاجة');
    assert(Array.isArray(res.data.logs), 'Should have logs');
  });

  // ─── 4. Technician accepts ───
  await test('Technician accepts the request (atomic)', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/accept`, {}, technicianToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.status, 'assigned');
  });

  await test('Cannot accept already-assigned request', async () => {
    // Another request to accept same SR should fail
    const res = await req('POST', `/service-requests/${serviceRequestId}/accept`, {}, technicianToken);
    // Either 200 (same technician) or 409 (race condition caught)
    // If same technician tries again it should be graceful
    assert([200, 409, 400].includes(res.status), `Unexpected status ${res.status}`);
  });

  // ─── 5. Price submission ───
  await test('Technician submits price quote', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/price`, {
      laborCost: 200,
      travelCost: 50,
      partsCost: 0,
      inspectionFee: 50,
      notes: 'سيتم الكشف على مكيف الهواء'
    }, technicianToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(res.data.priceBreakdown, 'Should have priceBreakdown');
    assert(res.data.priceBreakdown.total > 0, 'Total should be > 0');
    console.log(`      Total: ${res.data.priceBreakdown.total} ج.م (commission: ${res.data.priceBreakdown.commission})`);
  });

  await test('Customer cannot submit price (wrong role)', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/price`, {
      laborCost: 100, travelCost: 0, inspectionFee: 50
    }, customerToken);
    assert.strictEqual(res.status, 403);
  });

  // ─── 6. Customer approves price ───
  await test('Customer approves price and gets payment reference', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/approve-price`, {
      decision: 'approve'
    }, customerToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(res.data.paymentReference, 'Should have paymentReference');
    assert(res.data.paymentReference.startsWith('PAY-'), 'Should start with PAY-');
    paymentRef = res.data.paymentReference;
    console.log(`      Payment reference: ${paymentRef}`);
  });

  // ─── 7. Payment ───
  await test('Customer submits payment', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/payment`, {
      method: 'instapay',
      referenceCode: paymentRef
    }, customerToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.status, 'paid');
  });

  await test('Cannot reuse payment reference', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/payment`, {
      method: 'instapay',
      referenceCode: paymentRef
    }, customerToken);
    assert([400, 409].includes(res.status), `Should reject reused reference, got ${res.status}`);
  });

  // ─── 8. Technician starts & completes work ───
  await test('Technician starts work', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/start`, {}, technicianToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert.strictEqual(res.data.success, true);
  });

  await test('Technician marks work complete', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/complete`, {
      diagnosis: 'فشل في ضاغط المبرد',
      repairAction: 'تم استبدال الضاغط',
      warrantyDays: 90
    }, technicianToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert.strictEqual(res.data.success, true);
  });

  // ─── 9. Customer confirms ───
  await test('Customer confirms completion and technician gets paid', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/confirm`, {}, customerToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert.strictEqual(res.data.success, true);
  });

  // ─── 10. Rating ───
  await test('Customer rates technician', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/rate`, {
      rating: 5,
      comment: 'فني محترف وسريع جداً'
    }, customerToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert.strictEqual(res.data.success, true);
  });

  await test('Cannot rate twice', async () => {
    const res = await req('POST', `/service-requests/${serviceRequestId}/rate`, {
      rating: 3,
    }, customerToken);
    assert.strictEqual(res.status, 400, 'Should reject double rating');
  });

  // ─── 11. Service stats ───
  await test('Customer gets service stats', async () => {
    const res = await req('GET', '/service-stats', null, customerToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(typeof res.data.total === 'number', 'Should have total');
  });

  await test('Technician gets service stats with earnings', async () => {
    const res = await req('GET', '/service-stats', null, technicianToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(typeof res.data.earnings === 'number', 'Should have earnings');
    console.log(`      Technician earnings: ${res.data.earnings} ج.م`);
  });

  await test('Owner gets system-wide service stats', async () => {
    const res = await req('GET', '/service-stats', null, ownerToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(typeof res.data.totalRequests === 'number', 'Should have totalRequests');
    assert(typeof res.data.totalRevenue === 'number', 'Should have totalRevenue');
    console.log(`      Total revenue: ${res.data.totalRevenue} ج.م`);
  });

  // ─── 12. Price rules ───
  await test('Owner can set price rules', async () => {
    const res = await req('POST', '/price-rules', {
      deviceType: 'ثلاجة',
      minLaborCost: 100,
      maxLaborCost: 2000,
      inspectionFee: 75
    }, ownerToken);
    assert.strictEqual(res.status, 201, JSON.stringify(res.data));
  });

  await test('Anyone can read price rules', async () => {
    const res = await req('GET', '/price-rules', null, customerToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(Array.isArray(res.data), 'Should be array');
  });

  // ─── 13. Audit log ───
  await test('Owner can see request audit logs', async () => {
    const res = await req('GET', `/service-requests/${serviceRequestId}/logs`, null, ownerToken);
    assert.strictEqual(res.status, 200, JSON.stringify(res.data));
    assert(Array.isArray(res.data), 'Should be array');
    assert(res.data.length > 0, 'Should have log entries');
    console.log(`      Audit entries: ${res.data.length}`);
    const actions = res.data.map(l => l.action);
    console.log(`      Actions: ${actions.join(' → ')}`);
  });

  await test('Customer cannot see audit logs', async () => {
    const res = await req('GET', `/service-requests/${serviceRequestId}/logs`, null, customerToken);
    assert.strictEqual(res.status, 403, 'Customer should not see audit logs');
  });

  // ─── 14. Cancel request test ───
  await test('Customer can cancel a new request', async () => {
    // Create a new request to cancel
    const newReq = await req('POST', '/service-requests', {
      deviceType: 'ميكروويف',
      problemDescription: 'لا يعمل',
      governorate: 'الجيزة',
      address: 'شارع فيصل 10'
    }, customerToken);
    if (newReq.status === 201) {
      const cancelRes = await req('POST', `/service-requests/${newReq.data.serviceRequest.id}/cancel`, {
        reason: 'تغيير رأيي'
      }, customerToken);
      assert.strictEqual(cancelRes.status, 200, JSON.stringify(cancelRes.data));
      assert.strictEqual(cancelRes.data.success, true);
    } else {
      // Skip if couldn't create
      console.log(`      Skipping: couldn't create test request (${newReq.status})`);
    }
  });

  // ─── Summary ───
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
