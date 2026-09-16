-- src/database/schema.sql

-- ===== 1. المستخدمين =====
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT UNIQUE,
  email TEXT,
  password TEXT,
  role TEXT DEFAULT 'customer',
  status TEXT DEFAULT 'active',
  balance REAL DEFAULT 0,
  avatar TEXT,
  bio TEXT,
  isPro BOOLEAN DEFAULT 0,
  developerRank TEXT DEFAULT 'junior', -- lead, senior, junior
  specialty TEXT,
  workingHours TEXT,
  coverageAreas TEXT,
  storeName TEXT,
  storeBio TEXT,
  signature TEXT,
  city TEXT,
  governorate TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===== 2. المنتجات =====
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  price REAL,
  stock INTEGER DEFAULT 0,
  category TEXT,
  sellerId TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, blocked
  isSponsored BOOLEAN DEFAULT 0,
  image TEXT,
  views INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  blockReason TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sellerId) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 3. الطلبات =====
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  userId TEXT,
  items TEXT, -- JSON array
  total REAL,
  status TEXT DEFAULT 'pending', -- pending, assigned, in_progress, completed, cancelled
  type TEXT, -- maintenance, commerce
  paymentStatus TEXT DEFAULT 'pending', -- pending, paid, refunded, cod
  paymentMethod TEXT, -- wallet, card, cod, stripe
  address TEXT,
  technicianId TEXT,
  sellerId TEXT,
  trackingNumber TEXT,
  report TEXT,
  partsCost REAL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (technicianId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (sellerId) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== 4. الكورسات =====
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  price REAL DEFAULT 0,
  instructorId TEXT,
  level TEXT DEFAULT 'beginner', -- beginner, intermediate, expert
  category TEXT,
  lessons INTEGER DEFAULT 0,
  duration TEXT,
  rating REAL DEFAULT 0,
  students INTEGER DEFAULT 0,
  image TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructorId) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 5. دروس الكورسات =====
CREATE TABLE IF NOT EXISTS course_lessons (
  id TEXT PRIMARY KEY,
  courseId TEXT,
  title TEXT,
  videoUrl TEXT,
  duration TEXT,
  orderIndex INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
);

-- ===== 6. تذاكر الدعم =====
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  userId TEXT,
  subject TEXT,
  description TEXT,
  category TEXT DEFAULT 'general', -- payments, technician, product, shipping, tech, general
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'open', -- open, in_progress, pending_customer, closed
  assignedTo TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== 7. رسائل التذاكر =====
CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticketId TEXT,
  senderId TEXT,
  senderName TEXT,
  senderType TEXT, -- customer, agent, admin
  message TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE
);

-- ===== 8. المحادثات =====
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  participants TEXT, -- JSON array of userIds
  lastMessage TEXT,
  lastMessageAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===== 9. الرسائل =====
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversationId TEXT,
  senderId TEXT,
  message TEXT,
  isRead BOOLEAN DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
);

-- ===== 10. الإشعارات =====
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  userId TEXT,
  title TEXT,
  body TEXT,
  type TEXT DEFAULT 'general', -- order, message, system, course, ticket
  isRead BOOLEAN DEFAULT 0,
  data TEXT, -- JSON for navigation
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 11. المخازن =====
CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  name TEXT,
  location TEXT,
  isDefault BOOLEAN DEFAULT 0,
  managerId TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (managerId) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== 12. مخزون المخازن =====
CREATE TABLE IF NOT EXISTS warehouse_inventory (
  id TEXT PRIMARY KEY,
  warehouseId TEXT,
  productId TEXT,
  quantity INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouseId) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

-- ===== 13. حركات المخزون =====
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  warehouseId TEXT,
  productId TEXT,
  type TEXT, -- add, remove, transfer
  quantity INTEGER,
  fromWarehouse TEXT,
  toWarehouse TEXT,
  reason TEXT,
  userId TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouseId) REFERENCES warehouses(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

-- ===== 14. المعاملات المالية =====
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  userId TEXT,
  type TEXT, -- credit, debit, withdraw, topup, refund, subscription
  amount REAL,
  description TEXT,
  status TEXT DEFAULT 'completed',
  reference TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 15. طلبات السحب =====
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id TEXT PRIMARY KEY,
  userId TEXT,
  amount REAL,
  method TEXT, -- bank, vodafone, instapay, fawry
  accountInfo TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
  approvedBy TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approvedBy) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== 16. طلبات الترقية =====
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id TEXT PRIMARY KEY,
  userId TEXT,
  targetRole TEXT, -- technician, merchant
  feePaid REAL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  specialty TEXT,
  storeName TEXT,
  experience TEXT,
  nationalId TEXT,
  documents TEXT, -- JSON of uploaded files
  rejectReason TEXT,
  approvedBy TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approvedBy) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== 17. المهام البرمجية =====
