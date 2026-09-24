const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'tecnorexa.db'));

const hash = bcrypt.hashSync('123456', 10);

// Clear any conflicting stale temporary user
db.prepare("DELETE FROM users WHERE id = 'user_1789942761712' OR email = 'maherkhaled880@gmail.com' OR phone = '01557470554'").run();

const targetUsers = [
  {
    id: 'owner_master',
    name: 'المهندس خالد محمد (المالك)',
    phone: '01011112222',
    email: 'owner@tecnorexa.com',
    role: 'owner',
    developerRank: 'none',
  },
  {
    id: 'manager_adel',
    name: 'عادل الجوهري (المدير العام)',
    phone: '01286585187',
    email: 'adelelgohry412@gmail.com',
    role: 'manager',
    developerRank: 'none',
  },
  {
    id: 'programmer_maher',
    name: 'المهندس ماهر خالد',
    phone: '01064739664',
    email: 'maherkhaled880@gmail.com',
    role: 'programmer',
    developerRank: 'lead',
  },
  {
    id: 'support_official',
    name: 'فريق خدمة العملاء والدعم الفني',
    phone: '01557470554',
    email: 'tecnorexa@gmail.com',
    role: 'customer_support',
    developerRank: 'none',
  },
];

for (const u of targetUsers) {
  const existing = db.prepare("SELECT id FROM users WHERE id = ? OR phone = ?").get(u.id, u.phone);
  if (existing) {
    db.prepare(`
      UPDATE users SET 
        name = ?, phone = ?, email = ?, role = ?, developerRank = ?, password = ?, status = 'active', verified = 1, phoneVerified = 1 
      WHERE id = ?
    `).run(u.name, u.phone, u.email, u.role, u.developerRank, hash, existing.id);
    console.log('Updated user:', u.name, u.phone, u.role);
  } else {
    db.prepare(`
      INSERT INTO users (id, name, phone, email, role, developerRank, password, status, verified, phoneVerified, balance, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1, 1, 0, datetime('now'))
    `).run(u.id, u.name, u.phone, u.email, u.role, u.developerRank, hash);
    console.log('Inserted user:', u.name, u.phone, u.role);
  }
}

const users = db.prepare("SELECT id, name, phone, email, role, status FROM users").all();
console.log('FINAL SYNCED USERS IN DB:\n', JSON.stringify(users, null, 2));
