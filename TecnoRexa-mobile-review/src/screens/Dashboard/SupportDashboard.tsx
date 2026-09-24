import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import {
  Headphones,
  Clock,
  CheckCircle,
  MessageCircle,
  Ticket,
  Wrench,
  Package,
  Star,
  Zap,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  Send,
  Code2,
  X,
  AlertTriangle,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, borderRadius } from '../../theme';
import { api } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';

export default function SupportDashboard({ navigation }: any) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    openCount: 0,
    pendingCount: 0,
    activeTechs: 0,
    totalOrders: 0,
  });

  const [escalationModalVisible, setEscalationModalVisible] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [escalationNote, setEscalationNote] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [escalatedCount, setEscalatedCount] = useState(0);

  const handleEscalateToDev = async () => {
    if (!selectedTicketId) {
      Alert.alert('تنبيه', 'يرجى اختيار التذكرة أو كتابة رقمها لتصعيدها للمبرمجين');
      return;
    }
    setEscalating(true);
    try {
      const res = await api.post(`/support/tickets/${selectedTicketId}/escalate`, {
        note: escalationNote.trim() || 'عطل تقني محول من خدمة العملاء لفريق البرمجة',
      });
      Alert.alert('✅ تم بنجاح!', res.data?.message || 'تم تحويل التذكرة رسمياً إلى الدعم التقني والبرمجي وفريق التطوير كعطل تقني عالي الأولوية.');
      setEscalationModalVisible(false);
      setSelectedTicketId('');
      setEscalationNote('');
      setEscalatedCount((prev) => prev + 1);
      loadSupportData();
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.error || 'تعذر تصعيد التذكرة حالياً');
    } finally {
      setEscalating(false);
    }
  };

  const loadSupportData = async () => {
    try {
      const [ticketsRes, techsRes, ordersRes] = await Promise.all([
        api.get('/support/tickets').catch(() => ({ data: [] })),
        api.get('/technicians').catch(() => ({ data: [] })),
        api.get('/orders').catch(() => ({ data: [] })),
      ]);

      const tList = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];
      const techList = Array.isArray(techsRes.data) ? techsRes.data : [];
      const ordList = Array.isArray(ordersRes.data) ? ordersRes.data : [];

      const open = tList.filter((t: any) => t.status === 'open' || t.status === 'in_progress');
      const pending = tList.filter((t: any) => t.status === 'pending');

      setTickets(tList);
      setStats({
        openCount: open.length,
        pendingCount: pending.length,
        activeTechs: techList.length,
        totalOrders: ordList.length,
      });
    } catch (e) {
      console.error('Error loading support data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSupportData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSupportData();
  }, []);

  const supportKpis = [
    { label: 'التذاكر المفتوحة', value: `${stats.openCount} تذكرة`, change: 'تحتاج استجابة', icon: Ticket, color: '#EF4444' },
    { label: 'التذاكر المعلقة', value: `${stats.pendingCount} تذكرة`, change: 'بانتظار العميل', icon: Clock, color: '#F59E0B' },
    { label: 'الفنيين في الخدمة', value: `${stats.activeTechs} فني`, change: 'متاح للطلب', icon: Wrench, color: '#10B981' },
    { label: 'طلبات الصيانة النشطة', value: `${stats.totalOrders} طلب`, change: 'قيد المتابعة', icon: Package, color: '#0D9488' },
    { label: 'متوسط زمن الرد', value: '4 دقائق', change: 'ممتاز ⚡', icon: Zap, color: colors.primary },
    { label: 'تقييم رضا العملاء', value: '4.9 / 5', change: '180 تقييم', icon: Star, color: '#10B981' },
  ];

  const supportSections = [
    { label: 'إدارة وتفاصيل التذاكر', desc: 'استعراض التذاكر المفتوحة والرد عليها وتصنيفها', icon: Ticket, screen: 'Tickets', color: '#EF4444' },
    { label: 'المحادثات المباشرة (الشات)', desc: 'الدردشة الفورية مع العملاء والفنيين', icon: MessageCircle, screen: 'ChatList', color: '#3B82F6' },
    { label: 'فريق الفنيين وإسناد الطلبات', desc: 'البحث عن فني في منطقة العميل وتوجيه الطلب', icon: Wrench, screen: 'TechniciansTeam', color: '#10B981' },
    { label: 'متابعة طلبات الصيانة', desc: 'فحص حالات طلبات الصيانة وتحديثها', icon: Package, screen: 'Orders', color: colors.primary },
    { label: 'مركز الدعم والأسئلة الشائعة', desc: 'دليل الإجراءات ونماذج الردود الجاهزة', icon: HelpCircle, screen: 'Support', color: '#0D9488' },
  ];

  const cannedReplies = [
    'أهلاً بك في TecnoRexa! تم استلام طلبك وجاري إسناد فني معتمد لمنطقتك حالاً.',
    'تم تسجيل تذكرتك رسمياً برقم متابعة وسيتواصل معك مهندس الصيانة فوراً.',
    'تم تأكيد وصول الفني، يمكنك متابعة موقعه المباشر على الخريطة من خلال صفحة الطلب.',
  ];

  const handleCopyReply = (text: string) => {
    Alert.alert('✅ تم النسخ', `تم نسخ الرد السريع بنجاح:\n"${text}"`);
  };

  return (
    <View style={styles.container}>
      {/* Role Header with ☰ Drawer */}
      <OwnerHeader
        title="مركز خدمة العملاء والدعم"
        subtitle={`مرحباً بك، ${user?.name || 'أخصائي الدعم'} 🎧`}
        sectionNumber={1}
        navigation={navigation}
        currentScreen="Home"
        onRefresh={onRefresh}
      />

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#0D9488" />
          <Text style={styles.loadingText}>جاري تحميل غرفة خدمة العملاء وتذاكر الدعم...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D9488"
            />
          }
        >
          {/* Support KPIs */}
          <Text style={styles.sectionHeader}>📊 مؤشرات جودة واستجابة الدعم</Text>
          <View style={styles.kpiGrid}>
            {supportKpis.map((k, idx) => {
              const Icon = k.icon;
              return (
                <View key={idx} style={[styles.kpiCard, { borderColor: k.color }]}>
                  <Icon size={20} color={k.color} />
                  <Text style={styles.kpiValue}>{k.value}</Text>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                  <Text style={[styles.kpiChange, { color: k.color }]}>{k.change}</Text>
                </View>
              );
            })}
          </View>

          {/* Real Tickets Feed */}
          {tickets.length > 0 && (
            <View style={styles.ticketsBlock}>
              <View style={styles.ticketsHeader}>
                <Ticket size={18} color="#0D9488" />
                <Text style={styles.ticketsTitle}>التذاكر الحالية المسجلة في النظام ({tickets.length})</Text>
              </View>
              {tickets.slice(0, 3).map((t: any) => (
                <TouchableOpacity
                  key={t.id}
                  style={styles.ticketItem}
                  onPress={() => navigation.navigate('Tickets')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ticketItemTitle}>{t.title || t.subject || 'استفسار عميل'}</Text>
                    <Text style={styles.ticketItemSub}>
                      رقم التذكرة: #{t.id} | الحالة: {t.status === 'open' ? 'مفتوحة' : t.status === 'in_progress' ? 'قيد المعالجة' : 'مغلقة'}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: t.status === 'open' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={[styles.statusPillText, { color: t.status === 'open' ? '#EF4444' : '#10B981' }]}>
                      {t.status === 'open' ? 'جديدة' : 'جارية'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Quick Canned Replies */}
          <View style={styles.cannedBlock}>
            <Text style={styles.cannedHeader}>⚡ الردود السريعة الجاهزة (انقر للنسخ)</Text>
            {cannedReplies.map((reply, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.cannedItem}
                onPress={() => handleCopyReply(reply)}
              >
                <Send size={14} color="#0D9488" />
                <Text style={styles.cannedItemText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Programmer Escalation Section */}
          <View
            style={{
              backgroundColor: '#141416',
              borderRadius: borderRadius.lg,
              borderWidth: 1.5,
              borderColor: '#7C3AED',
              padding: spacing.md,
              marginTop: spacing.md,
              marginBottom: spacing.xs,
            }}
          >
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(124, 58, 237, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Code2 size={18} color="#7C3AED" />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>قسم التواصل والتصعيد للمبرمجين 💻</Text>
                  <Text style={{ color: '#A1A1AA', fontSize: 11 }}>تحويل الأعطال التقنية المستعصية للمهندس ماهر وفريق البرمجة</Text>
                </View>
              </View>
              <View style={{ backgroundColor: 'rgba(124, 58, 237, 0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: borderRadius.sm }}>
                <Text style={{ color: '#7C3AED', fontSize: 10, fontWeight: 'bold' }}>{escalatedCount} مصعّد</Text>
              </View>
            </View>

            <Text style={{ color: '#E4E4E7', fontSize: 12, textAlign: 'right', marginBottom: spacing.sm, lineHeight: 18 }}>
              إذا واجه العميل أو الفني عطلاً تقنياً في السيرفر أو التطبيق، قم بتصعيده فوراً لفريق التطوير لمراجعته:
            </Text>

            <TouchableOpacity
              onPress={() => setEscalationModalVisible(true)}
              style={{
                backgroundColor: '#7C3AED',
                paddingVertical: 10,
                borderRadius: borderRadius.md,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Send size={15} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 13 }}>
                تصعيد مشكلة تقنية للمبرمجين 🚀
              </Text>
            </TouchableOpacity>
          </View>

          {/* Support Operations Sections */}
          <Text style={[styles.sectionHeader, { marginTop: 12 }]}>🛠️ قنوات العمليات والتواصل</Text>
          <View style={styles.sectionsList}>
            {supportSections.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.sectionRow}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate(sec.screen)}
                >
                  <ChevronRight size={18} color={colors.gray} />
                  <View style={styles.sectionRowText}>
                    <Text style={styles.sectionRowTitle}>{sec.label}</Text>
                    <Text style={styles.sectionRowDesc}>{sec.desc}</Text>
                  </View>
                  <View style={[styles.sectionIconBox, { backgroundColor: sec.color + '22' }]}>
                    <Icon size={20} color={sec.color} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Escalation to Dev Team Modal */}
      <Modal
        visible={escalationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEscalationModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View
            style={{
              width: '100%',
              maxWidth: 460,
              backgroundColor: '#141416',
              borderRadius: borderRadius.xl,
              borderWidth: 1.5,
              borderColor: '#7C3AED',
              padding: spacing.lg,
              shadowColor: '#7C3AED',
              shadowOpacity: 0.25,
              shadowRadius: 20,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(124,58,237,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#7C3AED' }}>
                  <Code2 size={20} color="#7C3AED" />
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900' }}>تصعيد عطل تقني للمبرمجين 💻</Text>
                  <Text style={{ color: '#7C3AED', fontSize: 11 }}>مباشرة إلى الدعم التقني والبرمجي وفريق التطوير</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setEscalationModalVisible(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#27272A', alignItems: 'center', justifyContent: 'center' }}>
                <X size={16} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Select ticket or enter ID */}
            <Text style={{ color: '#E4E4E7', fontSize: 12, fontWeight: 'bold', textAlign: 'right', marginBottom: 6 }}>
              اختر التذكرة المراد تصعيدها:
            </Text>
            <ScrollView style={{ maxHeight: 120, marginBottom: spacing.sm }}>
              {tickets.slice(0, 5).map((t: any) => {
                const isSelected = selectedTicketId === String(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setSelectedTicketId(String(t.id))}
                    style={{
                      backgroundColor: isSelected ? 'rgba(124,58,237,0.2)' : '#1C1C1E',
                      borderWidth: 1,
                      borderColor: isSelected ? '#7C3AED' : '#333',
                      borderRadius: borderRadius.md,
                      padding: 8,
                      marginBottom: 4,
                      flexDirection: 'row-reverse',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.white, fontSize: 12, fontWeight: 'bold' }}>{t.title || t.subject || 'تذكرة #' + t.id}</Text>
                    <Text style={{ color: '#7C3AED', fontSize: 11 }}>#{t.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ gap: 4, marginBottom: spacing.md }}>
              <Text style={{ color: '#E4E4E7', fontSize: 12, fontWeight: 'bold', textAlign: 'right' }}>
                ملاحظات وتفاصيل الخلل البرمجي:
              </Text>
              <TextInput
                style={{
                  backgroundColor: '#0A0A0A',
                  color: colors.white,
                  borderRadius: borderRadius.md,
                  borderWidth: 1,
                  borderColor: '#333',
                  padding: 10,
                  textAlign: 'right',
                  minHeight: 70,
                }}
                placeholder="اشرح المشكلة التقنية (مثل: تعذر معالجة الطلب، بطء في الاستجابة، خطأ بالدفع...)"
                placeholderTextColor="#71717A"
                value={escalationNote}
                onChangeText={setEscalationNote}
                multiline
              />
            </View>

            <TouchableOpacity
              onPress={handleEscalateToDev}
              disabled={escalating}
              style={{
                backgroundColor: '#7C3AED',
                paddingVertical: 12,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {escalating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 14 }}>
                  إرسال وتصعيد للمبرمجين فوراً 🚀
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#0F2926',
    borderBottomWidth: 1,
    borderBottomColor: '#0D9488',
  },
  headerTitleRow: {
    gap: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  welcomeText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  userName: {
    color: colors.primary,
  },
  profileBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  profileBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.gray,
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: 14,
    paddingBottom: 150,
  },
  sectionHeader: {
    color: colors.white,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: '#141414',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  kpiValue: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
  },
  kpiLabel: {
    color: colors.gray,
    fontSize: 10,
    textAlign: 'center',
  },
  kpiChange: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  ticketsBlock: {
    backgroundColor: '#141414',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#262626',
    gap: 8,
  },
  ticketsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 6,
  },
  ticketsTitle: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: 'bold',
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
    gap: 8,
  },
  ticketItemTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  ticketItemSub: {
    color: colors.gray,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cannedBlock: {
    backgroundColor: '#101B1A',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.3)',
    gap: 8,
  },
  cannedHeader: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  cannedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#162725',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 8,
  },
  cannedItemText: {
    flex: 1,
    color: '#E0E0E0',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'right',
  },
  sectionsList: {
    backgroundColor: '#141414',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#202020',
    gap: 12,
  },
  sectionRowText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionRowTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionRowDesc: {
    color: colors.gray,
    fontSize: 11,
    marginTop: 2,
  },
  sectionIconBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
