import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Linking,
} from 'react-native';
import {
  Package,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Wrench,
  ChevronRight,
  Printer,
  RefreshCw,
  RotateCcw,
  ArrowRight,
  ExternalLink,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { normalizeRole } from '../../utils/permissions';
import OwnerHeader from '../../components/OwnerHeader';

export interface OrderRecord {
  id: string;
  userId?: string;
  technicianId?: string;
  sellerId?: string;
  type: 'maintenance' | 'purchase' | string;
  status: 'pending' | 'in_progress' | 'on_way' | 'completed' | 'cancelled' | string;
  items?: any; // JSON string or array
  total: number;
  customerName?: string;
  serviceType?: string;
  location?: string;
  createdAt: string;
  technicianName?: string;
  sellerName?: string;
}

const ORDER_TABS = [
  { key: 'all', label: 'جميع الطلبات' },
  { key: 'maintenance', label: '🔧 صيانة' },
  { key: 'purchase', label: '🛍️ شراء' },
  { key: 'pending', label: '⏳ معلقة' },
  { key: 'cancelled', label: '❌ ملغاة' },
];

export default function OrdersScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role || 'customer');

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);

  // Filter states
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Status Change Modal
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  // Reassign Modal
  const [reassignModalVisible, setReassignModalVisible] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');

  // Print Invoice Modal
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);

  // Tech Report Modal
  const [techReportModalVisible, setTechReportModalVisible] = useState(false);
  const [techReportText, setTechReportText] = useState('');
  const [techPartsCost, setTechPartsCost] = useState('0');

  // Merchant Ship Modal
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/orders');
      if (Array.isArray(data)) {
        setOrders(data);
      }
      // Also load technicians for reassigning
      const techs = await fetchApi('/technicians');
      if (Array.isArray(techs)) {
        setTechnicians(techs);
      }
    } catch (err: any) {
      console.warn('Error loading orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, []);

  // Tabs based on Role
  const orderTabs = (() => {
    if (role === 'customer') {
      return [
        { key: 'all', label: 'كل طلباتي' },
        { key: 'maintenance', label: '🔧 صيانة' },
        { key: 'purchase', label: '🛍️ مشتريات' },
        { key: 'pending', label: '⏳ جارية' },
        { key: 'completed', label: '✅ مكتملة' },
      ];
    }
    if (role === 'technician') {
      return [
        { key: 'all', label: 'مهامي' },
        { key: 'pending', label: '🆕 جديدة' },
        { key: 'in_progress', label: '⏳ قيد العمل' },
        { key: 'completed', label: '✅ منتهية' },
      ];
    }
    if (role === 'merchant') {
      return [
        { key: 'all', label: 'طلبات متجري' },
        { key: 'pending', label: '📦 للتجهيز' },
        { key: 'on_way', label: '🚚 مشحونة' },
        { key: 'completed', label: '✅ مسلمة' },
      ];
    }
    return [
      { key: 'all', label: 'جميع الطلبات' },
      { key: 'pending', label: '⏳ معلقة' },
      { key: 'maintenance', label: '🔧 صيانة' },
      { key: 'purchase', label: '🛍️ شراء' },
      { key: 'cancelled', label: '❌ ملغاة' },
    ];
  })();

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (role === 'customer') {
      if (o.userId && o.userId !== user?.id && orders.some(x => x.userId === user?.id)) return false;
    } else if (role === 'technician') {
      const isForMe = o.technicianId === user?.id || (!o.technicianId && o.type === 'maintenance') || o.type === 'maintenance';
      if (!isForMe) return false;
    } else if (role === 'merchant') {
      const isForMe = o.sellerId === user?.id || o.type === 'purchase';
      if (!isForMe) return false;
    }

    const inProgressStatuses = ['accepted', 'quoted', 'quote_approved', 'on_way', 'arrived', 'diagnosing', 'repairing', 'service_report_submitted', 'in_progress'];
    if (activeTab === 'maintenance' && o.type !== 'maintenance') return false;
    if (activeTab === 'purchase' && o.type !== 'purchase') return false;
    if (activeTab === 'pending' && o.status !== 'pending') return false;
    if (activeTab === 'in_progress' && !inProgressStatuses.includes(o.status)) return false;
    if (activeTab === 'on_way' && o.status !== 'on_way') return false;
    if (activeTab === 'completed' && o.status !== 'completed') return false;
    if (activeTab === 'cancelled' && o.status !== 'cancelled') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchCust = o.customerName ? o.customerName.toLowerCase().includes(q) : false;
      const matchService = o.serviceType ? o.serviceType.toLowerCase().includes(q) : false;
      if (!matchId && !matchCust && !matchService) return false;
    }

    return true;
  });

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: 'معلق', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)', icon: Clock, step: 1 };
      case 'accepted':
        return { label: 'تم القبول', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', icon: CheckCircle, step: 2 };
      case 'quoted':
        return { label: 'عرض سعر', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)', icon: DollarSign, step: 2 };
      case 'quote_approved':
        return { label: 'عرض مقبول', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle, step: 2 };
      case 'quote_rejected':
        return { label: 'عرض مرفوض', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.15)', icon: XCircle, step: 2 };
      case 'on_way':
        return { label: 'في الطريق', color: colors.primary, bg: 'rgba(212, 175, 55, 0.15)', icon: Truck, step: 3 };
      case 'arrived':
        return { label: 'وصل الفني', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.15)', icon: MapPin, step: 3 };
      case 'diagnosing':
        return { label: 'فحص وتشخيص', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.15)', icon: Wrench, step: 3 };
      case 'repairing':
        return { label: 'جاري الإصلاح', color: colors.primary, bg: 'rgba(212, 175, 55, 0.15)', icon: Wrench, step: 3 };
      case 'service_report_submitted':
        return { label: 'تقرير الصيانة جاهز', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', icon: FileText, step: 4 };
      case 'in_progress':
        return { label: 'قيد التنفيذ', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', icon: Package, step: 2 };
      case 'completed':
        return { label: 'مكتمل', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle, step: 5 };
      case 'cancelled':
        return { label: 'ملغي ومسترجع', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.15)', icon: XCircle, step: 0 };
      default:
        return { label: status, color: colors.gray, bg: '#222', icon: Package, step: 1 };
    }
  };

  const parseItems = (raw: any): any[] => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Open Order Details
  const handleOpenDetails = (order: OrderRecord) => {
    if (navigation?.navigate) {
      navigation.navigate('OrderDetails', { orderId: order.id });
    } else {
      setSelectedOrder(order);
      setDetailsModalVisible(true);
    }
  };

  // Customer Cancel (< 10 minutes limit)
  const handleCustomerCancel = async (order: OrderRecord) => {
    const elapsedMinutes = (Date.now() - new Date(order.createdAt).getTime()) / (60 * 1000);
    if (elapsedMinutes > 10) {
      Alert.alert('تنبيه', 'لا يمكن إلغاء الطلب بعد مرور أول 10 دقائق من تأكيده حيث تم تحويله للتنفيذ الفعلي.');
      return;
    }
    const confirm = Platform.OS === 'web'
      ? window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟')
      : true;
    if (!confirm) return;

    try {
      await fetchApi(`/orders/${order.id}/cancel`, { method: 'POST', data: { reason: 'إلغاء بواسطة العميل في أول 10 دقائق' } });
      const updated = { ...order, status: 'cancelled' };
      setOrders(orders.map((o) => (o.id === order.id ? updated : o)));
      if (selectedOrder?.id === order.id) setSelectedOrder(updated);
      Alert.alert('✅ تم الإلغاء', 'تم إلغاء طلبك بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إلغاء الطلب');
    }
  };

  // Technician Actions
  const handleTechAccept = async (order: OrderRecord) => {
    try {
      await fetchApi(`/orders/${order.id}/status`, { method: 'POST', data: { status: 'in_progress', technicianId: user?.id } });
      const updated = { ...order, status: 'in_progress', technicianId: user?.id, technicianName: user?.name };
      setOrders(orders.map((o) => (o.id === order.id ? updated : o)));
      if (selectedOrder?.id === order.id) setSelectedOrder(updated);
      Alert.alert('✅ تم قبول الطلب', 'تم قبول طلب الصيانة بنجاح، يرجى التوجه للعميل.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر قبول الطلب');
    }
  };

  const handleTechArrive = async (order: OrderRecord) => {
    try {
      await fetchApi(`/orders/${order.id}/arrive`, { method: 'POST' });
      const updated = { ...order, status: 'on_way' };
      setOrders(orders.map((o) => (o.id === order.id ? updated : o)));
      if (selectedOrder?.id === order.id) setSelectedOrder(updated);
      Alert.alert('✅ تم التحديث', 'تم تسجيل وصولك لموقع العميل وإشعار العميل.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تسجيل الوصول');
    }
  };

  const handleTechComplete = async () => {
    if (!selectedOrder) return;
    try {
      await fetchApi(`/orders/${selectedOrder.id}/complete`, {
        method: 'POST',
        data: { report: techReportText, partsCost: parseFloat(techPartsCost) || 0 }
      });
      const updated = { ...selectedOrder, status: 'completed' };
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updated : o)));
      setSelectedOrder(updated);
      setTechReportModalVisible(false);
      Alert.alert('✅ تم إنهاء الصيانة', 'تم إتمام عملية الصيانة بنجاح وإرسال تقرير الإصلاح للعميل.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إنهاء الطلب');
    }
  };

  // Merchant Actions
  const handleMerchantPrepare = async (order: OrderRecord) => {
    try {
      await fetchApi(`/orders/${order.id}/status`, { method: 'POST', data: { status: 'in_progress' } });
      const updated = { ...order, status: 'in_progress' };
      setOrders(orders.map((o) => (o.id === order.id ? updated : o)));
      if (selectedOrder?.id === order.id) setSelectedOrder(updated);
      Alert.alert('✅ قيد التجهيز', 'تم تغيير حالة الطلب إلى قيد التجهيز بالمخزن.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر التحديث');
    }
  };

  const handleMerchantShip = async () => {
    if (!selectedOrder) return;
    try {
      await fetchApi(`/orders/${selectedOrder.id}/ship`, { method: 'POST', data: { trackingNumber: trackingInput } });
      const updated = { ...selectedOrder, status: 'on_way' };
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updated : o)));
      setSelectedOrder(updated);
      setShipModalVisible(false);
      Alert.alert('✅ تم الشحن', `تم شحن الطلب بنجاح برقم تتبع: ${trackingInput || 'TR-SHIP-100'}`);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر الشحن');
    }
  };

  // Admin Actions
  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      await fetchApi(`/orders/${selectedOrder.id}/status`, {
        method: 'POST',
        data: { status: newStatus },
      });
      const updated = { ...selectedOrder, status: newStatus };
      setSelectedOrder(updated);
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updated : o)));
      setStatusModalVisible(false);
      Alert.alert('✅ تم التحديث', `تم تغيير حالة الطلب إلى "${getStatusInfo(newStatus).label}"`);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تحديث الحالة');
    }
  };

  const handleReassignTech = async () => {
    if (!selectedOrder || !selectedTechId) {
      Alert.alert('تنبيه', 'يرجى اختيار فني من القائمة.');
      return;
    }
    const tech = technicians.find((t) => t.id === selectedTechId);

    try {
      await fetchApi(`/orders/${selectedOrder.id}/reassign`, {
        method: 'POST',
        data: { technicianId: selectedTechId },
      });
      const updated = { ...selectedOrder, technicianId: selectedTechId, technicianName: tech?.name };
      setSelectedOrder(updated);
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updated : o)));
      setReassignModalVisible(false);
      Alert.alert('✅ تمت إعادة التوجيه', `تم إسناد الطلب للفني: ${tech?.name || selectedTechId}`);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إعادة التوجيه');
    }
  };

  const handleCancelAndRefund = async () => {
    if (!selectedOrder) return;
    const confirm = Platform.OS === 'web'
      ? window.confirm(`هل أنت متأكد من رغبتك في إلغاء الطلب #${selectedOrder.id} واسترجاع ${selectedOrder.total} ج.م لمحفظة العميل؟`)
      : true;

    if (!confirm) return;

    try {
      const res = await fetchApi(`/orders/${selectedOrder.id}/refund`, { method: 'POST' });
      const updated = { ...selectedOrder, status: 'cancelled' };
      setSelectedOrder(updated);
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? updated : o)));
      Alert.alert('✅ تم الإلغاء والاسترجاع', res.message || 'تم إرجاع المبلغ لمحفظة العميل بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر استرجاع المبلغ');
    }
  };

  const handleOpenMap = (address?: string) => {
    const query = encodeURIComponent(address || 'القاهرة، مصر');
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* ☰ Owner Header with Drawer navigation */}
      <OwnerHeader
        title="إدارة الطلبات"
        subtitle={`غرفة العمليات اللوجستية (${filteredOrders.length} طلب)`}
        sectionNumber={4}
        navigation={navigation}
        currentScreen="Orders"
        showBack
        onRefresh={loadOrders}
      />

      {/* Tabs & Search Bar */}
      <View style={{ backgroundColor: '#111111', padding: spacing.md, borderBottomWidth: 1, borderColor: '#222' }}>
        {/* Search */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#1A1A1A',
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.sm,
            borderWidth: 1,
            borderColor: '#333',
            marginBottom: spacing.sm,
          }}
        >
          <Search size={16} color={colors.primary} />
          <TextInput
            style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, textAlign: 'right', color: colors.white, fontSize: 13 }}
            placeholder="ابحث برقم الطلب، اسم العميل، أو نوع الخدمة..."
            placeholderTextColor={colors.gray}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color={colors.gray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row-reverse', gap: spacing.xs }}>
          {orderTabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: borderRadius.sm,
                  backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.2)' : '#1A1A1A',
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : '#333',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isSelected ? '900' : '600',
                    color: isSelected ? colors.primary : colors.gray,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.gray, marginTop: spacing.sm }}>جاري تحميل الطلبات...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <Package size={48} color={colors.gray} />
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
            لا توجد طلبات في هذا القسم
          </Text>
          <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
            الطلبات المسجلة من العملاء والفنيين ستظهر هنا مباشرة وبشكل حي
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 150 }}
          renderItem={({ item }) => {
            const statusInfo = getStatusInfo(item.status);
            const StatusIcon = statusInfo.icon;
            const isMaintenance = item.type === 'maintenance';

            return (
              <TouchableOpacity
                onPress={() => handleOpenDetails(item)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: '#141414',
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: '#222',
                  padding: spacing.md,
                }}
              >
                {/* Header row */}
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 15 }}>
                      #{item.id}
                    </Text>
                    <View
                      style={{
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 4,
                        backgroundColor: isMaintenance ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '800', color: isMaintenance ? '#3B82F6' : '#F59E0B' }}>
                        {isMaintenance ? 'صيانة' : 'شراء بضاعة'}
                      </Text>
                    </View>
                  </View>

                  {/* Status badge */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: borderRadius.full,
                      backgroundColor: statusInfo.bg,
                    }}
                  >
                    <StatusIcon size={12} color={statusInfo.color} />
                    <Text style={{ color: statusInfo.color, fontSize: 11, fontWeight: '800' }}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>

                {/* Customer & Service */}
                <View style={{ gap: 4, marginVertical: spacing.xs }}>
                  <Text style={{ color: colors.white, fontSize: 14, fontWeight: 'bold', textAlign: 'right' }}>
                    العميل: {item.customerName || 'عميل مسجل'}
                  </Text>
                  {item.serviceType && (
                    <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>
                      الخدمة: {item.serviceType}
                    </Text>
                  )}
                  {item.location && (
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} color={colors.primary} />
                      <Text style={{ color: colors.gray, fontSize: 12 }}>{item.location}</Text>
                    </View>
                  )}
                </View>

                {/* Footer row */}
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: spacing.sm,
                    paddingTop: spacing.xs,
                    borderTopWidth: 1,
                    borderTopColor: '#1F1F1F',
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900' }}>
                    {item.total} ج.م
                  </Text>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: colors.gray, fontSize: 11 }}>عرض التفاصيل والإجراءات</Text>
                    <ChevronRight size={14} color={colors.gray} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* MODAL 1: Complete Order Details & Owner Actions */}
      <Modal visible={detailsModalVisible} transparent animationType="slide" onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.sm }}>
          <ScrollView style={{ width: '100%', maxWidth: 540, maxHeight: '92%' }}>
            {selectedOrder && (
              <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
                {/* Header */}
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900' }}>
                      تفاصيل الطلب #{selectedOrder.id}
                    </Text>
                    <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>
                      تاريخ الإنشاء: {new Date(selectedOrder.createdAt).toLocaleString('ar-EG')}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                    <X size={22} color={colors.gray} />
                  </TouchableOpacity>
                </View>

                {/* 1. Timeline Progress Bar */}
                <View style={{ backgroundColor: '#1A1A1A', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold', textAlign: 'right', marginBottom: spacing.sm }}>
                    مخطط التقدم الزمني (Timeline)
                  </Text>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                    {[
                      { label: 'تم الإنشاء', step: 1 },
                      { label: 'قيد المراجعة', step: 2 },
                      { label: 'في الطريق', step: 3 },
                      { label: 'مكتمل', step: 4 },
                    ].map((st, idx) => {
                      const currentStep = getStatusInfo(selectedOrder.status).step;
                      const isReached = currentStep >= st.step;
                      const isCancelled = selectedOrder.status === 'cancelled';

                      return (
                        <View key={st.label} style={{ alignItems: 'center', flex: 1 }}>
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: isCancelled
                                ? '#DC2626'
                                : isReached
                                ? colors.primary
                                : '#333',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <Text style={{ color: '#0A0A0A', fontSize: 11, fontWeight: '900' }}>{st.step}</Text>
                          </View>
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: isReached ? 'bold' : 'normal',
                              color: isCancelled ? '#DC2626' : isReached ? colors.white : colors.gray,
                              textAlign: 'center',
                            }}
                          >
                            {st.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* 2. Customer Map Location Card */}
                <View style={{ backgroundColor: '#1A1A1A', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md }}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                      <MapPin size={16} color={colors.primary} />
                      <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold' }}>موقع العميل والتوصيل</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleOpenMap(selectedOrder.location)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: colors.primary }}
                    >
                      <ExternalLink size={12} color="#0A0A0A" />
                      <Text style={{ color: '#0A0A0A', fontSize: 10, fontWeight: 'bold' }}>فتح في الخرائط</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>
                    {selectedOrder.location || 'العنوان غير محدد على الخريطة بدقة'}
                  </Text>
                </View>

                {/* 3. Client and Assigned Technician/Merchant */}
                <View style={{ backgroundColor: '#1A1A1A', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, gap: spacing.xs }}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>العميل:</Text>
                    <Text style={{ color: colors.white, fontSize: 12, fontWeight: 'bold' }}>{selectedOrder.customerName || 'عميل مسجل'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>الفني / التاجر المسؤول:</Text>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                      {selectedOrder.technicianName || selectedOrder.technicianId || 'غير معين حتى الآن'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>نوع الخدمة / الطلب:</Text>
                    <Text style={{ color: colors.white, fontSize: 12 }}>{selectedOrder.serviceType || selectedOrder.type}</Text>
                  </View>
                </View>

                {/* 4. Products / Services List */}
                <View style={{ backgroundColor: '#1A1A1A', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md }}>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold', textAlign: 'right', marginBottom: spacing.sm }}>
                    قائمة المنتجات والخدمات (الفاتورة)
                  </Text>
                  {parseItems(selectedOrder.items).map((item: any, idx: number) => (
                    <View key={idx} style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: idx < parseItems(selectedOrder.items).length - 1 ? 1 : 0, borderColor: '#222' }}>
                      <Text style={{ color: colors.white, fontSize: 12 }}>{item.name} × {item.qty || 1}</Text>
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>{(item.price || 0) * (item.qty || 1)} ج.م</Text>
                    </View>
                  ))}

                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.xs, borderTopWidth: 1, borderColor: '#333' }}>
                    <Text style={{ color: colors.white, fontSize: 14, fontWeight: 'bold' }}>الإجمالي الكلي:</Text>
                    <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900' }}>{selectedOrder.total} ج.م</Text>
                  </View>
                </View>

                {/* Role Specific Action Buttons */}
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '900', textAlign: 'right', marginBottom: spacing.sm }}>
                  {role === 'customer' ? 'إجراءات العميل:' : role === 'technician' ? 'إجراءات الفني:' : role === 'merchant' ? 'إجراءات التاجر:' : role === 'manager' ? 'صلاحيات المدير:' : role === 'owner' ? 'صلاحيات المالك 👑:' : 'خيارات المساعدة:'}
                </Text>
                <View style={{ gap: spacing.sm }}>
                  {/* Customer: Cancel within 10 min */}
                  {role === 'customer' && (
                    <>
                      {selectedOrder.status === 'pending' ? (
                        (() => {
                          const elapsedMinutes = (Date.now() - new Date(selectedOrder.createdAt).getTime()) / (60 * 1000);
                          const canCancel = elapsedMinutes <= 10;
                          return canCancel ? (
                            <TouchableOpacity
                              onPress={() => handleCustomerCancel(selectedOrder)}
                              style={{
                                flexDirection: 'row-reverse',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(220, 38, 38, 0.15)',
                                borderWidth: 1,
                                borderColor: '#DC2626',
                                paddingVertical: 10,
                                borderRadius: borderRadius.md,
                                gap: 8,
                              }}
                            >
                              <XCircle size={16} color="#DC2626" />
                              <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 13 }}>
                                إلغاء الطلب (متاح خلال أول 10 دقائق)
                              </Text>
                            </TouchableOpacity>
                          ) : (
                            <View style={{ backgroundColor: '#1A1A1A', padding: 10, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#333' }}>
                              <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'center' }}>
                                🔒 لا يمكن إلغاء الطلب بعد مرور 10 دقائق حيث بدأ التنفيذ الفعلي
                              </Text>
                            </View>
                          );
                        })()
                      ) : null}
                    </>
                  )}

                  {/* Technician Actions */}
                  {role === 'technician' && (
                    <>
                      {selectedOrder.status === 'pending' && (
                        <TouchableOpacity
                          onPress={() => handleTechAccept(selectedOrder)}
                          style={{
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#10B981',
                            paddingVertical: 10,
                            borderRadius: borderRadius.md,
                            gap: 8,
                          }}
                        >
                          <CheckCircle size={16} color="#0A0A0A" />
                          <Text style={{ color: '#0A0A0A', fontWeight: 'bold', fontSize: 13 }}>قبول الطلب وبدء التنفيذ ✅</Text>
                        </TouchableOpacity>
                      )}
                      {selectedOrder.status === 'in_progress' && (
                        <>
                          <TouchableOpacity
                            onPress={() => handleTechArrive(selectedOrder)}
                            style={{
                              flexDirection: 'row-reverse',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#1E1E1E',
                              borderWidth: 1,
                              borderColor: colors.primary,
                              paddingVertical: 10,
                              borderRadius: borderRadius.md,
                              gap: 8,
                            }}
                          >
                            <Truck size={16} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>سجلت وصولي لموقع العميل 🚗</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => {
                              setTechReportText('');
                              setTechPartsCost('0');
                              setTechReportModalVisible(true);
                            }}
                            style={{
                              flexDirection: 'row-reverse',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#10B981',
                              paddingVertical: 10,
                              borderRadius: borderRadius.md,
                              gap: 8,
                            }}
                          >
                            <FileText size={16} color="#0A0A0A" />
                            <Text style={{ color: '#0A0A0A', fontWeight: 'bold', fontSize: 13 }}>إتمام الصيانة وإعداد التقرير 📝</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </>
                  )}

                  {/* Merchant Actions */}
                  {role === 'merchant' && (
                    <>
                      {selectedOrder.status === 'pending' && (
                        <TouchableOpacity
                          onPress={() => handleMerchantPrepare(selectedOrder)}
                          style={{
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.primary,
                            paddingVertical: 10,
                            borderRadius: borderRadius.md,
                            gap: 8,
                          }}
                        >
                          <Package size={16} color="#0A0A0A" />
                          <Text style={{ color: '#0A0A0A', fontWeight: 'bold', fontSize: 13 }}>تأكيد تجهيز الطلب بالمخزن 📦</Text>
                        </TouchableOpacity>
                      )}
                      {selectedOrder.status === 'in_progress' && (
                        <TouchableOpacity
                          onPress={() => {
                            setTrackingInput('');
                            setShipModalVisible(true);
                          }}
                          style={{
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#3B82F6',
                            paddingVertical: 10,
                            borderRadius: borderRadius.md,
                            gap: 8,
                          }}
                        >
                          <Truck size={16} color="#FFFFFF" />
                          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>تم تسليم الطلب لشركة الشحن 🚚</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}

                  {/* Manager & Owner: Change status & Reassign */}
                  {(role === 'manager' || role === 'owner') && (
                    <>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedStatus(selectedOrder.status);
                          setStatusModalVisible(true);
                        }}
                        style={{
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#1E1E1E',
                          borderWidth: 1,
                          borderColor: '#3B82F6',
                          paddingVertical: 10,
                          borderRadius: borderRadius.md,
                          gap: 8,
                        }}
                      >
                        <RefreshCw size={16} color="#3B82F6" />
                        <Text style={{ color: '#3B82F6', fontWeight: 'bold', fontSize: 13 }}>تغيير حالة الطلب</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setReassignModalVisible(true)}
                        style={{
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#1E1E1E',
                          borderWidth: 1,
                          borderColor: colors.primary,
                          paddingVertical: 10,
                          borderRadius: borderRadius.md,
                          gap: 8,
                        }}
                      >
                        <Wrench size={16} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>إعادة توجيه لفني / تاجر آخر</Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Owner-Only: Refund to Wallet */}
                  {role === 'owner' && selectedOrder.status !== 'cancelled' && (
                    <TouchableOpacity
                      onPress={handleCancelAndRefund}
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(220, 38, 38, 0.15)',
                        borderWidth: 1,
                        borderColor: '#DC2626',
                        paddingVertical: 10,
                        borderRadius: borderRadius.md,
                        gap: 8,
                      }}
                    >
                      <RotateCcw size={16} color="#DC2626" />
                      <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 13 }}>إلغاء الطلب واسترجاع المبلغ للمحفظة</Text>
                    </TouchableOpacity>
                  )}

                  {/* Owner: Print Invoice */}
                  {role === 'owner' && (
                    <TouchableOpacity
                      onPress={() => setInvoiceModalVisible(true)}
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#1E1E1E',
                        borderWidth: 1,
                        borderColor: '#10B981',
                        paddingVertical: 10,
                        borderRadius: borderRadius.md,
                        gap: 8,
                      }}
                    >
                      <Printer size={16} color="#10B981" />
                      <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 13 }}>طباعة وتصدير الفاتورة (PDF)</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 2: Change Status */}
      <Modal visible={statusModalVisible} transparent animationType="fade" onRequestClose={() => setStatusModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#3B82F6' }}>
            <Text style={{ color: '#3B82F6', fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: spacing.md }}>
              اختر الحالة الجديدة للطلب:
            </Text>

            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              {[
                { key: 'pending', label: 'معلق (بانتظار المراجعة)' },
                { key: 'in_progress', label: 'قيد التنفيذ والمتابعة' },
                { key: 'on_way', label: 'في الطريق لموقع العميل' },
                { key: 'completed', label: 'مكتمل بنجاح' },
              ].map((st) => (
                <TouchableOpacity
                  key={st.key}
                  onPress={() => handleUpdateStatus(st.key)}
                  style={{
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: selectedStatus === st.key ? 'rgba(59, 130, 246, 0.2)' : '#1E1E1E',
                    borderWidth: 1,
                    borderColor: selectedStatus === st.key ? '#3B82F6' : '#333',
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: 'bold', textAlign: 'right' }}>{st.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => setStatusModalVisible(false)} style={{ padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}>
              <Text style={{ color: colors.white }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Reassign Technician */}
      <Modal visible={reassignModalVisible} transparent animationType="fade" onRequestClose={() => setReassignModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 450, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: spacing.md }}>
              إعادة توجيه الطلب إلى فني آخر:
            </Text>

            <ScrollView style={{ maxHeight: 250, marginBottom: spacing.md }}>
              <View style={{ gap: spacing.xs }}>
                {technicians.length === 0 ? (
                  <Text style={{ color: colors.gray, textAlign: 'center', padding: spacing.md }}>لا يوجد فنيين مسجلين حالياً</Text>
                ) : (
                  technicians.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setSelectedTechId(t.id)}
                      style={{
                        padding: spacing.md,
                        borderRadius: borderRadius.md,
                        backgroundColor: selectedTechId === t.id ? 'rgba(212, 175, 55, 0.2)' : '#1E1E1E',
                        borderWidth: 1,
                        borderColor: selectedTechId === t.id ? colors.primary : '#333',
                        flexDirection: 'row-reverse',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={{ color: colors.white, fontWeight: 'bold' }}>{t.name}</Text>
                      <Text style={{ color: colors.gray, fontSize: 12 }}>{t.specialty || 'صيانة عامة'}</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity onPress={() => setReassignModalVisible(false)} style={{ flex: 1, padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: colors.white }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReassignTech} style={{ flex: 1, padding: 10, backgroundColor: colors.primary, borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>تأكيد الإسناد</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Print / Export Invoice */}
      <Modal visible={invoiceModalVisible} transparent animationType="fade" onRequestClose={() => setInvoiceModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 450, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#10B981' }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '900' }}>فاتورة ضريبية رسمية</Text>
              <TouchableOpacity onPress={() => setInvoiceModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#fff', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md }}>
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 16, textAlign: 'center' }}>منصة TecnoRexa</Text>
              <Text style={{ color: '#555', fontSize: 11, textAlign: 'center', marginBottom: 8 }}>فاتورة إلكترونية معتمدة</Text>
              <Text style={{ color: '#000', fontSize: 12 }}>رقم الطلب: #{selectedOrder?.id}</Text>
              <Text style={{ color: '#000', fontSize: 12 }}>العميل: {selectedOrder?.customerName || 'عميل مسجل'}</Text>
              <Text style={{ color: '#000', fontSize: 12 }}>المبلغ الإجمالي: {selectedOrder?.total} ج.م</Text>
              <Text style={{ color: '#000', fontSize: 12 }}>الحالة: {getStatusInfo(selectedOrder?.status || '').label}</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (Platform.OS === 'web') {
                  window.print();
                } else {
                  Alert.alert('طباعة الفاتورة', 'تم إرسال الفاتورة إلى طابعة النظام بنجاح.');
                }
                setInvoiceModalVisible(false);
              }}
              style={{ padding: 12, backgroundColor: '#10B981', borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>تأكيد الطباعة الآن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: Tech Maintenance Completion Report */}
      <Modal visible={techReportModalVisible} transparent animationType="fade" onRequestClose={() => setTechReportModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 450, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#10B981' }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '900' }}>تقرير إتمام الصيانة الفنية</Text>
              <TouchableOpacity onPress={() => setTechReportModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 6 }}>تقرير الإصلاح وما تم إنجازه:</Text>
            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                color: colors.white,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#333',
                padding: spacing.md,
                height: 90,
                textAlign: 'right',
                textAlignVertical: 'top',
                marginBottom: spacing.md,
              }}
              placeholder="اكتب تفاصيل العطل والقطع التي تم استبدالها..."
              placeholderTextColor={colors.gray}
              multiline
              value={techReportText}
              onChangeText={setTechReportText}
            />

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 6 }}>تكلفة قطع الغيار المستخدمة (إن وجدت):</Text>
            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                color: colors.white,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#333',
                padding: spacing.md,
                textAlign: 'right',
                marginBottom: spacing.lg,
              }}
              placeholder="المبلغ بالجنيه..."
              placeholderTextColor={colors.gray}
              keyboardType="numeric"
              value={techPartsCost}
              onChangeText={setTechPartsCost}
            />

            <TouchableOpacity
              onPress={handleTechComplete}
              style={{ padding: 12, backgroundColor: '#10B981', borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 14 }}>إرسال التقرير وإنهاء المهمة ✅</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 6: Merchant Ship Tracking */}
      <Modal visible={shipModalVisible} transparent animationType="fade" onRequestClose={() => setShipModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 450, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#3B82F6' }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: '#3B82F6', fontSize: 16, fontWeight: '900' }}>تسليم الشحنة وتأكيد الإرسال</Text>
              <TouchableOpacity onPress={() => setShipModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 6 }}>رقم بوليصة الشحن / التتبع:</Text>
            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                color: colors.white,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#333',
                padding: spacing.md,
                textAlign: 'right',
                marginBottom: spacing.lg,
              }}
              placeholder="مثال: EGY-EXP-99214"
              placeholderTextColor={colors.gray}
              value={trackingInput}
              onChangeText={setTrackingInput}
            />

            <TouchableOpacity
              onPress={handleMerchantShip}
              style={{ padding: 12, backgroundColor: '#3B82F6', borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>تأكيد الشحن وإشعار العميل 🚚</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
