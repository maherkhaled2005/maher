import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Upload,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import { triggerSelectionHaptic, triggerSuccessHaptic } from '../../utils/haptics';

type AccountRole = 'customer' | 'technician' | 'merchant';

const ACCOUNT_TYPES = [
  {
    role: 'customer' as const,
    icon: '👤',
    label: 'عميل',
    badge: 'مجاني فوري',
    desc: 'لطلب خدمات الصيانة المعتمدة وشراء قطع الغيار الأصلية',
    color: '#3B82F6',
  },
  {
    role: 'technician' as const,
    icon: '🔧',
    label: 'فني صيانة معتمد',
    badge: 'اشتراك 300 ج.م',
    desc: 'لاستقبال طلبات الصيانة بالعمولة المباشرة وزيادة دخلك',
    color: '#D4AF37',
  },
  {
    role: 'merchant' as const,
    icon: '🏪',
    label: 'تاجر / مورد قطع غيار',
    badge: 'اشتراك 100 ج.م',
    desc: 'لعرض قطع الغيار في المتجر والبيع المباشر لآلاف العملاء',
    color: '#10B981',
  },
];

const TECH_SPECIALTIES = [
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

export default function RegisterScreen({ navigation }: any) {
  const [role, setRole] = useState<AccountRole>('customer');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Paywall & Verification State for Tech/Merchant
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [senderPhone, setSenderPhone] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const toggleSpecialty = (item: string) => {
    triggerSelectionHaptic();
    setErrors((prev) => ({ ...prev, specialties: '' }));
    if (selectedSpecialties.includes(item)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== item));
    } else {
      setSelectedSpecialties([...selectedSpecialties, item]);
    }
  };

  const handlePickReceipt = async () => {
    triggerSelectionHaptic();
    setErrors((prev) => ({ ...prev, receiptImage: '' }));
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        setReceiptImage(res.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('تنبيه', 'تعذر فتح معرض الصور');
    }
  };

  const handleRegister = async () => {
    triggerSelectionHaptic();
    const cleanName = name.trim();
    const cleanPhone = normalizePhone(phone);
    const cleanEmail = email.trim();
    const newErrors: Record<string, string> = {};

    if (!cleanName) {
      newErrors.name = 'يرجى إدخال الاسم بالكامل';
    }
    if (!cleanPhone || cleanPhone.length !== 11 || !cleanPhone.startsWith('01')) {
      newErrors.phone = 'يرجى إدخال رقم هاتف مصري صحيح (11 رقماً يبدأ بـ 01)';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن لا تقل عن 6 أحرف أو أرقام';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'كلمة المرور وتأكيدها غير متطابقين';
    }

    if (role === 'technician') {
      if (selectedSpecialties.length === 0) {
        newErrors.specialties = 'يرجى تحديد تخصص صيانة أجهزة منزلية واحد على الأقل';
      }
      if (!senderPhone.trim()) {
        newErrors.senderPhone = 'يرجى إدخال رقم المحفظة المحول منها رسوم الاشتراك (300 ج.م)';
      }
      if (!receiptImage) {
        newErrors.receiptImage = 'يرجى إرفاق صورة إيصال التحويل للمتابعة والاعتماد';
      }
    }

    if (role === 'merchant') {
      if (!senderPhone.trim()) {
        newErrors.senderPhone = 'يرجى إدخال رقم المحفظة المحول منها رسوم الاشتراك (100 ج.م)';
      }
      if (!receiptImage) {
        newErrors.receiptImage = 'يرجى إرفاق صورة إيصال التحويل للمتابعة والاعتماد';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    setIsLoading(true);
    try {
      const payload: any = {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail || undefined,
        password,
        role,
      };

      if (role === 'technician' || role === 'merchant') {
        payload.transferReceipt = receiptImage;
        payload.senderPhone = senderPhone.trim();
        if (role === 'technician') {
          payload.specialties = selectedSpecialties;
        }
      }

      const res = await fetchApi('/auth/register', { method: 'POST', data: payload });

      if (res.success || res.token) {
        triggerSuccessHaptic();
        if (role === 'customer') {
          Alert.alert(
            'تم إنشاء الحساب بنجاح 📱',
            'تم إرسال رمز التحقق إلى هاتفك عبر رسالة SMS. أدخل رمز التأكيد لتفعيل حسابك.',
            [
              {
                text: 'إدخال رمز التحقق',
                onPress: () =>
                  navigation.navigate('OTP', { phone: cleanPhone, flow: 'register' }),
              },
            ]
          );
        } else {
          Alert.alert(
            'تم استلام طلبك بنجاح ✅',
            'تم تسجيل بياناتك وإرسال رمز التحقق لهاتفك. يرجى تأكيد رقم هاتفك أولاً، ثم سيقوم فريق الإدارة بمراجعة الحساب والاعتماد.',
            [
              {
                text: 'تأكيد رقم الهاتف',
                onPress: () =>
                  navigation.navigate('OTP', { phone: cleanPhone, flow: 'register' }),
              },
            ]
          );
        }
      } else {
        throw new Error(res.error || 'تعذر إنشاء الحساب');
      }
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: '#0A0A0A', height: Platform.OS === 'web' ? ('100vh' as any) : '100%' }
      ]}
    >
        <ScrollView
          style={[{ flex: 1 }, Platform.OS === 'web' && { overflowY: 'auto' } as any]}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 150, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Clean Header */}
          <View style={{ alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.xs }}>
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 }}>
              إنشاء حساب جديد
            </Text>
            <Text style={{ color: '#A1A1AA', fontSize: 12, marginTop: 4 }}>
              انضم إلى منصة TecnoRexa
            </Text>
          </View>

          {/* Role Selection - Compact Horizontal Segmented Bar */}
          <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', marginBottom: spacing.md }}>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: '#141416',
                borderRadius: 14,
                padding: 4,
                borderWidth: 1,
                borderColor: '#27272A',
                gap: 4,
              }}
            >
              {ACCOUNT_TYPES.map((t) => {
                const isSelected = role === t.role;
                return (
                  <TouchableOpacity
                    key={t.role}
                    activeOpacity={0.8}
                    onPress={() => {
                      triggerSelectionHaptic();
                      setRole(t.role);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: isSelected ? '#D4AF37' : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{t.icon}</Text>
                    <Text
                      style={{
                        color: isSelected ? '#0A0A0A' : '#D4D4D8',
                        fontWeight: '800',
                        fontSize: 12,
                      }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Role Helper Badge */}
            {role !== 'customer' && (
              <View
                style={{
                  marginTop: 8,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  backgroundColor: '#1C1917',
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(212, 175, 55, 0.3)',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: '700' }}>
                  {role === 'technician'
                    ? '🔧 فني صيانة معتمد — رسوم اشتراك وتفعيل 300 ج.م'
                    : '🏪 تاجر قطع غيار — رسوم اشتراك وتفعيل 100 ج.م'}
                </Text>
              </View>
            )}
          </View>

          {/* Form Fields */}
          <View style={{ gap: spacing.md, width: '100%', maxWidth: 440, alignSelf: 'center', marginBottom: spacing.lg }}>
            {/* Full Name (Mandatory) */}
            <View>
              <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                الاسم بالكامل <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={[styles.inputWrap, errors.name && { borderColor: '#EF4444' }]}>
                <TextInput
                  style={styles.input}
                  placeholder="مثال: أحمد محمد علي"
                  placeholderTextColor="#71717A"
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                />
                <User color="#D4AF37" size={18} />
              </View>
              {errors.name ? <Text style={{ color: '#EF4444', fontSize: 11, textAlign: 'right', marginTop: 4 }}>{errors.name}</Text> : null}
            </View>

            {/* Phone Number (Mandatory) */}
            <View>
              <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                رقم الهاتف (أساسي للدخول والتفعيل) <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={[styles.inputWrap, errors.phone && { borderColor: '#EF4444' }]}>
                <TextInput
                  style={styles.input}
                  placeholder="01xxxxxxxxx"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                  value={phone}
                  onChangeText={(val) => {
                    setPhone(val);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                  }}
                />
                <Phone color="#D4AF37" size={18} />
              </View>
              {errors.phone ? <Text style={{ color: '#EF4444', fontSize: 11, textAlign: 'right', marginTop: 4 }}>{errors.phone}</Text> : null}
            </View>

            {/* Email (Optional) */}
            <View>
              <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                البريد الإلكتروني <Text style={{ color: '#71717A', fontSize: 11 }}>(اختياري)</Text>
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#71717A"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <Mail color="#71717A" size={18} />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                كلمة المرور <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={[styles.inputWrap, errors.password && { borderColor: '#EF4444' }]}>
                <TouchableOpacity onPress={() => {
                triggerSelectionHaptic();
                setShowPass(!showPass);
              }}>
                  {showPass ? <EyeOff color="#71717A" size={18} /> : <Eye color="#71717A" size={18} />}
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { marginHorizontal: 8 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#71717A"
                  secureTextEntry={!showPass}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                  }}
                />
                <Lock color="#D4AF37" size={18} />
              </View>
              {errors.password ? <Text style={{ color: '#EF4444', fontSize: 11, textAlign: 'right', marginTop: 4 }}>{errors.password}</Text> : null}
            </View>

            {/* Confirm Password */}
            <View>
              <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
                تأكيد كلمة المرور <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={[styles.inputWrap, errors.confirmPassword && { borderColor: '#EF4444' }]}>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#71717A"
                  secureTextEntry={!showPass}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                />
                <Lock color="#D4AF37" size={18} />
              </View>
              {errors.confirmPassword ? <Text style={{ color: '#EF4444', fontSize: 11, textAlign: 'right', marginTop: 4 }}>{errors.confirmPassword}</Text> : null}
            </View>
          </View>

          {/* Technician Specialties Selection */}
          {role === 'technician' && (
            <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', marginBottom: spacing.lg }}>
              <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 8 }}>
                تخصصات الصيانة التي تتقنها <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                {TECH_SPECIALTIES.map((spec) => {
                  const isChecked = selectedSpecialties.includes(spec);
                  return (
                    <TouchableOpacity
                      key={spec}
                      onPress={() => toggleSpecialty(spec)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isChecked ? '#D4AF37' : '#18181B',
                        borderWidth: 1,
                        borderColor: isChecked ? '#D4AF37' : '#27272A',
                      }}
                    >
                      <Text
                        style={{
                          color: isChecked ? '#0A0A0A' : '#A1A1AA',
                          fontSize: 12,
                          fontWeight: '700',
                        }}
                      >
                        {spec}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.specialties ? <Text style={{ color: '#EF4444', fontSize: 11, textAlign: 'right', marginTop: 6 }}>{errors.specialties}</Text> : null}
            </View>
          )}

          {/* Paywall & Verification for Tech (300 EGP) and Merchant (100 EGP) */}
          {(role === 'technician' || role === 'merchant') && (
            <View
              style={{
                width: '100%',
                maxWidth: 440,
                alignSelf: 'center',
                backgroundColor: '#18181B',
                borderWidth: 1.5,
                borderColor: '#D4AF37',
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                marginBottom: spacing.xl,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 8 }}>
                <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 15 }}>
                  {role === 'technician' ? 'رسوم اعتماد الفني (300 ج.م)' : 'رسوم توثيق التاجر (100 ج.م)'}
                </Text>
                <Sparkles size={16} color="#D4AF37" />
              </View>

              <Text style={{ color: '#E4E4E7', fontSize: 12, lineHeight: 18, textAlign: 'right', marginBottom: 12 }}>
                يرجى تحويل رسوم الانضمام عبر إنستاباي أو فودافون كاش إلى حسابات المنصة المعتمدة:
              </Text>

              {/* Payment Methods Badges */}
              <View style={{ gap: 8, marginBottom: 14 }}>
                {/* InstaPay */}
                <View
                  style={{
                    backgroundColor: '#1E1B2E',
                    borderWidth: 1.5,
                    borderColor: '#8B5CF6',
                    borderRadius: 10,
                    padding: 10,
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>⚡</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#C4B5FD', fontSize: 11, fontWeight: '700' }}>حساب إنستاباي (InstaPay):</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900', userSelect: 'all' as any }}>
                        adelelgohry412@instapay
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#8B5CF6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>معتمد فوري</Text>
                  </View>
                </View>

                {/* Vodafone Cash */}
                <View
                  style={{
                    backgroundColor: '#2A1717',
                    borderWidth: 1.5,
                    borderColor: '#EF4444',
                    borderRadius: 10,
                    padding: 10,
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16 }}>📱</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: '#FCA5A5', fontSize: 11, fontWeight: '700' }}>محفظة فودافون كاش:</Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900', userSelect: 'all' as any }}>
                        01064739664
                      </Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>كاش</Text>
                  </View>
                </View>
              </View>

              {/* Sender Phone */}
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#A1A1AA', fontSize: 12, textAlign: 'right', marginBottom: 4 }}>
                  رقم المحفظة / الهاتف المحول منه <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: '#121214', borderWidth: 1, borderColor: errors.senderPhone ? '#EF4444' : '#27272A', borderRadius: 10, padding: 10 }]}
                  placeholder="01xxxxxxxxx"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                  value={senderPhone}
                  onChangeText={(val) => {
                    setSenderPhone(val);
                    if (errors.senderPhone) setErrors((prev) => ({ ...prev, senderPhone: '' }));
                  }}
                />
                {errors.senderPhone ? <Text style={{ color: '#EF4444', fontSize: 11, textAlign: 'right', marginTop: 4 }}>{errors.senderPhone}</Text> : null}
              </View>

              {/* Receipt Upload */}
              <TouchableOpacity
                onPress={handlePickReceipt}
                activeOpacity={0.8}
                style={{
                  backgroundColor: '#121214',
                  borderWidth: 1.5,
                  borderColor: errors.receiptImage ? '#EF4444' : (receiptImage ? '#10B981' : '#3F3F46'),
                  borderStyle: receiptImage ? 'solid' : 'dashed',
                  borderRadius: 12,
                  padding: spacing.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {receiptImage ? (
                  <View style={{ alignItems: 'center', gap: 8 }}>
                    <Image source={{ uri: receiptImage }} style={{ width: 120, height: 120, borderRadius: 8 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '800' }}>
                        تم إرفاق إيصال التحويل (اضغط للتغيير)
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: 'center', gap: 6 }}>
                    <Upload size={24} color="#D4AF37" />
                    <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
                      اضغط لرفع صورة إيصال التحويل
                    </Text>
                    <Text style={{ color: '#71717A', fontSize: 11 }}>
                      سكرين شوت من فودافون كاش أو إنستاباي
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {errors.receiptImage ? <Text style={{ color: '#EF4444', fontSize: 11, textAlign: 'right', marginTop: 4 }}>{errors.receiptImage}</Text> : null}
            </View>
          )}

          {/* Submit Button */}
          <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: spacing.md }}>
            <TouchableOpacity
              onPress={handleRegister}
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
                  {role === 'customer' ? 'إنشاء الحساب وتأكيد الهاتف 📱' : 'إرسال طلب الانضمام والإيصال 🛡️'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
              <TouchableOpacity onPress={() => {
                triggerSelectionHaptic();
                navigation.navigate('Login');
              }}>
                <Text style={{ color: '#D4AF37', fontWeight: '900', fontSize: 14 }}>
                  تسجيل الدخول
                </Text>
              </TouchableOpacity>
              <Text style={{ color: '#A1A1AA', fontSize: 14 }}>لديك حساب بالفعل؟</Text>
            </View>

            {/* Terms & Privacy Links */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <Text style={{ color: '#52525B', fontSize: 12 }}>•</Text>
              <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
                <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' }}>
                  سياسة الخصوصية
                </Text>
              </TouchableOpacity>
              <Text style={{ color: '#52525B', fontSize: 12 }}>•</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' }}>
                  الشروط والأحكام
                </Text>
              </TouchableOpacity>
              <Text style={{ color: '#52525B', fontSize: 12 }}>•</Text>
            </View>
            <Text style={{ color: '#52525B', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
              بالتسجيل أنت توافق على شروط الاستخدام وسياسة الخصوصية
            </Text>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  inputWrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: '#27272A',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 54,
    ...(Platform.OS === 'web' ? { cursor: 'text' } : {}),
  },
  input: {
    flex: 1,
    height: '100%' as const,
    textAlign: 'right' as const,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
    paddingVertical: 0,
    ...(Platform.OS === 'web' ? { outline: 'none' } : {}),
  },
};
