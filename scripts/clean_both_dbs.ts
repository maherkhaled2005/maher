import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbFiles = ['tecnorexa.db', 'database.sqlite'];

const coreUsers = [
  {
    id: 'owner_master',
    name: 'المهندس خالد محمد',
    phone: '01000000001',
    role: 'owner',
    email: 'owner@tecnorexa.com',
    pass: 'Owner@123456',
    specialty: 'المالك والمشرف العام',
    developerRank: 'none',
    isPro: 1,
  },
  {
    id: 'programmer_lead',
    name: 'المهندس ماهر خالد',
    phone: '01064739664',
    role: 'programmer',
    email: 'maher@tecnorexa.com',
    pass: 'Maher@123456',
    specialty: 'المسؤول التقني وقائد التطوير',
    developerRank: 'lead',
    isPro: 1,
  },
  {
    id: 'manager_lead',
    name: 'المدير التنفيذي',
    phone: '01000000003',
    role: 'manager',
    email: 'manager@tecnorexa.com',
    pass: 'Manager@123456',
    specialty: 'الإدارة والتشغيل',
    developerRank: 'none',
    isPro: 1,
  },
  {
    id: 'support_lead',
    name: 'فريق خدمة العملاء',
    phone: '01000000004',
    role: 'customer_support',
    email: 'support@tecnorexa.com',
    pass: 'Support@123456',
    specialty: 'الدعم الفني وخدمة العملاء',
    developerRank: 'none',
    isPro: 0,
  },
  {
    id: 'tech_lead',
    name: 'فني صيانة معتمد',
    phone: '01000000005',
    role: 'technician',
    email: 'tech@tecnorexa.com',
    pass: 'Tech@123456',
    specialty: 'تكييف وتبريد ❄️',
    developerRank: 'none',
    isPro: 1,
  },
  {
    id: 'merchant_lead',
    name: 'تاجر قطع الغيار المعتمد',
    phone: '01000000006',
    role: 'merchant',
    email: 'merchant@tecnorexa.com',
    pass: 'Merchant@123456',
    specialty: 'متجر ريكسا الهندسي',
    developerRank: 'none',
    isPro: 1,
  },
  {
    id: 'customer_lead',
    name: 'عميل المنصة المعتمد',
    phone: '01000000007',
    role: 'customer',
    email: 'customer@tecnorexa.com',
    pass: 'Customer@123456',
    specialty: 'عميل مميز',
    developerRank: 'none',
    isPro: 0,
  },
];

dbFiles.forEach(dbFile => {
  const fullPath = path.join(process.cwd(), dbFile);
  if (!fs.existsSync(fullPath)) return;
  console.log(`\n🧹 Cleaning DB file: ${dbFile}...`);
  try {
    const db = new Database(fullPath);
    db.pragma('foreign_keys = OFF');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'vw_%'").all() as { name: string }[];
    
    // Only structural system tables are preserved; all user transaction / product / task / notification data is purged
    const preserveTables = new Set(['categories', 'specialties', 'roles', 'permissions', 'role_permissions', 'system_settings']);
    
    tables.forEach(t => {
      if (!preserveTables.has(t.name) && t.name !== 'users') {
        try {
          const res = db.prepare(`DELETE FROM "${t.name}"`).run();
          console.log(`   - Cleared [${t.name}]: ${res.changes} rows deleted`);
        } catch (e: any) {
          console.warn(`   - Error clearing [${t.name}]: ${e.message}`);
        }
      }
    });

    // Delete fake/test users
    const coreIds = coreUsers.map(u => `'${u.id}'`).join(',');
    const delUsers = db.prepare(`DELETE FROM users WHERE id NOT IN (${coreIds})`).run();
    console.log(`   - Deleted ${delUsers.changes} fake/test user accounts`);

    // Reset remaining official users
    for (const cu of coreUsers) {
      const hash = bcrypt.hashSync(cu.pass, 10);
      const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(cu.id);
      if (!existing) {
        db.prepare(`
          INSERT INTO users (id, name, phone, email, role, developerRank, password, status, verified, balance, jobs, rating, ratingCount, specialty, isPro, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 1, 0, 0, 0, 0, ?, ?, datetime('now'))
        `).run(cu.id, cu.name, cu.phone, cu.email, cu.role, cu.developerRank, hash, cu.specialty, cu.isPro);
        console.log(`   + Created fresh account for [${cu.name}] (${cu.role})`);
      } else {
        db.prepare(`
          UPDATE users SET
            name = ?,
            phone = ?,
            email = ?,
            role = ?,
            developerRank = ?,
            password = ?,
            status = 'active',
            verified = 1,
            balance = 0,
            jobs = 0,
            rating = 0,
            ratingCount = 0,
            specialty = ?,
            isPro = ?,
            banned = 0,
            banReason = NULL
          WHERE id = ?
        `).run(cu.name, cu.phone, cu.email, cu.role, cu.developerRank, hash, cu.specialty, cu.isPro, cu.id);
        console.log(`   * Cleaned & zeroed account for [${cu.name}] (${cu.role})`);
      }
    }

    db.pragma('foreign_keys = ON');
    console.log(`✅ ${dbFile} clean & zeroed.`);
    db.close();
  } catch (err: any) {
    console.error(`Error processing ${dbFile}:`, err.message);
  }
});

