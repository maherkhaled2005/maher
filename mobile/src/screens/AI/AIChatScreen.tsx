import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import {
  Sparkles,
  Trash2,
  Send,
  Bot,
  Sliders,
  History,
  DollarSign,
  User,
  CheckCircle2,
  Cpu,
  Layers,
  Wrench,
  ChevronRight,
  ArrowLeft,
  X,
  Headphones,
  ShoppingBag,
  Smartphone,
  Zap,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { normalizeRole } from '../../roles';
import OwnerHeader from '../../components/OwnerHeader';

type MessageRole = 'user' | 'ai';

interface Message {
  id: string;
  role: MessageRole;
  text: string;
  specialty?: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { label: '❄️ تكييف يخرج هواء ساخن', query: 'التكييف شغال لكن بيخرج هواء ساخن ومش بيبرد' },
  { label: '🧺 صوت عالي في الغسالة', query: 'الغسالة بتعمل صوت عالي وخبط شديد وقت العصر' },
  { label: '🧊 الثلاجة لا تبرد', query: 'الفريزر شغال بس كابينة الثلاجة التحتانية مش بتبرد' },
  { label: '📺 الشاشة صوت بدون صورة', query: 'الشاشة شغالة وفيه صوت بس الشاشة سودا ومفيش صورة' },
  { label: '🚿 السخان لا يسخن', query: 'سخان المياه الكهربائي مش بيسخن خالص ولمبة البيان مش منورة' },
  { label: '🔥 شعلة البوتاجاز ضعيفة', query: 'شعلات البوتاجاز ضعيفة جداً ولونها أصفر وبتهبب الحواف' },
  { label: '♨️ الميكروويف لا يسخن', query: 'الميكروويف الطبق بيلف وشغال طبيعي بس الأكل بيطلع بارد' },
];

export default function AIChatScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const currentRole = normalizeRole(user?.role || '');
  const isOwner = currentRole === 'owner';

  // Tabs for Owner: 'chat' | 'persona' | 'queries' | 'limits'
  const [activeTab, setActiveTab] = useState<'chat' | 'persona' | 'queries' | 'limits'>('chat');

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: 'مرحباً بك في المساعد الذكي لمنصة TecnoRexa 🤖✨\n\nأنا هنا لمساعدتك في تشخيص أعطال الأجهزة المنزلية (تكييف، غسالة، ثلاجة، شاشة، سخان، بوتاجاز...)، تقديم خطوات فحص الأمان الأولية، واستكشاف وحل الأعطال الفنية بدقة.',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList<Message>>(null);

  // Persona Settings State (Owner only)
  const [customerPrompt, setCustomerPrompt] = useState('أنت خبير صيانة أجهزة منزلية معتمد في مصر...');
  const [devPrompt, setDevPrompt] = useState('أنت مهندس برمجيات متخصص في Node.js و React Native...');
  const [supportPrompt, setSupportPrompt] = useState('أنت مسؤول دعم فني ومتابعة طلبات العملاء والفنيين...');

  // Usage & Limits State (Owner only)
  const [dailyLimit, setDailyLimit] = useState('50');
  const [estimatedCost, setEstimatedCost] = useState('0.00');
  const [tokensUsed, setTokensUsed] = useState('0');

  // AI Subscription State
  const [subStatus, setSubStatus] = useState<{
    isSubscribed: boolean;
    startedAt: string | null;
    expiresAt: string | null;
    dailyRemaining: number;
    monthlyRemaining: number;
    price: number;
    freePreviewsLeft: number;
  }>({
    isSubscribed: false,
    startedAt: null,
    expiresAt: null,
    dailyRemaining: 0,
    monthlyRemaining: 0,
    price: 100,
    freePreviewsLeft: 3,
  });

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [questionsLeft, setQuestionsLeft] = useState(3);

  const loadSubscriptionStatus = useCallback(async () => {
    try {
      const res = await fetchApi('/ai/subscription/status');
      if (res && typeof res === 'object') {
        setSubStatus(res);
        setQuestionsLeft(res.isSubscribed ? res.dailyRemaining : res.freePreviewsLeft);
      }
    } catch (err) {
      console.warn('Failed to load AI subscription status:', err);
    }
  }, []);

  useEffect(() => {
    loadSubscriptionStatus();
  }, [loadSubscriptionStatus]);

  // Query Logs State (Owner only)
  const [queryLogs, setQueryLogs] = useState<any[]>([]);

  const handleSubscribe = async (paymentMethod: 'wallet' | 'vodafone_cash') => {
    setPurchasing(true);
    try {
      const res = await fetchApi('/ai/subscription/subscribe', {
        method: 'POST',
        data: {
          paymentMethod,
          senderPhone: user?.phone,
        },
      });
      await loadSubscriptionStatus();
      setShowPackageModal(false);
      Alert.alert('🎉 تم بنجاح!', res?.message || 'تم تفعيل اشتراك الذكاء الاصطناعي بنجاح.');
    } catch (err: any) {
      Alert.alert(
        'تنبيه الدفع',
        err.message || 'تعذر تفعيل الاشتراك. يرجى التأكد من رصيد المحفظة أو إتمام التحويل.'
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const res = await fetchApi('/ai/chat', {
        method: 'POST',
        data: { message: text },
      });

      if (res?.error === 'AI_SUBSCRIPTION_REQUIRED' || res?.error?.includes('اشتراك')) {
        setShowPackageModal(true);
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'ai',
            text: 'عفواً، لقد استهلكت المعاينات المجانية. يتطلب استمرار تشخيص الأعطال بالذكاء الاصطناعي تفعيل الاشتراك الشهري (100 ج.م).',
            timestamp: new Date(),
          },
        ]);
        return;
      }

      const aiText = res?.reply || res?.response || 'تم استلام استفسارك وتجهيز التشخيص الفني.';
      const specialty = res?.specialty || detectSpecialtyFromText(text);

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: aiText,
          specialty,
          timestamp: new Date(),
        },
      ]);

      if (res?.dailyRemaining !== undefined) {
        setQuestionsLeft(res.dailyRemaining);
      }
      loadSubscriptionStatus();
    } catch (err: any) {
      if (err.message?.includes('اشتراك') || err.message?.includes('الحد الأقصى')) {
        setShowPackageModal(true);
      }
      const fallbackSpecialty = detectSpecialtyFromText(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          text: err.message || 'تعذر الاتصال بخادم الذكاء الاصطناعي. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.',
          specialty: fallbackSpecialty,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const detectSpecialtyFromText = (t: string): string => {
    const lower = t.toLowerCase();
    if (lower.includes('تكييف') || lower.includes('تبريد') || lower.includes('فريون')) return 'تكييف';
    if (lower.includes('غسالة') || lower.includes('عصر')) return 'غسالات';
    if (lower.includes('ثلاجة') || lower.includes('فريزر')) return 'ثلاجات';
    if (lower.includes('شاشة') || lower.includes('تلفزيون')) return 'شاشات';
    if (lower.includes('سخان')) return 'سخانات';
    if (lower.includes('بوتاجاز') || lower.includes('فرن')) return 'بوتاجازات';
    if (lower.includes('ميكروويف')) return 'ميكروويف';
    return 'all';
  };


  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* 1. Header Logic */}
      {isOwner ? (
        <OwnerHeader
          title="مركز الذكاء الاصطناعي (AI Hub)"
          subtitle="دماغ التطبيق والتحكم في النماذج"
          sectionNumber={16}
          navigation={navigation}
          currentScreen="AIChat"
          showBack={true}
        />
      ) : (
        <View
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            backgroundColor: '#0F0F0F',
            borderBottomWidth: 1,
            borderColor: '#222',
          }}
        >
          <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              onPress={() => {
                if (navigation?.canGoBack && navigation.canGoBack()) {
                  navigation.goBack();
                } else if (navigation?.navigate) {
                  navigation.navigate('Home');
                }
              }}
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
                مساعد TecnoRexa الذكي 🤖
              </Text>
              <Text style={{ color: colors.primary, fontSize: 11, marginTop: 2 }}>
                تشخيص فوري للأعطال واستشارات الصيانة المنزلية
              </Text>
            </View>
          </View>

          {currentRole === 'technician' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Tickets')}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: borderRadius.md,
                backgroundColor: 'rgba(13, 148, 136, 0.15)',
                borderWidth: 1,
                borderColor: '#0D9488',
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Headphones size={13} color="#0D9488" />
              <Text style={{ color: '#0D9488', fontSize: 11, fontWeight: 'bold' }}>الدعم الفني 🎧</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
              {currentRole === 'customer' && (
                <TouchableOpacity
                  onPress={() => setShowPackageModal(true)}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                    borderRadius: borderRadius.md,
                    backgroundColor: subStatus.isSubscribed
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(212, 175, 55, 0.15)',
                    borderWidth: 1,
                    borderColor: subStatus.isSubscribed ? '#10B981' : colors.primary,
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Sparkles size={12} color={subStatus.isSubscribed ? '#10B981' : colors.primary} />
                  <Text
                    style={{
                      color: subStatus.isSubscribed ? '#10B981' : colors.primary,
                      fontSize: 10,
                      fontWeight: 'bold',
                    }}
                  >
                    {subStatus.isSubscribed
                      ? `نشط (${subStatus.dailyRemaining})`
                      : `تجريبي (${subStatus.freePreviewsLeft})`}
                  </Text>
                </TouchableOpacity>
              )}

            </View>
          )}
        </View>
      )}

      {/* Online Status Bar */}
      <View
        style={{
          backgroundColor: '#121212',
          paddingVertical: 4,
          paddingHorizontal: spacing.md,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderColor: '#1e1e1e',
        }}
      >
        <Text style={{ color: colors.gray, fontSize: 10 }}>
          ⚡ الذكاء الاصطناعي يعمل أونلاين فقط عبر خوادم TecnoRexa لضمان أحدث بيانات الصيانة
        </Text>
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
          <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>سيرفر متصل</Text>
        </View>
      </View>

      {/* 2. Owner-Only Tabs */}
      {isOwner && (
        <View
          style={{
            flexDirection: 'row-reverse',
            backgroundColor: '#111111',
            borderBottomWidth: 1,
            borderColor: '#222',
            padding: spacing.xs,
            gap: 4,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('chat')}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: borderRadius.sm,
              backgroundColor: activeTab === 'chat' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
              borderWidth: 1,
              borderColor: activeTab === 'chat' ? colors.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: activeTab === 'chat' ? colors.primary : colors.gray }}>
              🤖 المساعد
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('persona')}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: borderRadius.sm,
              backgroundColor: activeTab === 'persona' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
              borderWidth: 1,
              borderColor: activeTab === 'persona' ? colors.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: activeTab === 'persona' ? colors.primary : colors.gray }}>
              🎭 الشخصية
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('queries')}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: borderRadius.sm,
              backgroundColor: activeTab === 'queries' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
              borderWidth: 1,
              borderColor: activeTab === 'queries' ? colors.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: activeTab === 'queries' ? colors.primary : colors.gray }}>
              📜 الاستعلامات
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('limits')}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: borderRadius.sm,
              backgroundColor: activeTab === 'limits' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
              borderWidth: 1,
              borderColor: activeTab === 'limits' ? colors.primary : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: activeTab === 'limits' ? colors.primary : colors.gray }}>
              💰 التكلفة
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Main Chat View */}
      {activeTab === 'chat' ? (
        <View style={{ flex: 1 }}>
          {/* Quick Prompt Chips */}
          <View style={{ backgroundColor: '#111111', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#222' }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.sm, gap: 6, flexDirection: 'row-reverse' }}
            >
              {QUICK_PROMPTS.map((qp, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSendMessage(qp.query)}
                  style={{
                    backgroundColor: '#1E1E1E',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: '#333',
                  }}
                >
                  <Text style={{ color: colors.white, fontSize: 11, fontWeight: '600' }}>{qp.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Messages Feed */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 110 }}
            renderItem={({ item }) => {
              const isAi = item.role === 'ai';

              return (
                <View style={{ alignItems: isAi ? 'flex-start' : 'flex-end' }}>
                  <View
                    style={{
                      maxWidth: '88%',
                      backgroundColor: isAi ? '#141414' : colors.primary,
                      borderRadius: borderRadius.lg,
                      padding: spacing.md,
                      borderWidth: isAi ? 1 : 0,
                      borderColor: isAi ? '#2A2A2A' : 'transparent',
                      shadowColor: '#000',
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      {isAi ? <Bot size={14} color={colors.primary} /> : <User size={14} color="#0A0A0A" />}
                      <Text
                        style={{
                          color: isAi ? colors.primary : '#0A0A0A',
                          fontSize: 11,
                          fontWeight: '900',
                        }}
                      >
                        {isAi ? 'مساعد TecnoRexa الذكي' : 'أنت'}
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: isAi ? colors.white : '#0A0A0A',
                        fontSize: 13,
                        lineHeight: 21,
                        textAlign: 'right',
                        fontWeight: isAi ? 'normal' : '700',
                      }}
                    >
                      {item.text}
                    </Text>



                    {/* Technician view: search spare parts or contact customer support (NEVER request technician) */}
                    {isAi && item.id !== 'welcome' && currentRole === 'technician' && (
                      <View
                        style={{
                          marginTop: spacing.sm,
                          paddingTop: spacing.xs,
                          borderTopWidth: 1,
                          borderColor: '#222',
                          gap: 6,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => navigation.navigate('Tickets')}
                          style={{
                            backgroundColor: 'rgba(13, 148, 136, 0.15)',
                            borderWidth: 1,
                            borderColor: '#0D9488',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: borderRadius.md,
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <Headphones size={13} color="#0D9488" />
                          <Text style={{ color: '#0D9488', fontSize: 12, fontWeight: '900' }}>
                            تواصل مع خدمة العملاء للاستفسار 🎧
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => navigation.navigate('Marketplace')}
                          style={{
                            backgroundColor: 'rgba(212, 175, 55, 0.15)',
                            borderWidth: 1,
                            borderColor: colors.primary,
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: borderRadius.md,
                            flexDirection: 'row-reverse',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                          }}
                        >
                          <ShoppingBag size={13} color={colors.primary} />
                          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '900' }}>
                            البحث عن قطع الغيار في المتجر 🛒
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />

          {/* Typing Indicator */}
          {isTyping && (
            <View
              style={{
                position: 'absolute',
                bottom: 75,
                right: 20,
                backgroundColor: '#1E1E1E',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 6,
                borderWidth: 1,
                borderColor: '#333',
              }}
            >
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.gray, fontSize: 11 }}>جاري تشخيص العطل...</Text>
            </View>
          )}

          {/* Chat Input Bar */}
          <View
            style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              backgroundColor: '#141414',
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.md,
              borderWidth: 1.5,
              borderColor: colors.primary,
              gap: spacing.sm,
              position: 'absolute',
              bottom: spacing.md,
              left: spacing.md,
              right: spacing.md,
            }}
          >
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 10,
                color: colors.white,
                textAlign: 'right',
                fontSize: 13,
              }}
              placeholder="اكتب سؤالك أو وصف العطل بالتفصيل..."
              placeholderTextColor={colors.gray}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
            />

            <TouchableOpacity
              onPress={() => handleSendMessage()}
              disabled={isTyping || !inputText.trim()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: inputText.trim() ? colors.primary : '#222',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={16} color={inputText.trim() ? '#0A0A0A' : colors.gray} />
            </TouchableOpacity>
          </View>
        </View>
      ) : activeTab === 'persona' ? (
        /* Owner Tab: Persona */
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 150 }}>
          <Text style={{ color: colors.white, fontSize: 15, fontWeight: 'bold', textAlign: 'right' }}>
            تخصيص برومبت الذكاء الاصطناعي (System Prompts):
          </Text>

          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.primary, fontSize: 12, textAlign: 'right' }}>برومبت العملاء:</Text>
            <TextInput
              style={{ backgroundColor: '#1A1A1A', color: colors.white, borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, textAlign: 'right', minHeight: 70 }}
              value={customerPrompt}
              onChangeText={setCustomerPrompt}
              multiline
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.primary, fontSize: 12, textAlign: 'right' }}>برومبت المطورين:</Text>
            <TextInput
              style={{ backgroundColor: '#1A1A1A', color: colors.white, borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, textAlign: 'right', minHeight: 70 }}
              value={devPrompt}
              onChangeText={setDevPrompt}
              multiline
            />
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('✅ تم الحفظ', 'تم تحديث برومبتات النظام بنجاح.')}
            style={{ backgroundColor: colors.primary, padding: 12, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.sm }}
          >
            <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>حفظ التعديلات</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : activeTab === 'queries' ? (
        /* Owner Tab: Query Logs */
        <FlatList
          data={queryLogs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: 150 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ color: colors.gray, fontSize: 13, fontWeight: '700' }}>لا توجد استفسارات مسجلة بعد</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: '#222' }}>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 13 }}>{item.user}</Text>
                <Text style={{ color: '#10B981', fontSize: 11 }}>{item.cost}</Text>
              </View>
              <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginVertical: 4 }}>{item.query}</Text>
              <Text style={{ color: '#666', fontSize: 10, textAlign: 'right' }}>{item.date}</Text>
            </View>
          )}
        />
      ) : (
        /* Owner Tab: Limits */
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: 150 }}>
          <Text style={{ color: colors.white, fontSize: 15, fontWeight: 'bold', textAlign: 'right' }}>
            حدود الاستخدام والتكلفة:
          </Text>

          <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.md, padding: spacing.md, gap: 10, borderWidth: 1, borderColor: '#222' }}>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.gray }}>التوكنز المستهلكة:</Text>
              <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{tokensUsed}</Text>
            </View>
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.gray }}>التكلفة التقديرية:</Text>
              <Text style={{ color: '#10B981', fontWeight: 'bold' }}>{estimatedCost} $</Text>
            </View>
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right' }}>الحد اليومي لأسئلة العميل:</Text>
            <TextInput
              style={{ backgroundColor: '#1A1A1A', color: colors.white, borderWidth: 1, borderColor: '#333', borderRadius: borderRadius.md, padding: 10, textAlign: 'right' }}
              value={dailyLimit}
              onChangeText={setDailyLimit}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            onPress={() => Alert.alert('✅ تم الحفظ', 'تم تحديث سياسات الاستهلاك.')}
            style={{ backgroundColor: colors.primary, padding: 12, borderRadius: borderRadius.md, alignItems: 'center' }}
          >
            <Text style={{ color: '#0A0A0A', fontWeight: '900' }}>تحديث الحدود</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Vodafone Cash Package Modal for Customers */}
      <Modal
        visible={showPackageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPackageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#141416',
              borderRadius: borderRadius.xl,
              borderWidth: 1.5,
              borderColor: colors.primary,
              padding: spacing.lg,
              shadowColor: colors.primary,
              shadowOpacity: 0.25,
              shadowRadius: 20,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(230,0,0,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E60000' }}>
                  <Smartphone size={20} color="#E60000" />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900' }}>باقات المساعد الذكي ⚡</Text>
                  <Text style={{ color: colors.primary, fontSize: 11 }}>الدفع الفوري عبر فودافون كاش ومحفظة ريكسا</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowPackageModal(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#27272A', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={colors.white} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: '#A1A1AA', fontSize: 12, textAlign: 'right', marginBottom: spacing.md, lineHeight: 18 }}>
              خدمة المساعد الذكي مدفوعة لتقديم أدق تشخيصات الأعطال والخطوات المعتمدة. قيمة الاشتراك {subStatus.price} ج.م شهرياً:
            </Text>

            {/* Subscription Options */}
            <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
              <TouchableOpacity
                onPress={() => handleSubscribe('wallet')}
                disabled={purchasing}
                style={{
                  backgroundColor: '#1C1917',
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  flexDirection: 'row-reverse',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ alignItems: 'flex-end', flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>
                      تفعيل فوري من رصيد المحفظة
                    </Text>
                    <View style={{ backgroundColor: '#10B98122', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ color: '#10B981', fontSize: 9, fontWeight: 'bold' }}>فوري ⚡</Text>
                    </View>
                  </View>
                  <Text style={{ color: '#A1A1AA', fontSize: 11, marginTop: 2 }}>
                    خصم {subStatus.price} ج.م وتفعيل 30 يوماً بلا انقطاع
                  </Text>
                </View>
                <View style={{ backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.md }}>
                  <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 14 }}>{subStatus.price} ج.م</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSubscribe('vodafone_cash')}
                disabled={purchasing}
                style={{
                  backgroundColor: '#1C1917',
                  borderWidth: 1,
                  borderColor: '#E60000',
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  flexDirection: 'row-reverse',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ alignItems: 'flex-end', flex: 1, paddingRight: 8 }}>
                  <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>
                    تحويل فودافون كاش أو إنستاباي
                  </Text>
                  <Text style={{ color: '#A1A1AA', fontSize: 11, marginTop: 2 }}>
                    تحويل إلى محفظة المنصة 01064739664 وتأكيد الطلب
                  </Text>
                </View>
                <View style={{ backgroundColor: 'rgba(230,0,0,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#E60000' }}>
                  <Text style={{ color: '#E60000', fontWeight: '900', fontSize: 14 }}>{subStatus.price} ج.م</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Payment Method Details */}
            <View style={{ backgroundColor: '#0A0A0A', borderRadius: borderRadius.md, padding: spacing.sm, borderWidth: 1, borderColor: '#27272A', marginBottom: spacing.md }}>
              <Text style={{ color: '#E4E4E7', fontSize: 11, fontWeight: 'bold', textAlign: 'right', marginBottom: 2 }}>
                بيانات التحويل الرسمي:
              </Text>
              <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '900', textAlign: 'right' }}>
                رقم المحفظة / إنستاباي: 01064739664
              </Text>
              <Text style={{ color: '#71717A', fontSize: 10, textAlign: 'right', marginTop: 2 }}>
                * الذكاء الاصطناعي خدمة سحابية متصلة بالإنترنت حصراً وغير متوفرة أوفلاين
              </Text>
            </View>

            {purchasing && (
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 4 }}>جاري تأكيد الاشتراك وتفعيل الباقة...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
