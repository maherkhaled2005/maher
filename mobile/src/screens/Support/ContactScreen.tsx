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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim() || 'رسالة استفسار لخدمة العملاء';
    const cleanMessage = message.trim();

    if (!cleanName) {
      Alert.alert('تنبيه', 'يرجى إدخال اسمك بالكامل');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 11) {
      Alert.alert('تنبيه', 'يرجى إدخال رقم هاتف صحيح للتواصل معك (11 رقماً)');
      return;
    }
    if (!cleanMessage) {
      Alert.alert('تنبيه', 'يرجى كتابة نص الرسالة أو الاستفسار');
      return;
    }

    setLoading(true);
    try {
      // 1. Send directly to official email (tecnorexa@gmail.com)
      await fetchApi('/contact', {
        method: 'POST',
        data: {
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail || undefined,
          subject: cleanSubject,
          message: cleanMessage,
        },
      }).catch(() => {});

      // 2. Also register support ticket so customer service sees it in the app
      if (user) {
        try {
          await fetchApi('/support/tickets', {
            method: 'POST',
            data: {
              title: cleanSubject,
              subject: cleanSubject,
              customerName: cleanName,
              customerPhone: cleanPhone,
              email: cleanEmail || undefined,
              description: cleanMessage,
              type: 'inquiry',
              priority: 'medium',
            },
          });
        } catch {
          await fetchApi('/support/guest-ticket', {
            method: 'POST',
            data: {
              name: cleanName,
              phone: cleanPhone,
              email: cleanEmail || undefined,
              subject: cleanSubject,
              description: cleanMessage,
            },
          }).catch(() => {});
        }
      } else {
        await fetchApi('/support/guest-ticket', {
          method: 'POST',
          data: {
            name: cleanName,
            phone: cleanPhone,
            email: cleanEmail || undefined,
            subject: cleanSubject,
            description: cleanMessage,
          },
        });
      }

      setSuccess(true);
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
              {/* Full Name */}
              <View>
                <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                  الاسم بالكامل <Text style={{ color: colors.danger }}>*</Text>
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
                  placeholder="أدخل اسمك بالكامل هنا..."
                  placeholderTextColor={colors.gray}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Phone Number */}
              <View>
                <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
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
                  placeholder="01xxxxxxxxx (رقم الهاتف للتواصل معك)"
                  placeholderTextColor={colors.gray}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>

              {/* Email */}
              <View>
                <Text style={{ color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                  البريد الإلكتروني للتواصل
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
                  placeholder="example@gmail.com (للرد عليك عبر البريد)"
                  placeholderTextColor={colors.gray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

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
