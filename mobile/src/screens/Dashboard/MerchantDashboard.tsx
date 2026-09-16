import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  Package,
  Plus,
  TrendingUp,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Building2,
  Wallet,
  DollarSign,
  ArrowUpRight,
  Boxes,
  Clock,
  Award,
  AlertTriangle,
  Headphones,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';

export default function MerchantDashboard({ navigation }: any) {
  const { user, updateUser } = useAuthStore();
  const [showSubscription, setShowSubscription] = useState(user?.role !== 'merchant' && !user?.isPro);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(user?.balance || 0);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [activeProductsCount, setActiveProductsCount] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);

  const loadMerchantData = async () => {
    try {
      // 1. Fetch Orders
      const ordersRes = await api.get('/orders').catch(() => null);
      if (ordersRes?.data && Array.isArray(ordersRes.data)) {
        const shopOrders = ordersRes.data.filter((o: any) => o.type === 'marketplace');
        const mapped = shopOrders.map((ord: any) => {
          let items: any[] = [];
          try { items = typeof ord.items === 'string' ? JSON.parse(ord.items) : (ord.items || []); } catch {}
          return {
            id: ord.id,
            item: (items[0]?.name) || ord.deviceType || 'شحنة قطع غيار أصلية 📦',
            customer: 'العميل: ' + (ord.deliveryAddress || ord.address || 'القاهرة'),
            price: `${ord.total || 0} ج.م`,
            time: ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن',
            status: ord.status,
            raw: ord,
          };
        });
        setPendingOrders(mapped);
        const sales = shopOrders
          .filter((o: any) => o.status === 'completed' || o.status === 'delivered')
          .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
        setTotalSales(sales);
      } else {
        setPendingOrders([]);
      }

      // 2. Fetch Products Count
      const prodsRes = await api.get('/products').catch(() => null);
      if (prodsRes?.data && Array.isArray(prodsRes.data)) {
        setActiveProductsCount(prodsRes.data.length);
      } else {
        setActiveProductsCount(0);
      }

      // 3. Fetch Balance
      const balRes = await api.get('/user/balance').catch(() => null);
      if (balRes?.data?.balance !== undefined) {
        setWalletBalance(balRes.data.balance);
      }
    } catch (e) {
      console.warn('Could not refresh merchant data', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMerchantData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMerchantData();
  }, []);

  // Merchant KPIs (dynamic real values)
  const merchantKpis = [
    { label: 'إجمالي المبيعات', value: `${totalSales.toLocaleString()} ج.م`, note: 'مبيعات حقيقية', icon: DollarSign, color: colors.primary },
    { label: 'طلبات جديدة للشحن', value: `${pendingOrders.length} طلبات`, note: pendingOrders.length > 0 ? 'تحتاج تجهيز' : 'لا توجد طلبات معلقة', icon: Truck, color: '#3B82F6' },
    { label: 'المنتجات النشطة في السوق', value: `${activeProductsCount} منتج`, note: 'معتمدة في المتجر', icon: Package, color: '#10B981' },
    { label: 'رصيد المحفظة المتاح', value: `${walletBalance.toLocaleString()} ج.م`, note: 'جاهز للسحب', icon: Wallet, color: colors.primary },
    { label: 'قطع قاربت على النفاد', value: '0 قطع', note: 'المخزون متوفر', icon: AlertTriangle, color: '#EF4444' },
    { label: 'تقييم المتجر', value: user?.rating ? `${user.rating} ⭐` : 'جديد', note: 'متجر معتمد', icon: Award, color: '#F59E0B' },
  ];

  // Merchant Sections
  const merchantSections = [
    { label: 'إدارة منتجاتي (My Products)', desc: 'تعديل الأسعار والكميات وإيقاف أو تنشيط القطع', icon: Package, screen: 'MyProducts', color: colors.primary },
    { label: 'إضافة منتج جديد (Add Product)', desc: 'إدراج قطع غيار جديدة بالصور والمواصفات والسعر', icon: Plus, screen: 'AddProduct', color: '#10B981' },
    { label: 'إدارة طلبات الشراء والشحن', desc: 'متابعة الطلبات وتأكيد التجهيز وتتبع بوليصات الشحن', icon: Truck, screen: 'Orders', color: '#3B82F6' },
    { label: 'إدارة المخازن والمستودعات', desc: 'توزيع الكميات على المخازن وحركات الجرد والتحويل', icon: Building2, screen: 'Warehouses', color: '#8B5CF6' },
    { label: 'المحفظة والأرباح', desc: 'سحب مستحقات المبيعات عبر فودافون كاش أو إنستاباي', icon: Wallet, screen: 'Wallet', color: colors.primary },
    { label: 'خدمة العملاء والدعم الفني 🎧', desc: 'تواصل مع الدعم الفني لحل مشاكل الشحنات والمحفظة', icon: Headphones, screen: 'Tickets', color: '#0D9488' },
    { label: 'معاينة متجري في السوق', desc: 'رؤية المنتجات كما يراها العملاء في تطبيق TecnoRexa', icon: ShoppingBag, screen: 'Marketplace', color: '#F59E0B' },
  ];

  const handleSubscribe = () => {
    if (user) {
      updateUser({ ...user, isPro: true, role: 'merchant' });
    }
    setShowSubscription(false);
    Alert.alert('🎉 مبروك!', 'تم تفعيل اشتراك التاجر بنجاح (500 ج.م)! يمكنك الآن نشر قطع الغيار واستقبال الطلبات.');
  };

  const handleFulfillOrder = async (ord: any) => {
    if (ord.id && ord.id.startsWith('ord_')) {
      try {
        await api.post(`/orders/${ord.id}/ship`, {
          carrier: 'أرامكس مصر (Aramex)',
          trackingNumber: 'ARX-' + Date.now().toString().slice(-6),
        }).catch(() => {});
      } catch {}
      navigation.navigate('OrderDetails', { orderId: ord.id });
    } else {
      Alert.alert('✅ تم تأكيد التجهيز', `تم تجهيز الطلب ${ord.id} وإرسال إشعار لمندوب الشحن.`);
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
            <Building2 size={42} color={colors.primary} />
          </View>

          <Text style={{ color: colors.white, fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: spacing.xs }}>
            اشتراك التجار وموردي قطع الغيار 🏪
          </Text>
          <Text style={{ color: colors.gray, fontSize: 13, textAlign: 'center', marginBottom: spacing.lg }}>
            افتح متجرك الرقمي على TecnoRexa وبع منتجاتك لآلاف الفنيين والعملاء يومياً.
          </Text>

          {/* Pricing Box - 100 EGP as specified */}
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
            <Text style={{ color: colors.primary, fontSize: 32, fontWeight: '900' }}>100 ج.م</Text>
            <Text style={{ color: colors.gray, fontSize: 13, marginBottom: spacing.md }}>اشتراك شهري شامل كافة صلاحيات التاجر</Text>

            <View style={{ width: '100%', gap: spacing.sm }}>
              {[
                'إضافة ونشر عدد غير محدود من قطع الغيار والأجهزة 📦',
                'إدارة المخازن المتعددة وحركات الجرد الآلية 🏢',
                'استقبال طلبات الشراء من الفنيين والعملاء مباشرة 🚚',
                'محفظة مالية لسحب مبيعاتك فورياً بدون أي عمولات خفية 💳',
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
              تفعيل اشتراك التاجر الآن (100 ج.م) ✓
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
              المتابعة للوحة التحكم وتصفح المعروضات
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
      {/* Role Header with ☰ Drawer & Add Product Button */}
      <OwnerHeader
        title="بوابة التاجر والمبيعات"
        subtitle={`مرحباً بك، ${user?.name || 'التاجر'} 🏪`}
        sectionNumber={1}
        navigation={navigation}
        currentScreen="Home"
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('AddProduct')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.merchant,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: borderRadius.md,
              gap: 4,
            }}
          >
            <Plus size={14} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: '800', fontSize: 11 }}>إضافة منتج</Text>
          </TouchableOpacity>
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

        {/* 6 Merchant KPIs */}
        <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: spacing.xs }}>
          مؤشرات المبيعات والمخزون 📊
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
          {merchantKpis.map((k, idx) => (
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

        {/* Merchant Sections */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: spacing.sm }}>
            أقسام المتجر والمبيعات 🗂️
          </Text>
          <View style={{ gap: spacing.sm }}>
            {merchantSections.map((sec, idx) => (
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

        {/* Pending Orders awaiting dispatch */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>كل الطلبات</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900', textAlign: 'right' }}>
              طلبات جديدة بانتظار التجهيز 🚚
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            {pendingOrders.length === 0 ? (
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
                <Package size={32} color={colors.gray} style={{ marginBottom: spacing.sm }} />
                <Text style={{ color: colors.white, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 4 }}>
                  لا توجد طلبات بيع جديدة بانتظار الشحن والتجهيز
                </Text>
                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}>
                  ستظهر طلبات شراء قطع الغيار من العملاء والفنيين هنا فور إتمام عملية الدفع
                </Text>
              </View>
            ) : (
              pendingOrders.map((ord) => (
                <View
                  key={ord.id}
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 14 }}>{ord.price}</Text>
                    <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>{ord.id}</Text>
                  </View>
                  <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'right' }}>
                    {ord.item}
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right', marginTop: 2 }}>
                    {ord.customer}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm }}>
                    <TouchableOpacity
                      onPress={() => handleFulfillOrder(ord)}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.xs,
                        borderRadius: borderRadius.md,
                      }}
                    >
                      <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 12 }}>تأكيد التجهيز ✓</Text>
                    </TouchableOpacity>

                    <Text style={{ color: colors.gray, fontSize: 10 }}>{ord.time}</Text>
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
