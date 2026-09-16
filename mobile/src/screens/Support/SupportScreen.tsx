import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Alert, Platform, RefreshControl } from 'react-native';
import { ChevronDown, CheckCircle2, ArrowLeft, ChevronRight, Send } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';

import { fetchApi } from '../../api/client';
import { EGYPTIAN_GOVERNORATES } from '../../constants/egypt';

const DEVICES = [
  'غسالات ملابس وأطباق 🧺',
  'ثلاجات وديب فريزر 🧊',
  'بوتاجازات وأفران 🔥',
  'ميكروويف وأجهزة طهي ♨️',
  'تكييفات وتبريد ❄️',
];

const GOVERNORATES = EGYPTIAN_GOVERNORATES;

export default function SupportScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [device, setDevice] = useState<string>(DEVICES[0]);
  const [gov, setGov] = useState<string>(GOVERNORATES[0]);
  const [desc, setDesc] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeviceSelect, setShowDeviceSelect] = useState(false);
  const [showGovSelect, setShowGovSelect] = useState(false);

  const handleSubmit = async () => {
    if (!desc.trim() || !address.trim() || !phone.trim()) {
      Alert.alert('تنبيه', 'يرجى إكمال جميع الحقول المطلوبة (الوصف، الهاتف، العنوان)');
      return;
    }
    setSubmitting(true);
    try {
      await fetchApi('/support/tickets', {
        method: 'POST',
        data: {
          title: `طلب صيانة: ${device}`,
          subject: `صيانة ${device} - ${gov}`,
          category: device,
          description: `${desc.trim()}\n\n📍 العنوان: ${address.trim()} (${gov})`,
          customerPhone: phone.trim(),
          priority: 'medium',
        },
      });
      setSuccess(true);
      setTimeout(() => {
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
        } else if (navigation?.navigate) {
          navigation.navigate('Tickets');
        }
      }, 2000);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل إرسال طلب الدعم الفني، يرجى المحاولة لاحقاً');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role === 'technician') {
    return (
      <SafeAreaView
        style={[
          { flex: 1, backgroundColor: colors.dark, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' },
          
        ]}
      >
        <View
          style={{
            backgroundColor: colors.darkCard,
            padding: spacing.xl,
            borderRadius: borderRadius.xl,
            borderWidth: 1.5,
            borderColor: colors.primary,
            maxWidth: 480,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 44, marginBottom: spacing.md }}>🧑‍🔧</Text>
          <Text style={{ color: colors.white, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: spacing.sm }}>
            مرحباً بك يا بطل!
          </Text>
          <Text style={{ color: colors.gray, fontSize: 13, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl }}>
            بصفتك فنياً معتمداً في TecnoRexa، خدمة طلب الصيانة المنزلية مخصصة للعملاء. إذا كنت تواجه أي استفسار أو مشكلة تقنية، يرجى فتح تذكرة دعم فني وسيقوم فريق خدمة العملاء بالرد عليك فوراً.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Tickets')}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              paddingHorizontal: spacing.xl,
              borderRadius: borderRadius.lg,
              width: '100%',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 15 }}>
              فتح تذكرة دعم مع خدمة العملاء 🎧
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ paddingVertical: spacing.sm }}
          >
            <Text style={{ color: colors.gray, fontWeight: '700', fontSize: 13 }}>
              العودة للوحة التحكم
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}>
        <CheckCircle2 color={colors.success} size={80} style={{ marginBottom: spacing.lg }} />
        <Text style={{ color: colors.white, fontSize: typography.sizes.xl, fontWeight: '900', marginBottom: spacing.sm, textAlign: 'center' }}>تم إرسال طلبك بنجاح!</Text>
        <Text style={{ color: colors.gray, textAlign: 'center', lineHeight: 24 }}>سيقوم فريق الدعم الفني أو الفني المختص بالتواصل معك في أقرب وقت لترتيب الموعد.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.darkCard, borderBottomWidth: 1, borderColor: colors.border }}>
        <TouchableOpacity
          onPress={() => {
            if (navigation?.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else if (navigation?.navigate) {
              navigation.navigate('Home');
            }
          }}
          style={{ padding: spacing.xs }}
        >
          <ChevronRight color={colors.white} size={24} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: colors.primary, fontSize: typography.sizes.xl, fontWeight: '900', textAlign: 'center' }}>
          طلب صيانة / شكوى 🔧
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={true}
      >
        
        <View style={{ backgroundColor: 'rgba(59,130,246,0.1)', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.info, marginBottom: spacing.xl }}>
          <Text style={{ color: colors.white, textAlign: 'right', fontWeight: '700', lineHeight: 22 }}>
            هذا القسم مخصص لتقديم طلبات الصيانة المباشرة أو الشكاوى وسيتم تحويلها للفنيين وخدمة العملاء.
          </Text>
        </View>

        <Text style={{ color: colors.white, fontWeight: '900', marginBottom: spacing.xs, textAlign: 'right' }}>نوع الجهاز / المشكلة *</Text>
        <TouchableOpacity onPress={() => setShowDeviceSelect(!showDeviceSelect)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: showDeviceSelect ? spacing.xs : spacing.md }}>
          <ChevronDown color={colors.gray} size={20} />
          <Text style={{ color: colors.white, fontWeight: '700' }}>{device}</Text>
        </TouchableOpacity>
        
        {showDeviceSelect && (
          <View style={{ backgroundColor: colors.dark, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, marginBottom: spacing.md, overflow: 'hidden' }}>
            {DEVICES.map((d, i) => (
              <TouchableOpacity key={i} onPress={() => { setDevice(d); setShowDeviceSelect(false); }} style={{ padding: spacing.md, borderBottomWidth: i === DEVICES.length - 1 ? 0 : 1, borderColor: colors.border, backgroundColor: device === d ? 'rgba(212,175,55,0.1)' : 'transparent' }}>
                <Text style={{ color: device === d ? colors.primary : colors.white, textAlign: 'right', fontWeight: '700' }}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={{ color: colors.white, fontWeight: '900', marginBottom: spacing.xs, textAlign: 'right' }}>المحافظة *</Text>
        <TouchableOpacity onPress={() => setShowGovSelect(!showGovSelect)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.darkCard, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: showGovSelect ? spacing.xs : spacing.md }}>
          <ChevronDown color={colors.gray} size={20} />
          <Text style={{ color: colors.white, fontWeight: '700' }}>{gov}</Text>
        </TouchableOpacity>

        {showGovSelect && (
          <View style={{ backgroundColor: colors.dark, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, marginBottom: spacing.md, overflow: 'hidden' }}>
            {GOVERNORATES.map((g, i) => (
              <TouchableOpacity key={i} onPress={() => { setGov(g); setShowGovSelect(false); }} style={{ padding: spacing.md, borderBottomWidth: i === GOVERNORATES.length - 1 ? 0 : 1, borderColor: colors.border, backgroundColor: gov === g ? 'rgba(212,175,55,0.1)' : 'transparent' }}>
                <Text style={{ color: gov === g ? colors.primary : colors.white, textAlign: 'right', fontWeight: '700' }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={{ color: colors.white, fontWeight: '900', marginBottom: spacing.xs, textAlign: 'right' }}>رقم الهاتف للتواصل *</Text>
        <TextInput
          style={{ backgroundColor: colors.darkCard, color: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, textAlign: 'right', marginBottom: spacing.md }}
          placeholder="01xxxxxxxxx"
          placeholderTextColor={colors.gray}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={{ color: colors.white, fontWeight: '900', marginBottom: spacing.xs, textAlign: 'right' }}>العنوان بالتفصيل *</Text>
        <TextInput
          style={{ backgroundColor: colors.darkCard, color: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, textAlign: 'right', marginBottom: spacing.md }}
          placeholder="اسم الشارع، رقم العمارة، الدور..."
          placeholderTextColor={colors.gray}
          value={address}
          onChangeText={setAddress}
        />

        <Text style={{ color: colors.white, fontWeight: '900', marginBottom: spacing.xs, textAlign: 'right' }}>وصف المشكلة بالتفصيل *</Text>
        <TextInput
          style={{ backgroundColor: colors.darkCard, color: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.md, textAlign: 'right', marginBottom: spacing.xl, minHeight: 120, textAlignVertical: 'top' }}
          placeholder="اكتب تفاصيل العطل أو الشكوى هنا..."
          placeholderTextColor={colors.gray}
          multiline
          value={desc}
          onChangeText={setDesc}
        />

        <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={{ backgroundColor: submitting ? colors.gray : colors.primary, padding: spacing.lg, borderRadius: borderRadius.lg, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm }}>
          <Send color={colors.dark} size={20} />
          <Text style={{ color: colors.dark, fontWeight: '900', fontSize: typography.sizes.md }}>
            {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
