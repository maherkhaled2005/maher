import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { colors, MAX_CONTENT_WIDTH } from '../../theme';
import { api } from '../../api/client';

interface ReelItem {
  id: string;
  userName: string;
  userAvatar?: string | null;
  videoUrl: string;
  description: string;
  likes: number;
  createdAt?: string;
  liked?: boolean;
}

type Player = ReturnType<typeof useVideoPlayer>;

/** Stage size that stays readable on a phone, tablet and desktop. */
function useStageSize() {
  const { width, height } = useWindowDimensions();
  const stageWidth = Math.min(width, height * 0.66, MAX_CONTENT_WIDTH);
  const stageHeight = Math.min(Math.max(height - 210, 360), stageWidth * 1.7);
  return { width, height, stageWidth, stageHeight };
}

/** One full-bleed reel with its own video player. */
function ReelPlayer({
  item,
  active,
  muted,
  register,
}: {
  item: ReelItem;
  active: boolean;
  muted: boolean;
  register: (p: Player | null) => void;
}) {
  const { stageWidth, stageHeight } = useStageSize();

  const player = useVideoPlayer(item.videoUrl, (p) => {
    p.loop = true;
    p.muted = muted;
  });

  useEffect(() => {
    register(player);
    return () => register(null);
  }, [player, register]);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    try {
      if (active) player.play();
      else player.pause();
    } catch {
      /* player not ready yet */
    }
  }, [active, player]);

  return (
    <View
      style={{
        width: stageWidth,
        height: stageHeight,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#000',
        borderWidth: 1,
        borderColor: '#222',
      }}
    >
      {item.videoUrl ? (
        <VideoView
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          nativeControls={false}
          player={player}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#666' }}>لا يوجد فيديو</Text>
        </View>
      )}

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: 14,
          backgroundColor: 'rgba(0,0,0,0.45)',
        }}
      >
        <Text numberOfLines={1} style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>
          {item.userName}
        </Text>
        <Text numberOfLines={2} style={{ color: '#fff', fontSize: 13, marginTop: 4, lineHeight: 19 }}>
          {item.description}
        </Text>
      </View>
    </View>
  );
}

export default function ReelsScreen({ navigation }: any) {
  const { width, height, stageWidth } = useStageSize();
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const resolveUrl = useCallback((raw?: string | null) => {
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = (api as any).defaults?.baseURL || '';
    return `${String(base).replace(/\/api\/?$/, '')}${raw.startsWith('/') ? raw : `/${raw}`}`;
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.get('/reels');
      const rows: any[] = Array.isArray(res.data) ? res.data : [];
      setReels(
        rows.map((r) => ({
          id: String(r.id),
          userName: r.userName || 'مستخدم TecnoRexa',
          userAvatar: r.userAvatar ?? null,
          videoUrl: resolveUrl(r.videoUrl),
          description: r.description || '',
          likes: Number(r.likes || 0),
          createdAt: r.createdAt,
        }))
      );
    } catch {
      setError('تعذر تحميل الريلز. تحقق من اتصالك بالإنترنت وحاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [resolveUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLike = async (reel: ReelItem) => {
    // Optimistic, reverted on failure so the count never lies.
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? { ...r, liked: !r.liked, likes: Math.max(0, r.likes + (r.liked ? -1 : 1)) }
          : r
      )
    );
    try {
      const res = await api.post(`/reels/${reel.id}/like`);
      const serverLikes = res?.data?.likes;
      if (serverLikes != null) {
        setReels((prev) =>
          prev.map((r) =>
            r.id === reel.id
              ? { ...r, likes: Number(serverLikes), liked: Boolean(res.data.liked) }
              : r
          )
        );
      }
    } catch {
      setReels((prev) =>
        prev.map((r) =>
          r.id === reel.id
            ? { ...r, liked: !r.liked, likes: Math.max(0, r.likes + (r.liked ? 1 : -1)) }
            : r
        )
      );
      Alert.alert('تعذر التفاعل', 'لم يتم تسجيل الإعجاب. حاول مرة أخرى.');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const idx = viewableItems?.[0]?.index;
    if (typeof idx === 'number') setActiveIndex(idx);
  }).current;

  const renderItem = ({ item, index }: { item: ReelItem; index: number }) => (
    <View style={{ width, alignItems: 'center', paddingVertical: 8 }}>
      <ReelPlayer
        item={item}
        active={index === activeIndex}
        muted={muted}
        register={() => {}}
      />

      <TouchableOpacity
        onPress={() => setMuted((m) => !m)}
        style={{
          position: 'absolute',
          top: 24,
          left: Math.max(12, (width - stageWidth) / 2 + 12),
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {muted ? <VolumeX color="#fff" size={16} /> : <Volume2 color="#fff" size={16} />}
      </TouchableOpacity>

      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          gap: 22,
          marginTop: 12,
          paddingHorizontal: 20,
        }}
      >
        <TouchableOpacity onPress={() => toggleLike(item)} style={{ alignItems: 'center' }}>
          <Heart
            size={24}
            color={item.liked ? colors.danger : colors.white}
            fill={item.liked ? colors.danger : 'transparent'}
          />
          <Text style={{ color: colors.gray, fontSize: 11, marginTop: 3 }}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Alert.alert('التعليقات', 'قسم التعليقات سيتم إضافته قريباً.')}
          style={{ alignItems: 'center' }}
        >
          <MessageCircle size={24} color={colors.white} />
          <Text style={{ color: colors.gray, fontSize: 11, marginTop: 3 }}>تعليقات</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Alert.alert('مشاركة', 'تم تجهيز رابط المشاركة.')}
          style={{ alignItems: 'center' }}
        >
          <Share2 size={24} color={colors.white} />
          <Text style={{ color: colors.gray, fontSize: 11, marginTop: 3 }}>مشاركة</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, width: '100%', maxWidth: '100%', backgroundColor: colors.dark }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderColor: '#1E1E1E',
          backgroundColor: '#0D0D0D',
          width: '100%',
        }}
      >
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={{ padding: 4 }}>
          <ChevronLeft color={colors.white} size={24} />
        </TouchableOpacity>
        <Text style={{ color: colors.white, fontSize: 16, fontWeight: '900' }}>ريلز TecnoRexa</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.gray, marginTop: 10 }}>جاري تحميل الريلز...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: colors.white, fontSize: 15, textAlign: 'center', marginBottom: 14 }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={load}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 22,
              paddingVertical: 10,
              borderRadius: 22,
            }}
          >
            <Text style={{ color: '#000', fontWeight: '900' }}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : reels.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 40, marginBottom: 10 }}>🎬</Text>
          <Text style={{ color: colors.white, fontSize: 15, fontWeight: '700', marginBottom: 4 }}>
            لا توجد ريلز منشورة بعد
          </Text>
          <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center' }}>
            كن أول من ينشر فيديو صيانة على TecnoRexa
          </Text>
        </View>
      ) : (
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          getItemLayout={(_: any, index: number) => ({
            length: height,
            offset: height * index,
            index,
          })}
        />
      )}
    </SafeAreaView>
  );
}
