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
import { FileText, ArrowRight, CheckSquare, Clock, Award, ShieldAlert } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface Props {
  navigation: any;
}

export const TermsScreen: React.FC<Props> = ({ navigation }) => {
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
          <Text style={styles.headerTitle}>شروط وأحكام الخدمة</Text>
          <Text style={styles.headerSubtitle}>ميثاق التعامل والضمان المعتمد</Text>
        </View>
        <FileText size={26} color={colors.primary} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.card}>
          <Text style={styles.introText}>
            باستخدامك لمنصة TecnoRexa أو تسجيل حسابك كـ (عميل، فني صيانة، أو تاجر قطع غيار)، فإنك تقر وتوافق على الالتزام الكامل بهذه الشروط والأحكام وميثاق الشرف المهني.
          </Text>
        </View>

        {/* Term 1: Warranty */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>1. ضمان الصيانة المعتمد (30 يوماً)</Text>
          </View>
          <Text style={styles.sectionBody}>
            • تضمن منصة TecnoRexa كافة أعمال الصيانة والإصلاح المنفذة عبر الفنيين المعتمدين لمدة 30 يوماً من تاريخ إتمام الطلب.{'\n'}
            • يغطي الضمان نفس العطل وقطع الغيار التي تم استبدالها.{'\n'}
            • في حال تكرار العطل خلال فترة الضمان، يلتزم الفني بإعادة الفحص والإصلاح دون أي رسوم كشف إضافية.
          </Text>
        </View>

        {/* Term 2: Cancellation Policy */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.warning} />
            <Text style={styles.sectionTitle}>2. سياسة الإلغاء (مهلة الـ 10 دقائق)</Text>
          </View>
          <Text style={styles.sectionBody}>
            • يحق للعميل إلغاء طلب الصيانة أو الشراء مجاناً خلال 10 دقائق فقط من وقت إنشاء الطلب.{'\n'}
            • بعد انقضاء الـ 10 دقائق، يعتبر الطلب مؤكداً ويتم قفل زر الإلغاء التلقائي لضمان عدم إهدار وقت وجهد الفني المتوجه للموقع.{'\n'}
            • أي إلغاء استثنائي بعد الـ 10 دقائق يتطلب التنسيق المباشر مع فريق خدمة العملاء وإدارة المنصة.
          </Text>
        </View>

        {/* Term 3: Technician Obligations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckSquare size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>3. التزامات فني الصيانة المعتمد</Text>
          </View>
          <Text style={styles.sectionBody}>
            • الالتزام بالمظهر اللائق وبطاقة التعريف المعتمدة من TecnoRexa أثناء الزيارة.{'\n'}
            • الأمانة التامة في فحص الجهاز وتحديد العطل الحقيقي دون مبالغة في تكلفة الإصلاح.{'\n'}
            • تقديم تقرير فني شامل وتوضيح تكلفة قطع الغيار قبل البدء في التنفيذ.{'\n'}
            • الامتناع عن الاتفاق الخارجي مع العميل دون تسجيل الطلب بالمنصة؛ وفي حال المخالفة يتم حظر الحساب نهائياً.
          </Text>
        </View>

        {/* Term 4: Merchant Obligations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CheckSquare size={20} color={colors.success} />
            <Text style={styles.sectionTitle}>4. التزامات تاجر قطع الغيار</Text>
          </View>
          <Text style={styles.sectionBody}>
            • عرض قطع غيار أصلية ومطابقة للمواصفات الفنية مع توضيح حالتها (جديدة / مجددة ضمان).{'\n'}
            • شحن المنتجات في الموعد المحدد وتزويد المشتري برقم التتبع الرسمي الشغال.{'\n'}
            • الالتزام بسياسة الاسترجاع والاستبدال للمنتجات المعيبة وفقاً لقانون حماية المستهلك المصري.
          </Text>
        </View>

        {/* Term 5: Prohibited Acts & Penalties */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShieldAlert size={20} color={colors.danger} />
            <Text style={styles.sectionTitle}>5. المحظورات والحظر النهائي</Text>
          </View>
          <Text style={styles.sectionBody}>
            • يحظر إنشاء حسابات وهمية أو تقييمات مزيفة للتأثير على سمعة الفنيين أو المتاجر.{'\n'}
            • يحظر رفع إيصالات تحويل غير حقيقية أو التلاعب في بيانات الدفع الإلكتروني.{'\n'}
            • تحتفظ إدارة TecnoRexa بالحق الكامل في حظر أي حساب يخالف ميثاق الشرف وتجميد أي رصيد ناتج عن معاملات احتيالية.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footerCard}>
          <Text style={styles.footerText}>
            تخضع هذه الشروط والأحكام لقوانين جمهورية مصر العربية.{'\n'}
            الاختصاص القضائي: محاكم القاهرة، مصر.
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
    paddingTop: Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, 36) : 0,
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
    fontSize: 18,
    fontWeight: '900',
    color: colors.white,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 13,
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
  introText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 24,
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
    fontSize: 16,
    fontWeight: '700',
    marginRight: spacing.sm,
    textAlign: 'right',
  },
  sectionBody: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 26,
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

export default TermsScreen;
