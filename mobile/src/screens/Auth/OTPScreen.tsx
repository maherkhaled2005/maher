import React, { useState, useRef, useEffect } from 'react';
import { fetchApi } from '../../api/client';
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
import { Phone, ChevronRight, RefreshCw, MessageSquare, Lock, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography, borderRadius } from '../../theme';

type Step = 'phone' | 'otp';

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

export default function OTPScreen({ navigation, route }: any) {
  const [step, setStep] = useState<Step>(route?.params?.step === 'otp' ? 'otp' : 'phone');
  const [phone, setPhone] = useState(route?.params?.phone || '');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(route?.params?.step === 'otp' ? 60 : 0);
  const [smsSent, setSmsSent] = useState(route?.params?.step === 'otp');
  const [currentDevOtp, setCurrentDevOtp] = useState<string | null>(
    route?.params?.devOtp ? String(route.params.devOtp) : null
  );
  const intervalRef = useRef<any>(null);
  const inputRefs = useRef<any[]>([]);

  const { loginWithOTP } = useAuthStore();

  const handleVerify = async (codeOverride?: string) => {
    const code = (codeOverride || otpDigits.join('')).trim();
    if (code.length < 6) {
      Alert.alert('تنبيه', 'يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }
    setIsLoading(true);
    try {
      const cleanPhone = normalizePhone(phone);
      await loginWithOTP(cleanPhone, code);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (route?.params?.phone) {
      setPhone(route.params.phone);
    }
    if (route?.params?.step === 'otp') {
      setStep('otp');
      setTimer(60);
      setSmsSent(true);
    }
    if (route?.params?.devOtp) {
      const code = String(route.params.devOtp);
      setCurrentDevOtp(code);
      Alert.alert(
        'رمز التحقق (SMS) 📱',
        `رمز التأكيد الخاص بك هو:\n\n${code}`,
        [
          {
            text: 'تعبئة الرمز تلقائياً ✓',
            onPress: () => {
              setOtpDigits(code.split(''));
              handleVerify(code);
            },
          },
          { text: 'إدخال يدوي', style: 'cancel' },
        ]
      );
    }
  }, [route?.params]);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      intervalRef.current = setInterval(() => setTimer((t) => t - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timer]);

  const handleSendOTP = async () => {
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف مصري صحيح');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetchApi('/auth/request-otp', { method: 'POST', data: { phone: cleanPhone } });
      setStep('otp');
      setTimer(60);
      setSmsSent(true);

      const code = res?.devOtp ? String(res.devOtp) : null;
      if (code) {
        setCurrentDevOtp(code);
        Alert.alert(
          'رمز التحقق (SMS) 📱',
          `رمز التأكيد الخاص بك هو:\n\n${code}`,
          [
            {
              text: 'تعبئة الرمز تلقائياً ✓',
              onPress: () => {
                setOtpDigits(code.split(''));
                handleVerify(code);
              },
            },
            { text: 'إدخال يدوي', style: 'cancel' },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('خطأ', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    setIsLoading(true);
    try {
      const cleanPhone = normalizePhone(phone);
      const res = await fetchApi('/auth/request-otp', { method: 'POST', data: { phone: cleanPhone } });
      const code = res?.devOtp ? String(res.devOtp) : null;
      if (code) {
        setCurrentDevOtp(code);
        Alert.alert(
          'رمز التحقق الجديد 📱',
          `رمز التأكيد الجديد هو:\n\n${code}`,
          [
            {
              text: 'تعبئة الرمز تلقائياً ✓',
              onPress: () => {
                setOtpDigits(code.split(''));
                handleVerify(code);
              },
            },
            { text: 'إدخال يدوي', style: 'cancel' },
          ]
        );
      }
    } catch (e: any) {
      Alert.alert('خطأ', 'فشل في إعادة إرسال الرمز');
    }
    setTimer(60);
    setOtpDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    setIsLoading(false);
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleaned = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = cleaned;
    setOtpDigits(next);

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (cleaned && index === 5) {
      const code = next.join('');
      if (code.length === 6) handleVerify(code);
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
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (step === 'otp') {
                setStep('phone');
                setOtpDigits(['', '', '', '', '', '']);
              } else if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else if (navigation?.navigate) {
                navigation.navigate('Login');
              }
            }}
            style={{ padding: spacing.lg, alignSelf: 'flex-start' }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <ChevronRight color={colors.white} size={22} />
            </View>
          </TouchableOpacity>

          <View style={{ paddingHorizontal: spacing.xl, flex: 1 }}>
            {/* PHONE STEP */}
            {step === 'phone' && (
              <>
                <View
                  style={{
                    width: 68,
                    height: 68,
                    backgroundColor: 'rgba(212,175,55,0.1)',
                    borderRadius: borderRadius.xl,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.lg,
                    alignSelf: 'flex-end',
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                  }}
                >
                  <Phone color={colors.primary} size={32} />
                </View>

                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '900',
                    color: colors.white,
                    textAlign: 'right',
                    marginBottom: spacing.xs,
                  }}
                >
                  تسجيل الدخول بالهاتف
                </Text>
                <Text
                  style={{
                    fontSize: typography.sizes.sm,
                    color: colors.gray,
                    textAlign: 'right',
                    marginBottom: spacing.xxl,
                    lineHeight: 22,
                  }}
                >
                  أدخل رقم هاتفك المسجل وسنرسل إليك رمز التحقق (OTP)
                </Text>

                {/* Phone Field */}
                <Text
                  style={{
                    color: colors.white,
                    fontWeight: '700',
                    fontSize: typography.sizes.sm,
                    textAlign: 'right',
                    marginBottom: spacing.xs,
                  }}
                >
                  رقم الهاتف *
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.lg,
                    borderWidth: 1.5,
                    borderColor: phone ? colors.primary : colors.border,
                    paddingHorizontal: spacing.md,
                    height: 58,
                    marginBottom: spacing.xl,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: 'rgba(212,175,55,0.2)',
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 4,
                      borderRadius: borderRadius.sm,
                      marginLeft: spacing.xs,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                      +20
                    </Text>
                  </View>
                  <TextInput
                    style={{
                      flex: 1,
                      textAlign: 'right',
                      color: colors.white,
                      fontSize: 17,
                      fontWeight: '600',
                      letterSpacing: 1,
                    }}
                    placeholder="01xxxxxxxxx"
                    placeholderTextColor={colors.gray}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={11}
                    autoFocus
                  />
                  <Phone color={colors.primary} size={20} />
                </View>

                {/* Send OTP Button */}
                <TouchableOpacity
                  onPress={handleSendOTP}
                  disabled={isLoading || phone.replace(/\D/g, '').length < 10}
                  style={{
                    height: 56,
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    backgroundColor:
                      phone.replace(/\D/g, '').length >= 10 ? colors.primary : colors.border,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.dark} />
                  ) : (
                    <>
                      <MessageSquare color={colors.dark} size={20} style={{ marginLeft: 8 }} />
                      <Text
                        style={{
                          color: colors.dark,
                          fontSize: 17,
                          fontWeight: '900',
                        }}
                      >
                        إرسال رمز التحقق
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* OTP STEP */}
            {step === 'otp' && (
              <>
                <View
                  style={{
                    width: 68,
                    height: 68,
                    backgroundColor: 'rgba(16,185,129,0.1)',
                    borderRadius: borderRadius.xl,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.lg,
                    alignSelf: 'flex-end',
                    borderWidth: 1.5,
                    borderColor: '#10B981',
                  }}
                >
                  <Lock color="#10B981" size={32} />
                </View>

                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: '900',
                    color: colors.white,
                    textAlign: 'right',
                    marginBottom: spacing.xs,
                  }}
                >
                  أدخل رمز التحقق
                </Text>

                {smsSent && (
                  <View
                    style={{
                      backgroundColor: 'rgba(16,185,129,0.1)',
                      borderRadius: borderRadius.md,
                      padding: spacing.md,
                      marginBottom: spacing.md,
                      borderWidth: 1,
                      borderColor: 'rgba(16,185,129,0.3)',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Text
                      style={{
                        color: '#10B981',
                        fontSize: 13,
                        fontWeight: '600',
                        textAlign: 'right',
                        flex: 1,
                      }}
                    >
                      ✅ تم إرسال رمز التحقق إلى هاتفك: {phone}
                    </Text>
                  </View>
                )}

                {currentDevOtp && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setOtpDigits(currentDevOtp.split(''));
                      handleVerify(currentDevOtp);
                    }}
                    style={{
                      backgroundColor: 'rgba(212, 175, 55, 0.12)',
                      borderRadius: borderRadius.lg,
                      padding: spacing.md,
                      marginBottom: spacing.md,
                      borderWidth: 1.5,
                      borderColor: '#D4AF37',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Sparkles size={16} color="#D4AF37" />
                      <Text style={{ color: '#D4AF37', fontSize: 13, fontWeight: '800' }}>
                        رمز التحقق الخاص بك (اضغط للتعبئة التلقائية)
                      </Text>
                    </View>
                    <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: 8, marginVertical: 4 }}>
                      {currentDevOtp}
                    </Text>
                    <Text style={{ color: '#A1A1AA', fontSize: 11 }}>
                      اضغط هنا لتعبئة الرمز والدخول إلى حسابك فوراً ✓
                    </Text>
                  </TouchableOpacity>
                )}

                <Text
                  style={{
                    fontSize: typography.sizes.sm,
                    color: colors.gray,
                    textAlign: 'right',
                    marginBottom: spacing.xxl,
                    lineHeight: 22,
                  }}
                >
                  أدخل الرمز المكون من 6 أرقام الذي تم إرساله إلى هاتفك
                </Text>

                {/* 6-Digit OTP Input */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 10,
                    marginBottom: spacing.xxl,
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
                        width: 50,
                        height: 60,
                        borderRadius: borderRadius.md,
                        textAlign: 'center',
                        fontSize: 24,
                        fontWeight: '900',
                        color: colors.white,
                        backgroundColor: '#18181B',
                        borderWidth: 2,
                        borderColor: digit ? '#D4AF37' : '#333336',
                      }}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                {currentDevOtp && (
                  <TouchableOpacity
                    onPress={() => {
                      const code = String(currentDevOtp);
                      setOtpDigits(code.split(''));
                      handleVerify(code);
                    }}
                    style={{
                      backgroundColor: 'rgba(212, 175, 55, 0.12)',
                      borderWidth: 1.5,
                      borderColor: '#D4AF37',
                      borderRadius: borderRadius.md,
                      paddingVertical: spacing.md,
                      paddingHorizontal: spacing.lg,
                      marginBottom: spacing.xl,
                      alignItems: 'center',
                      flexDirection: 'row-reverse',
                      justifyContent: 'center',
                      gap: 10,
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>
                      رمز التأكيد (SMS):
                    </Text>
                    <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 20, letterSpacing: 3 }}>
                      {currentDevOtp}
                    </Text>
                    <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 12 }}>
                      (اضغط للتعبئة التلقائية ⚡)
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Verify Button */}
                <TouchableOpacity
                  onPress={() => handleVerify()}
                  disabled={isLoading || otp.length < 6}
                  style={{
                    height: 56,
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.lg,
                    backgroundColor: otp.length === 6 ? colors.primary : colors.border,
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.dark} />
                  ) : (
                    <Text
                      style={{
                        color: otp.length === 6 ? colors.dark : colors.gray,
                        fontSize: 17,
                        fontWeight: '900',
                      }}
                    >
                      التحقق من الرمز ✓
                    </Text>
                  )}
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
                    <Text style={{ color: colors.gray, fontSize: 14 }}>
                      إعادة الإرسال بعد{' '}
                      <Text style={{ color: colors.primary, fontWeight: '800' }}>({timer})</Text>{' '}
                      ثانية
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleResendOTP}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 14 }}>
                        إعادة إرسال الرمز
                      </Text>
                      <RefreshCw color={colors.primary} size={16} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Change Phone */}
                <TouchableOpacity
                  onPress={() => {
                    setStep('phone');
                    setOtpDigits(['', '', '', '', '', '']);
                    setSmsSent(false);
                  }}
                  style={{ alignItems: 'center', paddingVertical: spacing.md }}
                >
                  <Text style={{ color: colors.gray, fontSize: 14, fontWeight: '600' }}>
                    📱 تغيير رقم الهاتف
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
