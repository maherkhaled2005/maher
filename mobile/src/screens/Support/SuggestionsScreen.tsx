import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  Lightbulb,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { fetchApi } from '../../api/client';
import OwnerHeader from '../../components/OwnerHeader';

interface Suggestion {
  id: string;
  userId: string;
  userName?: string;
  submitterName?: string;
  role?: string;
  title: string;
  description: string;
  status: 'pending' | 'owner_approved' | 'owner_rejected';
  statusLabel?: string;
  createdAt: string;
}

export default function SuggestionsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'owner';
  const isProgrammer = user?.role === 'programmer';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeTab, setActiveTab] = useState<'mine' | 'all' | 'approved'>(
    isOwner ? 'all' : isProgrammer ? 'approved' : 'mine'
  );

  const loadSuggestions = async () => {
    try {
      if ((isOwner && activeTab === 'all') || (isProgrammer && activeTab === 'approved')) {
        const data = await fetchApi('/suggestions');
        setSuggestions(Array.isArray(data) ? data : []);
      } else {
        const data = await fetchApi('/suggestions/mine');
        setSuggestions(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      // Quiet fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [activeTab]);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة عنوان وتفاصيل الاقتراح');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/suggestions', {
        method: 'POST',
        data: {
          title: title.trim(),
          description: description.trim(),
        },
      });

      Alert.alert('نجاح', res.message || 'تم استلام طلبك سيتم الرد عليك قريبا');
      setTitle('');
      setDescription('');
      loadSuggestions();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل إرسال الاقتراح، يرجى المحاولة لاحقاً');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await fetchApi(`/suggestions/${id}/approve`, { method: 'POST' });
      Alert.alert('تم الاعتماد', 'تمت الموافقة على الاقتراح وتحويله للمبرمج الرئيسي بنجاح');
      loadSuggestions();
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل اعتماد الاقتراح');
    }
  };

  const handleReject = async (id: string) => {
    Alert.prompt
      ? Alert.prompt(
          'رفض الاقتراح',
          'يمكنك كتابة سبب الرفض (اختياري):',
          async (reason) => {
            try {
              await fetchApi(`/suggestions/${id}/reject`, {
                method: 'POST',
                data: { reason: reason || '' },
              });
              Alert.alert('تم الرفض', 'تم رفض الاقتراح وإشعار العميل.');
              loadSuggestions();
            } catch (err: any) {
              Alert.alert('خطأ', err.message || 'فشل رفض الاقتراح');
            }
          }
        )
      : (async () => {
          try {
            await fetchApi(`/suggestions/${id}/reject`, { method: 'POST' });
            Alert.alert('تم الرفض', 'تم رفض الاقتراح وإشعار العميل.');
            loadSuggestions();
          } catch (err: any) {
            Alert.alert('خطأ', err.message || 'فشل رفض الاقتراح');
          }
        })();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'owner_approved':
        return {
          text: 'تمت الموافقه علي طلبك وجاري العمل عليها الان',
          bg: 'rgba(34, 197, 94, 0.15)',
          border: '#22C55E',
          color: '#4ADE80',
          icon: CheckCircle2,
        };
      case 'owner_rejected':
        return {
          text: 'تم الغاء طلبك',
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '#EF4444',
          color: '#F87171',
          icon: XCircle,
        };
      case 'pending':
      default:
        return {
          text: 'تم استلام طلبك سيتم الرد عليك قريبا',
          bg: 'rgba(212, 175, 55, 0.15)',
          border: '#D4AF37',
          color: '#D4AF37',
          icon: Clock,
        };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark }}>
      <OwnerHeader title="المقترحات والأفكار 💡" />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadSuggestions();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Role-specific Tab Switcher */}
        {(isOwner || isProgrammer) && (
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.lg,
              padding: 4,
              marginBottom: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {isOwner ? (
              <TouchableOpacity
                onPress={() => setActiveTab('all')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor: activeTab === 'all' ? colors.primary : 'transparent',
                  borderRadius: borderRadius.md,
                }}
              >
                <Text
                  style={{
                    color: activeTab === 'all' ? colors.dark : colors.white,
                    fontWeight: '900',
                    fontSize: 13,
                  }}
                >
                  جميع اقتراحات المنصة 🛡️
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setActiveTab('approved')}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  backgroundColor: activeTab === 'approved' ? colors.primary : 'transparent',
                  borderRadius: borderRadius.md,
                }}
              >
                <Text
                  style={{
                    color: activeTab === 'approved' ? colors.dark : colors.white,
                    fontWeight: '900',
                    fontSize: 13,
                  }}
                >
                  الاقتراحات المعتمدة للبرمجة ✅
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => setActiveTab('mine')}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                backgroundColor: activeTab === 'mine' ? colors.primary : 'transparent',
                borderRadius: borderRadius.md,
              }}
            >
              <Text
                style={{
                  color: activeTab === 'mine' ? colors.dark : colors.white,
                  fontWeight: '900',
                  fontSize: 13,
                }}
              >
                {isProgrammer ? 'تقديم مقترح جديد 💡' : 'اقتراحاتي ✍️'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Submission Form (Shown when viewing 'mine' or for non-owners) */}
        {activeTab === 'mine' && (
          <View
            style={{
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              borderWidth: 1.5,
              borderColor: colors.border,
              marginBottom: spacing.xl,
            }}
          >
            <View
              style={{
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              <Lightbulb color={colors.primary} size={22} />
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900' }}>
                شاركنا فكرتك لتطوير TecnoRexa
              </Text>
            </View>

            <Text
              style={{
                color: colors.gray,
                fontSize: 12,
                lineHeight: 18,
                textAlign: 'right',
                marginBottom: spacing.md,
              }}
            >
              نسعد دائماً باقتراحاتك وملاحظاتك. يراجع المالك جميع الأفكار مباشرة لدراسة إمكانية
              تنفيذها وإضافتها للتطبيق.
            </Text>

            <Text
              style={{
                color: colors.white,
                fontWeight: '800',
                marginBottom: spacing.xs,
                textAlign: 'right',
              }}
            >
              عنوان المقترح *
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.dark,
                color: colors.white,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                textAlign: 'right',
                marginBottom: spacing.md,
              }}
              placeholder="مثال: إضافة ميزة تتبع الفني على الخريطة..."
              placeholderTextColor={colors.gray}
              value={title}
              onChangeText={setTitle}
            />

            <Text
              style={{
                color: colors.white,
                fontWeight: '800',
                marginBottom: spacing.xs,
                textAlign: 'right',
              }}
            >
              تفاصيل المقترح *
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.dark,
                color: colors.white,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                textAlign: 'right',
                minHeight: 90,
                textAlignVertical: 'top',
                marginBottom: spacing.lg,
              }}
              placeholder="اشرح فكرتك وكيف ستفيد مستخدمي المنصة..."
              placeholderTextColor={colors.gray}
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              style={{
                backgroundColor: submitting ? colors.gray : colors.primary,
                paddingVertical: 14,
                borderRadius: borderRadius.lg,
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Send color={colors.dark} size={18} />
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>
                {submitting ? 'جاري الإرسال...' : 'إرسال المقترح للمالك'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Suggestions List Header */}
        <View
          style={{
            flexDirection: 'row-reverse',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: spacing.md,
          }}
        >
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900' }}>
            {activeTab === 'approved'
              ? 'المقترحات المعتمدة من المالك للتنفيذ البرمجي 💻'
              : activeTab === 'all'
              ? 'قائمة اقتراحات المنصة'
              : 'متابعة اقتراحاتك السابقة'}
          </Text>
          <Text style={{ color: colors.gray, fontSize: 12 }}>
            ({suggestions.length}) مقترح
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" style={{ marginVertical: 32 }} />
        ) : suggestions.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.lg,
              padding: spacing.xl,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Lightbulb color={colors.gray} size={40} style={{ marginBottom: spacing.sm }} />
            <Text style={{ color: colors.gray, fontSize: 14, fontWeight: '700' }}>
              لا توجد اقتراحات حالياً
            </Text>
          </View>
        ) : (
          suggestions.map((sug) => {
            const badge = getStatusBadge(sug.status);
            const StatusIcon = badge.icon;

            return (
              <View
                key={sug.id}
                style={{
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.xl,
                  padding: spacing.lg,
                  borderWidth: 1,
                  borderColor: colors.border,
                  marginBottom: spacing.md,
                }}
              >
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      color: colors.white,
                      fontSize: 15,
                      fontWeight: '900',
                      textAlign: 'right',
                    }}
                  >
                    {sug.title}
                  </Text>
                </View>

                {(isOwner || isProgrammer) && (activeTab === 'all' || activeTab === 'approved') && (
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 11,
                      fontWeight: '800',
                      textAlign: 'right',
                      marginBottom: spacing.xs,
                    }}
                  >
                    مقدم من: {sug.submitterName || sug.userName || 'مستخدم'} ({sug.role || 'عضو'})
                  </Text>
                )}

                <Text
                  style={{
                    color: '#94A3B8',
                    fontSize: 13,
                    lineHeight: 20,
                    textAlign: 'right',
                    marginBottom: spacing.md,
                  }}
                >
                  {sug.description}
                </Text>

                {/* Status Badge */}
                <View
                  style={{
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: badge.bg,
                    borderWidth: 1,
                    borderColor: badge.border,
                    borderRadius: borderRadius.md,
                    paddingHorizontal: spacing.md,
                    paddingVertical: 8,
                    alignSelf: 'flex-start',
                    marginBottom: isOwner && sug.status === 'pending' ? spacing.md : 0,
                  }}
                >
                  <StatusIcon color={badge.color} size={16} />
                  <Text style={{ color: badge.color, fontWeight: '800', fontSize: 12 }}>
                    {sug.statusLabel || badge.text}
                  </Text>
                </View>

                {/* Owner Action Buttons for Pending Suggestions */}
                {isOwner && sug.status === 'pending' && (
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: spacing.sm,
                      marginTop: spacing.sm,
                      borderTopWidth: 1,
                      borderColor: colors.border,
                      paddingTop: spacing.sm,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleApprove(sug.id)}
                      style={{
                        flex: 1,
                        backgroundColor: '#16A34A',
                        paddingVertical: 10,
                        borderRadius: borderRadius.md,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>
                        موافقة وإرسال للمبرمج ✅
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleReject(sug.id)}
                      style={{
                        flex: 1,
                        backgroundColor: '#DC2626',
                        paddingVertical: 10,
                        borderRadius: borderRadius.md,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>
                        رفض الاقتراح ❌
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
