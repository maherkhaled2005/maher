// src/screens/Analytics/AnalyticsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Platform,
  Alert,
  Share,
} from 'react-native';
import {
  ShoppingBag,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Star,
  Clock,
  Award,
  Download,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card, Loading } from '../../components/common';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import OwnerHeader from '../../components/OwnerHeader';
import { generateExecutiveReportHTML, exportExecutiveCSV } from '../../utils/executiveReport';

const StatCard = ({ title, value, icon: Icon, color, subtitle, growth }: any) => (
  <View
    style={{
      flex: 1,
      minWidth: '47%',
      marginHorizontal: '1.5%',
      marginBottom: spacing.md,
      backgroundColor: '#141414',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.2)',
    }}
  >
    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: colors.gray, fontSize: typography.sizes.xs, fontWeight: '700', marginBottom: 2 }}>
          {title}
        </Text>
        <Text style={{ color: colors.white, fontSize: typography.sizes.xxl, fontWeight: '900' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        {growth !== undefined && (
          <Text style={{ color: growth >= 0 ? colors.success : colors.danger, fontSize: typography.sizes.xs, fontWeight: '700', marginTop: 2 }}>
            {growth >= 0 ? '▲ +' : '▼ -'}{Math.abs(growth)}%
          </Text>
        )}
      </View>
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: color + '22', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: color + '44' }}>
        <Icon color={color} size={20} />
      </View>
    </View>
    {subtitle && <Text style={{ color: colors.gray, fontSize: typography.sizes.xs, textAlign: 'right', marginTop: 4 }}>{subtitle}</Text>}
  </View>
);

