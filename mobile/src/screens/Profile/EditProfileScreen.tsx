import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  ChevronRight,
  Save,
  User,
  Phone,
  Mail,
  FileText,
  Camera,
  CheckCircle2,
  Wrench,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../api/client';

const TECH_SPECIALTIES_30 = [
  'ثلاجة',
  'ديب فريزر',
  'غسالة ملابس',
  'غسالة أطباق',
  'ميكروويف',
  'بوتجاز',
  'فرن كهربائي',
  'فرن غاز',
  'تكييف منزلي',
  'شفاط مطبخ',
  'سخان مياه',
  'خلاط',
  'عجان',
  'كبة',
  'محضرة طعام',
  'عصارة',
  'خلاط يدوي',
  'مكنسة كهربائية',
  'مكواة',
  'مروحة',
  'مروحة سقف',
  'غلاية مياه',
  'ماكينة قهوة',
  'ماكينة تحضير الشاي',
  'مقلاة هوائية',
  'محضرة قهوة',
  'مكنسة روبوت',
  'مجفف ملابس',
  'شفاط حمام',
  'صانعة ساندوتشات',
];

export default function EditProfileScreen({ navigation }: any) {
  const { user, updateUser } = useAuthStore();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(() => {
    if (user?.specialty) {
      return user.specialty.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 3);
    }
    return ['ثلاجة', 'غسالة ملابس', 'تكييف منزلي'];
  });

  const toggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      if (selectedSpecialties.length === 1) {
        Alert.alert('تنبيه', 'يجب اختيار 3 تخصصات صيانة.');
        return;
      }
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== spec));
    } else {
      if (selectedSpecialties.length >= 3) {
        Alert.alert('الحد الأقصى', 'يرجى اختيار 3 تخصصات صيانة فقط. قم بإلغاء تحديد أحدها لاختيار تخصص بديل.');
        return;
      }
      setSelectedSpecialties([...selectedSpecialties, spec]);
    }
  };

  const [loading, setLoading] = useState(false);

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
        setForm((prev) => ({ ...prev, avatar: newAvatar }));
        try {
          await api.post('/user/avatar', { avatar: newAvatar });
          if (user) {
            updateUser({ ...user, avatar: newAvatar });
          }
        } catch {}
      }
    } catch (err: any) {
      Alert.alert('خطأ', 'تعذر فتح معرض الصور');
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'owner':
        return { label: 'المالك 👑', color: colors.owner };
      case 'manager':
        return { label: 'مدير العمليات 👔', color: colors.manager };
      case 'programmer':
        return { label: 'مبرمج النظام 💻', color: colors.programmer };
      case 'support':
        return { label: 'خدمة العملاء 🎧', color: colors.support };
      case 'technician':
        return { label: 'فني معتمد 🧑‍🔧', color: colors.technician };
      case 'merchant':
        return { label: 'تاجر معتمد 🏪', color: colors.merchant };
      default:
        return { label: 'عميل المنصة 👤', color: colors.customer };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال الاسم بالكامل ⚠️');
      return;
    }
    if (!form.phone.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الهاتف ⚠️');
      return;
    }

    if (user?.role === 'technician') {
      if (selectedSpecialties.length !== 3) {
        Alert.alert('تنبيه', `يرجى اختيار 3 تخصصات صيانة بالضبط (تم اختيار ${selectedSpecialties.length} من 3) ⚠️`);
        return;
      }
    }

    try {
      setLoading(true);
      await api.put('/user/profile', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar.trim(),
      });

      if (user?.role === 'technician') {
        await api.put('/technician/specialties', {
          specialties: selectedSpecialties,
        }).catch(() => {});
      }

      if (user) {
        updateUser({
          ...user,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          bio: form.bio.trim(),
          avatar: form.avatar.trim() || user.avatar,
          specialty: user?.role === 'technician' ? selectedSpecialties.join('، ') : user.specialty,
        });
      }

      const successMsg = 'تم تحديث بيانات ملفك الشخصي بنجاح ✅';
      Alert.alert('تم بنجاح', successMsg, [
        { text: 'حسناً', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error || err.message || 'تعذر حفظ البيانات، يرجى المحاولة لاحقاً';
      Alert.alert('خطأ', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.lg,
          paddingTop: Platform.OS === 'ios' ? 12 : 16,
          paddingBottom: spacing.md,
          backgroundColor: '#111111',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(212, 175, 55, 0.2)',
        }}
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.primary,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: borderRadius.md,
            gap: 6,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Save color="#000" size={18} />
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 14 }}>حفظ</Text>
            </>
          )}
        </TouchableOpacity>

        <Text
          style={{
            fontSize: typography.sizes.lg,
            fontWeight: '900',
            color: colors.white,
          }}
        >
          تعديل الملف الشخصي
        </Text>

        <TouchableOpacity
          onPress={() => (navigation?.canGoBack?.() ? navigation.goBack() : navigation.navigate('Profile'))}
          style={{
            width: 40,
            height: 40,
            backgroundColor: '#1A1A1A',
            borderRadius: borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <ChevronRight color={colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={Platform.OS === 'ios'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar & Role Header Section */}
          <View
            style={{
              alignItems: 'center',
              backgroundColor: '#141414',
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              borderWidth: 1,
              borderColor: 'rgba(212, 175, 55, 0.25)',
              marginBottom: spacing.xl,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickAvatar}
              style={{ position: 'relative', marginBottom: spacing.md }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: '#222222',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.primary,
                  overflow: 'hidden',
                }}
              >
                {form.avatar ? (
                  <Image
                    source={{ uri: form.avatar }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 36, color: colors.primary }}>
                    {user?.name ? user.name.slice(0, 2) : '👤'}
                  </Text>
                )}
              </View>

              <View
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: colors.primary,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#141414',
                }}
              >
                <Camera size={16} color="#000" />
              </View>
            </TouchableOpacity>

            <Text
              style={{
                fontSize: typography.sizes.xl,
                fontWeight: '900',
                color: colors.white,
                marginBottom: 6,
              }}
            >
              {form.name || 'مستخدم TecnoRexa'}
            </Text>

            <View
              style={{
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(212, 175, 55, 0.3)',
              }}
            >
              <Text
                style={{
                  color: roleInfo.color,
                  fontWeight: '800',
                  fontSize: 13,
                }}
              >
                {roleInfo.label}
              </Text>
            </View>
          </View>

          {/* Form Fields Card */}
          <View
            style={{
              backgroundColor: '#141414',
              borderRadius: borderRadius.xl,
              padding: spacing.xl,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              gap: spacing.lg,
            }}
          >
            {/* Full Name */}
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '800', fontSize: 14 }}>
                  الاسم الكامل
                </Text>
                <User size={16} color={colors.primary} />
              </View>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                  borderRadius: borderRadius.md,
                  padding: 14,
                  textAlign: 'right',
                  color: colors.white,
                  fontWeight: '600',
                  fontSize: 15,
                }}
                value={form.name}
                onChangeText={t => setForm({ ...form, name: t })}
                placeholder="أدخل اسمك الكامل"
                placeholderTextColor="#666"
              />
            </View>

            {/* Phone Number */}
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '800', fontSize: 14 }}>
                  رقم الهاتف
                </Text>
                <Phone size={16} color={colors.primary} />
              </View>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                  borderRadius: borderRadius.md,
                  padding: 14,
                  textAlign: 'right',
                  color: colors.white,
                  fontWeight: '600',
                  fontSize: 15,
                }}
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={t => setForm({ ...form, phone: t })}
                placeholder="010XXXXXXXX"
                placeholderTextColor="#666"
              />
            </View>

            {/* Email */}
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '800', fontSize: 14 }}>
                  البريد الإلكتروني
                </Text>
                <Mail size={16} color={colors.primary} />
              </View>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                  borderRadius: borderRadius.md,
                  padding: 14,
                  textAlign: 'right',
                  color: colors.white,
                  fontWeight: '600',
                  fontSize: 15,
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={t => setForm({ ...form, email: t })}
                placeholder="user@example.com"
                placeholderTextColor="#666"
              />
            </View>

            {/* Avatar URL */}
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '800', fontSize: 14 }}>
                  رابط الصورة الشخصية (URL)
                </Text>
                <Camera size={16} color={colors.primary} />
              </View>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                  borderRadius: borderRadius.md,
                  padding: 14,
                  textAlign: 'right',
                  color: colors.white,
                  fontWeight: '600',
                  fontSize: 15,
                }}
                autoCapitalize="none"
                value={form.avatar}
                onChangeText={t => setForm({ ...form, avatar: t })}
                placeholder="https://..."
                placeholderTextColor="#666"
              />
            </View>

            {/* Technician 3 Specialties (For Technicians) */}
            {user?.role === 'technician' && (
              <View style={{ marginTop: 6, marginBottom: 8 }}>
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <Wrench size={16} color={colors.primary} />
                    <Text style={{ color: colors.white, fontWeight: '800', fontSize: 14 }}>
                      تخصصات الصيانة المعتمدة (3 تخصصات)
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: selectedSpecialties.length === 3 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.2)',
                      borderColor: selectedSpecialties.length === 3 ? '#10B981' : '#D4AF37',
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: selectedSpecialties.length === 3 ? '#10B981' : '#D4AF37',
                        fontSize: 11,
                        fontWeight: '800',
                      }}
                    >
                      تم اختيار {selectedSpecialties.length} من 3
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
                  {TECH_SPECIALTIES_30.map((spec) => {
                    const isChecked = selectedSpecialties.includes(spec);
                    return (
                      <TouchableOpacity
                        key={spec}
                        onPress={() => toggleSpecialty(spec)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: borderRadius.md,
                          backgroundColor: isChecked ? colors.primary : '#1A1A1A',
                          borderWidth: 1,
                          borderColor: isChecked ? colors.primary : '#333',
                        }}
                      >
                        <Text
                          style={{
                            color: isChecked ? '#0A0A0A' : colors.white,
                            fontSize: 12,
                            fontWeight: isChecked ? '900' : '600',
                          }}
                        >
                          {isChecked ? `✓ ${spec}` : spec}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Bio */}
            <View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '800', fontSize: 14 }}>
                  النبذة التعريفية (Bio)
                </Text>
                <FileText size={16} color={colors.primary} />
              </View>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: 'rgba(212, 175, 55, 0.25)',
                  borderRadius: borderRadius.md,
                  padding: 14,
                  textAlign: 'right',
                  color: colors.white,
                  fontWeight: '600',
                  fontSize: 15,
                  height: 100,
                  textAlignVertical: 'top',
                }}
                multiline
                value={form.bio}
                onChangeText={t => setForm({ ...form, bio: t })}
                placeholder="اكتب نبذة مختصرة عنك وخبرتك في مجالك..."
                placeholderTextColor="#666"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={loading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: borderRadius.lg,
                height: 54,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: spacing.md,
                flexDirection: 'row',
                gap: 8,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 4,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <CheckCircle2 color="#000" size={20} />
                  <Text
                    style={{
                      color: '#000',
                      fontWeight: '900',
                      fontSize: 16,
                    }}
                  >
                    حفظ التعديلات
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              disabled={loading}
              style={{
                backgroundColor: '#1F1F1F',
                borderRadius: borderRadius.lg,
                height: 52,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <Text
                style={{
                  color: '#94A3B8',
                  fontWeight: '800',
                  fontSize: 15,
                }}
              >
                إلغاء
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
