import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Download, Trash2, Play, Clock, HardDrive, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';
import { fetchApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface OfflineVideo {
  id: string;
  videoId: string;
  videoTitle: string;
  localUri: string;
  fileSizeMb?: number;
  downloadedAt: string;
  expiresAt?: string;
}

export default function OfflineLibraryScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<OfflineVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<OfflineVideo | null>(null);
  const [playerVisible, setPlayerVisible] = useState(false);

  const loadOfflineVideos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/user/offline-videos');
      setVideos(Array.isArray(data) ? data : []);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOfflineVideos();
  }, [loadOfflineVideos]);

  const handleDelete = async (id: string, title: string) => {
    try {
      await fetchApi(`/user/offline-videos/${id}`, { method: 'DELETE' });
      setVideos((prev) => prev.filter((v) => v.id !== id));
      Alert.alert('تم الحذف', `تم حذف فيديو "${title}" من المكتبة الشخصية.`);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر حذف الفيديو');
    }
  };

  const getRemainingTimeText = (downloadedAtStr: string, expiresAtStr?: string) => {
    const downloadedTime = new Date(downloadedAtStr).getTime();
    const expireTime = expiresAtStr
      ? new Date(expiresAtStr).getTime()
      : downloadedTime + 48 * 60 * 60 * 1000; // 48 hours default

    const diffMs = expireTime - Date.now();
    if (diffMs <= 0) return 'منتهي (سيتم المسح)';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `متاح: ${hours} ساعة و ${minutes} دقيقة`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.dark }}>
      <OwnerHeader
        title="مكتبة الأوفلاين (بدون إنترنت) ⚡"
        subtitle="الفيديوهات والكورسات المحفوظة مؤقتاً لملاحقتها"
        navigation={navigation}
        showBack={true}
      />

      {/* Header Info Banner */}
      <View
        style={{
          margin: spacing.md,
          backgroundColor: 'rgba(245,158,11,0.12)',
          borderWidth: 1,
          borderColor: '#F59E0B',
          borderRadius: borderRadius.lg,
          padding: spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <Clock size={18} color="#F59E0B" />
          <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>
            سيتم مسح المحتوى تلقائياً بعد 48 ساعة ⏱️
          </Text>
        </View>
        <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'right', lineHeight: 18 }}>
          حفاظاً على مساحة جهازك وحماية المحتوى، تُتاح الفيديوهات للمشاهدة بدون إنترنت لمدة 48 ساعة فقط من لحظة التنزيل.
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ color: colors.gray, marginTop: spacing.md }}>جاري جلب مكتبة الأوفلاين...</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadOfflineVideos()} tintColor={colors.primary} />
          }
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.xl,
                padding: spacing.md,
                marginBottom: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      backgroundColor: 'rgba(16,185,129,0.15)',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: '#10B981',
                    }}
                  >
                    <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '900' }}>
                      ⚡ جاهز بدون إنترنت
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <HardDrive size={12} color={colors.gray} />
                    <Text style={{ color: colors.gray, fontSize: 11, fontWeight: '700' }}>
                      {item.fileSizeMb || 45.2} MB
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.videoTitle)}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>

              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15, textAlign: 'right', marginBottom: 8 }}>
                {item.videoTitle}
              </Text>

              {/* Countdown badge */}
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: spacing.sm }}>
                <Clock size={14} color="#F59E0B" />
                <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '800' }}>
                  {getRemainingTimeText(item.downloadedAt, item.expiresAt)}
                </Text>
              </View>

              {/* Play Button */}
              <TouchableOpacity
                onPress={() => {
                  setSelectedVideo(item);
                  setPlayerVisible(true);
                }}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.md,
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <Play size={16} color={colors.dark} fill={colors.dark} />
                <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 13 }}>
                  تشغيل الفيديو الآن (أوفلاين)
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxxl }}>
              <Download color={colors.gray} size={50} />
              <Text style={{ color: colors.white, fontWeight: '800', marginTop: spacing.md, fontSize: 16 }}>
                لا توجد فيديوهات مضافة للأوفلاين
              </Text>
              <Text style={{ color: colors.gray, marginTop: spacing.xs, textAlign: 'center', fontSize: 12 }}>
                يمكنك الضغط على زر "تحميل بدون إنترنت" على أي فيديو أو كورس لحفظه هنا للمشاهدة لمدة 48 ساعة.
              </Text>
            </View>
          }
        />
      )}

      {/* Offline Video Player Modal */}
      <Modal visible={playerVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
          {selectedVideo && (
            <View style={{ width: '100%', height: '100%', padding: spacing.md, justifyContent: 'center' }}>
              <TouchableOpacity
                onPress={() => setPlayerVisible(false)}
                style={{
                  position: 'absolute',
                  top: 50,
                  right: 20,
                  zIndex: 99,
                  backgroundColor: '#222',
                  padding: 10,
                  borderRadius: 20,
                }}
              >
                <Text style={{ color: colors.white, fontWeight: '900' }}>إغلاق ✕</Text>
              </TouchableOpacity>

              {/* Player Mock Header */}
              <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
                <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
                  {selectedVideo.videoTitle}
                </Text>
                <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4 }}>
                  ⚡ كورس متاح بدون اتصال بالإنترنت ({selectedVideo.fileSizeMb || 45.2} MB)
                </Text>
              </View>

              {/* Floating Dynamic Watermark for Anti-Piracy */}
              <View
                style={{
                  backgroundColor: 'rgba(0,0,0,0.85)',
                  borderRadius: borderRadius.xl,
                  height: 250,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.primary + '44',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Play size={60} color={colors.primary} />
                <Text style={{ color: colors.white, fontWeight: '800', marginTop: spacing.md }}>
                  جاري تشغيل الفيديو المشفر أوفلاين ▶️
                </Text>

                {/* Floating Watermark */}
                <View
                  style={{
                    position: 'absolute',
                    top: 20,
                    left: 20,
                    backgroundColor: 'rgba(212,175,55,0.25)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: colors.primary,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>
                    🔒 {user?.phone || 'TecnoRexa'} - {user?.name || 'مستخدم معتمد'}
                  </Text>
                </View>
              </View>

              <Text style={{ color: '#EF4444', fontSize: 11, textAlign: 'center', marginTop: spacing.md, fontWeight: '700' }}>
                🔒 المحتوى محمي برقم حسابك - يمنع منعاً باتاً التسجيل أو التصوير
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
