// src/screens/FAQ/FAQScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
} from 'react-native';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/common';

const FAQ_DATA = [
  {
    id: '1',
    question: 'كيف يمكنني التسجيل في المنصة؟',
    answer: 'يمكنك التسجيل بسهولة برقم الهاتف والاسم وكلمة المرور، ويصلك رمز تأكيد فوري عبر رسالة SMS، وإدخال البريد الإلكتروني اختياري تماماً.',
    category: 'الحساب',
  },
  {
    id: '2',
    question: 'كيف أطلب صيانة منزلية؟',
    answer: 'من خلال قسم "الدعم الفني" أو "طلب صيانة"، اختر نوع الجهاز، اكتب وصف المشكلة، وسيتم توجيه طلبك لأقرب فني متخصص.',
    category: 'الصيانة',
  },
  {
    id: '3',
    question: 'ما هي رسوم اشتراك الفنيين؟',
    answer: 'رسوم الاشتراك السنوي للفنيين هي 300 جنيه مصري، تدفع مرة واحدة لتفعيل الحساب واستقبال طلبات الصيانة ونشر الكورسات.',
    category: 'الفنيين',
  },
  {
    id: '4',
    question: 'كيف يمكنني شراء قطع غيار؟',
    answer: 'من خلال قسم "السوق"، يمكنك تصفح المنتجات، إضافتها للسلة، ثم إتمام عملية الشراء عبر المحفظة أو الدفع عند الاستلام.',
    category: 'السوق',
  },
  {
    id: '5',
    question: 'ما هي طرق الدفع المتاحة؟',
    answer: 'يدعم التطبيق الدفع عبر المحفظة الرقمية، البطاقات البنكية (Stripe)، والدفع عند الاستلام (كاش).',
    category: 'المدفوعات',
  },
  {
    id: '6',
    question: 'كيف أتواصل مع الدعم الفني؟',
    answer: 'يمكنك التواصل عبر قسم "تذاكر الدعم" أو الشات المباشر مع فريق الدعم المتاح 24/7.',
    category: 'الدعم',
  },
  {
    id: '7',
    question: 'هل يمكنني أن أصبح فني معتمد؟',
    answer: 'نعم، من خلال قسم "طلب الترقية"، ادفع رسوم الاشتراك 300 جنيه، وقدم طلبك وسيتم مراجعته من قبل الإدارة.',
    category: 'الفنيين',
  },
  {
    id: '8',
    question: 'كيف أتابع طلبات الصيانة الخاصة بي؟',
    answer: 'من خلال قسم "طلباتي" يمكنك تتبع حالة كل طلب، ومعرفة موعد وصول الفني، وتقييم الخدمة بعد الانتهاء.',
    category: 'الطلبات',
  },
];

const FAQItem = ({ item }: { item: typeof FAQ_DATA[0] }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={{ color: colors.white, fontWeight: '900', fontSize: typography.sizes.md, textAlign: 'right' }}>
            {item.question}
          </Text>
          <Text style={{ color: colors.primary, fontSize: typography.sizes.xs, marginTop: 2 }}>
            {item.category}
          </Text>
        </View>
        {expanded ? <ChevronUp color={colors.primary} size={20} /> : <ChevronDown color={colors.gray} size={20} />}
      </TouchableOpacity>

      {expanded && (
        <View style={{ marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#27272A' }}>
          <Text style={{ color: '#D4D4D8', fontSize: typography.sizes.sm, textAlign: 'right', lineHeight: 22 }}>
            {item.answer}
          </Text>
        </View>
      )}
    </Card>
  );
};

export default function FAQScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...Array.from(new Set(FAQ_DATA.map(item => item.category)))];

  const filteredData = FAQ_DATA.filter(item => {
    const matchSearch = !searchQuery.trim() || item.question.includes(searchQuery) || item.answer.includes(searchQuery);
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: '#0A0A0A' },
        
      ]}
    >
      <View style={{ backgroundColor: '#141414', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: '#27272A' }}>
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: colors.white, fontSize: typography.sizes.xxxl, fontWeight: '900' }}>
            الأسئلة الشائعة ❓
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else if (navigation?.navigate) {
                navigation.navigate('Support');
              }
            }}
            style={{ padding: spacing.sm }}
          >
            <Text style={{ color: colors.gray, fontSize: typography.sizes.lg }}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ color: colors.gray, fontSize: typography.sizes.sm, textAlign: 'right', marginTop: 4 }}>
          إجابات لأكثر الأسئلة تكراراً
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A', borderRadius: borderRadius.md, paddingHorizontal: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: '#27272A' }}>
          <Search color={colors.primary} size={20} />
          <TextInput
            style={{ flex: 1, textAlign: 'right', paddingVertical: spacing.sm, color: colors.white, fontSize: typography.sizes.md }}
            placeholder="ابحث عن سؤال..."
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm }}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: 6,
                borderRadius: borderRadius.sm,
                backgroundColor: selectedCategory === cat ? colors.primary : '#1F1F23',
                borderWidth: 1,
                borderColor: selectedCategory === cat ? colors.primary : '#27272A',
              }}
            >
              <Text style={{ color: selectedCategory === cat ? '#0A0A0A' : colors.gray, fontWeight: '800', fontSize: typography.sizes.xs }}>
                {cat === 'all' ? 'الكل' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        renderItem={({ item }) => <FAQItem item={item} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <HelpCircle color={colors.gray} size={48} />
            <Text style={{ color: colors.gray, fontSize: typography.sizes.lg, marginTop: spacing.md }}>لا توجد نتائج</Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('Support')}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          left: 20,
          backgroundColor: colors.primary,
          padding: spacing.md,
          borderRadius: borderRadius.md,
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.sm,
        }}
      >
        <MessageCircle color={colors.dark} size={20} />
        <Text style={{ color: colors.dark, fontWeight: '900', fontSize: typography.sizes.md }}>
          لم تجد إجابتك؟ تواصل مع الدعم
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
