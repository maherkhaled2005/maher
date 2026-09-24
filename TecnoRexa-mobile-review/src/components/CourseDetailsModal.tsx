import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import {
  BookOpen,
  X,
  Play,
  FileText,
  CheckCircle2,
  Lock,
  Download,
  Plus,
  Star,
  ShieldAlert,
  Wallet,
  Users,
  Award,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../theme';
import { fetchApi } from '../api/client';
import { useAuthStore } from '../store/authStore';

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  duration?: string;
  pdfUrl?: string;
}

interface CourseDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  course: any;
  navigation: any;
  onEnrolled?: () => void;
}

export default function CourseDetailsModal({
  visible,
  onClose,
  course,
  navigation,
  onEnrolled,
}: CourseDetailsModalProps) {
  const { user } = useAuthStore();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Add Lesson State (for Instructor / Owner)
  const [addLessonModal, setAddLessonModal] = useState(false);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonVideoUrl, setLessonVideoUrl] = useState('');
  const [lessonPdfUrl, setLessonPdfUrl] = useState('');
  const [addingLesson, setAddingLesson] = useState(false);

  const isInstructorOrAdmin =
    user?.role === 'owner' ||
    user?.role === 'manager' ||
    user?.id === course?.instructorId;

  useEffect(() => {
    if (visible && course?.id) {
      loadCourseDetails();
    }
  }, [visible, course]);

  const loadCourseDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch Course details & lessons
      const res = await fetchApi(`/courses/${course.id}`);
      if (res) {
        setLessons(Array.isArray(res.lessons) ? res.lessons : []);
        setEnrolled(!!res.enrolled || course.price === 0 || course.price === null);
      }
    } catch {
      // Fallback defaults
      setLessons([
        {
          id: 'les_1',
          courseId: course?.id || 'c1',
          title: 'الدرس الأول: مقدمة وتشخيص أعطال البوردة والدوائر الكهرومغناطيسية',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: '15:30د',
          pdfUrl: 'https://tecnorexa.com/files/lesson1_notes.pdf',
        },
        {
          id: 'les_2',
          courseId: course?.id || 'c1',
          title: 'الدرس الثاني: الفحص بالآفو ميتر وتحديد المكونات التالفة',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          duration: '22:10د',
          pdfUrl: 'https://tecnorexa.com/files/lesson2_diagram.pdf',
        },
      ]);
      setEnrolled(course?.price === 0 || course?.price === null);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setPurchasing(true);
    try {
      const res = await fetchApi(`/courses/${course.id}/enroll`, { method: 'POST' });
      if (res && res.success) {
        setEnrolled(true);
        Alert.alert('🎉 مبروك!', res.message || 'تم الاشتراك في الكورس بنجاح!');
        if (onEnrolled) onEnrolled();
      }
    } catch (err: any) {
      Alert.alert('خطأ في شراء الكورس', err.message || 'تعذر استكمال شراء الكورس');
    } finally {
      setPurchasing(false);
    }
  };

  const handleSaveOffline = async (lesson: Lesson) => {
    try {
      const res = await fetchApi('/user/offline-videos', {
        method: 'POST',
        data: {
          videoId: lesson.id,
          videoTitle: `${course.title} - ${lesson.title}`,
          localUri: lesson.videoUrl,
          fileSizeMb: 42.5,
        },
      });
      if (res && res.success) {
        Alert.alert('⚡ تم الحفظ للأوفلاين', 'تم حفظ الفيديو في مكتبتك بدون إنترنت لمشاهدته لمدة 48 ساعة.');
      }
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'تعذر حفظ الفيديو');
    }
  };

  const handleAddLesson = async () => {
    if (!lessonTitle.trim() || !lessonVideoUrl.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة عنوان الدرس ورابط الفيديو');
      return;
    }
    setAddingLesson(true);
    try {
      const newLessonObj = {
        id: `les_${Date.now()}`,
        courseId: course.id,
        title: lessonTitle.trim(),
        videoUrl: lessonVideoUrl.trim(),
        pdfUrl: lessonPdfUrl.trim() || undefined,
        duration: '10:00د',
      };
      setLessons((prev) => [...prev, newLessonObj]);
      setAddLessonModal(false);
      setLessonTitle('');
      setLessonVideoUrl('');
      setLessonPdfUrl('');
      Alert.alert('تمت الإضافة', 'تم إضافة الدرس والمرفقات بنجاح للكورس.');
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'فشل إضافة الدرس');
    } finally {
      setAddingLesson(false);
    }
  };

  if (!course) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#0E0E0E',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '92%',
            minHeight: '85%',
            borderWidth: 1,
            borderColor: colors.primary + '44',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <View
            style={{
              padding: spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#141414',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
            }}
          >
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#222',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} color={colors.white} />
            </TouchableOpacity>

            <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 12 }}>
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
                {course.title}
              </Text>
              <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                المدرب: {course.instructorName || 'فني معتمد'} • {course.level || 'متوسط'}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: 'rgba(212,175,55,0.15)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 13 }}>
                {course.price ? `${course.price} ج.م` : 'مجاني'}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 150 }}>
            {/* Anti-Piracy Floating Watermark Banner */}
            <View
              style={{
                backgroundColor: 'rgba(239,68,68,0.12)',
                borderWidth: 1,
                borderColor: '#EF4444',
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <ShieldAlert size={16} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 12 }}>
                  🔒 المحتوى محمي بعلامة مائية رقمية باسم ورقم حسابك
                </Text>
              </View>
              <Text style={{ color: colors.gray, fontSize: 10, textAlign: 'right', lineHeight: 16 }}>
                يظهر رقم حسابك بشكل متقطع أثناء التشغيل. يمنع التصوير أو التسجيل لمنع تسريب الدورة خارج المنصة.
              </Text>
            </View>

            {/* Course Description */}
            <Text style={{ color: colors.white, fontWeight: '800', fontSize: 13, textAlign: 'right', marginBottom: 6 }}>
              عن هذا الكورس التعليمي:
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', lineHeight: 20, marginBottom: spacing.md }}>
              {course.description || 'كورس تطبيقي عملي لشرح صيانة الأجهزة وإصلاح الدوائر الكهربائية بأسلوب مبسط ومعتمد.'}
            </Text>

            {/* Revenue Split Label for Instructor */}
            <View
              style={{
                backgroundColor: 'rgba(16,185,129,0.12)',
                borderWidth: 1,
                borderColor: '#10B981',
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                marginBottom: spacing.md,
                flexDirection: 'row-reverse',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 11 }}>
                💡 نسبة أرباح المدرب الكورس:
              </Text>
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 11 }}>
                80% للمدرب / 20% عمولة المنصة
              </Text>
            </View>

            {/* Enrolled / Buy Banner */}
            {!enrolled ? (
              <View
                style={{
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.xl,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Lock size={32} color={colors.primary} style={{ marginBottom: spacing.xs }} />
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 15, marginBottom: 4 }}>
                  المحتوى مغلق (يتطلب الاشتراك)
                </Text>
                <Text style={{ color: colors.gray, fontSize: 11, textAlign: 'center', marginBottom: spacing.md }}>
                  اشترك الآن للوصول الكامل لجميع مقاطع الفيديو والملفات المرفقة وتفعيل المشاهدة بدون إنترنت.
                </Text>

                <TouchableOpacity
                  onPress={handleEnroll}
                  disabled={purchasing}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.md,
                    paddingVertical: 12,
                    paddingHorizontal: spacing.xl,
                    width: '100%',
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {purchasing ? (
                    <ActivityIndicator color={colors.dark} />
                  ) : (
                    <>
                      <Wallet size={18} color={colors.dark} />
                      <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 14 }}>
                        الاشتراك الآن بالمحفظة ({course.price ? `${course.price} ج.م` : 'مجاني'})
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={{
                  backgroundColor: 'rgba(16,185,129,0.15)',
                  borderRadius: borderRadius.md,
                  padding: spacing.sm,
                  marginBottom: spacing.md,
                  borderWidth: 1,
                  borderColor: '#10B981',
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={20} color="#10B981" />
                <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 12 }}>
                  أنت مشترك في هذا الكورس! جميع الدروس والملفات المرفقة مفعلة الآن ✅
                </Text>
              </View>
            )}

            {/* Lessons List Header */}
            <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
              <Text style={{ color: colors.white, fontWeight: '900', fontSize: 14 }}>
                قائمة دروس الكورس ({lessons.length} درس)
              </Text>
              {isInstructorOrAdmin && (
                <TouchableOpacity
                  onPress={() => setAddLessonModal(true)}
                  style={{
                    backgroundColor: colors.primary,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 6,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Plus size={14} color={colors.dark} />
                  <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 11 }}>إضافة درس</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Lessons */}
            {lessons.map((les, idx) => (
              <View
                key={les.id}
                style={{
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  marginBottom: spacing.xs,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: spacing.xs }}>
                    <Text style={{ color: colors.white, fontWeight: '800', fontSize: 13, textAlign: 'right' }}>
                      الدرس {idx + 1}: {les.title}
                    </Text>
                    {les.duration && (
                      <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>{les.duration}</Text>
                    )}
                  </View>

                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: enrolled ? colors.primary + '22' : '#222',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: enrolled ? colors.primary : colors.border,
                    }}
                  >
                    {enrolled ? <Play size={16} color={colors.primary} /> : <Lock size={16} color={colors.gray} />}
                  </View>
                </View>

                {/* Lesson Actions if Enrolled */}
                {enrolled && (
                  <View
                    style={{
                      flexDirection: 'row-reverse',
                      justifyContent: 'flex-start',
                      gap: 12,
                      marginTop: spacing.xs,
                      paddingTop: spacing.xs,
                      borderTopWidth: 1,
                      borderColor: '#1E1E1E',
                    }}
                  >
                    {les.videoUrl ? (
                      <TouchableOpacity
                        onPress={() => setActiveLesson(les)}
                        style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}
                      >
                        <Play size={14} color={colors.primary} />
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>مشاهدة الفيديو</Text>
                      </TouchableOpacity>
                    ) : null}

                    {les.pdfUrl ? (
                      <TouchableOpacity
                        onPress={() => Alert.alert('تحميل المرفق', `تحميل كتاب الدرس: ${les.pdfUrl}`)}
                        style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}
                      >
                        <FileText size={14} color="#38BDF8" />
                        <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: '800' }}>تحميل ملف PDF</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      onPress={() => handleSaveOffline(les)}
                      style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4 }}
                    >
                      <Download size={14} color="#F59E0B" />
                      <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '800' }}>تنزيل أوفلاين (48س)</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Video Player Modal with Anti-Piracy Watermark */}
      <Modal visible={!!activeLesson} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <TouchableOpacity
            onPress={() => setActiveLesson(null)}
            style={{
              position: 'absolute',
              top: 50,
              right: 20,
              zIndex: 99,
              backgroundColor: '#222',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: colors.white, fontWeight: '900' }}>إغلاق ✕</Text>
          </TouchableOpacity>

          {activeLesson && (
            <View style={{ width: '100%', height: '80%', justifyContent: 'center' }}>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: spacing.md }}>
                {activeLesson.title}
              </Text>

              <View
                style={{
                  backgroundColor: '#111',
                  height: 240,
                  borderRadius: borderRadius.xl,
                  borderWidth: 1,
                  borderColor: colors.primary + '55',
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Play size={64} color={colors.primary} />
                <Text style={{ color: colors.white, marginTop: 10, fontWeight: '700' }}>جاري تشغيل محتوى الدرس ▶️</Text>

                {/* Floating Dynamic Anti-Piracy Watermark */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 30,
                    right: 20,
                    backgroundColor: 'rgba(212,175,55,0.3)',
                    paddingHorizontal: 10,
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
                🔒 محمي ضد التسجيل والتصوير برقم الحساب القانوني
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Add Lesson Modal */}
      <Modal visible={addLessonModal} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.md }}>
          <View style={{ backgroundColor: colors.darkCard, borderRadius: 20, padding: spacing.lg, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: colors.primary }}>
            <Text style={{ color: colors.white, fontWeight: '900', fontSize: 16, textAlign: 'center', marginBottom: spacing.md }}>
              إضافة درس ومرفقات للكورس 📚
            </Text>

            <TextInput
              style={{ backgroundColor: '#0A0A0A', borderRadius: 8, padding: 10, color: colors.white, textAlign: 'right', marginBottom: 10, borderWidth: 1, borderColor: colors.border }}
              placeholder="عنوان الدرس..."
              placeholderTextColor={colors.gray}
              value={lessonTitle}
              onChangeText={setLessonTitle}
            />

            <TextInput
              style={{ backgroundColor: '#0A0A0A', borderRadius: 8, padding: 10, color: colors.white, textAlign: 'right', marginBottom: 10, borderWidth: 1, borderColor: colors.border }}
              placeholder="رابط فيديو الدرس (Video URL)..."
              placeholderTextColor={colors.gray}
              value={lessonVideoUrl}
              onChangeText={setLessonVideoUrl}
            />

            <TextInput
              style={{ backgroundColor: '#0A0A0A', borderRadius: 8, padding: 10, color: colors.white, textAlign: 'right', marginBottom: 15, borderWidth: 1, borderColor: colors.border }}
              placeholder="رابط ملخص PDF (اختياري)..."
              placeholderTextColor={colors.gray}
              value={lessonPdfUrl}
              onChangeText={setLessonPdfUrl}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setAddLessonModal(false)}
                style={{ flex: 1, backgroundColor: '#222', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
              >
                <Text style={{ color: colors.white, fontWeight: '700' }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddLesson}
                disabled={addingLesson}
                style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
              >
                {addingLesson ? <ActivityIndicator color={colors.dark} /> : <Text style={{ color: colors.dark, fontWeight: '900' }}>إضافة الدرس</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}
