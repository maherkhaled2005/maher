import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  DeviceEventEmitter,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Crown,
  Briefcase,
  Code2,
  Headphones,
  Wrench,
  Store,
  User,
  ArrowRight,
  X,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme';
import { normalizeRole } from '../utils/permissions';
import { useAuthStore } from '../store/authStore';

interface OnboardingModalProps {
  user?: any;
}

interface RoleInfoItem {
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  features: string[];
  terms: string[];
}

const ROLE_INFO: Record<string, RoleInfoItem> = {
  owner: {
    title: 'مرحباً بك سيادة المالك 👑',
    subtitle: 'إدارة منصة TecnoRexa — غرفة القيادة والسيطرة المركزية',
    icon: Crown,
    color: '#D4AF37',
    features: [
      'تحكم كامل في كافة العمليات المالية والتقارير التنفيذية الشاملة.',
      'إدارة المستخدمين والموظفين وتعيين وتعديل الصلاحيات وتجميد الحسابات.',
      'سجل أمني وتدقيق مشدد لجميع استدعاءات النظام والأوامر الحساسة.',
      'متابعة ومراجعة طلبات التوثيق والترقيات واعتمادات الرسوم.',
    ],
    terms: [
      '1. الحفاظ المطلق على سرية وخصوصية بيانات كافة المستخدمين والعمليات المالية.',
      '2. مراجعة واعتماد طلبات التوثيق والتحويلات المالية بأمانة ونزاهة وعدالة تامة.',
      '3. الالتزام بعدم استغلال الصلاحيات السيادية إلا لصالح استقرار وحماية المنصة.',
      '4. تطبيق معايير الأمان ومراقبة سجلات التدقيق (Audit Logs) بشكل دوري.',
      '5. التدخل السريع في حالات الطوارئ ووضع الصيانة لحماية أصول واستقرار المنظومة.',
      '6. التوزيع العادل للعمولات بين الشركاء والفنيين والتجار دون تمييز أو انحياز.',
      '7. دعم وتطوير الكوادر الإدارية والتقنية وتوفير بيئة عمل احترافية متكاملة.',
      '8. الالتزام بالتشريعات والقوانين المصرية المنظمة لخدمات الصيانة والتجارة الإلكترونية.',
      '9. حظر أي بيانات وهمية أو أرقام غير حقيقية والاعتماد الكامل على الشفافية الرقمية.',
      '10. وضع خدمة ورضا المواطن والعميل المصري كهدف أسمى للمنظومة فوق أي اعتبار.',
    ],
  },
  programmer: {
    title: 'مرحباً بك في مركز العمليات البرمجية 💻',
    subtitle: 'الدعم التقني والبرمجي — المسؤول التقني ومصمم التطبيق',
    icon: Code2,
    color: '#8B5CF6',
    features: [
      'توزيع وإدارة المهام البرمجية (Dev Tasks) واستهداف مطورين محددين.',
      'استقبال وحل تقارير الأخطاء والـ Bugs البرمجية بالـ Stack Traces.',
      'مستودع ومكتبة الأكواد المشتركة (Code Snippets) والدوال المساعدة.',
      'غرفة دردشة المبرمجين المشفرة ومراقبة استقرار الخوادم وقواعد البيانات.',
    ],
    terms: [
      '1. الشيفرات البرمجية ومفاتيح الاتصال والتشفير أمانة عظمى يحظر تسريبها مطلقاً.',
      '2. منع إدخال أي بيانات وهمية أو أرقام ثابتة في الكود (Zero Mock Data).',
      '3. خلو واجهات المستخدم بنسبة 100% من المصطلحات التقنية وعناوين الخوادم والمنافذ.',
      '4. الاعتماد الكامل على قواعد البيانات الحقيقية والربط الصامت بينها (High Availability).',
      '5. كتابة كود نظيف وموثق وقابل للتوسع والصيانة السريعة وفق المعايير المؤسسية.',
      '6. معالجة الثغرات والـ Bugs البرمجية فور إبلاغها مع الحفاظ على سرعة الاستجابة.',
      '7. الالتزام الصارم بالهوية الفخمة (الأسود #0A0A0A والذهبي #D4AF37) وألوان الرتب.',
      '8. ضمان استجابة وتوافق الواجهات لكافة مقاسات الشاشات والهواتف (Scrollable & Centered).',
      '9. عدم تعديل أي سجل في قاعدة البيانات يدوياً إلا عبر واجهات برمجية مؤمنة ومسجلة.',
      '10. حماية خصوصية المستخدمين وتطبيق أعلى معايير التشفير لكلمات المرور والجلسات.',
    ],
  },
  manager: {
    title: 'مرحباً بك في لوحة الإدارة التشغيلية 👔',
    subtitle: 'إدارة العمليات الميدانية والرقابة اللوجستية وضبط الجودة',
    icon: Briefcase,
    color: '#3B82F6',
    features: [
      'فحص واعتماد منتجات وقطع غيار التجار قبل ظهورها في المتجر.',
      'مراجعة طلبات ترقية الفنيين والتجار بإيصالات التحويل وأرقام الهواتف.',
      'مراقبة أداء وجودة فريق خدمة العملاء وتقييمات الـ 5 نجوم.',
      'إدارة وتوزيع المستودعات وحركات المخزون المركزية بين المحافظات.',
    ],
    terms: [
      '1. الحيادية والنزاهة المطلقة في فحص واعتماد منتجات وموردي قطع الغيار.',
      '2. المراجعة الدقيقة لشهادات وخبرات الفنيين المتقدمين قبل منحهم الاعتماد الرسمي.',
      '3. الرقابة الصارمة على سرعة استجابة فريق خدمة العملاء ونسب رضا الزوار.',
      '4. متابعة حركات المخزون والمستودعات المركزية ومنع أي تلاعب أو عجز في الكميات.',
      '5. الفصل الفوري والعادل في النزاعات والشكاوى بين العملاء والفنيين والتجار.',
      '6. التأكد من الالتزام بلائحة الأسعار المعتمدة ومواجهة المغالاة في تكلفة الصيانة.',
      '7. التدقيق الدوري في طلبات الترقية وإيصالات التحويل المالية مع فودافون كاش.',
      '8. إعداد التقارير التشغيلية الواقعية بدقة متناهية للمالك دون إخفاء أي خلل.',
      '9. حظر أي استغلال وظيفي والتعامل كقدوة مهنية لفريق العمل الميداني.',
      '10. التطوير المستمر للخدمات اللوجستية وتوسيع شبكة التغطية بكافة محافظات مصر الـ 27.',
    ],
  },
  customer_support: {
    title: 'مرحباً بك في بوابة خدمة العملاء 🎧',
    subtitle: 'استقبال وتلبية استفسارات وشكاوى عملاء المنظومة',
    icon: Headphones,
    color: '#EC4899',
    features: [
      'استقبال تذاكر الدعم الفني والمحادثات المباشرة من المستخدمين والفنيين.',
      'نظام تقييم الجودة (5 نجوم) بعد كل محادثة لضمان رضا العملاء.',
      'تصعيد المشكلات التقنية للمبرمجين، والمشكلات التشغيلية للمدير.',
      'الرد الفوري والتعامل الاحترافي مع استفسارات الصيانة والقطع والطلبات.',
    ],
    terms: [
      '1. الرد الفوري واللبق على مدار الساعة باحترافية واحترام تام لجميع العملاء.',
      '2. الاستماع الواعي لشكوى العميل وفهم أبعاد المشكلة الفنية قبل التوجيه.',
      '3. الحفاظ الكامل على سرية محادثات وتذاكر العملاء وبيانات هواتفهم وعناوينهم.',
      '4. تصعيد الأعطال التقنية للمطورين، والنزاعات المعقدة للمدير التنفيذي دون إبطاء.',
      '5. المتابعة الدورية للطلبات المعلقة حتى تمام تنفيذها وإغلاقها برضا العميل.',
      '6. الحرص على تحقيق أعلى تقييم جودة (5 نجوم) في ختام كل جلسة دعم وتواصل.',
      '7. عدم تقديم أي وعود فنية أو مالية تخالف اللائحة الرسمية المعتمدة للمنصة.',
      '8. مساعدة كبار السن والمستخدمين الجدد في استخدام التطبيق والطلب خطوة بخطوة.',
      '9. تسجيل وتوثيق كل شكوى بدقة في سجل التذاكر لمنع تكرار المشكلة مستقبلاً.',
      '10. تمثيل اسم وعلامة TecnoRexa بأعلى درجات الأمانة والتحضر والأخلاق المهنية.',
    ],
  },
  technician: {
    title: 'مرحباً بك في شبكة فنيي TecnoRexa 🔧',
    subtitle: 'شريك الصيانة المعتمد لخدمة منازل عملائنا في مصر',
    icon: Wrench,
    color: '#F59E0B',
    features: [
      'استقبال طلبات الصيانة المباشرة في تخصصك بالقرب من موقعك الجغرافي.',
      'مفتاح التحكم في التوفر (متاح / غير متاح) لتنظيم جدول عملك بحرية.',
      'سجل أرباح وعمولات دقيق مع إمكانية سحب المستحقات المالية بسهولة.',
      'تقييمات موثوقة من العملاء لبناء سمعة مهنية قوية في السوق المصري.',
    ],
    terms: [
      '1. الالتزام الدقيق بمواعيد الزيارات المنزلية المتفق عليها مع العميل.',
      '2. احترام حرمة وخصوصية المنازل والتعامل بأقصى درجات الأدب والأمانة.',
      '3. الفحص الفني الأمين للأجهزة وعدم ادعاء أعطال غير حقيقية أو وهمية.',
      '4. استخدام قطع غيار أصلية او (كوبي بموافقه العميل) ومطابقة لمواصفات الشركة المصنعة للجهاز.',
      '5. الالتزام بالتسعيرة الرسمية للمنصة وعدم فرض مبالغ إضافية خارج النظام.',
      '6. تقديم فاتورة وضمان صيانة معتمد بعد الانتهاء التام من الإصلاح.',
      '7. الحفاظ على نظافة المكان بعد إتمام أعمال الفك والتركيب والإصلاح.',
      '8. تحديث حالة الطلب لحظياً (في الطريق، وصلت، اكتملت) عبر تطبيقك.',
      '9. مراعاة معايير السلامة المهنية وإجراءات الأمان الكهربائي أثناء الفحص.',
      '10. السداد الفوري لعمولة المنصة والمحافظة على التقييم المرتفع لضمان استمرار الحساب.',
    ],
  },
  merchant: {
    title: 'مرحباً بك في سوق قطع الغيار المركزي 🏪',
    subtitle: 'منصة بيع وتوريد قطع الغيار المعتمدة لآلاف العملاء والفنيين',
    icon: Store,
    color: '#10B981',
    features: [
      'عرض منتجات وقطع الغيار بصور متعددة ومواصفات تفصيلية احترافية.',
      'ربط البضاعة بالمستودعات وتتبع مستويات المخزون وحالات البيع.',
      'استقبال طلبات الشراء المباشرة ومتابعة الإرسال مع شركات الشحن.',
      'إدارة العوائد المالية وأرباح المبيعات بدقة وشفافية تامة.',
    ],
    terms: [
      '1. عرض قطع غيار أصلية ومطابقة 100% للصور والمواصفات المرفوعة بالمتجر.',
      '2. حظر عرض أي قطع غيار تالفة أو غير صالحة للاستخدام المنزلي.',
      '3. الالتزام بالتسعير العادل وإتاحة خصومات خاصة للفنيين المعتمدين بالشبكة.',
      '4. سرعة تجهيز وتغليف الشحنات لمناديب الشحن لتسليمها للعميل دون أي تأخير.',
      '5. إرفاق فاتورة رسمية وشهادة ضمان مع كل قطعة غيار مباعة عبر المتجر.',
      '6. الالتزام الكامل بسياسة الاسترجاع والاستبدال المعتمدة لحماية حقوق المشتري.',
      '7. تحديث أرصدة المخزون بشكل مستمر لمنع بيع منتجات نفدت كمياتها.',
      '8. إدخال رقم التتبع (Tracking Number) فور شحن الطلب لمتابعة العميل.',
      '9. تحويل المستحقات والرسوم والتعامل بالأمانة المالية التامة دون مماطلة.',
      '10. التعاون الإيجابي مع الإدارة والدعم الفني في حل استفسارات ونزاعات المشترين.',
    ],
  },
  customer: {
    title: 'أهلاً بك في منصة TecnoRexa 👤',
    subtitle: 'المنظومة الأولى الموثقة لخدمات الصيانة المنزلية وقطع الغيار',
    icon: User,
    color: '#3B82F6',
    features: [
      'طلب وحجز أفضل الفنيين المعتمدين لخدمتك في منزلك بضمان معتمد.',
      'متجر قطع الغيار الأصلية مع الدفع عند الاستلام أو بالمحفظة الإلكترونية.',
      'مساعد الذكاء الاصطناعي لتشخيص أكواد الأعطال وتقدير التكلفة فورياً.',
      'خدمة عملاء ودعم فني متواصل على مدار الساعة لمساعدتك في أي وقت.',
    ],
    terms: [
      '1. إدخال بيانات العنوان ورقم الهاتف بدقة لتسهيل وصول الفني أو الشحنة لمنزلك.',
      '2. التواجد في الموعد المحدد لاستقبال فني الصيانة المعتمد وتيسير مهمته.',
      '3. التعامل المحترم واللبق مع الفنيين وممثلي خدمة العملاء والدعم.',
      '4. سداد قيمة الصيانة أو قطع الغيار المشتراة بالأمانة الكاملة فور الاستلام.',
      '5. فحص الخدمة أو قطعة الغيار والتأكد من استلام الفاتورة وضمان الصيانة.',
      '6. تقديم تقييم صادق وموضوعي بعد انتهاء الطلب لمساعدة المنظومة في تحسين الجودة.',
      '7. الالتزام بإلغاء الطلب خلال الـ 10 دقائق الأولى فقط في حال الرغبة في التراجع.',
      '8. استخدام مساعد الذكاء الاصطناعي للاستفسارات الصادقة والتشخيص الأولي للأجهزة.',
      '9. عدم التعامل مع الفنيين خارج المنصة لضمان حقوقك والضمان المعتمد للتطبيق.',
      '10. الإبلاغ الفوري عن أي تجاوز أو مخالفة عبر قسم الشكاوى والدعم الفني المباشر.',
    ],
  },
};

