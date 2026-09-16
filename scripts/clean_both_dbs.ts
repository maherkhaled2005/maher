import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbFiles = ['tecnorexa.db', 'database.sqlite'];

dbFiles.forEach(dbFile => {
  const fullPath = path.join(process.cwd(), dbFile);
  if (!fs.existsSync(fullPath)) return;
  console.log(`🧹 Cleaning DB file: ${dbFile}...`);
  try {
    const db = new Database(fullPath);
    db.pragma('foreign_keys = OFF');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'vw_%'").all() as { name: string }[];
    
    const preserveTables = new Set(['users', 'categories', 'specialties', 'roles', 'permissions', 'role_permissions', 'system_settings']);
    
    tables.forEach(t => {
      if (!preserveTables.has(t.name)) {
        try {
          const res = db.prepare(`DELETE FROM ${t.name}`).run();
          console.log(`   - Cleared [${t.name}]: ${res.changes} rows deleted`);
        } catch (e: any) {
          console.warn(`   - Error clearing [${t.name}]: ${e.message}`);
        }
      }
    });

    try {
      db.prepare("UPDATE users SET balance = 0").run();
    } catch {}
    db.pragma('foreign_keys = ON');
    console.log(`✅ ${dbFile} clean & zeroed.`);
    db.close();
  } catch (err: any) {
    console.error(`Error processing ${dbFile}:`, err.message);
  }
});
