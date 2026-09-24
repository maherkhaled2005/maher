import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import {
  Check,
  X,
  ArrowLeft,
  ShieldCheck,
  Phone,
  Award,
  CheckCircle2,
  DollarSign,
  Wrench,
  Building2,
  Clock,
  Sparkles,
  Eye,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Button } from '../../components/common';
import { api } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';

export default function TradeRequestsScreen({ navigation }: any) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rejectingReq, setRejectingReq] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadTradeRequests = async () => {
    try {
      const res = await api.get('/trade-requests').catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        const pendingOnly = res.data.filter((r: any) => r.status === 'pending');
        setRequests(pendingOnly);
      } else {
        setRequests([]);
      }
    } catch (e) {
      console.warn('Error loading trade requests', e);
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTradeRequests();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTradeRequests();
  }, []);

  const handleApprove = (req: any) => {
    Alert.alert(
      'تأكيد الترقية ✅',
      `هل أنت متأكد من ترقية "${req.customerName}" إلى ${req.type === 'technician' ? 'فني معتمد 🧑‍🔧' : 'تاجر معتمد 🏪'}؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'موافقة وترقية',
          onPress: async () => {
            try {
              setProcessingId(req.id);
              await api.post(`/trade-requests/${req.id}/approve`).catch(() => {});
              setRequests(prev => prev.filter(r => r.id !== req.id));
              const msg = `تمت الموافقة بنجاح وترقية ${req.customerName} إلى ${req.type === 'technician' ? 'فني معتمد' : 'تاجر معتمد'} ✅`;
              Alert.alert('تمت الموافقة', msg);
            } catch (err: any) {
              Alert.alert('خطأ', err.message || 'تعذر اعتماد الترقية');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة سبب الرفض ⚠️');
      return;
    }
    try {
      const reqId = rejectingReq.id;
      setProcessingId(reqId);
      await api.post(`/trade-requests/${reqId}/reject`, { reason: rejectReason.trim() }).catch(() => {});
      setRequests(prev => prev.filter(r => r.id !== reqId));
      setRejectingReq(null);
      setRejectReason('');
      const msg = 'تم رفض الطلب وإرجاع المبلغ لمحفظة المستخدم بنجاح.';
      Alert.alert('تم الرفض', msg);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر رفض الطلب');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      <OwnerHeader
        title="موافقات الترقية والاعتماد"
        subtitle="مراجعة طلبات الانضمام لكادر الفنيين والتجار المعتمدين"
        sectionNumber={6}
        navigation={navigation}
        currentScreen="TradeRequests"
        showBack
        onRefresh={loadTradeRequests}
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.gray, marginTop: spacing.md, fontWeight: '700' }}>
              جاري فحص طلبات الترقية المعلقة...
            </Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <CheckCircle2 color={colors.success} size={60} style={{ marginBottom: spacing.md }} />
            <Text style={{ color: colors.white, fontSize: typography.sizes.lg, fontWeight: '900' }}>
              لا توجد طلبات ترقية معلقة
            </Text>
            <Text style={{ color: colors.gray, marginTop: spacing.sm, textAlign: 'center' }}>
              تمت مراجعة واعتماد جميع طلبات الفنيين والتجار بنجاح.
            </Text>
          </View>
        ) : (
          requests.map(req => (
            <View
              key={req.id}
              style={{
                backgroundColor: '#141414',
                padding: spacing.lg,
                borderRadius: borderRadius.xl,
                marginBottom: spacing.md,
                borderWidth: 1,
                borderColor: req.type === 'technician' ? 'rgba(234, 88, 12, 0.4)' : 'rgba(21, 128, 61, 0.4)',
              }}
            >
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: req.type === 'technician' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(21, 128, 61, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: req.type === 'technician' ? colors.technician : colors.merchant,
                    }}
                  >
                    {req.type === 'technician' ? (
                      <Wrench size={22} color={colors.technician} />
                    ) : (
                      <Building2 size={22} color={colors.merchant} />
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.white, fontWeight: '900', fontSize: 16 }}>{req.customerName}</Text>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>{req.phone}</Text>
                  </View>
                </View>

                <View
                  style={{
                    backgroundColor: req.type === 'technician' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(21, 128, 61, 0.15)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: borderRadius.md,
                    borderWidth: 1,
                    borderColor: req.type === 'technician' ? colors.technician : colors.merchant,
                  }}
                >
                  <Text style={{ color: req.type === 'technician' ? colors.technician : colors.merchant, fontWeight: '900', fontSize: 12 }}>
                    {req.type === 'technician' ? 'طلب فني 🧑‍🔧' : 'طلب تاجر 🏪'}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  backgroundColor: '#1A1A1A',
                  padding: spacing.md,
                  borderRadius: borderRadius.lg,
                  marginBottom: spacing.md,
                  gap: spacing.xs,
                }}
              >
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.gray, fontSize: 12 }}>التخصص / النشاط:</Text>
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}>{req.specialty}</Text>
                </View>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.gray, fontSize: 12 }}>الرسوم المسددة:</Text>
                  <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>{req.feePaid} ج.م</Text>
                </View>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.gray, fontSize: 12 }}>رقم محفظة التحويل:</Text>
                  <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}>{req.senderPhone || req.phone}</Text>
                </View>
                {req.transferReceipt && (
                  <View style={{ marginTop: 8, alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => setPreviewImage(req.transferReceipt)}
                      style={{
                        flexDirection: 'row-reverse',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: '#222',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.primary + '66',
                      }}
                    >
                      <Eye size={14} color={colors.primary} />
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                        معاينة صورة إيصال التحويل 🧾
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {req.experience && (
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>الخبرة / الاعتماد:</Text>
                    <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 13 }}>{req.experience}</Text>
                  </View>
                )}
                {req.date && (
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>تاريخ التقديم:</Text>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>{req.date}</Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row-reverse', gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => handleApprove(req)}
                  disabled={processingId === req.id}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    padding: spacing.md,
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: processingId === req.id ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>موافقة وترقية ✓</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setRejectingReq(req)}
                  disabled={processingId === req.id}
                  style={{
                    flex: 1,
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    padding: spacing.md,
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: colors.danger,
                    opacity: processingId === req.id ? 0.6 : 1,
                  }}
                >
                  <Text style={{ color: colors.danger, fontWeight: '900', fontSize: 14 }}>رفض واسترجاع ✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={!!rejectingReq} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ backgroundColor: '#141414', padding: spacing.xl, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.border, width: '100%', maxWidth: 460 }}>
            <Text style={{ color: colors.danger, fontSize: typography.sizes.lg, fontWeight: '900', textAlign: 'right', marginBottom: spacing.md }}>
              سبب رفض الترقية
            </Text>
            <TextInput
              style={{
                backgroundColor: '#1A1A1A',
                color: colors.white,
                borderWidth: 1,
                borderColor: 'rgba(212, 175, 55, 0.25)',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                textAlign: 'right',
                marginBottom: spacing.lg,
                minHeight: 100,
              }}
              placeholder="اكتب سبب الرفض ليتم إشعار المستخدم فوراً..."
              placeholderTextColor={colors.gray}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={{ flexDirection: 'row-reverse', gap: spacing.md }}>
              <TouchableOpacity
                onPress={submitReject}
                style={{
                  flex: 1,
                  backgroundColor: colors.danger,
                  padding: spacing.md,
                  borderRadius: borderRadius.lg,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '900' }}>تأكيد الرفض</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setRejectingReq(null)}
                style={{
                  flex: 1,
                  backgroundColor: '#222222',
                  padding: spacing.md,
                  borderRadius: borderRadius.lg,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.gray, fontWeight: '900' }}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Image Preview Modal */}
      <Modal visible={!!previewImage} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 450, backgroundColor: '#18181B', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 14 }}>صورة إيصال التحويل المرفق</Text>
              <TouchableOpacity onPress={() => setPreviewImage(null)} style={{ padding: 4 }}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>
            {previewImage && (
              <Image source={{ uri: previewImage }} style={{ width: '100%', height: 360, borderRadius: 10, resizeMode: 'contain' }} />
            )}
            <TouchableOpacity
              onPress={() => setPreviewImage(null)}
              style={{ marginTop: 12, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
            >
              <Text style={{ color: '#000', fontWeight: '900' }}>إغلاق المعاينة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