const BarChart = ({ data, color = colors.primary }: { data: { label: string; value: number }[]; color?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'flex-end', height: 130, paddingVertical: 8 }}>
      {data.map((item, i) => {
        const barHeight = Math.max((item.value / max) * 85, 12);
        return (
          <View key={i} style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '800', marginBottom: 4 }}>
              {item.value >= 1 ? `${Math.round(item.value)}k` : `${Math.round(item.value * 1000)}`}
            </Text>
            <View
              style={{
                width: 22,
                height: barHeight,
                backgroundColor: color,
                borderRadius: 6,
                marginBottom: 6,
                shadowColor: color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
              }}
            />
            <Text style={{ color: colors.gray, fontSize: 11, fontWeight: '700' }}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default function AnalyticsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const fetchAnalytics = async () => {
    try {
      const response = await fetchApi(`/analytics?period=${period}`);
      if (response && response.revenue) {
        setData(response);
      } else {
        throw new Error('fallback');
      }
    } catch {
      setData({
        revenue: {
          total: 0,
          growth: 0,
          breakdown: { marketplace: 0, subscriptions: 0, courses: 0 },
          weekly: [
            { day: 'السبت', amount: 0 },
            { day: 'الأحد', amount: 0 },
            { day: 'الإثنين', amount: 0 },
            { day: 'الثلاثاء', amount: 0 },
            { day: 'الأربعاء', amount: 0 },
            { day: 'الخميس', amount: 0 },
            { day: 'الجمعة', amount: 0 },
          ],
        },
        users: { total: 0, new: 0, active: 0, growth: 0, byRole: [] },
        orders: { total: 0, pending: 0, completed: 0, growth: 0, byType: [] },
        technicians: {
          total: 0,
          active: 0,
          top: [],
        },
        tickets: { open: 0, resolved: 0, avgResponseTime: 0 },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalytics();
  }, [period]);

  const handleExport = (type: 'pdf' | 'csv' = 'pdf') => {
    const reportData = {
      period,
      totalRevenue: data?.revenue?.total || 0,
      activeUsers: data?.users?.total || 0,
      todayOrders: data?.orders?.completed || 0,
      availableTechnicians: data?.technicians?.active || 0,
      pendingTickets: data?.tickets?.open || 0,
      pendingWithdrawalsAmount: 0,
      revenueBreakdown: data?.revenue?.breakdown,
      topTechnicians: data?.technicians?.top || [],
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
        link.setAttribute("download", `TecnoRexa_Analytics_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      Alert.alert('✅ تم بنجاح', `تم تجهيز التقرير التنفيذي الشامل بصيغة ${type.toUpperCase()}`);
    } else {
      try {
        const textSummary = `📑 تقرير تحليلات TecnoRexa (${reportData.period})\n\n💰 الإيرادات الكلية: ${reportData.totalRevenue} ج.م\n👥 إجمالي المستخدمين: ${reportData.activeUsers}\n📦 الطلبات المنجزة: ${reportData.todayOrders}\n🔧 الفنيين النشطين: ${reportData.availableTechnicians}\n🎧 التذاكر المفتوحة: ${reportData.pendingTickets}`;
        Share.share({
          title: 'تقرير تحليلات منصة TecnoRexa',
          message: type === 'csv' ? exportExecutiveCSV(reportData) : textSummary,
        });
      } catch (err: any) {
        Alert.alert('✅ تم التصدير', `تم إعداد وتصدير تقرير التحليلات الشامل بصيغة ${type.toUpperCase()}`);
      }
    }
  };

  if (loading || !data) {
    return <Loading message="جاري إعداد التحليلات المتقدمة..." fullScreen />;
  }

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      <OwnerHeader
        title="التحليلات والتقارير المالية"
        subtitle="مؤشرات النمو، التدفقات النقدية، وإحصائيات الأداء"
        sectionNumber={4}
        navigation={navigation}
        showBack={true}
        currentScreen="Analytics"
        rightAction={
          <TouchableOpacity
            onPress={() => handleExport('pdf')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: borderRadius.md,
              gap: 4,
            }}
          >
            <Download size={15} color="#000" />
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 12 }}>تصدير</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Period Selector */}
        <View
          style={{
            flexDirection: 'row-reverse',
            justifyContent: 'center',
            gap: spacing.sm,
            marginBottom: spacing.lg,
            backgroundColor: '#141414',
            padding: 6,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: 'rgba(212, 175, 55, 0.2)',
          }}
        >
          {[
            { id: 'week', label: 'هذا الأسبوع 📅' },
            { id: 'month', label: 'هذا الشهر 📊' },
            { id: 'year', label: 'هذا العام 🏆' },
          ].map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setPeriod(p.id as any)}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                borderRadius: borderRadius.md,
                backgroundColor: period === p.id ? colors.primary : 'transparent',
              }}
            >
              <Text
                style={{
                  color: period === p.id ? '#000' : colors.gray,
                  fontWeight: '900',
                  fontSize: 13,
                }}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4 Main KPI Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <StatCard
            title="إجمالي الإيرادات"
            value={`${(data.revenue.total || 0).toLocaleString()} ج.م`}
            icon={DollarSign}
            color={colors.primary}
            growth={data.revenue.growth}
          />
          <StatCard
            title="المستخدمين النشطين"
            value={data.users.total}
            icon={Users}
            color="#3B82F6"
            growth={data.users.growth}
          />
          <StatCard
            title="الطلبات المنفذة"
            value={data.orders.total}
            icon={ShoppingBag}
            color="#10B981"
            growth={data.orders.growth}
          />
          <StatCard
            title="الفنيين المعتمدين"
            value={data.technicians.active}
            icon={Award}
            color="#8B5CF6"
            subtitle="متاحون للخدمة الآن 🟢"
          />
        </View>

        {/* Weekly Growth Bar Chart Card */}
        <View
          style={{
            backgroundColor: '#141414',
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: 'rgba(212, 175, 55, 0.25)',
            marginTop: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
              <BarChart3 color={colors.primary} size={20} />
              <Text style={{ color: colors.white, fontSize: typography.sizes.md, fontWeight: '900' }}>
                الإيرادات الأسبوعية (ج.م) 📈
              </Text>
            </View>
            <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>مباشر ⚡</Text>
            </View>
          </View>
          <BarChart data={data.revenue.weekly.map((d: any) => ({ label: d.day, value: d.amount / 1000 }))} color={colors.primary} />
          <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right', marginTop: spacing.sm }}>
            * القيم بالآلاف (ج.م) ومحدثة وفق معاملات منصة TecnoRexa
          </Text>
        </View>

        {/* Revenue Distribution Doughnut Breakdown Card */}
        <View
          style={{
            backgroundColor: '#141414',
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            marginTop: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
              <PieChart color={colors.primary} size={20} />
              <Text style={{ color: colors.white, fontSize: typography.sizes.md, fontWeight: '900' }}>
                توزيع مصادر الإيرادات 🍩
              </Text>
            </View>
            <Text style={{ color: colors.gray, fontSize: 12 }}>100% الإجمالي</Text>
          </View>

          <View style={{ gap: spacing.md }}>
            {[
              { label: 'عمولات متجر قطع الغيار (Marketplace)', value: data.revenue.breakdown.marketplace, color: '#3B82F6' },
              { label: 'اشتراكات الفنيين والتجار (Subscriptions)', value: data.revenue.breakdown.subscriptions, color: '#8B5CF6' },
              { label: 'مبيعات الكورسات التقنية (Courses)', value: data.revenue.breakdown.courses, color: colors.primary },
            ].map((item, i) => {
              const pct = data.revenue.total > 0 ? ((item.value / data.revenue.total) * 100).toFixed(1) : '0';
              return (
                <View key={i}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: colors.white, fontWeight: '800', fontSize: 13 }}>{item.label}</Text>
                    <Text style={{ color: item.color, fontWeight: '900', fontSize: 13 }}>
                      {Number(item.value).toLocaleString()} ج.م ({pct}%)
                    </Text>
                  </View>
                  <View style={{ height: 8, backgroundColor: '#222222', borderRadius: 4, overflow: 'hidden' }}>
                    <View style={{ height: 8, width: `${pct}%` as any, backgroundColor: item.color, borderRadius: 4 }} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Top Technicians List Card */}
        <View
          style={{
            backgroundColor: '#141414',
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.08)',
            marginTop: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
              <Star color={colors.primary} size={20} fill={colors.primary} />
              <Text style={{ color: colors.white, fontSize: typography.sizes.md, fontWeight: '900' }}>
                أفضل الفنيين أداءً وتصنيفاً 🏆
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('TechniciansTeam')}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>عرض الفريق</Text>
            </TouchableOpacity>
          </View>

          {(!data.technicians.top || data.technicians.top.length === 0) ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
              <Text style={{ color: colors.gray, fontSize: 13, fontWeight: '700' }}>لا يوجد فنيين مسجلين بعد</Text>
            </View>
          ) : (
            data.technicians.top.map((tech: any, i: number) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row-reverse',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  borderBottomWidth: i < data.technicians.top.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>{tech.name}</Text>
                  <Text style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}>{tech.jobs} مهمة صيانة ناجحة</Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(212, 175, 55, 0.12)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: 'rgba(212, 175, 55, 0.25)',
                  }}
                >
                  <Star color={colors.primary} size={13} fill={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>{tech.rating}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

