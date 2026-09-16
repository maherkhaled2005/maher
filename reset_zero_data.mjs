import Database from "better-sqlite3";

const db = new Database("tecnorexa.db");

console.log("🧹 Resetting transient test data for zero-mock production state...");

// Clear transient test tables
db.prepare("DELETE FROM transactions").run();
db.prepare("DELETE FROM orders").run();
db.prepare("DELETE FROM order_items").run();
db.prepare("DELETE FROM support_tickets").run();
db.prepare("DELETE FROM support_messages").run();
db.prepare("DELETE FROM support_requests").run();
db.prepare("DELETE FROM subscriptions").run();
db.prepare("DELETE FROM notifications").run();
db.prepare("DELETE FROM content_posts").run();
db.prepare("DELETE FROM reels").run();
db.prepare("DELETE FROM reel_likes").run();
db.prepare("DELETE FROM audit_logs").run();
db.prepare("DELETE FROM upgrade_requests").run();
db.prepare("DELETE FROM approval_requests").run();

// Reset balances and jobs for core users
db.prepare("UPDATE users SET balance = 0, jobs = 0, points = 0").run();

console.log("✅ Zero-data reset complete! All revenue, subscriptions, orders, and balances are reset to 0.");
