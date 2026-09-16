import Database from "better-sqlite3";
const db = new Database("./tecnorexa.db");
const result = db.prepare("SELECT * FROM system_settings WHERE key = 'maintenance_mode'").get();
console.log("maintenance_mode:", JSON.stringify(result));
db.prepare("INSERT OR REPLACE INTO system_settings (key, value) VALUES ('maintenance_mode', 'false')").run();
console.log("Set to false done");
const users = db.prepare("SELECT id, name, phone, role, status FROM users LIMIT 20").all();
console.log("Users:", JSON.stringify(users));
db.close();
