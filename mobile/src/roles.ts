// ========================================
// RBAC Roles & Permissions - TecnoRexa (Mobile)
// 7 Official Roles ONLY — assistant/junior/lead are designations (developerRank), NOT roles
// ========================================

export const VALID_ROLES = [
  "customer",
  "technician",
  "merchant",
  "customer_support",
  "programmer",
  "manager",
  "owner",
] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

export const ALL_PERMISSIONS = [
  "users.view",
  "users.edit",
  "users.delete",
  "users.manage",
  "users.manage_roles",
  "orders.view",
  "orders.manage",
  "tickets.view",
  "tickets.manage",
  "products.view",
  "products.add",
  "products.edit",
  "products.delete",
  "inventory.view",
  "inventory.manage",
  "content.create",
  "content.edit",
  "content.delete",
  "content.review",
  "bugs.view",
  "bugs.manage",
  "audit.view",
  "system.manage",
  "system.monitoring",
  "warehouse.view",
  "warehouse.manage",
  "categories.view",
  "categories.manage",
  "chat.view",
  "chat.manage",
  "profile.view",
  "profile.edit",
  "wallet.view",
  "wallet.manage",
  "notifications.view",
  "errors.view",
  "errors.manage",
  "technicians.view",
  "technicians.manage",
  "marketing.view",
  "marketing.manage",
  "governance.view",
  "system.logs",
  "courses.manage",
  "media.manage",
  "content.manage",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

// ربط كل رتبة بصلاحياتها (افتراضي - الخادم هو المصدر الرسمي)
export const ROLE_PERMISSIONS: Record<ValidRole, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,
  manager: [
    "users.view",
    "users.edit",
    "users.delete",
    "orders.view",
    "orders.manage",
    "tickets.view",
    "tickets.manage",
    "products.view",
    "products.add",
    "products.edit",
    "products.delete",
    "inventory.view",
    "inventory.manage",
    "content.review",
    "bugs.view",
    "bugs.manage",
    "audit.view",
    "system.monitoring",
    "warehouse.view",
    "warehouse.manage",
    "categories.view",
    "categories.manage",
    "chat.view",
    "chat.manage",
    "profile.view",
    "profile.edit",
    "wallet.view",
    "wallet.manage",
    "notifications.view",
    "errors.view",
    "errors.manage",
    "technicians.view",
    "technicians.manage",
    "marketing.view",
    "marketing.manage",
  ],
  programmer: [
    "bugs.view",
    "bugs.manage",
    "system.logs",
    "users.view",
    "users.manage",
    "users.manage_roles",
    "users.delete",
    "courses.manage",
    "media.manage",
    "content.manage",
    "tickets.manage",
  ],
  customer_support: [
    "tickets.view",
    "tickets.manage",
    "orders.view",
    "users.view",
    "chat.view",
    "chat.manage",
    "profile.view",
    "profile.edit",
    "notifications.view",
    "bugs.view",
    "technicians.view",
  ],
  technician: [
    "orders.view",
    "orders.manage",
    "content.create",
    "content.edit",
    "content.delete",
    "products.view",
    "chat.view",
    "profile.view",
    "profile.edit",
    "notifications.view",
    "technicians.view",
    "wallet.view",
  ],
  merchant: [
    "orders.view",
    "orders.manage",
    "products.view",
    "products.add",
    "products.edit",
    "products.delete",
    "inventory.view",
    "inventory.manage",
    "chat.view",
    "profile.view",
    "profile.edit",
    "notifications.view",
    "wallet.view",
  ],
  customer: [
    "orders.view",
    "products.view",
    "chat.view",
    "profile.view",
    "profile.edit",
    "notifications.view",
    "tickets.view",
    "wallet.view",
    "technicians.view",
  ],
};

/** تحويل الرتب القديمة إلى الرتب الجديدة */
export function normalizeRole(role: string): ValidRole {
  switch (role?.toLowerCase()) {
    case "admin":
    case "owner":
      return "owner";
    case "manager":
      return "manager";
    case "merchant":
    case "seller":
      return "merchant";
    case "technician":
    case "tech":
    case "content_creator":
    case "maintenance_tech":
      return "technician";
    case "user":
    case "client":
    case "customer":
      return "customer";
    case "developer":
    case "programmer":
    case "dev":
    case "assistant_programmer":
      return "programmer";
    case "support":
    case "customer_support":
      return "customer_support";
    default:
      if (VALID_ROLES.includes(role as ValidRole)) return role as ValidRole;
      return "customer";
  }
}

