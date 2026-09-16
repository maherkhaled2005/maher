const http = require('http');
const assert = require('assert');

const API_BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };
    if (options.body) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = data;
        try {
          parsed = JSON.parse(data);
        } catch {}
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- 🚀 RUNNING SECTIONS 18-22 VALIDATION SUITE ---');

  // 1. Authenticate Customer & Owner
  const custLogin = await request('/api/auth/quick-access', {
    method: 'POST',
    body: { role: 'customer' }
  });
  assert.strictEqual(custLogin.status, 200, 'Customer login failed');
  const custToken = custLogin.data.token;

  const ownerLogin = await request('/api/auth/quick-access', {
    method: 'POST',
    body: { role: 'owner' }
  });
  assert.strictEqual(ownerLogin.status, 200, 'Owner login failed');
  const ownerToken = ownerLogin.data.token;
  console.log('✅ 1. Customer and Owner authenticated successfully');

  // 2. Order Cancellation within 10 Minutes (Allowed)
  const createFreshOrder = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      total: 250,
      serviceType: 'صيانة تكييف منزلي',
      notes: 'فحص دوري',
      location: 'القاهرة - المعادي'
    }
  });
  assert.strictEqual(createFreshOrder.status, 200, 'Order creation failed');
  const freshOrderId = createFreshOrder.data.orderId;

  const cancelFresh = await request(`/api/orders/${freshOrderId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { reason: 'إلغاء من قبل العميل قبل مرور 10 دقائق' }
  });
  assert.strictEqual(cancelFresh.status, 200, 'Fresh order cancellation should succeed');
  assert.strictEqual(cancelFresh.data.success, true);
  console.log('✅ 2. Order cancellation within 10 minutes successfully executed');

  // 3. Order Cancellation after 10 Minutes (Blocked for Customer)
  const createOlderOrder = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      total: 300,
      serviceType: 'صيانة غسالة أوتوماتيك',
      location: 'الجيزة - الدقي'
    }
  });
  const olderOrderId = createOlderOrder.data.orderId;

  const Database = require('better-sqlite3');
  const path = require('path');
  const db = new Database(path.join(__dirname, '..', 'tecnorexa.db'));
  const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
  db.prepare("UPDATE orders SET createdAt = ? WHERE id = ?").run(twentyMinsAgo, olderOrderId);

  const cancelExpiredAsCust = await request(`/api/orders/${olderOrderId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { reason: 'رغبة في الإلغاء المتأخر' }
  });
  assert.strictEqual(cancelExpiredAsCust.status, 400, 'Cancellation after 10 minutes should be rejected');
  assert(cancelExpiredAsCust.data.error.includes('10 دقائق'), 'Error message must mention 10-minute limit');
  console.log('✅ 3. Customer cancellation after 10 minutes strictly rejected per Section 18.8');

  // 4. Privileged Cancellation after 10 Minutes (Allowed for Owner/Manager)
  const cancelExpiredAsOwner = await request(`/api/orders/${olderOrderId}/cancel`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: { reason: 'إلغاء إداري بناءً على شكوى العميل' }
  });
  assert.strictEqual(cancelExpiredAsOwner.status, 200, 'Privileged cancellation by owner should succeed');
  console.log('✅ 4. Privileged order override by Owner/Manager validated');

  // 5. Technician Order Workflow (Arrive -> Complete)
  const techOrderRes = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      total: 400,
      serviceType: 'صيانة سخان كهربائي',
      location: 'مدينة نصر'
    }
  });
  const techOrderId = techOrderRes.data.orderId;

  const arriveRes = await request(`/api/orders/${techOrderId}/arrive`, {
    method: 'POST',
    body: {}
  });
  assert.strictEqual(arriveRes.status, 200);
  assert.strictEqual(arriveRes.data.success, true);

  const completeRes = await request(`/api/orders/${techOrderId}/complete`, {
    method: 'POST',
    body: { report: 'تم تغيير هيتر السخان وفحص الأمان', partsCost: 150 }
  });
  assert.strictEqual(completeRes.status, 200);
  assert.strictEqual(completeRes.data.success, true);
  console.log('✅ 5. Technician workflow (Arrive -> Complete with report) validated');

  // 6. Merchant Order Workflow (Ship with Tracking Number)
  const merchOrderRes = await request('/api/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      total: 550,
      type: 'purchase',
      location: 'التجمع الخامس'
    }
  });
  const merchOrderId = merchOrderRes.data.orderId;

  const shipRes = await request(`/api/orders/${merchOrderId}/ship`, {
    method: 'POST',
    body: { trackingNumber: 'TR-EGY-987654' }
  });
  assert.strictEqual(shipRes.status, 200);
  assert(shipRes.data.message.includes('TR-EGY-987654'), 'Ship response should include tracking number');
  console.log('✅ 6. Merchant workflow (Ship with tracking number) validated');

  // 7. Subscription Paywalls with Receipt Upload
  // Technician Paywall (300 EGP)
  const techSub = await request('/api/subscriptions/subscribe', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      planId: 'technician',
      targetRole: 'technician',
      amount: 300,
      paymentMethod: 'vodafone_cash',
      specialty: 'تكييف وتبريد',
      senderPhone: '01064739664',
      receiptImage: 'https://storage.tecnorexa.com/receipts/tech_300.jpg'
    }
  });
  assert.strictEqual(techSub.status, 200, 'Tech subscription failed');
  assert.strictEqual(techSub.data.user.role, 'technician', 'Role should be upgraded to technician');

  // Merchant Paywall (500 EGP)
  const merchSub = await request('/api/subscriptions/subscribe', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      planId: 'merchant',
      targetRole: 'merchant',
      amount: 500,
      paymentMethod: 'instapay',
      storeName: 'المركز الهندسي لقطع الغيار',
      senderPhone: '01064739664',
      receiptImage: 'https://storage.tecnorexa.com/receipts/merch_500.jpg'
    }
  });
  assert.strictEqual(merchSub.status, 200, 'Merchant subscription failed');
  assert.strictEqual(merchSub.data.user.role, 'merchant', 'Role should be upgraded to merchant');

  // Restore user role back to customer
  db.prepare("UPDATE users SET role = 'customer' WHERE id = ?").run(custLogin.data.user.id);
  console.log('✅ 7. Subscription paywalls (Tech 300 EGP / Merchant 500 EGP) with receipt validated');

  // 8. Wallet Top-up Presets (50, 100, 200, 500 EGP)
  const topupRes = await request('/api/wallet/topup', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { amount: 200, paymentMethod: 'vodafone_cash' }
  });
  assert.strictEqual(topupRes.status, 200, 'Wallet topup failed');
  console.log('✅ 8. Customer wallet top-up preset (200 EGP) validated');

  // 9. System Maintenance Mode Toggle (Owner Control)
  const enableMaint = await request('/api/settings/maintenance', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: { enabled: true }
  });
  assert.strictEqual(enableMaint.status, 200);
  assert.strictEqual(enableMaint.data.maintenanceMode, true);

  const disableMaint = await request('/api/settings/maintenance', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: { enabled: false }
  });
  assert.strictEqual(disableMaint.status, 200);
  assert.strictEqual(disableMaint.data.maintenanceMode, false);
  console.log('✅ 9. Owner system maintenance mode toggle validated');

  // 10. AI Chat Diagnostics & Appliance Error Code Rules
  const aiDiag1 = await request('/api/ai/troubleshoot', {
    method: 'POST',
    body: { message: 'الغسالة تظهر كود E1 ومش بتسحب مياه' }
  });
  assert.strictEqual(aiDiag1.status, 200);
  assert.strictEqual(aiDiag1.data.specialty, 'غسالات');
  assert(aiDiag1.data.reply.includes('Water Inlet Error'), 'Should recognize E1 as Water Inlet Error');

  const aiDiag2 = await request('/api/ai/troubleshoot', {
    method: 'POST',
    body: { message: 'التكييف بيخرج هواء ساخن وكود EC على الشاشة' }
  });
  assert.strictEqual(aiDiag2.status, 200);
  assert.strictEqual(aiDiag2.data.specialty, 'تكييف');
  assert(aiDiag2.data.reply.includes('الفريون'), 'Should identify refrigerant / gas error for EC');
  console.log('✅ 10. AI diagnostics and error code recognition (E1, EC) validated');

  // Clean up transient test orders
  db.prepare("DELETE FROM orders WHERE id IN (?, ?, ?, ?)").run(freshOrderId, olderOrderId, techOrderId, merchOrderId);
  db.close();

  console.log('\n======================================================');
  console.log('🎉🎉 ALL SECTIONS 18-22 VALIDATION TESTS PASSED 100%!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});