/**
 * test_main_programmer_role_e2e.cjs
 * End-to-end verification of Section 4: Main Programmer (الرئيس التقني / رئيس المبرمجين)
 * 
 * Rules tested:
 * 1. Identity: Programmer Role + Main Programmer designation (developerRank: 'lead'). Not an 8th role.
 * 2. 4.1 Powers: Technical management, dev tasks, system inspection stats, error review, security audit logs, code snippets.
 * 3. 4.2 Programmer Creation: Owner & Main Programmer can create programmers; Manager cannot; No one can create Owner.
 * 4. 4.3 Suggestions Workflow:
 *    - User -> status 'pending', user message: "تم استلام طلبك سيتم الرد عليك قريبا".
 *    - Main Programmer CANNOT see pending suggestions directly.
 *    - Owner approves -> status 'owner_approved', user message: "تمت الموافقه علي طلبك وجاري العمل عليها الان", reaches Main Programmer, dev task created.
 *    - Owner rejects -> status 'owner_rejected', user message: "تم الغاء طلبك", NEVER reaches Main Programmer.
 * 5. 4.4 Maintenance Mode:
 *    - Ordinary users get HTTP 503 during maintenance.
 *    - Main Programmer bypasses maintenance mode (HTTP 200).
 */

const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'tecnorexa.db'));
const BASE_URL = 'http://localhost:5000';

