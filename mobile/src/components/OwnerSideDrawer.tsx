import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  PanResponder,
} from 'react-native';
import {
  X,
  LayoutDashboard,
  UserCog,
  ShoppingBag,
  Package,
  Wallet,
  Layers,
  Building2,
  Headphones,
  MessageSquare,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Code,
  Megaphone,
  Film,
  Bot,
  Bell,
  Settings,
  User,
  Crown,
  Search,
  ChevronLeft,
  Briefcase,
  Terminal,
  Server,
  Truck,
  BookOpen,
  Store,
  Plus,
  BarChart2,
  CheckSquare,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme';
import Logo from './Logo';
import { useAuthStore } from '../store/authStore';
import { normalizeRole } from '../utils/permissions';

export interface RoleSectionItem {
  id: number;
  label: string;
  sub: string;
  screen: string;
  icon: any;
  color: string;
  badge?: string;
  badgeColor?: string;
}

// 👑 المالك (21 قسماً مرتبة بدقة)
export const OWNER_SECTIONS: RoleSectionItem[] = [
  { id: 1, label: 'لوحة الإحصائيات (Dashboard)', sub: 'غرفة العمليات المركزية', screen: 'Home', icon: LayoutDashboard, color: colors.primary },
  { id: 2, label: 'إدارة المستخدمين (Admin Users)', sub: 'سجل الناخبين والموظفين', screen: 'AdminUsers', icon: UserCog, color: '#3B82F6' },
  { id: 3, label: 'السوق والمنتجات (Marketplace)', sub: 'الرقابة العامة على البضاعة', screen: 'Marketplace', icon: ShoppingBag, color: '#F59E0B' },
  { id: 4, label: 'إدارة الطلبات (Orders)', sub: 'غرفة العمليات اللوجستية', screen: 'Orders', icon: Package, color: '#10B981' },
  { id: 5, label: 'المحفظة والماليات (Wallet)', sub: 'خزينة الشركة والمدفوعات', screen: 'Wallet', icon: Wallet, color: colors.primary },
  { id: 6, label: 'إدارة الأقسام (Categories)', sub: 'هيكل المنصة والتصنيفات', screen: 'AdminCategories', icon: Layers, color: '#8B5CF6' },
  { id: 7, label: 'إدارة المخازن (Warehouses)', sub: 'جرد المستودعات المركزية', screen: 'Warehouses', icon: Building2, color: '#EC4899' },
  { id: 8, label: 'خدمة العملاء والدعم (Support)', sub: 'غرفة الشكاوى ومتابعة التذاكر', screen: 'Tickets', icon: Headphones, color: '#EF4444' },
  { id: 9, label: 'الشات والمحادثات (Chat)', sub: 'الرقابة الأمنية (Observer)', screen: 'ChatList', icon: MessageSquare, color: '#06B6D4' },
  { id: 10, label: 'فريق الفنيين (Technicians)', sub: 'كادر الصيانة وترقيات 300 ج.م', screen: 'TechniciansTeam', icon: Wrench, color: '#F59E0B' },
  { id: 11, label: 'سجل العمليات الأمني (Audit Logs)', sub: 'كاميرات المراقبة وتدقيق الأنشطة', screen: 'AuditLogs', icon: ShieldCheck, color: '#6366F1' },
  { id: 12, label: 'طلبات التوثيق والترقية (Trade Requests)', sub: 'مراجعة إيصالات 300 ج.م و 100 ج.م', screen: 'TradeRequests', icon: CheckSquare, color: '#10B981' },
  { id: 13, label: 'التقارير المالية والتحليلات (Analytics)', sub: 'إحصائيات المبيعات والأرباح الشاملة', screen: 'Analytics', icon: BarChart2, color: '#A855F7' },
  { id: 14, label: 'قسم التسويق والحملات (Marketing)', sub: 'البوق الإعلامي والكوبونات', screen: 'Marketing', icon: Megaphone, color: '#14B8A6' },
  { id: 15, label: 'المركز الإعلامي والفيديوهات (Videos)', sub: 'رقابة المحتوى والريلز', screen: 'MediaApproval', icon: Film, color: '#E11D48' },
  { id: 16, label: 'مجتمع المنصة والفيديوهات', sub: 'استعراض المحتوى والتفاعل المجتمعي', screen: 'WebCommunity', icon: Film, color: '#8B5CF6' },
  { id: 17, label: 'الأكاديمية والكورسات', sub: 'استعراض الكورسات وشروحات الصيانة', screen: 'Courses', icon: BookOpen, color: '#F59E0B' },
  { id: 18, label: 'مركز الذكاء الاصطناعي (AI Hub)', sub: 'دماغ التطبيق والنماذج الذكية', screen: 'AIChat', icon: Bot, color: '#8B5CF6' },
  { id: 19, label: 'مركز الإشعارات (Notifications)', sub: 'إدارة التنبيهات الجماعية', screen: 'Notifications', icon: Bell, color: '#F97316' },
  { id: 20, label: 'الإعدادات العامة (Settings)', sub: 'غرفة التحكم والعمولات والصيانة', screen: 'Settings', icon: Settings, color: '#64748B' },
  { id: 21, label: 'الملف الشخصي (Profile)', sub: 'صفحة الإدارة وخلاصة المنشورات', screen: 'Profile', icon: User, color: colors.primary },
];

// 👔 المدير (17 قسماً تشغيلياً)
export const MANAGER_SECTIONS: RoleSectionItem[] = [
  { id: 1, label: 'لوحة العمليات التشغيلية', sub: 'مؤشرات الأداء والطلبات والشكاوى', screen: 'Home', icon: LayoutDashboard, color: '#1E40AF' },
  { id: 2, label: 'فحص واعتماد المنتجات', sub: 'مراجعة معروضات التجار وقبولها', screen: 'Marketplace', icon: ShoppingBag, color: '#F59E0B' },
  { id: 3, label: 'إدارة وتوجيه الطلبات', sub: 'متابعة الشحنات وتعيين المنفذين', screen: 'Orders', icon: Package, color: '#10B981' },
  { id: 4, label: 'تذاكر الدعم والشكاوى', sub: 'حل شكاوى العملاء وتوزيع التذاكر', screen: 'Tickets', icon: Headphones, color: '#EF4444' },
  { id: 5, label: 'فريق الفنيين وترقياتهم', sub: 'اعتماد طلبات الترقية ومتابعة الأداء', screen: 'TechniciansTeam', icon: Wrench, color: '#10B981' },
  { id: 6, label: 'المخازن والتوريدات', sub: 'متابعة حركات المستودعات والنواقص', screen: 'Warehouses', icon: Building2, color: '#EC4899' },
  { id: 7, label: 'المستخدمين والموظفين', sub: 'إدارة الحسابات وتعطيل المخالفين', screen: 'AdminUsers', icon: UserCog, color: '#3B82F6' },
  { id: 8, label: 'الشات والمحادثات', sub: 'متابعة سير محادثات الدعم والعملاء', screen: 'ChatList', icon: MessageSquare, color: '#06B6D4' },
  { id: 9, label: 'المركز الإعلامي والمحتوى', sub: 'فحص مقاطع الفيديو والريلز المرفوعة', screen: 'MediaApproval', icon: Film, color: '#E11D48' },
  { id: 10, label: 'سجل العمليات الإدارية', sub: 'متابعة أنشطة الموظفين والعمليات', screen: 'AuditLogs', icon: ShieldCheck, color: '#6366F1' },
  { id: 11, label: 'التقارير الإدارية ومؤشرات الأداء', sub: 'تقارير المبيعات والأداء التشغيلي', screen: 'Analytics', icon: BarChart2, color: '#1E40AF' },
  { id: 12, label: 'مجتمع المنصة والفيديوهات', sub: 'متابعة المحتوى والتفاعل المجتمعي', screen: 'WebCommunity', icon: Film, color: '#8B5CF6' },
  { id: 13, label: 'الأكاديمية والكورسات', sub: 'متابعة دورات وتدريبات الفنيين والمنصة', screen: 'Courses', icon: BookOpen, color: '#F59E0B' },
  { id: 14, label: 'مركز الذكاء الاصطناعي', sub: 'مساعد كتابة التقارير والردود الإدارية', screen: 'AIChat', icon: Bot, color: '#8B5CF6' },
  { id: 15, label: 'الإشعارات الإدارية', sub: 'تنبيهات النظام والتوجيهات الداخلية', screen: 'Notifications', icon: Bell, color: '#F97316' },
  { id: 16, label: 'الملف الشخصي للمدير', sub: 'بيانات الحساب وتفضيلات العمل', screen: 'Profile', icon: User, color: '#1E40AF' },
  { id: 17, label: 'الإعدادات التشغيلية', sub: 'ضبط مواعيد العمل وقنوات التواصل', screen: 'Settings', icon: Settings, color: '#64748B' },
];

// 💻 المبرمج (14 قسماً تقنياً)
export const PROGRAMMER_SECTIONS: RoleSectionItem[] = [
  { id: 1, label: 'لوحة القيادة التقنية', sub: 'مؤشرات الخوادم وسرعة الاستجابة والتشغيل', screen: 'Home', icon: LayoutDashboard, color: '#7C3AED' },
  { id: 2, label: 'مركز المطورين والمهام', sub: 'إدارة المهام البرمجية ولوحة الإنجاز', screen: 'DevHub', icon: Code, color: '#7C3AED' },
  { id: 3, label: 'تقارير الأخطاء والأعطال', sub: 'تتبع تفاصيل الأعطال وتحديث الحلول', screen: 'ErrorReports', icon: AlertTriangle, color: '#DC2626' },
  { id: 4, label: 'شات المطورين المشفر', sub: 'غرفة النقاش التقني المباشر', screen: 'DevChat', icon: MessageSquare, color: '#A855F7' },
  { id: 5, label: 'مكتبة ومستودع الأكواد', sub: 'مقتطفات الأكواد المشتركة والدوال', screen: 'CodeSnippets', icon: Terminal, color: '#3B82F6' },
  { id: 6, label: 'مجتمع المنصة والفيديوهات', sub: 'استعراض مجتمع المطورين والمنصة', screen: 'WebCommunity', icon: Film, color: '#8B5CF6' },
  { id: 7, label: 'الأكاديمية والكورسات البرمجية', sub: 'الكورسات التقنية والمهنية', screen: 'Courses', icon: BookOpen, color: '#F59E0B' },
  { id: 8, label: 'سجل العمليات والتدقيق', sub: 'سجل العمليات الإدارية والأنشطة والتغييرات', screen: 'AuditLogs', icon: ShieldCheck, color: '#6366F1' },
  { id: 9, label: 'مراقبة الخوادم والأنظمة', sub: 'حالة الذاكرة والمنافذ وقاعدة البيانات', screen: 'SystemOps', icon: Server, color: '#10B981' },
  { id: 10, label: 'استعراض المستخدمين (للمراجعة)', sub: 'فحص الحسابات لأغراض التدقيق والمراجعة', screen: 'AdminUsers', icon: UserCog, color: '#64748B' },
  { id: 11, label: 'مساعد الذكاء البرمجي (المساعد الذكي)', sub: 'توليد ومراجعة وتصحيح الأكواد', screen: 'AIChat', icon: Bot, color: '#8B5CF6' },
  { id: 12, label: 'مركز الإشعارات التقنية', sub: 'تنبيهات السيرفر والأعطال الطارئة', screen: 'Notifications', icon: Bell, color: '#F97316' },
  { id: 13, label: 'الملف الشخصي للمطور', sub: 'مستودعاتك ورتبتك وسجل مساهماتك', screen: 'Profile', icon: User, color: '#7C3AED' },
  { id: 14, label: 'إعدادات بيئة العمل', sub: 'ضبط خوادم العمل ومفاتيح الربط', screen: 'Settings', icon: Settings, color: '#64748B' },
];

// 🎧 خدمة العملاء (12 قسماً)
export const SUPPORT_SECTIONS: RoleSectionItem[] = [
  { id: 1, label: 'لوحة تحكم خدمة العملاء', sub: 'معدلات الاستجابة والتذاكر المفتوحة', screen: 'Home', icon: LayoutDashboard, color: '#0D9488' },
  { id: 2, label: 'تذاكر الدعم والشكاوى', sub: 'الرد السريع وتحديث حالات الشكاوى', screen: 'Tickets', icon: Headphones, color: '#EF4444' },
  { id: 3, label: 'المحادثات الفورية (Live Chat)', sub: 'الدردشة المباشرة مع العملاء والفنيين', screen: 'ChatList', icon: MessageSquare, color: '#06B6D4' },
  { id: 4, label: 'استعراض الطلبات والشحنات', sub: 'تتبع حالة طلبات العملاء لمساعدتهم', screen: 'Orders', icon: Package, color: '#10B981' },
  { id: 5, label: 'قائمة الفنيين المتاحين', sub: 'البحث عن فني وتوجيه طلب العميل له', screen: 'TechniciansTeam', icon: Wrench, color: '#F59E0B' },
  { id: 6, label: 'رفع تقرير خطأ تقني للمبرمجين', sub: 'إرسال مشكلة برمجية واجهت عميلاً للمطورين', screen: 'ErrorReports', icon: AlertTriangle, color: '#DC2626' },
  { id: 7, label: 'مجتمع المنصة والفيديوهات', sub: 'متابعة التفاعل المجتمعي للعملاء', screen: 'WebCommunity', icon: Film, color: '#8B5CF6' },
  { id: 8, label: 'الأكاديمية والكورسات التدريبية', sub: 'دورات خدمة العملاء وتطوير المهارات', screen: 'Courses', icon: BookOpen, color: '#F59E0B' },
  { id: 9, label: 'مساعد الردود بالذكاء', sub: 'اقتراح ردود نموذجية مهذبة للعملاء', screen: 'AIChat', icon: Bot, color: '#8B5CF6' },
  { id: 10, label: 'مركز الإشعارات والتنبيهات', sub: 'إشعارات التذاكر الجديدة والرسائل', screen: 'Notifications', icon: Bell, color: '#F97316' },
  { id: 11, label: 'الملف الشخصي لموظف الدعم', sub: 'ساعات العمل ومؤشر رضا العملاء', screen: 'Profile', icon: User, color: '#0D9488' },
  { id: 12, label: 'الإعدادات الشخصية', sub: 'تخصيص الردود المحفوظة والتنبيهات', screen: 'Settings', icon: Settings, color: '#64748B' },
];

// 🔧 الفني (11 قسماً مهنية)
export const TECHNICIAN_SECTIONS: RoleSectionItem[] = [
  { id: 1, label: 'لوحة تحكم الفني', sub: 'الأرباح وطلبات الصيانة والتقييمات', screen: 'Home', icon: LayoutDashboard, color: '#EA580C' },
  { id: 2, label: 'طلبات الصيانة الواردة', sub: 'استقبال والرد على طلبات الأعطال القريبة', screen: 'Orders', icon: Wrench, color: '#EA580C' },
  { id: 3, label: 'سوق قطع الغيار والأدوات', sub: 'شراء قطع الغيار الأصلية بأفضل أسعار', screen: 'Marketplace', icon: ShoppingBag, color: '#F59E0B' },
  { id: 4, label: 'محفظتي وأرباح الصيانة', sub: 'سحب الأرباح إلى فودافون كاش وإنستاباي', screen: 'Wallet', icon: Wallet, color: '#10B981' },
  { id: 5, label: 'محادثات العملاء المباشرة', sub: 'التواصل الفوري مع أصحاب الأجهزة', screen: 'ChatList', icon: MessageSquare, color: '#06B6D4' },
  { id: 6, label: 'مجتمع الفنيين والفيديوهات', sub: 'شروحات الصيانة وتبادل الخبرات المهنية', screen: 'WebCommunity', icon: Film, color: '#E11D48' },
  { id: 7, label: 'أكاديمية وكورسات الصيانة', sub: 'دورات صيانة معتمدة ونشر دورات جديدة', screen: 'Courses', icon: BookOpen, color: '#F59E0B' },
  { id: 8, label: 'تشخيص الأعطال بالذكاء', sub: 'مساعد فوري لتحديد أعطال الأجهزة بدقة', screen: 'AIChat', icon: Bot, color: '#8B5CF6' },
  { id: 9, label: 'تذاكر الدعم والمساعدة', sub: 'التواصل مع إدارة المنصة للمساعدة', screen: 'Tickets', icon: Headphones, color: '#EF4444' },
  { id: 10, label: 'إشعارات التكليفات والطلبات', sub: 'تنبيهات فورية عند وصول طلب صيانة جديد', screen: 'Notifications', icon: Bell, color: '#F97316' },
  { id: 11, label: 'الملف الشخصي ومعرض الأعمال', sub: 'عرض شهاداتك وتقييمات العملاء وتخصصك', screen: 'Profile', icon: User, color: '#EA580C' },
];

// 🏪 التاجر (13 قسماً تجارياً)
export const MERCHANT_SECTIONS: RoleSectionItem[] = [
  { id: 1, label: 'لوحة تحكم التاجر', sub: 'إجمالي المبيعات والطلبات والأرباح', screen: 'Home', icon: LayoutDashboard, color: '#15803D' },
  { id: 2, label: 'إدارة منتجاتي ومعروضاتي', sub: 'تعديل الأسعار والكميات وتنشيط المنتجات', screen: 'MyProducts', icon: Package, color: '#15803D' },
  { id: 3, label: 'إضافة منتج جديد بالسوق', sub: 'رفع قطع غيار جديدة بالصور والمواصفات', screen: 'AddProduct', icon: Plus, color: '#10B981' },
  { id: 4, label: 'طلبات الشحن والتجهيز', sub: 'تأكيد تجهيز البضائع وتتبع الشحنات', screen: 'Orders', icon: Truck, color: '#3B82F6' },
  { id: 5, label: 'محفظة الأرباح وسحب الرصيد', sub: 'سحب مبالغ المبيعات لحسابك البنكي', screen: 'Wallet', icon: Wallet, color: '#10B981' },
  { id: 6, label: 'تصفح السوق العام', sub: 'استعراض أسعار السوق والمنافسين', screen: 'Marketplace', icon: ShoppingBag, color: '#F59E0B' },
  { id: 7, label: 'إدارة المخازن والمستودعات', sub: 'جرد البضائع وتوزيعها على الفروع', screen: 'Warehouses', icon: Building2, color: '#8B5CF6' },
  { id: 8, label: 'محادثات المشترين والزبائن', sub: 'الرد على استفسارات المشترين والفنيين', screen: 'ChatList', icon: MessageSquare, color: '#06B6D4' },
  { id: 9, label: 'مجتمع المنصة والفيديوهات', sub: 'استعراض الفيديوهات وريلز المنتجات', screen: 'WebCommunity', icon: Film, color: '#8B5CF6' },
  { id: 10, label: 'أكاديمية التجارة والكورسات', sub: 'دورات التجارة وإدارة المبيعات', screen: 'Courses', icon: BookOpen, color: '#F59E0B' },
  { id: 11, label: 'كتابة وصف المنتجات بالذكاء', sub: 'توليد عناوين وأوصاف تسويقية احترافية', screen: 'AIChat', icon: Bot, color: '#8B5CF6' },
  { id: 12, label: 'إشعارات المبيعات والطلبات', sub: 'تنبيه فوري عند بيع أي قطعة من متجرك', screen: 'Notifications', icon: Bell, color: '#F97316' },
  { id: 13, label: 'الملف الشخصي للمتجر', sub: 'صفحة متجرك وساعات العمل وسياسة الإرجاع', screen: 'Profile', icon: User, color: '#15803D' },
];

// 👤 العميل (12 قسماً للخدمات والتسوق)
export const CUSTOMER_SECTIONS: RoleSectionItem[] = [
  { id: 1, label: 'الصفحة الرئيسية واستكشاف المنصة', sub: 'أفضل الفنيين والعروض وخدمات الصيانة', screen: 'Home', icon: LayoutDashboard, color: '#06B6D4' },
  { id: 2, label: 'تصفح السوق وقطع الغيار', sub: 'شراء قطع غيار أصلية بضمان موثوق', screen: 'Marketplace', icon: ShoppingBag, color: '#F59E0B' },
  { id: 3, label: 'طلب فني صيانة معتمد', sub: 'اختيار فني حسب التقييم والتخصص والموقع', screen: 'TechniciansTeam', icon: Wrench, color: '#EA580C' },
  { id: 4, label: 'سلة المشتريات', sub: 'مراجعة المنتجات وإتمام عملية الشراء', screen: 'Cart', icon: ShoppingBag, color: '#10B981' },
  { id: 5, label: 'طلباتي ومشترياتي السابقة', sub: 'تتبع مسار الفني ومراحل توصيل الشحنة', screen: 'Orders', icon: Package, color: '#3B82F6' },
  { id: 6, label: 'محادثاتي مع الفنيين والدعم', sub: 'محادثاتك مع الفنيين ومسؤولي الخدمة', screen: 'ChatList', icon: MessageSquare, color: '#06B6D4' },
  { id: 7, label: 'المحفظة وطرق الدفع', sub: 'إدارة بطاقات الدفع وشحن الرصيد', screen: 'Wallet', icon: Wallet, color: colors.primary },
  { id: 8, label: 'مجتمع TecnoRexa والفيديوهات', sub: 'منشورات وريلز وتجارب صيانة الأجهزة', screen: 'WebCommunity', icon: Film, color: '#8B5CF6' },
  { id: 9, label: 'الأكاديمية والكورسات التعليمية', sub: 'تعلم أساسيات صيانة الأجهزة المنزلية', screen: 'Courses', icon: BookOpen, color: '#F59E0B' },
  { id: 10, label: 'مساعد تشخيص الأعطال الذكي', sub: 'اكتشف سبب عطل جهازك بالذكاء الاصطناعي', screen: 'AIChat', icon: Bot, color: '#8B5CF6' },
  { id: 11, label: 'الدعم الفني وفتح شكوى', sub: 'فريق TecnoRexa جاهز لحل أي مشكلة', screen: 'Tickets', icon: Headphones, color: '#EF4444' },
  { id: 12, label: 'الملف الشخصي والإعدادات', sub: 'بيانات حسابك وعناوينك المفضلة', screen: 'Profile', icon: User, color: '#06B6D4' },
];

export interface RoleDrawerConfig {
  title: string;
  subtitle: string;
  badge: string;
  color: string;
  icon: any;
  sections: RoleSectionItem[];
}

export const getRoleDrawerConfig = (role: string): RoleDrawerConfig => {
  const r = normalizeRole(role);
  switch (r) {
    case 'owner':
      return {
        title: 'غرفة عمليات المالك',
        subtitle: 'الأقسام الـ 19 مرتبة بدقة من الأهم للأقل أهمية',
        badge: 'مالك المنصة 👑',
        color: colors.primary,
        icon: Crown,
        sections: OWNER_SECTIONS,
      };
    case 'manager':
      return {
        title: 'غرفة عمليات المدير',
        subtitle: 'الأقسام الإدارية والتشغيلية المعتمدة (16 قسماً)',
        badge: 'المدير العام 👔',
        color: '#1E40AF',
        icon: Briefcase,
        sections: MANAGER_SECTIONS,
      };
    case 'programmer':
    case 'lead_developer':
      return {
        title: 'مركز تحكم المطورين',
        subtitle: 'أدوات التطوير ومراقبة الأداء والمهام (12 قسماً)',
        badge: 'مهندس برمجيات 💻',
        color: '#7C3AED',
        icon: Code,
        sections: PROGRAMMER_SECTIONS,
      };
    case 'customer_support':
    case 'support':
      return {
        title: 'مركز خدمة العملاء',
        subtitle: 'إدارة التذاكر والشكاوى والردود الفورية (10 أقسام)',
        badge: 'خدمة العملاء 🎧',
        color: '#0D9488',
        icon: Headphones,
        sections: SUPPORT_SECTIONS,
      };
    case 'technician':
      return {
        title: 'حقيبة الفني والعمليات',
        subtitle: 'طلبات الصيانة والكورسات والمحفظة (10 أقسام)',
        badge: 'فني معتمد 🔧',
        color: '#EA580C',
        icon: Wrench,
        sections: TECHNICIAN_SECTIONS,
      };
    case 'merchant':
      return {
        title: 'بوابة التاجر والمتجر',
        subtitle: 'إدارة المنتجات والشحن ومبيعات السوق (11 قسماً)',
        badge: 'متجر معتمد 🏪',
        color: '#15803D',
        icon: Store,
        sections: MERCHANT_SECTIONS,
      };
    case 'customer':
    default:
      return {
        title: 'خدمات العميل والسوق',
        subtitle: 'التسوق وحجز الفنيين وتتبع الطلبات (10 أقسام)',
        badge: 'عميل المنصة 👤',
        color: '#06B6D4',
        icon: User,
        sections: CUSTOMER_SECTIONS,
      };
  }
};

interface RoleSideDrawerProps {
  visible: boolean;
  onClose: () => void;
  navigation: any;
  currentScreen?: string;
  role?: string;
}

export default function RoleSideDrawer({
  visible,
  onClose,
  navigation,
  currentScreen = 'Home',
  role: propRole,
}: RoleSideDrawerProps) {
  const { user } = useAuthStore();
  const effectiveRole = propRole || user?.role || 'customer';
  const config = getRoleDrawerConfig(effectiveRole);

  const [search, setSearch] = useState('');

  const drawerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dx < -25 && Math.abs(gestureState.dy) < 40;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -30) {
          onClose();
        }
      },
    })
  ).current;

  const filteredSections = config.sections.filter(
    (sec) =>
      sec.label.toLowerCase().includes(search.toLowerCase()) ||
      sec.sub.toLowerCase().includes(search.toLowerCase()) ||
      sec.id.toString().includes(search)
  );

  const handleSelect = (sec: RoleSectionItem) => {
    onClose();
    if (sec.screen === 'Home') {
      try {
        navigation.navigate('Main', { screen: 'Home' });
      } catch {
        navigation.navigate('Home');
      }
    } else {
      try {
        navigation.navigate(sec.screen);
      } catch {
        navigation.navigate('Main', { screen: sec.screen });
      }
    }
  };

  const HeaderIcon = config.icon;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.75)' }}>
        {/* Clickable backdrop */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Drawer Panel */}
        <View
          {...drawerPanResponder.panHandlers}
          style={{
            width: Platform.OS === 'web' ? 360 : 310,
            backgroundColor: '#0E0E0E',
            borderLeftWidth: 2,
            borderLeftColor: config.color,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Drawer Header */}
          <View
            style={{
              padding: spacing.lg,
              paddingTop: Platform.OS === 'ios' ? 50 : spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: '#141414',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.darkCard,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: config.color + '44',
                }}
              >
                <X size={20} color={config.color} />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: config.color, fontWeight: '900', fontSize: 16 }}>{config.title}</Text>
                <HeaderIcon size={22} color={config.color} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View
                style={{
                  backgroundColor: config.color + '22',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: borderRadius.sm,
                  borderWidth: 1,
                  borderColor: config.color + '55',
                }}
              >
                <Text style={{ color: config.color, fontSize: 11, fontWeight: '800' }}>
                  {config.badge}
                </Text>
              </View>
              <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right', flex: 1, marginRight: 8 }} numberOfLines={1}>
                {config.subtitle}
              </Text>
            </View>

            {/* Quick Search */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#0A0A0A',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: config.color + '33',
                paddingHorizontal: spacing.sm,
                marginTop: spacing.md,
              }}
            >
              <TextInput
                style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, color: colors.white, textAlign: 'right', fontSize: 12 }}
                placeholder="ابحث عن قسم..."
                placeholderTextColor={colors.gray}
                value={search}
                onChangeText={setSearch}
              />
              <Search size={16} color={colors.gray} />
            </View>
          </View>

          {/* Sections List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.sm, paddingBottom: 60 }}
            showsVerticalScrollIndicator={true}
          >
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = currentScreen === sec.screen;

              return (
                <TouchableOpacity
                  key={sec.id}
                  onPress={() => handleSelect(sec)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: spacing.sm,
                    marginBottom: 4,
                    borderRadius: borderRadius.md,
                    backgroundColor: isActive ? config.color + '22' : 'transparent',
                    borderWidth: 1,
                    borderColor: isActive ? config.color : 'transparent',
                  }}
                >
                  <ChevronLeft size={16} color={isActive ? config.color : colors.gray} />
                  
                  <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text
                        style={{
                          color: isActive ? config.color : colors.white,
                          fontWeight: isActive ? '900' : '700',
                          fontSize: 13,
                          textAlign: 'right',
                        }}
                      >
                        {sec.label}
                      </Text>
                      <View
                        style={{
                          backgroundColor: isActive ? config.color : '#222',
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                          borderRadius: 4,
                        }}
                      >
                        <Text style={{ color: isActive ? colors.dark : colors.gray, fontSize: 10, fontWeight: '900' }}>
                          #{sec.id}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right', marginTop: 2 }} numberOfLines={1}>
                      {sec.sub}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: borderRadius.md,
                      backgroundColor: sec.color + '22',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: sec.color + '44',
                    }}
                  >
                    <Icon size={18} color={sec.color} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Drawer Footer */}
          <View
            style={{
              padding: spacing.md,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: '#141414',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>بيانات حية 100%</Text>
            </View>
            <Logo size={14} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
