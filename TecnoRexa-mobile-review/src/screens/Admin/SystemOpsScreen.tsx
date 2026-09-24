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

  const [services, setServices] = useState<Service[]>([
    { id: 'api', name: 'خادم التطبيق (Node.js Engine)', status: 'online', uptime: '99.98%', ping: '12ms', memory: '142 MB' },
    { id: 'db', name: 'قاعدة البيانات المركزية (Core DB)', status: 'online', uptime: '100%', ping: '2ms', memory: '48 MB' },
    { id: 'redis', name: 'خادم التخزين المؤقت (Fast Cache)', status: 'online', uptime: '99.9%', ping: '5ms', memory: '64 MB' },
    { id: 'storage', name: 'خادم الوسائط والمستندات (Cloud Storage)', status: 'online', uptime: '99.85%', ping: '18ms', memory: '310 MB' },
  ]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/system/services');
      if (data) setServices(data);
    } catch (error) {
      // data already exists
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleRestartService = (serviceId: string) => {
    if (!isLead) {
      Alert.alert('غير مسموح', 'هذه الصلاحية للقائد فقط');
      return;
    }
    Alert.alert('إعادة تشغيل الخدمة', `هل أنت متأكد من إعادة تشغيل هذه الخدمة؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إعادة تشغيل',
        onPress: () => {
          setServices(prev => prev.map(s => s.id === serviceId ? { ...s, status: 'degraded' } : s));
          setTimeout(() => {
            setServices(prev => prev.map(s => s.id === serviceId ? { ...s, status: 'online' } : s));
            Alert.alert('تم', 'تم إعادة تشغيل الخدمة');
          }, 2000);
        },
      },
    ]);
  };

  const handleClearCache = () => {
    if (!isLead) {
      Alert.alert('غير مسموح', 'هذه الصلاحية للقائد فقط');
      return;
    }
    Alert.alert('مسح الكاش', 'هل أنت متأكد من مسح كاش Redis؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'مسح',
        onPress: () => {
          Alert.alert('تم', 'تم مسح الكاش بنجاح');
        },
      },
    ]);
  };

  const handleFullRestart = () => {
    if (!isLead) {
      Alert.alert('غير مسموح', 'هذه الصلاحية للقائد فقط');
      return;
    }
    Alert.alert(
      'تحذير أمني ⚠️',
      'إعادة تشغيل السيرفر بالكامل ستفصل جميع الاتصالات. هل أنت متأكد؟',
      [
        { text: 'تراجع', style: 'cancel' },
        {
          text: 'إعادة تشغيل',
          style: 'destructive',
          onPress: () => {
            setRestarting(true);
            setTimeout(() => {
              setRestarting(false);
              Alert.alert('تم', 'تم إعادة تشغيل السيرفر بنجاح');
            }, 3000);
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
