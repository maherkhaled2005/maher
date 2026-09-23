import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MapPin, ChevronRight, Save, Plus, Check } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { fetchApi } from '../../api/client';
import { colors, spacing, borderRadius } from '../../theme';
import { EGYPTIAN_GOVERNORATES } from '../../constants/egypt';

const EGYPT_GOVERNORATES = EGYPTIAN_GOVERNORATES;

export default function AddressesScreen({ navigation }: any) {
  const { user, updateUser } = useAuthStore();
  const [governorate, setGovernorate] = useState(user?.governorate || 'القاهرة');
  const [city, setCity] = useState(user?.city || '');
  const [area, setArea] = useState(user?.area || '');
  const [address, setAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!address.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال تفاصيل العنوان (الشارع، رقم المبنى)');
      return;
    }
    setLoading(true);
    try {
      const payload = { governorate, city, area, address };
      const res = await fetchApi('/auth/profile', {
        method: 'PUT',
        data: payload,
      });
      if (res?.user) {
        updateUser(res.user);
      } else if (user) {
        updateUser({ ...user, ...payload });
      }
      Alert.alert('تم الحفظ ✅', 'تم تحديث بيانات العنوان بنجاح');
    } catch (err: any) {
      if (user) {
        updateUser({ ...user, governorate, city, area, address });
      }
      Alert.alert('تم الحفظ ✅', 'تم حفظ العنوان محلياً بنجاح');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.xl,
          }}
        >
          <View style={{ width: 42 }} />
          <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900' }}>
            عناوين التوصيل والخدمة
          </Text>
          <TouchableOpacity
            onPress={() => (navigation?.canGoBack?.() ? navigation.goBack() : navigation.navigate('Profile'))}
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: '#18181B',
              borderWidth: 1,
              borderColor: '#27272A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronRight color="#D4AF37" size={22} />
          </TouchableOpacity>
        </View>

        {/* Current Address Card */}
        <View
          style={{
            backgroundColor: '#18181B',
            borderRadius: borderRadius.lg,
            borderWidth: 1.5,
            borderColor: '#D4AF37',
            padding: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <MapPin size={22} color="#D4AF37" />
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>
              العنوان الأساسي الحالي
            </Text>
          </View>
          <Text style={{ color: '#A1A1AA', fontSize: 14, textAlign: 'right', lineHeight: 22 }}>
            {address ? `${governorate} - ${city || ''} ${area || ''} - ${address}` : 'لم يتم تحديد عنوان بعد'}
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: spacing.md, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
          {/* Governorate Selection */}
          <View>
            <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 8 }}>
              المحافظة *
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexDirection: 'row-reverse' }}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {EGYPT_GOVERNORATES.map((gov) => {
                const isSelected = governorate === gov;
                return (
                  <TouchableOpacity
                    key={gov}
                    onPress={() => setGovernorate(gov)}
                    style={{
                      backgroundColor: isSelected ? '#D4AF37' : '#18181B',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: borderRadius.md,
                      borderWidth: 1,
                      borderColor: isSelected ? '#D4AF37' : '#27272A',
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#0A0A0A' : '#E4E4E7',
                        fontWeight: isSelected ? '900' : '600',
                        fontSize: 13,
                      }}
                    >
                      {gov}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* City */}
          <View>
            <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
              المدينة / المركز
            </Text>
            <TextInput
              style={{
                backgroundColor: '#18181B',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#27272A',
                color: '#FFFFFF',
                paddingHorizontal: 14,
                height: 50,
                textAlign: 'right',
                fontSize: 14,
              }}
              placeholder="مثال: مدينة نصر، المعادي، الشيخ زايد"
              placeholderTextColor="#71717A"
              value={city}
              onChangeText={setCity}
            />
          </View>

          {/* Area */}
          <View>
            <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
              الحي / المنطقة
            </Text>
            <TextInput
              style={{
                backgroundColor: '#18181B',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#27272A',
                color: '#FFFFFF',
                paddingHorizontal: 14,
                height: 50,
                textAlign: 'right',
                fontSize: 14,
              }}
              placeholder="مثال: الحي السابع، المجاورة الأولى"
              placeholderTextColor="#71717A"
              value={area}
              onChangeText={setArea}
            />
          </View>

          {/* Detailed Street Address */}
          <View>
            <Text style={{ color: '#E4E4E7', fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 6 }}>
              العنوان التفصيلي (الشارع، العمارة، الشقة) *
            </Text>
            <TextInput
              style={{
                backgroundColor: '#18181B',
                borderRadius: borderRadius.md,
                borderWidth: 1,
                borderColor: '#27272A',
                color: '#FFFFFF',
                paddingHorizontal: 14,
                paddingVertical: 10,
                height: 80,
                textAlign: 'right',
                fontSize: 14,
                textAlignVertical: 'top',
              }}
              placeholder="مثال: 15 شارع النزهة، الدور 3، شقة 6"
              placeholderTextColor="#71717A"
              multiline
              value={address}
              onChangeText={setAddress}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.9}
            style={{
              height: 54,
              backgroundColor: '#D4AF37',
              borderRadius: borderRadius.lg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: spacing.md,
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0A" />
            ) : (
              <>
                <Save size={18} color="#0A0A0A" />
                <Text style={{ color: '#0A0A0A', fontSize: 16, fontWeight: '900' }}>
                  حفظ العنوان
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
