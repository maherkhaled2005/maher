import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Search,
  ShoppingBag,
  ShieldCheck,
  Wrench,
  Bot,
  Truck,
  Star,
  BookOpen,
  ChevronLeft,
  Flame,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  Headphones,
  Ticket,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { fetchApi } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';

export default function ClientDashboard({ navigation }: any) {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // 6 Quick Maintenance Services (3x2 Grid - complete without empty gaps)
  const maintenanceServices = [
    { id: 'غسالات', name: 'غسالات', icon: '🧺', tag: 'قطع أصلية' },
    { id: 'ثلاجات', name: 'ثلاجات', icon: '🧊', tag: 'شحن فريون' },
    { id: 'بوتاجازات', name: 'بوتاجازات', icon: '🔥', tag: 'صيانة آمنة' },
    { id: 'ميكروويف', name: 'ميكروويف', icon: '♨️', tag: 'إصلاح فوري' },
    { id: 'سخانات', name: 'سخانات', icon: '🚿', tag: 'فحص وتسخين' },
    { id: 'تكييف', name: 'تكييفات', icon: '❄️', tag: 'صيانة فورية' },
  ];

  const [techniciansList, setTechniciansList] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [coursesList, setCoursesList] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [techData, prodData, courseData] = await Promise.all([
        fetchApi('/technicians').catch(() => []),
        fetchApi('/products').catch(() => []),
        fetchApi('/courses').catch(() => []),
      ]);

      if (Array.isArray(techData)) {
        const mapped = techData.slice(0, 5).map((t: any) => ({
          id: t.id,
          name: t.name,
          spec: t.specialty || 'صيانة عامة',
          rating: t.rating ? t.rating : 'جديد',
          reviews: t.jobs || 0,
          phone: t.phone || '',
        }));
        setTechniciansList(mapped);
      }
      if (Array.isArray(prodData)) {
        const mapped = prodData.slice(0, 5).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: `${p.price} ج.م`,
          seller: p.sellerName || 'مورد معتمد',
          raw: p,
        }));
        setProductsList(mapped);
      }
      if (Array.isArray(courseData)) {
        const mapped = courseData.slice(0, 3).map((c: any) => ({
          id: c.id,
          title: c.title,
          instructor: c.instructorName || 'مدرب معتمد',
          price: `${c.price || 0} ج.م`,
          rating: c.rating || 5.0,
          students: c.studentsCount || 0,
        }));
        setCoursesList(mapped);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRequestTech = (tech: any) => {
    navigation.navigate('TechniciansTeam', { prefillTech: tech, specialty: tech.spec });
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.dark }}
    >
      {/* Role Header with ☰ Drawer & Cart Button */}
      <OwnerHeader
        title="الرئيسية واستكشاف المنصة"
        subtitle={`مرحباً بك، ${user?.name || 'العميل العزيز'} 👤`}
        sectionNumber={1}
        navigation={navigation}
        currentScreen="Home"
        onRefresh={onRefresh}
        rightAction={
          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={{
              width: 40,
              height: 40,
              borderRadius: borderRadius.md,
              backgroundColor: colors.darkCard,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ShoppingBag color={colors.customer} size={20} />
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.darkCard,
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: spacing.xl,
          }}
        >
          <Search color={colors.primary} size={20} />
          <TextInput
            style={{
              flex: 1,
              textAlign: 'right',
              color: colors.white,
              paddingRight: spacing.sm,
              fontSize: typography.sizes.sm,
            }}
            placeholder="ابحث عن فني، قطعة غيار، أو خدمة صيانة..."
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 6 Quick Maintenance Services (Required by spec) */}
        <View style={{ marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <TouchableOpacity onPress={() => navigation.navigate('TechniciansTeam')}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>عرض الفنيين</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.white, fontSize: typography.sizes.lg, fontWeight: '900' }}>
              أقسام الصيانة السريعة 🛠️
            </Text>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm }}>
            {maintenanceServices.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => navigation.navigate('TechniciansTeam', { specialty: s.id })}
                style={{
                  width: '31%',
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 32, marginBottom: spacing.xs }}>{s.icon}</Text>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: typography.sizes.sm, marginBottom: 2 }}>
                  {s.name}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>
                  {s.tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Access Feature Cards */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('AIChat')}
            style={{
              flex: 1,
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: '#8B5CF6',
              alignItems: 'center',
            }}
          >
            <Bot color="#8B5CF6" size={28} style={{ marginBottom: 6 }} />
            <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>طبيب الصيانة AI</Text>
            <Text style={{ color: colors.gray, fontSize: 10, textAlign: 'center', marginTop: 2 }}>تشخيص الأعطال بالذكاء</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Marketplace')}
            style={{
              flex: 1,
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: colors.primary,
              alignItems: 'center',
            }}
          >
            <ShoppingBag color={colors.primary} size={28} style={{ marginBottom: 6 }} />
            <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>سوق قطع الغيار</Text>
            <Text style={{ color: colors.gray, fontSize: 10, textAlign: 'center', marginTop: 2 }}>أسعار تنافسية وضمان</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Orders')}
            style={{
              flex: 1,
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              borderWidth: 1,
              borderColor: '#10B981',
              alignItems: 'center',
            }}
          >
            <Truck color="#10B981" size={28} style={{ marginBottom: 6 }} />
            <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>تتبع الطلبات</Text>
            <Text style={{ color: colors.gray, fontSize: 10, textAlign: 'center', marginTop: 2 }}>متابعة حالة الطلب</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Support & Complaints Action Section */}
        <View
          style={{
            backgroundColor: colors.darkCard,
            borderRadius: borderRadius.lg,
            padding: spacing.md,
            borderWidth: 1,
            borderColor: colors.primary,
            marginBottom: spacing.xxl,
          }}
        >
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
              <Headphones color={colors.primary} size={24} />
              <View>
                <Text style={{ color: colors.white, fontSize: 15, fontWeight: '900', textAlign: 'right' }}>
                  خدمة العملاء والدعم الفني 🎧
                </Text>
                <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right', marginTop: 2 }}>
                  واجهت مشكلة؟ فريق الدعم وخدمة العملاء جاهز للرد عليك وحلها فوراً
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.xs }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Tickets')}
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row-reverse',
                gap: 6,
              }}
            >
              <Ticket color={colors.dark} size={16} />
              <Text style={{ color: colors.dark, fontSize: 12, fontWeight: '900' }}>
                فتح تذكرة / شكوى جديدة
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Support')}
              style={{
                flex: 1,
                backgroundColor: colors.dark,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row-reverse',
                gap: 6,
              }}
            >
              <Wrench color={colors.primary} size={16} />
              <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700' }}>
                طلب صيانة فوري
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top 5 Technicians (Required by spec) */}
        <View style={{ marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <TouchableOpacity onPress={() => navigation.navigate('TechniciansTeam')}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.white, fontSize: typography.sizes.lg, fontWeight: '900' }}>
              أفضل الفنيين المعتمدين ⭐
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            {techniciansList.length === 0 ? (
              <View style={{ backgroundColor: colors.darkCard, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>🔧</Text>
                <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 13 }}>لا يوجد فنيين مسجلين بعد</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>سيظهر الفنيون المعتمدون هنا فور تسجيلهم واعتمادهم</Text>
              </View>
            ) : (
              techniciansList.map((t) => (
                <View
                  key={t.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleRequestTech(t)}
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.md,
                    }}
                  >
                    <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 12 }}>طلب صيانة</Text>
                  </TouchableOpacity>

                  <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: spacing.md }}>
                    <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>{t.name}</Text>
                    <Text style={{ color: colors.gray, fontSize: 11 }}>{t.spec}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Text style={{ color: colors.gray, fontSize: 10 }}>({t.reviews} تقييم)</Text>
                      <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 11 }}>{t.rating}</Text>
                      <Star size={12} color={colors.primary} fill={colors.primary} />
                    </View>
                  </View>

                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: 'rgba(212,175,55,0.15)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.primary,
                    }}
                  >
                    <Wrench size={20} color={colors.primary} />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Latest 5 Products (Required by spec) */}
        <View style={{ marginBottom: spacing.xxl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <TouchableOpacity onPress={() => navigation.navigate('Marketplace')}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>المتجر كاملاً</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.white, fontSize: typography.sizes.lg, fontWeight: '900' }}>
              أحدث قطع الغيار والأجهزة 🛒
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            {productsList.length === 0 ? (
              <View style={{ backgroundColor: colors.darkCard, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>🏪</Text>
                <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 13 }}>لا توجد منتجات مسجلة في المتجر بعد</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>ستظهر قطع الغيار هنا بمجرد إدراج التجار لمنتجاتهم</Text>
              </View>
            ) : (
              productsList.map((p) => (
                <View
                  key={p.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ProductDetails', { product: p.raw || p })}
                    style={{
                      backgroundColor: 'rgba(212,175,55,0.15)',
                      borderWidth: 1,
                      borderColor: colors.primary,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: borderRadius.md,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 12 }}>عرض</Text>
                  </TouchableOpacity>

                  <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: spacing.md }}>
                    <Text style={{ color: colors.white, fontWeight: '700', fontSize: 13, textAlign: 'right' }}>
                      {p.name}
                    </Text>
                    <Text style={{ color: colors.gray, fontSize: 11 }}>المورد: {p.seller}</Text>
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13, marginTop: 2 }}>
                      {p.price}
                    </Text>
                  </View>

                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: borderRadius.md,
                      backgroundColor: '#000',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <ShoppingBag size={20} color={colors.gray} />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Featured 3 Courses (Required by spec) */}
        <View style={{ marginBottom: spacing.xl }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
            <TouchableOpacity onPress={() => navigation.navigate('WebCommunity')}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>جميع الكورسات</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.white, fontSize: typography.sizes.lg, fontWeight: '900' }}>
              أشهر الكورسات التدريبية 📚
            </Text>
          </View>

          <View style={{ gap: spacing.sm }}>
            {coursesList.length === 0 ? (
              <View style={{ backgroundColor: colors.darkCard, padding: spacing.lg, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
                <Text style={{ fontSize: 24, marginBottom: spacing.xs }}>🎓</Text>
                <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 13 }}>لا توجد دورات تدريبية متاحة حالياً</Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>سيتم إضافة الدورات التدريبية المعتمدة قريباً</Text>
              </View>
            ) : (
              coursesList.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => navigation.navigate('WebCommunity')}
                  style={{
                    backgroundColor: colors.darkCard,
                    borderRadius: borderRadius.lg,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 14 }}>{c.price}</Text>
                    <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14, flex: 1, textAlign: 'right', paddingLeft: spacing.sm }}>
                      {c.title}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: colors.gray, fontSize: 11 }}>({c.students} طالب)</Text>
                      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>{c.rating}</Text>
                      <Star size={12} color={colors.primary} fill={colors.primary} />
                    </View>
                    <Text style={{ color: colors.gray, fontSize: 11 }}>المدرب: {c.instructor}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
