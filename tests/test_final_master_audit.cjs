const BASE_URL = `http://127.0.0.1:${process.env.PORT || 5000}`;

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

async function login(role) {
  const res = await api('/api/auth/quick-access', {
    method: 'POST',
    body: { role },
  });
  if (res.status !== 200 || !res.data.token) {
    throw new Error(`Failed to login as ${role}: ${JSON.stringify(res.data)}`);
  }
  return res.data.token;
}

async function runAudit() {
  console.log('🚀 Starting Final Master Audit Test Suite...\n');
  let passed = 0;
  let failed = 0;

  const ownerToken = await login('owner');
  const leadDevToken = await login('programmer');
  const supportToken = await login('customer_support');
  const customerToken = await login('customer');
  const managerToken = await login('manager');

  console.log('🔑 Logged in successfully with all test roles.\n');

  // Test 1: Header Badges
  try {
    const res = await api('/api/header/badges', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    if (res.status === 200 && typeof res.data.unreadNotifications === 'number' && typeof res.data.unreadMessages === 'number') {
      console.log('✅ Test 1 Passed: /api/header/badges returns live counters');
      passed++;
    } else {
      throw new Error(`Invalid response: status=${res.status}`);
    }
  } catch (err) {
    console.error('❌ Test 1 Failed:', err.message);
    failed++;
  }

  // Test 2: User Creation Authorization
  try {
    // Manager should be forbidden
    const resMgr = await api('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { name: 'مستخدم تجريبي من مدير', phone: `011${Date.now().toString().slice(-8)}`, role: 'customer' },
    });
    if (resMgr.status === 403) {
      console.log('✅ Test 2a Passed: Manager forbidden from creating user (403)');
      passed++;
    } else {
      throw new Error(`Expected 403 for Manager, got ${resMgr.status}`);
    }

    // Lead Dev Maher should be permitted
    const phoneNum = `012${Date.now().toString().slice(-8)}`;
    const resDev = await api('/api/admin/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${leadDevToken}` },
      body: { name: 'فني معتمد من ماهر', phone: phoneNum, role: 'technician' },
    });
    if (resDev.status === 200 && resDev.data.success) {
      console.log('✅ Test 2b Passed: Lead Programmer Maher allowed to create user (200)');
      passed++;
    } else {
      throw new Error(`Expected 200 for Lead Dev, got ${resDev.status} - ${JSON.stringify(resDev.data)}`);
    }
  } catch (err) {
    console.error('❌ Test 2 Failed:', err.message);
    failed++;
  }

  // Test 3: Customer Support Ticket Creation & Escalation
  try {
    const ticketRes = await api('/api/support/tickets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        subject: 'عطل برمجي في تطبيق الصيانة',
        description: 'الشاشة تعلق عند فتح خريطة الفنيين',
        category: 'technical',
        priority: 'high',
      },
    });
    const ticketId = ticketRes.data.id;

    // Support agent escalates ticket to programmers
    const escRes = await api(`/api/support/tickets/${ticketId}/escalate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${supportToken}` },
      body: { note: 'تم التحقق من المشكلة من خدمة العملاء ويرجى فحص السجلات البرمجية' },
    });
    if (escRes.status === 200 && escRes.data.success && escRes.data.taskId && escRes.data.bugId) {
      console.log('✅ Test 3 Passed: Ticket escalated to dev team (Task & Bug created)');
      passed++;
    } else {
      throw new Error(`Escalation failed: status=${escRes.status}`);
    }
  } catch (err) {
    console.error('❌ Test 3 Failed:', err.message);
    failed++;
  }

  // Test 4: AI Package Purchase
  try {
    const Database = require('better-sqlite3');
    const path = require('path');
    const db = new Database(path.join(__dirname, '..', 'tecnorexa.db'));
    db.prepare("UPDATE users SET balance = 500 WHERE id = 'customer_lead'").run();

    const aiRes = await api('/api/ai/purchase-package', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        packageId: 'pack_20',
        amount: 20,
        questions: 20,
        phone: '01000000007',
      },
    });
    if (aiRes.status === 200 && aiRes.data.success && aiRes.data.questionsAdded === 20) {
      console.log('✅ Test 4 Passed: AI package purchase recorded with Vodafone Cash');
      passed++;
    } else {
      throw new Error(`AI package purchase failed: status=${aiRes.status}`);
    }
  } catch (err) {
    console.error('❌ Test 4 Failed:', err.message);
    failed++;
  }

  // Test 5: Suggestion Approval to Dev Tasks
  try {
    const sugRes = await api('/api/suggestions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        title: 'إضافة تتبع مسار الفني المباشر بالـ GPS',
        description: 'نريد أن يرى العميل حركة الفني على الخريطة لحظياً',
      },
    });
    const sugId = sugRes.data.id;

    // Owner approves suggestion to Dev
    const appRes = await api(`/api/suggestions/${sugId}/approve-to-dev`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    if (appRes.status === 200 && appRes.data.success && appRes.data.taskId) {
      console.log('✅ Test 5 Passed: Suggestion approved and converted to Dev Task');
      passed++;
    } else {
      throw new Error(`Suggestion dev approval failed: status=${appRes.status}`);
    }
  } catch (err) {
    console.error('❌ Test 5 Failed:', err.message);
    failed++;
  }

  // Test 6: VIP Order Detection
  try {
    const vipOrderRes = await api('/api/orders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: {
        serviceType: 'صيانة غسالة فورية',
        total: 250,
        type: 'maintenance',
      },
    });
    if (vipOrderRes.status === 200 && vipOrderRes.data.success) {
      console.log('✅ Test 6 Passed: VIP order submitted successfully with owner credentials');
      passed++;
    } else {
      throw new Error(`VIP order creation failed: status=${vipOrderRes.status}`);
    }
  } catch (err) {
    console.error('❌ Test 6 Failed:', err.message);
    failed++;
  }

  // Test 7: Programmer Team Management & Promotion
  try {
    const teamRes = await api('/api/programmer/team', {
      headers: { Authorization: `Bearer ${leadDevToken}` },
    });
    if (teamRes.status === 200 && Array.isArray(teamRes.data)) {
      console.log(`✅ Test 7 Passed: Programmer team listed successfully (${teamRes.data.length} devs)`);
      passed++;
    } else {
      throw new Error(`Programmer team listing failed: status=${teamRes.status}`);
    }
  } catch (err) {
    console.error('❌ Test 7 Failed:', err.message);
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Audit Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runAudit();
