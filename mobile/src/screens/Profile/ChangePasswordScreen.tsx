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
} from 'react-native';
import { ChevronRight, Lock, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { api } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function ChangePasswordScreen({ navigation }: any) {
  const { user: currentUser, updateUser } = useAuthStore();
  const isForcedChange = !!currentUser?.mustChangePassword;

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!isForcedChange && !form.currentPassword) {
      Alert.alert('تنبيه', 'يرجى إدخال كلمة المرور الحالية ⚠️');
      return;
    }
    if (!form.newPassword) {
      Alert.alert('خطأ', 'يرجى كتابة كلمة المرور الجديدة ❌');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور الجديدة غير متطابقة ❌');
      return;
    }
    if (form.newPassword.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل ❌');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/user/change-password', {
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword,
      });

      if (currentUser) {
        updateUser({ ...currentUser, mustChangePassword: false });
      }

      const msg = isForcedChange
        ? 'تم تعيين كلمة المرور الجديدة بنجاح! تم فتح حسابك للدخول الآن 🚀'
        : 'تم تحديث كلمة المرور بنجاح ✅';

      Alert.alert('تم بنجاح', msg, [
        {
          text: 'متابعة',
          onPress: () => {
            if (isForcedChange) {
              navigation?.navigate?.('Main');
            } else if (navigation?.canGoBack?.()) {
              navigation.goBack();
            } else {
              navigation?.navigate?.('Profile');
            }
          },
        },
      ]);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'تعذر تحديث كلمة المرور';
      Alert.alert('خطأ', errorMsg);
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
          paddingHorizontal: spacing.md,
          paddingVertical: 14,
          backgroundColor: '#111111',
          borderBottomWidth: 1,
          borderColor: '#222',
        }}
      >
        {!isForcedChange ? (
          <TouchableOpacity
            onPress={() => (navigation?.canGoBack?.() ? navigation.goBack() : navigation.navigate('Profile'))}
            style={{
              width: 40,
              height: 40,
              backgroundColor: '#1A1A1A',
              borderWidth: 1,
              borderColor: '#333',
              borderRadius: borderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight color={colors.primary} size={22} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={{ fontSize: 18, fontWeight: '900', color: colors.primary }}>
          {isForcedChange ? 'تعيين كلمة مرور جديدة للحساب' : 'تغيير كلمة المرور'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', marginVertical: 20 }}>
            <View
              style={{
                width: 72,
                height: 72,
                backgroundColor: 'rgba(212,175,55,0.15)',
                borderRadius: 36,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <Lock color={colors.primary} size={36} />
            </View>
            {isForcedChange && (
              <View
                style={{
                  backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  borderWidth: 1,
                  borderColor: colors.primary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  marginHorizontal: 16,
                  marginBottom: 16,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '900', textAlign: 'right', marginBottom: 4 }}>
                  🔒 تنبيه أمني: تعيين كلمة المرور الأولية
                </Text>
                <Text style={{ color: colors.white, fontSize: 12, textAlign: 'right', lineHeight: 18 }}>
                  تم تسجيل حسابك من قبل الإدارة بكلمة مرور مؤقتة. يرجى تعيين كلمة مرور شخصية جديدة خاصة بك للمتابعة والدخول إلى المنظومة.
                </Text>
              </View>
            )}

            <Text style={{ color: colors.gray, textAlign: 'center', paddingHorizontal: 20, fontSize: 13, lineHeight: 20 }}>
              {isForcedChange
                ? 'أهلاً بك! لسلامة وأمان حسابك، يُرجى كتابة كلمة مرور جديدة قوية خاصة بك لإتمام تفعيل الحساب.'
                : 'يُرجى إدخال كلمة المرور الحالية لتأكيد هويتك، ثم إدخال كلمة المرور الجديدة وتأكيدها.'}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: '#141414',
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: '#222',
              maxWidth: 500,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            {!isForcedChange && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.white, fontWeight: '800', textAlign: 'right', marginBottom: 8, fontSize: 13 }}>
                  كلمة المرور الحالية
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#1A1A1A',
                    borderWidth: 1,
                    borderColor: '#333',
                    borderRadius: borderRadius.md,
                    padding: 12,
                    textAlign: 'right',
                    color: colors.white,
                    fontWeight: '600',
                    fontSize: 14,
                  }}
                  secureTextEntry
                  placeholder="********"
                  placeholderTextColor={colors.gray}
                  value={form.currentPassword}
                  onChangeText={(t) => setForm({ ...form, currentPassword: t })}
                />
              </View>
            )}

            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: colors.white, fontWeight: '800', textAlign: 'right', marginBottom: 8, fontSize: 13 }}>
                كلمة المرور الجديدة
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#333',
                  borderRadius: borderRadius.md,
                  padding: 12,
                  textAlign: 'right',
                  color: colors.white,
                  fontWeight: '600',
                  fontSize: 14,
                }}
                secureTextEntry
                placeholder="********"
                placeholderTextColor={colors.gray}
                value={form.newPassword}
                onChangeText={(t) => setForm({ ...form, newPassword: t })}
              />
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: colors.white, fontWeight: '800', textAlign: 'right', marginBottom: 8, fontSize: 13 }}>
                تأكيد كلمة المرور الجديدة
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#333',
                  borderRadius: borderRadius.md,
                  padding: 12,
                  textAlign: 'right',
                  color: colors.white,
                  fontWeight: '600',
                  fontSize: 14,
                }}
                secureTextEntry
                placeholder="********"
                placeholderTextColor={colors.gray}
                value={form.confirmPassword}
                onChangeText={(t) => setForm({ ...form, confirmPassword: t })}
              />
            </View>

            <TouchableOpacity
              onPress={handleUpdate}
              disabled={loading}
              style={{
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
                height: 50,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              {loading ? (
                <ActivityIndicator color={colors.dark} />
              ) : (
                <>
                  <Lock color={colors.dark} size={18} />
                  <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>
                    تحديث كلمة المرور 🔒
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
