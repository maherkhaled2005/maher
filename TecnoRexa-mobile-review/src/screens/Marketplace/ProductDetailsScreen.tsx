import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  Platform,
  Alert,
  Share,
} from 'react-native';
import {
  ChevronRight,
  Star,
  ShoppingCart,
  MessageCircle,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  Plus,
  Minus,
  CheckCircle2,
  Sparkles,
  Award,
  Store,
  Box,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { fetchApi } from '../../api/client';

const TABS = ['الوصف والضمان', 'المواصفات الفنية', 'التقييمات والمراجعات'];

export default function ProductDetailsScreen({ route, navigation }: any) {
  const { user } = useAuthStore();
  const incomingProduct = route.params?.product;
  const productId = route.params?.productId || incomingProduct?.id || '1';

  const [activeTab, setActiveTab] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { addItem, updateQuantity, items: cartItems } = useCartStore();

  let parsedSpecs: Record<string, any> = {
    'الحالة': 'جديدة وأصلية',
    'الضمان': 'ضمان معتمد 12 شهراً',
    'التوصيل': 'شحن سريع لجميع المحافظات',
  };
  if (incomingProduct?.specifications) {
    try {
      const parsed = typeof incomingProduct.specifications === 'string'
        ? JSON.parse(incomingProduct.specifications)
        : incomingProduct.specifications;
      if (parsed && typeof parsed === 'object') {
        parsedSpecs = parsed;
      }
    } catch {}
  } else if (incomingProduct?.specs && typeof incomingProduct.specs === 'object') {
    parsedSpecs = incomingProduct.specs;
  }

  // Resolve product data from params or defaults
  const product = {
    id: String(productId),
    name:
      incomingProduct?.name ||
      'منتج معتمد',
    price: incomingProduct?.price
      ? typeof incomingProduct.price === 'number'
        ? incomingProduct.price
        : parseInt(String(incomingProduct.price).replace(/[^\d]/g, ''), 10) || 0
      : 0,
    rating: incomingProduct?.rating || 5.0,
    reviewsCount: incomingProduct?.reviewsCount || 0,
    seller: {
      name:
        incomingProduct?.sellerName ||
        incomingProduct?.seller ||
        'متجر معتمد',
      isVerified: true,
      phone: incomingProduct?.sellerPhone || '01000000001',
    },
    description:
      incomingProduct?.description ||
      'قطعة غيار معتمدة متوافقة مع معايير الجودة ومشمولة بالضمان.',
    category: incomingProduct?.category || 'قطع غيار عامة',
    stock: incomingProduct?.stock || 0,
    images: (Array.isArray(incomingProduct?.images) && incomingProduct.images.length > 0
      ? incomingProduct.images
      : incomingProduct?.image
      ? [incomingProduct.image]
      : ['https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&auto=format&fit=crop&q=60']) as string[],
    specs: parsedSpecs,
    reviews: [],
    related: [],
  };

  const technicianDiscountPct = parseInt(parsedSpecs['خصم الفني (%)']) || 0;
  const isTechnician = user?.role === 'technician';
  const finalPrice = (isTechnician && technicianDiscountPct > 0) 
    ? product.price - (product.price * (technicianDiscountPct / 100))
    : product.price;

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(
            `شاهد قطعة الغيار: ${product.name} بسعر ${product.price} ج.م على منصة TecnoRexa`
          );
          Alert.alert('✅ تم النسخ', 'تم نسخ رابط المنتج إلى الحافظة!');
        }
      } else {
        await Share.share({
          message: `شاهد قطعة الغيار: ${product.name} بسعر ${product.price} ج.م على منصة TecnoRexa`,
        });
      }
    } catch {}
  };

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.images[0],
    });
    if (quantity > 1) {
      updateQuantity(product.id, quantity);
    }
    Alert.alert(
      '✅ تمت الإضافة إلى السلة',
      `تمت إضافة ${product.name} (${quantity}) إلى سلة المشتريات.`,
      [
        { text: 'متابعة التسوق' },
        { text: 'عرض السلة', onPress: () => navigation.navigate('Cart') },
      ]
    );
  };

  const handleBuyNow = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      image: product.images[0],
    });
    if (quantity > 1) {
      updateQuantity(product.id, quantity);
    }
    navigation.navigate('Cart');
  };

  const handleContactSeller = () => {
    navigation.navigate('ChatScreen', {
      recipientId: product.seller.name,
      recipientName: product.seller.name,
    });
  };

  const handleAddReview = () => {
    if (!reviewText.trim()) {
      Alert.alert('تنبيه', 'يرجى كتابة نص المراجعة والتقييم');
      return;
    }
    Alert.alert('شكراً لك ⭐', 'تم تسجيل تقييمك ومراجعته وسيظهر للمشترين.');
    setReviewText('');
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* Luxury Black & Gold Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          backgroundColor: colors.darkCard,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TouchableOpacity
            onPress={() => setIsFavorite(!isFavorite)}
            style={{
              width: 38,
              height: 38,
              backgroundColor: '#1E1E1E',
              borderRadius: borderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isFavorite ? colors.danger : colors.border,
            }}
          >
            <Heart
              color={isFavorite ? colors.danger : colors.gray}
              fill={isFavorite ? colors.danger : 'transparent'}
              size={18}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={{
              width: 38,
              height: 38,
              backgroundColor: '#1E1E1E',
              borderRadius: borderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Share2 color={colors.white} size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={{
              width: 38,
              height: 38,
              backgroundColor: '#1E1E1E',
              borderRadius: borderRadius.md,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
              position: 'relative',
            }}
          >
            <ShoppingCart color={colors.primary} size={18} />
            {cartItems.length > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: colors.primary,
                  borderRadius: 10,
                  width: 18,
                  height: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.dark, fontSize: 10, fontWeight: '900' }}>
                  {cartItems.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text
          style={{
            fontSize: typography.sizes.md,
            fontWeight: '900',
            color: colors.white,
          }}
        >
          تفاصيل القطعة 📦
        </Text>

        <TouchableOpacity
          onPress={() => {
            if (navigation?.canGoBack && navigation.canGoBack()) {
              navigation.goBack();
            } else if (navigation?.navigate) {
              navigation.navigate('Marketplace');
            }
          }}
          style={{
            width: 38,
            height: 38,
            backgroundColor: '#1E1E1E',
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ChevronRight color={colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 150 }}
      >
        {/* Main Product Image Area */}
        <View
          style={{
            backgroundColor: '#101010',
            paddingVertical: spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View
            style={{
              height: 250,
              marginHorizontal: spacing.md,
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.xl,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              source={{ uri: product.images[activeImageIndex] }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          {/* Thumbnails */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              gap: spacing.sm,
              marginTop: spacing.md,
            }}
          >
            {product.images.map((img: string, i: number) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveImageIndex(i)}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: borderRadius.md,
                  borderWidth: 2,
                  borderColor:
                    activeImageIndex === i ? colors.primary : colors.border,
                  overflow: 'hidden',
                  backgroundColor: colors.darkCard,
                }}
              >
                <Image
                  source={{ uri: img }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Product Meta & Pricing */}
        <View style={{ padding: spacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: spacing.xs,
            }}
          >
            <View style={{ alignItems: 'flex-start' }}>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '900',
                  color: colors.primary,
                }}
              >
                {finalPrice.toLocaleString()} ج.م
              </Text>
              {isTechnician && technicianDiscountPct > 0 && (
                <Text style={{ color: '#EAB308', fontSize: 12, fontWeight: '700', textDecorationLine: 'line-through' }}>
                  {product.price.toLocaleString()} ج.م (خصم {technicianDiscountPct}%)
                </Text>
              )}
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                متوفر بالمستودع ({product.stock} قطع) 🟢
              </Text>
            </View>

            <View style={{ flex: 1, alignItems: 'flex-end', paddingLeft: spacing.md }}>
              <Text
                style={{
                  fontSize: typography.sizes.lg,
                  fontWeight: '900',
                  color: colors.white,
                  textAlign: 'right',
                  lineHeight: 26,
                }}
              >
                {product.name}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 6,
                }}
              >
                <Text style={{ color: colors.gray, fontSize: 12 }}>
                  ({product.reviewsCount} تقييم)
                </Text>
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: '900',
                    fontSize: 13,
                  }}
                >
                  {product.rating}
                </Text>
                <Star size={14} color={colors.primary} fill={colors.primary} />
              </View>
            </View>
          </View>

          {/* Seller Card */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.darkCard,
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              marginVertical: spacing.md,
            }}
          >
            <TouchableOpacity
              onPress={handleContactSeller}
              style={{
                backgroundColor: 'rgba(212,175,55,0.15)',
                borderWidth: 1,
                borderColor: colors.primary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: borderRadius.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MessageCircle size={14} color={colors.primary} />
              <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 12 }}>
                محادثة البائع
              </Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.gray, fontSize: 11 }}>المورد المعتمد</Text>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>
                  {product.seller.name}
                </Text>
              </View>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#1E1E1E',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.primary,
                }}
              >
                <Store size={20} color={colors.primary} />
              </View>
            </View>
          </View>

          {/* 4 Feature Cards */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: spacing.xs,
              marginBottom: spacing.lg,
            }}
          >
            <View
              style={{
                width: '48.5%',
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ShieldCheck color={colors.primary} size={22} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 12 }}>
                  ضمان 12 شهر
                </Text>
                <Text style={{ color: colors.gray, fontSize: 10 }}>استبدال فوري معتمد</Text>
              </View>
            </View>

            <View
              style={{
                width: '48.5%',
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Truck color="#10B981" size={22} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 12 }}>
                  شحن سريع
                </Text>
                <Text style={{ color: colors.gray, fontSize: 10 }}>خلال 24-48 ساعة</Text>
              </View>
            </View>

            <View
              style={{
                width: '48.5%',
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CreditCard color="#F59E0B" size={22} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 12 }}>
                  دفع آمن
                </Text>
                <Text style={{ color: colors.gray, fontSize: 10 }}>عند الاستلام أو المحفظة</Text>
              </View>
            </View>

            <View
              style={{
                width: '48.5%',
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row-reverse',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Award color="#8B5CF6" size={22} />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 12 }}>
                  أصلية 100%
                </Text>
                <Text style={{ color: colors.gray, fontSize: 10 }}>فحص الجودة والمطابقة</Text>
              </View>
            </View>
          </View>

          {/* Luxury Tab Buttons */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.lg,
              padding: 4,
              marginBottom: spacing.md,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {TABS.map((tab, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => setActiveTab(i)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: borderRadius.md,
                  alignItems: 'center',
                  backgroundColor:
                    activeTab === i ? colors.primary : 'transparent',
                }}
              >
                <Text
                  style={{
                    fontWeight: '900',
                    fontSize: 12,
                    color: activeTab === i ? colors.dark : colors.gray,
                  }}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* TAB 0: Description */}
          {activeTab === 0 && (
            <View
              style={{
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                style={{
                  color: colors.white,
                  fontSize: 14,
                  lineHeight: 24,
                  textAlign: 'right',
                }}
              >
                {product.description}
              </Text>
            </View>
          )}

          {/* TAB 1: Specs */}
          {activeTab === 1 && (
            <View
              style={{
                backgroundColor: colors.darkCard,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: 'hidden',
              }}
            >
              {Object.entries(product.specs).map(([key, val], idx) => (
                <View
                  key={key}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    padding: spacing.md,
                    borderBottomWidth:
                      idx === Object.keys(product.specs).length - 1 ? 0 : 1,
                    borderBottomColor: colors.border + '44',
                    backgroundColor: idx % 2 === 0 ? '#101010' : colors.darkCard,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                    {val as string}
                  </Text>
                  <Text style={{ color: colors.gray, fontSize: 13 }}>{key}</Text>
                </View>
              ))}
            </View>
          )}

          {/* TAB 2: Reviews */}
          {activeTab === 2 && (
            <View style={{ gap: spacing.md }}>
              {product.reviews.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <Star size={36} color={colors.gray} style={{ marginBottom: 12 }} />
                  <Text style={{ color: colors.white, fontSize: 14, fontWeight: '700' }}>لا توجد تقييمات بعد</Text>
                  <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4 }}>كن أول من يقيّم هذا المنتج بعد استلامه</Text>
                </View>
              ) : (
                product.reviews.map((rev: any) => (
                  <View
                    key={rev.id}
                    style={{
                      backgroundColor: colors.darkCard,
                      borderRadius: borderRadius.lg,
                      padding: spacing.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <Text style={{ color: colors.gray, fontSize: 11 }}>{rev.date}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13 }}>
                          {rev.user}
                        </Text>
                        <View style={{ flexDirection: 'row' }}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              color={colors.primary}
                              fill={s <= rev.rating ? colors.primary : 'none'}
                            />
                          ))}
                        </View>
                      </View>
                    </View>
                    <Text
                      style={{
                        color: colors.white,
                        fontSize: 13,
                        lineHeight: 20,
                        textAlign: 'right',
                      }}
                    >
                      {rev.comment}
                    </Text>
                  </View>
                ))
              )}

              {/* Add Review Box */}
              <View
                style={{
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.lg,
                  padding: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontWeight: '900',
                    color: colors.white,
                    textAlign: 'right',
                    marginBottom: spacing.xs,
                  }}
                >
                  أضف تقييمك للقطعة ⭐
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    gap: 6,
                    marginBottom: spacing.sm,
                  }}
                >
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setReviewRating(s)}>
                      <Star
                        size={22}
                        color={colors.primary}
                        fill={s <= reviewRating ? colors.primary : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={{
                    backgroundColor: '#0A0A0A',
                    borderRadius: borderRadius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: spacing.md,
                    textAlign: 'right',
                    height: 70,
                    textAlignVertical: 'top',
                    color: colors.white,
                    fontSize: 13,
                  }}
                  placeholder="اكتب تجربتك مع جودة القطعة وسرعة الشحن..."
                  placeholderTextColor={colors.gray}
                  multiline
                  value={reviewText}
                  onChangeText={setReviewText}
                />

                <TouchableOpacity
                  onPress={handleAddReview}
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.md,
                    padding: spacing.sm,
                    alignItems: 'center',
                    marginTop: spacing.sm,
                  }}
                >
                  <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 13 }}>
                    إرسال التقييم
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Related Products Carousel */}
          {product.related && product.related.length > 0 && (
            <>
              <Text
                style={{
                  fontSize: typography.sizes.md,
                  fontWeight: '900',
                  color: colors.white,
                  textAlign: 'right',
                  marginTop: spacing.xl,
                  marginBottom: spacing.sm,
                }}
              >
                قطع غيار مقترحة ذات صلة 🛒
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {product.related.map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() =>
                      navigation.push('ProductDetails', {
                        product: {
                          id: item.id,
                          name: item.name,
                          price: item.price,
                          image: item.image,
                        },
                      })
                    }
                    style={{
                      width: 150,
                      backgroundColor: colors.darkCard,
                      borderRadius: borderRadius.lg,
                      padding: spacing.sm,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginRight: spacing.sm,
                    }}
                  >
                    <Image
                      source={{ uri: item.image }}
                      style={{
                        height: 100,
                        borderRadius: borderRadius.md,
                        marginBottom: 6,
                      }}
                      resizeMode="cover"
                    />
                    <Text
                      style={{
                        color: colors.white,
                        fontWeight: '800',
                        fontSize: 12,
                        textAlign: 'right',
                      }}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontWeight: '900',
                        fontSize: 13,
                        textAlign: 'right',
                        marginTop: 4,
                      }}
                    >
                      {item.price} ج.م
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.darkCard,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: Platform.OS === 'ios' ? 24 : spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        {/* Quantity Controls */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#0A0A0A',
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: colors.border,
            height: 48,
          }}
        >
          <TouchableOpacity
            onPress={() => quantity > 1 && setQuantity((q) => q - 1)}
            style={{
              paddingHorizontal: 10,
              height: '100%',
              justifyContent: 'center',
            }}
          >
            <Minus size={14} color={colors.white} />
          </TouchableOpacity>
          <Text
            style={{
              color: colors.primary,
              fontWeight: '900',
              fontSize: 14,
              paddingHorizontal: 6,
            }}
          >
            {quantity}
          </Text>
          <TouchableOpacity
            onPress={() => setQuantity((q) => q + 1)}
            style={{
              paddingHorizontal: 10,
              height: '100%',
              justifyContent: 'center',
            }}
          >
            <Plus size={14} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity
          onPress={handleAddToCart}
          style={{
            flex: 1,
            height: 48,
            backgroundColor: '#1E1E1E',
            borderRadius: borderRadius.md,
            borderWidth: 1.5,
            borderColor: colors.primary,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <ShoppingCart size={18} color={colors.primary} />
          <Text
            style={{
              color: colors.primary,
              fontWeight: '900',
              fontSize: 13,
            }}
          >
            أضف للسلة
          </Text>
        </TouchableOpacity>

        {/* Buy Now Button */}
        <TouchableOpacity
          onPress={handleBuyNow}
          style={{
            flex: 1.2,
            height: 48,
            backgroundColor: colors.primary,
            borderRadius: borderRadius.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Sparkles size={18} color={colors.dark} />
          <Text
            style={{
              color: colors.dark,
              fontWeight: '900',
              fontSize: 14,
            }}
          >
            شراء فوري ⚡
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
