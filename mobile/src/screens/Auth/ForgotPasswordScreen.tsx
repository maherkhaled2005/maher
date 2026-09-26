import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { KeyRound, ChevronRight, Phone, Lock, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
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

function maskPhone(p: string): string {
  if (!p) return '';
  if (p.includes('*')) return p;
  const digits = normalizePhone(p);
  if (digits.length >= 11) {
    return digits.substring(0, 3) + '******' + digits.substring(digits.length - 2);
  }
  return p;
}

export default function ForgotPasswordScreen({ navigation, route }: any) {
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [phone, setPhone] = useState(route?.params?.phone || '');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);

  const intervalRef = useRef<any>(null);
  const inputRefs = useRef<any[]>([]);

  const { forgotPassword, resetPassword } = useAuthStore();

  useEffect(() => {
    if (route?.params?.phone) {
      setPhone(route.params.phone);
    }
  }, [route?.params]);

  // Cooldown countdown timer
  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      intervalRef.current = setInterval(() => setTimer((t) => t - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [step, timer]);

  const handleRequestResetOTP = async () => {
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 01)');
      return;
    }
    setIsLoading(true);
    try {
      await forgotPassword(cleanPhone);
      setStep('otp');
      setTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إرسال رمز الاستعادة، يرجى التأكد من رقم الهاتف');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendResetOTP = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    try {
      const cleanPhone = normalizePhone(phone);
      await forgotPassword(cleanPhone);
      setTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      Alert.alert('تم الإرسال 📱', 'تم إرسال رمز تحقق جديد إلى هاتفك عبر رسالة SMS');
    } catch (e: any) {
      Alert.alert('تنبيه', e.message || 'تعذر إعادة إرسال الرمز، يرجى المحاولة بعد قليل');
    } finally {
      setIsResending(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      const next = [...otpDigits];
      const chars = digitsOnly.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        next[i] = chars[i] || '';
      }
      setOtpDigits(next);
      const lastIndex = Math.min(chars.length, 5);
      inputRefs.current[lastIndex]?.focus();
      if (chars.length === 6) {
        setStep('password');
      }
      return;
    }

    const cleaned = digitsOnly.slice(-1);
    const next = [...otpDigits];
    next[index] = cleaned;
    setOtpDigits(next);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (cleaned && index === 5) {
      const code = next.join('');
      if (code.length === 6) {
        setStep('password');
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResetPassword = async () => {
    const code = otpDigits.join('').trim();
    if (code.length < 6) {
      Alert.alert('تنبيه', 'رمز التحقق غير مكتمل');
      setStep('otp');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('تنبيه', 'كلمة المرور الجديدة يجب أن لا تقل عن 6 أحرف أو أرقام');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('تنبيه', 'كلمة المرور وتأكيدها غير متطابقين');
      return;
    }
    setIsLoading(true);
    try {
      const cleanPhone = normalizePhone(phone);
      const res = await resetPassword(cleanPhone, code, newPassword);
      Alert.alert(
        'تم بنجاح ✅',
        res?.message || 'تم تعيين كلمة المرور الجديدة بنجاح. يمكنك الآن تسجيل الدخول.',
        [
          {
            text: 'تسجيل الدخول',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل في إعادة تعيين كلمة المرور');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#0A0A0A',
        height: '100%',
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            padding: spacing.xl,
            paddingBottom: 120,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (step === 'password') {
                setStep('otp');
              } else if (step === 'otp') {
                setStep('phone');
              } else if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Login');
              }
            }}
            style={{
              position: 'absolute',
              top: Platform.OS === 'ios' ? 10 : 20,
              right: 20,
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: '#18181B',
              borderWidth: 1,
              borderColor: '#27272A',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <ChevronRight color="#D4AF37" size={22} />
          </TouchableOpacity>

          <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center' }}>
            {/* Header Icon & Title */}
            <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 22,
                  backgroundColor: '#141414',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.md,
                  borderWidth: 1.5,
                  borderColor: '#D4AF37',
                  shadowColor: '#D4AF37',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <KeyRound color="#D4AF37" size={32} />
              </View>

              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '900',
                  color: '#FFFFFF',
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                استعادة كلمة المرور
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#A1A1AA',
                  textAlign: 'center',
                  lineHeight: 20,
                }}
              >
                {step === 'phone' && 'أدخل رقم هاتفك المسجل لاستلام رمز التحقق (OTP)'}
                {step === 'otp' && `تم إرسال رمز التحقق إلى ${maskPhone(phone)}`}
                {step === 'password' && 'أدخل كلمة المرور الجديدة وتأكيدها لإتمام الاستعادة'}
              </Text>
            </View>

            {/* STEP 1: PHONE */}
            {step === 'phone' && (
              <View style={{ gap: spacing.lg }}>
                <View>
                  <Text
                    style={{
                      color: '#E4E4E7',
                      fontSize: 13,
                      fontWeight: '700',
                      textAlign: 'right',
                      marginBottom: 8,
                    }}
                  >
                    رقم الهاتف المسجل *
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#18181B',
                      borderRadius: borderRadius.lg,
                      borderWidth: 1.5,
                      borderColor: '#27272A',
                      paddingHorizontal: spacing.md,
                      height: 56,
                    }}
                  >
                    <TextInput
                      style={{
                        flex: 1,
                        textAlign: 'right',
                        color: '#FFFFFF',
                        fontSize: 16,
                        fontWeight: '600',
                      }}
                      placeholder="01xxxxxxxxx"
                      placeholderTextColor="#71717A"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={11}
                      autoFocus
                    />
                    <Phone color="#D4AF37" size={20} style={{ marginLeft: 8 }} />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleRequestResetOTP}
                  disabled={isLoading || normalizePhone(phone).length !== 11}
                  activeOpacity={0.9}
                  style={{
                    height: 56,
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor:
                      normalizePhone(phone).length === 11 ? '#D4AF37' : '#27272A',
                    shadowColor: '#D4AF37',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: normalizePhone(phone).length === 11 ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#0A0A0A" />
                  ) : (
                    <Text
                      style={{
                        color: normalizePhone(phone).length === 11 ? '#0A0A0A' : '#71717A',
                        fontSize: 16,
                        fontWeight: '900',
                      }}
                    >
                      إرسال رمز الاستعادة
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: OTP */}
            {step === 'otp' && (
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing.xl,
                    direction: 'ltr',
                  }}
                >
                  {otpDigits.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={{
                        width: 48,
                        height: 58,
                        borderRadius: borderRadius.md,
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: '900',
                        color: '#FFFFFF',
                        backgroundColor: '#18181B',
                        borderWidth: 1.5,
                        borderColor: digit ? '#D4AF37' : '#27272A',
                      }}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={6}
                      selectTextOnFocus
                      autoFocus={index === 0}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    if (otpDigits.join('').trim().length === 6) {
                      setStep('password');
                    } else {
                      Alert.alert('تنبيه', 'يرجى إدخال رمز التحقق المكون من 6 أرقام');
                    }
                  }}
                  activeOpacity={0.9}
                  style={{
                    height: 56,
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.lg,
                    backgroundColor:
                      otpDigits.join('').trim().length === 6 ? '#D4AF37' : '#27272A',
                  }}
                >
                  <Text
                    style={{
                      color:
                        otpDigits.join('').trim().length === 6 ? '#0A0A0A' : '#71717A',
                      fontSize: 16,
                      fontWeight: '900',
                    }}
                  >
                    متابعة تعيين كلمة المرور
                  </Text>
                </TouchableOpacity>

                {/* Resend OTP */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: spacing.md,
                  }}
                >
                  {timer > 0 ? (
                    <Text style={{ color: '#71717A', fontSize: 13 }}>
                      إعادة الإرسال بعد{' '}
                      <Text style={{ color: '#D4AF37', fontWeight: '800' }}>{timer}</Text> ثانية
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendResetOTP}
                      disabled={isResending}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 6 }}
                    >
                      {isResending ? (
                        <ActivityIndicator size="small" color="#D4AF37" />
                      ) : (
                        <>
                          <RefreshCw color="#D4AF37" size={16} />
                          <Text style={{ color: '#D4AF37', fontWeight: '800', fontSize: 14 }}>
                            إعادة إرسال رمز التحقق
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* STEP 3: NEW PASSWORD */}
            {step === 'password' && (
              <View style={{ gap: spacing.md }}>
                {/* New Password */}
                <View>
                  <Text
                    style={{
                      color: '#E4E4E7',
                      fontSize: 13,
                      fontWeight: '700',
                      textAlign: 'right',
                      marginBottom: 8,
                    }}
                  >
                    كلمة المرور الجديدة *
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#18181B',
                      borderRadius: borderRadius.lg,
                      borderWidth: 1.5,
                      borderColor: '#27272A',
                      paddingHorizontal: spacing.md,
                      height: 54,
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
                      value={newPassword}
                      onChangeText={setNewPassword}
                      autoFocus
                    />
                    <Lock color="#D4AF37" size={18} />
                  </View>
                </View>

                {/* Confirm Password */}
                <View>
                  <Text
                    style={{
                      color: '#E4E4E7',
                      fontSize: 13,
                      fontWeight: '700',
                      textAlign: 'right',
                      marginBottom: 8,
                    }}
                  >
                    تأكيد كلمة المرور الجديدة *
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#18181B',
                      borderRadius: borderRadius.lg,
                      borderWidth: 1.5,
                      borderColor: '#27272A',
                      paddingHorizontal: spacing.md,
                      height: 54,
                    }}
                  >
                    <TextInput
                      style={{
                        flex: 1,
                        textAlign: 'right',
                        color: '#FFFFFF',
                        fontSize: 15,
                        fontWeight: '600',
                        marginRight: 8,
                      }}
                      placeholder="••••••••"
                      placeholderTextColor="#71717A"
                      secureTextEntry={!showPass}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <Lock color="#D4AF37" size={18} />
                  </View>
                </View>

                {/* Save New Password Button */}
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={isLoading || !newPassword || newPassword !== confirmPassword}
                  activeOpacity={0.9}
                  style={{
                    height: 56,
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: spacing.sm,
                    backgroundColor:
                      newPassword && newPassword === confirmPassword ? '#D4AF37' : '#27272A',
                    shadowColor: '#D4AF37',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: newPassword && newPassword === confirmPassword ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#0A0A0A" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={18} color={newPassword && newPassword === confirmPassword ? '#0A0A0A' : '#71717A'} />
                      <Text
                        style={{
                          color:
                            newPassword && newPassword === confirmPassword ? '#0A0A0A' : '#71717A',
                          fontSize: 16,
                          fontWeight: '900',
                        }}
                      >
                        حفظ كلمة المرور الجديدة
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Back to Login link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={{ alignItems: 'center', marginTop: spacing.xl, paddingVertical: spacing.sm }}
            >
              <Text style={{ color: '#A1A1AA', fontSize: 13, fontWeight: '600' }}>
                تذكرت كلمة المرور؟ <Text style={{ color: '#D4AF37', fontWeight: '800' }}>تسجيل الدخول</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
