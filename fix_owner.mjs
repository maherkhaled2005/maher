import Database from "better-sqlite3";
const db = new Database("./tecnorexa.db");

// Fix 1: Unban the owner (critical!)
db.prepare("UPDATE users SET status = 'active' WHERE id = 'owner_master'").run();
console.log("Owner unbanned");

// Fix 2: Unban merchant_lead and customer_lead
db.prepare("UPDATE users SET status = 'active' WHERE id IN ('merchant_lead', 'customer_lead', 'programmer_lead')").run();
console.log("Other accounts unbanned");

// Fix 3: Verify
const users = db.prepare("SELECT id, name, role, status FROM users").all();
console.log("All users now:", JSON.stringify(users, null, 2));

// Fix 4: Check if there are more users
const count = db.prepare("SELECT COUNT(*) as total FROM users").get();
console.log("Total users:", count);

db.close();
