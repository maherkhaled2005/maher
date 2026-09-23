import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import OwnerHeader from '../../components/OwnerHeader';
import {
  Activity,
  Server,
  Database,
  Cpu,
  Zap,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card, Button, Loading } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { fetchApi } from '../../api/client';
import { normalizeRole } from '../../utils/permissions';

// ===== أنواع البيانات =====
interface Service {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: string;
  ping: string;
  memory: string;
}

// ===== الشاشة الرئيسية =====
export default function SystemOpsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const role = normalizeRole(user?.role || 'customer');
  const isLead = user?.developerRank === 'lead' || role === 'owner';

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const fetchServices = async () => {
    try {
      const data = await fetchApi('/system/services');
      if (Array.isArray(data)) setServices(data);
    } catch (error) {
      // fallback if offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const interval = setInterval(fetchServices, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRestartService = (serviceId: string) => {
    if (!isLead) {
      Alert.alert('غير مسموح', 'هذه الصلاحية للمبرمج الرئيسي أو المالك فقط');
      return;
    }
    Alert.alert('إعادة فحص الخدمة', `هل أنت متأكد من إعادة فحص وتهيئة هذه الخدمة؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'تهيئة الخدمة',
        onPress: async () => {
          try {
            await fetchApi('/system/restart-service', {
              method: 'POST',
              body: JSON.stringify({ serviceId }),
            });
            await fetchServices();
            Alert.alert('تم بنجاح', 'تمت إعادة فحص وتهيئة الخدمة وتحديث حالتها التشغيلية.');
          } catch (err: any) {
            Alert.alert('خطأ', err.message || 'تعذر تهيئة الخدمة');
          }
        },
      },
    ]);
  };

  const handleClearCache = () => {
    if (!isLead) {
      Alert.alert('غير مسموح', 'هذه الصلاحية للمبرمج الرئيسي أو المالك فقط');
      return;
    }
    Alert.alert('مسح الذاكرة المؤقتة', 'هل أنت متأكد من تفريغ كاش النظام والذاكرة المؤقتة؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'مسح الكاش',
        onPress: async () => {
          try {
            await fetchApi('/system/clear-cache', { method: 'POST' });
            await fetchServices();
            Alert.alert('تم', 'تم تفريغ الذاكرة المؤقتة بنجاح ✅');
          } catch (err: any) {
            Alert.alert('خطأ', err.message || 'تعذر تفريغ الكاش');
          }
        },
      },
    ]);
  };

  const handleFullRestart = () => {
    if (!isLead) {
      Alert.alert('غير مسموح', 'هذه الصلاحية للمبرمج الرئيسي أو المالك فقط');
      return;
    }
    Alert.alert(
      'تحذير أمني ⚠️',
      'إعادة إشارة تشغيل الخادم ستتحقق من كافة العمليات وتحديث نبض النظام. هل أنت متأكد؟',
      [
        { text: 'تراجع', style: 'cancel' },
        {
          text: 'إعادة تهيئة الخادم',
          style: 'destructive',
          onPress: async () => {
            setRestarting(true);
            try {
              await fetchApi('/system/restart-server', { method: 'POST' });
              await fetchServices();
              Alert.alert('تم بنجاح', 'تم إرسال إشارة إعادة التهيئة للخادم بنجاح ✅');
            } catch (err: any) {
              Alert.alert('خطأ', err.message || 'تعذر إرسال الإشارة');
            } finally {
              setRestarting(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return colors.success;
      case 'offline': return colors.danger;
      case 'degraded': return colors.warning;
      default: return colors.gray;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return '🟢 شغال';
      case 'offline': return '🔴 متوقف';
      case 'degraded': return '🟡 ضعيف';
      default: return status;
    }
  };

  if (loading) {
    return <Loading message="جاري فحص النظام..." fullScreen />;
  }

  if (!isLead && role !== 'programmer') {
    return (
      <SafeAreaView
        style={[
          { flex: 1, backgroundColor: colors.dark },
          
        ]}
      >
        <OwnerHeader
          title="مراقبة الخوادم والأنظمة"
          subtitle="غير مصرح"
          navigation={navigation}
          currentScreen="SystemOps"
          showBack
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Activity color={colors.gray} size={48} />
          <Text style={{ color: colors.gray, fontSize: typography.sizes.lg, marginTop: spacing.md, textAlign: 'center' }}>
            غير مصرح لك بمشاهدة مراقبة النظام
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* ☰ Owner Header with Drawer navigation & back */}
      <OwnerHeader
        title="مراقبة الخوادم والأنظمة"
        subtitle={isLead ? 'صلاحية القائد (التحكم الكامل)' : 'وضع القراءة فقط 🔒'}
        navigation={navigation}
        currentScreen="SystemOps"
        showBack
        onRefresh={fetchServices}
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchServices(); }} tintColor={colors.primary} />}
      >
        {/* ===== حالة الخدمات ===== */}
        {services.map(service => (
          <Card key={service.id} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: typography.sizes.md }}>{service.name}</Text>
                <Text style={{ color: getStatusColor(service.status), fontSize: typography.sizes.sm, fontWeight: '700' }}>
                  {getStatusLabel(service.status)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Text style={{ color: colors.gray, fontSize: typography.sizes.xs }}>⏱ {service.ping}</Text>
                <Text style={{ color: colors.gray, fontSize: typography.sizes.xs }}>🧠 {service.memory}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, marginTop: spacing.sm }}>
              <Text style={{ color: colors.gray, fontSize: typography.sizes.xs }}>وقت التشغيل: {service.uptime}</Text>
              {isLead && (
                <Button
                  title="إعادة تشغيل"
                  onPress={() => handleRestartService(service.id)}
                  variant="outline"
                  size="sm"
                />
              )}
            </View>
          </Card>
        ))}

        {/* ===== أزرار القائد ===== */}
        {isLead && (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: typography.sizes.lg, textAlign: 'right', marginBottom: spacing.md }}>
              أزرار القيادة التقنية 👑
            </Text>

            <Button
              title="🧹 مسح كاش Redis"
              onPress={handleClearCache}
              variant="secondary"
              fullWidth
              style={{ marginBottom: spacing.sm }}
            />

            <Button
              title={restarting ? '⏳ جاري إعادة التشغيل...' : '⚡ إعادة تشغيل السيرفر بالكامل'}
              onPress={handleFullRestart}
              variant="danger"
              fullWidth
              disabled={restarting}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
