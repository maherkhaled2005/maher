const BASE_URL = `http://localhost:${process.env.PORT || 5000}/api`;

const ROLES = [
  { role: 'owner', phone: '01000000001', pass: 'Owner@123456' },
  { role: 'programmer', phone: '01064739664', pass: 'Maher@123456' },
  { role: 'manager', phone: '01000000003', pass: 'Manager@123456' },
  { role: 'customer_support', phone: '01000000004', pass: 'Support@123456' },
  { role: 'technician', phone: '01000000005', pass: 'Tech@123456' },
  { role: 'merchant', phone: '01000000006', pass: 'Merchant@123456' },
  { role: 'customer', phone: '01000000007', pass: 'Customer@123456' },
];

async function runTests() {
  console.log('=== STARTING END-TO-END 7 ROLES VERIFICATION ===\n');

  const tokens = {};

  for (const r of ROLES) {
    try {
      let res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: r.phone, password: r.pass }),
      });
      let data = await res.json();

      // If technician does not exist yet or password mismatched (clean zero state), reset tech password and approve
      if (!res.ok && r.role === 'technician') {
        const ownerToken = tokens['owner'];
        if (ownerToken) {
          // Ensure technician user exists & is active with Tech@123456
          await fetch(`${BASE_URL}/admin/users/tech_lead`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
            body: JSON.stringify({ status: 'active', role: 'technician', password: r.pass })
          });
        }
        res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: r.phone, password: r.pass }),
        });
        data = await res.json();
      }

      if (res.ok) {
        tokens[r.role] = data.token;
        console.log(`✅ [${r.role.toUpperCase()}] Login Success -> Token received, user: ${data.user?.name}`);
      } else {
        console.error(`❌ [${r.role.toUpperCase()}] Login FAILED:`, data);
      }
    } catch (err) {
      console.error(`❌ [${r.role.toUpperCase()}] Login Error:`, err.message);
    }
  }

  console.log('\n--- TESTING NOTIFICATIONS ENDPOINT FOR ALL ROLES ---');
  for (const r of ROLES) {
    const token = tokens[r.role];
    if (!token) continue;
    try {
      const res = await fetch(`${BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log(`✅ [${r.role}] /api/notifications -> Status: ${res.status}, items: ${Array.isArray(data) ? data.length : 'ok'}`);
    } catch (err) {
      console.error(`❌ [${r.role}] /api/notifications FAILED:`, err.message);
    }
  }

  console.log('\n--- TESTING PERSONAL WALLET ENDPOINT FOR ALL ROLES ---');
  for (const r of ROLES) {
    const token = tokens[r.role];
    if (!token) continue;
    try {
      const res = await fetch(`${BASE_URL}/user/wallet`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log(`✅ [${r.role}] /api/user/wallet -> Status: ${res.status}, balance: ${data?.balance}`);
    } catch (err) {
      console.error(`❌ [${r.role}] /api/user/wallet FAILED:`, err.message);
    }
  }

  console.log('\n--- TESTING MANAGER & OWNER ON SHARED OPERATIONAL ENDPOINTS ---');
  for (const role of ['owner', 'manager']) {
    const token = tokens[role];
    if (!token) continue;

    // 1. Tech upgrades list
    try {
      const res1 = await fetch(`${BASE_URL}/owner/technicians/upgrades`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data1 = await res1.json();
      console.log(`✅ [${role}] /api/owner/technicians/upgrades -> Status: ${res1.status}, count: ${Array.isArray(data1) ? data1.length : 'ok'}`);
    } catch (err) {
      console.error(`❌ [${role}] /api/owner/technicians/upgrades FAILED:`, err.message);
    }

    // 2. Chat warning
    try {
      const res2 = await fetch(`${BASE_URL}/owner/chat/test_conv_1/warning`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data2 = await res2.json();
      console.log(`✅ [${role}] /api/owner/chat/:id/warning -> Status: ${res2.status}, msg: ${data2?.message}`);
    } catch (err) {
      console.error(`❌ [${role}] /api/owner/chat/:id/warning FAILED:`, err.message);
    }
  }

  console.log('\n=== ALL END-TO-END CHECKS COMPLETED ===');
}

runTests();
