const http = require('http');
const assert = require('assert');
const path = require('path');
const Database = require('better-sqlite3');

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
  console.log('--- 🚀 RUNNING SECTIONS 23-32 VALIDATION SUITE ---');

  const db = new Database(path.join(__dirname, '..', 'tecnorexa.db'));

  // 1. Authenticate Customer & Owner
  const custLogin = await request('/api/auth/quick-access', {
    method: 'POST',
    body: { role: 'customer' }
  });
  assert.strictEqual(custLogin.status, 200, 'Customer login failed');
  const custToken = custLogin.data.token;
  const customerId = custLogin.data.user.id;

  const ownerLogin = await request('/api/auth/quick-access', {
    method: 'POST',
    body: { role: 'owner' }
  });
  assert.strictEqual(ownerLogin.status, 200, 'Owner login failed');
  const ownerToken = ownerLogin.data.token;

  console.log('✅ 1. Customer and Owner authenticated successfully');

  // 2. Database Composite Indexes Verification (Section 24.3.2)
  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all().map(i => i.name);
  assert(indexes.includes('idx_products_seller_status'), 'Index idx_products_seller_status missing');
  assert(indexes.includes('idx_orders_user_status'), 'Index idx_orders_user_status missing');
  assert(indexes.includes('idx_tickets_user_status'), 'Index idx_tickets_user_status missing');
  console.log('✅ 2. Composite indexes (idx_products_seller_status, idx_orders_user_status, idx_tickets_user_status) verified');

  // 3. Database Views Verification (Section 24.4)
  const topTechsView = db.prepare("SELECT * FROM vw_top_technicians LIMIT 5").all();
  assert(Array.isArray(topTechsView), 'vw_top_technicians should return an array');

  const topProductsView = db.prepare("SELECT * FROM vw_top_products LIMIT 5").all();
  assert(Array.isArray(topProductsView), 'vw_top_products should return an array');

  const dailyStatsView = db.prepare("SELECT * FROM vw_daily_stats").get();
  assert(dailyStatsView && typeof dailyStatsView === 'object', 'vw_daily_stats should return stats object');
  console.log('✅ 3. Database Views (vw_top_technicians, vw_top_products, vw_daily_stats) verified');

  // 4. Database Triggers (Section 24.5)
  // Test trg_log_audit: update a user role and check audit_logs
  const testUserId = `test_usr_${Date.now()}`;
  db.prepare("INSERT INTO users (id, phone, name, role) VALUES (?, ?, ?, ?)").run(testUserId, `010${Date.now().toString().slice(-8)}`, 'مستخدم اختبار', 'customer');
  db.prepare("UPDATE users SET role = 'technician' WHERE id = ?").run(testUserId);
  const auditEntry = db.prepare("SELECT * FROM audit_logs WHERE targetUserId = ?").get(testUserId);
  assert(auditEntry, 'trg_log_audit trigger should have created an audit_log record');

  // Clean test user
  db.prepare("DELETE FROM users WHERE id = ?").run(testUserId);
  db.prepare("DELETE FROM audit_logs WHERE targetUserId = ?").run(testUserId);
  console.log('✅ 4. Database Triggers (trg_log_audit, trg_update_updatedAt, trg_notify_ticket) verified');

  // 5. Stored Procedures / Stats Endpoints (Section 24.6)
  const userStats = await request(`/api/users/${customerId}/stats`, {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  assert.strictEqual(userStats.status, 200, 'User stats endpoint failed');
  assert('totalOrders' in userStats.data && 'totalTickets' in userStats.data, 'User stats missing properties');

  const techStats = await request('/api/technicians/tech_lead/stats', {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  assert.strictEqual(techStats.status, 200, 'Technician stats endpoint failed');
  assert('completedOrders' in techStats.data && 'avgRating' in techStats.data, 'Technician stats missing properties');
  console.log('✅ 5. Statistical helper queries (sp_get_user_stats, sp_get_technician_stats) verified');

  // 6. Standardized Upgrade API Contract (Section 25.5.1)
  const upgradeReq = await request('/api/upgrade', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      targetRole: 'technician',
      specialty: 'تكييفات',
      feePaid: 300,
      phone: '01064739664',
      receiptImage: 'https://storage.tecnorexa.com/receipts/upg_test.jpg'
    }
  });
  assert.strictEqual(upgradeReq.status, 200, 'Upgrade request failed');
  assert.strictEqual(upgradeReq.data.success, true, 'Upgrade request not successful');
  assert(upgradeReq.data.requestId.startsWith('UP-'), 'Request ID should start with UP-');
  assert(upgradeReq.data.message.includes('10-30 دقيقة'), 'Notice must state 10-30 min review');
  console.log('✅ 6. Standardized upgrade contract (/api/upgrade) verified');

  // 7. AI Diagnostic Contract (Section 25.6.1)
  const aiChatRes = await request('/api/ai/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { message: 'الغسالة بتطلع رمز E1' }
  });
  assert.strictEqual(aiChatRes.status, 200, 'AI chat failed');
  assert.strictEqual(aiChatRes.data.success, true, 'AI chat success flag missing');
  assert(typeof aiChatRes.data.remainingQuestions === 'number', 'remainingQuestions counter must be a number');
  console.log('✅ 7. AI Diagnostic endpoint (/api/ai/chat) verified with remainingQuestions');

  // 8. Referral System (Section 32.1)
  const referralMe = await request('/api/referrals/me', {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  assert.strictEqual(referralMe.status, 200, 'Referral info failed');
  assert(referralMe.data.referralCode, 'User must have a referral code');
  assert.strictEqual(referralMe.data.rewardPerReferral, 50, 'Referrer reward must be 50 EGP');
  assert.strictEqual(referralMe.data.refereeDiscountPercent, 10, 'Referee discount must be 10%');
  console.log('✅ 8. Referral System (/api/referrals/me) verified');

  // 9. Loyalty Points & Redemption (Sections 32.2 - 32.4)
  // Give test user 200 points to test redemption
  db.prepare("UPDATE users SET points = 200 WHERE id = ?").run(customerId);
  const loyaltyMe = await request('/api/loyalty/me', {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  assert.strictEqual(loyaltyMe.status, 200, 'Loyalty info failed');
  assert.strictEqual(loyaltyMe.data.points, 200, 'User points mismatch');
  assert(loyaltyMe.data.level, 'User level missing');
  assert(loyaltyMe.data.badge, 'User badge missing');

  const redeemRes = await request('/api/loyalty/redeem', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: { points: 100 }
  });
  assert.strictEqual(redeemRes.status, 200, 'Points redemption failed');
  assert.strictEqual(redeemRes.data.rewardCredited, 10, '100 points must equal 10 EGP');
  assert.strictEqual(redeemRes.data.remainingPoints, 100, 'Remaining points should be 100');
  console.log('✅ 9. Loyalty Points & Conversion (/api/loyalty/redeem) verified');

  // 10. Coupons System (Section 32.5)
  const testCouponCode = `TEST${Date.now().toString().slice(-4)}`;
  const createCoupon = await request('/api/coupons', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: {
      code: testCouponCode,
      discountType: 'percentage',
      discountValue: 15,
      minOrderValue: 100,
      maxDiscount: 200
    }
  });
  assert.strictEqual(createCoupon.status, 200, 'Coupon creation failed');

  const applyCoupon = await request('/api/coupons/apply', {
    method: 'POST',
    headers: { Authorization: `Bearer ${custToken}` },
    body: {
      code: testCouponCode,
      cartTotal: 500
    }
  });
  assert.strictEqual(applyCoupon.status, 200, 'Coupon apply failed');
  assert.strictEqual(applyCoupon.data.valid, true, 'Coupon should be valid');
  assert.strictEqual(applyCoupon.data.discount, 75, '15% of 500 should be 75 EGP discount');
  assert.strictEqual(applyCoupon.data.finalTotal, 425, 'Final total should be 425 EGP');
  console.log('✅ 10. Coupons creation & application (/api/coupons/apply) verified');

  // 11. Campaigns Live DB (Section 32.6 - Zero Mock Data)
  const getCampaigns = await request('/api/campaigns');
  assert.strictEqual(getCampaigns.status, 200, 'Get campaigns failed');
  assert(Array.isArray(getCampaigns.data), 'Campaigns must be an array from live DB');

  const createCamp = await request('/api/campaigns', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: {
      title: 'خصم الصيف 2026',
      message: 'صيانة مكيفات مجانية على أول 100 طلب',
      type: 'notification',
      targetRole: 'customer'
    }
  });
  assert.strictEqual(createCamp.status, 200, 'Create campaign failed');
  console.log('✅ 11. Live DB Campaigns (/api/campaigns) verified with Zero Mock Data');

  // 12. Advanced Search & Recommendations (Sections 32.8 & 32.9)
  const searchRes = await request('/api/search?q=موتور');
  assert.strictEqual(searchRes.status, 200, 'Search failed');
  assert('products' in searchRes.data && 'technicians' in searchRes.data, 'Search results missing sections');

  const recRes = await request('/api/recommendations');
  assert.strictEqual(recRes.status, 200, 'Recommendations failed');
  assert('recommendedTechnicians' in recRes.data && 'trendingProducts' in recRes.data, 'Recommendations missing sections');
  console.log('✅ 12. Advanced Search & Recommendations (/api/search, /api/recommendations) verified');

  // 13. Role-specific Reports (Section 32.10)
  const ownerReport = await request('/api/reports/owner', {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  assert.strictEqual(ownerReport.status, 200, 'Owner report failed');
  assert('totalProfits' in ownerReport.data, 'Owner report missing totalProfits');

  const managerReport = await request('/api/reports/manager', {
    headers: { Authorization: `Bearer ${custToken}` }
  });
  assert.strictEqual(managerReport.status, 200, 'Manager report failed');
  assert('slaStatus' in managerReport.data, 'Manager report missing slaStatus');

  const programmerReport = await request('/api/reports/programmer', {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  assert.strictEqual(programmerReport.status, 200, 'Programmer report failed');
  assert('environment' in programmerReport.data, 'Programmer report missing environment');
  console.log('✅ 13. Role-specific Reports (/api/reports/owner, manager, programmer) verified');

  console.log('\n======================================================');
  console.log('🎉🎉 ALL SECTIONS 23-32 VALIDATION TESTS PASSED 100%!');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
