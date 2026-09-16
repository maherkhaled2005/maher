const http = require('http');

const PORT = 8081;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (data) reqHeaders['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(resBody);
            resolve({ status: res.statusCode, body: parsed });
          } catch {
            resolve({ status: res.statusCode, body: resBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Starting Technician Availability & Profile Audit...');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
    }
  }

  // 1. Authenticate as technician
  const techLogin = await request('POST', '/api/auth/quick-access', { role: 'technician' });
  assert(techLogin.status === 200 && techLogin.body.token, 'Technician quick-access login succeeded');
  const techToken = techLogin.body.token;
  const techAuth = { Authorization: `Bearer ${techToken}` };

  // 2. Set technician availability to false (0)
  const availFalse = await request('POST', '/api/technician/availability', { available: false }, techAuth);
  assert(availFalse.status === 200 && availFalse.body.available === 0, 'Technician toggled to unavailable (0)');

  // 3. Verify via GET /api/user/profile
  const profile1 = await request('GET', '/api/user/profile', null, techAuth);
  assert(profile1.status === 200 && profile1.body.available === 0, 'Profile accurately reflects unavailable status in DB');

  // 4. Set technician availability back to true (1)
  const availTrue = await request('POST', '/api/technician/availability', { available: true }, techAuth);
  assert(availTrue.status === 200 && availTrue.body.available === 1, 'Technician toggled back to available (1)');

  // 5. Update user profile via PUT /api/user/profile
  const updateProf = await request(
    'PUT',
    '/api/user/profile',
    {
      bio: 'فني صياانة متخصص في صيانه التكييفات والثلاجات المنزلية',
      avatar: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758',
    },
    techAuth
  );
  assert(updateProf.status === 200 && updateProf.body.success, 'Profile updated successfully via PUT /api/user/profile');
  assert(updateProf.body.user.bio.includes('متخصص'), 'Bio correctly updated and returned');

  // 6. Test direct avatar upload endpoint POST /api/user/avatar
  const avatarUpload = await request(
    'POST',
    '/api/user/avatar',
    { avatar: 'data:image/jpeg;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' },
    techAuth
  );
  assert(avatarUpload.status === 200 && avatarUpload.body.success, 'Direct avatar upload succeeded via POST /api/user/avatar');

  // 7. Verify updated avatar persists in DB
  const profile2 = await request('GET', '/api/user/profile', null, techAuth);
  assert(profile2.body.avatar && profile2.body.avatar.startsWith('data:image/jpeg;base64,'), 'Persisted avatar retrieved from database');

  console.log('\n========================================');
  console.log(`Technician & Profile Suite: ${passed}/${total} assertions passed (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});