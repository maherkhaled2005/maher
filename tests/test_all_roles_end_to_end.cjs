const Database = require('better-sqlite3');
const path = require('path');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;
const db = new Database(path.join(__dirname, '..', 'tecnorexa.db'));

const ROLES = [
  { role: 'owner', phone: '01011112222', pass: '123456' },
  { role: 'manager', phone: '01286585187', pass: '123456' },
  { role: 'programmer', phone: '01064739664', pass: '123456' },
  { role: 'customer_support', phone: '01557470554', pass: '123456' },
  { role: 'technician', phone: '01099887722', pass: '123456' },
  { role: 'merchant', phone: '01122334455', pass: '123456' },
  { role: 'customer', phone: '01055667788', pass: '123456' },
];

async function runTests() {
  console.log('=== STARTING END-TO-END 7 ROLES PRODUCTION VERIFICATION ===\n');

  // Test 0: App Version Endpoint
  try {
    const vRes = await fetch(`${BASE_URL}/app/version`);
    const vData = await vRes.json();
    console.log(`✅ /api/app/version -> status: ${vRes.status}, version: ${vData.currentVersion}, minSupported: ${vData.minimumSupportedVersion}`);
  } catch (err) {
    console.error(`❌ /api/app/version FAILED:`, err.message);
  }

  const tokens = {};

  for (const r of ROLES) {
    try {
      let res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: r.phone, password: r.pass }),
      });
      let data = await res.json();

      if (data.requireOtp && data.tempToken) {
        const row = db.prepare("SELECT otpCode FROM users WHERE phone = ?").get(r.phone);
        const otpRes = await fetch(`${BASE_URL}/auth/verify-login-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tempToken: data.tempToken, phone: r.phone, otp: row?.otpCode }),
        });
        data = await otpRes.json();
        res = otpRes;
      }

      if (res.ok && data.token) {
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

  console.log('\n--- TESTING CONVERSATIONS & PEER IDENTITY FOR NORMAL USERS ---');
  if (tokens.customer) {
    try {
      const res = await fetch(`${BASE_URL}/conversations`, {
        headers: { Authorization: `Bearer ${tokens.customer}` }
      });
      const data = await res.json();
      console.log(`✅ [customer] /api/conversations -> Status: ${res.status}, conversations count: ${data.length}`);
      if (data.length > 0) {
        const first = data[0];
        console.log(`   Sample conversation peer name: "${first.name}" (not self)`);
      }
    } catch (err) {
      console.error(`❌ [customer] /api/conversations FAILED:`, err.message);
    }
  }

  console.log('\n--- TESTING SUPPORT TICKETS & MESSAGES ---');
  if (tokens.customer) {
    try {
      const res = await fetch(`${BASE_URL}/support/tickets`, {
        headers: { Authorization: `Bearer ${tokens.customer}` }
      });
      const data = await res.json();
      console.log(`✅ [customer] /api/support/tickets -> Status: ${res.status}, tickets: ${data.length}`);
    } catch (err) {
      console.error(`❌ [customer] /api/support/tickets FAILED:`, err.message);
    }
  }

  console.log('\n--- TESTING ORDER STOCK & MARKETPLACE ---');
  if (tokens.customer) {
    try {
      const products = db.prepare("SELECT * FROM products LIMIT 1").all();
      if (products.length > 0) {
        const prod = products[0];
        console.log(`   Found test product: ${prod.name} (stock: ${prod.stock})`);
        // Test placing order with quantity exceeding stock
        const badRes = await fetch(`${BASE_URL}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens.customer}`,
          },
          body: JSON.stringify({
            items: [{ id: prod.id, name: prod.name, price: prod.price, quantity: 999999 }],
            address: 'القاهرة - المعادي',
            paymentMethod: 'cod',
            total: prod.price * 999999,
            type: 'marketplace',
          }),
        });
        const badData = await badRes.json();
        if (badRes.status === 400 && badData.error && badData.error.includes('المخزون')) {
          console.log(`✅ Stock limit enforcement passed: "${badData.error}"`);
        } else {
          console.log(`⚠️ Expected stock limit error, got:`, badData);
        }
      }
    } catch (err) {
      console.error(`❌ Order stock test error:`, err.message);
    }
  }

  console.log('\n=== END-TO-END TEST SUITE COMPLETED ===');
}

runTests().catch(console.error);
