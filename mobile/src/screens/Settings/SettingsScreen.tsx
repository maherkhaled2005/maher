import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  CreditCard,
  Percent,
  Sliders,
  Shield,
  FileText,
  LogOut,
  Save,
  AlertOctagon,
  HelpCircle,
  Lock,
  Bell,
  ChevronLeft,
  User,
  Globe,
  Moon,
  MapPin,
  Trash2,
  Store,
  Wrench,
  Code2,
  Headphones,
  Briefcase,
  Package,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

type SettingsTab = 'payment' | 'commissions' | 'general' | 'security' | 'terms';

const SettingsScreen = ({ navigation }: any) => {
  const { user, logout } = useAuthStore();
  const isOwner = user?.role === 'owner';
  const [activeTab, setActiveTab] = useState<SettingsTab>('payment');
  const [loading, setLoading] = useState(isOwner);
  const [saving, setSaving] = useState(false);

  // User preferences for non-owners
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [chatAlerts, setChatAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Form State
  const [settings, setSettings] = useState<Record<string, any>>({
    // Payment Gateways
    stripe_enabled: true,
    stripe_mode: 'test',
    stripe_publishable_key: '',
    paymob_enabled: true,
    paymob_api_key: '',
    paymob_integration_id: '412093',
    fawry_enabled: true,
    fawry_merchant_code: '',
    fawry_security_key: '',
    vodafone_cash_enabled: true,
    vodafone_cash_number: '01012345678',
    cod_enabled: true,

    // Commissions & Limits
    maintenance_commission: '15',
    marketplace_commission: '10',
    courses_commission: '20',
    min_wallet_deposit: '50',
    min_withdrawal_limit: '200',

    // General Settings
    platform_name: 'TecnoRexa',
    support_email: 'support@tecnorexa.com',
    support_phone: '+201064739664',
    maintenance_mode: false,
    allow_registrations: true,
    marketplace_enabled: true,

    // Security
    enforce_2fa_admins: true,
    session_timeout_hours: '24',
    max_login_attempts: '5',

    // Terms
    terms_text: 'الشروط والأحكام الخاصة بمنصة TecnoRexa:\n1. الالتزام بجودة خدمات الصيانة وضمان قطع الغيار.\n2. يُحظر التعامل المالي خارج المنصة لضمان حقوق كافة الأطراف.\n3. تطبق رسوم العمولة المعتمدة على كافة العمليات الناجحة.',
  });

  const fetchSettings = async () => {
    try {
      const res = await api.get('/owner/system/settings');
      if (res.data) {
        setSettings(prev => ({
          ...prev,
          ...res.data,
          stripe_enabled: res.data.stripe_enabled !== 'false' && res.data.stripe_enabled !== false,
          paymob_enabled: res.data.paymob_enabled !== 'false' && res.data.paymob_enabled !== false,
          fawry_enabled: res.data.fawry_enabled !== 'false' && res.data.fawry_enabled !== false,
          vodafone_cash_enabled: res.data.vodafone_cash_enabled !== 'false' && res.data.vodafone_cash_enabled !== false,
          cod_enabled: res.data.cod_enabled !== 'false' && res.data.cod_enabled !== false,
          maintenance_mode: res.data.maintenance_mode === 'true' || res.data.maintenance_mode === true,
          allow_registrations: res.data.allow_registrations !== 'false' && res.data.allow_registrations !== false,
          marketplace_enabled: res.data.marketplace_enabled !== 'false' && res.data.marketplace_enabled !== false,
          enforce_2fa_admins: res.data.enforce_2fa_admins !== 'false' && res.data.enforce_2fa_admins !== false,
        }));
      }
    } catch (e) {
      console.error('Error loading settings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchSettings();
    } else {
      setLoading(false);
    }
  }, [isOwner]);

  const updateField = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleMaintenance = async (val: boolean) => {
    updateField('maintenance_mode', val);
    try {
      const res = await api.post('/owner/system/maintenance', { enabled: val });
      if (res.data?.success) {
        const msg = val
          ? 'تم تفعيل وضع الصيانة العام ⚠️ لن يتمكن المستخدمون العاديون من الوصول للمنصة'
          : 'تم إلغاء وضع الصيانة واستئناف تشغيل التطبيق بنجاح ✅';
        Alert.alert('وضع الصيانة', msg);
      }
    } catch {
      Alert.alert('خطأ', 'تعذر تغيير وضع الصيانة');
      updateField('maintenance_mode', !val);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const payload: Record<string, string> = {};
      Object.keys(settings).forEach(k => {
        payload[k] = String(settings[k]);
      });

      const res = await api.put('/owner/system/settings', payload);
      if (res.data?.success) {
        Alert.alert('نجاح', 'تم حفظ جميع إعدادات النظام بنجاح 💾');
      }
    } catch (e: any) {
      Alert.alert('خطأ', e.response?.data?.error || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('هل أنت متأكد أنك تريد تسجيل الخروج؟')) {
        logout();
      }
    } else {
      Alert.alert(
        'تأكيد تسجيل الخروج',
        'هل أنت متأكد أنك تريد تسجيل الخروج؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل الخروج', style: 'destructive', onPress: () => logout() },
        ],
        { cancelable: true }
      );
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'حذف الحساب نهائياً ⚠️',
      'هل أنت متأكد من رغبتك في حذف حسابك نهائياً من منصة TecnoRexa؟ سيتم إزالة جميع بياناتك الشخصية ولا يمكن التراجع عن هذه الخطوة.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'نعم، حذف الحساب',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/auth/delete-account').catch(() => {});
            } catch {}
            logout();
          },
        },
      ]
    );
  };

  if (!isOwner) {
    return (
      <View style={[styles.container, { height: Platform.OS === 'web' ? ('100vh' as any) : '100%' }]}>
        <OwnerHeader
          title="الإعدادات والتفضيلات"
          navigation={navigation}
          showBack={true}
        />
        <ScrollView style={[styles.scrollArea, Platform.OS === 'web' && { overflowY: 'auto' } as any]} contentContainerStyle={[styles.scrollContent, { paddingBottom: 150 }]}>
          {/* User Profile Card */}
          <View style={[styles.card, { borderColor: colors.primary + '55', marginBottom: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '22', borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <User size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold' }}>{user?.name || 'مستخدم TecnoRexa'}</Text>
                <Text style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}>{user?.phone || ''}</Text>
              </View>
              <View style={{ backgroundColor: colors.primary + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: colors.primary + '55' }}>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold' }}>
                  {user?.role === 'manager' ? 'مدير عام 👔' :
                   user?.role === 'programmer' ? 'مهندس برمجيات 💻' :
                   user?.role === 'customer_support' ? 'خدمة عملاء 🎧' :
                   user?.role === 'technician' ? 'فني معتمد 🔧' :
                   user?.role === 'merchant' ? 'متجر معتمد 🏪' : 'عميل معتمد 👤'}
                </Text>
              </View>
            </View>
          </View>

          {/* Role-Specific Operational Settings */}
          {user?.role === 'technician' && (
            <View style={[styles.card, { borderColor: '#F59E0B55', marginBottom: spacing.md }]}>
              <View style={styles.sectionHeader}>
                <Wrench size={18} color="#F59E0B" />
                <Text style={styles.sectionTitle}>إعدادات الفني وطلبات الصيانة المنزلية</Text>
              </View>
              <View style={styles.toggleRow}>
                <Switch
                  value={user?.isAvailable !== false}
                  onValueChange={async (val) => {
                    try {
                      await api.post('/technician/availability', { isAvailable: val }).catch(() => {});
                    } catch {}
                  }}
                  trackColor={{ false: '#333', true: '#10B981' }}
                  thumbColor={colors.white}
                />
                <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                  <Text style={styles.toggleLabel}>حالة استقبال الطلبات (متاح للعمل)</Text>
                  <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>
                    تفعيل استقبال إشعارات طلبات الصيانة القريبة منك في محافظتك
                  </Text>
                </View>
              </View>
              <View style={[styles.divider, { marginVertical: 10 }]} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.toggleLabel}>التخصصات المعتمدة (أجهزة منزلية حصراً):</Text>
                <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700', marginTop: 4 }}>
                  {user?.specialties || 'ثلاجات، غسالات، بوتاجازات، تكييفات، سخانات، ميكروويف'}
                </Text>
                <Text style={{ color: colors.gray, fontSize: 10, marginTop: 2 }}>
                  * نطاق صيانة الأجهزة المنزلية حصراً وفق ميثاق TecnoRexa المعتمد
                </Text>
              </View>
            </View>
          )}

          {user?.role === 'merchant' && (
            <View style={[styles.card, { borderColor: '#10B98155', marginBottom: spacing.md }]}>
              <View style={styles.sectionHeader}>
                <Store size={18} color="#10B981" />
                <Text style={styles.sectionTitle}>إعدادات المتجر والتوريد</Text>
              </View>
              <View style={{ alignItems: 'flex-end', marginBottom: 8 }}>
                <Text style={styles.toggleLabel}>اسم المتجر المعتمد:</Text>
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', marginTop: 2 }}>
                  {user?.storeName || user?.name || 'متجر قطع الغيار المعتمد'}
                </Text>
              </View>
              <View style={[styles.divider, { marginVertical: 8 }]} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.toggleLabel}>سياسة الاستبدال والضمان:</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>
                  ضمان أصالة قطع الغيار وسياسة استرجاع واستبدال خلال 14 يوماً للعيوب المصنعية
                </Text>
              </View>
            </View>
          )}

          {user?.role === 'programmer' && (
            <View style={[styles.card, { borderColor: '#3B82F655', marginBottom: spacing.md }]}>
              <View style={styles.sectionHeader}>
                <Code2 size={18} color="#3B82F6" />
                <Text style={styles.sectionTitle}>تفضيلات بيئة التطوير والأنظمة</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.toggleLabel}>الرتبة البرمجية الحالية:</Text>
                <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                  {user?.developerRank === 'lead' ? 'المبرمج الرئيسي (Lead Architect) 👑' : 'مهندس برمجيات وتطوير (Software Engineer) 💻'}
                </Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 4 }}>
                  ربط تلقائي مع سجلات تدقيق النظام وخادم العمليات وتذاكر الاقتراحات المعتمدة
                </Text>
              </View>
            </View>
          )}

          {user?.role === 'customer_support' && (
            <View style={[styles.card, { borderColor: '#0D948855', marginBottom: spacing.md }]}>
              <View style={styles.sectionHeader}>
                <Headphones size={18} color="#0D9488" />
                <Text style={styles.sectionTitle}>إعدادات ممثل خدمة العملاء</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.toggleLabel}>حالة المناوبة التشغيلية:</Text>
                <Text style={{ color: '#0D9488', fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                  متصل ومتاح للرد على التذاكر واستفسارات المستخدمين 🎧
                </Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 4 }}>
                  إشعارات فورية لكل تذكرة جديدة واستفسار وارد من العملاء أو الفنيين
                </Text>
              </View>
            </View>
          )}

          {user?.role === 'manager' && (
            <View style={[styles.card, { borderColor: '#8B5CF655', marginBottom: spacing.md }]}>
              <View style={styles.sectionHeader}>
                <Briefcase size={18} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>تفضيلات المدير العام والعمليات</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.toggleLabel}>صلاحيات الإشراف والاعتماد:</Text>
                <Text style={{ color: '#8B5CF6', fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                  مراجعة طلبات الانضمام للفنيين والتجار والرقابة التشغيلية اليومية 👔
                </Text>
              </View>
            </View>
          )}

          {/* Section: Appearance & Language */}
          <View style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={styles.sectionHeader}>
              <Globe size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>المظهر ولغة التطبيق</Text>
            </View>

            {/* Language Selector */}
            <View style={styles.toggleRow}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setLanguage('en')}
                  style={[
                    styles.modeBadge,
                    language === 'en' && styles.modeBadgeActive,
                  ]}
                >
                  <Text style={[styles.modeBadgeText, language === 'en' && { color: colors.primary, fontWeight: 'bold' }]}>
                    English
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setLanguage('ar')}
                  style={[
                    styles.modeBadge,
                    language === 'ar' && styles.modeBadgeActive,
                  ]}
                >
                  <Text style={[styles.modeBadgeText, language === 'ar' && { color: colors.primary, fontWeight: 'bold' }]}>
                    العربية (افتراضي)
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                <Text style={styles.toggleLabel}>لغة الواجهة</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>اختر لغة عرض التطبيق</Text>
              </View>
            </View>

            <View style={[styles.divider, { marginVertical: 12 }]} />

            {/* Dark Mode */}
            <View style={styles.toggleRow}>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#333', true: colors.primary }}
                thumbColor={colors.white}
              />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                <Text style={styles.toggleLabel}>الوضع الليلي الفخم (Black & Gold)</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>تصميم داكن فخم مريح للعينين وموفر للطاقة</Text>
              </View>
            </View>
          </View>

          {/* Section: Addresses */}
          <View style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={styles.sectionHeader}>
              <MapPin size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>العناوين المسجلة</Text>
            </View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <ChevronLeft size={18} color={colors.gray} />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                <Text style={styles.toggleLabel}>إدارة العناوين والموقع الجغرافي</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>
                  {user?.governorate ? `${user.governorate} - ${user.city || ''}` : 'تحديد عنوان الزيارة ومقر الاستلام'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Section: Notifications */}
          <View style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={styles.sectionHeader}>
              <Bell size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>تنبيهات وإشعارات التطبيق</Text>
            </View>
            <View style={styles.toggleRow}>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#333', true: colors.primary }}
                thumbColor={colors.white}
              />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                <Text style={styles.toggleLabel}>إشعارات الدفع الفورية (Push)</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>تنبيهات فورية عند وصول طلبات أو رسائل جديدة</Text>
              </View>
            </View>
            <View style={[styles.divider, { marginVertical: 12 }]} />
            <View style={styles.toggleRow}>
              <Switch
                value={chatAlerts}
                onValueChange={setChatAlerts}
                trackColor={{ false: '#333', true: colors.primary }}
                thumbColor={colors.white}
              />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                <Text style={styles.toggleLabel}>أصوات تنبيه الشات</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>إصدار نغمة تنبيه عند استلام رسالة مباشرة</Text>
              </View>
            </View>
            <View style={[styles.divider, { marginVertical: 12 }]} />
            <View style={styles.toggleRow}>
              <Switch
                value={smsAlerts}
                onValueChange={setSmsAlerts}
                trackColor={{ false: '#333', true: colors.primary }}
                thumbColor={colors.white}
              />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                <Text style={styles.toggleLabel}>رسائل SMS التأكيدية</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>تأكيد التحويلات والعمليات الهامة عبر الهاتف</Text>
              </View>
            </View>
          </View>

          {/* Section: Security */}
          <View style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={styles.sectionHeader}>
              <Shield size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>الأمان والحماية</Text>
            </View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}
              onPress={() => navigation.navigate('ChangePassword')}
            >
              <ChevronLeft size={18} color={colors.gray} />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                <Text style={styles.toggleLabel}>تغيير كلمة المرور</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>تحديث كلمة المرور لتعزيز حماية حسابك</Text>
              </View>
              <Lock size={18} color={colors.primary} />
            </TouchableOpacity>
            <View style={[styles.divider, { marginVertical: 12 }]} />
            <View style={styles.toggleRow}>
              <Switch
                value={twoFactorEnabled}
                onValueChange={setTwoFactorEnabled}
                trackColor={{ false: '#333', true: colors.primary }}
                thumbColor={colors.white}
              />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                <Text style={styles.toggleLabel}>التحقق الثنائي برمز OTP</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>طلب رمز تأكيد SMS عند كل تسجيل دخول جديد</Text>
              </View>
            </View>
          </View>

          {/* Section: Support & Platform Info */}
          <View style={[styles.card, { marginBottom: spacing.lg }]}>
            <View style={styles.sectionHeader}>
              <HelpCircle size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>المساعدة والميثاق المهني</Text>
            </View>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}
              onPress={() => navigation.navigate('Tickets')}
            >
              <ChevronLeft size={18} color={colors.gray} />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 10 }}>
                <Text style={styles.toggleLabel}>مركز الدعم الفني والشكاوى</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>فتح تذكرة مباشرة مع فريق الدعم والمساعدة</Text>
              </View>
            </TouchableOpacity>
            <View style={[styles.divider, { marginVertical: 12 }]} />
            <View style={{ paddingVertical: 6, alignItems: 'flex-end' }}>
              <Text style={styles.toggleLabel}>إصدار التطبيق المعتمد</Text>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>TecnoRexa v2.0 (Mobile Edition)</Text>
            </View>
          </View>

          {/* Section: Legal & Policies */}
          <View style={[styles.card, { marginBottom: spacing.md }]}>
            <View style={styles.sectionHeader}>
              <Shield size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>السياسات واللوائح القانونية</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleRow, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 }]}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <ChevronLeft size={18} color={colors.primary} />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 8 }}>
                <Text style={styles.toggleLabel}>سياسة الخصوصية وحماية البيانات</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>قانون حماية البيانات 151 لسنة 2020 وGDPR</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleRow, { paddingTop: 10 }]}
              onPress={() => navigation.navigate('Terms')}
            >
              <ChevronLeft size={18} color={colors.primary} />
              <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 8 }}>
                <Text style={styles.toggleLabel}>شروط الخدمة والضمان المعتمد</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>شهادة ضمان 30 يوماً وسياسة مهلة الـ 10 دقائق</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity style={[styles.logoutBtn, { marginBottom: spacing.sm }]} onPress={handleLogout}>
            <LogOut size={16} color="#EF4444" />
            <Text style={styles.logoutBtnText}>تسجيل الخروج من الحساب</Text>
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            style={[
              styles.logoutBtn,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.25)',
                marginBottom: spacing.xl,
              },
            ]}
            onPress={handleDeleteAccount}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={[styles.logoutBtnText, { color: '#EF4444' }]}>
              حذف الحساب نهائياً (Delete Account)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height: Platform.OS === 'web' ? ('100vh' as any) : '100%' }]}>
      <OwnerHeader
        title="الإعدادات العامة للنظام"
        sectionNumber={18}
        navigation={navigation}
        showBack={true}
        currentScreen="Settings"
        rightAction={
          <TouchableOpacity
            style={styles.saveHeaderBtn}
            onPress={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.dark} />
            ) : (
              <>
                <Save size={15} color={colors.dark} />
                <Text style={styles.saveHeaderBtnText}>حفظ</Text>
              </>
            )}
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'payment' && styles.activeTabBtn]}
          onPress={() => setActiveTab('payment')}
        >
          <CreditCard size={14} color={activeTab === 'payment' ? colors.primary : colors.gray} />
          <Text style={[styles.tabText, activeTab === 'payment' && styles.activeTabText]}>
            بوابات الدفع
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'commissions' && styles.activeTabBtn]}
          onPress={() => setActiveTab('commissions')}
        >
          <Percent size={14} color={activeTab === 'commissions' ? colors.primary : colors.gray} />
          <Text style={[styles.tabText, activeTab === 'commissions' && styles.activeTabText]}>
            العمولات
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'general' && styles.activeTabBtn]}
          onPress={() => setActiveTab('general')}
        >
          <Sliders size={14} color={activeTab === 'general' ? colors.primary : colors.gray} />
          <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>
            العامة
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'security' && styles.activeTabBtn]}
          onPress={() => setActiveTab('security')}
        >
          <Shield size={14} color={activeTab === 'security' ? colors.primary : colors.gray} />
          <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
            الأمان
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'terms' && styles.activeTabBtn]}
          onPress={() => setActiveTab('terms')}
        >
          <FileText size={14} color={activeTab === 'terms' ? colors.primary : colors.gray} />
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            الشروط
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>جاري تحميل إعدادات النظام...</Text>
        </View>
      ) : (
        <ScrollView
          style={[styles.scrollArea, Platform.OS === 'web' && { overflowY: 'auto' } as any]}
          contentContainerStyle={styles.scrollContent}
        >
          {/* TAB 1: Payment Gateways */}
          {activeTab === 'payment' && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>💳 تكامل بوابات الدفع الإلكتروني</Text>
              <Text style={styles.sectionSubtitle}>
                تحكم في تفعيل بوابات الدفع ومفاتيح الربط للبيئة الحية والاختبارية.
              </Text>

              {/* Stripe */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Stripe (فيزا / ماستركارد الدولية)</Text>
                  <Switch
                    value={settings.stripe_enabled}
                    onValueChange={v => updateField('stripe_enabled', v)}
                    trackColor={{ false: '#333', true: colors.primary }}
                  />
                </View>

                {settings.stripe_enabled && (
                  <View style={styles.inputsGroup}>
                    <View style={styles.modeRow}>
                      <Text style={styles.inputLabel}>وضع البيئة:</Text>
                      <View style={styles.modeToggle}>
                        <TouchableOpacity
                          style={[
                            styles.modeBadge,
                            settings.stripe_mode === 'test' && styles.modeBadgeActive,
                          ]}
                          onPress={() => updateField('stripe_mode', 'test')}
                        >
                          <Text style={styles.modeBadgeText}>اختبار (Test)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.modeBadge,
                            settings.stripe_mode === 'live' && styles.modeBadgeActive,
                          ]}
                          onPress={() => updateField('stripe_mode', 'live')}
                        >
                          <Text style={styles.modeBadgeText}>حي (Live)</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.inputLabel}>Publishable Key:</Text>
                    <TextInput
                      style={styles.input}
                      value={settings.stripe_publishable_key}
                      onChangeText={v => updateField('stripe_publishable_key', v)}
                      placeholder="pk_test_..."
                      placeholderTextColor={colors.gray}
                    />
                  </View>
                )}
              </View>

              {/* Paymob */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Paymob (كروت ميزة ومحافظ مصرية)</Text>
                  <Switch
                    value={settings.paymob_enabled}
                    onValueChange={v => updateField('paymob_enabled', v)}
                    trackColor={{ false: '#333', true: colors.primary }}
                  />
                </View>

                {settings.paymob_enabled && (
                  <View style={styles.inputsGroup}>
                    <Text style={styles.inputLabel}>API Key:</Text>
                    <TextInput
                      style={styles.input}
                      value={settings.paymob_api_key}
                      onChangeText={v => updateField('paymob_api_key', v)}
                      placeholder="Paymob API Key..."
                      placeholderTextColor={colors.gray}
                    />

                    <Text style={styles.inputLabel}>Integration ID:</Text>
                    <TextInput
                      style={styles.input}
                      value={settings.paymob_integration_id}
                      onChangeText={v => updateField('paymob_integration_id', v)}
                      placeholder="مثال: 412093"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>

              {/* Fawry */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Fawry (كود دفع فوري من أي منفذ)</Text>
                  <Switch
                    value={settings.fawry_enabled}
                    onValueChange={v => updateField('fawry_enabled', v)}
                    trackColor={{ false: '#333', true: colors.primary }}
                  />
                </View>

                {settings.fawry_enabled && (
                  <View style={styles.inputsGroup}>
                    <Text style={styles.inputLabel}>Merchant Code:</Text>
                    <TextInput
                      style={styles.input}
                      value={settings.fawry_merchant_code}
                      onChangeText={v => updateField('fawry_merchant_code', v)}
                      placeholder="FAWRY_MERCHANT_..."
                      placeholderTextColor={colors.gray}
                    />
                  </View>
                )}
              </View>

              {/* Vodafone Cash & COD */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>فودافون كاش والمحافظ الإلكترونية</Text>
                  <Switch
                    value={settings.vodafone_cash_enabled}
                    onValueChange={v => updateField('vodafone_cash_enabled', v)}
                    trackColor={{ false: '#333', true: colors.primary }}
                  />
                </View>
                {settings.vodafone_cash_enabled && (
                  <View style={styles.inputsGroup}>
                    <Text style={styles.inputLabel}>رقم المحفظة المعتمد لاستلام الأموال:</Text>
                    <TextInput
                      style={styles.input}
                      value={settings.vodafone_cash_number}
                      onChangeText={v => updateField('vodafone_cash_number', v)}
                      placeholder="010XXXXXXXX"
                      placeholderTextColor={colors.gray}
                      keyboardType="phone-pad"
                    />
                  </View>
                )}

                <View style={[styles.cardHeader, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#222' }]}>
                  <Text style={styles.cardTitle}>الدفع نقداً عند الاستلام (COD)</Text>
                  <Switch
                    value={settings.cod_enabled}
                    onValueChange={v => updateField('cod_enabled', v)}
                    trackColor={{ false: '#333', true: colors.primary }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* TAB 2: Commissions & Pricing */}
          {activeTab === 'commissions' && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>💰 نسب العمولات وحدود المعاملات</Text>
              <Text style={styles.sectionSubtitle}>
                تحديد أرباح المنصة المقتطعة تلقائياً من الفنيين والتجار عند اكتمال العمليات.
              </Text>

              <View style={styles.card}>
                <Text style={styles.inputLabel}>نسبة عمولة المنصة من طلبات الصيانة (%):</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.maintenance_commission ?? '15')}
                  onChangeText={v => updateField('maintenance_commission', v)}
                  keyboardType="numeric"
                  placeholder="15"
                  placeholderTextColor={colors.gray}
                />

                <Text style={styles.inputLabel}>نسبة عمولة المنصة من مبيعات المتجر (%):</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.marketplace_commission ?? '10')}
                  onChangeText={v => updateField('marketplace_commission', v)}
                  keyboardType="numeric"
                  placeholder="10"
                  placeholderTextColor={colors.gray}
                />

                <Text style={styles.inputLabel}>نسبة عمولة الكورسات التعليمية (%):</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.courses_commission ?? '20')}
                  onChangeText={v => updateField('courses_commission', v)}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor={colors.gray}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>الحدود المالية للمحافظ</Text>

                <Text style={styles.inputLabel}>الحد الأدنى لشحن رصيد المحفظة (ج.م):</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.min_wallet_deposit ?? '50')}
                  onChangeText={v => updateField('min_wallet_deposit', v)}
                  keyboardType="numeric"
                  placeholder="50"
                  placeholderTextColor={colors.gray}
                />

                <Text style={styles.inputLabel}>الحد الأدنى لطلب سحب الأرباح للفنيين (ج.م):</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.min_withdrawal_limit ?? '200')}
                  onChangeText={v => updateField('min_withdrawal_limit', v)}
                  keyboardType="numeric"
                  placeholder="200"
                  placeholderTextColor={colors.gray}
                />
              </View>
            </View>
          )}

          {/* TAB 3: General App Settings */}
          {activeTab === 'general' && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>⚙️ الإعدادات العامة للمنصة</Text>
              <Text style={styles.sectionSubtitle}>
                بيانات التطبيق ووضع الصيانة العام وأذونات العمليات الأساسية.
              </Text>

              {/* Maintenance Mode Emergency Card */}
              <View style={[styles.card, styles.emergencyCard]}>
                <View style={styles.emergencyHeader}>
                  <AlertOctagon size={22} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.emergencyTitle}>وضع الصيانة العام (Maintenance Mode)</Text>
                    <Text style={styles.emergencyDesc}>
                      عند التفعيل، يتم إيقاف التطبيق مؤقتاً للعملاء والفنيين مع عرض شاشة صيانة رسمية.
                    </Text>
                  </View>
                  <Switch
                    value={settings.maintenance_mode}
                    onValueChange={handleToggleMaintenance}
                    trackColor={{ false: '#333', true: '#EF4444' }}
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.inputLabel}>اسم المنصة:</Text>
                <TextInput
                  style={styles.input}
                  value={settings.platform_name}
                  onChangeText={v => updateField('platform_name', v)}
                  placeholderTextColor={colors.gray}
                />

                <Text style={styles.inputLabel}>بريد الدعم الفني الرسمي:</Text>
                <TextInput
                  style={styles.input}
                  value={settings.support_email}
                  onChangeText={v => updateField('support_email', v)}
                  keyboardType="email-address"
                  placeholderTextColor={colors.gray}
                />

                <Text style={styles.inputLabel}>رقم واتساب الدعم الفني:</Text>
                <TextInput
                  style={styles.input}
                  value={settings.support_phone}
                  onChangeText={v => updateField('support_phone', v)}
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.gray}
                />
              </View>

              <View style={styles.card}>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>السماح بتسجيل مستخدمين جدد</Text>
                  <Switch
                    value={settings.allow_registrations}
                    onValueChange={v => updateField('allow_registrations', v)}
                    trackColor={{ false: '#333', true: colors.primary }}
                  />
                </View>

                <View style={[styles.toggleRow, { marginTop: 12 }]}>
                  <Text style={styles.toggleLabel}>تفعيل متجر قطع الغيار والمنتجات</Text>
                  <Switch
                    value={settings.marketplace_enabled}
                    onValueChange={v => updateField('marketplace_enabled', v)}
                    trackColor={{ false: '#333', true: colors.primary }}
                  />
                </View>
              </View>
            </View>
          )}

          {/* TAB 4: Security */}
          {activeTab === 'security' && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>🛡️ إعدادات الأمان وحماية النظام</Text>
              <Text style={styles.sectionSubtitle}>
                سياسات المصادقة والحماية من الاختراق وإدارة الجلسات.
              </Text>

              <View style={styles.card}>
                <View style={styles.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleLabel}>فرض التحقق بخطوتين (2FA) للمشرفين</Text>
                    <Text style={styles.cardSub}>
                      إلزام المشرفين برمز تحقق إضافي عبر البريد أو الـ Authenticator.
                    </Text>
                  </View>
                  <Switch
                    value={settings.enforce_2fa_admins}
                    onValueChange={v => updateField('enforce_2fa_admins', v)}
                    trackColor={{ false: '#333', true: colors.primary }}
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.inputLabel}>مدة صلاحية الجلسة قبل تسجيل الخروج التلقائي (بالساعات):</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.session_timeout_hours)}
                  onChangeText={v => updateField('session_timeout_hours', v)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.gray}
                />

                <Text style={styles.inputLabel}>الحد الأقصى لمحاولات الدخول الخاطئة قبل الحظر المؤقت:</Text>
                <TextInput
                  style={styles.input}
                  value={String(settings.max_login_attempts)}
                  onChangeText={v => updateField('max_login_attempts', v)}
                  keyboardType="numeric"
                  placeholderTextColor={colors.gray}
                />
              </View>
            </View>
          )}

          {/* TAB 5: Terms & Conditions */}
          {activeTab === 'terms' && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>📄 الشروط والأحكام وسياسة الخصوصية</Text>
              <Text style={styles.sectionSubtitle}>
                محرر بنود الاتفاقية المعروضة للمستخدمين والفنيين عند التسجيل.
              </Text>

              <View style={styles.card}>
                <Text style={styles.inputLabel}>نص الشروط والسياسات:</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={settings.terms_text}
                  onChangeText={v => updateField('terms_text', v)}
                  multiline
                  numberOfLines={10}
                  placeholderTextColor={colors.gray}
                />
              </View>
            </View>
          )}

          {/* Save All Changes Button */}
          <TouchableOpacity
            style={styles.saveMainBtn}
            onPress={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.dark} />
            ) : (
              <>
                <Save size={18} color={colors.dark} />
                <Text style={styles.saveMainBtnText}>حفظ جميع التغييرات والإعدادات 💾</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={18} color="#EF4444" />
            <Text style={styles.logoutBtnText}>تسجيل الخروج من الحساب 🚪</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  saveHeaderBtnText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#141414',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#262626',
  },
  activeTabBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.gray,
    fontSize: 11,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.gray,
    fontSize: 13,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 16,
    paddingBottom: 150,
  },
  sectionContainer: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  sectionSubtitle: {
    color: colors.gray,
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#141414',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#222',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  cardSub: {
    color: colors.gray,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  inputsGroup: {
    marginTop: 8,
    gap: 8,
  },
  inputLabel: {
    color: '#CCC',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#333',
    padding: 10,
    color: colors.white,
    fontSize: 13,
    textAlign: 'right',
  },
  textArea: {
    minHeight: 140,
    textAlignVertical: 'top',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  modeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  modeBadgeActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    borderColor: colors.primary,
  },
  modeBadgeText: {
    color: colors.white,
    fontSize: 11,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  emergencyCard: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emergencyTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  emergencyDesc: {
    color: '#AAA',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  saveMainBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.md,
    marginTop: 8,
  },
  saveMainBtnText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: 'bold',
  },
  logoutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    borderRadius: borderRadius.md,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#262626',
    width: '100%',
  },
});

export default SettingsScreen;
