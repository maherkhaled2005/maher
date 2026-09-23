import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Phone,
  User,
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ShieldAlert,
  Navigation,
  MessageCircle,
  Wrench,
  FileText,
  Star,
  Check,
  X,
  ShieldCheck,
  DollarSign,
  Calendar,
  AlertCircle,
  Cpu,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { api } from '../../api/client';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  pending: { label: 'قيد الانتظار', color: colors.warning, icon: Clock, desc: 'في انتظار قبول الفني للطلب' },
  accepted: { label: 'تم القبول', color: colors.info, icon: CheckCircle2, desc: 'قبل الفني الطلب - بانتظار تقديم عرض السعر أو التوجه' },
  quoted: { label: 'عرض السعر مرسل', color: '#8B5CF6', icon: DollarSign, desc: 'قدم الفني عرض السعر وفي انتظار موافقة العميل' },
  quote_approved: { label: 'تمت الموافقة على العرض', color: colors.success, icon: CheckCircle2, desc: 'وافق العميل على عرض السعر والبدء بالصيانة' },
  quote_rejected: { label: 'مرفوض عرض السعر', color: colors.danger, icon: X, desc: 'تم رفض عرض السعر المقدم' },
  on_way: { label: 'الفني في الطريق', color: colors.primary, icon: Navigation, desc: 'الفني في طريقه لموقع العميل' },
  arrived: { label: 'وصل الفني', color: '#06B6D4', icon: MapPin, desc: 'الفني وصل لمقر العميل' },
  diagnosing: { label: 'جاري الفحص والتشخيص', color: '#EC4899', icon: Wrench, desc: 'الفني يقوم بفحص وتحديد أعطال الجهاز' },
  repairing: { label: 'جاري الإصلاح والصيانة', color: colors.primary, icon: Wrench, desc: 'الفني يقوم بتنفيذ الإصلاحات وتركيب القطع' },
  service_report_submitted: { label: 'تم إصدار تقرير الصيانة', color: '#10B981', icon: FileText, desc: 'أنهى الفني العمل وقدم التقرير مع شهادة الضمان' },
  in_progress: { label: 'جاري التنفيذ', color: colors.primary, icon: Wrench, desc: 'أعمال الصيانة قيد التنفيذ' },
  completed: { label: 'مكتمل بنجاح', color: colors.success, icon: CheckCircle2, desc: 'تم استلام الجهاز وإغلاق الطلب بنجاح' },
  cancelled: { label: 'ملغي', color: colors.danger, icon: ShieldAlert, desc: 'تم إلغاء هذا الطلب' },
};

