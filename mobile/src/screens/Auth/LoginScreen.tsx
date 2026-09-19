import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { Phone, Lock, Eye, EyeOff, MessageSquare, Wrench } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';




function normalizePhone(input: any): string {
  if (!input) return '';
  let digits = String(input).trim().replace(/\D/g, '');
  if (digits.startsWith('0020')) digits = digits.slice(4);
  else if (digits.startsWith('020')) digits = digits.slice(3);
  else if (digits.startsWith('20') && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith('1')) {
    digits = '0' + digits;
  }
  return digits;
}

export default function LoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (isLoading) return;
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = email.trim();
    if (!cleanPhone && !cleanEmail) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الهاتف المسجل (إجباري 📱)');
      return;
    }
    if (!password.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال كلمة المرور (🔒)');
      return;
    }
    const effectiveId = cleanPhone || cleanEmail;
    setIsLoading(true);
    try {
      const res = await login(effectiveId, password);
      if (res?.requireOtp) {
        navigation.navigate('OTP', {
          tempToken: res.tempToken,
          phone: res.phone || cleanPhone,
          flow: 'login',
        });
      }
    } catch (err: any) {
      const msg = err.message || 'بيانات الدخول غير صحيحة. يرجى التأكد من رقم الهاتف أو كلمة المرور.';
      if (Platform.OS === 'web') window.alert('خطأ في تسجيل الدخول: ' + msg);
      else Alert.alert('خطأ في تسجيل الدخول', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: '#0A0A0A', height: Platform.OS === 'web' ? ('100vh' as any) : '100%' },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={[{ flex: 1 }, Platform.OS === 'web' && { overflowY: 'auto' } as any]}
          contentContainerStyle={{
            padding: spacing.xl,
            paddingBottom: 150,
            flexGrow: 1,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header & Logo Section */}
          <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: '#141414',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
                borderWidth: 1.5,
                borderColor: '#D4AF37',
                shadowColor: '#D4AF37',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Wrench color="#D4AF37" size={26} />
            </View>

            <Text
              style={{
                color: '#D4AF37',
                fontSize: 24,
                fontWeight: '900',
                letterSpacing: 1,
                marginBottom: 2,
              }}
            >
              TecnoRexa
            </Text>

            <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
              منصة الصيانة الأولى في مصر
            </Text>
          </View>

          {/* Form */}
          <View style={{ gap: spacing.md, width: '100%', maxWidth: 440, alignSelf: 'center', marginBottom: spacing.md }}>
            {/* Phone Input (Mandatory) */}
            <View>
              <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                رقم الهاتف المسجل <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#18181B',
                  borderWidth: 1,
                  borderColor: '#27272A',
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: spacing.md,
                  height: 50,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    textAlign: 'right',
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: '600',
                  }}
                  placeholder="01xxxxxxxxx"
                  placeholderTextColor="#71717A"
                  keyboardType="phone-pad"
                  maxLength={11}
                  value={phone}
                  onChangeText={setPhone}
                />
                <Phone color="#D4AF37" size={18} style={{ marginLeft: 8 }} />
              </View>
            </View>

            {/* Password Input */}
            <View>
              <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                كلمة المرور <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#18181B',
                  borderWidth: 1,
                  borderColor: '#27272A',
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: spacing.md,
                  height: 50,
                }}
              >
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
                  {showPass ? <EyeOff color="#71717A" size={18} /> : <Eye color="#71717A" size={18} />}
                </TouchableOpacity>
                <TextInput
                  style={{
                    flex: 1,
                    textAlign: 'right',
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: '600',
                    marginHorizontal: 8,
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#71717A"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={setPassword}
                />
                <Lock color="#D4AF37" size={18} />
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                onPress={() => navigation.navigate('ForgotPassword', { phone: normalizePhone(phone) })}
                style={{ alignSelf: 'flex-start', marginTop: 6 }}
              >
                <Text style={{ color: '#D4AF37', fontSize: 12, fontWeight: '700' }}>
                  نسيت كلمة المرور؟
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: spacing.md }}>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.9}
              style={{
                backgroundColor: '#D4AF37',
                height: 56,
                borderRadius: borderRadius.lg,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#D4AF37',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 16 }}>
                  تسجيل الدخول
                </Text>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: spacing.md,
                gap: 6,
              }}
            >
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 14 }}>
                  إنشاء حساب جديد
                </Text>
              </TouchableOpacity>
              <Text style={{ color: '#A1A1AA', fontSize: 14 }}>ليس لديك حساب؟</Text>
            </View>

            {/* Quick Contact Support Button */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Contact')}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 10,
                backgroundColor: 'rgba(13, 148, 136, 0.12)',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: 'rgba(13, 148, 136, 0.35)',
                marginTop: spacing.sm,
              }}
            >
              <MessageSquare size={16} color="#0D9488" />
              <Text style={{ color: '#0D9488', fontSize: 13, fontWeight: '800' }}>
                تواصل مع الدعم الفني والمساعدة 💬
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

