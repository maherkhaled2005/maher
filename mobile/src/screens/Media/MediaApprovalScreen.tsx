import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Platform, Image, ActivityIndicator, RefreshControl } from 'react-native';
import {
  Video,
  Play,
  CheckCircle2,
  XCircle,
  Trash2,
  Clock,
  ArrowLeft,
  Crown,
  Eye,
  Film,
  BookOpen,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';
import { api } from '../../api/client';

interface MediaItem {
  id: string;
  title: string;
  author: string;
  role: string;
  type: 'reel' | 'course' | 'tutorial';
  thumbnail: string;
  videoUrl?: string;
  duration: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
export default function MediaApprovalScreen({ navigation }: any) {
  const [filter, setFilter] = useState<'pending' | 'approved'>('pending');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reject Modal State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Video Player Modal State
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  const loadMedia = useCallback(async () => {
    try {
      const res = await api.get('/admin/media');
      if (Array.isArray(res.data)) {
        setMediaList(
          res.data.map((item: any) => ({
            id: String(item.id),
            title: item.title || item.description || 'محتوى بدون عنوان',
            author: item.userName || 'مستخدم المنظومة',
            role: item.type === 'course' ? 'مدرب معتمد 🎓' : 'فني معتمد 🔧',
            type: item.type || 'reel',
            thumbnail: item.thumbnail || item.videoUrl || '',
            videoUrl: item.videoUrl,
            duration: item.duration || '0:45',
            status: item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending',
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-EG') : 'اليوم',
          }))
        );
      }
    } catch {
      // Keep existing list on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMedia();
  }, [loadMedia]);

  const handleApprove = async (item: MediaItem) => {
    try {
      await api.post(`/admin/media/${item.type}/${item.id}/approve`);
      setMediaList(prev => prev.map((m) => (m.id === item.id ? { ...m, status: 'approved' } : m)));
      Alert.alert('✅ تمت الموافقة', 'تم اعتماد المحتوى ونشره فوراً في المنظومة.');
    } catch {
      Alert.alert('خطأ', 'تعذر اعتماد المحتوى. حاول مرة أخرى.');
    }
  };

  const handleOpenReject = (item: MediaItem) => {
    setSelectedMediaItem(item);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة سبب الرفض ليظهر للمستخدم.');
      return;
    }
    if (selectedMediaItem) {
      try {
        await api.post(`/admin/media/${selectedMediaItem.type}/${selectedMediaItem.id}/reject`, {
          reason: rejectReason.trim(),
        });
        setMediaList(prev => prev.filter((m) => m.id !== selectedMediaItem.id));
        setRejectModalVisible(false);
        Alert.alert('تم الرفض', 'تم رفض المحتوى وإرسال إشعار لصاحب المحتوى بالسبب.');
      } catch {
        Alert.alert('خطأ', 'تعذر تسجيل الرفض. حاول مرة أخرى.');
      }
    }
  };

  const handleDelete = async (item: MediaItem) => {
    const performDelete = async () => {
      try {
        await api.delete(`/admin/media/${item.type}/${item.id}`);
        setMediaList(prev => prev.filter((m) => m.id !== item.id));
        Alert.alert('تم الحذف', 'تم حذف المحتوى بنجاح.');
      } catch {
        Alert.alert('خطأ', 'تعذر حذف المحتوى.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('هل أنت متأكد من حذف هذا المحتوى نهائياً؟')) {
        await performDelete();
      }
    } else {
      Alert.alert('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المحتوى نهائياً؟', [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: performDelete,
        },
      ]);
    }
  };

  const filtered = mediaList.filter((m) => (filter === 'pending' ? m.status === 'pending' : m.status === 'approved'));

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* ☰ Owner Header with Drawer navigation */}
      <OwnerHeader
        title="المركز الإعلامي والفيديوهات"
        subtitle="رقابة المحتوى واعتماد الفيديوهات والكورسات"
        sectionNumber={15}
        navigation={navigation}
        currentScreen="MediaApproval"
        showBack
      />

      {/* Tabs */}
      <View style={{ flexDirection: 'row', padding: spacing.md, gap: spacing.sm, backgroundColor: colors.darkCard }}>
        <TouchableOpacity
          onPress={() => setFilter('pending')}
          style={{ flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: filter === 'pending' ? colors.primary : 'transparent' }}
        >
          <Text style={{ color: filter === 'pending' ? colors.dark : colors.gray, fontWeight: '900', fontSize: 13 }}>
            ⏳ قيد الانتظار ({mediaList.filter((m) => m.status === 'pending').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('approved')}
          style={{ flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md, backgroundColor: filter === 'approved' ? colors.primary : 'transparent' }}
        >
          <Text style={{ color: filter === 'approved' ? colors.dark : colors.gray, fontWeight: '900', fontSize: 13 }}>
            ✅ المحتوى المنشور ({mediaList.filter((m) => m.status === 'approved').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.gray, marginTop: spacing.md, fontSize: 13, fontWeight: '700' }}>
              جاري فحص المحتوى الإعلامي المعلق...
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Film size={48} color={colors.gray} />
            <Text style={{ color: colors.gray, marginTop: spacing.md, fontSize: 15 }}>لا توجد فيديوهات في هذه القائمة حالياً.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {filtered.map((item) => (
              <View key={item.id} style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
                {/* Thumbnail & Play Overlay */}
                <View style={{ height: 160, backgroundColor: '#181818', position: 'relative' }}>
                  <Image source={{ uri: item.thumbnail }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => {
                      setPreviewMedia(item);
                      setPreviewModalVisible(true);
                    }}
                    style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -24 }, { translateY: -24 }], width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212,175,55,0.9)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Play size={24} color={colors.dark} fill={colors.dark} />
                  </TouchableOpacity>
                  <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                    <Text style={{ color: colors.white, fontSize: 11, fontWeight: '700' }}>{item.duration}</Text>
                  </View>
                </View>

                {/* Details */}
                <View style={{ padding: spacing.md }}>
                  <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15, textAlign: 'right', marginBottom: 6 }}>{item.title}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                    <Text style={{ color: colors.gray, fontSize: 12 }}>{item.date}</Text>
                    <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>بواسطة: {item.author} ({item.role})</Text>
                  </View>

                  {/* Actions */}
                  {item.status === 'pending' ? (
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <TouchableOpacity
                        onPress={() => handleOpenReject(item)}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: '#EF4444', paddingVertical: spacing.sm, borderRadius: borderRadius.md, gap: 6 }}
                      >
                        <XCircle size={16} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 13 }}>رفض المحتوى</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleApprove(item)}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: spacing.sm, borderRadius: borderRadius.md, gap: 6 }}
                      >
                        <CheckCircle2 size={16} color={colors.dark} />
                        <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 13 }}>موافقة ونشر ✅</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleDelete(item)}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: '#EF4444', paddingVertical: spacing.sm, borderRadius: borderRadius.md, gap: 6 }}
                    >
                      <Trash2 size={16} color="#EF4444" />
                      <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 13 }}>حذف المحتوى من المنصة</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Reject Modal */}
      <Modal visible={rejectModalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: spacing.xl }}>
          <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.xl, padding: spacing.xl, borderWidth: 1, borderColor: '#EF4444' }}>
            <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: '900', textAlign: 'right', marginBottom: spacing.sm }}>رفض نشر الفيديو ⛔</Text>
            <Text style={{ color: colors.gray, fontSize: 13, textAlign: 'right', marginBottom: spacing.md }}>يرجى كتابة سبب الرفض بدقة ليصل إشعار للفني بتعديل المحتوى:</Text>
            <TextInput
              style={{ backgroundColor: colors.darkCard, borderRadius: borderRadius.md, padding: spacing.md, color: colors.white, textAlign: 'right', height: 90, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border }}
              placeholder="مثال: جودة الصوت ضعيفة، أو يوجد شعار مخالف لسياسة المنصة..."
              placeholderTextColor={colors.gray}
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)} style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.darkCard, alignItems: 'center' }}>
                <Text style={{ color: colors.gray, fontWeight: '700' }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmReject} style={{ flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: '#EF4444', alignItems: 'center' }}>
                <Text style={{ color: colors.white, fontWeight: '900' }}>تأكيد الرفض</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal visible={previewModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', padding: spacing.lg }}>
          <View style={{ backgroundColor: '#141414', borderRadius: borderRadius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.primary }}>
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16, textAlign: 'right', marginBottom: spacing.md }}>
              معاينة: {previewMedia?.title}
            </Text>
            <View style={{ height: 220, backgroundColor: '#000', borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
              <Play size={40} color={colors.primary} />
              <Text style={{ color: colors.gray, marginTop: 8, fontSize: 12 }}>مشغل الفيديو الذكي المدمج في TecnoRexa</Text>
            </View>
            <TouchableOpacity onPress={() => setPreviewModalVisible(false)} style={{ backgroundColor: colors.primary, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' }}>
              <Text style={{ color: colors.dark, fontWeight: '900' }}>إغلاق المعاينة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
