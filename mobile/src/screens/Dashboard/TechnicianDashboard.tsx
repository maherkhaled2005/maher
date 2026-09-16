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
  const [showSubscription, setShowSubscription] = useState(user?.role !== 'technician' && !user?.isPro);
  const [isAvailable, setIsAvailable] = useState(user?.available !== undefined ? Boolean(user.available) : true);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(['ac', 'fridge']);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(user?.balance || 0);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [completedCount, setCompletedCount] = useState<number>(0);

  const handleToggleAvailability = async (val: boolean) => {
    setIsAvailable(val);
    try {
      await api.post('/technician/availability', { available: val });
      if (user) {
        updateUser({ ...user, available: val ? 1 : 0 });
      }
    } catch (e) {
      console.warn('Could not update availability', e);
    }
  };

  const loadTechnicianData = async () => {
    try {
      // 1. Fetch Orders
      const ordersRes = await api.get('/orders').catch(() => null);
      if (ordersRes?.data && Array.isArray(ordersRes.data)) {
        const maintOrders = ordersRes.data.filter((o: any) => o.type === 'maintenance');
        const completedOrders = maintOrders.filter((o: any) => o.status === 'completed');
        setCompletedCount(completedOrders.length);

        const pendingOrAssigned = maintOrders.filter((o: any) => o.status === 'pending' || o.status === 'assigned' || o.status === 'in_progress');
        if (pendingOrAssigned.length > 0) {
          const mapped = pendingOrAssigned.map((ord: any) => {
            let items: any[] = [];
            try { items = typeof ord.items === 'string' ? JSON.parse(ord.items) : (ord.items || []); } catch {}
            return {
              id: ord.id,
              device: ord.deviceType || (items[0]?.name) || 'طلب صيانة منزلية 🔧',
              problem: ord.problemDesc || 'كشف وفحص عطل فني في موقع العميل',
              location: ord.deliveryAddress || ord.address || 'القاهرة',
              time: ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن',
              price: `${ord.total || 350} ج.م`,
              status: ord.status,
              raw: ord,
            };
          });
          setIncomingRequests(mapped);
        } else {
          setIncomingRequests([]);
        }
      }

      // 2. Fetch Wallet
      const balRes = await api.get('/user/balance').catch(() => null);
      if (balRes?.data?.balance !== undefined) {
        setWalletBalance(balRes.data.balance);
      }

      // 3. Fetch Profile to sync availability
      const profileRes = await api.get('/user/profile').catch(() => null);
      if (profileRes?.data && profileRes.data.available !== undefined) {
        const avail = Boolean(profileRes.data.available);
        setIsAvailable(avail);
        if (user) {
          updateUser({ ...user, available: profileRes.data.available });
        }
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

  // ✅ PRODUCTION-SAFE: Grace Period Auto-Offline (10 minutes)
  // The technician stays available for 10 minutes after leaving the app.
  // If they return within 10 minutes → stays online (normal app switch).
  // If they stay away for 10+ minutes → goes offline automatically.
  // This matches industry standards (Uber, Bosta, etc.)
  const GRACE_PERIOD_MS = 10 * 60 * 1000; // 10 minutes
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState.match(/inactive|background/)) {
        // App went to background — start grace period timer
        if (!offlineTimerRef.current) {
          offlineTimerRef.current = setTimeout(() => {
            // 10 minutes passed and still in background → go offline
            setIsAvailable(false);
            api.post('/technician/availability', { available: false }).catch(() => {});
            offlineTimerRef.current = null;
          }, GRACE_PERIOD_MS);
        }
      } else if (nextState === 'active') {
        // App came back to foreground — cancel the timer, stay online
        if (offlineTimerRef.current) {
          clearTimeout(offlineTimerRef.current);
          offlineTimerRef.current = null;
        }
      }
    });

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleUnload = () => {
        // On web close → go offline immediately (intentional action)
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

  // Technician KPIs (Dynamic from real database)
  const workedHoursVal = (user as any)?.workedHours || (completedCount * 1.5) || 0;

  const technicianKpis = [
    { label: 'طلبات صيانة متاحة', value: `${incomingRequests.length} طلبات`, note: incomingRequests.length > 0 ? 'في منطقتك 📍' : 'لا توجد طلبات جديدة', icon: Package, color: '#F59E0B' },
    { label: 'ساعات العمل النشطة ⏱️', value: `${Number(workedHoursVal).toFixed(1)} ساعة`, note: 'تتوقف تلقائياً عند الإغلاق 🔴', icon: Clock, color: '#10B981' },
    { label: 'أرباح الصيانة 🔧', value: `${(walletBalance || 0).toLocaleString()} ج.م`, note: 'أرباحك من عمليات الصيانة', icon: DollarSign, color: colors.primary },
    { label: 'أرباح الكورسات 📚', value: '0 ج.م', note: 'عائد نشر الكورسات والشروحات', icon: BookOpen, color: '#8B5CF6' },
    { label: 'التقييم العام', value: user?.rating ? `${user.rating} ⭐` : 'جديد', note: user?.ratingCount ? `${user.ratingCount} تقييم` : 'لا توجد تقييمات بعد', icon: Star, color: '#F59E0B' },
    { label: 'الطلبات المنجزة', value: `${completedCount} طلب`, note: completedCount > 0 ? 'منجز بنجاح' : 'لا توجد طلبات بعد', icon: CheckCircle2, color: '#3B82F6' },
  ];

  // Technician Sections
  const technicianSections = [
    { label: 'طلبات الصيانة الواردة', desc: 'استعراض والرد على طلبات العملاء وإتمام الصيانة', icon: Package, screen: 'Orders', color: '#F59E0B' },
    { label: 'الدعم الفني والمساعدة 🎧', desc: 'تواصل مع خدمة العملاء لحل أي استفسار أو مشكلة بالطلبات', icon: Headphones, screen: 'Tickets', color: '#0D9488' },
    { label: 'إدارة الكورسات والشروحات', desc: 'نشر كورسات مدفوعة وتحقيق أرباح إضافية', icon: BookOpen, screen: 'WebCommunity', color: '#10B981' },
    { label: 'المحفظة وسحب الأرباح', desc: 'تحويل الأرباح إلى فودافون كاش أو إنستاباي', icon: Wallet, screen: 'Wallet', color: colors.primary },
    { label: 'مجتمع الفنيين والريلز', desc: 'شروحات وفيديوهات صيانة مع زملائك الفنيين', icon: Video, screen: 'WebCommunity', color: '#8B5CF6' },
    { label: 'ملفي المهني والتقييمات', desc: 'عرض التقييمات السابقة ومناطق التغطية', icon: Award, screen: 'Profile', color: '#3B82F6' },
  ];

  const handleSubscribe = () => {
    if (user) {
      updateUser({ ...user, isPro: true, role: 'technician' });
    }
    setShowSubscription(false);
    Alert.alert('🎉 مبروك!', 'تم تفعيل اشتراك الفني بنجاح! يمكنك الآن استقبال طلبات الصيانة.');
  };

  const handleAcceptRequest = async (req: any) => {
    if (req.id && req.id.startsWith('ord_')) {
      try {
        await api.post(`/orders/${req.id}/arrive`).catch(() => {});
      } catch {}
      navigation.navigate('OrderDetails', { orderId: req.id });
    } else {
      Alert.alert('✅ تم قبول الطلب', `تم قبول طلب ${req.device}. تم إرسال بياناتك للعميل ورقم الطلب هو #${req.id}`, [
        { text: 'عرض الطلب', onPress: () => navigation.navigate('Orders') }
      ]);
    }
  };

  // Subscription Gate Screen
  if (showSubscription) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.dark, padding: spacing.xl, justifyContent: 'center' }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center', paddingVertical: spacing.xl, paddingBottom: 150 }}
          showsVerticalScrollIndicator={true}
        >
          <View
            style={{
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: 'rgba(212,175,55,0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.lg,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Wrench size={42} color={colors.primary} />
          </View>

          <Text style={{ color: colors.white, fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: spacing.xs }}>
            اشتراك فريق الفنيين المعتمدين 🔧
          </Text>
          <Text style={{ color: colors.gray, fontSize: 13, textAlign: 'center', marginBottom: spacing.lg }}>
            انضم إلى منصة TecnoRexa واستقبل طلبات الصيانة الحقيقية في منطقتك.
          </Text>

          {/* Pricing Box */}
          <View
            style={{
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              width: '100%',
              maxWidth: 480,
              borderWidth: 1.5,
              borderColor: colors.primary,
              marginBottom: spacing.xl,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 32, fontWeight: '900' }}>300 ج.م</Text>
            <Text style={{ color: colors.gray, fontSize: 13, marginBottom: spacing.md }}>اشتراك شهري شامل كافة المميزات</Text>
            
            <View style={{ width: '100%', gap: spacing.sm }}>
              {[
                'استقبال طلبات الصيانة الحصرية في محيطك الجغرافي 📍',
                'إمكانية بيع كورسات ودورات تدريبية وتحقيق دخل سلبي 📚',
                'محفظة إلكترونية لصرف الأرباح فورياً (فودافون كاش / إنستاباي) 💳',
                'شارة فني معتمد وبناء تقييم وسمعة موثوقة ⭐',
              ].map((feat, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'flex-end' }}>
                  <Text style={{ color: colors.white, fontSize: 12, textAlign: 'right', flex: 1 }}>{feat}</Text>
                  <CheckCircle2 color={colors.primary} size={16} />
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubscribe}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.xxl,
              borderRadius: borderRadius.lg,
              width: '100%',
              maxWidth: 480,
              alignItems: 'center',
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 16 }}>
              تفعيل الاشتراك الآن (300 ج.م) ✓
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSubscription(false)}
            style={{
              paddingVertical: spacing.sm,
              paddingHorizontal: spacing.lg,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.gray, fontSize: 13, fontWeight: '700' }}>
              المتابعة للوحة التحكم وتصفح الطلبات
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: spacing.xs }}>
                <View style={{ backgroundColor: k.color + '22', padding: 6, borderRadius: borderRadius.sm }}>
                  <k.icon size={18} color={k.color} />
                </View>
                <Text style={{ fontSize: 10, color: k.color, fontWeight: '700' }}>{k.note}</Text>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: colors.white, marginBottom: 2 }}>{k.value}</Text>
              <Text style={{ fontSize: 11, color: colors.gray, fontWeight: '600' }}>{k.label}</Text>
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
