const DB = require('better-sqlite3');
const db = new DB('./tecnorexa.db');
const users = db.prepare('SELECT id, phone, name, role, status FROM users LIMIT 15').all();
console.log(JSON.stringify(users, null, 2));
