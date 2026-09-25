import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import {
  ImagePlus,
  Camera,
  ChevronDown,
  Package,
  Upload,
  X,
  Sparkles,
  ShieldCheck,
  Wrench,
  CheckCircle2,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, borderRadius } from '../../theme';
import { api } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';

const CONDITIONS = [
  'جديدة وأصلية بالضمان',
  'استيراد أصلي بحالة المصنع',
  'كسر زيرو ممتازة',
  'مستعملة ومفحوصة',
];

const COMPATIBILITIES = [
  'تكييفات (شارب، كاريير، يونيون إير)',
  'غسالات ملابس وأطباق (إل جي، سامسونج، زانوسي)',
  'ثلاجات وديب فريزر (توشيبا، كريازي، بيكو)',
  'شاشات وتلفزيونات (إل جي، تورنيدو، سامسونج)',
  'سخانات وبوتاجازات (أوليمبيك، يونيفرسال)',
  'قطع غيار ومكونات عامة',
];

const WARRANTIES = [
  'ضمان سنة معتمد (12 شهراً)',
  'ضمان 6 أشهر',
  'ضمان 3 أشهر',
  'ضمان 30 يوماً',
  'بدون ضمان',
];

const ORIGINS = [
  'كوري أصلي 🇰🇷',
  'ياباني أصلي 🇯🇵',
  'ألماني 🇩🇪',
  'إيطالي 🇮🇹',
  'صيني درجة أولى 🇨🇳',
  'تصنيع مصري معتمد 🇪🇬',
];



