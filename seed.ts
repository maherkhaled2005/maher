import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("tecnorexa.db");

const users = [
  { role: "owner", email: "owner@tecnorexa.com", pass: "Owner@123456", phone: "01000000001", name: "المهندس المالك خالد محمد" },
  { role: "manager", email: "manager@tecnorexa.com", pass: "Manager@123456", phone: "01000000003", name: "المدير التنفيذي" },
  { role: "programmer", email: "maher@tecnorexa.com", pass: "Maher@123456", phone: "01000000002", name: "المبرمج الرئيسي ماهر" },
  { role: "customer_support", email: "support@tecnorexa.com", pass: "Support@123456", phone: "01000000004", name: "خدمة العملاء" },
  { role: "technician", email: "tech@tecnorexa.com", pass: "Tech@123456", phone: "01000000005", name: "الفني المعتمد" },
  { role: "merchant", email: "merchant@tecnorexa.com", pass: "Merchant@123456", phone: "01000000006", name: "التاجر المعتمد" },
  { role: "customer", email: "customer@tecnorexa.com", pass: "Customer@123456", phone: "01000000007", name: "العميل المعتمد" }
];

console.log("Seeding users...");

const stmt = db.prepare("INSERT INTO users (id, name, email, password, role, phone, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, 'active', ?) ON CONFLICT(email) DO UPDATE SET password=excluded.password, role=excluded.role, name=excluded.name, phone=excluded.phone");

users.forEach(u => {
  const hash = bcrypt.hashSync(u.pass, 10);
  stmt.run(Math.random().toString(36).substring(7), u.name, u.email, hash, u.role, u.phone, new Date().toISOString());
  console.log(`Upserted ${u.email} as ${u.role}`);
});

console.log("Seeding complete!");
