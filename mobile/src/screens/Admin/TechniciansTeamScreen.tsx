import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import {
  Search,
  Star,
  Phone,
  MessageCircle,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  XCircle,
  Trash2,
  PauseCircle,
  PlayCircle,
  Clock,
  X,
  Calendar,
  MapPin,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Send,
  Flag,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { normalizeRole } from '../../roles';
import OwnerHeader from '../../components/OwnerHeader';
import { EGYPTIAN_GOVERNORATES } from '../../constants/egypt';

interface TechItem {
  id: string;
  name: string;
  phone: string;
  specialty?: string;
  rating?: number;
  status: string;
  jobs?: number;
  balance?: number;
  city?: string;
  governorate?: string;
  createdAt?: string;
}

interface UpgradeCandidate {
  id: string;
  name: string;
  phone: string;
  email?: string;
  specialty?: string;
  balance?: number;
  createdAt: string;
}

const SPECIALTY_FILTERS = [
  { id: 'all', label: 'الكل', match: [] },
  { id: 'washer', label: '🧺 غسالات ملابس وأطباق', match: ['washer', 'غسال'] },
  { id: 'fridge', label: '🧊 ثلاجات وديب فريزر', match: ['fridge', 'ثلاج', 'فريزر'] },
  { id: 'cooker', label: '🔥 بوتاجازات وأفران', match: ['cooker', 'بوتاجاز', 'فرن', 'أفران'] },
  { id: 'microwave', label: '♨️ ميكروويف وأجهزة طهي', match: ['microwave', 'ميكروويف', 'طهي'] },
  { id: 'ac', label: '❄️ تكييفات وتبريد', match: ['ac', 'تكييف', 'مكيف', 'تبريد'] },
];

const EGYPT_GOVERNORATES = EGYPTIAN_GOVERNORATES;

export default function TechniciansTeamScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const currentRole = normalizeRole(user?.role || '');
  const isOwner = currentRole === 'owner';
  const isManager = currentRole === 'manager';
  const isTech = currentRole === 'technician';
  const isSupport = currentRole === 'customer_support';
  const isCustomer = !isOwner && !isManager && !isTech && !isSupport;

  const [technicians, setTechnicians] = useState<TechItem[]>([]);
  const [upgrades, setUpgrades] = useState<UpgradeCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(
    route?.params?.specialty || 'all'
  );

  // Tabs: only for owner/manager
  const [activeTab, setActiveTab] = useState<'technicians' | 'upgrades'>('technicians');

  // Booking Modal (Customer)
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingTech, setBookingTech] = useState<TechItem | null>(null);
  const [deviceType, setDeviceType] = useState('تكييف');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [problemDesc, setProblemDesc] = useState('');
  const [selectedGov, setSelectedGov] = useState('القاهرة');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState(user?.phone || '');
  const [appointmentTime, setAppointmentTime] = useState('في أقرب وقت ممكن');
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Reject Modal (Owner / Manager)
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<UpgradeCandidate | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Delete Modal (Owner Only)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTech, setSelectedTech] = useState<TechItem | null>(null);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Report Tech Modal (Support)
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTech, setReportTech] = useState<TechItem | null>(null);
  const [reportReason, setReportReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const tData = await fetchApi('/technicians');
      if (Array.isArray(tData)) {
        setTechnicians(tData);
      }

      if (isOwner || isManager) {
        const uData = await fetchApi('/owner/technicians/upgrades').catch(() => []);
        if (Array.isArray(uData)) {
          setUpgrades(uData);
        }
      }
    } catch (err: any) {
      console.warn('Error loading technicians data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRole]);

  useEffect(() => {
    if (route?.params?.specialty) {
      setSelectedSpecialty(route.params.specialty);
    }
  }, [route?.params?.specialty]);

  useEffect(() => {
    if (route?.params?.prefillTech) {
      const tech = route.params.prefillTech;
      setBookingTech(tech);
      setDeviceType(tech.specialty?.replace(/[^\u0621-\u064A ]/g, '').trim() || 'تكييف');
      setBookingModalVisible(true);
    }
  }, [route?.params?.prefillTech]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [currentRole]);

  // Filtering & Sorting (Best to Worst by Rating and Completed Jobs)
  const filteredTechs = technicians
    .filter((t) => {
      const matchesSearch =
        (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.specialty || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.phone || '').includes(search) ||
        (t.city || '').toLowerCase().includes(search.toLowerCase());

      const filterObj = SPECIALTY_FILTERS.find(f => f.id === selectedSpecialty);
      const matchesSpecialty =
        selectedSpecialty === 'all' ||
        (filterObj && filterObj.match.length > 0
          ? filterObj.match.some(m => (t.specialty || '').toLowerCase().includes(m))
          : (t.specialty || '').toLowerCase().includes(selectedSpecialty.toLowerCase()));

      return matchesSearch && matchesSpecialty;
    })
    .sort((a, b) => {
      const rA = typeof a.rating === 'number' ? a.rating : 5.0;
      const rB = typeof b.rating === 'number' ? b.rating : 5.0;
      if (rB !== rA) return rB - rA;
      return (b.jobs || 0) - (a.jobs || 0);
    });

  const filteredUpgrades = upgrades.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search)
  );

  // Booking Flow (Customer)
  const openBookingModal = (tech: TechItem) => {
    if (isTech) {
      Alert.alert('تنبيه 🧑‍🔧', 'أنت مسجل كفني صيانة معتمد في المنصة. خدمة طلب وحجز الفنيين مخصصة للعملاء.');
      return;
    }
    setBookingTech(tech);
    setDeviceType(tech.specialty?.replace(/[^\u0621-\u064A ]/g, '').trim() || 'تكييف');
    setDeviceBrand('');
    setProblemDesc('');
    setClientAddress('');
    setClientPhone(user?.phone || '');
    setAppointmentTime('في أقرب وقت ممكن');
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = async () => {
    if (!problemDesc.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة وصف العطل أو المشكلة.');
      return;
    }
    if (!clientAddress.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة العنوان بالتفصيل.');
      return;
    }
    if (!clientPhone.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الهاتف للتواصل.');
      return;
    }

    setSubmittingBooking(true);
    try {
      const payload = {
        type: 'maintenance',
        technicianId: bookingTech?.id,
        serviceType: deviceType,
        customerName: user?.name || 'عميل TecnoRexa',
        phone: clientPhone.trim(),
        address: `${selectedGov} - ${clientAddress.trim()}`,
        location: `${selectedGov} - ${clientAddress.trim()}`,
        notes: `المحافظة: ${selectedGov} | الجهاز: ${deviceType} - الماركة: ${deviceBrand || 'غير محدد'} | العطل: ${problemDesc.trim()} | الموعد المفضل: ${appointmentTime}`,
        total: 150,
      };

      const res = await fetchApi('/orders', {
        method: 'POST',
        data: payload,
      });

      setBookingModalVisible(false);
      Alert.alert(
        '✅ تم إرسال طلب الصيانة',
        `تم تسجيل طلبك بنجاح رقم (${res?.orderId || 'طلب جديد'}). سيتواصل معك الفني ${bookingTech?.name} في أقرب وقت لتأكيد الموعد.`,
        [
          {
            text: 'متابعة الطلب',
            onPress: () => navigation.navigate('Orders'),
          },
          { text: 'حسناً' },
        ]
      );
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إرسال طلب الصيانة');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Direct Call
  const handleCall = (phone: string) => {
    if (!phone) {
      Alert.alert('تنبيه', 'رقم الهاتف غير متوفر');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('تنبيه', `رقم الفني: ${phone}`);
    });
  };

  // Direct Chat
  const handleChat = (tech: TechItem) => {
    navigation.navigate('ChatList', { peerId: tech.id, peerName: tech.name });
  };

  // Report Tech (Support)
  const openReportModal = (tech: TechItem) => {
    setReportTech(tech);
    setReportReason('');
    setReportModalVisible(true);
  };

  const handleConfirmReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال سبب الإبلاغ');
      return;
    }
    try {
      await fetchApi('/audit-logs', {
        method: 'POST',
        data: {
          action: 'TECH_REPORTED',
          targetUserId: reportTech?.id,
          details: {
            reportedTechName: reportTech?.name,
            reason: reportReason.trim(),
            reporterRole: currentRole,
          },
        },
      }).catch(() => null);

      setReportModalVisible(false);
      Alert.alert('✅ تم تسجيل البلاغ', 'تم إرسال تقرير المخالفة لإدارة المنصة للمتابعة.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تسجيل البلاغ');
    }
  };

  // Owner/Manager: Approve Upgrade
  const handleApproveUpgrade = async (candidate: UpgradeCandidate) => {
    const confirm =
      Platform.OS === 'web'
        ? window.confirm(`هل توافق على ترقية "${candidate.name}" إلى فني معتمد بعد سداد 300 ج.م؟`)
        : true;
    if (!confirm) return;

    try {
      const res = await fetchApi(`/owner/technicians/upgrades/${candidate.id}/action`, {
        method: 'POST',
        data: { action: 'approve' },
      });
      Alert.alert('✅ تمت الترقية', res.message || 'تم اعتماد الفني بنجاح وإضافته لكادر الصيانة.');
      await loadData();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر اعتماد الترقية');
    }
  };

  // Owner/Manager: Reject Upgrade
  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة سبب الرفض.');
      return;
    }
    if (!selectedCandidate) return;

    try {
      await fetchApi(`/owner/technicians/upgrades/${selectedCandidate.id}/action`, {
        method: 'POST',
        data: { action: 'reject', reason: rejectReason.trim() },
      });
      setRejectModalVisible(false);
      Alert.alert('❌ تم الرفض', 'تم رفض طلب الترقية وإرسال الإشعار.');
      await loadData();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر رفض الطلب');
    }
  };

  // Owner/Manager: Suspend/Resume/Ban
  const handleToggleSuspend = async (tech: TechItem) => {
    const isSuspended = tech.status === 'suspended' || tech.status === 'banned';
    const newStatus = isSuspended ? 'active' : 'banned';
    try {
      await fetchApi(`/admin/users/${tech.id}`, {
        method: 'PUT',
        data: { status: newStatus },
      });
      setTechnicians(technicians.map((t) => (t.id === tech.id ? { ...t, status: newStatus } : t)));
      Alert.alert(
        isSuspended ? '✅ تم فك الحظر' : '🔒 تم حظر الفني',
        isSuspended ? 'تمت إعادة الفني للعمل واستقبال الطلبات.' : 'تم حظر الفني ومنعه تماماً من دخول المنصة.'
      );
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر تعديل الحالة');
    }
  };

  // Owner: Permanent Delete
  const handleConfirmDelete = async () => {
    if (confirmDeleteText.trim() !== 'تأكيد') {
      Alert.alert('تنبيه', 'يرجى كتابة كلمة "تأكيد" في الحقل لحذف الفني.');
      return;
    }
    if (!selectedTech) return;

    try {
      await fetchApi(`/admin/users/${selectedTech.id}`, { method: 'DELETE' });
      setTechnicians(technicians.filter((t) => t.id !== selectedTech.id));
      setDeleteModalVisible(false);
      Alert.alert('🗑️ تم الحذف', 'تم حذف الفني نهائياً من النظام.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر حذف الفني');
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* 1. Header Logic Based on Role */}
      {isOwner || isManager ? (
        <OwnerHeader
          title={isOwner ? "فريق الفنيين والترقيات" : "إدارة كادر الفنيين والترقيات"}
          subtitle={isOwner ? "كادر الصيانة واعتماد ترقيات 300 ج.م" : "كادر الصيانة المعتمد ومراجعة طلبات الانضمام"}
          sectionNumber={10}
          navigation={navigation}
          currentScreen="TechniciansTeam"
          showBack={!!(navigation?.canGoBack && navigation.canGoBack())}
          onRefresh={loadData}
        />
      ) : (
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            backgroundColor: '#0F0F0F',
            borderBottomWidth: 1,
            borderBottomColor: '#222',
          }}
        >
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
            {!!(navigation?.canGoBack && navigation.canGoBack()) && (
              <TouchableOpacity
                onPress={() => {
                  if (navigation?.canGoBack && navigation.canGoBack()) {
                    navigation.goBack();
                  } else if (navigation?.navigate) {
                    navigation.navigate('Home' as never);
                  }
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#1C1C1C',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#333',
                }}
              >
                <ChevronRight size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.white, fontSize: 17, fontWeight: '900' }}>
                {isManager
                  ? 'إدارة كادر الفنيين والترقيات'
                  : isTech
                  ? 'دليل زملاء كادر الصيانة'
                  : isSupport
                  ? 'كادر الفنيين المعتمدين'
                  : 'فريق فنيي TecnoRexa'}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 12, marginTop: 2 }}>
                {isCustomer
                  ? 'اختر الفني المناسب واطلب الصيانة بضمان المنصة'
                  : isTech
                  ? 'تواصل وتبادل الخبرات مع زملائك في الميدان'
                  : 'فنيين معتمدين بكفاءة عالية'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={loadData}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: borderRadius.md,
              backgroundColor: 'rgba(212, 175, 55, 0.1)',
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>تحديث 🔄</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2. Top Filter & Search Bar */}
      <View style={{ backgroundColor: '#111111', padding: spacing.sm, borderBottomWidth: 1, borderColor: '#222' }}>
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
            marginBottom: spacing.xs,
          }}
        >
          <Search size={16} color={colors.primary} />
          <TextInput
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 6,
              textAlign: 'right',
              color: colors.white,
              fontSize: 13,
            }}
            placeholder="ابحث بالاسم، التخصص، أو المدينة..."
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

        {/* Specialty Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingVertical: 4, flexDirection: 'row-reverse' }}
        >
          {SPECIALTY_FILTERS.map((s) => {
            const isSelected = selectedSpecialty === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSelectedSpecialty(s.id)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: isSelected ? 'rgba(212, 175, 55, 0.25)' : '#1E1E1E',
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : '#333',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isSelected ? 'bold' : '500',
                    color: isSelected ? colors.primary : colors.gray,
                  }}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Manager/Owner Tabs */}
        {(isOwner || isManager) && (
          <View style={{ flexDirection: 'row-reverse', gap: spacing.xs, marginTop: spacing.xs }}>
            <TouchableOpacity
              onPress={() => setActiveTab('technicians')}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: borderRadius.sm,
                backgroundColor: activeTab === 'technicians' ? 'rgba(212, 175, 55, 0.2)' : '#1A1A1A',
                borderWidth: 1,
                borderColor: activeTab === 'technicians' ? colors.primary : '#333',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: activeTab === 'technicians' ? colors.primary : colors.gray,
                }}
              >
                كادر الفنيين ({technicians.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('upgrades')}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: borderRadius.sm,
                backgroundColor: activeTab === 'upgrades' ? 'rgba(212, 175, 55, 0.2)' : '#1A1A1A',
                borderWidth: 1,
                borderColor: activeTab === 'upgrades' ? colors.primary : '#333',
                alignItems: 'center',
                flexDirection: 'row-reverse',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: activeTab === 'upgrades' ? colors.primary : colors.gray,
                }}
              >
                طلبات الترقية (300 ج.م)
              </Text>
              {upgrades.length > 0 && (
                <View style={{ backgroundColor: '#F59E0B', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 8 }}>
                  <Text style={{ color: '#0A0A0A', fontSize: 10, fontWeight: '900' }}>{upgrades.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 3. Technicians List / Upgrades List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.gray, marginTop: spacing.sm }}>جاري تحميل كادر الفنيين...</Text>
        </View>
      ) : (isOwner || isManager) && activeTab === 'upgrades' ? (
        /* Upgrades View */
        filteredUpgrades.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
            <CheckCircle2 size={48} color="#10B981" />
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
              لا توجد طلبات ترقية معلقة
            </Text>
            <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              عند سداد أي عميل لرسوم الـ 300 ج.م وطلب الانضمام كفني معتمد، سيظهر طلبه هنا
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredUpgrades}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 150 }}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: '#141414',
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  padding: spacing.md,
                }}
              >
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ color: colors.primary, fontSize: 12 }}>
                      التخصص المطلوب: {item.specialty || 'صيانة عامة'}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      borderWidth: 1,
                      borderColor: '#10B981',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '900' }}>سدد 300 ج.م ✅</Text>
                  </View>
                </View>

                <View
                  style={{
                    backgroundColor: '#1A1A1A',
                    borderRadius: borderRadius.sm,
                    padding: spacing.sm,
                    marginVertical: spacing.xs,
                  }}
                >
                  <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>الهاتف: {item.phone}</Text>
                  {item.email && (
                    <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right' }}>البريد: {item.email}</Text>
                  )}
                  <Text style={{ color: '#666', fontSize: 10, textAlign: 'right', marginTop: 2 }}>
                    تاريخ التقديم: {new Date(item.createdAt).toLocaleString('ar-EG')}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCandidate(item);
                      setRejectReason('');
                      setRejectModalVisible(true);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 9,
                      borderRadius: borderRadius.md,
                      backgroundColor: 'rgba(220, 38, 38, 0.15)',
                      borderWidth: 1,
                      borderColor: '#DC2626',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#DC2626', fontWeight: 'bold', fontSize: 12 }}>رفض الطلب ❌</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleApproveUpgrade(item)}
                    style={{
                      flex: 1,
                      paddingVertical: 9,
                      borderRadius: borderRadius.md,
                      backgroundColor: '#10B981',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 12 }}>الموافقة والترقية ✅</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )
      ) : (
        /* Technicians List */
        filteredTechs.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
            <Wrench size={48} color={colors.gray} />
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: 'bold', marginTop: spacing.md }}>
              لا يوجد فنيين مطابقين للبحث
            </Text>
            <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4 }}>
              جرب تغيير التخصص أو كلمة البحث
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTechs}
            keyExtractor={(item) => item.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 150 }}
            renderItem={({ item }) => {
              const isSuspended = item.status === 'suspended' || item.status === 'banned';

              return (
                <View
                  style={{
                    backgroundColor: '#141414',
                    borderRadius: borderRadius.lg,
                    borderWidth: 1,
                    borderColor: isSuspended ? '#DC2626' : 'rgba(212, 175, 55, 0.25)',
                    padding: spacing.md,
                    shadowColor: '#000',
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                  }}
                >
                  {/* Card Header: Avatar, Name, Specialty, Rating */}
                  <View
                    style={{
                      flexDirection: 'row-reverse',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: spacing.xs,
                    }}
                  >
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: '#1C1C1C',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1.5,
                          borderColor: colors.primary,
                        }}
                      >
                        <Text style={{ fontSize: 20 }}>🔧</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: colors.white, fontSize: 15, fontWeight: 'bold' }}>{item.name}</Text>
                        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <View
                            style={{
                              backgroundColor: 'rgba(212, 175, 55, 0.15)',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 8,
                            }}
                          >
                            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                              {item.specialty || 'صيانة عامة'}
                            </Text>
                          </View>
                          {item.city && (
                            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 2 }}>
                              <MapPin size={10} color={colors.gray} />
                              <Text style={{ color: colors.gray, fontSize: 10 }}>{item.city}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Rating badge */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                        backgroundColor: 'rgba(212, 175, 55, 0.15)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: 'rgba(212, 175, 55, 0.4)',
                      }}
                    >
                      <Star size={12} color={colors.primary} fill={colors.primary} />
                      <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>
                        {item.rating ? Number(item.rating).toFixed(1) : 'جديد'}
                      </Text>
                    </View>
                  </View>

                  {/* Info Row: Completed jobs & Availability */}
                  <View
                    style={{
                      flexDirection: 'row-reverse',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: '#1C1C1C',
                      borderRadius: borderRadius.sm,
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 6,
                      marginVertical: spacing.xs,
                    }}
                  >
                    <Text style={{ color: colors.gray, fontSize: 11 }}>
                      ساعد: <Text style={{ color: '#10B981', fontWeight: 'bold' }}>{item.jobs || 0} عميل</Text>
                    </Text>
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: isSuspended ? '#DC2626' : '#10B981',
                        }}
                      />
                      <Text
                        style={{
                          color: isSuspended ? '#DC2626' : '#10B981',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      >
                        {isSuspended ? 'غير متاح حالياً' : 'متاح للطلب الآن'}
                      </Text>
                    </View>
                  </View>

                  {/* ACTION BUTTONS BASED ON ROLE */}

                  {/* 1. CUSTOMER VIEW: Book Maintenance + Call + Chat */}
                  {isCustomer && (
                    <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: spacing.xs }}>
                      <TouchableOpacity
                        onPress={() => openBookingModal(item)}
                        disabled={isSuspended}
                        style={{
                          flex: 2,
                          backgroundColor: isSuspended ? '#333' : colors.primary,
                          paddingVertical: 9,
                          borderRadius: borderRadius.md,
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Wrench size={14} color="#0A0A0A" />
                        <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 13 }}>طلب صيانة 🔧</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleCall(item.phone)}
                        style={{
                          flex: 1,
                          backgroundColor: '#1E1E1E',
                          paddingVertical: 9,
                          borderRadius: borderRadius.md,
                          borderWidth: 1,
                          borderColor: '#333',
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                        }}
                      >
                        <Phone size={14} color={colors.primary} />
                        <Text style={{ color: colors.white, fontSize: 12, fontWeight: 'bold' }}>اتصال</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleChat(item)}
                        style={{
                          width: 38,
                          backgroundColor: '#1E1E1E',
                          borderRadius: borderRadius.md,
                          borderWidth: 1,
                          borderColor: '#333',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MessageCircle size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* 2. TECHNICIAN VIEW: Colleague Directory */}
                  {isTech && (
                    <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: spacing.xs }}>
                      <TouchableOpacity
                        onPress={() => handleChat(item)}
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(212, 175, 55, 0.15)',
                          borderWidth: 1,
                          borderColor: colors.primary,
                          paddingVertical: 8,
                          borderRadius: borderRadius.md,
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <MessageCircle size={14} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 12 }}>
                          تواصل مع الزميل
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleCall(item.phone)}
                        style={{
                          flex: 1,
                          backgroundColor: '#1E1E1E',
                          borderWidth: 1,
                          borderColor: '#333',
                          paddingVertical: 8,
                          borderRadius: borderRadius.md,
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Phone size={14} color={colors.white} />
                        <Text style={{ color: colors.white, fontSize: 12 }}>اتصال</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* 3. SUPPORT VIEW: Contact + Report Flag */}
                  {isSupport && (
                    <View style={{ flexDirection: 'row-reverse', gap: 8, marginTop: spacing.xs }}>
                      <TouchableOpacity
                        onPress={() => handleCall(item.phone)}
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          borderWidth: 1,
                          borderColor: '#10B981',
                          paddingVertical: 8,
                          borderRadius: borderRadius.md,
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Phone size={14} color="#10B981" />
                        <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 12 }}>اتصال بالفني</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => openReportModal(item)}
                        style={{
                          flex: 1,
                          backgroundColor: 'rgba(245, 158, 11, 0.15)',
                          borderWidth: 1,
                          borderColor: '#F59E0B',
                          paddingVertical: 8,
                          borderRadius: borderRadius.md,
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Flag size={14} color="#F59E0B" />
                        <Text style={{ color: '#F59E0B', fontWeight: 'bold', fontSize: 12 }}>إبلاغ الإدارة</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* 4. MANAGER VIEW: Suspend / Resume (NO Delete) */}
                  {isManager && (
                    <View
                      style={{
                        flexDirection: 'row-reverse',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: spacing.xs,
                        paddingTop: spacing.xs,
                        borderTopWidth: 1,
                        borderColor: '#222',
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleToggleSuspend(item)}
                        style={{
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: borderRadius.md,
                          backgroundColor: isSuspended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          borderWidth: 1,
                          borderColor: isSuspended ? '#10B981' : '#F59E0B',
                        }}
                      >
                        {isSuspended ? <PlayCircle size={14} color="#10B981" /> : <PauseCircle size={14} color="#F59E0B" />}
                        <Text
                          style={{
                            color: isSuspended ? '#10B981' : '#F59E0B',
                            fontSize: 12,
                            fontWeight: 'bold',
                          }}
                        >
                          {isSuspended ? 'فك الحظر' : 'حظر الفني'}
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ color: colors.gray, fontSize: 11 }}>الهاتف: {item.phone}</Text>
                    </View>
                  )}

                  {/* 5. OWNER VIEW: Suspend / Resume + Permanent Delete with Confirm */}
                  {isOwner && (
                    <View
                      style={{
                        flexDirection: 'row-reverse',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: spacing.xs,
                        paddingTop: spacing.xs,
                        borderTopWidth: 1,
                        borderColor: '#1F1F1F',
                      }}
                    >
                      <View style={{ flexDirection: 'row-reverse', gap: spacing.xs }}>
                        <TouchableOpacity
                          onPress={() => handleToggleSuspend(item)}
                          style={{
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: borderRadius.md,
                            backgroundColor: isSuspended ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            borderWidth: 1,
                            borderColor: isSuspended ? '#10B981' : '#F59E0B',
                          }}
                        >
                          {isSuspended ? <PlayCircle size={13} color="#10B981" /> : <PauseCircle size={13} color="#F59E0B" />}
                          <Text
                            style={{
                              color: isSuspended ? '#10B981' : '#F59E0B',
                              fontSize: 11,
                              fontWeight: 'bold',
                            }}
                          >
                            {isSuspended ? 'فك الحظر' : 'حظر الفني'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            setSelectedTech(item);
                            setConfirmDeleteText('');
                            setDeleteModalVisible(true);
                          }}
                          style={{
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            gap: 4,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: borderRadius.md,
                            backgroundColor: 'rgba(220, 38, 38, 0.15)',
                            borderWidth: 1,
                            borderColor: '#DC2626',
                          }}
                        >
                          <Trash2 size={13} color="#DC2626" />
                          <Text style={{ color: '#DC2626', fontSize: 11, fontWeight: 'bold' }}>حذف نهائي</Text>
                        </TouchableOpacity>
                      </View>

                      <Text
                        style={{
                          color: isSuspended ? '#DC2626' : '#10B981',
                          fontSize: 11,
                          fontWeight: 'bold',
                        }}
                      >
                        {isSuspended ? 'عضوية معلقة' : 'نشط وجاهز'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        )
      )}

      {/* MODAL 1: Customer Maintenance Request */}
      <Modal
        visible={bookingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.md,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: '#141414',
              borderRadius: borderRadius.xl,
              borderWidth: 1,
              borderColor: colors.primary,
              padding: spacing.lg,
              maxHeight: '90%',
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View
                style={{
                  flexDirection: 'row-reverse',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.md,
                }}
              >
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                  <Wrench size={22} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '900' }}>
                    طلب صيانة منزلية
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                  <X size={20} color={colors.gray} />
                </TouchableOpacity>
              </View>

              {/* Technician Info Banner */}
              <View
                style={{
                  backgroundColor: '#1E1E1E',
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginBottom: spacing.md,
                  flexDirection: 'row-reverse',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#333',
                }}
              >
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.white, fontSize: 14, fontWeight: 'bold' }}>
                    الفني: {bookingTech?.name}
                  </Text>
                  <Text style={{ color: colors.primary, fontSize: 12 }}>
                    التخصص: {bookingTech?.specialty || 'صيانة عامة'}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: 'bold' }}>معتمد ⭐</Text>
                </View>
              </View>

              {/* Form Fields */}
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
                نوع الجهاز:
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#333',
                  borderRadius: borderRadius.md,
                  padding: 10,
                  color: colors.white,
                  textAlign: 'right',
                  marginBottom: spacing.sm,
                }}
                placeholder="مثال: غسالة، ثلاجة، بوتاجاز، ميكروويف، تكييف..."
                placeholderTextColor={colors.gray}
                value={deviceType}
                onChangeText={setDeviceType}
              />

              <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
                ماركة الجهاز والموديل:
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#333',
                  borderRadius: borderRadius.md,
                  padding: 10,
                  color: colors.white,
                  textAlign: 'right',
                  marginBottom: spacing.sm,
                }}
                placeholder="مثال: LG، سامسونج، كاريير، شارب..."
                placeholderTextColor={colors.gray}
                value={deviceBrand}
                onChangeText={setDeviceBrand}
              />

              <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
                وصف العطل أو المشكلة بالتفصيل: *
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#333',
                  borderRadius: borderRadius.md,
                  padding: 10,
                  color: colors.white,
                  textAlign: 'right',
                  minHeight: 65,
                  textAlignVertical: 'top',
                  marginBottom: spacing.sm,
                }}
                placeholder="صف العطل (مثال: الجهاز لا يبرد، صوت عالي عند الدوران، تسريب ماء...)"
                placeholderTextColor={colors.gray}
                value={problemDesc}
                onChangeText={setProblemDesc}
                multiline
              />

              <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
                المحافظة (مصر): *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm, maxHeight: 42 }}>
                <View style={{ flexDirection: 'row-reverse', gap: 6, paddingVertical: 2 }}>
                  {EGYPT_GOVERNORATES.map(g => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setSelectedGov(g)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: borderRadius.sm,
                        backgroundColor: selectedGov === g ? colors.primary : '#1A1A1A',
                        borderWidth: 1,
                        borderColor: selectedGov === g ? colors.primary : '#333',
                      }}
                    >
                      <Text style={{ color: selectedGov === g ? '#0A0A0A' : colors.white, fontSize: 12, fontWeight: 'bold' }}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
                العنوان بالتفصيل: *
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#333',
                  borderRadius: borderRadius.md,
                  padding: 10,
                  color: colors.white,
                  textAlign: 'right',
                  marginBottom: spacing.sm,
                }}
                placeholder="المدينة، الحي، اسم الشارع، رقم العمارة والشقة"
                placeholderTextColor={colors.gray}
                value={clientAddress}
                onChangeText={setClientAddress}
              />

              <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
                رقم الهاتف للتواصل: *
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#333',
                  borderRadius: borderRadius.md,
                  padding: 10,
                  color: colors.white,
                  textAlign: 'right',
                  marginBottom: spacing.sm,
                }}
                placeholder="010xxxxxxxx"
                placeholderTextColor={colors.gray}
                keyboardType="phone-pad"
                value={clientPhone}
                onChangeText={setClientPhone}
              />

              <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
                الموعد المفضل للزيارة:
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#333',
                  borderRadius: borderRadius.md,
                  padding: 10,
                  color: colors.white,
                  textAlign: 'right',
                  marginBottom: spacing.md,
                }}
                placeholder="مثال: اليوم بعد الخامسة مساءً / غداً صباحاً"
                placeholderTextColor={colors.gray}
                value={appointmentTime}
                onChangeText={setAppointmentTime}
              />

              {/* Submit Buttons */}
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <TouchableOpacity
                  onPress={() => setBookingModalVisible(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    backgroundColor: '#222',
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.white }}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirmBooking}
                  disabled={submittingBooking}
                  style={{
                    flex: 2,
                    paddingVertical: 12,
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    flexDirection: 'row-reverse',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {submittingBooking ? (
                    <ActivityIndicator size="small" color="#0A0A0A" />
                  ) : (
                    <>
                      <Send size={16} color="#0A0A0A" />
                      <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 14 }}>
                        تأكيد إرسال الطلب
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Support Report Tech */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.md,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#141414',
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: '#F59E0B',
            }}
          >
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
              <Flag size={22} color="#F59E0B" />
              <Text style={{ color: '#F59E0B', fontSize: 16, fontWeight: '900' }}>إبلاغ الإدارة عن فني</Text>
            </View>

            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: spacing.sm, textAlign: 'right' }}>
              يرجى توضيح سبب الإبلاغ أو الشكوى بخصوص الفني "{reportTech?.name}":
            </Text>

            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                borderWidth: 1,
                borderColor: '#333',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                color: colors.white,
                textAlign: 'right',
                minHeight: 75,
                textAlignVertical: 'top',
                marginBottom: spacing.lg,
              }}
              placeholder="مثال: تأخر عن الموعد، عدم الرد على العميل، سوء سلوك..."
              placeholderTextColor={colors.gray}
              value={reportReason}
              onChangeText={setReportReason}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                style={{ flex: 1, padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}
              >
                <Text style={{ color: colors.white }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReport}
                style={{ flex: 1, padding: 10, backgroundColor: '#F59E0B', borderRadius: borderRadius.md, alignItems: 'center' }}
              >
                <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>إرسال التقرير</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Reject Upgrade with Reason (Owner/Manager) */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.md,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#141414',
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: '#DC2626',
            }}
          >
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
              <XCircle size={22} color="#DC2626" />
              <Text style={{ color: '#DC2626', fontSize: 16, fontWeight: '900' }}>رفض طلب الترقية</Text>
            </View>

            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: spacing.md, textAlign: 'right' }}>
              يرجى كتابة سبب رفض طلب ترقية "{selectedCandidate?.name}":
            </Text>

            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                borderWidth: 1,
                borderColor: '#333',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                color: colors.white,
                textAlign: 'right',
                minHeight: 70,
                textAlignVertical: 'top',
                marginBottom: spacing.lg,
              }}
              placeholder="مثال: عدم اكتمال البيانات أو تعذر التحقق من التخصص..."
              placeholderTextColor={colors.gray}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                style={{ flex: 1, padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}
              >
                <Text style={{ color: colors.white }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReject}
                style={{ flex: 1, padding: 10, backgroundColor: '#DC2626', borderRadius: borderRadius.md, alignItems: 'center' }}
              >
                <Text style={{ color: colors.white, fontWeight: 'bold' }}>تأكيد الرفض</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Delete Technician with "تأكيد" (Owner Only) */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.md,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#141414',
              borderRadius: borderRadius.lg,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: '#DC2626',
            }}
          >
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
              <Trash2 size={24} color="#DC2626" />
              <Text style={{ color: '#DC2626', fontSize: 17, fontWeight: '900' }}>حذف فني نهائياً</Text>
            </View>

            <Text style={{ color: colors.white, fontSize: 14, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
              هل أنت متأكد من حذف الفني: "{selectedTech?.name}"؟
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, marginBottom: spacing.md, textAlign: 'right' }}>
              سيتم إزالة حساب وسجل الفني من النظام بالكامل. لتأكيد الحذف، اكتب كلمة{' '}
              <Text style={{ color: '#DC2626', fontWeight: 'bold' }}>"تأكيد"</Text> في الحقل:
            </Text>

            <TextInput
              style={{
                backgroundColor: '#1E1E1E',
                borderWidth: 1,
                borderColor: '#DC2626',
                borderRadius: borderRadius.md,
                padding: 10,
                color: colors.white,
                textAlign: 'center',
                fontWeight: 'bold',
                marginBottom: spacing.lg,
              }}
              placeholder='اكتب "تأكيد" هنا'
              placeholderTextColor={colors.gray}
              value={confirmDeleteText}
              onChangeText={setConfirmDeleteText}
            />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={{ flex: 1, padding: 10, backgroundColor: '#222', borderRadius: borderRadius.md, alignItems: 'center' }}
              >
                <Text style={{ color: colors.white }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                style={{ flex: 1, padding: 10, backgroundColor: '#DC2626', borderRadius: borderRadius.md, alignItems: 'center' }}
              >
                <Text style={{ color: colors.white, fontWeight: '900' }}>حذف نهائي</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
