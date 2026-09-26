import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Image,
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
  const phoneInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (isLoading) return;
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم الهاتف المسجل (إجباري 📱)');
      return;
    }
    if (!password.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال كلمة المرور (🔒)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(cleanPhone, password);
      if (res?.requireOtp) {
        navigation.navigate('OTP', {
          tempToken: res.tempToken,
          phone: res.phone || cleanPhone,
          flow: 'login',
        });
      }
    } catch (err: any) {
      const msg = err.message || 'تعذر الاتصال بالخدمة حاليًا، يرجى التأكد من صحة البيانات أو المحاولة مرة أخرى.';
      if (Platform.OS === 'web') window.alert('خطأ في تسجيل الدخول: ' + msg);
      else Alert.alert('خطأ في تسجيل الدخول', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: '#0A0A0A',
          height: '100%',
          paddingTop: Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, 36) : 0,
        },
      ]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={[{ flex: 1, width: '100%' }, Platform.OS === 'web' && ({ overflowY: 'auto' } as any)]}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingTop: Platform.OS === 'web' ? 40 : spacing.lg,
            paddingBottom: 100,
            flexGrow: 1,
            alignItems: 'center',
            justifyContent: Platform.OS === 'web' ? 'flex-start' : 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        >
          {/* Card Container for Luxury Web & Clean Mobile */}
          <View
            style={{
              width: '100%',
              maxWidth: 460,
              backgroundColor: Platform.OS === 'web' ? '#141416' : 'transparent',
              borderWidth: Platform.OS === 'web' ? 1 : 0,
              borderColor: 'rgba(212, 175, 55, 0.25)',
              borderRadius: 20,
              padding: Platform.OS === 'web' ? 32 : 0,
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: Platform.OS === 'web' ? 0.15 : 0,
              shadowRadius: 20,
            }}
          >
            {/* Header & Logo Section */}
            <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
              <Image
                source={require('../../../assets/icon.png')}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  marginBottom: 12,
                }}
                resizeMode="contain"
              />

              <Text
                style={{
                  color: '#D4AF37',
                  fontSize: 26,
                  fontWeight: '900',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                TecnoRexa
              </Text>

              <Text style={{ color: '#A1A1AA', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                منصة TecnoRexa المتكاملة لصيانة الأجهزة المنزلية
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: spacing.md, width: '100%', marginBottom: spacing.md }}>
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
                    height: 54,
                  }}
                >
                  <TextInput
                    ref={phoneInputRef}
                    style={{
                      flex: 1,
                      height: '100%',
                      textAlign: 'right',
                      color: '#FFFFFF',
                      fontSize: 15,
                      fontWeight: '600',
                      paddingVertical: 0,
                      ...(Platform.OS === 'web' ? { outline: 'none' } : {}),
                    }}
                    placeholder="01xxxxxxxxx"
                    placeholderTextColor="#71717A"
                    keyboardType="phone-pad"
                    maxLength={11}
                    value={phone}
                    onChangeText={setPhone}
                  />
                  <View pointerEvents="none" style={{ marginLeft: 8 }}>
                    <Phone color="#D4AF37" size={18} />
                  </View>
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
                    height: 54,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    style={{ padding: 8, zIndex: 10 }}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    {showPass ? <EyeOff color="#D4AF37" size={20} /> : <Eye color="#71717A" size={20} />}
                  </TouchableOpacity>

                  <TextInput
                    ref={passwordInputRef}
                    style={{
                      flex: 1,
                      height: '100%',
                      textAlign: 'right',
                      color: '#FFFFFF',
                      fontSize: 15,
                      fontWeight: '600',
                      marginHorizontal: 8,
                      paddingVertical: 0,
                      ...(Platform.OS === 'web' ? { outline: 'none' } : {}),
                    }}
                    placeholder="••••••••"
                    placeholderTextColor="#71717A"
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                  />

                  <View pointerEvents="none">
                    <Lock color="#D4AF37" size={18} />
                  </View>
                </View>

                {/* Forgot Password Link */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword', { phone: normalizePhone(phone) })}
                  style={{ alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4 }}
                >
                  <Text style={{ color: '#D4AF37', fontSize: 12, fontWeight: '700' }}>
                    نسيت كلمة المرور؟
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <View style={{ width: '100%', gap: spacing.md }}>
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.9}
                style={{
                  backgroundColor: '#D4AF37',
                  height: 54,
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
                  paddingVertical: 12,
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