export default function AddProductScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    technicianDiscount: '0',
    stock: '10',
    category: 'قطع غيار جديدة',
    image: '',
    condition: CONDITIONS[0],
    compatibility: COMPATIBILITIES[0],
    warranty: WARRANTIES[0],
    origin: ORIGINS[0],
    partNumber: '',
  });

  const [showCategories, setShowCategories] = useState(false);
  const [showConditions, setShowConditions] = useState(false);
  const [showCompatibilities, setShowCompatibilities] = useState(false);
  const [showWarranties, setShowWarranties] = useState(false);
  const [showOrigins, setShowOrigins] = useState(false);

  const [isPublishing, setIsPublishing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Load real categories from DB
  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await api.get('/categories');
        if (Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((c: any) => ({ id: c.id, name: c.label || c.name || 'تصنيف' }));
          setCategories(mapped);
          setForm(prev => ({ ...prev, category: mapped[0].name }));
        } else {
          setCategories([
            { id: '1', name: 'قطع غيار جديدة' },
            { id: '2', name: 'قطع غيار مستعملة' },
            { id: '3', name: 'عدة وأدوات جديدة' },
            { id: '4', name: 'أجهزة إلكترونية' },
          ]);
        }
      } catch {
        setCategories([
          { id: '1', name: 'قطع غيار جديدة' },
          { id: '2', name: 'قطع غيار مستعملة' },
          { id: '3', name: 'عدة وأدوات جديدة' },
          { id: '4', name: 'أجهزة إلكترونية' },
        ]);
      }
    };
    loadCats();
  }, []);

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('تنبيه', 'يجب منح صلاحية الوصول للصور لاختيار صورة المنتج.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        setImagePreview(uri);
        if (asset.base64) {
          setForm(prev => ({ ...prev, image: `data:image/jpeg;base64,${asset.base64}` }));
        } else {
        }
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleCameraCapture = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('تنبيه', 'يجب منح صلاحية الكاميرا لالتقاط صورة المنتج مباشرة.');
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.uri;
        setImagePreview(uri);
        if (asset.base64) {
          setForm(prev => ({ ...prev, image: `data:image/jpeg;base64,${asset.base64}` }));
        } else {
          setForm(prev => ({ ...prev, image: uri }));
        }
      }
    } catch (err) {
      console.warn('Camera error:', err);
    }
  };



  const handlePublish = async () => {
    if (!form.name.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة اسم المنتج أو القطعة');
      return;
    }
    const numericPrice = parseFloat(form.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('تنبيه', 'يرجى إدخال سعر صحيح بالجنيه المصري');
      return;
    }

    setIsPublishing(true);
    try {
      const chosenImage = form.image || imagePreview || '';
      if (!chosenImage) {
        Alert.alert('تنبيه', 'يرجى اختيار صورة للمنتج من جهازك');
        setIsPublishing(false);
        return;
      }
      const specsObj = {
        'الحالة': form.condition,
        'التوافق': form.compatibility,
        'الضمان': form.warranty,
        'بلد المنشأ': form.origin,
        'رقم القطعة OEM': form.partNumber.trim() || 'GENUINE-PART',
        'خصم الفني (%)': form.technicianDiscount,
      };

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || `${form.name.trim()} - ${form.condition} - متوافق مع ${form.compatibility} - ${form.warranty}`,
        price: numericPrice,
        stock: parseInt(form.stock) || 10,
        category: form.category,
        image: chosenImage,
        specifications: JSON.stringify(specsObj),
      };

      const res = await api.post('/products', payload);
      if (res.data?.success || res.status === 200) {
        Alert.alert('🎉 تم بنجاح!', 'تم نشر قطعة الغيار في السوق بنجاح وجاهزة للطلب.');
        if (navigation?.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Marketplace');
        }
      } else {
        throw new Error(res.data?.error || 'فشل حفظ المنتج');
      }
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر إضافة المنتج، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      <OwnerHeader
        title="إضافة منتج جديد بالسوق"
        subtitle="إدراج قطع غيار جديدة بالصور والمواصفات"
        navigation={navigation}
        currentScreen="AddProduct"
        showBack={true}
      />

      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
        >
          {/* Section Header */}
          <View style={{ alignItems: 'flex-end', marginBottom: spacing.lg }}>
            <Text style={{ color: colors.white, fontSize: 18, fontWeight: '900' }}>
              بيانات ومعلومات قطعة الغيار 📦
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}>
              سيتم إدراج القطعة في السوق الفوري وتظهر لكافة العملاء والفنيين
            </Text>
          </View>

          {/* Image Picker & Presets */}
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: spacing.xs }}>
              صورة المنتج أو القطعة *
            </Text>
            {imagePreview ? (
              <View
                style={{
                  width: '100%',
                  height: 180,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  overflow: 'hidden',
                  position: 'relative',
                  marginBottom: spacing.sm,
                }}
              >
                <Image
                  source={{ uri: imagePreview }}
                  style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
                />
                <TouchableOpacity
                  onPress={() => { setImagePreview(null); setForm(p => ({ ...p, image: '' })); }}
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} color={colors.white} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row-reverse', gap: 10, marginBottom: spacing.sm }}>
                <TouchableOpacity
                  onPress={handleCameraCapture}
                  style={{
                    flex: 1,
                    height: 110,
                    backgroundColor: colors.darkCard,
                    borderWidth: 1.5,
                    borderColor: colors.primary,
                    borderStyle: 'dashed',
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(212,175,55,0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Camera size={20} color={colors.primary} />
                  </View>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>
                    تصوير بالكاميرا 📸
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 10 }}>
                    التقاط صورة مباشرة
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickImage}
                  style={{
                    flex: 1,
                    height: 110,
                    backgroundColor: colors.darkCard,
                    borderWidth: 1.5,
                    borderColor: '#3B82F6',
                    borderStyle: 'dashed',
                    borderRadius: borderRadius.lg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: 'rgba(59,130,246,0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ImagePlus size={20} color="#3B82F6" />
                  </View>
                  <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 12 }}>
                    اختيار من المعرض 🖼️
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 10 }}>
                    من ألبوم الصور
                  </Text>
                </TouchableOpacity>
              </View>
            )}


          </View>

          {/* Form Fields */}
          <View style={{ gap: spacing.md }}>
            {/* Product Name */}
            <View>
              <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                اسم قطعة الغيار / المنتج *
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.darkCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  color: colors.white,
                  textAlign: 'right',
                  fontSize: 14,
                }}
                placeholder="مثال: موتور مروحة تكييف شارب 1.5 حصان أصلي"
                placeholderTextColor={colors.gray}
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
              />
            </View>

            {/* Category Dropdown */}
            <View>
              <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                القسم أو التصنيف *
              </Text>
              <TouchableOpacity
                onPress={() => setShowCategories(!showCategories)}
                style={{
                  backgroundColor: colors.darkCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <ChevronDown size={18} color={colors.primary} />
                <Text style={{ color: colors.white, fontWeight: '800', fontSize: 13 }}>
                  {form.category}
                </Text>
              </TouchableOpacity>

              {showCategories && (
                <View
                  style={{
                    backgroundColor: '#141414',
                    borderRadius: borderRadius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginTop: 4,
                    overflow: 'hidden',
                  }}
                >
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => {
                        setForm({ ...form, category: c.name });
                        setShowCategories(false);
                      }}
                      style={{
                        padding: spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: '#222',
                        backgroundColor: form.category === c.name ? 'rgba(212,175,55,0.15)' : 'transparent',
                        alignItems: 'flex-end',
                      }}
                    >
                      <Text
                        style={{
                          color: form.category === c.name ? colors.primary : colors.white,
                          fontWeight: form.category === c.name ? '900' : '600',
                          fontSize: 13,
                        }}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Spare Parts Options: Condition & Compatibility */}
            <View style={{ gap: spacing.md }}>
              {/* Condition */}
              <View>
                <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                  حالة قطعة الغيار *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowConditions(!showConditions)}
                  style={{
                    backgroundColor: colors.darkCard,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <ChevronDown size={18} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>
                    {form.condition}
                  </Text>
                </TouchableOpacity>

                {showConditions && (
                  <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: 'hidden' }}>
                    {CONDITIONS.map((cond, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => { setForm({ ...form, condition: cond }); setShowConditions(false); }}
                        style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'flex-end', backgroundColor: form.condition === cond ? 'rgba(212,175,55,0.15)' : 'transparent' }}
                      >
                        <Text style={{ color: form.condition === cond ? colors.primary : colors.white, fontWeight: '700', fontSize: 13 }}>
                          {cond}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Compatibility */}
              <View>
                <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                  التوافق ونوع الجهاز *
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCompatibilities(!showCompatibilities)}
                  style={{
                    backgroundColor: colors.darkCard,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <ChevronDown size={18} color={colors.primary} />
                  <Text style={{ color: colors.white, fontWeight: '800', fontSize: 13 }}>
                    {form.compatibility}
                  </Text>
                </TouchableOpacity>

                {showCompatibilities && (
                  <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginTop: 4, overflow: 'hidden' }}>
                    {COMPATIBILITIES.map((comp, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => { setForm({ ...form, compatibility: comp }); setShowCompatibilities(false); }}
                        style={{ padding: spacing.md, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'flex-end', backgroundColor: form.compatibility === comp ? 'rgba(212,175,55,0.15)' : 'transparent' }}
                      >
                        <Text style={{ color: form.compatibility === comp ? colors.primary : colors.white, fontWeight: '700', fontSize: 13 }}>
                          {comp}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Warranty & Origin Row */}
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                {/* Origin */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                    بلد المنشأ
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowOrigins(!showOrigins)}
                    style={{
                      backgroundColor: colors.darkCard,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                      padding: 10,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronDown size={16} color={colors.primary} />
                    <Text style={{ color: colors.white, fontWeight: '700', fontSize: 11 }} numberOfLines={1}>
                      {form.origin}
                    </Text>
                  </TouchableOpacity>
                  {showOrigins && (
                    <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginTop: 4 }}>
                      {ORIGINS.map((orig, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => { setForm({ ...form, origin: orig }); setShowOrigins(false); }}
                          style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'flex-end' }}
                        >
                          <Text style={{ color: form.origin === orig ? colors.primary : colors.white, fontSize: 11 }}>{orig}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Warranty */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                    مدة الضمان
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowWarranties(!showWarranties)}
                    style={{
                      backgroundColor: colors.darkCard,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: borderRadius.md,
                      padding: 10,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <ChevronDown size={16} color={colors.primary} />
                    <Text style={{ color: colors.white, fontWeight: '700', fontSize: 11 }} numberOfLines={1}>
                      {form.warranty}
                    </Text>
                  </TouchableOpacity>
                  {showWarranties && (
                    <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginTop: 4 }}>
                      {WARRANTIES.map((warr, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => { setForm({ ...form, warranty: warr }); setShowWarranties(false); }}
                          style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'flex-end' }}
                        >
                          <Text style={{ color: form.warranty === warr ? colors.primary : colors.white, fontSize: 11 }}>{warr}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Part Number */}
              <View>
                <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                  رقم القطعة الأصلي (Part Number / OEM)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.white,
                    textAlign: 'right',
                    fontSize: 13,
                  }}
                  placeholder="مثال: SHARP-MOT-24V-01"
                  placeholderTextColor={colors.gray}
                  value={form.partNumber}
                  onChangeText={(t) => setForm({ ...form, partNumber: t })}
                />
              </View>
            </View>

            {/* Price & Stock Row */}
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                  الكمية بالمخزن
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.white,
                    textAlign: 'right',
                    fontSize: 14,
                  }}
                  placeholder="10"
                  placeholderTextColor={colors.gray}
                  keyboardType="numeric"
                  value={form.stock}
                  onChangeText={(t) => setForm({ ...form, stock: t })}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                  خصم الفني (%)
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderWidth: 1,
                    borderColor: '#EAB308',
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.white,
                    textAlign: 'right',
                    fontSize: 14,
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.gray}
                  keyboardType="numeric"
                  value={form.technicianDiscount}
                  onChangeText={(t) => setForm({ ...form, technicianDiscount: t })}
                />
              </View>

              <View style={{ flex: 1.5 }}>
                <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                  السعر (ج.م) *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: colors.darkCard,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.primary,
                    fontWeight: '900',
                    textAlign: 'right',
                    fontSize: 16,
                  }}
                  placeholder="0.00"
                  placeholderTextColor={colors.gray}
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(t) => setForm({ ...form, price: t })}
                />
              </View>
            </View>

            {/* Description */}
            <View>
              <Text style={{ color: colors.gray, fontSize: 12, fontWeight: '800', textAlign: 'right', marginBottom: 4 }}>
                ملاحظات ومواصفات إضافية
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.darkCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  padding: spacing.md,
                  color: colors.white,
                  textAlign: 'right',
                  fontSize: 13,
                  minHeight: 80,
                  textAlignVertical: 'top',
                }}
                placeholder="اكتب أي تفاصيل إضافية عن القطعة والتركيب..."
                placeholderTextColor={colors.gray}
                multiline
                numberOfLines={3}
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handlePublish}
              disabled={isPublishing}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: spacing.md,
                flexDirection: 'row',
                gap: 8,
              }}
            >
              {isPublishing ? (
                <ActivityIndicator size="small" color={colors.dark} />
              ) : (
                <>
                  <Upload size={20} color={colors.dark} />
                  <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>
                    نشر القطعة في السوق فوراً ✓
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