export default function OrderDetailsScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const { orderId } = route.params || { orderId: 'ORD-001' };
  const role = user?.role || 'customer';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Quote Modal State
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [laborCost, setLaborCost] = useState('');
  const [partsCost, setPartsCost] = useState('');
  const [inspectionFee, setInspectionFee] = useState('50');
  const [quoteNotes, setQuoteNotes] = useState('');

  // Service Report Modal State
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportDeviceType, setReportDeviceType] = useState('');
  const [reportBrand, setReportBrand] = useState('');
  const [reportModel, setReportModel] = useState('');
  const [reportDiagnosis, setReportDiagnosis] = useState('');
  const [reportRepairAction, setReportRepairAction] = useState('');
  const [reportPartsUsed, setReportPartsUsed] = useState('');
  const [reportWarrantyDays, setReportWarrantyDays] = useState('30');

  // Rating Modal State
  const [rateModalVisible, setRateModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      if (res.data) {
        setOrder(res.data);
        // Pre-fill report form if order has device details
        setReportDeviceType(res.data.deviceType || res.data.serviceType || '');
        setReportBrand(res.data.deviceBrand || '');
        setReportModel(res.data.deviceModel || '');
      }
    } catch (err: any) {
      console.warn('Error fetching order details:', err.message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleCall = (phoneNumber?: string) => {
    const raw = phoneNumber || order?.clientPhone || order?.phone;
    const targetPhone = raw && raw !== '01000000000' ? String(raw).trim() : '';
    if (!targetPhone) {
      Alert.alert('تنبيه', 'رقم الهاتف غير متوفر');
      return;
    }
    Linking.openURL(`tel:${targetPhone}`).catch(() => {
      Alert.alert('تنبيه', 'تعذر إجراء المكالمة');
    });
  };

  const handleStartChat = () => {
    const recipientName = role === 'customer' ? (order?.technicianName || 'الفني') : (order?.clientName || 'العميل');
    navigation.navigate('ChatScreen', {
      chatId: `conv_${order?.id}`,
      userName: recipientName,
      phone: role === 'customer' ? order?.technicianPhone : order?.clientPhone,
      isOnline: true,
    });
  };

  // Technician Order Action (Accept / Decline)
  const handleTechAction = async (action: 'accept' | 'decline') => {
    try {
      setActionLoading(true);
      const res = await api.post(`/technician/orders/${order.id}/action`, { action });
      Alert.alert('✅ نجاح', res.data?.message || 'تم تحديث حالة الطلب');
      await fetchOrder();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.error || err.message || 'تعذر تنفيذ الإجراء');
    } finally {
      setActionLoading(false);
    }
  };

  // Technician Submit Quote
  const handleSubmitQuote = async () => {
    const labor = parseFloat(laborCost);
    if (isNaN(labor) || labor <= 0) {
      Alert.alert('تنبيه', 'يرجى إدخال قيمة المصنعية / أجر اليد بشكل صحيح');
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/technician/orders/${order.id}/quote`, {
        laborCost: labor,
        partsCost: parseFloat(partsCost) || 0,
        inspectionFee: parseFloat(inspectionFee) || 0,
        notes: quoteNotes,
      });
      setQuoteModalVisible(false);
      Alert.alert('🎉 تم إرسال العرض', 'تم إرسال عرض السعر للعميل وفي انتظار موافقته.');
      await fetchOrder();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.error || err.message || 'تعذر إرسال عرض السعر');
    } finally {
      setActionLoading(false);
    }
  };

  // Customer Quote Action (Approve / Reject)
  const handleQuoteDecision = async (action: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      const res = await api.post(`/customer/orders/${order.id}/quote-action`, { action });
      Alert.alert('تم التحديث', res.data?.message || 'تم تسجيل قرارك بنجاح.');
      await fetchOrder();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.error || err.message || 'تعذر تحديث القرار');
    } finally {
      setActionLoading(false);
    }
  };

  // Technician Field Status Progression
  const handleUpdateStatus = async (status: string, successMsg: string) => {
    try {
      setActionLoading(true);
      await api.post(`/technician/orders/${order.id}/status`, { status });
      Alert.alert('✅ تم التحديث', successMsg);
      await fetchOrder();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.error || err.message || 'تعذر تحديث الحالة');
    } finally {
      setActionLoading(false);
    }
  };

  // Technician Submit Service Report
  const handleSubmitReport = async () => {
    if (!reportDiagnosis.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة تشخيص العطل بدقة');
      return;
    }
    if (!reportRepairAction.trim()) {
      Alert.alert('تنبيه', 'يرجى توضيح الإجراءات الفنية المنفذة للإصلاح');
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/technician/orders/${order.id}/report`, {
        deviceType: reportDeviceType,
        deviceBrand: reportBrand,
        deviceModel: reportModel,
        diagnosis: reportDiagnosis,
        repairAction: reportRepairAction,
        partsUsed: reportPartsUsed,
        warrantyDays: parseInt(reportWarrantyDays, 10) || 30,
      });
      setReportModalVisible(false);
      Alert.alert('📋 تم رفع التقرير', 'تم إصدار تقرير الصيانة مع شهادة الضمان وإشعار العميل.');
      await fetchOrder();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.error || err.message || 'تعذر حفظ تقرير الصيانة');
    } finally {
      setActionLoading(false);
    }
  };

  // Customer Confirm Service Completion
  const handleConfirmCompletion = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/customer/orders/${order.id}/confirm-completion`);
      Alert.alert('🎉 تم استلام الجهاز', res.data?.message || 'تم إتمام الصيانة وإيداع المستحقات بنجاح!');
      await fetchOrder();
      setRateModalVisible(true);
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.error || err.message || 'تعذر تأكيد استلام الجهاز');
    } finally {
      setActionLoading(false);
    }
  };

  // Customer Submit Rating
  const handleSubmitRating = async () => {
    try {
      setActionLoading(true);
      await api.post(`/orders/${order.id}/rate`, {
        rating: selectedRating,
        comment: ratingComment,
      });
      setRateModalVisible(false);
      Alert.alert('⭐ شكراً لتقييمك', 'تم تسجيل تقييمك للفني بنجاح وتحديث درجته في المنصة.');
      await fetchOrder();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.error || err.message || 'تعذر إرسال التقييم');
    } finally {
      setActionLoading(false);
    }
  };

  // Merchant Ship Order
  const handleShip = async () => {
    try {
      setActionLoading(true);
      await api.post(`/orders/${order.id}/ship`, { trackingNumber: `TR-${Date.now()}` });
      Alert.alert('🚚 تم الشحن', 'تم تحديث حالة الطلب إلى مشحون.');
      await fetchOrder();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر شحن الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  // Customer Cancel (< 10 minutes)
  const handleCancel = async () => {
    const orderAgeMinutes = order?.createdAt
      ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
      : 0;

    if (role === 'customer' && orderAgeMinutes > 10) {
      Alert.alert(
        'تنبيه',
        'لا يمكن إلغاء الطلب بعد مرور أكثر من 10 دقائق على إنشائه وفقاً للائحة المنصة. يرجى التواصل مع الدعم الفني للمساعدة.'
      );
      return;
    }

    const confirm = Platform.OS === 'web'
      ? window.confirm('هل أنت متأكد من رغبتك في إلغاء الطلب؟')
      : true;
    if (!confirm) return;

    try {
      setActionLoading(true);
      await api.post(`/orders/${order.id}/cancel`, { reason: 'إلغاء من قبل العميل' });
      Alert.alert('تم الإلغاء', 'تم إلغاء الطلب بنجاح.');
      await fetchOrder();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.error || err.message || 'تعذر إلغاء الطلب');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.gray, marginTop: spacing.sm }}>جاري تحميل تفاصيل الطلب...</Text>
      </SafeAreaView>
    );
  }

  const currentStatus = STATUS_LABELS[order?.status] || STATUS_LABELS.pending;
  const StatusIcon = currentStatus.icon;
  const isMaintenance = order?.type === 'maintenance' || order?.type === 'technician' || !!order?.technicianName || !!order?.serviceType;
  const isTechAssigned = order?.technicianId === user?.id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: '#111111',
          borderBottomWidth: 1,
          borderColor: '#222',
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (navigation?.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else if (navigation?.navigate) {
              navigation.navigate('Orders');
            }
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#1E1E1E',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: '#333',
          }}
        >
          <ChevronRight color={colors.white} size={22} />
        </TouchableOpacity>
        <Text style={{ color: colors.primary, fontSize: typography.sizes.lg, fontWeight: '900', textAlign: 'center' }}>
          {order ? `طلب صيانة #${order.id}` : 'تفاصيل الطلب'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <View
          style={{
            backgroundColor: '#141414',
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: currentStatus.color,
            marginBottom: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
              <StatusIcon color={currentStatus.color} size={26} />
              <View>
                <Text style={{ color: currentStatus.color, fontSize: typography.sizes.md, fontWeight: '900' }}>
                  {currentStatus.label}
                </Text>
                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>
                  {currentStatus.desc}
                </Text>
              </View>
            </View>
            <View style={{ backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 15 }}>
                {order?.total || order?.totalPrice || 0} ج.م
              </Text>
            </View>
          </View>
        </View>

        {/* Appliance & Service Details Card */}
        <View
          style={{
            backgroundColor: '#141414',
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: '#222',
            marginBottom: spacing.md,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '900', textAlign: 'right', marginBottom: spacing.sm }}>
            🔧 بيانات الجهاز والعطل
          </Text>

          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.gray, fontSize: 13 }}>نوع الجهاز:</Text>
            <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}>
              {order?.deviceType || order?.serviceType || 'أجهزة منزلية'}
            </Text>
          </View>

          {(order?.deviceBrand || order?.deviceModel) && (
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.gray, fontSize: 13 }}>الماركة / الموديل:</Text>
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}>
                {[order.deviceBrand, order.deviceModel].filter(Boolean).join(' - ')}
              </Text>
            </View>
          )}

          {order?.problemDesc && (
            <View style={{ backgroundColor: '#1A1A1A', padding: 12, borderRadius: 8, marginTop: 4, borderWidth: 1, borderColor: '#333' }}>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>وصف المشكلة / العطل المبلغ عنه:</Text>
              <Text style={{ color: colors.white, fontSize: 13, textAlign: 'right', lineHeight: 20 }}>{order.problemDesc}</Text>
            </View>
          )}
        </View>

        {/* Customer Info Card */}
        <View
          style={{
            backgroundColor: '#141414',
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: '#222',
            marginBottom: spacing.md,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '900', textAlign: 'right', marginBottom: spacing.sm }}>
            👤 بيانات العميل وموقع الزيارة
          </Text>

          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <User color={colors.primary} size={16} />
            <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700' }}>
              {order?.clientName || order?.userName || 'عميل TecnoRexa'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Phone color={colors.primary} size={16} />
            <Text style={{ color: colors.white, fontSize: 13 }}>
              {order?.clientPhone || order?.phone || 'غير مسجل'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
            <MapPin color={colors.primary} size={16} />
            <Text style={{ color: colors.gray, fontSize: 13, flex: 1, textAlign: 'right' }}>
              {[order?.governorate, order?.address].filter(Boolean).join(' - ') || 'العنوان محدد في الخريطة'}
            </Text>
          </View>
        </View>

        {/* Assigned Technician Card (Visible to Customer or when assigned) */}
        {isMaintenance && order?.technicianId && (
          <View
            style={{
              backgroundColor: '#141414',
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: '#222',
              marginBottom: spacing.md,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '900', textAlign: 'right', marginBottom: spacing.sm }}>
              🧑‍🔧 الفني المكلف بالصيانة
            </Text>

            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(212,175,55,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench color={colors.primary} size={22} />
                </View>
                <View>
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: 14 }}>
                    {order?.technicianName || 'فني معتمد من المنصة'}
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 12 }}>
                    {order?.technicianPhone || 'غير متوفر'}
                  </Text>
                  {order?.technician?.rating && (
                    <Text style={{ color: colors.warning, fontSize: 12, marginTop: 2 }}>
                      ⭐ {order.technician.rating} ({order.technician.ratingCount || 1} تقييم)
                    </Text>
                  )}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleCall(order?.technicianPhone)}
                  style={{ backgroundColor: '#1E293B', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#334155' }}
                >
                  <Phone color={colors.primary} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleStartChat}
                  style={{ backgroundColor: '#1E293B', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#334155' }}
                >
                  <MessageCircle color={colors.primary} size={18} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Live Map Tracking Shortcut */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Tracking', { orderId: order?.id })}
              style={{
                marginTop: 12,
                backgroundColor: 'rgba(212,175,55,0.15)',
                borderWidth: 1,
                borderColor: colors.primary,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: borderRadius.md,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Navigation color={colors.primary} size={18} />
              <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>
                تتبع مسار الفني على الخريطة 🗺️
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Itemized Quotation Card (if exists) */}
        {order?.quote && (
          <View
            style={{
              backgroundColor: '#161922',
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: order.quote.status === 'approved' ? colors.success : '#8B5CF6',
              marginBottom: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '900', textAlign: 'right' }}>
                📄 عرض السعر المقدم
              </Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  backgroundColor: order.quote.status === 'approved' ? 'rgba(16,185,129,0.2)' : 'rgba(139,92,246,0.2)',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: order.quote.status === 'approved' ? colors.success : '#8B5CF6' }}>
                  {order.quote.status === 'approved' ? '✅ تمت الموافقة' : order.quote.status === 'rejected' ? '❌ مرفوض' : '⏳ في انتظار قرار العميل'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ color: colors.gray, fontSize: 13 }}>أجر اليد / المصنعية:</Text>
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}>{order.quote.laborCost} ج.م</Text>
            </View>

            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ color: colors.gray, fontSize: 13 }}>تكلفة قطع الغيار:</Text>
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}>{order.quote.partsCost} ج.م</Text>
            </View>

            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ color: colors.gray, fontSize: 13 }}>رسوم الكشف والتشخيص:</Text>
              <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}>{order.quote.inspectionFee} ج.م</Text>
            </View>

            {order.quote.notes ? (
              <View style={{ backgroundColor: '#111319', padding: 8, borderRadius: 6, marginVertical: 6 }}>
                <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right' }}>ملاحظات الفني:</Text>
                <Text style={{ color: colors.white, fontSize: 12, textAlign: 'right' }}>{order.quote.notes}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#262D3D', paddingTop: 8, marginTop: 4 }}>
              <Text style={{ color: colors.white, fontSize: 14, fontWeight: '900' }}>المبلغ الإجمالي المعتمد:</Text>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900' }}>{order.quote.totalAmount} ج.م</Text>
            </View>

            {/* Customer Quotation Actions (Approve / Reject) */}
            {role === 'customer' && order.status === 'quoted' && (
              <View style={{ flexDirection: 'row-reverse', gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => handleQuoteDecision('approve')}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    backgroundColor: colors.success,
                    paddingVertical: 10,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>الموافقة على العرض ✅</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleQuoteDecision('reject')}
                  disabled={actionLoading}
                  style={{
                    flex: 1,
                    backgroundColor: '#1E1E1E',
                    borderWidth: 1,
                    borderColor: colors.danger,
                    paddingVertical: 10,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.danger, fontWeight: '900', fontSize: 13 }}>رفض العرض ❌</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Service Report Card (if submitted) */}
        {order?.serviceReport && (
          <View
            style={{
              backgroundColor: '#142018',
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.success,
              marginBottom: spacing.md,
            }}
          >
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ color: colors.success, fontSize: 14, fontWeight: '900', textAlign: 'right' }}>
                📋 تقرير الصيانة وضمان الإصلاح
              </Text>
              <View style={{ backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ color: colors.success, fontWeight: '900', fontSize: 11 }}>
                  🛡️ ضمان {order.serviceReport.warrantyDays || order.warrantyDays || 30} يوماً
                </Text>
              </View>
            </View>

            <View style={{ marginBottom: 8 }}>
              <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right' }}>التشخيص الفني للعطل:</Text>
              <Text style={{ color: colors.white, fontSize: 13, textAlign: 'right', fontWeight: '600' }}>
                {order.serviceReport.diagnosis || order.serviceReport}
              </Text>
            </View>

            {order.serviceReport.repairAction ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right' }}>الإجراءات الفنية المنفذة:</Text>
                <Text style={{ color: colors.white, fontSize: 13, textAlign: 'right' }}>
                  {order.serviceReport.repairAction}
                </Text>
              </View>
            ) : null}

            {order.serviceReport.partsUsed ? (
              <View style={{ backgroundColor: '#0B130E', padding: 8, borderRadius: 6, marginBottom: 8 }}>
                <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right' }}>قطع الغيار المستخدمة:</Text>
                <Text style={{ color: colors.white, fontSize: 12, textAlign: 'right' }}>
                  {order.serviceReport.partsUsed}
                </Text>
              </View>
            ) : null}

            {/* Customer Completion Confirmation Button */}
            {role === 'customer' && order.status === 'service_report_submitted' && (
              <TouchableOpacity
                onPress={handleConfirmCompletion}
                disabled={actionLoading}
                style={{
                  backgroundColor: colors.success,
                  paddingVertical: 12,
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  marginTop: 6,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>
                  تأكيد استلام الجهاز وإتمام الصيانة ✅
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Customer Rating Card if Completed */}
        {order?.status === 'completed' && (
          <View
            style={{
              backgroundColor: '#1E1B10',
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.primary,
              marginBottom: spacing.md,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '900', marginBottom: 4 }}>
              🎉 تمت الصيانة بنجاح
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center', marginBottom: 10 }}>
              تم إغلاق الطلب وتأكيد استلام الجهاز من قبل العميل
            </Text>
            {role === 'customer' && (
              <TouchableOpacity
                onPress={() => setRateModalVisible(true)}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: borderRadius.md,
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Star color={colors.dark} size={16} fill={colors.dark} />
                <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 13 }}>
                  تقييم خدمة الفني ⭐
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ================= ACTIONS BASED ON ROLE ================= */}
        <View style={{ gap: 10, marginTop: spacing.sm }}>
          {/* Technician: Accept or Decline unassigned order */}
          {role === 'technician' && order?.status === 'pending' && (
            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <TouchableOpacity
                onPress={() => handleTechAction('accept')}
                disabled={actionLoading}
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
              >
                <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>قبول مهمة الصيانة 👍</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleTechAction('decline')}
                disabled={actionLoading}
                style={{ flex: 1, backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: colors.danger, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
              >
                <Text style={{ color: colors.danger, fontWeight: '900', fontSize: 15 }}>اعتذار عن الطلب ❌</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Technician: Send Quote when Accepted */}
          {role === 'technician' && isTechAssigned && order?.status === 'accepted' && (
            <TouchableOpacity
              onPress={() => setQuoteModalVisible(true)}
              disabled={actionLoading}
              style={{ backgroundColor: '#8B5CF6', paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15 }}>تقديم وتحديد عرض السعر 📝</Text>
            </TouchableOpacity>
          )}

          {/* Technician: Start Driving when Quote Approved or Accepted */}
          {role === 'technician' && isTechAssigned && (order?.status === 'quote_approved' || order?.status === 'accepted') && (
            <TouchableOpacity
              onPress={() => handleUpdateStatus('on_way', 'تم تسجيل أنك في الطريق للعميل 🚗')}
              disabled={actionLoading}
              style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>التحرك والتوجه لموقع العميل 🚗</Text>
            </TouchableOpacity>
          )}

          {/* Technician: Arrived at Location */}
          {role === 'technician' && isTechAssigned && order?.status === 'on_way' && (
            <TouchableOpacity
              onPress={() => handleUpdateStatus('arrived', 'تم تسجيل وصولك لموقع العميل بنجاح 📍')}
              disabled={actionLoading}
              style={{ backgroundColor: '#06B6D4', paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15 }}>وصلت لموقع العميل 📍</Text>
            </TouchableOpacity>
          )}

          {/* Technician: Start Diagnosing */}
          {role === 'technician' && isTechAssigned && order?.status === 'arrived' && (
            <TouchableOpacity
              onPress={() => handleUpdateStatus('diagnosing', 'جاري فحص الجهاز وتشخيص العطل 🔍')}
              disabled={actionLoading}
              style={{ backgroundColor: '#EC4899', paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15 }}>بدء الفحص والتشخيص 🔍</Text>
            </TouchableOpacity>
          )}

          {/* Technician: Start Repairing */}
          {role === 'technician' && isTechAssigned && order?.status === 'diagnosing' && (
            <TouchableOpacity
              onPress={() => handleUpdateStatus('repairing', 'تم بدء أعمال الصيانة والإصلاح 🔧')}
              disabled={actionLoading}
              style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>بدء الإصلاح وتركيب القطع 🔧</Text>
            </TouchableOpacity>
          )}

          {/* Technician: Submit Service Report */}
          {role === 'technician' && isTechAssigned && (order?.status === 'repairing' || order?.status === 'in_progress') && (
            <TouchableOpacity
              onPress={() => setReportModalVisible(true)}
              disabled={actionLoading}
              style={{ backgroundColor: colors.success, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15 }}>إصدار تقرير الصيانة وضمان الإصلاح 📋</Text>
            </TouchableOpacity>
          )}

          {/* Merchant Actions */}
          {role === 'merchant' && order?.status === 'pending' && (
            <TouchableOpacity
              onPress={handleShip}
              disabled={actionLoading}
              style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>تأكيد شحن المنتج للعميل 🚚</Text>
            </TouchableOpacity>
          )}

          {/* Customer Cancel Button (Within 10 mins) */}
          {role === 'customer' && order?.status === 'pending' && (() => {
            const ageMins = order?.createdAt
              ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
              : 0;
            const canCancelOrder = ageMins <= 10;
            const remainingMins = Math.max(0, 10 - ageMins);

            return canCancelOrder ? (
              <TouchableOpacity
                onPress={handleCancel}
                disabled={actionLoading}
                style={{ backgroundColor: '#1E1E1E', borderWidth: 1, borderColor: colors.danger, paddingVertical: 12, borderRadius: borderRadius.md, alignItems: 'center' }}
              >
                <Text style={{ color: colors.danger, fontWeight: '900', fontSize: 14 }}>
                  إلغاء الطلب ❌ (متبقي {remainingMins} دقيقة لإلغاء مجاني)
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.25)', padding: 12, borderRadius: borderRadius.md, alignItems: 'center' }}>
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 18 }}>
                  ⚠️ مضى أكثر من 10 دقائق على تأكيد الطلب. لطلب الإلغاء يرجى التواصل مع الدعم الفني.
                </Text>
              </View>
            );
          })()}

          {/* Direct Phone Call Button */}
          <TouchableOpacity
            onPress={() => handleCall()}
            style={{
              backgroundColor: '#1E1E1E',
              borderWidth: 1,
              borderColor: '#333',
              paddingVertical: 12,
              borderRadius: borderRadius.md,
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Phone color={colors.white} size={18} />
            <Text style={{ color: colors.white, fontWeight: '700', fontSize: 14 }}>
              الاتصال بـ {role === 'customer' ? 'الفني' : 'العميل'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ================= MODAL: QUOTATION (عرض السعر) ================= */}
      <Modal visible={quoteModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: spacing.md }}>
          <View style={{ backgroundColor: '#161922', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#8B5CF6' }}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: spacing.md }}>
              تقديم عرض سعر تفصيلي للعميل 📝
            </Text>

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>أجر اليد / المصنعية (ج.م) *</Text>
            <TextInput
              style={{ backgroundColor: '#1E2330', color: colors.white, padding: 12, borderRadius: 8, textAlign: 'right', marginBottom: 12, borderWidth: 1, borderColor: '#334155' }}
              placeholder="مثال: 150"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={laborCost}
              onChangeText={setLaborCost}
            />

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>تكلفة قطع الغيار (ج.م)</Text>
            <TextInput
              style={{ backgroundColor: '#1E2330', color: colors.white, padding: 12, borderRadius: 8, textAlign: 'right', marginBottom: 12, borderWidth: 1, borderColor: '#334155' }}
              placeholder="مثال: 200 (أو 0 إذا لم توجد قطع)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={partsCost}
              onChangeText={setPartsCost}
            />

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>رسوم الكشف والفحص (ج.م)</Text>
            <TextInput
              style={{ backgroundColor: '#1E2330', color: colors.white, padding: 12, borderRadius: 8, textAlign: 'right', marginBottom: 12, borderWidth: 1, borderColor: '#334155' }}
              placeholder="50"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={inspectionFee}
              onChangeText={setInspectionFee}
            />

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>ملاحظات الفني للعميل</Text>
            <TextInput
              style={{ backgroundColor: '#1E2330', color: colors.white, padding: 12, borderRadius: 8, textAlign: 'right', marginBottom: 16, borderWidth: 1, borderColor: '#334155', minHeight: 60 }}
              placeholder="تفاصيل العطل والقطع المطلوب استبدالها..."
              placeholderTextColor="#666"
              multiline
              value={quoteNotes}
              onChangeText={setQuoteNotes}
            />

            <View style={{ backgroundColor: '#111319', padding: 10, borderRadius: 8, marginBottom: 16, flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.white, fontWeight: '700' }}>المبلغ الإجمالي المقدر:</Text>
              <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16 }}>
                {(parseFloat(laborCost) || 0) + (parseFloat(partsCost) || 0) + (parseFloat(inspectionFee) || 0)} ج.م
              </Text>
            </View>

            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <TouchableOpacity
                onPress={handleSubmitQuote}
                disabled={actionLoading}
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 14 }}>إرسال العرض للعميل 🚀</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setQuoteModalVisible(false)}
                style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: '#1E1E1E' }}
              >
                <Text style={{ color: colors.gray, fontWeight: '700' }}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: SERVICE REPORT (تقرير الصيانة) ================= */}
      <Modal visible={reportModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: spacing.md }}>
          <ScrollView contentContainerStyle={{ backgroundColor: '#142018', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.success }}>
            <Text style={{ color: colors.success, fontSize: 16, fontWeight: '900', textAlign: 'right', marginBottom: spacing.md }}>
              إصدار تقرير الصيانة وضمان الإصلاح 📋
            </Text>

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>التشخيص الفني للعطل المنفذ *</Text>
            <TextInput
              style={{ backgroundColor: '#0D1711', color: colors.white, padding: 10, borderRadius: 8, textAlign: 'right', marginBottom: 10, borderWidth: 1, borderColor: '#1F3828', minHeight: 60 }}
              placeholder="مثال: تسريب غاز تبريد في المكثف وتلف الثرموستات..."
              placeholderTextColor="#666"
              multiline
              value={reportDiagnosis}
              onChangeText={setReportDiagnosis}
            />

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>الإجراءات الفنية المنفذة للإصلاح *</Text>
            <TextInput
              style={{ backgroundColor: '#0D1711', color: colors.white, padding: 10, borderRadius: 8, textAlign: 'right', marginBottom: 10, borderWidth: 1, borderColor: '#1F3828', minHeight: 60 }}
              placeholder="مثال: لحام مكان التسريب، إعادة شحن الفريون، تركيب ثرموستات أصلي..."
              placeholderTextColor="#666"
              multiline
              value={reportRepairAction}
              onChangeText={setReportRepairAction}
            />

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>قطع الغيار المركبة</Text>
            <TextInput
              style={{ backgroundColor: '#0D1711', color: colors.white, padding: 10, borderRadius: 8, textAlign: 'right', marginBottom: 10, borderWidth: 1, borderColor: '#1F3828' }}
              placeholder="مثال: ثرموستات دانفوس أصلي، شحن فريون R134a..."
              placeholderTextColor="#666"
              value={reportPartsUsed}
              onChangeText={setReportPartsUsed}
            />

            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>مدة الضمان المعتمد (بالأيام)</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 10, marginBottom: 16 }}>
              {['30', '60', '90'].map((days) => (
                <TouchableOpacity
                  key={days}
                  onPress={() => setReportWarrantyDays(days)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 6,
                    backgroundColor: reportWarrantyDays === days ? colors.success : '#0D1711',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.success,
                  }}
                >
                  <Text style={{ color: reportWarrantyDays === days ? colors.white : colors.gray, fontWeight: '700' }}>
                    {days} يوماً
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <TouchableOpacity
                onPress={handleSubmitReport}
                disabled={actionLoading}
                style={{ flex: 1, backgroundColor: colors.success, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>اعتماد التقرير والضمان ✅</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: '#1E1E1E' }}
              >
                <Text style={{ color: colors.gray, fontWeight: '700' }}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ================= MODAL: CUSTOMER RATING ================= */}
      <Modal visible={rateModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: spacing.md }}>
          <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: spacing.sm }}>
              تقييم خدمة الصيانة ⭐
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center', marginBottom: spacing.md }}>
              رأيك يساعدنا في الحفاظ على أعلى معايير الجودة لفنيي TecnoRexa
            </Text>

            {/* Star Selector */}
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'center', gap: 12, marginBottom: spacing.lg }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setSelectedRating(star)}>
                  <Star
                    size={36}
                    color={star <= selectedRating ? colors.warning : '#444'}
                    fill={star <= selectedRating ? colors.warning : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={{ backgroundColor: '#1E1E1E', color: colors.white, padding: 12, borderRadius: 8, textAlign: 'right', marginBottom: 16, borderWidth: 1, borderColor: '#333', minHeight: 70 }}
              placeholder="اكتب تعليقك وملاحظاتك على الخدمة..."
              placeholderTextColor="#666"
              multiline
              value={ratingComment}
              onChangeText={setRatingComment}
            />

            <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
              <TouchableOpacity
                onPress={handleSubmitRating}
                disabled={actionLoading}
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 14 }}>إرسال التقييم ⭐</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRateModalVisible(false)}
                style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: '#1E1E1E' }}
              >
                <Text style={{ color: colors.gray, fontWeight: '700' }}>لاحقاً</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
