import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { BookOpen, ChevronRight, Plus, Star, Users, CheckCircle2, X } from 'lucide-react-native';
import { fetchApi } from '../../api/client';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/common';
import OwnerHeader from '../../components/OwnerHeader';
import CourseDetailsModal from '../../components/CourseDetailsModal';
import { useAuthStore } from '../../store/authStore';

type Course = {
  id: string;
  title: string;
  description?: string;
  price?: number;
  instructorName?: string;
  instructorId?: string;
  level?: string;
  studentsCount?: number;
  rating?: number;
};

export default function CoursesScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Course Details Modal State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Add Course Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formLevel, setFormLevel] = useState('متوسط');

  const loadCourses = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    setError('');
    try {
      const data = await fetchApi('/courses');
      setCourses(Array.isArray(data) ? data : []);
    } catch (requestError: any) {
      setCourses([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleAddCourse = async () => {
    if (user?.role !== 'technician' && user?.role !== 'owner' && user?.role !== 'manager') {
      Alert.alert('تنبيه', 'نشر الكورسات والدروس التدريبية متاح فقط للفنيين المعتمدين 🔧');
      return;
    }
    if (!formTitle.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة عنوان الكورس');
      return;
    }
    const priceNum = parseFloat(formPrice) || 0;
    try {
      setLoading(true);
      const res = await fetchApi('/courses', {
        method: 'POST',
        data: {
          title: formTitle.trim(),
          description: formDesc.trim() || 'كورس تدريبي معتمد لصيانة الأجهزة المنزلية',
          price: priceNum,
          level: formLevel,
        },
      });

      setAddModalVisible(false);
      setFormTitle('');
      setFormDesc('');
      setFormPrice('');
      await loadCourses(true);
      Alert.alert('🎉 تم بنجاح!', res.message || 'تم رفع الكورس التدريبي بنجاح وهو قيد المراجعة والاعتماد.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر نشر الكورس، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.dark }, ]}>
      <OwnerHeader
        title="إدارة الكورسات والشروحات 📚"
        subtitle="الكورسات المنشورة والمحتوى التعليمي الخاص بك"
        sectionNumber={3}
        navigation={navigation}
        currentScreen="Courses"
        showBack={true}
        onRefresh={() => loadCourses(true)}
        rightAction={
          (user?.role === 'technician' || user?.role === 'owner' || user?.role === 'manager') ? (
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: borderRadius.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus color={colors.dark} size={16} />
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 12 }}>نشر كورس</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {error ? (
        <View style={{ padding: spacing.lg }}>
          <Text style={{ color: colors.danger, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity onPress={() => loadCourses()} style={{ marginTop: spacing.md, alignItems: 'center' }}>
            <Text style={{ color: colors.primary, fontWeight: '800' }}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={courses}
        keyExtractor={(course) => course.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCourses(true)} tintColor={colors.primary} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 150, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md, gap: spacing.xs }}>
            {/* Anti-Piracy Protection Badge */}
            <View style={{ backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: '#EF4444', padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' }}>
              <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 12 }}>🔒 المحتوى محمي ضد النسخ والتصوير غير المصرح به</Text>
              <Text style={{ color: colors.gray, fontSize: 10, marginTop: 2, textAlign: 'center' }}>جميع الفيديوهات والملفات مشفرة ومحمية بالحقوق الملكية الفكرية لمنصة TecnoRexa</Text>
            </View>

            {/* 80/20 Revenue Split Notice */}
            <View style={{ backgroundColor: 'rgba(16,185,129,0.12)', borderWidth: 1, borderColor: '#10B981', padding: spacing.sm, borderRadius: borderRadius.md, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 11 }}>💡 نسبة الأرباح للمدربين:</Text>
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 11 }}>80% للمصمم / 20% عمولة المنصة</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              setSelectedCourse(item);
              setDetailsModalVisible(true);
            }}
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
                <View style={{ backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: colors.primary }}>
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '900' }}>
                    {item.price ? `${item.price} ج.م` : 'مجاني'}
                  </Text>
                </View>
                {item.level && (
                  <View style={{ backgroundColor: '#1E293B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                    <Text style={{ color: '#38BDF8', fontSize: 10, fontWeight: '800' }}>{item.level}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: colors.gray, fontSize: 10 }}>#{item.id}</Text>
            </View>

            <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15, textAlign: 'right', marginBottom: 4 }}>
              {item.title}
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', lineHeight: 18, marginBottom: 10 }} numberOfLines={2}>
              {item.description || 'كورس تعليمي معتمد'}
            </Text>

            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: colors.border, paddingTop: 8 }}>
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}>
                <Star size={12} color={colors.primary} fill={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>{item.rating || 0}</Text>
                <Text style={{ color: colors.gray, fontSize: 10 }}>({item.studentsCount || 0} طالب)</Text>
              </View>
              <Text style={{ color: colors.gray, fontSize: 11 }}>المدرب: {item.instructorName || 'فني معتمد'}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.xxxl }}>
            <BookOpen color={colors.gray} size={48} />
            <Text style={{ color: colors.white, fontWeight: '800', marginTop: spacing.md }}>لا توجد كورسات بعد</Text>
            <Text style={{ color: colors.gray, marginTop: spacing.xs, textAlign: 'center' }}>ستظهر هنا الكورسات التي يتم نشرها واعتمادها فعلياً.</Text>
          </View>
        }
      />

      {/* Interactive Course Details Modal */}
      <CourseDetailsModal
        visible={detailsModalVisible}
        onClose={() => setDetailsModalVisible(false)}
        course={selectedCourse}
        navigation={navigation}
        onEnrolled={() => loadCourses()}
      />

      {/* Add Course Modal */}
      <Modal visible={addModalVisible} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View
            style={{
              backgroundColor: colors.darkCard,
              borderRadius: 24,
              padding: spacing.xl,
              borderWidth: 1,
              borderColor: colors.primary,
              width: '100%',
              maxWidth: 480,
            }}
          >
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: colors.white }}>نشر كورس تدريبي جديد 📚</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X color={colors.gray} size={22} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.gray, textAlign: 'right', marginBottom: 4 }}>
              عنوان الكورس *
            </Text>
            <TextInput
              placeholder="مثال: دبلومة صيانة كروت التكييف الإنفرتر"
              placeholderTextColor={colors.gray}
              value={formTitle}
              onChangeText={setFormTitle}
              style={{
                backgroundColor: colors.dark,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                paddingHorizontal: 12,
                height: 42,
                textAlign: 'right',
                fontSize: 13,
                color: colors.white,
                marginBottom: 10,
              }}
            />

            <Text style={{ fontSize: 12, fontWeight: '800', color: colors.gray, textAlign: 'right', marginBottom: 4 }}>
              وصف الكورس والمحاور *
            </Text>
            <TextInput
              placeholder="اكتب نبذة عن الدورة والمستفيدين والمهارات المكتسبة..."
              placeholderTextColor={colors.gray}
              value={formDesc}
              onChangeText={setFormDesc}
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: colors.dark,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: borderRadius.md,
                padding: 10,
                textAlign: 'right',
                fontSize: 13,
                color: colors.white,
                height: 70,
                textAlignVertical: 'top',
                marginBottom: 10,
              }}
            />

            <View style={{ flexDirection: 'row-reverse', gap: 10, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.gray, textAlign: 'right', marginBottom: 4 }}>
                  سعر الاشتراك (ج.م) *
                </Text>
                <TextInput
                  placeholder="مثال: 350"
                  placeholderTextColor={colors.gray}
                  value={formPrice}
                  onChangeText={setFormPrice}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: colors.dark,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    paddingHorizontal: 12,
                    height: 42,
                    textAlign: 'right',
                    fontSize: 13,
                    color: colors.white,
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: colors.gray, textAlign: 'right', marginBottom: 4 }}>
                  مستوى الكورس
                </Text>
                <TextInput
                  placeholder="مبتدئ / متوسط / متقدم"
                  placeholderTextColor={colors.gray}
                  value={formLevel}
                  onChangeText={setFormLevel}
                  style={{
                    backgroundColor: colors.dark,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: borderRadius.md,
                    paddingHorizontal: 12,
                    height: 42,
                    textAlign: 'right',
                    fontSize: 13,
                    color: colors.white,
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAddCourse}
              style={{
                backgroundColor: colors.primary,
                paddingVertical: 14,
                borderRadius: borderRadius.md,
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 14 }}>نشر الكورس في المنصة 🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
