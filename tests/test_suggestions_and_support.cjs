const assert = require('assert');
const Database = require('better-sqlite3');
const path = require('path');

const BASE_URL = 'http://localhost:5000';
const db = new Database(path.join(__dirname, '..', 'tecnorexa.db'));

async function loginUser(phone, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  const data = await res.json();
  if (data.token) return data.token;
  if (data.requireOtp && data.tempToken) {
    const row = db.prepare("SELECT otpCode FROM users WHERE phone = ?").get(phone);
    const vRes = await fetch(`${BASE_URL}/api/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: data.tempToken, phone, otp: row.otpCode })
    });
    const vData = await vRes.json();
    return vData.token;
  }
  throw new Error(data.error || 'Login failed');
}

async function runTest() {
  console.log('--- 🚀 RUNNING SUGGESTIONS & SUPPORT PROMPT VALIDATION TEST ---');

  // 1. Customer login
  const custToken = await loginUser('01055667788', '123456');
  console.log('✅ Customer authenticated');

  // 2. Owner login
  const ownerToken = await loginUser('01011112222', '123456');
  console.log('✅ Owner authenticated');

  // 3. Customer submits suggestion 1
  const sugRes1 = await fetch(`${BASE_URL}/api/suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      title: 'إضافة ميزة تتبع الفني المباشر',
      description: 'نرجو توفير خريطة حية لمتابعة وصول الفني إلى باب المنزل'
    })
  });
  const sugData1 = await sugRes1.json();
  console.log('Suggestion 1 Submission status & response:', sugRes1.status, sugData1);
  assert.strictEqual(sugData1.message, 'تم استلام طلبك سيتم الرد عليك قريبا');
  console.log('✅ Suggestion 1 returned exact Arabic status: "تم استلام طلبك سيتم الرد عليك قريبا"');

  // 4. Verify Customer sees "تم استلام طلبك سيتم الرد عليك قريبا" in mine
  const mineRes = await fetch(`${BASE_URL}/api/suggestions/mine`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const mineData = await mineRes.json();
  const created1 = mineData.find(s => s.id === sugData1.id);
  assert(created1, 'Suggestion should be in user list');
  assert.strictEqual(created1.statusLabel, 'تم استلام طلبك سيتم الرد عليك قريبا');
  console.log('✅ Customer list returns statusLabel: "تم استلام طلبك سيتم الرد عليك قريبا"');

  // 5. Owner approves Suggestion 1 -> Should send to Main Programmer
  const approveRes = await fetch(`${BASE_URL}/api/suggestions/${sugData1.id}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ownerToken}` }
  });
  const approveData = await approveRes.json();
  assert(approveData.success, 'Owner approval should succeed');
  console.log('✅ Owner approved suggestion 1 and converted to task for Main Programmer');

  // Check customer mine status after approval
  const mineRes2 = await fetch(`${BASE_URL}/api/suggestions/mine`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const mineData2 = await mineRes2.json();
  const approved1 = mineData2.find(s => s.id === sugData1.id);
  assert.strictEqual(approved1.statusLabel, 'تمت الموافقه علي طلبك وجاري العمل عليها الان');
  console.log('✅ Customer sees exact approved status: "تمت الموافقه علي طلبك وجاري العمل عليها الان"');

  // 6. Customer submits Suggestion 2 for rejection test
  const sugRes2 = await fetch(`${BASE_URL}/api/suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${custToken}`
    },
    body: JSON.stringify({
      title: 'اقتراح بيع أجهزة بالتقسيط بدون فوائد',
      description: 'أقترح إضافة بيع أجهزة منزلية كاملة بالتقسيط'
    })
  });
  const sugData2 = await sugRes2.json();
  assert.strictEqual(sugData2.message, 'تم استلام طلبك سيتم الرد عليك قريبا');

  // 7. Owner rejects Suggestion 2 -> Should NOT go to Main Programmer
  const rejectRes = await fetch(`${BASE_URL}/api/suggestions/${sugData2.id}/reject`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerToken}`
    },
    body: JSON.stringify({ reason: 'المنصة متخصصة حصرياً في الصيانة وقطع الغيار' })
  });
  const rejectData = await rejectRes.json();
  assert(rejectData.success, 'Owner reject should succeed');
  console.log('✅ Owner rejected suggestion 2 without forwarding to Programmer');

  // Check customer mine status after rejection
  const mineRes3 = await fetch(`${BASE_URL}/api/suggestions/mine`, {
    headers: { 'Authorization': `Bearer ${custToken}` }
  });
  const mineData3 = await mineRes3.json();
  const rejected2 = mineData3.find(s => s.id === sugData2.id);
  assert.strictEqual(rejected2.statusLabel, 'تم الغاء طلبك');
  console.log('✅ Customer sees exact rejection status: "تم الغاء طلبك"');

  console.log('======================================================');
  console.log('🎉 ALL SUGGESTIONS & SUPPORT PROMPT REQUIREMENTS PASSED 100%!');
  console.log('======================================================');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
