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
import { Phone, ChevronRight, RefreshCw, Lock, ShieldCheck } from 'lucide-react-native';
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

export default function OTPScreen({ navigation, route }: any) {
  const initialPhone = route?.params?.phone || '';
  const initialFlow = route?.params?.flow || (route?.params?.tempToken ? 'login' : 'register');
  const [step, setStep] = useState<'phone' | 'otp'>(
    initialPhone || route?.params?.tempToken ? 'otp' : 'phone'
  );
  const [phone, setPhone] = useState(initialPhone);
  const [tempToken, setTempToken] = useState(route?.params?.tempToken || '');
  const [flow, setFlow] = useState(initialFlow);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);

  const intervalRef = useRef<any>(null);
  const inputRefs = useRef<any[]>([]);

  const { loginWithOTP, verifyLoginOTP, resendOTP } = useAuthStore();

  useEffect(() => {
    if (route?.params?.phone) {
      setPhone(route.params.phone);
    }
    if (route?.params?.tempToken) {
      setTempToken(route.params.tempToken);
    }
    if (route?.params?.flow) {
      setFlow(route.params.flow);
    }
    if (route?.params?.phone || route?.params?.tempToken) {
      setStep('otp');
      setTimer(60);
    }
  }, [route?.params]);

  // 60-second Countdown Timer
  useEffect(() => {
    if (step === 'otp' && timer > 0) {
      intervalRef.current = setInterval(() => setTimer((t) => t - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [step, timer]);

  const handleVerify = async (codeOverride?: string) => {
    const code = (codeOverride || otpDigits.join('')).trim();
    if (code.length < 6) {
      Alert.alert('تنبيه', 'يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }
    setIsLoading(true);
    try {
      if (flow === 'login' && tempToken) {
        await verifyLoginOTP(tempToken, phone, code);
      } else {
        await loginWithOTP(normalizePhone(phone), code);
      }
    } catch (err: any) {
      Alert.alert('خطأ في التحقق', err.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTPFromPhoneInput = async () => {
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف مصري صحيح (11 رقماً)');
      return;
    }
    setIsLoading(true);
    try {
      const res = await resendOTP(undefined, cleanPhone);
      if (res?.tempToken) {
        setTempToken(res.tempToken);
      }
      setStep('otp');
      setTimer(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      Alert.alert('تنبيه', err.message || 'تعذر إرسال رمز التحقق');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0 || isResending) return;
    setIsResending(true);
    try {
      const cleanPhone = normalizePhone(phone);
      const res = await resendOTP(tempToken || undefined, cleanPhone);
      if (res?.tempToken) {
        setTempToken(res.tempToken);
      }
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
      // Pasted full code or multi digits
      const next = [...otpDigits];
      const chars = digitsOnly.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        next[i] = chars[i] || '';
      }
      setOtpDigits(next);
      const lastIndex = Math.min(chars.length, 5);
      inputRefs.current[lastIndex]?.focus();
      if (chars.length === 6) {
        handleVerify(chars.join(''));
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
        handleVerify(code);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otp = otpDigits.join('');

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
          style={[{ flex: 1 }, Platform.OS === 'web' && ({ overflowY: 'auto' } as any)]}
          contentContainerStyle={{
            flexGrow: 1,
            padding: spacing.xl,
            paddingTop: Platform.OS === 'web' ? 40 : spacing.xl,
            paddingBottom: 120,
            justifyContent: Platform.OS === 'web' ? 'flex-start' : 'center',
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (step === 'otp' && !tempToken) {
                setStep('phone');
                setOtpDigits(['', '', '', '', '', '']);
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
            {/* STEP: PHONE INPUT */}
            {step === 'phone' && (
              <>
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
                    <Phone color="#D4AF37" size={32} />
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
                    التحقق عبر الهاتف
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#A1A1AA',
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    أدخل رقم هاتفك المسجل وسنرسل رمز التحقق (OTP) في رسالة SMS
                  </Text>
                </View>

                {/* Phone Field */}
                <View style={{ marginBottom: spacing.xl }}>
                  <Text
                    style={{
                      color: '#E4E4E7',
                      fontWeight: '700',
                      fontSize: 13,
                      textAlign: 'right',
                      marginBottom: 8,
                    }}
                  >
                    رقم الهاتف *
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

                {/* Send OTP Button */}
                <TouchableOpacity
                  onPress={handleSendOTPFromPhoneInput}
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
                      إرسال رمز التحقق
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* STEP: OTP INPUT */}
            {step === 'otp' && (
              <>
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
                    <Lock color="#D4AF37" size={32} />
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
                    أدخل رمز التحقق (OTP)
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#A1A1AA',
                      textAlign: 'center',
                      lineHeight: 20,
                    }}
                  >
                    تم إرسال رمز التحقق المكون من 6 أرقام عبر SMS إلى
                  </Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '800',
                      color: '#D4AF37',
                      marginTop: 4,
                      letterSpacing: 1,
                    }}
                  >
                    {maskPhone(phone)}
                  </Text>

                  {/* Master Fallback OTP Banner */}
                  <TouchableOpacity
                    onPress={() => {
                      setOtpDigits(['1', '2', '3', '4', '5', '6']);
                      handleVerify('123456');
                    }}
                    style={{
                      marginTop: 12,
                      backgroundColor: 'rgba(212, 175, 55, 0.1)',
                      borderWidth: 1,
                      borderColor: '#D4AF37',
                      borderRadius: 12,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: '#D4AF37', fontSize: 12, fontWeight: 'bold' }}>
                      ⚡ للدخول السريع: اضغط هنا أو أدخل 123456
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* 6-Digit OTP Input Cells */}
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

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={() => handleVerify()}
                  disabled={isLoading || otp.length < 6}
                  activeOpacity={0.9}
                  style={{
                    height: 56,
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.lg,
                    backgroundColor: otp.length === 6 ? '#D4AF37' : '#27272A',
                    shadowColor: '#D4AF37',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: otp.length === 6 ? 0.3 : 0,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#0A0A0A" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ShieldCheck size={18} color={otp.length === 6 ? '#0A0A0A' : '#71717A'} />
                      <Text
                        style={{
                          color: otp.length === 6 ? '#0A0A0A' : '#71717A',
                          fontSize: 16,
                          fontWeight: '900',
                        }}
                      >
                        تأكيد والدخول
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Resend OTP Cooldown */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: spacing.lg,
                  }}
                >
                  {timer > 0 ? (
                    <Text style={{ color: '#71717A', fontSize: 13 }}>
                      يمكنك إعادة الإرسال بعد{' '}
                      <Text style={{ color: '#D4AF37', fontWeight: '800' }}>{timer}</Text> ثانية
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOTP}
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

                {/* Back to Login if not in registration flow */}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={{ alignItems: 'center', paddingVertical: spacing.sm }}
                >
                  <Text style={{ color: '#A1A1AA', fontSize: 13, fontWeight: '600' }}>
                    العودة لشاشة تسجيل الدخول
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
