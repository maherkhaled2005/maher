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
import { UserPlus, ChevronDown, Sparkles, Shield, Phone, Mail, User, Info, Lock } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { normalizeRole } from '../../roles';
import { fetchApi } from '../../api/client';
import { colors, spacing, borderRadius } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';

const ALL_ROLES = [
  { id: 'manager', label: 'المدير العام', icon: '👔', ownerOnly: false },
  { id: 'customer_support', label: 'خدمة العملاء والدعم الفني', icon: '🎧', ownerOnly: false },
  { id: 'technician', label: 'فني صيانة معتمد (يتطلب سداد اشتراك 300 ج.م)', icon: '🔧', ownerOnly: false },
  { id: 'merchant', label: 'تاجر ومورد قطع غيار (يتطلب سداد اشتراك 100 ج.م)', icon: '🏪', ownerOnly: false },
  { id: 'customer', label: 'عميل', icon: '👤', ownerOnly: false },
];

export default function AdminAddUserScreen({ navigation }: any) {
  const { user: currentUser } = useAuthStore();
  const currentRole = normalizeRole(currentUser?.role || '');
  const isOwner = currentRole === 'owner';
  const isLeadProgrammer = (currentRole === 'programmer' || currentUser?.role === 'programmer') && 
    (currentUser?.developerRank === 'lead' || currentUser?.phone === '01064739664');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState('customer_support');
  const [showRoles, setShowRoles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Strictly check authorization: Only Lead Programmer and Owner
  if (!isOwner && !isLeadProgrammer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ color: '#EF4444', fontSize: 20, fontWeight: '900', marginBottom: 12, textAlign: 'center' }}>
          غير مصرح لك بإضافة مستخدمين ⛔
        </Text>
        <Text style={{ color: '#A1A1AA', fontSize: 14, textAlign: 'center', marginBottom: 20 }}>
          صلاحية إضافة المستخدمين مقتصرة حصرياً على المسؤول التقني (رئيس المبرمجين) والمالك.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: '#D4AF37', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: '#0A0A0A', fontWeight: 'bold' }}>رجوع</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const availableRoles = ALL_ROLES;
  const selectedRoleObj = ALL_ROLES.find((r) => r.id === role) || availableRoles[0];

  const handleSave = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const cleanEmail = email.trim();
    const cleanPassword = password.trim() || '123456';

    if (!cleanName) {
      Alert.alert('تنبيه', 'يرجى كتابة اسم العضو بالكامل');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 11) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف صحيح (11 رقماً)');
      return;
    }
    if (cleanPhone === '01064739664') {
      Alert.alert('تنبيه', 'رقم الهاتف 01064739664 مخصص حصرياً للمسؤول التقني وقائد المبرمجين ولا يمكن تكراره.');
      return;
    }

    setIsLoading(true);
    try {
      await fetchApi('/admin/users', {
        method: 'POST',
        data: {
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail || undefined,
          role,
          password: cleanPassword,
        },
      });

      const isProRole = role === 'technician' || role === 'merchant';
      const extraNotice = isProRole 
        ? '\n\n⚠️ تنبيه مهم: الحساب سيبقى قيد الانتظار ولن يتم تفعيل صلاحياته إلا بعد قيام العضو بسداد رسوم الاشتراك وتأكيد الإيصال.' 
        : '';

      Alert.alert(
        '✅ تم إضافة العضو بنجاح',
        `تم تسجيل الحساب برتبة "${selectedRoleObj.label}". كلمة المرور الأولية المحددة هي (${cleanPassword}). سيتوجب على العضو تغيير كلمة المرور عند تسجيل الدخول لأول مرة.${extraNotice}`,
        [{ text: 'تم', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل إضافة العضو، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: '#0A0A0A' },
        
      ]}
    >
      {/* ☰ Owner Header with Drawer navigation & back button */}
      <OwnerHeader
        title="إضافة عضو جديد"
        subtitle="لوحة الإدارة المعتمدة"
        navigation={navigation}
        currentScreen="AdminUsers"
        showBack
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              backgroundColor: '#141416',
              borderRadius: 20,
              padding: 20,
              borderWidth: 1,
              borderColor: '#27272A',
              maxWidth: 480,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            {/* Info Notice */}
            <View
              style={{
                backgroundColor: '#1C1917',
                borderWidth: 1,
                borderColor: '#D4AF3733',
                borderRadius: 12,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20,
              }}
            >
              <Info size={20} color="#D4AF37" />
              <Text style={{ color: '#E4E4E7', fontSize: 12, lineHeight: 18, flex: 1, textAlign: 'right' }}>
                كلمة المرور الافتراضية للحسابات المضافة هي (123456) ويمكن للعضو استخدام رقم هاتفه ودخول الحساب فوراً.
              </Text>
            </View>

            {/* Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#E4E4E7', fontWeight: '800', textAlign: 'right', marginBottom: 6, fontSize: 13 }}>
                الاسم الكامل <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="مثال: المهندس محمد أحمد"
                  placeholderTextColor="#71717A"
                  value={name}
                  onChangeText={setName}
                />
                <User color="#D4AF37" size={18} />
              </View>
            </View>

            {/* Phone */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#E4E4E7', fontWeight: '800', textAlign: 'right', marginBottom: 6, fontSize: 13 }}>
                رقم الهاتف (أساسي للتسجيل والتفعيل) <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="01xxxxxxxxx"
                  placeholderTextColor="#71717A"
                  keyboardType="numeric"
                  value={phone}
                  onChangeText={setPhone}
                />
                <Phone color="#D4AF37" size={18} />
              </View>
            </View>

            {/* Email (Optional) */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#E4E4E7', fontWeight: '800', textAlign: 'right', marginBottom: 6, fontSize: 13 }}>
                البريد الإلكتروني <Text style={{ color: '#71717A', fontSize: 11 }}>(اختياري)</Text>
              </Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  placeholderTextColor="#71717A"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <Mail color="#71717A" size={18} />
              </View>
            </View>

            {/* Initial Password */}
            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ color: '#E4E4E7', fontWeight: '800', textAlign: 'right', fontSize: 13 }}>
                  كلمة المرور الأولية للحساب <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: '700' }}>
                  (سيتوجب عليه تغييرها)
                </Text>
              </View>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  placeholder="مثال: 123456"
                  placeholderTextColor="#71717A"
                  value={password}
                  onChangeText={setPassword}
                />
                <Lock color="#D4AF37" size={18} />
              </View>
              <Text style={{ color: '#A1A1AA', fontSize: 11, textAlign: 'right', marginTop: 4 }}>
                💡 يمكنك كتابة أي كلمة مرور أولية من اختيارك، وسيقوم النظام بإجبار المستخدم على تغييرها فور تسجيل دخوله.
              </Text>
            </View>

            {/* Role Dropdown */}
            <View style={{ marginBottom: 26 }}>
              <Text style={{ color: '#E4E4E7', fontWeight: '800', textAlign: 'right', marginBottom: 6, fontSize: 13 }}>
                تعيين الرتبة / الدور (Role)
              </Text>
              <TouchableOpacity
                onPress={() => setShowRoles(!showRoles)}
                style={{
                  backgroundColor: '#18181B',
                  borderWidth: 1,
                  borderColor: '#27272A',
                  borderRadius: 14,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <ChevronDown color="#71717A" size={20} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                    {selectedRoleObj?.label}
                  </Text>
                  <Text style={{ fontSize: 18 }}>{selectedRoleObj?.icon}</Text>
                </View>
              </TouchableOpacity>

              {showRoles && (
                <View
                  style={{
                    backgroundColor: '#18181B',
                    borderWidth: 1,
                    borderColor: '#3F3F46',
                    borderRadius: 14,
                    marginTop: 6,
                    padding: 6,
                  }}
                >
                  {availableRoles.map((r) => (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => {
                        setRole(r.id);
                        setShowRoles(false);
                      }}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        backgroundColor: role === r.id ? '#D4AF3722' : 'transparent',
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: role === r.id ? '#D4AF37' : '#E4E4E7',
                          fontWeight: role === r.id ? '900' : '600',
                          fontSize: 14,
                        }}
                      >
                        {r.label}
                      </Text>
                      <Text style={{ fontSize: 16 }}>{r.icon}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              style={{
                backgroundColor: '#D4AF37',
                borderRadius: 16,
                height: 54,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                shadowColor: '#D4AF37',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <>
                  <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 16 }}>
                    حفظ واعتماد العضو
                  </Text>
                  <UserPlus color="#0A0A0A" size={20} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  input: {
    flex: 1,
    textAlign: 'right' as const,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
};
