import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Crown,
  Check,
  CreditCard,
  Wrench,
  Zap,
  DollarSign,
  Smartphone,
  Store,
  ChevronRight,
  Upload,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { fetchApi } from '../../api/client';

const TECHNICIAN_SPECIALTIES = [
  '🧺 غسالات',
  '🧊 ثلاجات',
  '🔥 بوتاجازات',
  '♨️ ميكروويف',
  '❄️ مكيفات',
];

const PAYMENT_METHODS = [
  { id: 'vodafone_cash', label: 'فودافون كاش', sub: '01064739664', icon: Smartphone, color: '#E60000' },
  { id: 'instapay', label: 'إنستاباي (InstaPay)', sub: '01064739664 / tecnorexa@instapay', icon: Zap, color: '#7928CA' },
  { id: 'card', label: 'بطاقة بنكية (Visa / Master)', sub: 'دفع إلكتروني فوري ومؤمن', icon: CreditCard, color: '#D4AF37' },
  { id: 'wallet', label: 'محفظة TecnoRexa', sub: 'الخصم المباشر من رصيد المحفظة', icon: DollarSign, color: '#10B981' },
];

export default function SubscriptionScreen({ route, navigation }: any) {
  const { updateUser } = useAuthStore();

  const initialTab = route?.params?.plan === 'merchant' ? 'merchant' : 'technician';
  const [activeTab, setActiveTab] = useState<'technician' | 'merchant'>(initialTab);

  // Technician state
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('❄️ تكييف');
  const [customSpecialty, setCustomSpecialty] = useState('');

  // Merchant state
  const [storeName, setStoreName] = useState('');
  const [commercialReg, setCommercialReg] = useState('');

  // Payment state
  const [selectedPayment, setSelectedPayment] = useState<string>('vodafone_cash');
  const [senderPhone, setSenderPhone] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handlePickReceipt = async () => {
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

  const isTech = activeTab === 'technician';
  const price = isTech ? 300 : 500;
  const planTitle = isTech ? 'ترقية فني معتمد' : 'ترقية تاجر معتمد';

  const effectiveSpecialty =
    selectedSpecialty === '💡 أخرى' && customSpecialty.trim()
      ? customSpecialty.trim()
      : selectedSpecialty;

  const handleContinueAsCustomer = () => {
    navigation.navigate('Main', { screen: 'Home' });
  };

  const handleOpenPaymentConfirm = () => {
    if (isTech && selectedSpecialty === '💡 أخرى' && !customSpecialty.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة التخصص في الحقل المخصص.');
      return;
    }
    if (!isTech && !storeName.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة اسم المتجر أو النشاط التجاري.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecutePayment = async () => {
    if ((selectedPayment === 'vodafone_cash' || selectedPayment === 'instapay') && !senderPhone.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم المحفظة / الهاتف المحول منه.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        targetRole: isTech ? 'technician' : 'merchant',
        planId: isTech ? 'technician' : 'merchant',
        amount: price,
        paymentMethod: selectedPayment,
        specialty: isTech ? effectiveSpecialty : undefined,
        storeName: !isTech ? storeName.trim() : undefined,
        senderPhone: senderPhone.trim() || undefined,
        receiptImage: receiptImage || undefined,
      };

      const res = await fetchApi('/subscriptions/subscribe', {
        method: 'POST',
        data: payload,
      });

      if (res?.user) {
        updateUser(res.user);
      }

      setShowConfirmModal(false);
      Alert.alert(
        '🎉 مبروك الترقية!',
        `تم سداد ${price} ج.م وتفعيل حسابك بنجاح كـ ${planTitle}. تم تحديث صلاحياتك وواجهتك فوراً.`,
        [
          {
            text: 'دخول لوحة التحكم',
            onPress: () => {
              navigation.navigate('Main', { screen: 'Home' });
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('خطأ في المعالجة', err.message || 'تعذر إتمام عملية السداد، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: '#0A0A0A' },
        
      ]}
    >
      {/* Top Header */}
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: '#111111',
          borderBottomWidth: 1,
          borderColor: '#222',
        }}
      >
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => (navigation?.canGoBack?.() ? navigation.goBack() : navigation.navigate('Main', { screen: 'Home' }))}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#1C1C1C',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#333',
            }}
          >
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.white, fontSize: 17, fontWeight: '900' }}>
              الترقيات والاشتراكات المعتمدة
            </Text>
            <Text style={{ color: colors.primary, fontSize: 11, marginTop: 2 }}>
              انضم لنخبة المحترفين على منصة TecnoRexa
            </Text>
          </View>
        </View>

        {/* Dismiss / Continue as Customer Button */}
        <TouchableOpacity
          onPress={handleContinueAsCustomer}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: borderRadius.sm,
            backgroundColor: '#1A1A1A',
            borderWidth: 1,
            borderColor: '#333',
          }}
        >
          <Text style={{ color: colors.gray, fontSize: 11, fontWeight: 'bold' }}>تخطي كعميل</Text>
        </TouchableOpacity>
      </View>

      {/* Role Selection Tabs */}
      <View
        style={{
          flexDirection: 'row-reverse',
          backgroundColor: '#111111',
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.sm,
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('technician')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: borderRadius.md,
            backgroundColor: activeTab === 'technician' ? 'rgba(212, 175, 55, 0.2)' : '#1A1A1A',
            borderWidth: 1.5,
            borderColor: activeTab === 'technician' ? colors.primary : '#333',
            alignItems: 'center',
            flexDirection: 'row-reverse',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Wrench size={16} color={activeTab === 'technician' ? colors.primary : colors.gray} />
          <Text
            style={{
              color: activeTab === 'technician' ? colors.primary : colors.gray,
              fontWeight: '900',
              fontSize: 13,
            }}
          >
            فني صيانة (300 ج.م)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('merchant')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: borderRadius.md,
            backgroundColor: activeTab === 'merchant' ? 'rgba(16, 185, 129, 0.2)' : '#1A1A1A',
            borderWidth: 1.5,
            borderColor: activeTab === 'merchant' ? '#10B981' : '#333',
            alignItems: 'center',
            flexDirection: 'row-reverse',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Store size={16} color={activeTab === 'merchant' ? '#10B981' : colors.gray} />
          <Text
            style={{
              color: activeTab === 'merchant' ? '#10B981' : colors.gray,
              fontWeight: '900',
              fontSize: 13,
            }}
          >
            تاجر قطع غيار (500 ج.م)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Banner Card */}
        <View
          style={{
            backgroundColor: '#141414',
            borderRadius: borderRadius.xl,
            padding: spacing.lg,
            borderWidth: 1.5,
            borderColor: isTech ? colors.primary : '#10B981',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: isTech ? 'rgba(212, 175, 55, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.xs,
            }}
          >
            {isTech ? <Wrench size={30} color={colors.primary} /> : <Store size={30} color="#10B981" />}
          </View>

          <Text style={{ color: colors.white, fontSize: 20, fontWeight: '900', textAlign: 'center' }}>
            {planTitle}
          </Text>

          <View style={{ flexDirection: 'row-reverse', alignItems: 'baseline', marginVertical: 6, gap: 4 }}>
            <Text style={{ color: isTech ? colors.primary : '#10B981', fontSize: 32, fontWeight: '900' }}>
              {price}
            </Text>
            <Text style={{ color: colors.gray, fontSize: 14, fontWeight: '700' }}>ج.م / سنوياً</Text>
          </View>

          <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
            {isTech
              ? 'انضم إلى أسطول فنيي TecnoRexa واستقبل طلبات الصيانة المباشرة من العملاء بأعلى عائد مادي.'
              : 'افتح متجرك الرقمي وابدأ ببيع قطع الغيار والمعدات الأصلية لآلاف الفنيين والعملاء في كل محافظات مصر.'}
          </Text>
        </View>

        {/* 1. If Technician: Specialties Grid */}
        {isTech && (
          <View style={{ marginBottom: spacing.md }}>
            <Text style={{ color: colors.white, fontSize: 14, fontWeight: 'bold', marginBottom: 8, textAlign: 'right' }}>
              اختر تخصصك الأساسي في الصيانة: *
            </Text>

            <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }}>
              {TECHNICIAN_SPECIALTIES.map((spec) => {
                const isSelected = selectedSpecialty === spec;
                return (
                  <TouchableOpacity
                    key={spec}
                    onPress={() => setSelectedSpecialty(spec)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: borderRadius.md,
                      backgroundColor: isSelected ? colors.primary : '#1A1A1A',
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary : '#333',
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#0A0A0A' : colors.white,
                        fontSize: 12,
                        fontWeight: isSelected ? '900' : '600',
                      }}
                    >
                      {spec}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedSpecialty === '💡 أخرى' && (
              <TextInput
                style={{
                  backgroundColor: '#1E1E1E',
                  borderWidth: 1,
                  borderColor: colors.primary,
                  borderRadius: borderRadius.md,
                  padding: 10,
                  color: colors.white,
                  textAlign: 'right',
                  marginTop: 8,
                }}
                placeholder="اكتب تخصصك الفني بالتفصيل..."
                placeholderTextColor={colors.gray}
                value={customSpecialty}
                onChangeText={setCustomSpecialty}
              />
            )}
          </View>
        )}

        {/* 2. If Merchant: Store Info */}
        {!isTech && (
          <View style={{ marginBottom: spacing.md, gap: 10 }}>
            <View>
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
                اسم المتجر / النشاط التجاري: *
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#333',
                  borderRadius: borderRadius.md,
                  padding: 10,
                  color: colors.white,
                  textAlign: 'right',
                }}
                placeholder="مثال: شركة النور لقطع غيار التبريد والتكييف"
                placeholderTextColor={colors.gray}
                value={storeName}
                onChangeText={setStoreName}
              />
            </View>

            <View>
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold', marginBottom: 4, textAlign: 'right' }}>
                رقم السجل التجاري أو الهاتف التجاري (اختياري):
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#1A1A1A',
                  borderWidth: 1,
                  borderColor: '#333',
                  borderRadius: borderRadius.md,
                  padding: 10,
                  color: colors.white,
                  textAlign: 'right',
                }}
                placeholder="رقم السجل التجاري للتوثيق السريع"
                placeholderTextColor={colors.gray}
                value={commercialReg}
                onChangeText={setCommercialReg}
              />
            </View>
          </View>
        )}

        {/* Features Checklist */}
        <View
          style={{
            backgroundColor: '#141414',
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: '#222',
            marginBottom: spacing.md,
            gap: 8,
          }}
        >
          <Text style={{ color: colors.white, fontSize: 13, fontWeight: '900', textAlign: 'right', marginBottom: 2 }}>
            المميزات الحصرية للعضوية:
          </Text>

          {(isTech
            ? [
                'استقبال إشعارات وطلبات الصيانة المباشرة من العملاء القريبين',
                'شارة توثيق ذهبية بجوار اسمك تعزز ثقة العملاء بك',
                'لوحة تحكم لإدارة الطلبات والتقارير وحساب تكلفة قطع الغيار',
                'محفظة رقمية مع سحب فوري لأرباحك عبر فودافون كاش وإنستاباي',
                'الوصول المجاني لكورسات وفيديوهات صيانة الأجهزة المتقدمة',
              ]
            : [
                'إنشاء متجر رقمي متكامل لعرض منتجات وقطع الغيار',
                'إضافة وتعديل المنتجات مع تحديد الأسعار والكميات والمخازن',
                'استقبال طلبات الشراء من آلاف الفنيين والعملاء وتأكيد الشحن',
                'تحويل أرباح المبيعات تلقائياً إلى محفظتك مع تقارير محاسبية دقيقة',
                'شارة تاجر معتمد وموثوق لرفع معدل مبيعاتك',
              ]
          ).map((feat, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: isTech ? 'rgba(212, 175, 55, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Check size={12} color={isTech ? colors.primary : '#10B981'} />
              </View>
              <Text style={{ color: colors.white, fontSize: 12, flex: 1, textAlign: 'right', lineHeight: 18 }}>
                {feat}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Methods Selector */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ color: colors.white, fontSize: 14, fontWeight: 'bold', marginBottom: 8, textAlign: 'right' }}>
            اختر وسيلة السداد المفضلة:
          </Text>

          <View style={{ gap: 8 }}>
            {PAYMENT_METHODS.map((pm) => {
              const isSelected = selectedPayment === pm.id;
              const IconComp = pm.icon;
              return (
                <TouchableOpacity
                  key={pm.id}
                  onPress={() => setSelectedPayment(pm.id)}
                  style={{
                    backgroundColor: '#141414',
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    borderWidth: 1.5,
                    borderColor: isSelected ? pm.color : '#252525',
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComp size={18} color={pm.color} />
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold' }}>{pm.label}</Text>
                      <Text style={{ color: colors.gray, fontSize: 11 }}>{pm.sub}</Text>
                    </View>
                  </View>

                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 2,
                      borderColor: isSelected ? pm.color : colors.gray,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isSelected && (
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: pm.color,
                        }}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={handleOpenPaymentConfirm}
            style={{
              backgroundColor: isTech ? colors.primary : '#10B981',
              paddingVertical: 14,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              flexDirection: 'row-reverse',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Crown size={18} color="#0A0A0A" />
            <Text style={{ color: '#0A0A0A', fontSize: 15, fontWeight: '900' }}>
              سداد {price} ج.م وتفعيل {planTitle}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContinueAsCustomer}
            style={{
              backgroundColor: '#1E1E1E',
              borderWidth: 1,
              borderColor: '#333',
              paddingVertical: 12,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.gray, fontSize: 13, fontWeight: '700' }}>
              المتابعة كعميل عادي والاستفادة من خدمات المنصة
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.85)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.md,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#141414',
              borderRadius: borderRadius.xl,
              borderWidth: 1.5,
              borderColor: isTech ? colors.primary : '#10B981',
              padding: spacing.lg,
            }}
          >
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.xs,
                }}
              >
                <CreditCard size={28} color={colors.primary} />
              </View>
              <Text style={{ color: colors.white, fontSize: 18, fontWeight: '900' }}>
                تأكيد سداد الاشتراك
              </Text>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: 'bold', marginTop: 2 }}>
                {planTitle}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: '#1C1C1C',
                borderRadius: borderRadius.md,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: '#2A2A2A',
                marginBottom: spacing.md,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.gray, fontSize: 12 }}>المبلغ المطلوب:</Text>
                <Text style={{ color: colors.white, fontSize: 14, fontWeight: '900' }}>{price} ج.م</Text>
              </View>

              {isTech ? (
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.gray, fontSize: 12 }}>التخصص المختار:</Text>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                    {effectiveSpecialty}
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.gray, fontSize: 12 }}>اسم المتجر:</Text>
                  <Text style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold' }}>
                    {storeName}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.gray, fontSize: 12 }}>وسيلة الدفع:</Text>
                <Text style={{ color: colors.white, fontSize: 12 }}>
                  {PAYMENT_METHODS.find((p) => p.id === selectedPayment)?.label}
                </Text>
              </View>

              {(selectedPayment === 'vodafone_cash' || selectedPayment === 'instapay') && (
                <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderColor: '#2A2A2A', gap: 8 }}>
                  <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right' }}>
                    رقم المحفظة المحول منها (إجباري):
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: '#141414',
                      borderWidth: 1,
                      borderColor: '#333',
                      borderRadius: borderRadius.sm,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      color: colors.white,
                      textAlign: 'right',
                      fontSize: 13,
                    }}
                    placeholder="01xxxxxxxxx"
                    placeholderTextColor={colors.gray}
                    keyboardType="phone-pad"
                    maxLength={11}
                    value={senderPhone}
                    onChangeText={setSenderPhone}
                  />

                  {/* Receipt Upload Button */}
                  <TouchableOpacity
                    onPress={handlePickReceipt}
                    style={{
                      flexDirection: 'row-reverse',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      backgroundColor: receiptImage ? 'rgba(16, 185, 129, 0.15)' : '#141414',
                      borderWidth: 1,
                      borderColor: receiptImage ? '#10B981' : '#D4AF37',
                      borderRadius: borderRadius.sm,
                      paddingVertical: 8,
                    }}
                  >
                    {receiptImage ? (
                      <>
                        <CheckCircle2 size={16} color="#10B981" />
                        <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>تم إرفاق صورة الإيصال بنجاح ✓</Text>
                      </>
                    ) : (
                      <>
                        <Upload size={16} color="#D4AF37" />
                        <Text style={{ color: '#D4AF37', fontSize: 12, fontWeight: '700' }}>إرفاق صورة إيصال التحويل (اختياري)</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* Review Notice */}
                  <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)', borderRadius: borderRadius.sm, padding: 8, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' }}>
                    <Text style={{ color: '#D4AF37', fontSize: 11, textAlign: 'right', lineHeight: 16 }}>
                      ⏳ تتم مراجعة وتفعيل الحساب خلال 5 إلى 30 دقيقة من قِبل إدارة TecnoRexa.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowConfirmModal(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: '#222',
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '700' }}>إلغاء</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleExecutePayment}
                disabled={loading}
                style={{
                  flex: 2,
                  paddingVertical: 12,
                  backgroundColor: isTech ? colors.primary : '#10B981',
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  flexDirection: 'row-reverse',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#0A0A0A" />
                ) : (
                  <>
                    <Crown size={16} color="#0A0A0A" />
                    <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 14 }}>
                      تأكيد ودفع {price} ج.م
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
