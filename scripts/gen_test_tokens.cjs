// scripts/gen_test_tokens.cjs — Generate JWT tokens for testing (bypasses OTP)
const jwt = require('jsonwebtoken');
const DB = require('better-sqlite3');
const db = new DB('./tecnorexa.db');

const JWT_SECRET = process.env.JWT_SECRET || 'tecnorexa-super-production-jwt-secret-2026-fallback';

function generateToken(userId, role) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error(`User ${userId} not found`);
  return jwt.sign(
    { id: user.id, phone: user.phone, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

const tokens = {
  owner: generateToken('owner_master', 'owner'),
  technician: generateToken('user_1790279521032', 'technician'), // active technician
  merchant: generateToken('merch_sample', 'merchant'),
  customer: generateToken('user_1790785618793', 'customer'),
  programmer: generateToken('programmer_maher', 'programmer'),
};

// Set governorate for technician
db.prepare("UPDATE users SET governorate = 'القاهرة', available = 1 WHERE id = ?").run('user_1790279521032');

console.log(JSON.stringify(tokens, null, 2));
