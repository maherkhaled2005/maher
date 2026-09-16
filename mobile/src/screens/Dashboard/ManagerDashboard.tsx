import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Share,
} from 'react-native';
import {
  Briefcase,
  CheckCircle,
  Clock,
  ShoppingBag,
  Ticket,
  BarChart2,
  ChevronRight,
  Users,
  Wrench,
  MessageCircle,
  FileCheck,
  Check,
  X,
  Building2,
  Megaphone,
  Film,
  AlertCircle,
  Download,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, borderRadius } from '../../theme';
import { api } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';
import { generateExecutiveReportHTML, exportExecutiveCSV } from '../../utils/executiveReport';

export default function ManagerDashboard({ navigation }: any) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);

  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    openTickets: 0,
    activeTechs: 0,
    pendingUpgrades: 0,
    pendingProducts: 0,
  });

  const [pendingProductsList, setPendingProductsList] = useState<any[]>([]);
  const [pendingUpgradesList, setPendingUpgradesList] = useState<any[]>([]);

  const loadManagerData = async () => {
    try {
      // 1. Fetch Manager KPIs
      const kpisRes = await api.get('/manager/kpis').catch(() => null);
      // 2. Fetch Orders
      const ordersRes = await api.get('/orders').catch(() => null);
      // 3. Fetch Tickets
      const ticketsRes = await api.get('/support/tickets').catch(() => null);
      // 4. Fetch Technicians
      const techsRes = await api.get('/technicians').catch(() => null);
      // 5. Fetch Products
      const prodsRes = await api.get('/products').catch(() => null);
      // 6. Fetch Upgrades
      const upgRes = await api.get('/trade-requests').catch(() => null);

      const allOrders = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
      const allTickets = Array.isArray(ticketsRes?.data) ? ticketsRes.data : [];
      const allTechs = Array.isArray(techsRes?.data) ? techsRes.data : [];
      const allProds = Array.isArray(prodsRes?.data) ? prodsRes.data : [];
      const allUpgs = Array.isArray(upgRes?.data) ? upgRes.data : [];

      const pendingOrdersCount = allOrders.filter((o: any) => o.status === 'pending').length;
      const openTicketsCount = allTickets.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length;
      const pendingProds = allProds.filter((p: any) => p.status === 'pending');
      const pendingUpgs = allUpgs.filter((u: any) => u.status === 'pending');

      setStats({
        todayOrders: allOrders.length,
        pendingOrders: pendingOrdersCount,
        openTickets: openTicketsCount,
        activeTechs: allTechs.length,
        pendingUpgrades: pendingUpgs.length,
        pendingProducts: pendingProds.length,
      });

      setPendingProductsList(pendingProds.slice(0, 3));
      setPendingUpgradesList(pendingUpgs.slice(0, 3));
    } catch (e) {
      console.error('Failed to load manager data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadManagerData();
  }, []);

  const handleApproveProduct = async (id: string) => {
    try {
      const res = await api.post(`/products/${id}/approve`);
      if (res.data?.success) {
        setPendingProductsList(prev => prev.filter(p => p.id !== id));
        setStats(prev => ({ ...prev, pendingProducts: Math.max(0, prev.pendingProducts - 1) }));
        Alert.alert('نجاح', 'تم اعتماد المنتج وتفعيله في السوق');
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر اعتماد المنتج');
    }
  };

  const handleBlockProduct = async (id: string) => {
    try {
      const res = await api.post(`/products/${id}/block`, { reason: 'ملاحظات إدارية من المدير العام' });
      if (res.data?.success) {
        setPendingProductsList(prev => prev.filter(p => p.id !== id));
        setStats(prev => ({ ...prev, pendingProducts: Math.max(0, prev.pendingProducts - 1) }));
        Alert.alert('تنبيه', 'تم حظر المنتج وإرسال الملاحظات للمتجر');
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر حظر المنتج');
    }
  };

  const handleApproveUpgrade = async (id: string) => {
    try {
      const res = await api.post(`/trade-requests/${id}/approve`);
      if (res.data?.success) {
        setPendingUpgradesList(prev => prev.filter(u => u.id !== id));
        setStats(prev => ({ ...prev, pendingUpgrades: Math.max(0, prev.pendingUpgrades - 1) }));
        Alert.alert('نجاح', 'تم قبول ترقية الفني بنجاح');
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر ترقية الفني');
    }
  };

  const managerSections = [
    { label: 'إدارة وتوجيه الطلبات', desc: 'متابعة الطلبات وتعيين الفنيين', icon: ShoppingBag, screen: 'Orders', color: '#3B82F6' },
    { label: 'فحص واعتماد المنتجات', desc: 'مراجعة المنتجات والموافقة أو الحظر', icon: ShoppingBag, screen: 'Marketplace', color: '#8B5CF6' },
    { label: 'تذاكر الدعم والشكاوى', desc: 'حل الشكاوى وتوزيع التذاكر', icon: Ticket, screen: 'Tickets', color: '#EF4444' },
    { label: 'فريق الفنيين وترقياتهم', desc: 'متابعة الفنيين واعتماد الرسوم', icon: Wrench, screen: 'TechniciansTeam', color: '#10B981' },
    { label: 'المخازن والتوريدات', desc: 'متابعة حركة المخزون في المستودعات', icon: Building2, screen: 'Warehouses', color: '#EC4899' },
    { label: 'المستخدمين والموظفين', desc: 'إدارة حسابات الموظفين والعملاء', icon: Users, screen: 'AdminUsers', color: '#6366F1' },
    { label: 'محادثات الدعم والعمليات', desc: 'متابعة سير المحادثات المباشرة', icon: MessageCircle, screen: 'ChatList', color: '#06B6D4' },
    { label: 'المركز الإعلامي والريلز', desc: 'مراجعة مقاطع الفيديو المرفوعة', icon: Film, screen: 'MediaApproval', color: '#F43F5E' },
    { label: 'الحملات التسويقية', desc: 'متابعة عروض التخفيض والكوبونات', icon: Megaphone, screen: 'Marketing', color: '#14B8A6' },
    { label: 'التقارير التشغيلية', desc: 'معدلات الإنجاز وأداء فرق العمل', icon: BarChart2, screen: 'AuditLogs', color: colors.primary },
  ];

  const handleExport = (type: 'pdf' | 'excel' | 'csv') => {
    setExportModalVisible(false);
    const reportData = {
      period: '30d',
      totalRevenue: 0,
      activeUsers: stats.activeTechs,
      todayOrders: stats.todayOrders,
      availableTechnicians: stats.activeTechs,
      pendingTickets: stats.openTickets,
      pendingWithdrawalsAmount: 0,
      ownerName: 'إدارة منصة TecnoRexa',
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
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `TecnoRexa_Operations_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      Alert.alert('✅ تم بنجاح', `تم تجهيز وتصدير التقرير التشغيلي بصيغة ${type.toUpperCase()}`);
    } else {
      try {
        const textSummary = `📑 تقرير غرفة العمليات والرقابة - TecnoRexa\n\n👔 المسؤول: المدير العام\n📦 الطلبات قيد المتابعة: ${reportData.todayOrders}\n🔧 الفنيين النشطين: ${reportData.availableTechnicians}\n🎧 تذاكر الدعم المفتوحة: ${reportData.pendingTickets}`;
        Share.share({
          title: 'تقرير غرفة العمليات التشغيلي',
          message: type === 'csv' ? exportExecutiveCSV(reportData) : textSummary,
        });
      } catch (err: any) {
        Alert.alert('✅ تم التصدير', `تم إعداد وتصدير تقرير المنظومة التشغيلي بصيغة ${type.toUpperCase()}`);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Role Header with ☰ Drawer */}
      <OwnerHeader
        title="غرفة العمليات والرقابة"
        subtitle={`مرحباً بك، ${user?.name || 'المدير العام'} 👔`}
        sectionNumber={1}
        navigation={navigation}
        currentScreen="Home"
        onRefresh={onRefresh}
        rightAction={
          <TouchableOpacity
            style={styles.exportHeaderBtn}
            onPress={() => setExportModalVisible(true)}
            activeOpacity={0.8}
          >
            <Download size={14} color="#0A0A0A" />
            <Text style={styles.exportHeaderBtnText}>تصدير 📑</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>جاري تحميل لوحة العمليات التشغيلية...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6"
            />
          }
        >
          {/* 6 Operational KPIs */}
          <Text style={styles.sectionHeader}>📊 مؤشرات الأداء التشغيلي (KPIs)</Text>
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { borderColor: '#3B82F6' }]}>
              <ShoppingBag size={20} color="#3B82F6" />
              <Text style={styles.kpiValue}>{stats.todayOrders}</Text>
              <Text style={styles.kpiLabel}>إجمالي الطلبات</Text>
            </View>

            <View style={[styles.kpiCard, { borderColor: '#F59E0B' }]}>
              <Clock size={20} color="#F59E0B" />
              <Text style={[styles.kpiValue, { color: '#F59E0B' }]}>{stats.pendingOrders}</Text>
              <Text style={styles.kpiLabel}>طلبات معلقة</Text>
            </View>

            <View style={[styles.kpiCard, { borderColor: '#EF4444' }]}>
              <Ticket size={20} color="#EF4444" />
              <Text style={[styles.kpiValue, { color: '#EF4444' }]}>{stats.openTickets}</Text>
              <Text style={styles.kpiLabel}>تذاكر مفتوحة</Text>
            </View>

            <View style={[styles.kpiCard, { borderColor: '#10B981' }]}>
              <Wrench size={20} color="#10B981" />
              <Text style={[styles.kpiValue, { color: '#10B981' }]}>{stats.activeTechs}</Text>
              <Text style={styles.kpiLabel}>فنيين في الخدمة</Text>
            </View>

            <View style={[styles.kpiCard, { borderColor: colors.primary }]}>
              <FileCheck size={20} color={colors.primary} />
              <Text style={[styles.kpiValue, { color: colors.primary }]}>{stats.pendingUpgrades}</Text>
              <Text style={styles.kpiLabel}>طلبات ترقية</Text>
            </View>

            <View style={[styles.kpiCard, { borderColor: '#8B5CF6' }]}>
              <ShoppingBag size={20} color="#8B5CF6" />
              <Text style={[styles.kpiValue, { color: '#8B5CF6' }]}>{stats.pendingProducts}</Text>
              <Text style={styles.kpiLabel}>منتجات للمراجعة</Text>
            </View>
          </View>

          {/* Pending Products for Review */}
          {pendingProductsList.length > 0 && (
            <View style={styles.actionBlock}>
              <View style={styles.blockHeader}>
                <AlertCircle size={18} color="#8B5CF6" />
                <Text style={styles.blockTitle}>منتجات بانتظار الاعتماد السريع ({pendingProductsList.length})</Text>
              </View>
              {pendingProductsList.map(prod => (
                <View key={prod.id} style={styles.pendingItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingItemTitle}>{prod.name}</Text>
                    <Text style={styles.pendingItemSub}>
                      السعر: {prod.price} ج.م | البائع: {prod.sellerName || 'تاجر معتمد'}
                    </Text>
                  </View>
                  <View style={styles.itemBtnGroup}>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => handleApproveProduct(prod.id)}
                    >
                      <Check size={14} color="#FFF" />
                      <Text style={styles.btnText}>اعتماد</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.blockBtn}
                      onPress={() => handleBlockProduct(prod.id)}
                    >
                      <X size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Pending Tech Upgrades */}
          {pendingUpgradesList.length > 0 && (
            <View style={styles.actionBlock}>
              <View style={styles.blockHeader}>
                <FileCheck size={18} color={colors.primary} />
                <Text style={styles.blockTitle}>طلبات ترقية فنيين (سداد 300 ج.م)</Text>
              </View>
              {pendingUpgradesList.map(upg => (
                <View key={upg.id} style={styles.pendingItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingItemTitle}>{upg.technicianName || upg.userName || 'فني متخصص'}</Text>
                    <Text style={styles.pendingItemSub}>
                      التخصص: {upg.specialty || 'صيانة عامة'} | الرسوم: {upg.fee || 300} ج.م
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.approveBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleApproveUpgrade(upg.id)}
                  >
                    <Check size={14} color="#0A0A0A" />
                    <Text style={[styles.btnText, { color: '#0A0A0A' }]}>ترقية</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Manager Operational Sections */}
          <Text style={[styles.sectionHeader, { marginTop: 8 }]}>🛠️ غرف العمليات والإدارة التنفيذية</Text>
          <View style={styles.sectionsList}>
            {managerSections.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.sectionRow}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate(sec.screen)}
                >
                  <ChevronRight size={18} color={colors.gray} />
                  <View style={styles.sectionRowText}>
                    <Text style={styles.sectionRowTitle}>{sec.label}</Text>
                    <Text style={styles.sectionRowDesc}>{sec.desc}</Text>
                  </View>
                  <View style={[styles.sectionIconBox, { backgroundColor: sec.color + '22' }]}>
                    <Icon size={20} color={sec.color} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Export Reports Modal */}
      <Modal visible={exportModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>تصدير تقارير غرفة العمليات 📑</Text>
            <Text style={styles.modalSub}>اختر الصيغة المناسبة لتصدير تقرير شامل للعمليات والطلبات والتذاكر:</Text>
            <View style={{ gap: spacing.sm, marginVertical: spacing.md }}>
              <TouchableOpacity onPress={() => handleExport('pdf')} style={styles.exportOption}>
                <Text style={styles.exportOptionText}>📄 تصدير بصيغة PDF (جاهز للطباعة والاعتماد)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleExport('excel')} style={styles.exportOption}>
                <Text style={styles.exportOptionText}>📊 تصدير بصيغة Excel (تحليل تشغيلي وجداول)</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleExport('csv')} style={styles.exportOption}>
                <Text style={styles.exportOptionText}>📁 تصدير بصيغة CSV (بيانات خام)</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => setExportModalVisible(false)} style={styles.closeModalBtn}>
              <Text style={styles.closeModalBtnText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderBottomColor: '#1E40AF',
  },
  headerTitleRow: {
    gap: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  welcomeText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  userName: {
    color: colors.primary,
  },
  profileBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  profileBtnText: {
    color: colors.primary,
    fontSize: 12,
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 14,
    paddingBottom: 150,
  },
  sectionHeader: {
    color: colors.white,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: '#141414',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  kpiValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
  },
  kpiLabel: {
    color: colors.gray,
    fontSize: 10,
    textAlign: 'center',
  },
  actionBlock: {
    backgroundColor: '#141414',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#262626',
    gap: 10,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 6,
  },
  blockTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 8,
  },
  pendingItemTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  pendingItemSub: {
    color: colors.gray,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 2,
  },
  itemBtnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  blockBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sectionsList: {
    backgroundColor: '#141414',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
    gap: 12,
  },
  sectionRowText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionRowTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionRowDesc: {
    color: colors.gray,
    fontSize: 11,
    marginTop: 2,
  },
  sectionIconBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  exportHeaderBtnText: {
    color: '#0A0A0A',
    fontWeight: '900',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: '#141414',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 450,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSub: {
    color: colors.gray,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  exportOption: {
    backgroundColor: '#1E1E1E',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#333',
  },
  exportOptionText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'right',
  },
  closeModalBtn: {
    backgroundColor: '#262626',
    padding: spacing.sm + 4,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  closeModalBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
