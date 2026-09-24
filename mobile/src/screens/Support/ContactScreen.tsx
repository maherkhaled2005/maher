// src/screens/Support/ContactScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

export default function ContactScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    const finalName = user ? (user.name || 'مستخدم مسجل') : name.trim();
    const finalPhone = user ? (user.phone || '') : phone.trim();
    const finalEmail = user ? (user.email || '') : email.trim();

    if (!user && !finalName) {
      Alert.alert('تنبيه', 'يرجى إدخال الاسم بالكامل');
      return;
    }
    if (!message.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة نص الرسالة');
      return;
    }
    if (!user && (!finalPhone || finalPhone.length < 11)) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف صحيح للتواصل معك');
      return;
    }

    setLoading(true);
    try {
      // Also send directly to tecnorexa@gmail.com
      fetchApi('/contact', {
        method: 'POST',
        data: {
          name: finalName,
          phone: finalPhone,
          email: finalEmail || undefined,
          subject: subject.trim() || 'رسالة استفسار لخدمة العملاء',
          message: message.trim(),
        },
      }).catch(() => {});

      if (!user) {
        // Guest Support Flow (No login required)
        const res = await fetchApi('/support/guest-ticket', {
          method: 'POST',
          data: {
            name: finalName,
            phone: finalPhone,
            email: finalEmail || undefined,
            subject: subject.trim() || 'طلب مساعدة من زائر المنصة',
            description: message.trim(),
          },
        });
        if (res?.success) {
          setSuccess(true);
        } else {
          throw new Error(res?.error || 'تعذر إرسال التذكرة');
        }
      } else {
        // Authenticated User Flow
        const conv = await fetchApi('/conversations', {
          method: 'POST',
          data: {
            name: 'تذكرة دعم: ' + (subject.trim() || 'رسالة تواصل'),
            type: 'support',
            participants: [],
          },
        });

        if (conv && conv.id) {
          await fetchApi('/messages', {
            method: 'POST',
            data: {
              conversationId: conv.id,
              content: `[تذكرة دعم من ${finalName}]\n\n${message.trim()}`,
              type: 'text',
            },
          });

          await fetchApi('/support/tickets', {
            method: 'POST',
            data: {
              title: subject.trim() || 'رسالة تواصل من صفحة اتصل بنا',
              subject: subject.trim() || 'رسالة تواصل',
              customerName: finalName,
              customerPhone: finalPhone,
              email: finalEmail,
              description: message.trim(),
              type: 'inquiry',
              priority: 'medium',
            },
          }).catch(() => {});

          setSuccess(true);
          setTimeout(() => {
            navigation.replace('Chat', { conversationId: conv.id });
          }, 1500);
        } else {
          throw new Error('فشل إنشاء المحادثة مع الدعم');
        }
      }
    } catch (err: any) {
      Alert.alert('تنبيه', err.message || 'تعذر إرسال الرسالة حالياً، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  if (success) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.dark,
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.xl,
        }}
      >
        <CheckCircle2 color={colors.primary} size={70} style={{ marginBottom: spacing.md }} />
        <Text
          style={{
            fontSize: typography.sizes.xl,
            fontWeight: '900',
            color: colors.white,
            textAlign: 'center',
            marginBottom: spacing.xs,
          }}
        >
          تم إرسال رسالتك بنجاح! 🚀
        </Text>
        <Text style={{ color: colors.gray, fontSize: 13, textAlign: 'center', lineHeight: 22, marginBottom: spacing.lg }}>
          شكراً لتواصلك مع TecnoRexa، سيقوم فريق الدعم الفني بالرد على استفسارك ومساعدتك في أقرب وقت.
        </Text>
        <TouchableOpacity
          onPress={() => (navigation?.canGoBack?.() ? navigation.goBack() : navigation.navigate('Login'))}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 28,
            paddingVertical: 12,
            borderRadius: borderRadius.md,
          }}
        >
          <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 14 }}>
            الرجوع إلى تسجيل الدخول
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Luxury Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
            backgroundColor: colors.darkCard,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ width: 40 }} />
          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                color: colors.white,
                fontSize: typography.sizes.lg,
                fontWeight: '900',
              }}
            >
              تواصل معنا 📬
            </Text>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
              فريق دعم TecnoRexa في خدمتك دائماً
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else if (navigation?.navigate) {
                navigation.navigate('Support');
              }
            }}
            style={{
              width: 38,
              height: 38,
              backgroundColor: '#1E1E1E',
              borderRadius: borderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <ChevronRight color={colors.white} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 150 }}
          showsVerticalScrollIndicator={true}
        >
          {/* Quick Contact Cards */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.sm,
              marginBottom: spacing.lg,
            }}
          >
            <TouchableOpacity
              onPress={() => openLink('tel:+201064739664')}
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(59,130,246,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.xs,
                  borderWidth: 1,
                  borderColor: '#3B82F6',
                }}
              >
                <Phone color="#3B82F6" size={20} />
              </View>
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>
                اتصال هاتفي
              </Text>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                01064739664
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openLink('mailto:tecnorexa@gmail.com')}
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(212,175,55,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.xs,
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Mail color={colors.primary} size={20} />
              </View>
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>
                البريد الرسمي
              </Text>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                tecnorexa@gmail.com
              </Text>
            </TouchableOpacity>

            <View
              style={{
                flex: 1,
                minWidth: '47%',
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(16,185,129,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: spacing.xs,
                  borderWidth: 1,
                  borderColor: '#10B981',
                }}
              >
                <Clock color="#10B981" size={20} />
              </View>
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>
                خدمة متواصلة
              </Text>
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '900', marginTop: 2 }}>
                شغال دائماً (24/7)
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View
            style={{
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.xl,
              padding: spacing.lg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 6,
                marginBottom: spacing.md,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: typography.sizes.md,
                  fontWeight: '900',
                }}
              >
                أرسل رسالة مباشرة ✉️
              </Text>
              <Sparkles size={18} color={colors.primary} />
            </View>

            <View style={{ gap: spacing.sm }}>
              {user ? (
                <View
                  style={{
                    backgroundColor: '#111',
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    borderWidth: 1,
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    flexDirection: 'row-reverse',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
                    <Text style={{ color: colors.white, fontSize: 13, fontWeight: 'bold' }}>
                      إرسال باسم: {user.name}
                    </Text>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>
                    {user.phone}
                  </Text>
                </View>
              ) : (
                <>
                  <View>
                    <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                      الاسم بالكامل *
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: '#0A0A0A',
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                        color: colors.white,
                        textAlign: 'right',
                        borderWidth: 1,
                        borderColor: colors.border,
                        fontSize: 13,
                      }}
                      placeholder="أدخل اسمك الكامل"
                      placeholderTextColor={colors.gray}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View>
                    <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                      رقم الهاتف للتواصل <Text style={{ color: colors.danger }}>*</Text>
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: '#0A0A0A',
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                        color: colors.white,
                        textAlign: 'right',
                        borderWidth: 1,
                        borderColor: colors.border,
                        fontSize: 13,
                      }}
                      placeholder="01xxxxxxxxx"
                      placeholderTextColor={colors.gray}
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      maxLength={11}
                    />
                  </View>

                  <View>
                    <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                      البريد الإلكتروني
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: '#0A0A0A',
                        borderRadius: borderRadius.md,
                        padding: spacing.md,
                        color: colors.white,
                        textAlign: 'right',
                        borderWidth: 1,
                        borderColor: colors.border,
                        fontSize: 13,
                      }}
                      placeholder="example@email.com"
                      placeholderTextColor={colors.gray}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </>
              )}

              <View>
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                  موضوع الرسالة
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#0A0A0A',
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.white,
                    textAlign: 'right',
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 13,
                  }}
                  placeholder="عنوان الموضوع أو الاستفسار"
                  placeholderTextColor={colors.gray}
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View>
                <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                  نص الرسالة *
                </Text>
                <TextInput
                  style={{
                    backgroundColor: '#0A0A0A',
                    borderRadius: borderRadius.md,
                    padding: spacing.md,
                    color: colors.white,
                    textAlign: 'right',
                    borderWidth: 1,
                    borderColor: colors.border,
                    fontSize: 13,
                    height: 100,
                    textAlignVertical: 'top',
                  }}
                  placeholder="اكتب رسالتك أو استفسارك هنا بالتفصيل..."
                  placeholderTextColor={colors.gray}
                  multiline
                  value={message}
                  onChangeText={setMessage}
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                  paddingVertical: spacing.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  marginTop: spacing.sm,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.dark} />
                ) : (
                  <>
                    <Send color={colors.dark} size={18} />
                    <Text
                      style={{
                        color: colors.dark,
                        fontWeight: '900',
                        fontSize: typography.sizes.md,
                      }}
                    >
                      إرسال الرسالة الآن
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