CREATE TABLE IF NOT EXISTS dev_tasks (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  assignedTo TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'new', -- new, in_progress, review, done
  progress INTEGER DEFAULT 0,
  deadline TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== 18. الأخطاء البرمجية =====
CREATE TABLE IF NOT EXISTS dev_bugs (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  assignedTo TEXT,
  reportedBy TEXT,
  stack TEXT,
  platform TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignedTo) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reportedBy) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== 19. مقتطفات الأكواد =====
CREATE TABLE IF NOT EXISTS dev_snippets (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  language TEXT DEFAULT 'javascript',
  code TEXT,
  authorId TEXT,
  likes INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (authorId) REFERENCES users(id) ON DELETE SET NULL
);

-- ===== 20. المنشورات (مجتمع الويب) =====
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  userId TEXT,
  content TEXT,
  image TEXT,
  likes INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 21. تعليقات المنشورات =====
CREATE TABLE IF NOT EXISTS post_comments (
  id TEXT PRIMARY KEY,
  postId TEXT,
  userId TEXT,
  comment TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 22. الإعجابات =====
CREATE TABLE IF NOT EXISTS post_likes (
  id TEXT PRIMARY KEY,
  postId TEXT,
  userId TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(postId, userId)
);

-- ===== 23. الريلز =====
CREATE TABLE IF NOT EXISTS reels (
  id TEXT PRIMARY KEY,
  userId TEXT,
  title TEXT,
  videoUrl TEXT,
  description TEXT,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 24. تعليقات الريلز =====
CREATE TABLE IF NOT EXISTS reel_comments (
  id TEXT PRIMARY KEY,
  reelId TEXT,
  userId TEXT,
  comment TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reelId) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 25. إعجابات الريلز =====
CREATE TABLE IF NOT EXISTS reel_likes (
  id TEXT PRIMARY KEY,
  reelId TEXT,
  userId TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reelId) REFERENCES reels(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(reelId, userId)
);

-- ===== 26. تقييمات الفنيين =====
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  userId TEXT,
  technicianId TEXT,
  rating INTEGER DEFAULT 5,
  comment TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (technicianId) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 27. التخصصات =====
CREATE TABLE IF NOT EXISTS specialties (
  id TEXT PRIMARY KEY,
  name TEXT,
  icon TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===== 28. تخصصات الفنيين =====
CREATE TABLE IF NOT EXISTS technician_specialties (
  id TEXT PRIMARY KEY,
  technicianId TEXT,
  specialtyId TEXT,
  FOREIGN KEY (technicianId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (specialtyId) REFERENCES specialties(id) ON DELETE CASCADE
);

-- ===== 29. حملات التسويق =====
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  userId TEXT,
  title TEXT,
  description TEXT,
  package TEXT, -- basic, pro, advanced
  amountPaid REAL,
  productIds TEXT, -- JSON array
  status TEXT DEFAULT 'active', -- active, expired, cancelled
  endDate TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- ===== 30. الكوبونات =====
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  discount REAL,
  maxDiscount REAL,
  expiresAt TEXT,
  usageLimit INTEGER,
  usedCount INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- ===== الفهارس (لتحسين الأداء) =====
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_sellerId ON products(sellerId);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_orders_userId ON orders(userId);
CREATE INDEX idx_orders_technicianId ON orders(technicianId);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_tickets_userId ON tickets(userId);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_messages_conversationId ON messages(conversationId);
CREATE INDEX idx_notifications_userId ON notifications(userId);
CREATE INDEX idx_transactions_userId ON transactions(userId);
CREATE INDEX idx_withdraw_requests_status ON withdraw_requests(status);
CREATE INDEX idx_posts_userId ON posts(userId);
CREATE INDEX idx_reels_userId ON reels(userId);
CREATE INDEX idx_reviews_technicianId ON reviews(technicianId);
CREATE INDEX idx_warehouse_inventory_warehouseId ON warehouse_inventory(warehouseId);
CREATE INDEX idx_warehouse_inventory_productId ON warehouse_inventory(productId);
CREATE INDEX idx_dev_tasks_assignedTo ON dev_tasks(assignedTo);
CREATE INDEX idx_dev_bugs_assignedTo ON dev_bugs(assignedTo);
