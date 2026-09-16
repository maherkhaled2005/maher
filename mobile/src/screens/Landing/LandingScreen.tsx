import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  Wrench,
  ShoppingBag,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Clock,
  CheckCircle2,
  Layers,
  GraduationCap,
} from 'lucide-react-native';

const APP_PILLARS = [
  {
    icon: Wrench,
    title: 'صيانة فورية لـ 5 أجهزة منزلية',
    desc: 'غسالات، ثلاجات، بوتاجازات، ميكروويف، وتكييفات بأيدي أمهر الفنيين المعتمدين.',
    badge: 'خدمة سريعة ⚡',
    color: '#D4AF37',
  },
  {
    icon: ShoppingBag,
    title: 'سوق قطع الغيار الأصلية بالضمان',
    desc: 'قطع غيار معتمدة بالضمان مع توصيل فوري وإمكانية الدفع عند الاستلام.',
    badge: 'ضمان معتمد 🛡️',
    color: '#10B981',
  },
  {
    icon: Cpu,
    title: 'تشخيص ذكي للأعطال بالذكاء الاصطناعي',
    desc: 'مساعد ذكي يحدد كود العطل وسببه وخطوات الإصلاح الفوري وتكلفتها التقديرية.',
    badge: 'ذكاء اصطناعي 🤖',
    color: '#38BDF8',
  },
  {
    icon: GraduationCap,
    title: 'أكاديمية ومجتمع الفنيين المعتمدين',
    desc: 'شروحات عملية بالفيديو وكورسات متخصصة لرفع كفاءة ومستوى الفنيين.',
    badge: 'تطوير مهني 📚',
    color: '#8B5CF6',
  },
];

export default function LandingScreen({ navigation }: any) {
  const [activeSlide, setActiveSlide] = useState(0);

  // Landing Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial Fade In
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: Platform.OS === 'ios' ? spacing.md : spacing.lg,
          paddingBottom: 150,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Official Clean Brand Logo Header */}
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <View
            style={{
              width: '100%',
              maxWidth: 320,
              height: 90,
              borderRadius: 16,
              backgroundColor: '#0F0F11',
              borderWidth: 1.5,
              borderColor: 'rgba(212, 175, 55, 0.4)',
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <Image
              source={require('../../../assets/tecnorexa_official_logo.jpg')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </View>
          <Text
            style={{
              color: '#D4AF37',
              fontSize: 13,
              fontWeight: '800',
              marginTop: 6,
              letterSpacing: 0.5,
              textAlign: 'center',
            }}
          >
            خبرة الصيانة ... بقوة الذكاء الاصطناعي
          </Text>
        </View>

        {/* 2. Animated 3D Sphere Showcase (The Complete Ecosystem) */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            alignItems: 'center',
            marginBottom: spacing.xl,
            width: '100%',
            maxWidth: 420,
            alignSelf: 'center',
          }}
        >
          <View
            style={{
              width: '100%',
              aspectRatio: 1,
              borderRadius: 24,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: '#0284C7',
              shadowColor: '#38BDF8',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.45,
              shadowRadius: 20,
              elevation: 12,
              backgroundColor: '#0A0A0A',
            }}
          >
            <Image
              source={require('../../../assets/tecnorexa_sphere_showcase.jpg')}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          {/* Glowing Animated Ecosystem Badge */}
          <View
            style={{
              backgroundColor: '#0C2A4D',
              borderWidth: 1.5,
              borderColor: '#38BDF8',
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.lg,
              paddingVertical: 8,
              marginTop: -20,
              zIndex: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              shadowColor: '#38BDF8',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.6,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Sparkles size={16} color="#38BDF8" />
            <Text style={{ color: '#F0F9FF', fontSize: 13, fontWeight: '900' }}>
              كل ما يحتاجه الفني والعميل في مكان واحد 🌍
            </Text>
          </View>
        </Animated.View>

        {/* 3. Core Ecosystem Pillars */}
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            alignSelf: 'center',
            gap: spacing.sm,
            marginBottom: spacing.xl,
          }}
        >
          {APP_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            const isSelected = activeSlide === idx;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.85}
                onPress={() => setActiveSlide(idx)}
                style={{
                  backgroundColor: isSelected ? '#18181B' : '#121214',
                  borderRadius: 16,
                  padding: spacing.md,
                  borderWidth: 1.5,
                  borderColor: isSelected ? pillar.color : '#27272A',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: `${pillar.color}18`,
                    borderWidth: 1,
                    borderColor: `${pillar.color}44`,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} color={pillar.color} />
                </View>

                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <View
                      style={{
                        backgroundColor: `${pillar.color}22`,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: pillar.color, fontSize: 10, fontWeight: '800' }}>
                        {pillar.badge}
                      </Text>
                    </View>
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>
                      {pillar.title}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: '#9CA3AF',
                      fontSize: 12,
                      lineHeight: 18,
                      textAlign: 'right',
                    }}
                  >
                    {pillar.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4. Trust Badges */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: spacing.lg,
            marginBottom: spacing.xl,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700' }}>اعتماد هندسي كامل</Text>
            <ShieldCheck size={14} color="#D4AF37" />
          </View>
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#3F3F46' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ color: '#A1A1AA', fontSize: 11, fontWeight: '700' }}>دعم فني متواصل 24/7</Text>
            <Clock size={14} color="#10B981" />
          </View>
        </View>

        {/* 5. Action Buttons */}
        <View style={{ width: '100%', maxWidth: 440, alignSelf: 'center', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.9}
            style={{
              backgroundColor: '#D4AF37',
              height: 54,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text style={{ color: '#0A0A0A', fontSize: 16, fontWeight: '900' }}>
              تسجيل الدخول
            </Text>
            <ArrowRight size={18} color="#0A0A0A" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#18181B',
              height: 52,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#3F3F46',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800' }}>
              إنشاء حساب جديد
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('OTP')}
            activeOpacity={0.7}
            style={{
              paddingVertical: spacing.sm,
              alignItems: 'center',
              marginTop: 2,
            }}
          >
            <Text style={{ color: '#D4AF37', fontSize: 13, fontWeight: '700' }}>
              الدخول السريع عبر رمز التحقق (SMS) 📱
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Main', { screen: 'Home' })}
            activeOpacity={0.7}
            style={{
              paddingVertical: spacing.sm,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#A1A1AA', fontSize: 13, fontWeight: '700' }}>
              تصفح التطبيق والسوق كزائر 🛒
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
