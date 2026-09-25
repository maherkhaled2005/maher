import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { ShieldCheck, ArrowRight, Lock, Eye, CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface Props {
  navigation: any;
}

export const PrivacyPolicyScreen: React.FC<Props> = ({ navigation }) => {
  const handleBack = () => {
    if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Register');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
        >
          <ArrowRight size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>سياسة الخصوصية وحماية البيانات</Text>
          <Text style={styles.headerSubtitle}>منصة TecnoRexa - تكنوريكسا مصر</Text>
        </View>
        <ShieldCheck size={26} color={colors.primary} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Card */}
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <View style={styles.lawBadge}>
              <Text style={styles.lawBadgeText}>قانون 151 لسنة 2020 & GDPR</Text>
            </View>
          </View>
          <Text style={styles.introText}>
            تلتزم منصة TecnoRexa التزاماً صارماً ومطلقاً بحماية خصوصية مستخدميها وسلامة بياناتهم الشخصية، امتثالاً لأحكام قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020، وقواعد اللائحة العامة لحماية البيانات (GDPR).
          </Text>
        </View>

        {/* Section 1: Data Collection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>1. البيانات التي نقوم بجمعها</Text>
          </View>
          <Text style={styles.sectionBody}>
            • بيانات الهوية والتواصل: الاسم الكامل، رقم الهاتف المصري (01xxxxxxxxx)، والبريد الإلكتروني.{'\n'}
            • بيانات العناوين الجغرافية: المحافظة، المدينة، المنطقة، والعنوان التفصيلي لتوجيه الفنيين وتوصيل قطع الغيار.{'\n'}
            • بيانات العمليات الفنية: تفاصيل الجهاز، العطل، الصور المرفوعة للمشكلة أو إيصالات التحويل، وسجل الفواتير.{'\n'}
            • بيانات الاعتماد المهني للفنيين والتجار: الرقم القومي، السجل التجاري، والبطاقة الضريبية.
          </Text>
        </View>

        {/* Section 2: Usage */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>2. الغرض من معالجة البيانات</Text>
          </View>
          <Text style={styles.sectionBody}>
            • ربط العملاء بالفنيين المعتمدين الأقرب جغرافياً وتنفيذ زيارات الكشف والصيانة.{'\n'}
            • توفير إيصالات وشهادات ضمان الصيانة المعتمدة لمدة 30 يوماً.{'\n'}
            • إدارة المحفظة الرقمية وتأكيد عمليات الشحن وسحب الأرباح.{'\n'}
            • تدريب وتحسين خوارزميات المساعد الذكي لتشخيص الأعطال بدقة.
          </Text>
        </View>

        {/* Section 3: Data Security */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShieldCheck size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>3. حماية وتشفير البيانات</Text>
          </View>
          <Text style={styles.sectionBody}>
            • تشفير جميع الاتصالات والبيانات أثناء النقل باستخدام بروتوكول TLS 1.3 المتقدم.{'\n'}
            • تشفير كلمات المرور باستخدام خوارزمية bcrypt غير القابلة للعكس.{'\n'}
            • تطبيق جدران حماية متقدمة ومراقبة سجل العمليات الإدارية (Audit Logs) على مدار الساعة لمنع أي وصول غير مصرح به.{'\n'}
            • عدم بيع أو تأجير أي بيانات شخصية لأي جهة إعلانية أو طرف ثالث تحت أي ظرف.
          </Text>
        </View>

        {/* Section 4: User Rights */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckCircle2 size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>4. حقوق المستخدم وحق النسيان</Text>
          </View>
          <Text style={styles.sectionBody}>
            • يحق لك مراجعة وتحديث بياناتك الشخصية في أي وقت من شاشة الملف الشخصي.{'\n'}
            • يحق لك طلب نسخة كاملة من بياناتك وسجلات معاملاتك.{'\n'}
            • حق النسيان (Right to be Forgotten): يمكنك طلب حذف حسابك وبياناتك نهائياً من قاعدة البيانات عبر التواصل مع الدعم الفني، وسيتم حذفها فور تصفية أي التزامات مالية معلقة.
          </Text>
        </View>

        {/* Footer info */}
        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            آخر تحديث للسياسة: سبتمبر 2026{'\n'}
            لأي استفسارات قانونية أو تقديم شكوى خصوصية: tecnorexa@gmail.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.card,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    marginTop: 2,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row-reverse',
    marginBottom: spacing.sm,
  },
  lawBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  lawBadgeText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  introText: {
    color: colors.grayLight,
    fontSize: typography.sizes.sm,
    lineHeight: 22,
    textAlign: 'right',
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    marginRight: spacing.sm,
    textAlign: 'right',
  },
  sectionBody: {
    color: colors.grayLight,
    fontSize: typography.sizes.sm,
    lineHeight: 24,
    textAlign: 'right',
  },
  footerCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    color: colors.grayDark,
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default PrivacyPolicyScreen;
