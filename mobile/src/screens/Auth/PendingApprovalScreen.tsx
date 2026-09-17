import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Clock, RefreshCw, LogOut, PhoneCall } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { useAuthStore } from '../../store/authStore';

export default function PendingApprovalScreen() {
  const { user, checkAuth, logout } = useAuthStore();
  const [checking, setChecking] = useState(false);

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

  const isTech = user?.role === 'technician';
  const isMerchant = user?.role === 'merchant';
  const feeText = isTech ? '300 ج.م' : isMerchant ? '100 ج.م' : 'رسوم الاشتراك';
  const roleTitle = isTech ? 'فني صيانة معتمد 🧑‍🔧' : isMerchant ? 'تاجر ومورد قطع غيار 🏪' : 'حساب مهني';

  const handleRefreshStatus = async () => {
    setChecking(true);
    try {
      await checkAuth();
      Alert.alert('تحديث الحالة', 'تم فحص حالة الحساب. إذا وافقت الإدارة سيتم نقلك للوحة التحكم فوراً.');
    } catch {
      Alert.alert('خطأ', 'تعذر تحديث الحالة، تأكد من الاتصال بالإنترنت.');
    } finally {
      setChecking(false);
    }
  };

  const handleContactAdmin = () => {
    const phone = '01064739664';
    Linking.openURL(`tel:${phone}`).catch(() => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(`https://wa.me/20${phone.slice(1)}?text=${encodeURIComponent('السلام عليكم، قمت بسداد اشتراك TecnoRexa وبرجاء تفعيل حسابي.')}`, '_blank');
      }
    });
  };

  return (
    <SafeAreaView
      style={[
        {
          flex: 1,
          backgroundColor: '#0A0A0A',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.lg,
        },
        
      ]}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#141414',
          borderRadius: borderRadius.xl,
          borderWidth: 1.5,
          borderColor: '#D4AF37',
          padding: spacing.xl,
          alignItems: 'center',
          shadowColor: '#D4AF37',
          shadowOpacity: 0.15,
          shadowRadius: 15,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(212, 175, 55, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.md,
            borderWidth: 2,
            borderColor: '#D4AF37',
          }}
        >
          <Clock size={40} color="#D4AF37" />
        </View>

        <Text
          style={{
            color: '#D4AF37',
            fontSize: 22,
            fontWeight: '900',
            textAlign: 'center',
            marginBottom: spacing.xs,
          }}
        >
          طلبك قيد المراجعة والاعتماد ⏳
        </Text>

        <Text
          style={{
            color: colors.white,
            fontSize: 15,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: spacing.sm,
          }}
        >
          مرحباً {user?.name || 'بك'} — {roleTitle}
        </Text>

        <Text
          style={{
            color: colors.gray,
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: spacing.lg,
          }}
        >
          تم استلام طلب انضمامك وإيصال السداد بنجاح. يقوم فريق إدارة TecnoRexa بمطابقة التحويل وتفعيل كامل صلاحيات حسابك خلال 5 إلى 30 دقيقة.
        </Text>

        {/* Subscription details card */}
        <View
          style={{
            width: '100%',
            backgroundColor: '#1C1C1C',
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
            borderWidth: 1,
            borderColor: '#2A2A2A',
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.gray, fontSize: 12 }}>الرتبة المطلوبة:</Text>
            <Text style={{ color: '#D4AF37', fontWeight: 'bold', fontSize: 13 }}>{roleTitle}</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.gray, fontSize: 12 }}>رسوم الاشتراك:</Text>
            <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 13 }}>{feeText}</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.gray, fontSize: 12 }}>فودافون كاش المنصة:</Text>
            <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 13 }}>01064739664</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.gray, fontSize: 12 }}>حالة الطلب:</Text>
            <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 13 }}>قيد المراجعة الإدارية ⏳</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={{ width: '100%', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={handleRefreshStatus}
            disabled={checking}
            style={{
              flexDirection: 'row-reverse',
              backgroundColor: '#D4AF37',
              paddingVertical: 12,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#0A0A0A" />
            ) : (
              <>
                <RefreshCw size={18} color="#0A0A0A" />
                <Text style={{ color: '#0A0A0A', fontWeight: '900', fontSize: 14 }}>
                  تحديث حالة الحساب 🔄
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleContactAdmin}
            style={{
              flexDirection: 'row-reverse',
              backgroundColor: '#1E3A8A',
              paddingVertical: 12,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <PhoneCall size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>
              التواصل مع الإدارة (01064739664)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={{
              flexDirection: 'row-reverse',
              backgroundColor: '#262626',
              borderWidth: 1,
              borderColor: '#404040',
              paddingVertical: 12,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <LogOut size={18} color={colors.white} />
            <Text style={{ color: colors.white, fontWeight: 'bold', fontSize: 14 }}>
              تسجيل الخروج
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
