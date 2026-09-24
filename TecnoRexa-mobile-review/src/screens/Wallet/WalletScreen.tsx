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
} from 'react-native';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  User,
  Search,
  X,
  Send,
  PlusCircle,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';
import { useAuthStore } from '../../store/authStore';

interface WithdrawalRecord {
  id: string;
  userId: string;
  type: string;
  amount: number;
  description: string;
  referenceId?: string;
  status: 'pending' | 'completed' | 'rejected' | string;
  createdAt: string;
  userName?: string;
  userPhone?: string;
  userRole?: string;
  userBalance?: number;
}

interface TransactionRecord {
  id: string;
  userId: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  userName?: string;
  userPhone?: string;
  userRole?: string;
}

export default function WalletScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const role = user?.role || 'customer';
  const isOwner = role === 'owner';
  const isTechOrMerchant = role === 'technician' || role === 'merchant';
  const isCustomer = role === 'customer' || role === 'client';

  const [platformBalance, setPlatformBalance] = useState(0);
  const [personalBalance, setPersonalBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'transactions'>('withdrawals');

  // Owner Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Owner Adjust Modal
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'deduct'>('add');
  const [adjustReason, setAdjustReason] = useState('');

  // Tech / Merchant Request Withdrawal Modal
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('فودافون كاش');
  const [withdrawAccount, setWithdrawAccount] = useState(user?.phone || '');
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Customer Top-up Modal
  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [topupAmount, setTopupAmount] = useState('100');
  const [topupMethod, setTopupMethod] = useState('بطاقة ائتمان / بنكية');
  const [submittingTopup, setSubmittingTopup] = useState(false);

  const loadWalletData = async () => {
    try {
      setLoading(true);

      if (isOwner) {
        // 1. Platform overview for total balance
        const overview = await fetchApi('/owner/overview');
        if (overview) {
          setOverviewData(overview);
          if (typeof overview.totalRevenue === 'number') {
            setPlatformBalance(overview.totalRevenue);
          }
        }

        // 2. All pending/completed withdrawals
        const wds = await fetchApi('/owner/withdrawals');
        if (Array.isArray(wds)) {
          setWithdrawals(wds);
        }

        // 3. All platform transactions
        const txs = await fetchApi('/transactions');
        if (Array.isArray(txs)) {
          setTransactions(txs);
        }

        // 4. Users list for manual adjustment
        const uList = await fetchApi('/users');
        if (Array.isArray(uList)) {
          setUsersList(uList);
        }
      } else {
        // Personal wallet for Tech / Merchant / Customer
        const wRes = await fetchApi('/user/wallet');
        if (wRes && typeof wRes.balance === 'number') {
          setPersonalBalance(wRes.balance);
        }

        // Personal transactions
        const txs = await fetchApi('/transactions');
        if (Array.isArray(txs)) {
          setTransactions(txs);
          // Extract personal withdrawals from transactions
          const myWds = txs
            .filter((t: any) => t.type === 'withdrawal')
            .map((t: any) => ({
              id: t.id,
              userId: t.userId,
              type: t.type,
              amount: t.amount,
              description: t.description,
              referenceId: t.referenceId,
              status: t.status || 'pending',
              createdAt: t.createdAt,
            }));
          setWithdrawals(myWds);
        }
      }
    } catch (err: any) {
      console.warn('Error loading wallet data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  }, []);

  // Action: Owner Approves Withdrawal
  const handleApproveWithdrawal = async (wd: WithdrawalRecord) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm(`هل أنت متأكد من رغبتك في صرف ${wd.amount} ج.م للمستخدم ${wd.userName || wd.userId}؟`)
      : true;
    if (!confirm) return;

    try {
      const res = await fetchApi(`/owner/withdrawals/${wd.id}/action`, {
        method: 'POST',
        data: { action: 'approve' },
      });
      const msg = res.message || 'تم صرف المبلغ بنجاح.';
      Alert.alert('✅ تمت الموافقة', msg);
      await loadWalletData();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر اعتماد طلب السحب');
    }
  };

  // Action: Owner Confirms Rejection
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('تنبيه', 'يجب كتابة سبب الرفض.');
      return;
    }
    if (!selectedWithdrawal) return;

    try {
      await fetchApi(`/owner/withdrawals/${selectedWithdrawal.id}/action`, {
        method: 'POST',
        data: { action: 'reject', reason: rejectReason.trim() },
      });
      setRejectModalVisible(false);
      Alert.alert('❌ تم الرفض', 'تم رفض طلب السحب وتسجيل السبب في النظام.');
      await loadWalletData();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر رفض الطلب');
    }
  };

  // Action: Owner Manual Balance Adjust
  const handleManualAdjust = async () => {
    if (!adjustUserId) {
      Alert.alert('تنبيه', 'يرجى اختيار المستخدم.');
      return;
    }
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('تنبيه', 'يرجى إدخال مبلغ صحيح.');
      return;
    }
    if (!adjustReason.trim()) {
      Alert.alert('تنبيه', 'يرجى توضيح سبب التعديل للتدقيق الأمني.');
      return;
    }

    try {
      const res = await fetchApi('/owner/wallet/adjust', {
        method: 'POST',
        data: {
          userId: adjustUserId,
          amount: amt,
          type: adjustType,
          reason: adjustReason.trim(),
        },
      });

      setAdjustModalVisible(false);
      setAdjustAmount('');
      setAdjustReason('');
      Alert.alert('✅ تم التعديل', `${res.message} (الرصيد الجديد: ${res.newBalance} ج.م)`);
      await loadWalletData();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تعديل الرصيد');
    }
  };

  // Action: Technician / Merchant Submits Withdrawal Request
  const handleSubmitWithdrawal = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('تنبيه', 'يرجى إدخال مبلغ صحيح للسحب.');
      return;
    }
    if (amt > personalBalance) {
      Alert.alert('تنبيه', `المبلغ المطلوب (${amt} ج.م) أكبر من رصيدك المتاح (${personalBalance} ج.م).`);
      return;
    }
    if (!withdrawAccount.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم المحفظة أو الحساب البنكي لتحويل الأموال.');
      return;
    }

    try {
      setSubmittingWithdraw(true);
      const res = await fetchApi('/wallet/withdraw', {
        method: 'POST',
        data: {
          amount: amt,
          method: withdrawMethod,
          accountInfo: withdrawAccount.trim(),
        },
      });

      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      const msg = res.message || 'تم تقديم طلب السحب بنجاح وهو قيد المراجعة الإدارية.';
      Alert.alert('✅ تم الإرسال', msg);
      await loadWalletData();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إرسال طلب السحب');
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // Action: Customer Top-up Wallet
  const handleSubmitTopup = async () => {
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('تنبيه', 'يرجى إدخال مبلغ صحيح للشحن.');
      return;
    }

    try {
      setSubmittingTopup(true);
      const res = await fetchApi('/wallet/topup', {
        method: 'POST',
        data: {
          amount: amt,
        },
      });

      setTopupModalVisible(false);
      const msg = res.message || `تم شحن المحفظة بمبلغ ${amt} ج.م بنجاح!`;
      Alert.alert('✅ تم الشحن بنجاح', msg);
      await loadWalletData();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر شحن المحفظة');
    } finally {
      setSubmittingTopup(false);
    }
  };

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'pending').length;

  const filteredTransactions = transactions.filter((t) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (t.description || '').toLowerCase().includes(s) ||
      (t.userName || '').toLowerCase().includes(s) ||
      (t.type || '').toLowerCase().includes(s)
    );
  });

  const getHeaderTitle = () => {
    if (isOwner) return 'المحفظة والماليات';
    if (role === 'technician') return 'محفظة الأرباح 🔧';
    if (role === 'merchant') return 'محفظة المتجر 🏪';
    return 'المحفظة الإلكترونية 👤';
  };

  const getHeaderSubtitle = () => {
    if (isOwner) return 'خزينة الشركة والرقابة النقدية';
    if (role === 'technician') return 'أرباح الصيانة وسحب المستحقات';
    if (role === 'merchant') return 'إيرادات المبيعات وسحب الأرباح';
    return 'رصيد الحساب وسجل المعاملات';
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* ☰ Owner Header with Drawer navigation */}
      <OwnerHeader
        title={getHeaderTitle()}
        subtitle={getHeaderSubtitle()}
        sectionNumber={5}
        navigation={navigation}
        currentScreen="Wallet"
        showBack
        onRefresh={loadWalletData}
      />

      {/* Top Banner: Balance Card */}
      <View
        style={{
          backgroundColor: '#111111',
          padding: spacing.lg,
          borderBottomWidth: 1,
          borderColor: '#222',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Wallet size={20} color={colors.primary} />
          <Text style={{ color: colors.gray, fontSize: 13, fontWeight: '700' }}>
            {isOwner ? 'رصيد المنصة الكلي (الخزينة المركزية)' : 'رصيدك المتاح في المحفظة'}
          </Text>
        </View>

        <Text style={{ color: colors.primary, fontSize: 34, fontWeight: '900', marginVertical: 2 }}>
          {(isOwner ? platformBalance : personalBalance).toLocaleString('ar-EG')}{' '}
          <Text style={{ fontSize: 18 }}>ج.م</Text>
        </Text>

        {/* Action Button depending on role */}
        {isOwner && (
          <TouchableOpacity
            onPress={() => {
              setAdjustUserId(usersList[0]?.id || '');
              setAdjustAmount('');
              setAdjustReason('');
              setAdjustType('add');
              setAdjustModalVisible(true);
            }}
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              borderWidth: 1,
              borderColor: colors.primary,
              paddingHorizontal: spacing.md,
              paddingVertical: 8,
              borderRadius: borderRadius.md,
              gap: 6,
              marginTop: spacing.sm,
            }}
          >
            <DollarSign size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>
              تعديل رصيد يدوي (للمالك فقط) 👑
            </Text>
          </TouchableOpacity>
        )}

        {isOwner && (
          <View
            style={{
              flexDirection: 'row-reverse',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: spacing.md,
              width: '100%',
              justifyContent: 'space-between',
            }}
          >
            <View
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: '#18181b',
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#27272a',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.gray, fontSize: 11, fontWeight: '700' }}>إجمالي الإيداعات</Text>
              <Text style={{ color: '#10B981', fontSize: 15, fontWeight: '900', marginTop: 2 }}>
                {(overviewData?.treasury?.totalDeposits || 0).toLocaleString('ar-EG')} ج.م
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: '#18181b',
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#27272a',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.gray, fontSize: 11, fontWeight: '700' }}>المسحوبات المنفذة</Text>
              <Text style={{ color: '#F59E0B', fontSize: 15, fontWeight: '900', marginTop: 2 }}>
                {(overviewData?.treasury?.totalWithdrawals || 0).toLocaleString('ar-EG')} ج.م
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: '#18181b',
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#27272a',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.gray, fontSize: 11, fontWeight: '700' }}>المسحوبات المعلقة</Text>
              <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '900', marginTop: 2 }}>
                {(overviewData?.treasury?.pendingWithdrawals || pendingWithdrawalsCount).toLocaleString('ar-EG')} ج.م
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: '#18181b',
                padding: spacing.sm,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#27272a',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.gray, fontSize: 11, fontWeight: '700' }}>عمولات المنصة</Text>
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '900', marginTop: 2 }}>
                {(overviewData?.treasury?.commissions || 0).toLocaleString('ar-EG')} ج.م
              </Text>
            </View>
          </View>
        )}

        {isTechOrMerchant && (
          <TouchableOpacity
            onPress={() => {
              setWithdrawAmount('');
              setWithdrawModalVisible(true);
            }}
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.xl,
              paddingVertical: 10,
              borderRadius: borderRadius.md,
              gap: 8,
              marginTop: spacing.sm,
            }}
          >
            <Send size={18} color="#000000" />
            <Text style={{ color: '#000000', fontWeight: '900', fontSize: 14 }}>
              طلب سحب أرباح 💸
            </Text>
          </TouchableOpacity>
        )}

        {isCustomer && (
          <TouchableOpacity
            onPress={() => {
              setTopupAmount('100');
              setTopupModalVisible(true);
            }}
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              backgroundColor: colors.primary,
              paddingHorizontal: spacing.xl,
              paddingVertical: 10,
              borderRadius: borderRadius.md,
              gap: 8,
              marginTop: spacing.sm,
            }}
          >
            <PlusCircle size={18} color="#000000" />
            <Text style={{ color: '#000000', fontWeight: '900', fontSize: 14 }}>
              شحن المحفظة 💳
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs Switcher */}
      <View style={{ flexDirection: 'row-reverse', backgroundColor: '#141414', borderBottomWidth: 1, borderColor: '#222' }}>
        <TouchableOpacity
          onPress={() => setActiveTab('withdrawals')}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            flexDirection: 'row-reverse',
            justifyContent: 'center',
            gap: 6,
            borderBottomWidth: 2,
            borderColor: activeTab === 'withdrawals' ? colors.primary : 'transparent',
          }}
        >
          <Text style={{ color: activeTab === 'withdrawals' ? colors.primary : colors.gray, fontWeight: 'bold', fontSize: 13 }}>
            {isOwner ? 'طلبات السحب والمستحقات' : 'طلبات السحب الخاصة بي'}
          </Text>
          {pendingWithdrawalsCount > 0 && (
            <View style={{ backgroundColor: '#DC2626', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{pendingWithdrawalsCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('transactions')}
          style={{
            flex: 1,
            paddingVertical: 12,
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 2,
            borderColor: activeTab === 'transactions' ? colors.primary : 'transparent',
          }}
        >
          <Text style={{ color: activeTab === 'transactions' ? colors.primary : colors.gray, fontWeight: 'bold', fontSize: 13 }}>
            {isOwner ? 'سجل المعاملات العام' : 'سجل العمليات والمدفوعات'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.gray, marginTop: spacing.sm }}>جاري تحميل البيانات المالية...</Text>
        </View>
      ) : activeTab === 'withdrawals' ? (
        /* Withdrawals Tab */
        withdrawals.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
            <Clock size={48} color={colors.gray} />
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
              لا توجد طلبات سحب حالياً
            </Text>
            <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              {isOwner
                ? 'طلبات السحب المقدمة من الفنيين والتجار ستظهر هنا فور تقديمها'
                : 'عندما تقدم طلب سحب جديد سيظهر هنا لمتابعة حالته وتأكيد الصرف'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={withdrawals}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 150 }}
            renderItem={({ item }) => {
              const isPending = item.status === 'pending';
              const isCompleted = item.status === 'completed';
              const isRejected = item.status === 'rejected';

              return (
                <View
                  style={{
                    backgroundColor: '#141414',
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    borderColor: isPending ? 'rgba(212, 175, 55, 0.4)' : '#222',
                    padding: spacing.md,
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: colors.white, fontSize: 15, fontWeight: '900' }}>
                          {item.amount.toLocaleString('ar-EG')} ج.م
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: borderRadius.sm,
                            backgroundColor: isCompleted
                              ? 'rgba(34, 197, 94, 0.15)'
                              : isRejected
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(234, 179, 8, 0.15)',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: 'bold',
                              color: isCompleted ? '#22C55E' : isRejected ? '#EF4444' : '#EAB308',
                            }}
                          >
                            {isCompleted ? 'تم الصرف بنجاح ✅' : isRejected ? 'مرفوض ❌' : 'قيد المراجعة الإدارية ⏳'}
                          </Text>
                        </View>
                      </View>
                      {item.userName && (
                        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: 'bold', marginTop: 2 }}>
                          {item.userName} ({item.userRole || 'مستخدم'})
                        </Text>
                      )}
                    </View>

                    <Text style={{ color: colors.gray, fontSize: 11 }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG') : ''}
                    </Text>
                  </View>

                  <Text style={{ color: '#AAAAAA', fontSize: 12, textAlign: 'right' }}>
                    {item.description}
                  </Text>

                  {item.referenceId && (
                    <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right' }}>
                      الحساب / المحفظة: {item.referenceId}
                    </Text>
                  )}

                  {/* Owner Action Buttons */}
                  {isOwner && isPending && (
                    <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: 4 }}>
                      <TouchableOpacity
                        onPress={() => handleApproveWithdrawal(item)}
                        style={{
                          flex: 1,
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#15803D',
                          paddingVertical: 8,
                          borderRadius: borderRadius.sm,
                          gap: 6,
                        }}
                      >
                        <CheckCircle2 size={15} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>موافقة وصرف المبلغ</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          setSelectedWithdrawal(item);
                          setRejectReason('');
                          setRejectModalVisible(true);
                        }}
                        style={{
                          flex: 1,
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#991B1B',
                          paddingVertical: 8,
                          borderRadius: borderRadius.sm,
                          gap: 6,
                        }}
                      >
                        <XCircle size={15} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>رفض الطلب</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )
      ) : (
        /* Transactions Tab */
        <View style={{ flex: 1 }}>
          {/* Search bar for transactions */}
          <View style={{ padding: spacing.sm, backgroundColor: '#111' }}>
            <View
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                backgroundColor: '#1A1A1A',
                borderRadius: borderRadius.md,
                paddingHorizontal: spacing.sm,
                borderWidth: 1,
                borderColor: '#262626',
              }}
            >
              <Search size={16} color={colors.primary} />
              <TextInput
                style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 6, textAlign: 'right', color: colors.white, fontSize: 13 }}
                placeholder="ابحث في المعاملات..."
                placeholderTextColor={colors.gray}
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {filteredTransactions.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
              <Clock size={48} color={colors.gray} />
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
                لا توجد معاملات مسجلة
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
              contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 150 }}
              renderItem={({ item }) => {
                const isDeposit = item.type === 'topup' || item.amount > 0 && item.type !== 'withdrawal';

                return (
                  <View
                    style={{
                      backgroundColor: '#141414',
                      borderRadius: borderRadius.lg,
                      borderWidth: 1,
                      borderColor: '#222',
                      padding: spacing.md,
                      flexDirection: 'row-reverse',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ alignItems: 'flex-end', flex: 1 }}>
                      <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold' }}>
                        {item.description || 'معاملة مالية'}
                      </Text>
                      {item.userName && (
                        <Text style={{ color: colors.primary, fontSize: 11, marginTop: 2 }}>
                          {item.userName} {item.userPhone ? `(${item.userPhone})` : ''}
                        </Text>
                      )}
                      <Text style={{ color: colors.gray, fontSize: 10, marginTop: 2 }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('ar-EG') : ''}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-start' }}>
                      <Text
                        style={{
                          color: isDeposit ? '#22C55E' : '#EF4444',
                          fontSize: 15,
                          fontWeight: '900',
                        }}
                      >
                        {isDeposit ? '+' : '-'}{Math.abs(item.amount).toLocaleString('ar-EG')} ج.م
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      )}

      {/* MODAL 1: Owner Reject Withdrawal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: '#DC2626' }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: 'bold' }}>رفض طلب السحب</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.white, fontSize: 13, textAlign: 'right', marginBottom: spacing.sm }}>
              يرجى كتابة سبب الرفض لإبلاغ المستخدم به:
            </Text>

            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#333',
                padding: spacing.sm,
                color: colors.white,
                textAlign: 'right',
                minHeight: 80,
                textAlignVertical: 'top',
                marginBottom: spacing.md,
              }}
              multiline
              placeholder="مثال: رقم الحساب غير صحيح أو بيانات التحويل ناقصة..."
              placeholderTextColor={colors.gray}
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <TouchableOpacity
              onPress={handleConfirmReject}
              style={{
                backgroundColor: '#DC2626',
                borderRadius: borderRadius.md,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>تأكيد الرفض</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Owner Manual Balance Adjust */}
      <Modal visible={adjustModalVisible} transparent animationType="fade" onRequestClose={() => setAdjustModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>تعديل رصيد يدوي 👑</Text>
              <TouchableOpacity onPress={() => setAdjustModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            {/* User Selector */}
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>اختر المستخدم:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
              <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                {usersList.slice(0, 15).map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setAdjustUserId(u.id)}
                    style={{
                      backgroundColor: adjustUserId === u.id ? 'rgba(212, 175, 55, 0.2)' : '#1E1E1E',
                      borderWidth: 1,
                      borderColor: adjustUserId === u.id ? colors.primary : '#333',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: borderRadius.sm,
                    }}
                  >
                    <Text style={{ color: adjustUserId === u.id ? colors.primary : colors.white, fontSize: 12, fontWeight: 'bold' }}>
                      {u.name} ({u.role})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Type selector */}
            <View style={{ flexDirection: 'row-reverse', gap: 8, marginBottom: spacing.md }}>
              <TouchableOpacity
                onPress={() => setAdjustType('add')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  backgroundColor: adjustType === 'add' ? '#15803D' : '#1E1E1E',
                  borderRadius: borderRadius.sm,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>+ إضافة رصيد</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAdjustType('deduct')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  backgroundColor: adjustType === 'deduct' ? '#DC2626' : '#1E1E1E',
                  borderRadius: borderRadius.sm,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>- خصم رصيد</Text>
              </TouchableOpacity>
            </View>

            {/* Amount */}
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>المبلغ (ج.م):</Text>
            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#333',
                padding: spacing.sm,
                color: colors.white,
                textAlign: 'right',
                marginBottom: spacing.sm,
              }}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={colors.gray}
              value={adjustAmount}
              onChangeText={setAdjustAmount}
            />

            {/* Reason */}
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>سبب العملية (للتدقيق الأمني):</Text>
            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#333',
                padding: spacing.sm,
                color: colors.white,
                textAlign: 'right',
                marginBottom: spacing.md,
              }}
              placeholder="توضيح سبب التعديل..."
              placeholderTextColor={colors.gray}
              value={adjustReason}
              onChangeText={setAdjustReason}
            />

            <TouchableOpacity
              onPress={handleManualAdjust}
              style={{
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>تنفيذ التسوية المالية</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Tech / Merchant Request Withdrawal Modal */}
      <Modal visible={withdrawModalVisible} transparent animationType="fade" onRequestClose={() => setWithdrawModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>طلب سحب أرباح 💸</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: '#1A1A1A', padding: spacing.sm, borderRadius: borderRadius.md, marginBottom: spacing.md }}>
              <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>
                رصيدك الحالي المتاح للسحب: <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{personalBalance} ج.م</Text>
              </Text>
            </View>

            {/* Amount */}
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>المبلغ المطلوب سحبه (ج.م):</Text>
            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#333',
                padding: spacing.sm,
                color: colors.white,
                textAlign: 'right',
                marginBottom: spacing.sm,
              }}
              keyboardType="numeric"
              placeholder="مثال: 500"
              placeholderTextColor={colors.gray}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            {/* Method selection */}
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>طريقة استلام الأموال:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6, marginBottom: spacing.sm }}>
              {['فودافون كاش', 'إنستاباي', 'حساب بنكي'].map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setWithdrawMethod(m)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    backgroundColor: withdrawMethod === m ? 'rgba(212, 175, 55, 0.2)' : '#1E1E1E',
                    borderWidth: 1,
                    borderColor: withdrawMethod === m ? colors.primary : '#333',
                    borderRadius: borderRadius.sm,
                  }}
                >
                  <Text style={{ color: withdrawMethod === m ? colors.primary : colors.white, fontSize: 11, fontWeight: 'bold' }}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Account / Phone */}
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>رقم المحفظة أو الحساب البنكي / IBAN:</Text>
            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#333',
                padding: spacing.sm,
                color: colors.white,
                textAlign: 'right',
                marginBottom: spacing.md,
              }}
              placeholder="010XXXXXXXX أو رقم الحساب"
              placeholderTextColor={colors.gray}
              value={withdrawAccount}
              onChangeText={setWithdrawAccount}
            />

            <TouchableOpacity
              onPress={handleSubmitWithdrawal}
              disabled={submittingWithdraw}
              style={{
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              {submittingWithdraw ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>إرسال طلب السحب للإدارة</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Customer Top-up Modal */}
      <Modal visible={topupModalVisible} transparent animationType="fade" onRequestClose={() => setTopupModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: '#141414', borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>شحن المحفظة 💳</Text>
              <TouchableOpacity onPress={() => setTopupModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>

            {/* Amount presets */}
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>اختر قيمة الشحن:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6, marginBottom: spacing.sm }}>
              {['50', '100', '200', '500'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  onPress={() => setTopupAmount(amt)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    backgroundColor: topupAmount === amt ? 'rgba(212, 175, 55, 0.2)' : '#1E1E1E',
                    borderWidth: 1,
                    borderColor: topupAmount === amt ? colors.primary : '#333',
                    borderRadius: borderRadius.sm,
                  }}
                >
                  <Text style={{ color: topupAmount === amt ? colors.primary : colors.white, fontSize: 12, fontWeight: 'bold' }}>
                    {amt} ج.م
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#333',
                padding: spacing.sm,
                color: colors.white,
                textAlign: 'right',
                marginBottom: spacing.md,
              }}
              keyboardType="numeric"
              placeholder="مبلغ مخصص..."
              placeholderTextColor={colors.gray}
              value={topupAmount}
              onChangeText={setTopupAmount}
            />

            {/* Payment Method */}
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginBottom: 4 }}>طريقة الدفع الآمن:</Text>
            <View style={{ flexDirection: 'row-reverse', gap: 6, marginBottom: spacing.md }}>
              {['بطاقة بنكية', 'فودافون كاش', 'فوري'].map((pm) => (
                <TouchableOpacity
                  key={pm}
                  onPress={() => setTopupMethod(pm)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    backgroundColor: topupMethod === pm ? 'rgba(212, 175, 55, 0.2)' : '#1E1E1E',
                    borderWidth: 1,
                    borderColor: topupMethod === pm ? colors.primary : '#333',
                    borderRadius: borderRadius.sm,
                  }}
                >
                  <Text style={{ color: topupMethod === pm ? colors.primary : colors.white, fontSize: 11, fontWeight: 'bold' }}>
                    {pm}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={handleSubmitTopup}
              disabled={submittingTopup}
              style={{
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
                paddingVertical: 10,
                alignItems: 'center',
              }}
            >
              {submittingTopup ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>تأكيد عملية الشحن</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
