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
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { api } from '../../api/client';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'قيد الانتظار', color: colors.warning, icon: Clock },
  accepted: { label: 'تم القبول', color: colors.info, icon: CheckCircle2 },
  on_way: { label: 'في الطريق', color: colors.primary, icon: Navigation },
  in_progress: { label: 'جاري التنفيذ', color: colors.primary, icon: Wrench },
  completed: { label: 'مكتمل بنجاح', color: colors.success, icon: CheckCircle2 },
  cancelled: { label: 'ملغي', color: colors.danger, icon: ShieldAlert },
};

export default function OrderDetailsScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const { orderId } = route.params || { orderId: 'ORD-001' };
  const role = user?.role || 'customer';

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      if (res.data) {
        setOrder(res.data);
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
    const targetPhone = phoneNumber || order?.clientPhone || order?.phone || '01000000000';
    Linking.openURL(`tel:${targetPhone}`).catch(() => {});
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

  const handleArrive = async () => {
    try {
      setActionLoading(true);
      await api.post(`/orders/${order.id}/arrive`);
      Alert.alert('✅ تم التحديث', 'تم تسجيل وصولك لموقع العميل بنجاح.');
      await fetchOrder();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تحديث الحالة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      await api.post(`/orders/${order.id}/complete`, { report: 'تمت الصيانة بنجاح', partsCost: 0 });
      Alert.alert('🎉 مبروك', 'تم إتمام الصيانة وإغلاق الطلب بنجاح.');
      await fetchOrder();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إنهاء الطلب');
    } finally {
      setActionLoading(false);
    }
  };

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
  const isMaintenance = order?.type === 'maintenance' || order?.type === 'technician' || !!order?.technicianName;

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
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
          {order ? `تفاصيل الطلب #${order.id}` : 'تفاصيل الطلب'}
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
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
            <StatusIcon color={currentStatus.color} size={24} />
            <View>
              <Text style={{ color: currentStatus.color, fontSize: typography.sizes.md, fontWeight: '900' }}>
                {currentStatus.label}
              </Text>
              <Text style={{ color: colors.gray, fontSize: 12 }}>
                {isMaintenance ? 'خدمة صيانة منزلية' : 'طلب شراء من السوق'}
              </Text>
            </View>
          </View>
          <View style={{ backgroundColor: 'rgba(212,175,55,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 14 }}>
              {order?.total || order?.totalPrice || 0} ج.م
            </Text>
          </View>
        </View>

        {/* Customer / Service Info Card */}
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
            معلومات {isMaintenance ? 'الخدمة والعميل' : 'الشحن والتوصيل'}
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
              {order?.clientPhone || order?.phone || '01000000000'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MapPin color={colors.primary} size={16} />
            <Text style={{ color: colors.gray, fontSize: 13, flex: 1, textAlign: 'right' }}>
              {order?.address || 'العنوان محدد في الخريطة'}
            </Text>
          </View>

          {order?.problemDesc && (
            <View style={{ backgroundColor: '#1A1A1A', padding: 10, borderRadius: 8, marginTop: 6, borderWidth: 1, borderColor: '#333' }}>
              <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right', marginBottom: 2 }}>وصف المشكلة / العطل:</Text>
              <Text style={{ color: colors.white, fontSize: 13, textAlign: 'right', lineHeight: 20 }}>{order.problemDesc}</Text>
            </View>
          )}
        </View>

        {/* Assigned Technician Card (if maintenance) */}
        {isMaintenance && (
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
              الفني المكلف بالصيانة
            </Text>

            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(212,175,55,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench color={colors.primary} size={20} />
                </View>
                <View>
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: 14 }}>
                    {order?.technicianName || 'المهندس مصطفى'}
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 12 }}>
                    {order?.technicianPhone || '01000000000'}
                  </Text>
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

        {/* Order Items Breakdown */}
        <View
          style={{
            backgroundColor: '#141414',
            padding: spacing.md,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: '#222',
            marginBottom: spacing.xl,
          }}
        >
          <Text style={{ color: colors.white, fontSize: 14, fontWeight: '900', textAlign: 'right', marginBottom: spacing.sm }}>
            تفاصيل البنود والأسعار
          </Text>

          {Array.isArray(order?.items) && order.items.length > 0 ? (
            order.items.map((item: any, idx: number) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row-reverse',
                  justifyContent: 'space-between',
                  borderBottomWidth: 1,
                  borderBottomColor: '#222',
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: colors.white, fontSize: 13 }}>{item.qty || 1}x {item.name || item.title || 'بند صيانة'}</Text>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                  {(item.price || 0) * (item.qty || 1)} ج.م
                </Text>
              </View>
            ))
          ) : (
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 8 }}>
              <Text style={{ color: colors.white, fontSize: 13 }}>خدمة صيانة وفحص فني</Text>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>{order?.total || 0} ج.م</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 }}>
            <Text style={{ color: colors.white, fontSize: 14, fontWeight: '900' }}>المبلغ الإجمالي:</Text>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900' }}>
              {order?.total || order?.totalPrice || 0} ج.م
            </Text>
          </View>
        </View>

        {/* Action Buttons Depending on Role */}
        <View style={{ gap: 10 }}>
          {/* Technician Actions */}
          {role === 'technician' && order?.status === 'pending' && (
            <TouchableOpacity
              onPress={handleArrive}
              disabled={actionLoading}
              style={{ backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>وصلت لموقع العميل 📍</Text>
            </TouchableOpacity>
          )}

          {role === 'technician' && (order?.status === 'on_way' || order?.status === 'in_progress') && (
            <TouchableOpacity
              onPress={handleComplete}
              disabled={actionLoading}
              style={{ backgroundColor: colors.success, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: 'center' }}
            >
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15 }}>إتمام الصيانة وإغلاق الطلب ✅</Text>
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

          {/* Customer Actions */}
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

          {/* General Call Button */}
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
    </SafeAreaView>
  );
}
