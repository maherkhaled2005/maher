import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  Switch,
  RefreshControl,
  ActivityIndicator,
  AppState,
  Modal,
} from 'react-native';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Star,
  Wallet,
  MapPin,
  Phone,
  BookOpen,
  ArrowUpRight,
  Package,
  Video,
  DollarSign,
  TrendingUp,
  Award,
  Headphones,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';

const ALL_TECH_SPECIALTIES = [
  'ثلاجة',
  'ديب فريزر',
  'غسالة ملابس',
  'غسالة أطباق',
  'ميكروويف',
  'بوتجاز',
  'فرن كهربائي',
  'فرن غاز',
  'تكييف منزلي',
  'شفاط مطبخ',
  'سخان مياه',
  'خلاط',
  'عجان',
  'كبة',
  'محضرة طعام',
  'عصارة',
  'خلاط يدوي',
  'مكنسة كهربائية',
  'مكواة',
  'مروحة',
  'مروحة سقف',
  'غلاية مياه',
  'ماكينة قهوة',
  'ماكينة تحضير الشاي',
  'مقلاة هوائية',
  'محضرة قهوة',
  'مكنسة روبوت',
  'مجفف ملابس',
  'شفاط حمام',
  'صانعة ساندوتشات',
];

export default function TechnicianDashboard({ navigation }: any) {
  const { user, updateUser } = useAuthStore();
  const [isAvailable, setIsAvailable] = useState(Boolean(user?.available));
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);
  const [editingSpecialties, setEditingSpecialties] = useState<string[]>([]);
  const [isSavingSpecs, setIsSavingSpecs] = useState(false);

  const handleOpenSpecialtiesModal = () => {
    const current = user?.specialty
      ? user.specialty.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean)
      : [];
    setEditingSpecialties(current.slice(0, 3));
    setSpecialtyModalVisible(true);
  };

  const handleToggleEditSpecialty = (spec: string) => {
    if (editingSpecialties.includes(spec)) {
      setEditingSpecialties(editingSpecialties.filter((s) => s !== spec));
    } else {
      if (editingSpecialties.length >= 3) {
        Alert.alert(
          'الحد الأقصى 3 تخصصات',
          'قم بإلغاء تحديد أحد التخصصات لتتمكن من اختيار تخصص بديل.'
        );
        return;
      }
      setEditingSpecialties([...editingSpecialties, spec]);
    }
  };

  const handleSaveSpecialties = async () => {
    if (editingSpecialties.length !== 3) {
      Alert.alert(
        'تنبيه',
        `يجب اختيار 3 تخصصات صيانة بالضبط (تم اختيار ${editingSpecialties.length} من 3).`
      );
      return;
    }
    setIsSavingSpecs(true);
    try {
      const res = await api.put('/technician/specialties', {
        specialties: editingSpecialties,
      });
      if (res?.data?.user) {
        updateUser(res.data.user);
      } else if (user) {
        updateUser({ ...user, specialty: editingSpecialties.join('، ') });
      }
      setSpecialtyModalVisible(false);
      Alert.alert('تم الحفظ بنجاح ✅', 'تم تحديث واعتماد تخصصات الصيانة الـ 3 الخاصة بك.');
    } catch (err: any) {
      Alert.alert(
        'خطأ في الحفظ',
        err?.response?.data?.error || err.message || 'تعذر حفظ التخصصات، حاول ثانية.'
      );
    } finally {
      setIsSavingSpecs(false);
    }
  };

  const handleToggleAvailability = async (val: boolean) => {
    setIsAvailable(val);
    try {
      const res = await api.post('/technician/availability', { available: val });
      if (res?.data?.available !== undefined && user) {
        updateUser({ ...user, available: res.data.available });
      }
    } catch (e) {
      console.warn('Could not update availability', e);
    }
  };

  const loadTechnicianData = async () => {
    try {
      // 1. Fetch Real KPI Overview from Backend
      const overviewRes = await api.get('/technician/overview').catch(() => null);
      if (overviewRes?.data) {
        setOverview(overviewRes.data);
        if (overviewRes.data.available !== undefined) {
          setIsAvailable(Boolean(overviewRes.data.available));
        }
      }

      // 2. Fetch Real Service Requests for this technician
      const reqRes = await api.get('/technician/requests').catch(() => null);
      if (reqRes?.data && Array.isArray(reqRes.data)) {
        const mapped = reqRes.data.filter((ord: any) => ord.status !== 'completed' && ord.status !== 'cancelled').map((ord: any) => {
          let items: any[] = [];
          try { items = typeof ord.items === 'string' ? JSON.parse(ord.items) : (ord.items || []); } catch {}
          return {
            id: ord.id,
            device: ord.deviceType || (items[0]?.name) || ord.serviceType || 'طلب صيانة منزلية 🔧',
            problem: ord.problemDesc || ord.notes || 'كشف وفحص عطل فني في موقع العميل',
            location: ord.location || ord.address || ord.governorate || 'القاهرة',
            time: ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن',
            price: `${ord.total || 250} ج.م`,
            status: ord.status,
            raw: ord,
          };
        });
        setIncomingRequests(mapped);
      } else {
        setIncomingRequests([]);
      }
    } catch (e) {
      console.warn('Could not refresh tech data', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTechnicianData();
  }, []);

  // Grace Period Auto-Offline (10 minutes)
  const GRACE_PERIOD_MS = 10 * 60 * 1000;
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState.match(/inactive|background/)) {
        if (!offlineTimerRef.current) {
          offlineTimerRef.current = setTimeout(() => {
            setIsAvailable(false);
            api.post('/technician/availability', { available: false }).catch(() => {});
            offlineTimerRef.current = null;
          }, GRACE_PERIOD_MS);
        }
      } else if (nextState === 'active') {
        if (offlineTimerRef.current) {
          clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = null;
        }
      }
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleUnload = () => {
        api.post('/technician/availability', { available: false }).catch(() => {});
      };
      window.addEventListener('beforeunload', handleUnload);
      return () => {
        subscription.remove();
        window.removeEventListener('beforeunload', handleUnload);
        if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      };
    }

    return () => {
      subscription.remove();
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTechnicianData();
  }, []);

  // Dynamic KPIs strictly from Real Database Numbers
  const workedHoursVal = overview?.workedHours ?? (user as any)?.workedHours ?? 0;
  const maintEarnings = overview?.maintenanceEarnings ?? 0;
  const courseEarnings = overview?.coursesEarnings ?? 0;
  const completedOrdersCount = overview?.completedOrders ?? 0;
  const trueRating = overview?.overallRating || user?.rating;
  const trueRatingCount = overview?.ratingCount || user?.ratingCount || 0;

  const technicianKpis = [
    {
      label: 'طلبات صيانة متاحة',
      value: `${overview?.pendingRequests ?? incomingRequests.length} طلبات`,
      note: incomingRequests.length > 0 ? 'في منطقتك 📍' : 'لا توجد طلبات جديدة',
      icon: Package,
      color: '#F59E0B'
    },
    {
      label: 'ساعات العمل النشطة ⏱️',
      value: `${Number(workedHoursVal).toFixed(1)} ساعة`,
      note: isAvailable ? 'متاح للعمل الآن 🟢' : 'غير متصل حالياً 🔴',
      icon: Clock,
      color: '#10B981'
    },
    {
      label: 'أرباح الصيانة 🔧',
      value: `${maintEarnings.toLocaleString()} ج.م`,
      note: 'أرباحك من عمليات الصيانة المنجزة',
      icon: DollarSign,
      color: colors.primary
    },
    {
      label: 'أرباح الكورسات 📚',
      value: `${courseEarnings.toLocaleString()} ج.م`,
      note: 'عائد بيع الكورسات والشروحات (80%)',
      icon: BookOpen,
      color: '#8B5CF6'
    },
    {
      label: 'التقييم العام',
      value: trueRating ? `${trueRating} ⭐` : 'جديد',
      note: trueRatingCount ? `${trueRatingCount} تقييم حقيقي` : 'لا توجد تقييمات بعد',
      icon: Star,
      color: '#F59E0B'
    },
    {
      label: 'الطلبات المنجزة',
      value: `${completedOrdersCount} طلب`,
      note: completedOrdersCount > 0 ? 'منجز بنجاح' : 'لا توجد طلبات بعد',
      icon: CheckCircle2,
      color: '#3B82F6'
    },
  ];

  // Technician Sections
  const technicianSections = [
    { label: 'طلبات الصيانة الواردة', desc: 'استعراض والرد على طلبات العملاء وإتمام الصيانة', icon: Package, screen: 'Orders', color: '#F59E0B' },
    { label: 'الدعم الفني والمساعدة 🎧', desc: 'تواصل مع خدمة العملاء لحل أي استفسار أو مشكلة بالطلبات', icon: Headphones, screen: 'Tickets', color: '#0D9488' },
    { label: 'إدارة الكورسات والشروحات', desc: 'نشر كورسات مدفوعة وتحقيق أرباح إضافية', icon: BookOpen, screen: 'Courses', color: '#10B981' },
    { label: 'المحفظة وسحب الأرباح', desc: 'تحويل الأرباح إلى فودافون كاش أو إنستاباي', icon: Wallet, screen: 'Wallet', color: colors.primary },
    { label: 'مجتمع الفنيين والريلز', desc: 'شروحات وفيديوهات صيانة مع زملائك الفنيين', icon: Video, screen: 'WebCommunity', color: '#8B5CF6' },
    { label: 'ملفي المهني والتقييمات', desc: 'عرض التقييمات السابقة ومناطق التغطية', icon: Award, screen: 'Profile', color: '#3B82F6' },
  ];

  const handleAcceptRequest = async (req: any) => {
    if (req.id) {
      try {
        await api.post(`/technician/orders/${req.id}/action`, { action: 'accept' }).catch(() => {});
      } catch {}
      navigation.navigate('OrderDetails', { orderId: req.id });
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.dark }}
    >
      {/* Role Header with ☰ Drawer & Availability Toggle */}
      <OwnerHeader
        title="حقيبة الفني والعمليات"
        subtitle={`مرحباً بك، ${user?.name || 'الفني'} 🔧 (${isAvailable ? 'متاح للعمل 🟢' : 'غير متاح 🔴'})`}
        sectionNumber={1}
        navigation={navigation}
        currentScreen="Home"
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.darkCard, paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.full, borderWidth: 1, borderColor: isAvailable ? '#10B981' : colors.border }}>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ true: '#10B981', false: colors.dark }}
              thumbColor={colors.white}
            />
            <Text style={{ color: isAvailable ? '#10B981' : colors.gray, fontWeight: '800', fontSize: 10 }}>
              {isAvailable ? 'متاح' : 'مشغول'}
            </Text>
          </View>
        }
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >

        {/* 6 Technician KPIs */}
        <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: spacing.xs }}>
          أدائي وأرباحي هذا الشهر 💰
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
          {technicianKpis.map((k, idx) => (
            <View
              key={idx}
              style={{
                width: '48%',
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'flex-end',
              }}
            >
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: spacing.xs }}>
                <View style={{ backgroundColor: k.color + '22', padding: 6, borderRadius: borderRadius.sm }}>
                  <k.icon size={18} color={k.color} />
                </View>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.white, marginBottom: 2, textAlign: 'right' }}>{k.value}</Text>
              <Text style={{ fontSize: 11, color: colors.gray, fontWeight: '600', textAlign: 'right', marginBottom: 2 }}>{k.label}</Text>
              <Text style={{ fontSize: 10, color: k.color, fontWeight: '700', textAlign: 'right' }} numberOfLines={2}>{k.note}</Text>
            </View>
          ))}
        </View>

        {/* Certified 3 Specialties Card */}
        <View
          style={{
            backgroundColor: colors.darkCard,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: 'rgba(212, 175, 55, 0.4)',
            marginTop: spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row-reverse',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.xs,
            }}
          >
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
              <Wrench size={18} color={colors.primary} />
              <Text style={{ color: colors.white, fontSize: 14, fontWeight: '900' }}>
                تخصصات الصيانة المعتمدة (3 تخصصات)
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleOpenSpecialtiesModal}
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>
                تعديل ✏️
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right', marginBottom: spacing.sm }}>
            التخصصات الرسمية المسجلة في حسابك والتي تظهر للمدير والمالك والعملاء:
          </Text>

          <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
            {(user?.specialty
              ? user.specialty.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean)
              : ['ثلاجة', 'غسالة ملابس', 'تكييف منزلي']
            ).map((spec: string, idx: number) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(212, 175, 55, 0.12)',
                  borderColor: colors.primary,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: borderRadius.md,
                }}
              >
                <CheckCircle2 size={13} color={colors.primary} />
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: '800' }}>
                  {spec}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Modal for Editing 3 Specialties */}
        <Modal
          visible={specialtyModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setSpecialtyModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.85)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: spacing.md,
            }}
          >
            <View
              style={{
                width: '100%',
                maxWidth: 480,
                maxHeight: '85%',
                backgroundColor: '#141414',
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.primary,
                padding: spacing.lg,
              }}
            >
              <View
                style={{
                  flexDirection: 'row-reverse',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.xs,
                }}
              >
                <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900' }}>
                  تعديل تخصصات الصيانة 🔧
                </Text>
                <TouchableOpacity
                  onPress={() => setSpecialtyModalVisible(false)}
                  style={{ padding: 4 }}
                >
                  <Text style={{ color: colors.gray, fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: spacing.sm }}>
                اختر 3 تخصصات صيانة للأجهزة المنزلية بالضبط:
              </Text>

              <View
                style={{
                  alignSelf: 'flex-end',
                  backgroundColor:
                    editingSpecialties.length === 3
                      ? 'rgba(16, 185, 129, 0.2)'
                      : 'rgba(212, 175, 55, 0.2)',
                  borderColor:
                    editingSpecialties.length === 3 ? '#10B981' : '#D4AF37',
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginBottom: spacing.md,
                }}
              >
                <Text
                  style={{
                    color:
                      editingSpecialties.length === 3 ? '#10B981' : '#D4AF37',
                    fontSize: 12,
                    fontWeight: '800',
                  }}
                >
                  تم اختيار {editingSpecialties.length} من 3
                </Text>
              </View>

              <ScrollView
                style={{ maxHeight: 340 }}
                contentContainerStyle={{
                  flexDirection: 'row-reverse',
                  flexWrap: 'wrap',
                  gap: 8,
                  paddingBottom: spacing.md,
                }}
              >
                {ALL_TECH_SPECIALTIES.map((spec) => {
                  const isChecked = editingSpecialties.includes(spec);
                  return (
                    <TouchableOpacity
                      key={spec}
                      onPress={() => handleToggleEditSpecialty(spec)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: borderRadius.md,
                        backgroundColor: isChecked ? colors.primary : '#1E1E1E',
                        borderWidth: 1,
                        borderColor: isChecked ? colors.primary : '#333',
                      }}
                    >
                      <Text
                        style={{
                          color: isChecked ? '#0A0A0A' : colors.white,
                          fontSize: 12,
                          fontWeight: isChecked ? '900' : '600',
                        }}
                      >
                        {isChecked ? `✓ ${spec}` : spec}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.md }}>
                <TouchableOpacity
                  onPress={handleSaveSpecialties}
                  disabled={isSavingSpecs}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    opacity: isSavingSpecs ? 0.7 : 1,
                  }}
                >
                  {isSavingSpecs ? (
                    <ActivityIndicator color="#0A0A0A" size="small" />
                  ) : (
                    <Text style={{ color: '#0A0A0A', fontSize: 13, fontWeight: '900' }}>
                      حفظ واعتماد التخصصات الـ 3 ✅
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSpecialtyModalVisible(false)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: borderRadius.md,
                    backgroundColor: '#262626',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700' }}>
                    إلغاء
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Technician Sections */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: spacing.sm }}>
            أقسام الفني وخدماته 🗂️
          </Text>
          <View style={{ gap: spacing.sm }}>
            {technicianSections.map((sec, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() => navigation.navigate(sec.screen)}
              >
                <View style={{ width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: sec.color + '22', borderColor: sec.color + '44' }}>
                  <sec.icon size={22} color={sec.color} />
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: spacing.sm }}>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: colors.white, marginBottom: 2 }}>{sec.label}</Text>
                  <Text style={{ fontSize: 11, color: colors.gray }}>{sec.desc}</Text>
                </View>
                <ArrowUpRight size={18} color={colors.gray} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Incoming Service Requests */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>كل الطلبات</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900', textAlign: 'right' }}>
              طلبات صيانة قريبة في منطقتك 📍
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            {incomingRequests.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.lg,
                  padding: spacing.xl,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Clock size={32} color={colors.gray} style={{ marginBottom: spacing.sm }} />
                <Text style={{ color: colors.white, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
                  لا توجد طلبات صيانة واردة حالياً
                </Text>
                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}>
                  ستظهر طلبات الصيانة الجديدة من العملاء في منطقتك فور إرسالها هنا مباشرة
                </Text>
              </View>
            ) : (
              incomingRequests.map((req) => (
                <View
                  key={req.id}
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>{req.price}</Text>
                    <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>{req.device}</Text>
                  </View>
                  <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: spacing.sm }}>
                    {req.problem}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.sm }}>
                    <TouchableOpacity
                      onPress={() => handleAcceptRequest(req)}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.xs,
                        borderRadius: borderRadius.md,
                      }}
                    >
                      <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 12 }}>قبول الطلب ✓</Text>
                    </TouchableOpacity>

                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: colors.gray, fontSize: 11 }}>{req.location}</Text>
                        <MapPin size={12} color={colors.gray} />
                      </View>
                      <Text style={{ color: colors.gray, fontSize: 10, marginTop: 2 }}>{req.time}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
