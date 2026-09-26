import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Crown,
  Edit3,
  Lock,
  ShieldCheck,
  LogOut,
  ThumbsUp,
  MessageSquare,
  Share2,
  Video,
  Image as ImageIcon,
  Plus,
  Settings,
  Film,
  Phone,
  Mail,
  CheckCircle2,
  Send,
  MoreVertical,
  Trash2,
  User,
  Wrench,
  Store,
  Sparkles,
  X,
  Wallet,
  Upload,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { normalizeRole } from '../../utils/permissions';
import { fetchApi } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';

interface Post {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  time: string;
  content: string;
  image?: string;
  videoUrl?: string;
  likes: number;
  commentsCount: number;
  isLiked?: boolean;
}

const ROLE_DETAILS: Record<
  string,
  {
    title: string;
    badge: string;
    emoji: string;
    color: string;
    sub: string;
    sectionNumber: number;
  }
> = {
  owner: {
    title: 'الملف الشخصي للمالك 👑',
    badge: 'مالك المنصة - بصلاحيات كاملة',
    emoji: '👑',
    color: colors.owner,
    sub: 'التحكم الإداري والمالي والأمني الشامل',
    sectionNumber: 19,
  },
  manager: {
    title: 'الملف الشخصي للمدير 👔',
    badge: 'المدير العام - إدارة العمليات والفرق',
    emoji: '👔',
    color: colors.manager,
    sub: 'الإشراف على الطلبات والنزاعات وتنسيق الفنيين',
    sectionNumber: 15,
  },
  programmer: {
    title: 'الملف الشخصي للمطور 💻',
    badge: 'مهندس برمجيات ونظم - فريق التطوير',
    emoji: '💻',
    color: colors.programmer,
    sub: 'مراقبة الخوادم وحل الأخطاء وتحديث النواة',
    sectionNumber: 11,
  },
  customer_support: {
    title: 'الملف الشخصي لخدمة العملاء 🎧',
    badge: 'أخصائي خدمة العملاء والدعم الفني',
    emoji: '🎧',
    color: colors.support,
    sub: 'متابعة الشكاوى والردود السريعة ومساعدة الزوار',
    sectionNumber: 9,
  },
  technician: {
    title: 'الملف الشخصي للفني المعتمد 🧑‍🔧',
    badge: 'فني صيانة معتمد وموثق 🔧',
    emoji: '🧑‍🔧',
    color: colors.technician,
    sub: 'استقبال طلبات الصيانة المنزلية وتحصيل الأرباح',
    sectionNumber: 10,
  },
  merchant: {
    title: 'الملف الشخصي للتاجر 🏪',
    badge: 'متجر معتمد ومورد قطع غيار 📦',
    emoji: '🏪',
    color: colors.merchant,
    sub: 'بيع قطع الغيار الأصلية وإدارة الشحنات والمستودعات',
    sectionNumber: 11,
  },
  customer: {
    title: 'الملف الشخصي للعميل 👤',
    badge: 'عميل منصة TecnoRexa المميز 👤',
    emoji: '👤',
    color: colors.customer,
    sub: 'طلب خدمات الصيانة وتسوق قطع الغيار الأصلية',
    sectionNumber: 10,
  },
};

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const roleKey = normalizeRole(user?.role || 'customer');
  const roleInfo = ROLE_DETAILS[roleKey] || ROLE_DETAILS.customer;
  const isAdmin = roleKey === 'owner' || roleKey === 'manager';

  const [activeTab, setActiveTab] = useState<'feed' | 'reels'>('feed');

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('تنبيه', 'يرجى منح صلاحية الوصول للصور لاختيار صورة شخصية.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newAvatar = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        const res = await fetchApi('/user/avatar', { method: 'POST', data: { avatar: newAvatar } });
        if (res?.success || res?.message) {
          useAuthStore.getState().updateUser({ ...user, avatar: newAvatar } as any);
          Alert.alert('✅ تم التحديث', 'تم تغيير صورتك الشخصية بنجاح.');
        }
      }
    } catch (err: any) {
      Alert.alert('خطأ', 'تعذر تحديث الصورة الشخصية');
    }
  };

  // Upgrade Modal State (for Customers)
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeType, setUpgradeType] = useState<'technician' | 'merchant'>('technician');
  const [upgradePhone, setUpgradePhone] = useState(user?.phone || '');
  const [upgradeSenderPhone, setUpgradeSenderPhone] = useState(user?.phone || '');
  const [upgradeReceiptImage, setUpgradeReceiptImage] = useState<string | null>(null);
  const [upgradeSpecialty, setUpgradeSpecialty] = useState('صيانة تكييفات وتبريد');
  const [upgradeNotes, setUpgradeNotes] = useState('');
  const [submittingUpgrade, setSubmittingUpgrade] = useState(false);

  // New Post Modal State
  const [newPostModal, setNewPostModal] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');

  // Feed Posts
  const [posts, setPosts] = useState<Post[]>([]);

  // Reels
  const [reels, setReels] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfileData = useCallback(async () => {
    try {
      const [postsRes, reelsRes, profRes] = await Promise.all([
        fetchApi('/community/posts').catch(() => []),
        fetchApi('/reels').catch(() => []),
        fetchApi('/user/profile').catch(() => null),
      ]);
      if (Array.isArray(postsRes)) setPosts(postsRes);
      if (Array.isArray(reelsRes)) setReels(reelsRes);
      if (profRes && user) {
        useAuthStore.getState().updateUser({ ...user, ...profRes });
      }
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handlePickUpgradeReceipt = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setUpgradeReceiptImage(res.assets[0].uri);
      }
    } catch {
      Alert.alert('تنبيه', 'تعذر فتح معرض الصور');
    }
  };

  const handleOpenUpgrade = (type: 'technician' | 'merchant') => {
    setUpgradeType(type);
    setUpgradeReceiptImage(null);
    setUpgradeSenderPhone(user?.phone || '');
    setUpgradeSpecialty(
      type === 'technician' ? 'صيانة تكييفات وتبريد' : 'قطع غيار وأجهزة كهربائية'
    );
    setUpgradeModalVisible(true);
  };

  const handleSubmitUpgrade = async () => {
    if (!upgradePhone.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الهاتف للتواصل');
      return;
    }
    if (!upgradeSenderPhone.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم المحفظة المحول منها رسوم التوثيق');
      return;
    }
    if (!upgradeReceiptImage) {
      Alert.alert('تنبيه', 'يرجى إرفاق صورة إيصال التحويل للمتابعة والاعتماد');
      return;
    }
    setSubmittingUpgrade(true);
    try {
      await fetchApi('/trade-requests', {
        method: 'POST',
        data: {
          type: upgradeType,
          specialty: upgradeSpecialty.trim(),
          phone: upgradePhone.trim(),
          senderPhone: upgradeSenderPhone.trim(),
          transferReceipt: upgradeReceiptImage,
          feePaid: upgradeType === 'merchant' ? 100 : 300,
          notes: upgradeNotes.trim() || 'طلب ترقية الحساب عبر التطبيق',
        },
      });

      setUpgradeModalVisible(false);
      Alert.alert(
        '✅ تم إرسال طلب الترقية',
        `تم تسجيل طلب ترقيتك وإرفاق الإيصال بنجاح. سيقوم فريق الإدارة بمراجعة التحويل واعتماد حسابك خلال دقائق.`
      );
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إرسال طلب الترقية');
    } finally {
      setSubmittingUpgrade(false);
    }
  };

  const handleLike = (id: string) => {
    setPosts(
      posts.map((p) =>
        p.id === id
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p
      )
    );
  };

  const handleCreatePost = () => {
    if (!postText.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة نص المنشور');
      return;
    }
    const newP: Post = {
      id: `p_${Date.now()}`,
      authorName: user?.name || 'مستخدم المنصة',
      authorRole: roleInfo.badge,
      authorAvatar: roleInfo.emoji,
      time: 'الآن',
      content: postText.trim(),
      image: postImageUrl.trim() || undefined,
      likes: 0,
      commentsCount: 0,
      isLiked: false,
    };
    setPosts([newP, ...posts]);
    setNewPostModal(false);
    setPostText('');
    setPostImageUrl('');
    Alert.alert('✅ تم النشر', 'تم نشر المنشور بنجاح على مجتمع المنصة.');
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('هل أنت متأكد أنك تريد تسجيل الخروج؟')) {
        logout();
      }
    } else {
      Alert.alert(
        'تأكيد تسجيل الخروج',
        'هل أنت متأكد أنك تريد تسجيل الخروج؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل الخروج', style: 'destructive', onPress: () => logout() },
        ],
        { cancelable: true }
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (roleKey === 'owner') {
      Alert.alert('غير مسموح', 'لا يمكن حذف حساب المالك الرئيسي للمنظومة.');
      return;
    }
    const executeDelete = async () => {
      try {
        const res = await fetchApi('/user/account', { method: 'DELETE' });
        if (res?.success) {
          Alert.alert('✅ تم حذف الحساب', 'تم حذف حسابك وبياناتك نهائياً من المنصة.');
          logout();
        } else {
          Alert.alert('خطأ', res?.error || 'تعذر حذف الحساب');
        }
      } catch (err: any) {
        Alert.alert('خطأ', err.message || 'فشل حذف الحساب');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('⚠️ هل أنت متأكد تماماً من رغبتك في حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
        await executeDelete();
      }
    } else {
      Alert.alert(
        '⚠️ حذف الحساب نهائياً',
        'هل أنت متأكد تماماً من رغبتك في حذف حسابك وبياناتك نهائياً من المنصة؟ لا يمكن التراجع عن هذا الإجراء.',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'نعم، احذف الحساب', style: 'destructive', onPress: executeDelete },
        ],
        { cancelable: true }
      );
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.dark, height: '100%' }}
    >
      <OwnerHeader
        title={roleInfo.title}
        subtitle={roleInfo.sub}
        sectionNumber={roleInfo.sectionNumber}
        navigation={navigation}
        showBack={true}
        currentScreen="Profile"
        onRefresh={onRefresh}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: borderRadius.md,
              backgroundColor: 'rgba(212,175,55,0.15)',
              borderWidth: 1,
              borderColor: colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Edit3 size={14} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '900' }}>
              تعديل الملف
            </Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={[{ flex: 1 }, Platform.OS === 'web' && { overflowY: 'auto' } as any]}
        contentContainerStyle={{ paddingBottom: 150 }}
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
        {/* Cover & Hero Profile */}
        <View
          style={{
            position: 'relative',
            backgroundColor: '#141414',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          {/* Cover Banner */}
          <View
            style={{
              height: 120,
              backgroundColor: '#101010',
              justifyContent: 'center',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: roleInfo.color + '44',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Sparkles size={20} color={roleInfo.color} />
              <Text
                style={{
                  color: roleInfo.color,
                  fontSize: 15,
                  fontWeight: '900',
                  letterSpacing: 1,
                }}
              >
                TECNOREXA {roleKey.toUpperCase()} PROFILE
              </Text>
            </View>
          </View>

          {/* Avatar & User Details */}
          <View style={{ alignItems: 'center', marginTop: -45, paddingBottom: spacing.lg }}>
            <TouchableOpacity
              onPress={handlePickAvatar}
              activeOpacity={0.8}
              accessibilityLabel="تغيير الصورة الشخصية"
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
                backgroundColor: '#1A1A1A',
                borderWidth: 3,
                borderColor: roleInfo.color,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: roleInfo.color,
                shadowOpacity: 0.5,
                shadowRadius: 10,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {user?.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:')) ? (
                <Image source={{ uri: user.avatar }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Text style={{ fontSize: 40 }}>{user?.avatar || roleInfo.emoji}</Text>
              )}
              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  paddingVertical: 2,
                  alignItems: 'center',
                }}
              >
                <Edit3 size={11} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text
              style={{
                color: colors.white,
                fontSize: 22,
                fontWeight: '900',
                marginTop: spacing.sm,
              }}
            >
              {user?.name || 'مستخدم المنصة'}
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                marginTop: 4,
                backgroundColor: 'rgba(255,255,255,0.05)',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: borderRadius.full,
                borderWidth: 1,
                borderColor: roleInfo.color + '44',
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#10B981',
                }}
              />
              <Text
                style={{
                  color: roleInfo.color,
                  fontWeight: '800',
                  fontSize: 13,
                }}
              >
                {roleInfo.badge}
              </Text>
            </View>

            {/* Contact details */}
            <View
              style={{
                flexDirection: 'row',
                gap: spacing.lg,
                marginTop: spacing.sm,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: colors.gray, fontSize: 12 }}>
                  {user?.phone || 'غير محدد'}
                </Text>
                <Phone size={13} color={colors.gray} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: colors.gray, fontSize: 12 }}>
                  {user?.email || 'غير محدد'}
                </Text>
                <Mail size={13} color={colors.gray} />
              </View>
            </View>

            {/* Technician Specialties Badges */}
            {user?.specialty ? (
              <View style={{ marginTop: spacing.sm, alignItems: 'center', paddingHorizontal: spacing.md }}>
                <Text style={{ color: colors.gray, fontSize: 11, marginBottom: 6, fontWeight: '700' }}>
                  التخصصات المعتمدة (3 تخصصات):
                </Text>
                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {String(user.specialty)
                    .split(/[,،]/)
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                    .map((spec: string, idx: number) => (
                      <View
                        key={idx}
                        style={{
                          backgroundColor: 'rgba(212, 175, 55, 0.15)',
                          borderColor: colors.primary,
                          borderWidth: 1,
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>
                          🔧 {spec}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            ) : null}

            {/* Quick Action Buttons */}
            <View
              style={{
                flexDirection: 'row',
                gap: spacing.sm,
                marginTop: spacing.md,
                paddingHorizontal: spacing.md,
                flexWrap: 'wrap',
              }}
            >
              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(239,68,68,0.15)',
                  borderWidth: 1,
                  borderColor: '#EF4444',
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: borderRadius.md,
                  gap: 6,
                }}
              >
                <LogOut size={16} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 12 }}>
                  خروج
                </Text>
              </TouchableOpacity>

              {roleKey !== 'owner' && (
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(239,68,68,0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.4)',
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: borderRadius.md,
                    gap: 6,
                  }}
                >
                  <Trash2 size={16} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 12 }}>
                    حذف الحساب
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => navigation.navigate('ChangePassword')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.darkCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: borderRadius.md,
                  gap: 6,
                }}
              >
                <Lock size={16} color={colors.primary} />
                <Text style={{ color: colors.white, fontWeight: '800', fontSize: 13 }}>
                  تغيير كلمة المرور
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('EditProfile')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.primary,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: borderRadius.md,
                  gap: 6,
                }}
              >
                <Edit3 size={16} color={colors.dark} />
                <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 12 }}>
                  تعديل البيانات
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Customer Upgrade Card (If customer) */}
        {roleKey === 'customer' && (
          <View
            style={{
              margin: spacing.md,
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              borderWidth: 1.5,
              borderColor: colors.primary,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.xs,
              }}
            >
              <Sparkles size={24} color={colors.primary} />
              <Text
                style={{
                  color: colors.white,
                  fontWeight: '900',
                  fontSize: typography.sizes.md,
                }}
              >
                ترقية الحساب المهني 🚀
              </Text>
            </View>
            <Text
              style={{
                color: colors.gray,
                fontSize: 12,
                textAlign: 'right',
                lineHeight: 18,
                marginBottom: spacing.md,
              }}
            >
              انضم لشبكة المحترفين في أكبر منصة مصرية للصيانة وسوق قطع الغيار وضاعف دخلك اليومي.
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => handleOpenUpgrade('merchant')}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(16,185,129,0.15)',
                  borderWidth: 1,
                  borderColor: '#10B981',
                  borderRadius: borderRadius.lg,
                  padding: spacing.sm,
                  alignItems: 'center',
                }}
              >
                <Store size={22} color="#10B981" style={{ marginBottom: 4 }} />
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>
                  ترقية إلى تاجر
                </Text>
                <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700' }}>
                  100 ج.م رسوم التوثيق
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOpenUpgrade('technician')}
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(212,175,55,0.15)',
                  borderWidth: 1,
                  borderColor: colors.primary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.sm,
                  alignItems: 'center',
                }}
              >
                <Wrench size={22} color={colors.primary} style={{ marginBottom: 4 }} />
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>
                  ترقية إلى فني
                </Text>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                  300 ج.م رسوم التوثيق
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}



        {/* Profile Tabs */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.darkCard,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('feed')}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'feed' ? colors.primary : 'transparent',
            }}
          >
            <Text
              style={{
                color: activeTab === 'feed' ? colors.primary : colors.gray,
                fontWeight: '900',
                fontSize: 14,
              }}
            >
              📰 المجتمع
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('reels')}
            style={{
              flex: 1,
              paddingVertical: spacing.md,
              alignItems: 'center',
              borderBottomWidth: 2,
              borderBottomColor: activeTab === 'reels' ? colors.primary : 'transparent',
            }}
          >
            <Text
              style={{
                color: activeTab === 'reels' ? colors.primary : colors.gray,
                fontWeight: '900',
                fontSize: 14,
              }}
            >
              🎬 الفيديوهات والريلز
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: FEED */}
        {activeTab === 'feed' && (
          <View style={{ padding: spacing.md }}>
            {/* Create Post Box */}
            <View
              style={{
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: spacing.md,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  marginBottom: spacing.sm,
                }}
              >
                <TouchableOpacity
                  onPress={() => setNewPostModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: '#161616',
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.gray, textAlign: 'right', fontSize: 13 }}>
                    بماذا تفكر يا {user?.name || 'صديقنا'}؟ انشر تحديثاً للمجتمع...
                  </Text>
                </TouchableOpacity>

                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#222',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: roleInfo.color,
                  }}
                >
                  <Text style={{ fontSize: 18 }}>{roleInfo.emoji}</Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  borderTopWidth: 1,
                  borderTopColor: colors.border + '44',
                  paddingTop: spacing.xs,
                }}
              >
                <TouchableOpacity
                  onPress={() => setNewPostModal(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <ImageIcon size={16} color="#10B981" />
                  <Text style={{ color: colors.gray, fontSize: 12 }}>إضافة صورة</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNewPostModal(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                  <Video size={16} color="#EC4899" />
                  <Text style={{ color: colors.gray, fontSize: 12 }}>إضافة فيديو</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Posts List */}
            <View style={{ gap: spacing.md }}>
              {posts.length === 0 ? (
                <View
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.lg,
                    padding: spacing.xl,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <MessageSquare size={36} color={colors.gray} style={{ marginBottom: spacing.sm }} />
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 14,
                      fontWeight: '700',
                      textAlign: 'center',
                      marginBottom: 4,
                    }}
                  >
                    لا توجد منشورات في المجتمع حتى الآن
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}>
                    كن أول من ينشر تجاربه واستفساراته الهندسية والفنية وشارك زملاءك
                  </Text>
                </View>
              ) : (
                posts.map((post) => (
                  <View
                    key={post.id}
                    style={{
                      backgroundColor: colors.darkCard,
                      borderRadius: borderRadius.lg,
                      borderWidth: 1,
                      borderColor: colors.border,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: spacing.md,
                      }}
                    >
                      <MoreVertical size={16} color={colors.gray} />
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.sm,
                        }}
                      >
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text
                            style={{
                              color: colors.white,
                              fontWeight: '900',
                              fontSize: 14,
                            }}
                          >
                            {post.authorName}
                          </Text>
                          <Text style={{ color: colors.gray, fontSize: 11 }}>
                            {post.authorRole} • {post.time}
                          </Text>
                        </View>
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: '#222',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: colors.primary,
                          }}
                        >
                          <Text style={{ fontSize: 18 }}>{post.authorAvatar}</Text>
                        </View>
                      </View>
                    </View>

                    <Text
                      style={{
                        color: colors.white,
                        paddingHorizontal: spacing.md,
                        paddingBottom: spacing.sm,
                        textAlign: 'right',
                        fontSize: 14,
                        lineHeight: 22,
                      }}
                    >
                      {post.content}
                    </Text>

                    {post.image && (
                      <Image
                        source={{ uri: post.image }}
                        style={{ width: '100%', height: 220 }}
                        resizeMode="cover"
                      />
                    )}

                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border + '44',
                      }}
                    >
                      <Text style={{ color: colors.gray, fontSize: 11 }}>
                        {post.commentsCount} تعليق
                      </Text>
                      <Text style={{ color: colors.gray, fontSize: 11 }}>
                        {post.likes} إعجاب
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        borderTopWidth: 1,
                        borderTopColor: colors.border + '44',
                        paddingVertical: 4,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => handleLike(post.id)}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 8,
                        }}
                      >
                        <ThumbsUp
                          size={16}
                          color={post.isLiked ? colors.primary : colors.gray}
                        />
                        <Text
                          style={{
                            color: post.isLiked ? colors.primary : colors.gray,
                            fontWeight: '700',
                            fontSize: 12,
                          }}
                        >
                          إعجاب
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => Alert.alert('تعليقات', 'خاصية التعليقات المباشرة')}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 8,
                        }}
                      >
                        <MessageSquare size={16} color={colors.gray} />
                        <Text
                          style={{
                            color: colors.gray,
                            fontWeight: '700',
                            fontSize: 12,
                          }}
                        >
                          تعليق
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => Alert.alert('مشاركة', 'تم نسخ رابط المنشور.')}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          paddingVertical: 8,
                        }}
                      >
                        <Share2 size={16} color={colors.gray} />
                        <Text
                          style={{
                            color: colors.gray,
                            fontWeight: '700',
                            fontSize: 12,
                          }}
                        >
                          مشاركة
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* TAB 2: REELS */}
        {activeTab === 'reels' && (
          <View style={{ padding: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
            >
              {isAdmin ? (
                <TouchableOpacity
                  onPress={() => navigation.navigate('MediaApproval')}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: borderRadius.md,
                  }}
                >
                  <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 12 }}>
                    مراجعة الفيديوهات 🎬
                  </Text>
                </TouchableOpacity>
              ) : <View />}
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900' }}>
                أحدث مقاطع الشروحات
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {reels.length === 0 ? (
                <View
                  style={{
                    width: '100%',
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.lg,
                    padding: spacing.xl,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Film size={36} color={colors.gray} style={{ marginBottom: spacing.sm }} />
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 14,
                      fontWeight: '700',
                      textAlign: 'center',
                      marginBottom: 4,
                    }}
                  >
                    لا توجد مقاطع ريلز أو فيديوهات شروحات حالياً
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}>
                    ستظهر هنا مقاطع الفيديو التوضيحية والشروحات المنشورة والمعتمدة
                  </Text>
                </View>
              ) : (
                reels.map((reel) => (
                  <View
                    key={reel.id}
                    style={{
                      width: '48.5%',
                      backgroundColor: colors.darkCard,
                      borderRadius: borderRadius.lg,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Image
                      source={{ uri: reel.thumbnail }}
                      style={{ width: '100%', height: 180 }}
                      resizeMode="cover"
                    />
                    <View style={{ padding: spacing.sm }}>
                      <Text
                        style={{
                          color: colors.white,
                          fontWeight: '700',
                          fontSize: 12,
                          textAlign: 'right',
                        }}
                        numberOfLines={1}
                      >
                        {reel.title}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          marginTop: 4,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 10,
                            fontWeight: '700',
                          }}
                        >
                          {reel.views} مشاهدة
                        </Text>
                        <Text style={{ color: colors.gray, fontSize: 10 }}>
                          {reel.duration}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>



      {/* MODAL 2: CUSTOMER UPGRADE REQUEST */}
      <Modal visible={upgradeModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <View
            style={{
              backgroundColor: '#141414',
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              borderWidth: 1.5,
              borderColor: colors.primary,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
            >
              <TouchableOpacity onPress={() => setUpgradeModalVisible(false)}>
                <X size={20} color={colors.gray} />
              </TouchableOpacity>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 16,
                  fontWeight: '900',
                }}
              >
                {upgradeType === 'merchant'
                  ? 'طلب ترقية إلى تاجر معتمد 🏪'
                  : 'طلب ترقية إلى فني معتمد 🧑‍🔧'}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(212,175,55,0.08)',
                padding: spacing.md,
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: colors.primary + '44',
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: 12,
                  textAlign: 'right',
                  lineHeight: 18,
                  marginBottom: 6,
                }}
              >
                {upgradeType === 'merchant'
                  ? 'رسوم توثيق التاجر (100 ج.م) لفتح المتجر وإضافة المنتجات وربطها بالمستودعات.'
                  : 'رسوم توثيق الفني (300 ج.م) لاعتماد حسابك وبدء استقبال طلبات الصيانة بالعمولة المباشرة.'}
              </Text>
              <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '900', textAlign: 'right' }}>
                يرجى تحويل الرسوم عبر فودافون كاش أو إنستاباي إلى الرقم: 01012345678
              </Text>
            </View>

            <View style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
              <View>
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                  رقم الهاتف للتواصل <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    color: colors.white,
                    textAlign: 'right',
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 13,
                  }}
                  value={upgradePhone}
                  onChangeText={setUpgradePhone}
                  placeholder="010xxxxxxxx"
                  placeholderTextColor={colors.gray}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Sender Wallet Phone */}
              <View>
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                  رقم المحفظة / الهاتف المحول منه <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    color: colors.white,
                    textAlign: 'right',
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 13,
                  }}
                  value={upgradeSenderPhone}
                  onChangeText={setUpgradeSenderPhone}
                  placeholder="01xxxxxxxxx"
                  placeholderTextColor={colors.gray}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Receipt Upload Button */}
              <View>
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                  صورة إيصال التحويل <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={handlePickUpgradeReceipt}
                  style={{
                    backgroundColor: colors.darkCard,
                    borderWidth: 1.5,
                    borderColor: upgradeReceiptImage ? '#10B981' : colors.primary + '66',
                    borderStyle: upgradeReceiptImage ? 'solid' : 'dashed',
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {upgradeReceiptImage ? (
                    <View style={{ alignItems: 'center', gap: 6 }}>
                      <Image source={{ uri: upgradeReceiptImage }} style={{ width: 100, height: 100, borderRadius: 8 }} />
                      <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800' }}>
                        تم إرفاق الإيصال بنجاح (اضغط لتغيير الصورة)
                      </Text>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', gap: 4 }}>
                      <Upload size={22} color={colors.primary} />
                      <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>
                        اضغط لرفع صورة إيصال التحويل (سكرين شوت)
                      </Text>
                      <Text style={{ color: colors.gray, fontSize: 10 }}>
                        فودافون كاش أو إنستاباي
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View>
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                  {upgradeType === 'merchant' ? 'نشاط المتجر أو المنتجات' : 'التخصص الأساسي'}
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    color: colors.white,
                    textAlign: 'right',
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 13,
                  }}
                  value={upgradeSpecialty}
                  onChangeText={setUpgradeSpecialty}
                  placeholder="مثال: تكييفات، غسالات، ثلاجات..."
                  placeholderTextColor={colors.gray}
                />
              </View>

              <View>
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                  ملاحظات أو سنوات الخبرة (اختياري)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    color: colors.white,
                    textAlign: 'right',
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 13,
                    height: 50,
                    textAlignVertical: 'top',
                  }}
                  value={upgradeNotes}
                  onChangeText={setUpgradeNotes}
                  placeholder="اكتب نبذة عن خبرتك أو متجرك..."
                  placeholderTextColor={colors.gray}
                  multiline
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity
                onPress={() => setUpgradeModalVisible(false)}
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
                onPress={handleSubmitUpgrade}
                disabled={submittingUpgrade}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                {submittingUpgrade ? (
                  <ActivityIndicator color={colors.dark} />
                ) : (
                  <Text style={{ color: colors.dark, fontWeight: '900' }}>
                    تأكيد الطلب 🚀
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: CREATE POST */}
      <Modal visible={newPostModal} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            padding: spacing.lg,
          }}
        >
          <View
            style={{
              backgroundColor: '#141414',
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              borderWidth: 1,
              borderColor: colors.primary,
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 18,
                fontWeight: '900',
                textAlign: 'right',
                marginBottom: spacing.md,
              }}
            >
              إنشاء منشور جديد على مجتمع المنصة 📢
            </Text>

            <TextInput
              style={{
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                color: colors.white,
                textAlign: 'right',
                height: 110,
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: spacing.md,
              }}
              placeholder="اكتب رسالتك للمجتمع والفنيين والتجار..."
              placeholderTextColor={colors.gray}
              multiline
              value={postText}
              onChangeText={setPostText}
            />

            <TextInput
              style={{
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                color: colors.white,
                textAlign: 'right',
                borderWidth: 1,
                borderColor: colors.border,
                marginBottom: spacing.lg,
              }}
              placeholder="رابط صورة مرفقة (اختياري URL)..."
              placeholderTextColor={colors.gray}
              value={postImageUrl}
              onChangeText={setPostImageUrl}
            />

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity
                onPress={() => setNewPostModal(false)}
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
                onPress={handleCreatePost}
                style={{
                  flex: 1,
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.dark, fontWeight: '900' }}>
                  نشر الآن 🚀
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