async function loginUser(phone, password = 'password123') {
  let res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  let data = await res.json();

  if (res.status !== 200 && password !== '123456') {
    // Retry with default 123456
    res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password: '123456' }),
    });
    data = await res.json();
  }

  if (data.requireOtp && data.tempToken) {
    const row = db.prepare("SELECT otpCode FROM users WHERE phone = ?").get(phone);
    const otpRes = await fetch(`${BASE_URL}/api/auth/verify-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: data.tempToken, phone, otp: row?.otpCode }),
    });
    data = await otpRes.json();
    res = otpRes;
  }
  return { status: res.status, data, token: data.token, user: data.user };
}

async function apiRequest(method, path, body = null, token = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);
  if (token) options.headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, options);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = await res.text();
  }
  return { status: res.status, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ ${message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('🚀 SECTION 4: MAIN PROGRAMMER VERIFICATION SUITE');
  console.log('======================================================\n');

  // Step 1: Login accounts
  console.log('--- Step 1: Login & Identity Check ---');
  const progAuth = await loginUser('01064739664', 'password123');
  const ownerAuth = await loginUser('01011112222', 'password123');
  const mgrAuth = await loginUser('01286585187', 'password123');
  const custAuth = await loginUser('01055667788', 'password123');

  assert(progAuth.token, 'Main Programmer logged in successfully');
  assert(ownerAuth.token, 'Owner logged in successfully');
  assert(mgrAuth.token, 'Manager logged in successfully');
  assert(custAuth.token, 'Customer logged in successfully');

  const progToken = progAuth.token;
  const ownerToken = ownerAuth.token;
  const mgrToken = mgrAuth.token;
  const custToken = custAuth.token;

  // Check Main Programmer identity via /api/me
  const meProg = await apiRequest('GET', '/api/me', null, progToken);
  assert(meProg.status === 200, 'Main programmer fetched profile');
  assert(meProg.data.role === 'programmer', `Main programmer role is 'programmer' (Not 8th role). Got: ${meProg.data.role}`);
  assert(meProg.data.developerRank === 'lead' || meProg.data.programmerLevel === 'lead', `Main programmer has lead designation. Got: ${meProg.data.developerRank}`);

  // Step 2: Main Programmer 4.1 Powers
  console.log('\n--- Step 2: 4.1 Core Powers ---');

  // 2a. System stats
  const statsRes = await apiRequest('GET', '/api/dev/system-stats', null, progToken);
  assert(statsRes.status === 200, 'Main Programmer can inspect system stats');
  assert(statsRes.data.cpuLoad !== undefined, `System stats has cpuLoad: ${statsRes.data.cpuLoad}`);
  assert(statsRes.data.memoryUsage !== undefined, `System stats has memoryUsage: ${statsRes.data.memoryUsage}`);
  assert(statsRes.data.uptime !== undefined, `System stats has uptime: ${statsRes.data.uptime}`);

  // 2b. Dev tasks management
  const getTasks = await apiRequest('GET', '/api/dev/tasks', null, progToken);
  assert(getTasks.status === 200 && Array.isArray(getTasks.data), 'Main Programmer can view developer tasks');

  const newTaskRes = await apiRequest('POST', '/api/dev/tasks', {
    title: 'Test Core Kernel Optimization',
    description: 'Optimize SQLite WAL caching index',
    assignedTo: meProg.data.id,
    priority: 'high',
  }, progToken);
  assert(newTaskRes.status === 200, 'Main Programmer can create developer tasks');

  // 2c. Error review
  const bugsRes = await apiRequest('GET', '/api/developer/bugs', null, progToken);
  assert(bugsRes.status === 200 && Array.isArray(bugsRes.data), 'Main Programmer can review bug reports');

  // 2d. Security review (audit logs)
  const auditRes = await apiRequest('GET', '/api/audit-logs', null, progToken);
  assert(auditRes.status === 200 && Array.isArray(auditRes.data), 'Main Programmer can perform security review (Audit Logs)');

  // Step 3: Programmer Creation Permissions (4.2)
  console.log('\n--- Step 3: 4.2 Programmer Creation Permissions ---');

  const testProgPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
  const createProgByProg = await apiRequest('POST', '/api/admin/users', {
    name: 'Junior Dev Test',
    phone: testProgPhone,
    role: 'programmer',
    password: 'password123',
    developerRank: 'junior',
  }, progToken);
  assert(createProgByProg.status === 200, 'Main Programmer CAN create programmer accounts');

  // Manager CANNOT create programmer
  const mgrProgPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
  const createProgByMgr = await apiRequest('POST', '/api/admin/users', {
    name: 'Unauthorized Prog',
    phone: mgrProgPhone,
    role: 'programmer',
    password: 'password123',
  }, mgrToken);
  assert(createProgByMgr.status === 403, 'Manager is FORBIDDEN from creating programmer accounts');

  // No one can create an Owner account
  const ownerPhone = `010${Math.floor(10000000 + Math.random() * 90000000)}`;
  const createOwnerByProg = await apiRequest('POST', '/api/admin/users', {
    name: 'Illegal Owner',
    phone: ownerPhone,
    role: 'owner',
    password: 'password123',
  }, progToken);
  assert(createOwnerByProg.status === 403, 'Main Programmer is FORBIDDEN from creating another Owner account');

  const createOwnerByOwner = await apiRequest('POST', '/api/admin/users', {
    name: 'Illegal Owner 2',
    phone: ownerPhone,
    role: 'owner',
    password: 'password123',
  }, ownerToken);
  assert(createOwnerByOwner.status === 403, 'Owner is FORBIDDEN from creating another Owner account');

  // Step 4: Suggestions Workflow (2.6 & 4.3)
  console.log('\n--- Step 4: 4.3 Suggestions Workflow (User -> Owner -> Owner Approval -> Main Programmer) ---');

  // Submitting suggestion 1 (will be approved)
  const sugTitle1 = `Feature Suggestion ${Date.now()}`;
  const subRes1 = await apiRequest('POST', '/api/suggestions', {
    title: sugTitle1,
    description: 'Add live tracking for appliance parts delivery',
  }, custToken);
  assert(subRes1.status === 200, 'Customer submitted suggestion 1');
  assert(subRes1.data.message === 'تم استلام طلبك سيتم الرد عليك قريبا', `Customer saw: "${subRes1.data.message}"`);
  const sugId1 = subRes1.data.id;

  // Check Main Programmer DOES NOT see pending suggestion
  const progSugsBefore = await apiRequest('GET', '/api/suggestions', null, progToken);
  assert(progSugsBefore.status === 200, 'Main Programmer queried suggestions');
  const foundPendingInProg = progSugsBefore.data.find(s => s.id === sugId1);
  assert(!foundPendingInProg, 'Main Programmer CANNOT see pending suggestion before Owner approval');

  // Owner sees the pending suggestion
  const ownerSugs = await apiRequest('GET', '/api/suggestions', null, ownerToken);
  const foundInOwner = ownerSugs.data.find(s => s.id === sugId1);
  assert(foundInOwner && foundInOwner.status === 'pending', 'Owner sees pending suggestion for review');

  // Owner Approves suggestion 1
  const approveRes = await apiRequest('POST', `/api/suggestions/${sugId1}/approve`, {}, ownerToken);
  assert(approveRes.status === 200, 'Owner approved suggestion 1');

  // Submitter sees approval message
  const mySugsAfter = await apiRequest('GET', '/api/suggestions/mine', null, custToken);
  const mySug1 = mySugsAfter.data.find(s => s.id === sugId1);
  assert(mySug1 && mySug1.status === 'owner_approved', 'Suggestion status changed to owner_approved');
  assert(mySug1.statusLabel === 'تمت الموافقه علي طلبك وجاري العمل عليها الان', `Submitter sees: "${mySug1.statusLabel}"`);

  // Now Main Programmer DOES see the approved suggestion
  const progSugsAfter = await apiRequest('GET', '/api/suggestions', null, progToken);
  const foundApprovedInProg = progSugsAfter.data.find(s => s.id === sugId1);
  assert(foundApprovedInProg, 'Approved suggestion now visible to Main Programmer');

  // Dev task was automatically created for Main Programmer
  const devTasksAfter = await apiRequest('GET', '/api/dev/tasks', null, progToken);
  const autoTask = devTasksAfter.data.find(t => t.title.includes(sugTitle1));
  assert(autoTask, `Developer task was automatically assigned to Main Programmer: "${autoTask?.title}"`);

  // Submitting suggestion 2 (will be rejected)
  const sugTitle2 = `Rejected Suggestion ${Date.now()}`;
  const subRes2 = await apiRequest('POST', '/api/suggestions', {
    title: sugTitle2,
    description: 'Add arcade video games to refrigerator maintenance',
  }, custToken);
  const sugId2 = subRes2.data.id;

  // Owner Rejects suggestion 2
  const rejectRes = await apiRequest('POST', `/api/suggestions/${sugId2}/reject`, { reason: 'خارج نطاق المنظومة' }, ownerToken);
  assert(rejectRes.status === 200, 'Owner rejected suggestion 2');

  // Submitter sees rejection message
  const mySugsAfterRej = await apiRequest('GET', '/api/suggestions/mine', null, custToken);
  const mySug2 = mySugsAfterRej.data.find(s => s.id === sugId2);
  assert(mySug2 && mySug2.status === 'owner_rejected', 'Suggestion status changed to owner_rejected');
  assert(mySug2.statusLabel === 'تم الغاء طلبك', `Submitter sees: "${mySug2.statusLabel}"`);

  // Main Programmer NEVER sees rejected suggestion
  const progSugsAfterRej = await apiRequest('GET', '/api/suggestions', null, progToken);
  const foundRejInProg = progSugsAfterRej.data.find(s => s.id === sugId2);
  assert(!foundRejInProg, 'Rejected suggestion NEVER reaches Main Programmer');

  // Step 5: Maintenance Mode Bypass (4.4)
  console.log('\n--- Step 5: 4.4 Maintenance Mode Bypass ---');

  // Owner enables maintenance mode
  const enableMaint = await apiRequest('POST', '/api/settings/maintenance', { enabled: true }, ownerToken);
  assert(enableMaint.status === 200 && enableMaint.data.maintenanceMode === true, 'Owner enabled Maintenance Mode');

  // Ordinary customer gets 503 Maintenance
  const custMaintCheck = await apiRequest('GET', '/api/orders', null, custToken);
  assert(custMaintCheck.status === 503, `Ordinary customer blocked with HTTP 503 during maintenance mode (got ${custMaintCheck.status})`);

  // Main Programmer bypasses maintenance mode
  const progMaintCheck = await apiRequest('GET', '/api/orders', null, progToken);
  assert(progMaintCheck.status === 200, `Main Programmer BYPASSES maintenance mode (got HTTP 200)`);

  // Owner disables maintenance mode
  const disableMaint = await apiRequest('POST', '/api/settings/maintenance', { enabled: false }, ownerToken);
  assert(disableMaint.status === 200 && disableMaint.data.maintenanceMode === false, 'Owner disabled Maintenance Mode');

  // Customer now gets 200
  const custAfterMaint = await apiRequest('GET', '/api/orders', null, custToken);
  assert(custAfterMaint.status === 200, 'Customer has normal access restored after maintenance mode disabled');

  console.log('\n======================================================');
  console.log('🎉 ALL SECTION 4: MAIN PROGRAMMER E2E TESTS PASSED 100%!');
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