export const openRoleRulesModal = (specificRole?: string) => {
  DeviceEventEmitter.emit('SHOW_ROLE_LAWS', specificRole);
};

export default function OnboardingModal({ user: propUser }: OnboardingModalProps) {
  const { user: authUser } = useAuthStore();
  const user = propUser || authUser;

  const [visible, setVisible] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  useEffect(() => {
    if (!user || !user.id) return;
    const checkStatus = async () => {
      try {
        const normRole = normalizeRole(user.role || 'customer');
        const key = `tr_onboarded_${user.id}_${normRole}_v3`;
        const done = await AsyncStorage.getItem(key);
        if (!done) {
          setVisible(true);
        }
      } catch (e) {}
    };
    checkStatus();
  }, [user?.id, user?.role]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('SHOW_ROLE_LAWS', (customRole?: string) => {
      if (customRole) {
        setActiveRole(customRole);
      } else {
        setActiveRole(null);
      }
      setVisible(true);
    });
    return () => {
      sub.remove();
    };
  }, []);

  const handleDismiss = async () => {
    if (user?.id) {
      try {
        const normRole = normalizeRole(activeRole || user.role || 'customer');
        await AsyncStorage.setItem(`tr_onboarded_${user.id}_${normRole}_v3`, 'true');
      } catch (e) {}
    }
    setActiveRole(null);
    setVisible(false);
  };

  if (!user || !visible) return null;

  const role = normalizeRole(activeRole || user.role || 'customer');
  const info = ROLE_INFO[role] || ROLE_INFO.customer;
  const Icon = info.icon;

  const modalWidth = Math.min(screenWidth - 32, 460);
  const modalMaxHeight = Math.min(screenHeight * 0.88, 660);

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent={true}
      animationType="fade"
      onRequestClose={() => {
        setActiveRole(null);
        setVisible(false);
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 16,
        }}
      >
        <View
          style={{
            backgroundColor: '#141416',
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: '#D4AF37',
            width: modalWidth,
            maxHeight: modalMaxHeight,
            overflow: 'hidden',
            shadowColor: '#D4AF37',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          {/* Top Header Card */}
          <View
            style={{
              backgroundColor: '#18181B',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              alignItems: 'center',
              borderBottomWidth: 1,
              borderColor: '#27272A',
              position: 'relative',
            }}
          >
            <TouchableOpacity
              onPress={handleDismiss}
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#27272A',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: `${info.color}1A`,
                borderWidth: 1.5,
                borderColor: info.color,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              <Icon size={22} color={info.color} />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <Sparkles size={14} color="#D4AF37" />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900', textAlign: 'center', flexShrink: 1 }}>
                {info.title}
              </Text>
            </View>

            <Text style={{ color: '#D4AF37', fontSize: 11, fontWeight: '700', textAlign: 'center', flexShrink: 1 }}>
              {info.subtitle}
            </Text>
          </View>

          {/* Scrollable Features & Terms */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.md, gap: 8 }}
            showsVerticalScrollIndicator={true}
          >
            {/* Features */}
            <Text style={{ color: '#E4E4E7', fontSize: 12, fontWeight: '800', textAlign: 'right' }}>
              أهم مزايا وصلاحيات دورك في المنظومة:
            </Text>

            {info.features.map((feat, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  backgroundColor: '#18181B',
                  borderRadius: 10,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: '#27272A',
                  gap: 8,
                }}
              >
                <Text style={{ flex: 1, color: '#D4D4D8', fontSize: 11, lineHeight: 16, textAlign: 'right' }}>
                  {feat}
                </Text>
                <CheckCircle2 size={14} color="#10B981" style={{ marginTop: 2 }} />
              </View>
            ))}

            {/* Terms of Conduct / 10 Laws */}
            <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '900', textAlign: 'right', marginTop: 4, marginBottom: 2 }}>
              قوانين المنظومة العشرة وميثاق الشرف المهني 📜:
            </Text>

            {info.terms.map((term, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: 10,
                  padding: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                  gap: 8,
                }}
              >
                <Text style={{ flex: 1, color: '#F4F4F5', fontSize: 11, lineHeight: 16, textAlign: 'right' }}>
                  {term}
                </Text>
                <ShieldCheck size={14} color="#F59E0B" style={{ marginTop: 2 }} />
              </View>
            ))}

            {/* Interactive Terms Agreement Checkbox */}
            <TouchableOpacity
              onPress={() => setAgreed(!agreed)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: agreed ? 'rgba(16, 185, 129, 0.15)' : '#18181B',
                borderWidth: 1.5,
                borderColor: agreed ? '#10B981' : '#3F3F46',
                borderRadius: 12,
                padding: 10,
                marginTop: 4,
              }}
            >
              <Text style={{ flex: 1, color: agreed ? '#FFFFFF' : '#A1A1AA', fontSize: 11, fontWeight: '800', textAlign: 'right', lineHeight: 16 }}>
                أقر بأنني قرأت وفهمت ميثاق العمل والشروط والأحكام، وأوافق على الالتزام الكامل بها.
              </Text>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: agreed ? '#10B981' : '#71717A',
                  backgroundColor: agreed ? '#10B981' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {agreed && <CheckCircle2 size={14} color="#0A0A0A" />}
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Action Button */}
          <View style={{ padding: spacing.md, backgroundColor: '#18181B', borderTopWidth: 1, borderColor: '#27272A' }}>
            <TouchableOpacity
              onPress={handleDismiss}
              activeOpacity={0.9}
              style={{
                backgroundColor: '#D4AF37',
                height: 50,
                borderRadius: 14,
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
              <Text style={{ color: '#0A0A0A', fontSize: 14, fontWeight: '900' }}>
                الموافقة ومتابعة الدخول للنظام 🛡️
              </Text>
              <ArrowRight size={18} color="#0A0A0A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
