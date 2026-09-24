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

const SPECIALTIES = [
  { id: 'washer', label: 'غسالات ملابس وأطباق', icon: '🧺' },
  { id: 'fridge', label: 'ثلاجات وديب فريزر', icon: '🧊' },
  { id: 'cooker', label: 'بوتاجازات وأفران', icon: '🔥' },
  { id: 'microwave', label: 'ميكروويف وأجهزة طهي', icon: '♨️' },
  { id: 'ac', label: 'تكييفات وتبريد', icon: '❄️' },
];

export default function TechnicianDashboard({ navigation }: any) {
  const { user, updateUser } = useAuthStore();
  const [isAvailable, setIsAvailable] = useState(Boolean(user?.available));
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);

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
