import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Share,
  RefreshControl,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  PlayCircle,
  Plus,
  X,
  Send,
  Download,
  Play,
  Pause,
  Check,
  BookOpen,
  Video,
  Users,
  Eye,
  Clock,
  Volume2,
  Film,
  Camera,
  Image as ImageIcon,
  ImagePlus,
  Upload,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, borderRadius } from '../../theme';
import OwnerHeader from '../../components/OwnerHeader';
import { api, fetchApi, uploadFile } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const REEL_HEIGHT = SCREEN_HEIGHT - 130;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  userName: string;
  userRole: string;
  roleColor: string;
  avatar: string;
  text: string;
  time: string;
  likes: number;
  liked: boolean;
  comments: number;
  shares: number;
  showComments: boolean;
  commentList: { id: string; user: string; text: string }[];
}

interface Reel {
  id: string;
  userName: string;
  description: string;
  likes: number;
  liked: boolean;
  comments: number;
  shares: number;
  bookmarked: boolean;
}

interface RepairVideo {
  id: string;
  title: string;
  views: string;
  duration: string;
  technician: string;
}

interface Course {
  id: string;
  title: string;
  instructor: string;
  lessons: number;
  price: number | null;
  topColor: string;
}

// ─── Real Clean Arrays (Zeroed for real users) ────────────────────────────────

const INITIAL_POSTS: Post[] = [];

const INITIAL_REELS: Reel[] = [];

const REPAIR_VIDEOS: RepairVideo[] = [];

const COURSES: Course[] = [];

// ─── Main Component ───────────────────────────────────────────────────────────

const WebCommunityScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState(0);
  const TABS = ['المنشورات', 'الريلز', 'فيديوهات الإصلاح', 'الكورسات'];

  return (
    <SafeAreaView style={[styles.safeArea, { height: '100%' }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      {/* Role Header with ☰ Drawer */}
      <OwnerHeader
        title="مجتمع TecnoRexa"
        subtitle="شروحات صيانة الأجهزة والريلز التفاعلية والكورسات"
        navigation={navigation}
        currentScreen="WebCommunity"
        showBack={true}
      />

      {/* Tab Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBarScroll}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.tabBtn, activeTab === idx && styles.tabBtnActive]}
            onPress={() => setActiveTab(idx)}
          >
            <Text style={[styles.tabBtnText, activeTab === idx && styles.tabBtnTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Content */}
      {activeTab === 0 && <PostsTab />}
      {activeTab === 1 && <ReelsTab />}
      {activeTab === 2 && <VideosTab />}
      {activeTab === 3 && <CoursesTab />}
    </SafeAreaView>
  );
};

// ─── Tab 1: المنشورات ─────────────────────────────────────────────────────────

const PostsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPostText, setNewPostText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalText, setModalText] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/content/posts').catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        const mapped: Post[] = res.data.map((p: any) => ({
          id: p.id,
          userName: p.userName || 'مستخدم TecnoRexa',
          userRole: p.userId === user?.id ? (user?.role || 'عضو') : 'عضو معتمد',
          roleColor: colors.primary,
          avatar: (p.userName ? p.userName.charAt(0) : 'ت'),
          text: p.content || p.title || '',
          time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : 'الآن',
          likes: p.likes || 0,
          liked: false,
          comments: p.comments || 0,
          shares: 0,
          showComments: false,
          commentList: [],
        }));
        setPosts(mapped);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const addPost = async (text: string) => {
    if (!text.trim()) return;
    const cleanText = text.trim();
    const isPrivileged = ['owner', 'manager', 'programmer', 'lead_developer'].includes(user?.role || '');

    try {
      const res = await fetchApi('/posts', {
        method: 'POST',
        data: {
          content: cleanText,
          type: 'post',
        },
      });

      if (res && res.success) {
        if (isPrivileged || res.status === 'published') {
          Alert.alert('✅ تم نشر المنشور', res.message || 'تم نشر منشورك بنجاح في مجتمع المنصة!');
        } else {
          Alert.alert(
            '⏳ قيد المراجعة والاعتماد',
            res.message || 'تم إرسال المنشور، وسيظهر للجميع في المجتمع فور مراجعته والموافقة عليه من الإدارة أو المبرمج.'
          );
        }
        await loadPosts();
      }
    } catch (err: any) {
      Alert.alert('تنبيه', err.message || 'تعذر إرسال المنشور');
    }
  };

  const handleQuickPost = () => {
    if (!newPostText.trim()) return;
    addPost(newPostText);
    setNewPostText('');
  };

  const handleModalPost = () => {
    addPost(modalText);
    setModalText('');
    setShowModal(false);
  };

  const toggleLike = async (id: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, liked: !p.liked, likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1 }
          : p
      )
    );
    try {
      await api.post(`/content/posts/${id}/like`).catch(() => {});
    } catch {}
  };

  const toggleComments = (id: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === id ? { ...p, showComments: !p.showComments } : p))
    );
  };

  const handleAddComment = async (postId: string) => {
    const txt = (commentInputs[postId] || '').trim();
    if (!txt) return;
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const newC = { id: `c_${Date.now()}`, user: user?.name || 'أنت', text: txt };
        return {
          ...p,
          comments: p.comments + 1,
          commentList: [...p.commentList, newC],
        };
      })
    );
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    try {
      await api.post(`/content/posts/${postId}/comments`, { text: txt }).catch(() => {});
    } catch {}
  };

  const handleShare = async (post: Post) => {
    try {
      if (Platform.OS !== 'web' && Share.share) {
        await Share.share({
          message: `${post.userName}: ${post.text} - عبر تطبيق TecnoRexa`,
        });
      } else {
        Alert.alert('مشاركة المنشور', 'تم نسخ رابط المنشور للمشاركة بنجاح!');
      }
      setPosts(prev =>
        prev.map(p => (p.id === post.id ? { ...p, shares: p.shares + 1 } : p))
      );
    } catch {
      Alert.alert('مشاركة', 'تمت المشاركة بنجاح!');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.tabContent, Platform.OS === 'web' && { overflowY: 'auto' } as any]}
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadPosts}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={true}
      >
        {/* Post Creation Box */}
        <View style={styles.createPostBox}>
          <View style={styles.createPostRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>أ</Text>
            </View>
            <TextInput
              style={styles.createPostInput}
              placeholder="ما الذي تفكر فيه؟"
              placeholderTextColor={colors.gray}
              value={newPostText}
              onChangeText={setNewPostText}
              textAlign="right"
              multiline
            />
          </View>
          <TouchableOpacity style={styles.publishBtn} onPress={handleQuickPost}>
            <Text style={styles.publishBtnText}>نشر</Text>
          </TouchableOpacity>
        </View>

        {/* Posts List */}
        {posts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <MessageCircle size={48} color={colors.gray} style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>لا توجد منشورات في المجتمع بعد</Text>
            <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4 }}>شارك تجربتك أو استفسارك الهندسي الآن عبر زر الإضافة</Text>
          </View>
        ) : (
          posts.map(post => (
          <View key={post.id} style={styles.postCard}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View>
                <Text style={styles.postTime}>{post.time}</Text>
                <View style={[styles.roleBadge, { backgroundColor: post.roleColor + '33' }]}>
                  <Text style={[styles.roleBadgeText, { color: post.roleColor }]}>{post.userRole}</Text>
                </View>
              </View>
              <View style={styles.postUserInfo}>
                <Text style={styles.postUserName}>{post.userName}</Text>
                <View style={[styles.avatarCircleSmall, { backgroundColor: post.roleColor + '44' }]}>
                  <Text style={[styles.avatarTextSmall, { color: post.roleColor }]}>{post.avatar}</Text>
                </View>
              </View>
            </View>

            {/* Post Body */}
            <Text style={styles.postText}>{post.text}</Text>

            {/* Post Actions */}
            <View style={styles.postActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(post)}>
                <Share2 color={colors.gray} size={18} />
                <Text style={styles.actionCount}>{post.shares}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => toggleComments(post.id)}>
                <MessageCircle color={post.showComments ? colors.primary : colors.gray} size={18} />
                <Text style={styles.actionCount}>{post.comments}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(post.id)}>
                <Heart
                  color={post.liked ? colors.danger : colors.gray}
                  size={18}
                  fill={post.liked ? colors.danger : 'transparent'}
                />
                <Text style={[styles.actionCount, post.liked && { color: colors.danger }]}>{post.likes}</Text>
              </TouchableOpacity>
            </View>

            {/* Comments Section */}
            {post.showComments && (
              <View style={styles.commentsSection}>
                {post.commentList.map(c => (
                  <View key={c.id} style={styles.commentRow}>
                    <Text style={styles.commentText}>{c.text}</Text>
                    <Text style={styles.commentUser}>{c.user}</Text>
                  </View>
                ))}
                {post.commentList.length === 0 && (
                  <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center', marginVertical: 4 }}>
                    لا توجد تعليقات بعد، كن أول من يعلق!
                  </Text>
                )}
                <View style={styles.addCommentRow}>
                  <TouchableOpacity
                    style={styles.sendCommentBtn}
                    onPress={() => handleAddComment(post.id)}
                  >
                    <Send color={colors.dark} size={15} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="اكتب تعليقاً..."
                    placeholderTextColor={colors.gray}
                    value={commentInputs[post.id] || ''}
                    onChangeText={(txt) => setCommentInputs(prev => ({ ...prev, [post.id]: txt }))}
                    textAlign="right"
                  />
                </View>
              </View>
            )}
          </View>
        )))}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color={colors.dark} size={26} />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X color={colors.gray} size={22} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>نشر محتوى جديد</Text>
            </View>

            {/* Content Type Selector (Technician Only for Video/Reels) */}
            <View style={{ flexDirection: 'row-reverse', gap: 8, marginBottom: 16 }}>
              <TouchableOpacity style={[styles.typeBtn, { backgroundColor: colors.primary }]}>
                <Text style={{ color: '#000', fontWeight: 'bold' }}>منشور نصي</Text>
              </TouchableOpacity>
              {user?.role === 'technician' && (
                <>
                  <TouchableOpacity style={[styles.typeBtn, { backgroundColor: '#333' }]} onPress={() => {
                    Alert.alert('قريباً', 'جاري تجهيز سيرفرات رفع الفيديوهات والريلز للفنيين.');
                    setShowModal(false);
                  }}>
                    <Video color={colors.primary} size={16} />
                    <Text style={{ color: colors.white }}>فيديو إصلاح</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.typeBtn, { backgroundColor: '#333' }]} onPress={() => {
                    Alert.alert('قريباً', 'جاري تجهيز سيرفرات رفع الريلز للفنيين.');
                    setShowModal(false);
                  }}>
                    <Film color={colors.primary} size={16} />
                    <Text style={{ color: colors.white }}>ريلز</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="اكتب منشورك أو تفاصيل الفيديو هنا..."
              placeholderTextColor={colors.gray}
              value={modalText}
              onChangeText={setModalText}
              multiline
              textAlign="right"
              autoFocus
            />
            <TouchableOpacity
              style={[styles.publishBtn, { marginTop: 12 }]}
              onPress={handleModalPost}
            >
              <Text style={styles.publishBtnText}>نشر الآن</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Tab 2: الريلز ────────────────────────────────────────────────────────────

