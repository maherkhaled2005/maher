import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Share,
} from 'react-native';
import {
  Search,
  UserPlus,
  Trash2,
  Edit3,
  Shield,
  ArrowLeft,
  X,
  Download,
  ShieldAlert,
  CheckCircle2,
  Crown,
  Lock,
  Phone,
  Mail,
  User,
  DollarSign,
  AlertCircle,
  RefreshCw,
  ChevronRight,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { normalizeRole } from '../../roles';
import OwnerHeader from '../../components/OwnerHeader';

interface UserRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  developerRank?: string;
  status: string;
  balance: number;
  avatar?: string;
  mustChangePassword?: boolean | number;
  createdAt: string;
}

const ALL_ROLES = [
  { key: 'all', label: 'الكل' },
  { key: 'owner', label: '👑 المالك' },
  { key: 'manager', label: '👔 المدير' },
  { key: 'programmer', label: '💻 مبرمج عادي' },
  { key: 'customer_support', label: '🎧 الدعم' },
  { key: 'technician', label: '🔧 الفني' },
  { key: 'merchant', label: '🏪 التاجر' },
  { key: 'customer', label: '👤 العميل' },
];

export default function AdminUsersScreen({ navigation }: any) {
  const { user: currentUser } = useAuthStore();
  const currentRole = normalizeRole(currentUser?.role || '');
  const isOwner = currentRole === 'owner';
  const isManager = currentRole === 'manager';
  const isLeadProgrammer = (currentRole === 'programmer' || currentUser?.role === 'programmer') && 
    (currentUser?.developerRank === 'lead' || (currentUser as any)?.programmerLevel === 'lead' || currentUser?.phone === '01064739664');
  const canAddUser = isOwner || isLeadProgrammer;
  const isReadOnly = !isOwner && !isManager && !isLeadProgrammer;

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Edit / Add Modal State
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('123456');
  const [formRole, setFormRole] = useState('programmer');
  const [formStatus, setFormStatus] = useState('active');
  const [formBalance, setFormBalance] = useState('0');

  // Strict Delete Confirmation State (Owner Only)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserRecord | null>(null);
  const [confirmInputText, setConfirmInputText] = useState('');

  const loadUsers = async () => {
    try {
      const data = await fetchApi('/users');
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err) {
      console.warn('Error fetching users from DB', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentRole]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, [currentRole]);

  // Roles visible in tab filter
  const visibleRoleTabs = ALL_ROLES.filter((r) => {
    if (isManager) {
      return r.key !== 'owner' && r.key !== 'manager';
    }
    return true;
  });

  // Filtered Users (Manager cannot see Owner or Manager accounts)
  const filteredUsers = users.filter((u) => {
    const normRole = normalizeRole(u.role);

    // Rule: Manager cannot see owner or other managers
    if (isManager && (normRole === 'owner' || normRole === 'manager')) {
      return false;
    }

    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.id?.toLowerCase().includes(q);

    const matchRole =
      selectedRole === 'all' ||
      normRole === selectedRole;

    const matchStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && (u.status === 'active' || !u.status)) ||
      (selectedStatus === 'pending' && u.status === 'pending_approval') ||
      (selectedStatus === 'banned' && (u.status === 'banned' || u.status === 'suspended'));

    return matchSearch && matchRole && matchStatus;
  });

  // Real Role Counts
  const roleCounts: Record<string, number> = {
    all: filteredUsers.length,
    owner: isManager ? 0 : users.filter((u) => normalizeRole(u.role) === 'owner').length,
    manager: isManager ? 0 : users.filter((u) => normalizeRole(u.role) === 'manager').length,
    programmer: users.filter((u) => normalizeRole(u.role) === 'programmer').length,
    customer_support: users.filter((u) => normalizeRole(u.role) === 'customer_support').length,
    technician: users.filter((u) => normalizeRole(u.role) === 'technician').length,
    merchant: users.filter((u) => normalizeRole(u.role) === 'merchant').length,
    customer: users.filter((u) => normalizeRole(u.role) === 'customer').length,
  };

  const getRoleBadge = (role: string, phone?: string, developerRank?: string) => {
    const norm = normalizeRole(role);
    switch (norm) {
      case 'owner':
        return { label: '👑 المالك', color: colors.owner, bg: colors.ownerBg };
      case 'manager':
        return { label: '👔 المدير', color: colors.manager, bg: colors.managerBg };
      case 'programmer':
        if (phone === '01064739664' || developerRank === 'lead') {
          return { label: '💻 المسؤول التقني (قائد المبرمجين)', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' };
        }
        return { label: '💻 مبرمج عادي', color: colors.programmer, bg: colors.programmerBg };
      case 'technician':
        return { label: '🔧 الفني', color: colors.technician, bg: colors.technicianBg };
      case 'merchant':
        return { label: '🏪 التاجر', color: colors.merchant, bg: colors.merchantBg };
      case 'customer_support':
        return { label: '🎧 الدعم', color: colors.support, bg: colors.supportBg };
      default:
        return { label: '👤 العميل', color: colors.customer, bg: colors.customerBg };
    }
  };

  const handleToggleBan = async (u: UserRecord) => {
    const targetNormRole = normalizeRole(u.role);

    // 🛡️ Owner self-protection: Cannot ban self
    if (u.id === currentUser?.id) {
      Alert.alert('غير مسموح ⚠️', 'لا يمكنك حظر حسابك الخاص.');
      return;
    }

    // 🛡️ Cannot ban any owner account
    if (targetNormRole === 'owner') {
      Alert.alert('غير مسموح ⚠️', 'لا يمكن حظر حساب المالك بقرار إداري.');
      return;
    }

    if (isManager && targetNormRole === 'manager') {
      Alert.alert('غير مصرح', 'ليس لديك صلاحية لتعديل حسابات الإدارة العليا.');
      return;
    }

    const newStatus = u.status === 'active' ? 'banned' : 'active';
    const actionText = newStatus === 'banned' ? 'حظر' : 'فك الحظر عن';

    const proceed = async () => {
      try {
        await fetchApi(`/admin/users/${u.id}`, {
          method: 'PUT',
          data: { status: newStatus, role: u.role },
        });
        setUsers(users.map((item) => (item.id === u.id ? { ...item, status: newStatus } : item)));
        Alert.alert('تم التحديث', `تم ${actionText} المستخدم بنجاح.`);
      } catch (err: any) {
        Alert.alert('خطأ', err.message || 'فشل تحديث حالة المستخدم');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`هل أنت متأكد من ${actionText} هذا المستخدم؟`)) {
        await proceed();
      }
    } else {
      Alert.alert(`تأكيد العملية`, `هل أنت متأكد من ${actionText} هذا المستخدم؟`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تأكيد', onPress: proceed },
      ]);
    }
  };

  const handleApproveUser = async (u: UserRecord) => {
    const proceedApprove = async () => {
      try {
        await fetchApi(`/admin/users/${u.id}`, {
          method: 'PUT',
          data: { status: 'active', verified: 1 },
        });
        setUsers(users.map((x) => (x.id === u.id ? { ...x, status: 'active' } : x)));
        Alert.alert('تم الاعتماد بنجاح ✅', `تم تفعيل حساب ${u.name} كـ ${u.role === 'technician' ? 'فني معتمد' : 'تاجر معتمد'}.`);
      } catch (err: any) {
        Alert.alert('خطأ', err.message || 'تعذر اعتماد الحساب');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`هل أنت متأكد من اعتماد حساب ${u.name} وتفعيله على المنصة؟`)) {
        await proceedApprove();
      }
    } else {
      Alert.alert('تأكيد اعتماد الحساب ✅', `هل أنت متأكد من مراجعة اشتراك ${u.name} واعتماد حسابه كـ ${u.role === 'technician' ? 'فني معتمد' : 'تاجر معتمد'}؟`, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'اعتماد وتفعيل', onPress: proceedApprove },
      ]);
    }
  };

  const openDeleteModal = (u: UserRecord) => {
    if (!isOwner) {
      Alert.alert('غير مصرح', 'صلاحية حذف المستخدمين نهائياً مقتصرة على المالك فقط.');
      return;
    }
    // 🛡️ Owner self-protection: Cannot delete own account
    if (u.id === currentUser?.id) {
      Alert.alert('غير مسموح ⚠️', 'لا يمكنك حذف حسابك الشخصي بصفتك مالك المنصة.');
      return;
    }
    // 🛡️ Cannot delete another owner
    if (normalizeRole(u.role) === 'owner') {
      Alert.alert('غير مسموح ⚠️', 'لا يمكن حذف حساب مالك المنصة.');
      return;
    }
    setDeleteTargetUser(u);
    setConfirmInputText('');
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmInputText.trim() !== 'تأكيد') {
      Alert.alert('تنبيه', 'يرجى كتابة كلمة "تأكيد" في الحقل للمتابعة.');
      return;
    }
    if (!deleteTargetUser) return;

    try {
      await fetchApi(`/admin/users/${deleteTargetUser.id}`, { method: 'DELETE' });
      setUsers(users.filter((u) => u.id !== deleteTargetUser.id));
      setDeleteModalVisible(false);
      setDeleteTargetUser(null);
      Alert.alert('✅ تم الحذف', 'تم حذف المستخدم نهائياً بنجاح.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل حذف المستخدم');
    }
  };

  const openAddUserModal = () => {
    if (!canAddUser) {
      Alert.alert('غير مصرح ⚠️', 'صلاحية إضافة المستخدمين محصورة بالمالك ورئيس المبرمجين فقط.');
      return;
    }
    setIsEditing(false);
    setEditId('');
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormPassword('123456');
    setFormRole('programmer');
    setFormStatus('active');
    setFormBalance('0');
    setUserModalVisible(true);
  };

  const openEditUserModal = (u: UserRecord) => {
    const targetNormRole = normalizeRole(u.role);
    if (isManager && (targetNormRole === 'owner' || targetNormRole === 'manager')) {
      Alert.alert('غير مصرح', 'ليس لديك صلاحية لتعديل حسابات الإدارة العليا.');
      return;
    }

    setIsEditing(true);
    setEditId(u.id);
    setFormName(u.name);
    setFormPhone(u.phone);
    setFormEmail(u.email || '');
    setFormPassword('');
    setFormRole(normalizeRole(u.role));
    setFormStatus(u.status);
    setFormBalance(String(u.balance || 0));
    setUserModalVisible(true);
  };

  const handleSaveUser = async () => {
    if (!formName.trim() || !formPhone.trim()) {
      Alert.alert('تنبيه', 'الاسم ورقم الهاتف مطلوبان');
      return;
    }

    // Manager privilege escalation check
    if (isManager && (formRole === 'owner' || formRole === 'manager')) {
      Alert.alert('غير مصرح', 'لا يمكنك تعيين رتبة المالك أو المدير.');
      return;
    }

    // 🛡️ Owner self-protection: Cannot demote own account
    if (isEditing && editId === currentUser?.id && isOwner && formRole !== 'owner') {
      Alert.alert('غير مسموح ⚠️', 'لا يمكن للمالك تخفيض رتبة حسابه الشخصي.');
      return;
    }

    const cleanPass = formPassword.trim();

    try {
      if (isEditing) {
        await fetchApi(`/admin/users/${editId}`, {
          method: 'PUT',
          data: {
            name: formName.trim(),
            phone: formPhone.trim(),
            email: formEmail.trim() || null,
            role: formRole,
            status: formStatus,
            developerRank: formRole === 'programmer' ? 'junior' : undefined,
            password: cleanPass || undefined,
            balance: isOwner ? Number(formBalance) || 0 : undefined,
          },
        });
        setUsers(
          users.map((u) =>
            u.id === editId
              ? {
                  ...u,
                  name: formName.trim(),
                  phone: formPhone.trim(),
                  email: formEmail.trim() || undefined,
                  role: formRole,
                  developerRank: formRole === 'programmer' ? (u.phone === '01064739664' ? 'lead' : 'junior') : undefined,
                  status: formStatus,
                  balance: isOwner ? Number(formBalance) || 0 : u.balance,
                }
              : u
          )
        );
        Alert.alert('✅ تم التعديل', 'تم حفظ تعديلات المستخدم بنجاح.');
      } else {
        const payload = {
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          role: formRole,
          password: cleanPass || '123456',
          developerRank: formRole === 'programmer' ? 'junior' : undefined,
        };
        const res = await fetchApi('/admin/users', { method: 'POST', data: payload });
        const newRecord: UserRecord = {
          id: res.id || `user_${Date.now()}`,
          name: formName.trim(),
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          role: formRole,
          developerRank: formRole === 'programmer' ? 'junior' : undefined,
          status: 'active',
          balance: 0,
          mustChangePassword: true,
          createdAt: new Date().toISOString(),
        };
        setUsers([newRecord, ...users]);
        Alert.alert(
          '✅ تم الإضافة بنجاح',
          `تم إنشاء حساب (${formName.trim()}) بنجاح بكلمة مرور أولية (${cleanPass || '123456'}). سيتوجب على العضو تغيير كلمة المرور عند أول تسجيل دخول.`
        );
      }
      setUserModalVisible(false);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل حفظ بيانات المستخدم');
    }
  };

  const handleExportCSV = async () => {
    const headers = 'ID,Name,Phone,Email,Role,Status,Balance,CreatedAt\n';
    const rows = filteredUsers
      .map(
        (u) =>
          `"${u.id}","${u.name}","${u.phone}","${u.email || ''}","${u.role}","${u.status}",${u.balance},"${u.createdAt}"`
      )
      .join('\n');
    const csvData = headers + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `tecnorexa_users_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      Alert.alert('تصدير CSV', 'تم تنزيل ملف CSV للمستخدمين بنجاح.');
    } else {
      try {
        await Share.share({
          title: 'تصدير مستخدمي TecnoRexa',
          message: csvData,
        });
      } catch (err: any) {
        Alert.alert('تصدير CSV', `تم تجهيز بيانات ${filteredUsers.length} مستخدم بنجاح بصيغة CSV.`);
      }
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* 1. Header Logic */}
      {isOwner || isManager ? (
        <OwnerHeader
          title={isOwner ? "إدارة المستخدمين" : "إدارة الكوادر والمستخدمين"}
          subtitle={isOwner ? `سجل الحسابات والموظفين (${filteredUsers.length} من ${users.length})` : `متابعة الفنيين، التجار، والعملاء (${filteredUsers.length} حساب)`}
          sectionNumber={2}
          navigation={navigation}
          currentScreen="AdminUsers"
          showBack={!!(navigation?.canGoBack && navigation.canGoBack())}
          onRefresh={loadUsers}
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
                {isManager ? 'إدارة الكوادر والمستخدمين' : 'دليل المستخدمين'}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 11, marginTop: 2 }}>
                {isManager
                  ? `متابعة الفنيين، التجار، والعملاء (${filteredUsers.length} حساب)`
                  : 'دليل الحسابات المسجلة'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={loadUsers}
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

      {/* 2. Action Bar: Add User & Export CSV (Hidden for Read-Only) */}
      {!isReadOnly && (
        <View
          style={{
            flexDirection: 'row',
            padding: spacing.md,
            gap: spacing.sm,
            backgroundColor: colors.darkCard,
          }}
        >
          <TouchableOpacity
            onPress={handleExportCSV}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1C1C1C',
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 10,
              borderRadius: borderRadius.md,
              gap: 6,
            }}
          >
            <Download size={16} color={colors.gray} />
            <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13 }}>تصدير CSV</Text>
          </TouchableOpacity>

          {canAddUser && (
            <TouchableOpacity
              onPress={openAddUserModal}
              style={{
                flex: 1.2,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
                paddingVertical: 10,
                borderRadius: borderRadius.md,
                gap: 6,
              }}
            >
              <UserPlus size={16} color={colors.dark} />
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 13 }}>إضافة مستخدم جديد</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 3. Search Bar */}
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.darkCard,
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: spacing.md,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              paddingVertical: spacing.sm,
              color: colors.white,
              textAlign: 'right',
              fontSize: 13,
            }}
            placeholder="بحث بالاسم، رقم الهاتف، أو البريد الإلكتروني..."
            placeholderTextColor={colors.gray}
            value={search}
            onChangeText={setSearch}
          />
          <Search size={18} color={colors.gray} />
        </View>
      </View>

      {/* 4. Role Filter Tabs */}
      <View style={{ marginVertical: spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.xs }}
        >
          {visibleRoleTabs.map((r) => {
            const count = roleCounts[r.key] || 0;
            const isSelected = selectedRole === r.key;

            return (
              <TouchableOpacity
                key={r.key}
                onPress={() => setSelectedRole(r.key)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: borderRadius.full,
                  backgroundColor: isSelected ? colors.primary : colors.darkCard,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.primary : colors.border,
                  gap: 6,
                }}
              >
                <View
                  style={{
                    backgroundColor: isSelected ? colors.dark : '#333',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: isSelected ? colors.primary : colors.white, fontSize: 10, fontWeight: '900' }}>
                    {count}
                  </Text>
                </View>
                <Text
                  style={{
                    color: isSelected ? colors.dark : colors.white,
                    fontWeight: isSelected ? '900' : '700',
                    fontSize: 12,
                  }}
                >
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4.1 Status Filter Tabs */}
      <View style={{ marginBottom: spacing.sm }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.xs }}
        >
          {[
            { key: 'all', label: 'الكل' },
            { key: 'active', label: 'نشط 🟢' },
            { key: 'pending', label: 'قيد المراجعة ⏳' },
            { key: 'banned', label: 'محظور 🔒' },
          ].map((st) => {
            const isSel = selectedStatus === st.key;
            return (
              <TouchableOpacity
                key={st.key}
                onPress={() => setSelectedStatus(st.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: borderRadius.full,
                  backgroundColor: isSel ? 'rgba(212, 175, 55, 0.2)' : colors.darkCard,
                  borderWidth: 1,
                  borderColor: isSel ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    color: isSel ? colors.primary : colors.gray,
                    fontWeight: isSel ? '900' : '600',
                    fontSize: 11,
                  }}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Users List */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.gray, marginTop: spacing.md }}>جاري جلب بيانات المستخدمين...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 150, gap: spacing.sm }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <User size={48} color={colors.gray} />
              <Text style={{ color: colors.gray, marginTop: spacing.md }}>لا يوجد مستخدمين مطابقين للبحث</Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = getRoleBadge(item.role);
            const isBanned = item.status === 'banned' || item.status === 'suspended';
            const isPending = item.status === 'pending_approval';

            return (
              <View
                style={{
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: isBanned ? '#EF4444' : isPending ? '#F59E0B' : colors.border,
                  padding: spacing.md,
                }}
              >
                {/* Top Info Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <View
                      style={{
                        backgroundColor: isBanned
                          ? 'rgba(239,68,68,0.15)'
                          : isPending
                          ? 'rgba(245,158,11,0.15)'
                          : 'rgba(16,185,129,0.15)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: borderRadius.sm,
                      }}
                    >
                      <Text
                        style={{
                          color: isBanned ? '#EF4444' : isPending ? '#F59E0B' : '#10B981',
                          fontSize: 11,
                          fontWeight: '900',
                        }}
                      >
                        {isBanned ? 'محظور 🔒' : isPending ? 'قيد المراجعة ⏳' : 'نشط 🟢'}
                      </Text>
                    </View>
                    <View
                      style={{
                        backgroundColor: badge.bg,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: borderRadius.sm,
                      }}
                    >
                      <Text style={{ color: badge.color, fontSize: 11, fontWeight: '900' }}>{badge.label}</Text>
                    </View>
                  </View>

                  <View style={{ alignItems: 'flex-end', flex: 1, paddingRight: spacing.sm }}>
                    <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15 }}>{item.name}</Text>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>{item.phone}</Text>
                    {item.email && <Text style={{ color: colors.gray, fontSize: 11 }}>{item.email}</Text>}
                  </View>

                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#1E1E1E',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      overflow: 'hidden',
                    }}
                  >
                    {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:') || item.avatar.startsWith('/')) ? (
                      <Image source={{ uri: item.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Text style={{ fontSize: 18 }}>{item.avatar || '👤'}</Text>
                    )}
                  </View>
                </View>

                {/* Sub info: Balance & Join Date */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderTopColor: colors.border + '44',
                    marginTop: spacing.sm,
                    paddingTop: spacing.xs,
                  }}
                >
                  <Text style={{ color: colors.gray, fontSize: 11 }}>
                    انضم: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}
                  </Text>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>
                    الرصيد: {Number(item.balance || 0).toLocaleString()} ج.م
                  </Text>
                </View>

                {/* Action Buttons Row */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: spacing.sm,
                    marginTop: spacing.sm,
                    paddingTop: spacing.xs,
                    borderTopWidth: 1,
                    borderTopColor: colors.border + '33',
                  }}
                >
                  {/* Approve Button (Pending Accounts) */}
                  {isPending && !isReadOnly && (
                    <TouchableOpacity
                      onPress={() => handleApproveUser(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(16,185,129,0.15)',
                        borderWidth: 1,
                        borderColor: '#10B981',
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 5,
                        borderRadius: borderRadius.sm,
                        gap: 4,
                      }}
                    >
                      <CheckCircle2 size={13} color="#10B981" />
                      <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 11 }}>اعتماد وتفعيل ✅</Text>
                    </TouchableOpacity>
                  )}

                  {/* Delete Button (Owner ONLY) */}
                  {isOwner && (
                    <TouchableOpacity
                      onPress={() => openDeleteModal(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        borderWidth: 1,
                        borderColor: '#EF4444',
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 5,
                        borderRadius: borderRadius.sm,
                        gap: 4,
                      }}
                    >
                      <Trash2 size={13} color="#EF4444" />
                      <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 11 }}>حذف نهائي</Text>
                    </TouchableOpacity>
                  )}

                  {/* Ban / Unban Button (Owner and Manager) */}
                  {!isReadOnly && (
                    <TouchableOpacity
                      onPress={() => handleToggleBan(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: isBanned ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        borderWidth: 1,
                        borderColor: isBanned ? '#10B981' : '#F59E0B',
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 5,
                        borderRadius: borderRadius.sm,
                        gap: 4,
                      }}
                    >
                      <Lock size={13} color={isBanned ? '#10B981' : '#F59E0B'} />
                      <Text
                        style={{
                          color: isBanned ? '#10B981' : '#F59E0B',
                          fontWeight: '700',
                          fontSize: 11,
                        }}
                      >
                        {isBanned ? 'فك الحظر 🔓' : 'حظر الحساب 🔒'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Edit Button (Owner and Manager) */}
                  {!isReadOnly && (
                    <TouchableOpacity
                      onPress={() => openEditUserModal(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.primary,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 5,
                        borderRadius: borderRadius.sm,
                        gap: 4,
                      }}
                    >
                      <Edit3 size={13} color={colors.dark} />
                      <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 11 }}>تعديل ✏️</Text>
                    </TouchableOpacity>
                  )}

                  {/* Read Only Contact Icons */}
                  {isReadOnly && (
                    <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${item.phone}`).catch(() => {})}
                        style={{
                          flexDirection: 'row-reverse',
                          alignItems: 'center',
                          backgroundColor: '#1C1C1C',
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: borderRadius.sm,
                          borderWidth: 1,
                          borderColor: '#333',
                          gap: 4,
                        }}
                      >
                        <Phone size={12} color={colors.primary} />
                        <Text style={{ color: colors.white, fontSize: 11 }}>اتصال</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Edit / Add User Modal */}
      <Modal visible={userModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
          <View
            style={{
              width: '100%',
              maxWidth: 480,
              backgroundColor: '#141414',
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.primary,
              maxHeight: '85%',
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 18,
                  fontWeight: '900',
                  textAlign: 'right',
                  marginBottom: spacing.md,
                }}
              >
                {isEditing ? 'تعديل بيانات المستخدم ✏️' : 'إضافة مستخدم جديد 👤'}
              </Text>

              {/* Form Inputs */}
              <View style={{ gap: spacing.sm }}>
                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>الاسم بالكامل: *</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.white,
                    textAlign: 'right',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="الاسم"
                  placeholderTextColor={colors.gray}
                  value={formName}
                  onChangeText={setFormName}
                />

                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>رقم الهاتف: *</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.white,
                    textAlign: 'right',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="010XXXXXXXX"
                  placeholderTextColor={colors.gray}
                  keyboardType="phone-pad"
                  value={formPhone}
                  onChangeText={setFormPhone}
                />

                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>البريد الإلكتروني:</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.white,
                    textAlign: 'right',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  placeholder="example@test.com"
                  placeholderTextColor={colors.gray}
                  keyboardType="email-address"
                  value={formEmail}
                  onChangeText={setFormEmail}
                />

                <View style={{ marginTop: 4 }}>
                  <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>
                      {isEditing ? 'تغيير كلمة المرور (اختياري):' : 'كلمة المرور الأولية: *'}
                    </Text>
                    {!isEditing && (
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                        (سيلزمه تغييرها)
                      </Text>
                    )}
                  </View>
                  <TextInput
                    style={{
                      backgroundColor: colors.darkCard,
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      color: colors.white,
                      textAlign: 'right',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                    placeholder={isEditing ? 'اتركه فارغاً للإبقاء على كلمة المرور الحالية' : '123456'}
                    placeholderTextColor={colors.gray}
                    value={formPassword}
                    onChangeText={setFormPassword}
                  />
                  <Text style={{ color: colors.gray, fontSize: 10, textAlign: 'right', marginTop: 3 }}>
                    {isEditing
                      ? '💡 إذا حددت كلمة مرور جديدة، سيتم إجبار المستخدم على تغييرها فور تسجيل دخوله التالي.'
                      : '💡 يقوم المسؤول بتحديد أي كلمة مرور مؤقتة، ويجبر التطبيق العضو على تغييرها فور دخوله.'}
                  </Text>
                </View>

                {/* Balance edit: Only Owner can adjust wallet balance */}
                {isEditing && isOwner && (
                  <>
                    <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>رصيد المحفظة (ج.م):</Text>
                    <TextInput
                      style={{
                        backgroundColor: colors.darkCard,
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                        color: colors.primary,
                        textAlign: 'right',
                        fontWeight: '900',
                        borderWidth: 1,
                        borderColor: colors.border,
                      }}
                      placeholder="0"
                      placeholderTextColor={colors.gray}
                      keyboardType="numeric"
                      value={formBalance}
                      onChangeText={setFormBalance}
                    />
                  </>
                )}

                <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>الرتبة:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  <View style={{ flexDirection: 'row-reverse', gap: 6 }}>
                    {ALL_ROLES.filter((r) => {
                      if (r.key === 'all') return false;
                      if (isManager && (r.key === 'owner' || r.key === 'manager')) return false;
                      return true;
                    }).map((r) => (
                      <TouchableOpacity
                        key={r.key}
                        onPress={() => setFormRole(r.key)}
                        style={{
                          backgroundColor: formRole === r.key ? colors.primary : colors.darkCard,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: borderRadius.md,
                          borderWidth: 1,
                          borderColor: formRole === r.key ? colors.primary : colors.border,
                        }}
                      >
                        <Text
                          style={{
                            color: formRole === r.key ? colors.dark : colors.white,
                            fontWeight: '900',
                            fontSize: 12,
                          }}
                        >
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg }}>
                <TouchableOpacity
                  onPress={() => setUserModalVisible(false)}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.darkCard,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.gray, fontWeight: '700' }}>إلغاء</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveUser}
                  style={{
                    flex: 1,
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.dark, fontWeight: '900' }}>
                    {isEditing ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Strict Delete Confirmation Modal (Owner Only) */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#161616',
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              borderWidth: 1,
              borderColor: '#EF4444',
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <AlertCircle size={40} color="#EF4444" />
              <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '900', marginTop: 6 }}>
                حذف مستخدم نهائياً ⚠️
              </Text>
            </View>

            <Text style={{ color: colors.white, fontSize: 14, textAlign: 'center', marginBottom: 4 }}>
              أنت على وشك حذف حساب: <Text style={{ color: colors.primary, fontWeight: '900' }}>{deleteTargetUser?.name}</Text>
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center', marginBottom: spacing.md }}>
              هذا الإجراء نهائي ولا يمكن التراجع عنه. لتأكيد الحذف، اكتب كلمة <Text style={{ color: '#EF4444', fontWeight: '900' }}>"تأكيد"</Text> في الحقل أدناه:
            </Text>

            <TextInput
              style={{
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                color: colors.white,
                textAlign: 'center',
                fontWeight: '900',
                borderWidth: 1,
                borderColor: confirmInputText.trim() === 'تأكيد' ? '#EF4444' : colors.border,
                marginBottom: spacing.md,
              }}
              placeholder="اكتب تأكيد هنا..."
              placeholderTextColor={colors.gray}
              value={confirmInputText}
              onChangeText={setConfirmInputText}
            />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.darkCard,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.gray, fontWeight: '700' }}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmDelete}
                disabled={confirmInputText.trim() !== 'تأكيد'}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: confirmInputText.trim() === 'تأكيد' ? '#EF4444' : '#555',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '900' }}>حذف نهائي 🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
