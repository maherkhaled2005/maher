import React from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { ShieldAlert, LogOut, PhoneCall } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';

export default function BannedScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('هل أنت متأكد أنك تريد تسجيل الخروج؟')) {
        logout();
      }
    } else {
      Alert.alert(
        'تأكيد تسجيل الخروج',
        'هل أنت متأكد أنك تريد تسجيل الخروج؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { text: 'تسجيل الخروج', style: 'destructive', onPress: () => logout() },
        ],
        { cancelable: true }
      );
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('tel:01064739664').catch(() => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open('https://wa.me/201064739664', '_blank');
      }
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
      <View style={{ width: '100%', maxWidth: 480, backgroundColor: '#141414', borderRadius: borderRadius.xl, borderWidth: 1.5, borderColor: '#EF4444', padding: spacing.xl, alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 2, borderColor: '#EF4444' }}>
          <ShieldAlert size={44} color="#EF4444" />
        </View>
        <Text style={{ color: '#EF4444', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: spacing.xs }}>
          تم حظر هذا الحساب 🔒
        </Text>
        <Text style={{ color: colors.white, fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: spacing.sm }}>
          الحساب موقوف بقرار إداري من إدارة المنصة
        </Text>
        <Text style={{ color: colors.gray, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg }}>
          لقد تم تعليق صلاحيات هذا الحساب وتجميده على المنصة لمخالفة اللوائح والشروط أو لأسباب إدارية. لا يمكنك الوصول إلى لوحة التحكم أو استقبال طلبات أو تنفيذ أي معاملات.
        </Text>
        <View style={{ width: '100%', backgroundColor: '#1C1C1C', borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: '#2A2A2A', gap: 8 }}>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.gray, fontSize: 12 }}>اسم المستخدم:</Text>
            <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 13 }}>{user?.name || 'غير معروف'}</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.gray, fontSize: 12 }}>الرتبة:</Text>
            <Text style={{ color: '#EF4444', fontWeight: 'bold', fontSize: 13 }}>{user?.role || 'غير محدد'}</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.gray, fontSize: 12 }}>رقم الهاتف:</Text>
            <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 13 }}>{user?.phone || 'غير محدد'}</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.gray, fontSize: 12 }}>حالة الحساب:</Text>
            <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 13 }}>محظور نهائياً 🔒</Text>
          </View>
        </View>
        <View style={{ width: '100%', gap: spacing.sm }}>
          <TouchableOpacity onPress={handleContactSupport} style={{ flexDirection: 'row-reverse', backgroundColor: '#1E3A8A', paddingVertical: 12, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <PhoneCall size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>التواصل مع الإدارة والدعم الفني</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={{ flexDirection: 'row-reverse', backgroundColor: '#262626', borderWidth: 1, borderColor: '#404040', paddingVertical: 12, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <LogOut size={18} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 14 }}>تسجيل الخروج والتبديل لحساب آخر</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