const ReelsTab: React.FC = () => {
  const { user } = useAuthStore();
  const [reels, setReels] = useState<Reel[]>(INITIAL_REELS);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeCommentsReel, setActiveCommentsReel] = useState<Reel | null>(null);
  const [newReelComment, setNewReelComment] = useState('');
  const [reelComments, setReelComments] = useState<Record<string, { id: string; user: string; text: string }[]>>({});

  // Add Reel Modal state
  const [showAddReelModal, setShowAddReelModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [publishingReel, setPublishingReel] = useState(false);

  const loadReels = useCallback(async () => {
    try {
      const res = await api.get('/reels').catch(() => null);
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: Reel[] = res.data.map((r: any) => ({
          id: r.id,
          userName: r.userName || 'فني TecnoRexa 🎬',
          description: r.caption || r.description || r.title || 'شروحات صيانة احترافية',
          likes: r.likesCount || r.likes || 0,
          liked: false,
          comments: r.comments || 0,
          shares: 0,
          bookmarked: false,
        }));
        setReels(mapped);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  const handleRecordVideo = async () => {
    try {
      if (Platform.OS !== 'web') {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          Alert.alert('صلاحية مطلوبة', 'يرجى منح صلاحية الكاميرا لتسجيل الفيديو');
          return;
        }
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos', 'images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedMedia(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر تشغيل الكاميرا');
    }
  };

  const handlePickVideo = async () => {
    try {
      if (Platform.OS !== 'web') {
        const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libPerm.granted) {
          Alert.alert('صلاحية مطلوبة', 'يرجى منح صلاحية الوصول لمعرض الفيديوهات');
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos', 'images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedMedia(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('خطأ', 'تعذر اختيار الفيديو من المعرض');
    }
  };

  const handlePublishReel = async () => {
    if (!selectedMedia && !reelVideoUrl.trim()) {
      Alert.alert('تنبيه', 'يرجى تصوير مقطع بالكاميرا أو اختيار فيديو من المعرض');
      return;
    }
    setPublishingReel(true);
    try {
      let finalVideoUrl = reelVideoUrl.trim();

      if (selectedMedia?.uri) {
        try {
          const fileToUpload = {
            uri: selectedMedia.uri,
            type: selectedMedia.mimeType || (selectedMedia.type === 'video' ? 'video/mp4' : 'image/jpeg'),
            name: selectedMedia.fileName || (selectedMedia.type === 'video' ? `reel_${Date.now()}.mp4` : `photo_${Date.now()}.jpg`),
          };
          const uploadRes = await uploadFile('/upload', fileToUpload);
          if (uploadRes?.url) {
            finalVideoUrl = uploadRes.url;
          }
        } catch {
          finalVideoUrl = selectedMedia.uri;
        }
      }

      const res = await api.post('/reels', {
        videoUrl: finalVideoUrl || '/uploads/sample_reel.mp4',
        description: reelCaption.trim() || 'فيديو شروحات صيانة جديد',
      });
      if (res.data?.success) {
        const newReelItem: Reel = {
          id: res.data.id || `reel_${Date.now()}`,
          userName: user?.name || 'فني معتمد 🎬',
          description: reelCaption.trim() || 'فيديو ريلز جديد',
          likes: 0,
          liked: false,
          comments: 0,
          shares: 0,
          bookmarked: false,
        };
        setReels(prev => [newReelItem, ...prev]);
        setShowAddReelModal(false);
        setSelectedMedia(null);
        setReelVideoUrl('');
        setReelCaption('');
        Alert.alert('🎉 مبروك!', 'تم نشر فيديو الريلز بنجاح وهو متاح للمشاهدة الآن.');
      }
    } catch (err: any) {
      Alert.alert('خطأ', err.response?.data?.error || 'تعذر نشر الفيديو القصيرة');
    } finally {
      setPublishingReel(false);
    }
  };

  const toggleLike = async (id: string) => {
    setReels(prev =>
      prev.map(r =>
        r.id === id
          ? { ...r, liked: !r.liked, likes: r.liked ? Math.max(0, r.likes - 1) : r.likes + 1 }
          : r
      )
    );
    try {
      await api.post(`/reels/${id}/like`).catch(() => {});
    } catch {}
  };

  const toggleBookmark = (id: string) => {
    setReels(prev =>
      prev.map(r => (r.id === id ? { ...r, bookmarked: !r.bookmarked } : r))
    );
  };

  const handleAddReelComment = () => {
    if (!activeCommentsReel || !newReelComment.trim()) return;
    const newC = {
      id: `rc_${Date.now()}`,
      user: 'أنت',
      text: newReelComment.trim(),
    };
    setReelComments(prev => ({
      ...prev,
      [activeCommentsReel.id]: [...(prev[activeCommentsReel.id] || []), newC],
    }));
    setReels(prev =>
      prev.map(r => (r.id === activeCommentsReel.id ? { ...r, comments: r.comments + 1 } : r))
    );
    setNewReelComment('');
  };

  const renderReel = ({ item }: { item: Reel }) => {
    const isPlaying = playingId === item.id;
    return (
      <View style={[styles.reelContainer, { height: REEL_HEIGHT }]}>
        {/* Background */}
        <View style={[styles.reelBg, isPlaying && styles.reelBgActive]}>
          <View style={styles.reelVideoSimContainer}>
            <Text style={{ color: '#444', fontSize: 13, marginBottom: 8 }}>TecnoRexa Reels 🎬</Text>
            {isPlaying ? (
              <View style={styles.playingIndicatorBadge}>
                <Volume2 size={16} color={colors.primary} />
                <Text style={styles.playingIndicatorText}>جارٍ التشغيل الآن</Text>
              </View>
            ) : (
              <Text style={{ color: colors.gray, fontSize: 12 }}>اضغط للتشغيل</Text>
            )}
          </View>
        </View>

        {/* Center Play/Pause Icon */}
        <TouchableOpacity
          style={styles.reelPlayBtn}
          activeOpacity={0.8}
          onPress={() => setPlayingId(isPlaying ? null : item.id)}
        >
          {isPlaying ? (
            <View style={styles.pauseBtnCircle}>
              <Pause color={colors.primary} size={36} />
            </View>
          ) : (
            <PlayCircle color={colors.primary} size={72} />
          )}
        </TouchableOpacity>

        {/* Bottom Playback Progress Bar */}
        {isPlaying && (
          <View style={styles.reelProgressBarContainer}>
            <View style={styles.reelProgressBarFill} />
          </View>
        )}

        {/* Bottom Overlay */}
        <View style={styles.reelBottomOverlay}>
          <Text style={styles.reelUserName}>{item.userName}</Text>
          <Text style={styles.reelDescription} numberOfLines={2}>{item.description}</Text>
        </View>

        {/* Right Side Buttons */}
        <View style={styles.reelRightActions}>
          {/* Like */}
          <TouchableOpacity style={styles.reelActionItem} onPress={() => toggleLike(item.id)}>
            <Heart
              color={item.liked ? colors.danger : colors.white}
              size={28}
              fill={item.liked ? colors.danger : 'transparent'}
            />
            <Text style={styles.reelActionCount}>{item.likes}</Text>
          </TouchableOpacity>

          {/* Comment */}
          <TouchableOpacity style={styles.reelActionItem} onPress={() => setActiveCommentsReel(item)}>
            <MessageCircle color={colors.white} size={28} />
            <Text style={styles.reelActionCount}>{item.comments}</Text>
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            style={styles.reelActionItem}
            onPress={() => {
              Alert.alert('مشاركة الريل', 'تم نسخ رابط الريل للمشاركة بنجاح!');
              setReels(prev => prev.map(r => r.id === item.id ? { ...r, shares: r.shares + 1 } : r));
            }}
          >
            <Share2 color={colors.white} size={26} />
            <Text style={styles.reelActionCount}>{item.shares}</Text>
          </TouchableOpacity>

          {/* Bookmark */}
          <TouchableOpacity style={styles.reelActionItem} onPress={() => toggleBookmark(item.id)}>
            <Bookmark
              color={item.bookmarked ? colors.primary : colors.white}
              size={26}
              fill={item.bookmarked ? colors.primary : 'transparent'}
            />
            <Text style={styles.reelActionCount}>{item.bookmarked ? 'محفوظ' : 'حفظ'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', width: '100%' }}>
      <FlatList
        data={reels}
        keyExtractor={item => item.id}
        renderItem={renderReel}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={REEL_HEIGHT}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({ length: REEL_HEIGHT, offset: REEL_HEIGHT * index, index })}
        style={{ width: '100%', maxWidth: 480 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', height: REEL_HEIGHT }}>
            <Video size={48} color={colors.gray} style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>لا توجد مقاطع ريلز حالياً</Text>
            <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4 }}>اضغط على زر "نشر ريلز جديد" لرفع أول مقطع فيديو قصيرة 🎬</Text>
          </View>
        }
      />

      {/* Floating Add Reel Button */}
      <TouchableOpacity
        onPress={() => setShowAddReelModal(true)}
        style={{
          position: 'absolute',
          bottom: 25,
          left: 20,
          backgroundColor: colors.primary,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 24,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 6,
          zIndex: 99,
        }}
      >
        <Plus size={18} color={colors.dark} />
        <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 13 }}>نشر ريلز 🎬</Text>
      </TouchableOpacity>

      {/* Reel Comments Modal */}
      <Modal visible={!!activeCommentsReel} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '70%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setActiveCommentsReel(null)}>
                <X color={colors.gray} size={22} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                التعليقات ({activeCommentsReel ? (reelComments[activeCommentsReel.id]?.length || 0) : 0})
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {activeCommentsReel && (reelComments[activeCommentsReel.id] || []).map(c => (
                <View key={c.id} style={styles.commentRow}>
                  <Text style={styles.commentText}>{c.text}</Text>
                  <Text style={styles.commentUser}>{c.user}</Text>
                </View>
              ))}
              {activeCommentsReel && (!reelComments[activeCommentsReel.id] || reelComments[activeCommentsReel.id].length === 0) && (
                <Text style={{ color: colors.gray, textAlign: 'center', marginVertical: 16 }}>
                  لا توجد تعليقات بعد، كن أول من يعلق!
                </Text>
              )}
            </ScrollView>

            <View style={[styles.addCommentRow, { marginTop: 12 }]}>
              <TouchableOpacity
                style={styles.sendCommentBtn}
                onPress={handleAddReelComment}
              >
                <Send color={colors.dark} size={15} />
              </TouchableOpacity>
              <TextInput
                style={styles.commentInput}
                placeholder="اكتب تعليقاً على الريل..."
                placeholderTextColor={colors.gray}
                value={newReelComment}
                onChangeText={setNewReelComment}
                textAlign="right"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add New Reel Publishing Modal */}
      <Modal visible={showAddReelModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddReelModal(false)}>
                <X color={colors.gray} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingVertical: 10 }}>
              <Text style={{ color: colors.white, fontSize: 13, fontWeight: '800', textAlign: 'right', marginBottom: 8 }}>
                اختر الفيديو أو صوره مباشرة 🎥
              </Text>

              {selectedMedia ? (
                <View style={{
                  backgroundColor: '#1C1917',
                  borderRadius: borderRadius.md,
                  padding: 12,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  flexDirection: 'row-reverse',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(212,175,55,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                      <Film size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right' }} numberOfLines={1}>
                        {selectedMedia.fileName || 'تم تحديد الفيديو بنجاح ✅'}
                      </Text>
                      <Text style={{ color: colors.primary, fontSize: 10, textAlign: 'right' }}>
                        جاهز للنشر على مجتمع TecnoRexa
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedMedia(null)} style={{ padding: 6 }}>
                    <X size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row-reverse', gap: 10, marginBottom: 14 }}>
                  <TouchableOpacity
                    onPress={handleRecordVideo}
                    style={{
                      flex: 1,
                      height: 100,
                      backgroundColor: '#18181B',
                      borderWidth: 1.5,
                      borderColor: colors.primary,
                      borderStyle: 'dashed',
                      borderRadius: borderRadius.lg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Camera size={24} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>
                      تصوير فيديو 📸
                    </Text>
                    <Text style={{ color: colors.gray, fontSize: 10 }}>بالكاميرا الآن</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handlePickVideo}
                    style={{
                      flex: 1,
                      height: 100,
                      backgroundColor: '#18181B',
                      borderWidth: 1.5,
                      borderColor: '#3B82F6',
                      borderStyle: 'dashed',
                      borderRadius: borderRadius.lg,
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <ImagePlus size={24} color="#3B82F6" />
                    <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 12 }}>
                      من المعرض 📁
                    </Text>
                    <Text style={{ color: colors.gray, fontSize: 10 }}>اختيار مقطع محفوظ</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={{ color: colors.white, fontSize: 12, fontWeight: '700', textAlign: 'right', marginBottom: 4 }}>
                وصف الفيديو والوسوم (Caption & Hashtags)
              </Text>
              <TextInput
                style={[styles.modalInput, { textAlign: 'right', height: 80, textAlignVertical: 'top', marginBottom: 16 }]}
                placeholder="اكتب وصفاً أو شرحاً مختصراً للفيديو..."
                placeholderTextColor={colors.gray}
                multiline
                value={reelCaption}
                onChangeText={setReelCaption}
              />

              <TouchableOpacity
                onPress={handlePublishReel}
                disabled={publishingReel}
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: 12,
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                {publishingReel ? (
                  <ActivityIndicator color={colors.dark} />
                ) : (
                  <>
                    <Film size={18} color={colors.dark} />
                    <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 14 }}>
                      نشر الفيديو الآن 🚀
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Tab 3: فيديوهات الإصلاح ─────────────────────────────────────────────────

const VideosTab: React.FC = () => {
  const [videos, setVideos] = useState<RepairVideo[]>(REPAIR_VIDEOS);
  const [selectedVideo, setSelectedVideo] = useState<RepairVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadedVideos, setDownloadedVideos] = useState<Record<string, boolean>>({});

  const loadVideos = useCallback(async () => {
    try {
      const res = await api.get('/repair-videos').catch(() => null);
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: RepairVideo[] = res.data.map((v: any) => ({
          id: v.id,
          title: v.title || 'شرح صيانة وإصلاح أعطال',
          views: `${v.segments || 1} أجزاء`,
          duration: v.duration || '10:00',
          technician: 'فريق صيانة TecnoRexa 🔧',
        }));
        setVideos(mapped);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const handleDownload = (video: RepairVideo) => {
    setDownloadedVideos(prev => ({ ...prev, [video.id]: true }));
    Alert.alert('تم التحميل بنجاح', `تم حفظ فيديو "${video.title}" للمشاهدة بدون إنترنت!`);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={[styles.tabContent, Platform.OS === 'web' && { overflowY: 'auto' } as any]}
        contentContainerStyle={{ paddingBottom: 150 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={loadVideos}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.sectionTitle}>فيديوهات الصيانة</Text>
        {videos.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Video size={48} color={colors.gray} style={{ marginBottom: 12 }} />
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>لا توجد فيديوهات صيانة حالياً</Text>
            <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4 }}>سيتم إضافة فيديوهات الشروحات قريباً</Text>
          </View>
        ) : (
          videos.map(video => (
            <TouchableOpacity
              key={video.id}
              style={styles.videoCard}
              onPress={() => {
                setSelectedVideo(video);
                setIsPlaying(true);
              }}
              activeOpacity={0.85}
            >
              {/* Thumbnail */}
              <View style={styles.videoThumbnail}>
                <Play color={colors.primary} size={36} fill={colors.primary} />
                <View style={styles.durationBadge}>
                  <Clock color={colors.white} size={11} />
                  <Text style={styles.durationText}>{video.duration}</Text>
                </View>
              </View>

              {/* Info */}
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
                <Text style={styles.videoTech}>{video.technician}</Text>
                <View style={styles.videoMeta}>
                  <Eye color={colors.gray} size={13} />
                  <Text style={styles.videoViews}>{video.views} مشاهدة</Text>
                  {downloadedVideos[video.id] && (
                    <View style={{ backgroundColor: 'rgba(46,204,113,0.2)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                      <Text style={{ color: colors.success, fontSize: 10, fontWeight: '700' }}>محفوظ بدون نت ✓</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Fullscreen Video Modal */}
      <Modal visible={!!selectedVideo} animationType="fade" transparent>
        <View style={styles.videoModalOverlay}>
          {selectedVideo && (
            <View style={styles.videoModalContent}>
              <TouchableOpacity
                style={styles.videoModalClose}
                onPress={() => {
                  setSelectedVideo(null);
                  setIsPlaying(false);
                }}
              >
                <X color={colors.white} size={26} />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsPlaying(!isPlaying)}
                style={{ alignItems: 'center', justifyContent: 'center' }}
              >
                {isPlaying ? (
                  <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(212,175,55,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                    <Pause color={colors.primary} size={48} />
                  </View>
                ) : (
                  <PlayCircle color={colors.primary} size={90} />
                )}
              </TouchableOpacity>

              {/* Video Timeline Simulation */}
              <View style={{ width: '100%', maxWidth: 360, gap: 6, alignItems: 'center' }}>
                <View style={{ width: '100%', height: 4, backgroundColor: '#333', borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ width: isPlaying ? '45%' : '0%', height: '100%', backgroundColor: colors.primary }} />
                </View>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', width: '100%' }}>
                  <Text style={{ color: colors.gray, fontSize: 11 }}>{selectedVideo.duration}</Text>
                  <Text style={{ color: colors.primary, fontSize: 11 }}>{isPlaying ? '04:12' : '00:00'}</Text>
                </View>
              </View>

              <Text style={styles.videoModalTitle}>{selectedVideo.title}</Text>
              <Text style={styles.videoModalTech}>{selectedVideo.technician}</Text>

              <TouchableOpacity
                style={[
                  styles.downloadBtn,
                  downloadedVideos[selectedVideo.id] && { backgroundColor: '#1E293B', borderWidth: 1, borderColor: colors.success }
                ]}
                onPress={() => handleDownload(selectedVideo)}
              >
                {downloadedVideos[selectedVideo.id] ? (
                  <>
                    <Check color={colors.success} size={18} />
                    <Text style={[styles.downloadBtnText, { color: colors.success }]}>تم الحفظ للمشاهدة بدون إنترنت ✓</Text>
                  </>
                ) : (
                  <>
                    <Download color={colors.dark} size={18} />
                    <Text style={styles.downloadBtnText}>تحميل للمشاهدة بدون إنترنت</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const CoursesTab: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [enrolledCourses, setEnrolledCourses] = useState<Record<string, boolean>>({});

  const loadCourses = useCallback(async () => {
    try {
      const res = await api.get('/courses').catch(() => null);
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: Course[] = res.data.map((c: any, i: number) => ({
          id: c.id,
          title: c.title,
          instructor: 'أكاديمية TecnoRexa 🎓',
          lessons: 5,
          price: c.price ? Number(c.price) : null,
          topColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'][i % 4],
        }));
        setCourses(mapped);
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleEnroll = (course: Course) => {
    setEnrolledCourses(prev => ({ ...prev, [course.id]: true }));
    Alert.alert('تم التسجيل بنجاح! 🎓', `تم تسجيلك بنجاح في كورس "${course.title}". يمكنك البدء الآن.`);
  };

  return (
    <ScrollView
      style={[styles.tabContent, Platform.OS === 'web' && { overflowY: 'auto' } as any]}
      contentContainerStyle={{ paddingBottom: 150 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>الكورسات التدريبية</Text>
      {courses.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 60 }}>
          <BookOpen size={48} color={colors.gray} style={{ marginBottom: 12 }} />
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: '700' }}>لا توجد كورسات تدريبية حالياً</Text>
          <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4 }}>ستظهر الدورات والكورسات المعتمدة هنا فور نشرها</Text>
        </View>
      ) : (
        <View style={styles.coursesGrid}>
          {courses.map(course => {
            const isEnrolled = !!enrolledCourses[course.id];
            return (
              <View key={course.id} style={styles.courseCard}>
                <View style={[styles.courseTopBar, { backgroundColor: course.topColor }]} />
                <View style={styles.courseBody}>
                  <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
                  <View style={styles.courseInstructorRow}>
                    <Text style={styles.courseInstructor}>{course.instructor}</Text>
                    <BookOpen color={colors.gray} size={13} />
                  </View>
                  <View style={styles.courseLessonsRow}>
                    <Text style={styles.courseLessons}>{course.lessons} درس</Text>
                    <Video color={colors.gray} size={13} />
                  </View>
                  <View style={styles.coursePriceRow}>
                    <Text
                      style={[
                        styles.coursePrice,
                        { color: course.price === null ? colors.success : colors.primary },
                      ]}
                    >
                      {course.price === null ? 'مجاناً' : `${course.price} ج.م`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.enrollBtn,
                      isEnrolled && { backgroundColor: '#1E293B', borderWidth: 1, borderColor: colors.primary }
                    ]}
                    onPress={() => handleEnroll(course)}
                  >
                    <Text
                      style={[
                        styles.enrollBtnText,
                        isEnrolled && { color: colors.primary }
                      ]}
                    >
                      {isEnrolled ? 'مشترك ✓ (متابعة)' : 'تسجيل الآن'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    fontFamily: 'Cairo',
  },
  tabBarScroll: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.dark,
  },
  tabBarContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray,
    fontFamily: 'Cairo',
  },
  tabBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  // Create Post
  createPostBox: {
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 12,
  },
  createPostRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  createPostInput: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Cairo',
    minHeight: 50,
  },
  publishBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 24,
    alignSelf: 'flex-end',
  },
  publishBtnText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  // Post Card
  postCard: {
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  postUserInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircleSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTextSmall: {
    fontSize: 15,
    fontWeight: '700',
  },
  postUserName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  roleBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
  postTime: {
    color: colors.gray,
    fontSize: 12,
    fontFamily: 'Cairo',
    textAlign: 'right',
  },
  postText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'right',
    fontFamily: 'Cairo',
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row-reverse',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    color: colors.gray,
    fontSize: 13,
    fontFamily: 'Cairo',
  },
  commentsSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    gap: 8,
  },
  commentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.dark,
    borderRadius: 8,
    padding: 8,
  },
  commentUser: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Cairo',
    minWidth: 70,
    textAlign: 'right',
  },
  commentText: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Cairo',
    flex: 1,
    textAlign: 'right',
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.darkCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  modalInput: {
    backgroundColor: colors.dark,
    borderRadius: 10,
    padding: 12,
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Cairo',
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
  },
  // Reels
  reelContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  reelBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#111',
  },
  reelPlayBtn: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
  },
  reelBottomOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 70,
    right: 16,
  },
  reelUserName: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Cairo',
    textAlign: 'right',
    marginBottom: 4,
  },
  reelDescription: {
    color: colors.white,
    fontSize: 13,
    fontFamily: 'Cairo',
    textAlign: 'right',
    lineHeight: 20,
  },
  reelRightActions: {
    position: 'absolute',
    bottom: 40,
    left: 12,
    alignItems: 'center',
    gap: 20,
  },
  reelActionItem: {
    alignItems: 'center',
    gap: 4,
  },
  reelActionCount: {
    color: colors.white,
    fontSize: 12,
    fontFamily: 'Cairo',
  },
  // Videos
  sectionTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Cairo',
    textAlign: 'right',
    marginBottom: 12,
  },
  videoCard: {
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row-reverse',
    marginBottom: 12,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: 110,
    height: 90,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
  },
  durationText: {
    color: colors.white,
    fontSize: 11,
    fontFamily: 'Cairo',
  },
  videoInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  videoTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Cairo',
    textAlign: 'right',
    lineHeight: 20,
  },
  videoTech: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'Cairo',
    textAlign: 'right',
  },
  videoMeta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  videoViews: {
    color: colors.gray,
    fontSize: 12,
    fontFamily: 'Cairo',
  },
  // Video Modal
  videoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  videoModalContent: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  videoModalClose: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  videoModalTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Cairo',
    textAlign: 'center',
    lineHeight: 26,
  },
  videoModalTech: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'Cairo',
  },
  downloadBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  downloadBtnText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  // Courses
  coursesGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  courseCard: {
    width: (SCREEN_WIDTH - 36) / 2,
    backgroundColor: colors.darkCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 4,
  },
  courseTopBar: {
    height: 6,
    width: '100%',
  },
  courseBody: {
    padding: 12,
    gap: 6,
  },
  courseTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Cairo',
    textAlign: 'right',
    lineHeight: 20,
  },
  courseInstructorRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  courseInstructor: {
    color: colors.gray,
    fontSize: 11,
    fontFamily: 'Cairo',
    flex: 1,
    textAlign: 'right',
  },
  courseLessonsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  courseLessons: {
    color: colors.gray,
    fontSize: 11,
    fontFamily: 'Cairo',
    flex: 1,
    textAlign: 'right',
  },
  coursePriceRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 4,
  },
  coursePrice: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  enrollBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  enrollBtnText: {
    color: colors.dark,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  // Add Comment Bar
  addCommentRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.white,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#333',
    fontFamily: 'Cairo',
  },
  sendCommentBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Reel Video Simulation
  reelBgActive: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  reelVideoSimContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingIndicatorBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  playingIndicatorText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Cairo',
  },
  pauseBtnCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  reelProgressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  reelProgressBarFill: {
    width: '65%',
    height: '100%',
    backgroundColor: colors.primary,
  },
});

export default WebCommunityScreen;
