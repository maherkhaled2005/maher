import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  Share,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Crown,
  Menu,
  DollarSign,
  Users,
  ShoppingCart,
  Wrench,
  Headphones,
  Wallet,
  Download,
  Star,
  Clock,
  ArrowUpRight,
  TrendingUp,
  PieChart,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import OwnerSideDrawer, { OWNER_SECTIONS } from '../../components/OwnerSideDrawer';
import { generateExecutiveReportHTML, exportExecutiveCSV } from '../../utils/executiveReport';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const PERIODS = [
  { label: 'اليوم', value: 'today' },
  { label: '7 أيام', value: '7d' },
  { label: '30 يوم', value: '30d' },
  { label: '3 أشهر', value: '3m' },
  { label: 'السنة', value: '1y' },
  { label: 'الكل', value: 'all' },
];

export default function OwnerDashboard({ navigation }: any) {
  const { user } = useAuthStore();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [selectedChartPoint, setSelectedChartPoint] = useState<any>(null);
  const [pieModalVisible, setPieModalVisible] = useState(false);

  // Real Database Stats State
  const [stats, setStats] = useState<any>({
    totalRevenue: 0,
    revenueNote: null,
    activeUsers: 0,
    isUsersLow: false,
    todayOrders: 0,
    availableTechnicians: 0,
    isTechniciansZero: false,
    pendingTickets: 0,
    isTicketsFlashing: false,
    pendingWithdrawalsAmount: 0,
    topTechnicians: [],
    topProducts: [],
    liveActivities: [],
    userCounts: {},
    revenueBreakdown: { marketplace: 0, subscriptions: 0, courses: 0 },
    weeklyGrowth: [],
  });

  const fetchOverview = async (period = selectedPeriod) => {
    try {
      setIsLoading(true);
      const data = await fetchApi(`/owner/overview?period=${period}`);
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.warn('Could not fetch real owner stats, using DB defaults', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview(selectedPeriod);
    const interval = setInterval(() => {
      fetchApi(`/owner/overview?period=${selectedPeriod}`)
        .then((data) => {
          if (data) setStats(data);
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOverview(selectedPeriod);
    setRefreshing(false);
  }, [selectedPeriod]);

  const handleExport = async (type: 'pdf' | 'excel' | 'csv') => {
    setExportModalVisible(false);
    const reportData = {
      period: selectedPeriod,
      totalRevenue: stats.totalRevenue || 0,
      activeUsers: stats.activeUsers || 0,
      todayOrders: stats.todayOrders || 0,
      availableTechnicians: stats.availableTechnicians || 0,
      pendingTickets: stats.pendingTickets || 0,
      pendingWithdrawalsAmount: stats.pendingWithdrawalsAmount || 0,
      revenueBreakdown: stats.revenueBreakdown,
      treasury: stats.treasury,
      warehouses: stats.warehouses,
      support: stats.support,
      orders: stats.orders,
      topTechnicians: stats.topTechnicians || [],
      topProducts: stats.topProducts || [],
      liveActivities: stats.liveActivities || [],
      ownerName: user?.name || 'إدارة منصة TecnoRexa',
      programmerName: 'الدعم التقني والبرمجي',
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (type === 'pdf') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(generateExecutiveReportHTML(reportData));
          printWindow.document.close();
        }
      } else {
        const csvContent = exportExecutiveCSV(reportData);
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `TecnoRexa_Executive_Report_${selectedPeriod}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      Alert.alert('✅ تم بنجاح', `تم تجهيز وتصدير التقرير التنفيذي الشامل بصيغة ${type.toUpperCase()}`);
    } else {
      try {
        if (type === 'pdf') {
          const { uri } = await Print.printToFileAsync({
            html: generateExecutiveReportHTML(reportData),
          });
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(uri, {
              UTI: '.pdf',
              mimeType: 'application/pdf',
              dialogTitle: 'تقرير منصة TecnoRexa التنفيذي',
            });
          } else {
            Alert.alert('✅ تم إنشاء التقرير', `تم حفظ ملف PDF بنجاح في:\n${uri}`);
          }
        } else {
          const textSummary = `📑 تقرير TecnoRexa التنفيذي (${reportData.period})\n\n👑 المالك: ${reportData.ownerName}\n💰 إجمالي الإيرادات: ${reportData.totalRevenue} ج.م\n👥 المستخدمين النشطين: ${reportData.activeUsers}\n📦 الطلبات اليومية: ${reportData.todayOrders}\n🔧 الفنيين المتاحين: ${reportData.availableTechnicians}\n💳 المسحوبات المعلقة: ${reportData.pendingWithdrawalsAmount} ج.م`;
          await Share.share({
            title: 'تقرير منصة TecnoRexa التنفيذي',
            message: type === 'csv' ? exportExecutiveCSV(reportData) : textSummary,
          });
        }
      } catch (err: any) {
        Alert.alert('تنبيه', `حدث خطأ أثناء تصدير التقرير: ${err?.message || 'يرجى المحاولة مجدداً'}`);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ☰ Owner Side Drawer with 19 Sections */}
      <OwnerSideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        navigation={navigation}
        currentScreen="Home"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={true}
      >
        {/* Top Header with Hamburger ☰ button and Owner Badge */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setDrawerVisible(true)}
              accessibilityLabel="فتح قائمة الأقسام"
            >
              <Menu size={22} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => setExportModalVisible(true)}
            >
              <Download size={16} color={colors.dark} />
              <Text style={styles.exportBtnText}>تصدير 📑</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={styles.badgeRow}>
                <Text style={styles.badge}>مالك المنصة 👑</Text>
                <Crown size={18} color={colors.primary} />
              </View>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '900', marginTop: 2 }}>
                {user?.name?.trim() ? user.name : 'إدارة منصة TecnoRexa'}
              </Text>
              <Text style={{ color: colors.gray, fontSize: 11, marginTop: 1 }}>
                أهلاً بك سيادة المالك في غرفة القيادة
              </Text>
            </View>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#1E1B13',
                borderWidth: 1.5,
                borderColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '900' }}>
                {user?.name && user.name.trim().length > 0
                  ? user.name.trim().charAt(0)
                  : '👑'}
              </Text>
            </View>
          </View>
        </View>

        {/* Drawer Quick Callout Banner */}
        <TouchableOpacity
          onPress={() => setDrawerVisible(true)}
          style={styles.drawerBanner}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ChevronRight size={18} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>تصفح الآن</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>
                {`${OWNER_SECTIONS.length} قسماً إدارياً ورقابياً بانتظارك`}
              </Text>
              <Sparkles size={16} color={colors.primary} />
            </View>
            <Text style={{ color: colors.gray, fontSize: 11 }}>
              اضغط هنا أو على أيقونة الـ ☰ لفتح القائمة الجانبية الكاملة
            </Text>
          </View>
        </TouchableOpacity>

        {/* Period Filter Tabs */}
        <View style={styles.tabRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[styles.tab, selectedPeriod === p.value && styles.tabActive]}
              onPress={() => setSelectedPeriod(p.value)}
            >
              <Text style={[styles.tabText, selectedPeriod === p.value && styles.tabTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 6 Real KPI Cards as requested */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>مؤشرات تشغيلية حية 🟢</Text>
          <Text style={styles.sectionTitle}>مؤشرات الأداء الرئيسية</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.kpiGrid}>
            {/* KPI 1: إجمالي الإيرادات */}
            <View style={styles.kpiCard}>
              <View style={styles.kpiHeaderRow}>
                <View style={[styles.kpiIconBox, { backgroundColor: colors.primary + '22' }]}>
                  <DollarSign size={18} color={colors.primary} />
                </View>
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>مبيعات + اشتراكات</Text>
              </View>
              <Text style={styles.kpiValue}>
                {stats.totalRevenue > 0 ? `${stats.totalRevenue.toLocaleString()} ج.م` : '0 ج.م'}
              </Text>
              <Text style={styles.kpiLabel}>
                {stats.totalRevenue === 0 ? 'لا توجد إيرادات مسجلة بعد' : 'إجمالي أرباح المنصة'}
              </Text>
            </View>

            {/* KPI 2: المستخدمون النشطون */}
            <View style={[styles.kpiCard, stats.isUsersLow && { borderColor: '#F59E0B' }]}>
              <View style={styles.kpiHeaderRow}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#3B82F622' }]}>
                  <Users size={18} color="#3B82F6" />
                </View>
                {stats.isUsersLow && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                    <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '900' }}>أقل من 100</Text>
                    <AlertTriangle size={12} color="#F59E0B" />
                  </View>
                )}
              </View>
              <Text style={styles.kpiValue}>{stats.activeUsers}</Text>
              <Text style={styles.kpiLabel}>المستخدمون النشطون</Text>
            </View>

            {/* KPI 3: الطلبات الجديدة اليوم */}
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => navigation.navigate('Orders')}
            >
              <View style={styles.kpiHeaderRow}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#10B98122' }]}>
                  <ShoppingCart size={18} color="#10B981" />
                </View>
                <Text style={{ fontSize: 11, color: '#10B981', fontWeight: '700' }}>عرض الطلبات ↗</Text>
              </View>
              <Text style={styles.kpiValue}>{stats.todayOrders}</Text>
              <Text style={styles.kpiLabel}>الطلبات الجديدة اليوم</Text>
            </TouchableOpacity>

            {/* KPI 4: الفنيون المتاحون */}
            <View
              style={[
                styles.kpiCard,
                stats.availableTechnicians === 0 && { backgroundColor: '#181818', borderColor: '#444' },
              ]}
            >
              <View style={styles.kpiHeaderRow}>
                <View style={[styles.kpiIconBox, { backgroundColor: stats.availableTechnicians === 0 ? '#444' : '#F59E0B22' }]}>
                  <Wrench size={18} color={stats.availableTechnicians === 0 ? '#888' : '#F59E0B'} />
                </View>
                <Text style={{ fontSize: 11, color: stats.availableTechnicians === 0 ? '#888' : '#F59E0B', fontWeight: '700' }}>
                  {stats.availableTechnicians > 0 ? 'جاهزون الآن' : 'غير متوفر'}
                </Text>
              </View>
              <Text style={[styles.kpiValue, stats.availableTechnicians === 0 && { color: '#888' }]}>
                {stats.availableTechnicians}
              </Text>
              <Text style={styles.kpiLabel}>
                {stats.availableTechnicians === 0 ? 'لا يوجد فنيين متاحين' : 'الفنيون المتاحون'}
              </Text>
            </View>

            {/* KPI 5: تذاكر الدعم العالقة */}
            <TouchableOpacity
              style={[
                styles.kpiCard,
                stats.isTicketsFlashing && { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.15)' },
              ]}
              onPress={() => navigation.navigate('Tickets')}
            >
              <View style={styles.kpiHeaderRow}>
                <View style={[styles.kpiIconBox, { backgroundColor: stats.isTicketsFlashing ? '#EF4444' : '#EF444422' }]}>
                  <Headphones size={18} color={stats.isTicketsFlashing ? '#FFF' : '#EF4444'} />
                </View>
                {stats.isTicketsFlashing ? (
                  <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: '900' }}>⚠️ خطر: تتجاوز 20</Text>
                ) : (
                  <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '700' }}>مفتوحة</Text>
                )}
              </View>
              <Text style={[styles.kpiValue, stats.isTicketsFlashing && { color: '#EF4444' }]}>
                {stats.pendingTickets}
              </Text>
              <Text style={styles.kpiLabel}>تذاكر الدعم العالقة</Text>
            </TouchableOpacity>

            {/* KPI 6: المبالغ تحت الصرف */}
            <TouchableOpacity
              style={styles.kpiCard}
              onPress={() => navigation.navigate('Wallet')}
            >
              <View style={styles.kpiHeaderRow}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#8B5CF622' }]}>
                  <Wallet size={18} color="#8B5CF6" />
                </View>
                <Text style={{ fontSize: 11, color: '#8B5CF6', fontWeight: '700' }}>سحب أرباح ↗</Text>
              </View>
              <Text style={styles.kpiValue}>
                {stats.pendingWithdrawalsAmount > 0 ? `${stats.pendingWithdrawalsAmount.toLocaleString()} ج.م` : '0 ج.م'}
              </Text>
              <Text style={styles.kpiLabel}>المبالغ تحت الصرف</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Two Charts Section: Weekly Growth & Revenue Distribution */}
        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.sectionTitle}>مخططات النمو وتوزيع الإيرادات 📊</Text>

          {/* Chart 1: Weekly Growth Curve */}
          <View style={styles.chartCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />
                  <Text style={{ color: colors.gray, fontSize: 11 }}>طلبات مكتملة</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6' }} />
                  <Text style={{ color: colors.gray, fontSize: 11 }}>مستخدمين جدد</Text>
                </View>
              </View>
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>منحنى النمو الأسبوعي</Text>
            </View>

            {/* Custom Bar Graph for React Native Web & Mobile */}
            {(!stats.weeklyGrowth || stats.weeklyGrowth.length === 0) ? (
              <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.gray, fontSize: 12 }}>لا توجد بيانات نمو مسجلة لهذه الفترة بعد</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingTop: 20 }}>
                {stats.weeklyGrowth.map((d: any, idx: number) => {
                  const userBarH = Math.min(Math.max((d.newUsers / 40) * 90, 15), 90);
                  const orderBarH = Math.min(Math.max((d.completedOrders / 30) * 90, 12), 90);

                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => setSelectedChartPoint(d)}
                      style={{ alignItems: 'center', flex: 1 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                        <View style={{ width: 8, height: userBarH, backgroundColor: '#3B82F6', borderRadius: 4 }} />
                        <View style={{ width: 8, height: orderBarH, backgroundColor: colors.primary, borderRadius: 4 }} />
                      </View>
                      <Text style={{ color: colors.gray, fontSize: 10, marginTop: 6 }}>{d.day}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {selectedChartPoint && (
              <View style={{ marginTop: spacing.md, padding: spacing.sm, backgroundColor: '#1A1A1A', borderRadius: borderRadius.md, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>طلبات: {selectedChartPoint.completedOrders}</Text>
                <Text style={{ color: '#3B82F6', fontWeight: '700', fontSize: 12 }}>مستخدمون: {selectedChartPoint.newUsers}</Text>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 12 }}>يوم {selectedChartPoint.day}</Text>
              </View>
            )}
          </View>

          {/* Chart 2: Revenue Distribution (Pie/Bar Breakdown) */}
          <TouchableOpacity
            style={styles.chartCard}
            onPress={() => setPieModalVisible(true)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>اضغط للتفاصيل ℹ️</Text>
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>توزيع مصادر الإيرادات</Text>
            </View>

            {/* Segmented Percentage Bar */}
            <View style={{ height: 16, backgroundColor: '#222', borderRadius: 8, overflow: 'hidden', flexDirection: 'row', marginVertical: spacing.sm }}>
              <View style={{ flex: stats.revenueBreakdown?.marketplace ?? 0, backgroundColor: colors.primary }} />
              <View style={{ flex: stats.revenueBreakdown?.subscriptions ?? 0, backgroundColor: '#3B82F6' }} />
              <View style={{ flex: stats.revenueBreakdown?.courses ?? 0, backgroundColor: '#10B981' }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                <Text style={{ color: colors.gray, fontSize: 11 }}>كورسات ({stats.revenueBreakdown?.courses}%)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6' }} />
                <Text style={{ color: colors.gray, fontSize: 11 }}>اشتراكات فنيين ({stats.revenueBreakdown?.subscriptions}%)</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                <Text style={{ color: colors.gray, fontSize: 11 }}>مبيعات السوق ({stats.revenueBreakdown?.marketplace}%)</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Table 1: Top 5 Technicians */}
        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.sectionTitle}>أفضل 5 فنيين أداءً 🏆</Text>
          <View style={styles.tableCard}>
            {stats.topTechnicians.length === 0 ? (
              <Text style={{ color: colors.gray, textAlign: 'center', padding: spacing.md }}>لا يوجد فنيين مسجلين بعد</Text>
            ) : (
              stats.topTechnicians.map((t: any, idx: number) => (
                <View key={t.id || idx} style={[styles.tableRow, idx === stats.topTechnicians.length - 1 && { borderBottomWidth: 0 }]}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('NewChat')}
                    style={styles.chatActionBtn}
                  >
                    <MessageCircle size={14} color={colors.dark} />
                    <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 11 }}>مراسلة</Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>{t.rating}</Text>
                    <Star size={13} color={colors.primary} fill={colors.primary} />
                    <Text style={{ color: colors.gray, fontSize: 11, marginLeft: 4 }}>({t.orders} طلب)</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    {t.specialty ? (
                      <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                        {String(t.specialty)
                          .split(/[,،]/)
                          .map((s: string) => s.trim())
                          .filter(Boolean)
                          .map((spec: string, sIdx: number) => (
                            <View
                              key={sIdx}
                              style={{
                                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                                borderColor: colors.primary,
                                borderWidth: 0.5,
                                paddingHorizontal: 6,
                                paddingVertical: 1,
                                borderRadius: 6,
                              }}
                            >
                              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>
                                🔧 {spec}
                              </Text>
                            </View>
                          ))}
                      </View>
                    ) : (
                      <Text style={{ color: colors.gray, fontSize: 11 }}>صيانة منزلية</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Table 2: Top 5 Best-Selling Products */}
        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.sectionTitle}>أفضل 5 منتجات مبيعاً 🛍️</Text>
          <View style={styles.tableCard}>
            {stats.topProducts.length === 0 ? (
              <Text style={{ color: colors.gray, textAlign: 'center', padding: spacing.md }}>لا توجد منتجات في السوق حالياً</Text>
            ) : (
              stats.topProducts.map((p: any, idx: number) => (
                <View key={p.id || idx} style={[styles.tableRow, idx === stats.topProducts.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={{ alignItems: 'flex-start' }}>
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>{p.price} ج.م</Text>
                    <Text style={{ color: colors.gray, fontSize: 11 }}>{p.sales} مبيعات</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', flex: 1, paddingRight: spacing.sm }}>
                    <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{p.name}</Text>
                    <Text style={{ color: colors.gray, fontSize: 11 }}>فئة: {p.category}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Live Activity Feed */}
        <View style={{ marginTop: spacing.xl, marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>مباشر 🟢</Text>
            <Text style={styles.sectionTitle}>أحدث العمليات وسجل النظام</Text>
          </View>
          <View style={styles.feedCard}>
            {(!stats.liveActivities || stats.liveActivities.length === 0) ? (
              <Text style={{ color: colors.gray, textAlign: 'center', padding: spacing.md }}>لا توجد أنشطة مسجلة في سجل النظام حالياً</Text>
            ) : (
              stats.liveActivities.map((act: any, idx: number) => (
                <View key={act.id || idx} style={[styles.feedItem, idx === stats.liveActivities.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.feedTime}>{act.time ? new Date(act.time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: spacing.sm }}>
                    <Text style={styles.feedText}>{act.text}</Text>
                  </View>
                  <View style={styles.feedDot} />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Export Reports Modal */}
      <Modal visible={exportModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>تصدير تقارير المنصة 📑</Text>
            <Text style={styles.modalSub}>اختر الصيغة المناسبة لتصدير تقرير شامل لكافة العمليات:</Text>
            <View style={{ gap: spacing.sm, marginVertical: spacing.md }}>
              <TouchableOpacity onPress={() => handleExport('pdf')} style={styles.exportOption}>
                <Text style={styles.exportOptionText}>📄 تصدير بصيغة PDF (جاهز للطباعة)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleExport('excel')} style={styles.exportOption}>
                <Text style={styles.exportOptionText}>📊 تصدير بصيغة Excel (تحليل مالي متقدم)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleExport('csv')} style={styles.exportOption}>
                <Text style={styles.exportOptionText}>📁 تصدير بصيغة CSV (جداول خام)</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setExportModalVisible(false)} style={styles.closeModalBtn}>
              <Text style={styles.closeModalBtnText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Revenue Details Modal */}
      <Modal visible={pieModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>تفاصيل مصادر الأرباح 💰</Text>
            <View style={{ gap: spacing.md, marginVertical: spacing.md }}>
              <View style={{ backgroundColor: '#1A1A1A', padding: spacing.md, borderRadius: borderRadius.md }}>
                <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16, textAlign: 'right' }}>🛍️ مبيعات السوق ({stats.revenueBreakdown?.marketplace}%)</Text>
                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginTop: 4 }}>نسبة عمولة المنصة من قطع الغيار والأجهزة المباعة.</Text>
              </View>
              <View style={{ backgroundColor: '#1A1A1A', padding: spacing.md, borderRadius: borderRadius.md }}>
                <Text style={{ color: '#3B82F6', fontWeight: '900', fontSize: 16, textAlign: 'right' }}>🔧 اشتراكات الفنيين والتجار ({stats.revenueBreakdown?.subscriptions}%)</Text>
                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginTop: 4 }}>اشتراك الفني (300 ج.م) واشتراك التاجر (100 ج.م) شهرياً.</Text>
              </View>
              <View style={{ backgroundColor: '#1A1A1A', padding: spacing.md, borderRadius: borderRadius.md }}>
                <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 16, textAlign: 'right' }}>🎓 الدورات والكورسات التدريبية ({stats.revenueBreakdown?.courses}%)</Text>
                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginTop: 4 }}>مبيعات الكورسات التعليمية وحصص الفنيين.</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setPieModalVisible(false)} style={styles.closeModalBtn}>
              <Text style={styles.closeModalBtnText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  exportBtnText: {
    color: colors.dark,
    fontWeight: '900',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  greeting: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  drawerBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: colors.primary + '55',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.darkCard,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.gray,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.dark,
    fontWeight: '900',
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'right',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: colors.darkCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'flex-end',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xs,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 4,
  },
  kpiLabel: {
    color: colors.gray,
    fontSize: 11,
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: colors.darkCard,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  tableCard: {
    backgroundColor: colors.darkCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '55',
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  feedCard: {
    backgroundColor: colors.darkCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '55',
  },
  feedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  feedText: {
    color: colors.white,
    fontSize: 12,
    textAlign: 'right',
  },
  feedTime: {
    color: colors.gray,
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: '#141414',
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  modalSub: {
    color: colors.gray,
    fontSize: 12,
    textAlign: 'right',
  },
  exportOption: {
    backgroundColor: colors.darkCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exportOptionText: {
    color: colors.white,
    fontWeight: '700',
    textAlign: 'right',
  },
  closeModalBtn: {
    backgroundColor: colors.darkCard,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  closeModalBtnText: {
    color: colors.gray,
    fontWeight: '700',
  },
});
