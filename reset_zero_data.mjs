import Database from "better-sqlite3";

const db = new Database("tecnorexa.db");

console.log("🧹 Resetting transient test data for zero-mock production state...");

try {
  // Clear transient test tables
  const tablesToClear = [
    "transactions",
    "orders",
    "order_items",
    "support_tickets",
    "support_messages",
    "support_requests",
    "subscriptions",
    "notifications",
    "content_posts",
    "reels",
    "reel_likes",
    "audit_logs",
    "upgrade_requests",
    "approval_requests",
    "trade_requests",
    "repair_orders",
    "wallet_transactions",
    "cash_withdrawals",
    "merchant_subscriptions",
    "developer_bugs",
    "saved_offline_videos",
    "developer_banned_users",
    "technician_specialties"
  ];

  for (const tbl of tablesToClear) {
    try {
      db.prepare(`DELETE FROM ${tbl}`).run();
    } catch (e) {
      // Table might not exist yet
    }
  }

  // Remove non-essential technician users so initial technician count is 0
  db.prepare("DELETE FROM users WHERE role = 'technician'").run();

  // Reset balances, jobs, ratings, and ban status for remaining core users
  db.prepare("UPDATE users SET balance = 0, jobs = 0, points = 0, banned = 0, status = 'active', banReason = NULL").run();

  console.log("✅ Zero-data reset complete! All revenue, subscriptions, orders, logs, and technician list reset to 0.");
} catch (err) {
  console.error("Error during reset:", err);
}
