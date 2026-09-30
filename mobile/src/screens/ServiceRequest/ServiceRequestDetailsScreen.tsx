import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, StyleSheet, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Wrench, CheckCircle, XCircle, DollarSign, Clock, Star, Package, ArrowLeft, Phone, MapPin, AlertCircle, CreditCard, ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';
import { normalizeRole } from '../../utils/permissions';

export default function ServiceRequestDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: string };
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sr, setSr] = useState<any>(null);

  // Modals state
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [priceData, setPriceData] = useState({ laborCost: '', travelCost: '', partsCost: '', inspectionFee: '', notes: '' });

  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [completeData, setCompleteData] = useState({ diagnosis: '', repairAction: '', warrantyDays: '30' });

  const [partsModalVisible, setPartsModalVisible] = useState(false);
  const [partsData, setPartsData] = useState({ productName: '', quantity: '1' });

  const [paymentMethod, setPaymentMethod] = useState('visa');
  const [referenceCode, setReferenceCode] = useState('');

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchDetails = useCallback(async () => {
    try {
      const response = await api.get(`/api/service-requests/${id}`);
      setSr(response.data.data || response.data);
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.message || 'حدث خطأ أثناء جلب التفاصيل');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const handleAction = async (endpoint: string, method: 'post' | 'put' = 'post', data?: any) => {
    setActionLoading(true);
    try {
      if (method === 'post') {
        await api.post(endpoint, data);
      } else {
        await api.put(endpoint, data);
      }
      Alert.alert('نجاح', 'تم تنفيذ العملية بنجاح');
      setPriceModalVisible(false);
      setCompleteModalVisible(false);
      setPartsModalVisible(false);
      fetchDetails();
    } catch (error: any) {
      Alert.alert('خطأ', error.response?.data?.message || 'حدث خطأ أثناء تنفيذ العملية');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!sr) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.errorText}>لم يتم العثور على الطلب</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>عودة</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const renderStatusBadge = () => {
    return (
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{sr.status}</Text>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (actionLoading) {
      return (
        <View style={styles.actionContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    const { status } = sr;

    if (role === 'technician') {
      if (status === 'waiting_for_technician' || status === 'new') {
        return (
          <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction(`/api/service-requests/${id}/accept`)}>
            <Text style={styles.buttonText}>قبول الطلب</Text>
          </TouchableOpacity>
        );
      }
      if (status === 'assigned') {
        return (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setPriceModalVisible(true)}>
            <Text style={styles.buttonText}>تحديد السعر</Text>
          </TouchableOpacity>
        );
      }
      if (status === 'paid') {
        return (
          <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction(`/api/service-requests/${id}/start`)}>
            <Text style={styles.buttonText}>بدء العمل</Text>
          </TouchableOpacity>
        );
      }
      if (status === 'in_progress') {
        return (
          <View style={styles.rowButtons}>
            <TouchableOpacity style={[styles.primaryButton, { flex: 1, marginLeft: 8 }]} onPress={() => setCompleteModalVisible(true)}>
              <Text style={styles.buttonText}>إتمام الخدمة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryButton, { flex: 1, marginRight: 8 }]} onPress={() => setPartsModalVisible(true)}>
              <Text style={[styles.buttonText, { color: colors.text }]}>طلب قطعة غيار</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (status === 'part_received') {
        return (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setCompleteModalVisible(true)}>
            <Text style={styles.buttonText}>استكمال الخدمة</Text>
          </TouchableOpacity>
        );
      }
    }

    if (role === 'customer') {
      const showCancel = ['new', 'waiting_for_technician', 'assigned'].includes(status);
      
      if (status === 'waiting_for_customer_approval') {
        return (
          <View style={styles.rowButtons}>
            <TouchableOpacity style={[styles.successButton, { flex: 1, marginLeft: 8 }]} onPress={() => handleAction(`/api/service-requests/${id}/approve-price`, 'post', { decision: 'approve' })}>
              <Text style={styles.buttonText}>موافق على السعر</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.dangerButton, { flex: 1, marginRight: 8 }]} onPress={() => handleAction(`/api/service-requests/${id}/approve-price`, 'post', { decision: 'reject' })}>
              <Text style={styles.buttonText}>رفض السعر</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (status === 'payment_pending') {
        return (
          <View style={styles.paymentContainer}>
            <Text style={styles.sectionTitle}>إتمام الدفع</Text>
            <View style={styles.refBox}>
              <Text style={styles.refTextLabel}>رقم المرجع:</Text>
              <Text style={styles.refText}>{sr.paymentReference || 'N/A'}</Text>
            </View>
            <View style={styles.paymentMethods}>
              {['visa', 'mastercard', 'wallet', 'instapay'].map(m => (
                <TouchableOpacity key={m} style={[styles.methodButton, paymentMethod === m && styles.methodButtonActive]} onPress={() => setPaymentMethod(m)}>
                  <Text style={[styles.methodText, paymentMethod === m && styles.methodTextActive]}>
                    {m === 'visa' ? 'Visa' : m === 'mastercard' ? 'Mastercard' : m === 'wallet' ? 'محفظة إلكترونية' : 'InstaPay'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="رقم العملية (Reference Code)"
              placeholderTextColor={colors.gray400}
              value={referenceCode}
              onChangeText={setReferenceCode}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction(`/api/service-requests/${id}/payment`, 'post', { method: paymentMethod, referenceCode })}>
              <Text style={styles.buttonText}>تأكيد الدفع</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (status === 'completed') {
        return (
          <TouchableOpacity style={styles.successButton} onPress={() => handleAction(`/api/service-requests/${id}/confirm`)}>
            <Text style={styles.buttonText}>تأكيد استلام الجهاز</Text>
          </TouchableOpacity>
        );
      }
      if (status === 'customer_confirmed') {
        return (
          <View style={styles.ratingContainer}>
            <Text style={styles.sectionTitle}>تقييم الخدمة</Text>
            <View style={styles.starsContainer}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Star size={32} color={star <= rating ? colors.warning : colors.gray600} fill={star <= rating ? colors.warning : 'transparent'} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.textArea}
              placeholder="تعليقك (اختياري)"
              placeholderTextColor={colors.gray400}
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <TouchableOpacity style={styles.primaryButton} onPress={() => handleAction(`/api/service-requests/${id}/rate`, 'post', { rating, comment })}>
              <Text style={styles.buttonText}>إرسال التقييم</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (showCancel) {
        return (
          <TouchableOpacity style={[styles.dangerButton, { marginTop: 16 }]} onPress={() => handleAction(`/api/service-requests/${id}/cancel`)}>
            <Text style={styles.buttonText}>إلغاء الطلب</Text>
          </TouchableOpacity>
        );
      }
    }

    return null;
  };

  const calculatedTotal = (
    (parseFloat(priceData.laborCost) || 0) +
    (parseFloat(priceData.travelCost) || 0) +
    (parseFloat(priceData.partsCost) || 0) +
    (parseFloat(priceData.inspectionFee) || 0)
  ).toString();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلب #{sr.referenceNumber}</Text>
        {renderStatusBadge()}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>معلومات الجهاز</Text>
          <Text style={styles.infoText}>النوع: {sr.deviceType}</Text>
          <Text style={styles.infoText}>الماركة: {sr.deviceBrand}</Text>
          <Text style={styles.infoText}>الموديل: {sr.deviceModel}</Text>
          <Text style={styles.infoText}>المشكلة: {sr.problemDescription}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>الموقع</Text>
          <Text style={styles.infoText}>المحافظة: {sr.customerGovernorate}</Text>
          <Text style={styles.infoText}>العنوان: {sr.customerAddress}</Text>
        </View>

        {sr.technician && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>الفني</Text>
            <Text style={styles.infoText}>الاسم: {sr.technician.name || sr.technicianName}</Text>
            <Text style={styles.infoText}>الهاتف: {sr.technician.phone || sr.technicianPhone}</Text>
            <View style={styles.ratingRow}>
              <Star size={16} color={colors.warning} fill={colors.warning} />
              <Text style={styles.ratingText}>{sr.technician.rating || sr.rating || 'N/A'}</Text>
            </View>
          </View>
        )}

        {(sr.totalAmount || sr.laborCost) ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>التكلفة</Text>
            {sr.inspectionFee ? <Text style={styles.infoText}>رسوم الفحص: {sr.inspectionFee}</Text> : null}
            {sr.laborCost ? <Text style={styles.infoText}>أجرة اليد: {sr.laborCost}</Text> : null}
            {sr.partsCost ? <Text style={styles.infoText}>تكلفة القطع: {sr.partsCost}</Text> : null}
            {sr.travelCost ? <Text style={styles.infoText}>رسوم الانتقال: {sr.travelCost}</Text> : null}
            {sr.commission ? <Text style={styles.infoText}>العمولة: {sr.commission}</Text> : null}
            <Text style={[styles.infoText, styles.totalText]}>الإجمالي: {sr.totalAmount}</Text>
          </View>
        ) : null}

        {(sr.paymentMethod || sr.paymentStatus) ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>معلومات الدفع</Text>
            <Text style={styles.infoText}>الطريقة: {sr.paymentMethod}</Text>
            <Text style={styles.infoText}>الحالة: {sr.paymentStatus}</Text>
            {sr.paymentReference && <Text style={styles.infoText}>رقم المرجع: {sr.paymentReference}</Text>}
            {sr.paidAt && <Text style={styles.infoText}>تاريخ الدفع: {new Date(sr.paidAt).toLocaleString('ar-EG')}</Text>}
          </View>
        ) : null}

        {sr.spareParts && sr.spareParts.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>قطع الغيار المطلوبة</Text>
            {sr.spareParts.map((part: any, index: number) => (
              <Text key={index} style={styles.infoText}>- {part.productName} (الكمية: {part.quantity})</Text>
            ))}
          </View>
        )}

        {sr.logs && sr.logs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>سجل الطلب</Text>
            {sr.logs.map((log: any, index: number) => (
              <View key={index} style={styles.logItem}>
                <View style={styles.logDot} />
                <View style={styles.logContent}>
                  <Text style={styles.logAction}>{log.action}</Text>
                  <Text style={styles.logDate}>{new Date(log.createdAt).toLocaleString('ar-EG')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionsWrapper}>
          {renderActionButtons()}
        </View>
      </ScrollView>

      {/* Technician Price Modal */}
      <Modal visible={priceModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>تحديد التكلفة</Text>
            <TextInput style={styles.input} placeholder="رسوم الفحص" keyboardType="numeric" placeholderTextColor={colors.gray400} value={priceData.inspectionFee} onChangeText={t => setPriceData({...priceData, inspectionFee: t})} />
            <TextInput style={styles.input} placeholder="أجرة اليد" keyboardType="numeric" placeholderTextColor={colors.gray400} value={priceData.laborCost} onChangeText={t => setPriceData({...priceData, laborCost: t})} />
            <TextInput style={styles.input} placeholder="تكلفة قطع الغيار" keyboardType="numeric" placeholderTextColor={colors.gray400} value={priceData.partsCost} onChangeText={t => setPriceData({...priceData, partsCost: t})} />
            <TextInput style={styles.input} placeholder="رسوم الانتقال" keyboardType="numeric" placeholderTextColor={colors.gray400} value={priceData.travelCost} onChangeText={t => setPriceData({...priceData, travelCost: t})} />
            <TextInput style={styles.input} placeholder="ملاحظات (اختياري)" placeholderTextColor={colors.gray400} value={priceData.notes} onChangeText={t => setPriceData({...priceData, notes: t})} />
            <Text style={styles.totalCalcText}>الإجمالي المقدر: {calculatedTotal}</Text>
            
            <View style={styles.rowButtons}>
              <TouchableOpacity style={[styles.secondaryButton, {flex: 1, marginLeft: 8}]} onPress={() => setPriceModalVisible(false)}>
                <Text style={[styles.buttonText, {color: colors.text}]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, {flex: 1, marginRight: 8}]} onPress={() => handleAction(`/api/service-requests/${id}/price`, 'post', priceData)}>
                <Text style={styles.buttonText}>إرسال للعميل</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Complete Service Modal */}
      <Modal visible={completeModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>إتمام الخدمة</Text>
            <TextInput style={styles.input} placeholder="التشخيص" placeholderTextColor={colors.gray400} value={completeData.diagnosis} onChangeText={t => setCompleteData({...completeData, diagnosis: t})} />
            <TextInput style={styles.input} placeholder="الإجراء المتخذ" placeholderTextColor={colors.gray400} value={completeData.repairAction} onChangeText={t => setCompleteData({...completeData, repairAction: t})} />
            <TextInput style={styles.input} placeholder="مدة الضمان (بالأيام)" keyboardType="numeric" placeholderTextColor={colors.gray400} value={completeData.warrantyDays} onChangeText={t => setCompleteData({...completeData, warrantyDays: t})} />
            
            <View style={styles.rowButtons}>
              <TouchableOpacity style={[styles.secondaryButton, {flex: 1, marginLeft: 8}]} onPress={() => setCompleteModalVisible(false)}>
                <Text style={[styles.buttonText, {color: colors.text}]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, {flex: 1, marginRight: 8}]} onPress={() => handleAction(`/api/service-requests/${id}/complete`, 'post', completeData)}>
                <Text style={styles.buttonText}>تأكيد الإتمام</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Request Spare Parts Modal */}
      <Modal visible={partsModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>طلب قطعة غيار</Text>
            <TextInput style={styles.input} placeholder="اسم القطعة" placeholderTextColor={colors.gray400} value={partsData.productName} onChangeText={t => setPartsData({...partsData, productName: t})} />
            <TextInput style={styles.input} placeholder="الكمية" keyboardType="numeric" placeholderTextColor={colors.gray400} value={partsData.quantity} onChangeText={t => setPartsData({...partsData, quantity: t})} />
            
            <View style={styles.rowButtons}>
              <TouchableOpacity style={[styles.secondaryButton, {flex: 1, marginLeft: 8}]} onPress={() => setPartsModalVisible(false)}>
                <Text style={[styles.buttonText, {color: colors.text}]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, {flex: 1, marginRight: 8}]} onPress={() => handleAction(`/api/service-requests/${id}/spare-parts`, 'post', partsData)}>
                <Text style={styles.buttonText}>طلب</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    marginBottom: spacing.md,
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    color: colors.text,
    fontFamily: typography.fonts.medium,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    textAlign: 'right',
    marginRight: spacing.sm,
  },
  statusBadge: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    color: colors.primary,
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.bold,
    marginBottom: spacing.sm,
    textAlign: 'right',
  },
  infoText: {
    color: colors.text,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  totalText: {
    fontFamily: typography.fonts.bold,
    color: colors.success,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ratingText: {
    color: colors.text,
    fontFamily: typography.fonts.medium,
    marginLeft: spacing.xs,
  },
  logItem: {
    flexDirection: 'row-reverse',
    marginBottom: spacing.sm,
  },
  logDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginLeft: 8,
  },
  logContent: {
    flex: 1,
  },
  logAction: {
    color: colors.text,
    fontFamily: typography.fonts.medium,
    textAlign: 'right',
  },
  logDate: {
    color: colors.gray400,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    textAlign: 'right',
    marginTop: 2,
  },
  actionsWrapper: {
    marginTop: spacing.md,
  },
  actionContainer: {
    alignItems: 'center',
    padding: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: colors.success,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: colors.error,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.md,
  },
  rowButtons: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  paymentContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  refBox: {
    backgroundColor: colors.warning + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  refTextLabel: {
    color: colors.warning,
    fontFamily: typography.fonts.medium,
  },
  refText: {
    color: colors.warning,
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.lg,
  },
  paymentMethods: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  methodButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  methodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  methodText: {
    color: colors.text,
    fontFamily: typography.fonts.regular,
  },
  methodTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontFamily: typography.fonts.regular,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  textArea: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontFamily: typography.fonts.regular,
    textAlign: 'right',
    marginBottom: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  ratingContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  starsContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  totalCalcText: {
    color: colors.primary,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontSize: typography.sizes.md,
  }
});