/** الحصول على الاسم العربي للرتبة */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: "المالك 👑",
    manager: "المدير 👔",
    programmer: "المبرمج 💻",
    customer_support: "دعم العملاء 🎧",
    technician: "فني صيانة 🔧",
    merchant: "تاجر معتمد 🏪",
    customer: "عميل 👤",
    admin: "المالك 👑",
    seller: "تاجر معتمد 🏪",
    content_creator: "فني صيانة 🔧",
    user: "عميل 👤",
  };
  return labels[role] || "عميل";
}

/** الحصول على لون الرتبة (hex) */
export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    owner: "#D4AF37",
    manager: "#1E40AF",
    programmer: "#7C3AED",
    customer_support: "#0D9488",
    technician: "#EA580C",
    merchant: "#15803D",
    customer: "#6B7280",
  };
  return colors[normalizeRole(role)] || "#6B7280";
}

/** هل هذه الرتبة إدارية؟ */
export function isAdminRole(role: string): boolean {
  const adminRoles: ValidRole[] = ["owner", "manager"];
  return adminRoles.includes(normalizeRole(role));
}

/** هل هذه الرتبة تقنية (مبرمج أو إداري)؟ */
export function isStaffRole(role: string): boolean {
  const staffRoles: ValidRole[] = [
    "owner",
    "manager",
    "programmer",
    "customer_support",
  ];
  return staffRoles.includes(normalizeRole(role));
}

/** تجميع الصلاحيات حسب المجموعة (users, orders, ...) */
export function groupPermissions(
  perms: readonly string[],
): Record<string, string[]> {
  return perms.reduce(
    (acc, id) => {
      const group = id.split(".")[0];
      if (!acc[group]) acc[group] = [];
      acc[group].push(id);
      return acc;
    },
    {} as Record<string, string[]>,
  );
}

/** الاسم العربي لمجموعة الصلاحيات */
export function getPermissionGroupLabel(group: string): string {
  const labels: Record<string, string> = {
    users: "المستخدمون",
    orders: "الطلبات",
    tickets: "التذاكر",
    products: "المنتجات",
    inventory: "المخزون",
    content: "المحتوى",
    bugs: "الأخطاء البرمجية",
    audit: "سجل العمليات",
    system: "النظام",
    warehouse: "المخازن",
    categories: "الفئات",
    chat: "الشات",
    profile: "الملف الشخصي",
    wallet: "المحفظة",
    notifications: "الإشعارات",
    errors: "الأخطاء",
    technicians: "الفنيون",
    marketing: "التسويق",
    governance: "الحوكمة",
  };
  return labels[group] || group;
}

/** الاسم العربي لصلاحية واحدة */
export function getPermissionLabel(permId: string): string {
  const labels: Record<string, string> = {
    "users.view": "عرض المستخدمين",
    "users.edit": "تعديل المستخدمين",
    "users.delete": "حذف المستخدمين",
    "users.manage_roles": "إدارة الرتب والصلاحيات",
    "orders.view": "عرض الطلبات",
    "orders.manage": "إدارة الطلبات",
    "tickets.view": "عرض التذاكر",
    "tickets.manage": "إدارة التذاكر",
    "products.view": "عرض المنتجات",
    "products.add": "إضافة منتجات",
    "products.edit": "تعديل المنتجات",
    "products.delete": "حذف المنتجات",
    "inventory.view": "عرض المخزون",
    "inventory.manage": "إدارة المخزون",
    "content.create": "إنشاء محتوى",
    "content.edit": "تعديل محتوى",
    "content.delete": "حذف محتوى",
    "content.review": "مراجعة محتوى",
    "bugs.view": "عرض الأخطاء البرمجية",
    "bugs.manage": "إدارة الأخطاء البرمجية",
    "audit.view": "سجل العمليات",
    "system.manage": "إدارة النظام",
    "system.monitoring": "مراقبة النظام",
    "warehouse.view": "عرض المخازن",
    "warehouse.manage": "إدارة المخازن",
    "categories.view": "عرض الفئات",
    "categories.manage": "إدارة الفئات",
    "chat.view": "عرض الشات",
    "chat.manage": "إدارة الشات",
    "profile.view": "عرض الملف الشخصي",
    "profile.edit": "تعديل الملف الشخصي",
    "wallet.view": "عرض المحفظة",
    "wallet.manage": "إدارة المحفظة",
    "notifications.view": "عرض الإشعارات",
    "errors.view": "عرض الأخطاء",
    "errors.manage": "إدارة الأخطاء",
    "technicians.view": "عرض الفنيين",
    "technicians.manage": "إدارة الفنيين",
    "marketing.view": "عرض التسويق",
    "marketing.manage": "إدارة التسويق",
    "governance.view": "عرض الحوكمة",
  };
  return labels[permId] || permId;
}
