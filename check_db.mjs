import Database from "better-sqlite3";
const db = new Database("./tecnorexa.db");
console.log("PRODUCTS:", db.prepare("SELECT id, name, price, category FROM products").all());
console.log("USERS:", db.prepare("SELECT id, name, phone, role, balance FROM users").all());
db.close();

