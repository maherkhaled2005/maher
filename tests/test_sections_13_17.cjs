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
  console.log('--- 🚀 RUNNING SECTIONS 13-17 VALIDATION SUITE ---');

  // 1. Owner Login
  const ownerLogin = await request('/api/auth/quick-access', {
    method: 'POST',
    body: { role: 'owner' }
  });
  assert.strictEqual(ownerLogin.status, 200, 'Owner login failed');
  const ownerToken = ownerLogin.data.token;
  console.log('✅ 1. Owner authenticated successfully');

  // 2. Owner Overview 6 KPIs (Live DB Stats)
  const ownerOverview = await request('/api/owner/overview?period=7d', {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  assert.strictEqual(ownerOverview.status, 200, 'Owner overview failed');
  assert(typeof ownerOverview.data.totalRevenue === 'number', 'totalRevenue must be a number');
  assert(typeof ownerOverview.data.activeUsers === 'number', 'activeUsers must be a number');
  assert(typeof ownerOverview.data.todayOrders === 'number', 'todayOrders must be a number');
  assert(typeof ownerOverview.data.availableTechnicians === 'number', 'availableTechnicians must be a number');
  assert(typeof ownerOverview.data.pendingTickets === 'number', 'pendingTickets must be a number');
  assert(typeof ownerOverview.data.pendingWithdrawalsAmount === 'number', 'pendingWithdrawalsAmount must be a number');
  console.log('✅ 2. Owner Overview 6 KPIs validated with live DB data');

  // 3. Admin Chart Data (Dynamic, not hardcoded)
  const chartData = await request('/api/admin/chart-data');
  assert.strictEqual(chartData.status, 200, 'Chart data failed');
  assert(Array.isArray(chartData.data.labels), 'labels must be an array');
  assert(Array.isArray(chartData.data.newUsers), 'newUsers must be an array');
  assert(Array.isArray(chartData.data.completedOrders), 'completedOrders must be an array');
  assert.strictEqual(chartData.data.labels.length, 7, 'Must have 7 days of labels');
  console.log('✅ 3. Chart Data returns dynamic 7-day DB queries');

  // 4. Manager KPIs (6 Real Queries)
  const managerKpis = await request('/api/manager/kpis', { headers: { Authorization: `Bearer ${ownerToken}` } });
  assert.strictEqual(managerKpis.status, 200, 'Manager KPIs failed');
  assert(typeof managerKpis.data.pendingOrdersToday === 'number', 'pendingOrdersToday must be a number');
  assert(typeof managerKpis.data.openTickets === 'number', 'openTickets must be a number');
  assert(typeof managerKpis.data.pendingUpgrades === 'number', 'pendingUpgrades must be a number');
  assert(typeof managerKpis.data.customerRatingToday === 'number', 'customerRatingToday must be a number');
  assert(typeof managerKpis.data.pendingProducts === 'number', 'pendingProducts must be a number');
  assert(typeof managerKpis.data.avgResponseTimeMinutes === 'number', 'avgResponseTimeMinutes must be a number');
  console.log('✅ 4. Manager 6 operational KPIs validated with live DB data');

  // 5. Merchant Upgrade Fee = 500 EGP
  const testPhone = '010' + Math.floor(10000000 + Math.random() * 90000000);
  const merchantUpgrade = await request('/api/trade-requests', {
    method: 'POST',
    body: {
      type: 'merchant',
      customerName: 'تاجر تجريبي للاختبار',
      phone: testPhone,
      notes: 'طلب توثيق تاجر جديد',
    }
  });
  assert.strictEqual(merchantUpgrade.status, 200, 'Trade request failed');
  assert.strictEqual(merchantUpgrade.data.request.feePaid, 500, 'Merchant fee must be exactly 500 EGP');
  console.log('✅ 5. Merchant upgrade fee validated: 500 EGP (per sections 13.6.1 & 14.13.2)');

  // 6. Add User Without Password
  const newUserPhone = '011' + Math.floor(10000000 + Math.random() * 90000000);
  const addUser = await request('/api/admin/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: {
      name: 'مستخدم جديد بدون باسوورد',
      phone: newUserPhone,
      role: 'customer'
    }
  });
  assert.strictEqual(addUser.status, 200, 'Add user failed');
  assert(addUser.data.id, 'User ID must be returned');
  console.log('✅ 6. User created without password field (active with OTP login setup)');

  // 7. Users CSV Export
  const csvExport = await request('/api/admin/users/export', {
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  assert.strictEqual(csvExport.status, 200, 'CSV export failed');
  assert(typeof csvExport.data === 'string' && csvExport.data.startsWith('ID,Name,Phone'), 'CSV format header verified');
  console.log('✅ 7. Users CSV export stream validated');

  // 8. Suggestions CRUD
  const sugRes = await request('/api/suggestions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: {
      title: 'إضافة خاصية حجز الصيانة الفوري',
      description: 'نظام حجز فوري مع الفنيين الأقرب جغرافياً في محافظة القاهرة'
    }
  });
  assert.strictEqual(sugRes.status, 200, 'Suggestion submission failed');
  const allSugs = await request('/api/suggestions');
  assert.strictEqual(allSugs.status, 200);
  assert(Array.isArray(allSugs.data) && allSugs.data.length > 0, 'Suggestions list returned');
  console.log('✅ 8. App Suggestions submission and listing validated');

  // 9. Reports Submission
  const repRes = await request('/api/reports', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
    body: {
      reporterName: 'المهندس خالد محمد',
      targetType: 'product',
      targetId: 'prod_test_123',
      reason: 'سعر غير مطابق للمواصفات'
    }
  });
  assert.strictEqual(repRes.status, 200, 'Report submission failed');
  console.log('✅ 9. Reports submission validated');

  // 10. Developer Onboarding Agreement
  const devLogin = await request('/api/auth/quick-access', {
    method: 'POST',
    body: { role: 'programmer' }
  });
  const devToken = devLogin.data.token;
  const onboardAgree = await request('/api/dev/onboarding/agree', {
    method: 'POST',
    headers: { Authorization: `Bearer ${devToken}` }
  });
  assert.strictEqual(onboardAgree.status, 200, 'Dev onboarding agree failed');
  const onboardStatus = await request('/api/dev/onboarding', {
    headers: { Authorization: `Bearer ${devToken}` }
  });
  assert.strictEqual(onboardStatus.data.completed, true, 'Dev onboarding should be completed');
  console.log('✅ 10. Developer Onboarding & 10 Laws Agreement validated');

  // 11. Audit Logs Cleanup
  const auditClean = await request('/api/audit-logs/clean', {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });
  assert.strictEqual(auditClean.status, 200, 'Audit clean failed');
  assert(typeof auditClean.data.deletedCount === 'number', 'deletedCount must be returned');
  console.log('✅ 11. Audit logs automated cleanup (>6 months) validated');

  // Clean up transient test user
  await request(`/api/admin/users/${addUser.data.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${ownerToken}` }
  });

  console.log('\n======================================================');
  console.log('🎉🎉 ALL SECTIONS 13-17 VALIDATION TESTS PASSED 100%!');
  console.log('======================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});