import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import {
  ChevronRight,
  Trash2,
  ShoppingCart,
  Plus,
  Star,
  CheckCircle2,
  Sliders,
  Scale,
} from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useCartStore } from '../../store/cartStore';

export default function ComparisonScreen({ route, navigation }: any) {
  const { addItem } = useCartStore();

  const [compareList, setCompareList] = useState<any[]>(route?.params?.products || []);

  const removeFromCompare = (id: string) => {
    setCompareList((prev) => prev.filter((p) => p.id !== id));
  };

  const getSpecKeys = () => {
    const keys = new Set<string>();
    compareList.forEach((p) => Object.keys(p.specs).forEach((k) => keys.add(k)));
    return Array.from(keys);
  };

  const allSpecKeys = getSpecKeys();

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
    });
    Alert.alert('✅ تمت الإضافة إلى السلة', `تمت إضافة ${product.name} إلى السلة بنجاح.`);
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
        <View style={{ width: 40 }} />
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: typography.sizes.lg,
              fontWeight: '900',
              color: colors.white,
            }}
          >
            مقارنة المواصفات والأسعار ⚖️
          </Text>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
            {compareList.length} منتجات في المقارنة
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => (navigation?.canGoBack?.() ? navigation.goBack() : navigation.navigate('Marketplace'))}
          style={{
            width: 40,
            height: 40,
            backgroundColor: '#1E1E1E',
            borderRadius: borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <ChevronRight color={colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 150 }}>
        {compareList.length === 0 ? (
          <View
            style={{
              margin: spacing.xl,
              backgroundColor: colors.darkCard,
              borderRadius: borderRadius.xl,
              padding: spacing.xxl,
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: colors.border,
              borderStyle: 'dashed',
            }}
          >
            <Scale size={48} color={colors.gray} style={{ marginBottom: spacing.md }} />
            <Text
              style={{
                color: colors.white,
                fontSize: 16,
                fontWeight: '900',
                marginBottom: 6,
              }}
            >
              لا توجد قطع للمقارنة حالياً
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'center', marginBottom: spacing.lg }}>
              تصفح السوق واختر القطع لمقارنة فروق الأسعار والمواصفات وبلد المنشأ
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Marketplace')}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.sm,
                borderRadius: borderRadius.md,
              }}
            >
              <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 13 }}>
                تصفح السوق الآن 🛒
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              padding: spacing.md,
              flexDirection: 'row-reverse',
            }}
          >
            {compareList.map((product) => (
              <View
                key={product.id}
                style={{
                  width: 240,
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.xl,
                  padding: spacing.md,
                  marginLeft: spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {/* Remove Btn */}
                <TouchableOpacity
                  onPress={() => removeFromCompare(product.id)}
                  style={{
                    alignSelf: 'flex-start',
                    padding: 6,
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    borderRadius: borderRadius.sm,
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.3)',
                    marginBottom: spacing.xs,
                  }}
                >
                  <Trash2 color={colors.danger} size={16} />
                </TouchableOpacity>

                <View
                  style={{
                    height: 100,
                    backgroundColor: '#101010',
                    borderRadius: borderRadius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.sm,
                  }}
                >
                  <Text style={{ color: colors.primary, fontSize: 28 }}>📦</Text>
                </View>

                <Text
                  style={{
                    color: colors.white,
                    fontWeight: '900',
                    fontSize: 13,
                    textAlign: 'right',
                    marginBottom: 4,
                    height: 38,
                  }}
                  numberOfLines={2}
                >
                  {product.name}
                </Text>

                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: '900',
                    fontSize: 18,
                    textAlign: 'right',
                    marginBottom: 6,
                  }}
                >
                  {product.price.toLocaleString()} ج.م
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 4,
                    marginBottom: spacing.md,
                  }}
                >
                  <Text style={{ color: colors.gray, fontSize: 11 }}>({product.rating})</Text>
                  <Star color={colors.primary} size={12} fill={colors.primary} />
                </View>

                {/* Add to Cart */}
                <TouchableOpacity
                  onPress={() => handleAddToCart(product)}
                  style={{
                    backgroundColor: 'rgba(212,175,55,0.15)',
                    borderRadius: borderRadius.md,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    paddingVertical: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    marginBottom: spacing.md,
                  }}
                >
                  <ShoppingCart color={colors.primary} size={15} />
                  <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 12 }}>
                    أضف للسلة
                  </Text>
                </TouchableOpacity>

                {/* Specs */}
                <View
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    paddingTop: spacing.sm,
                  }}
                >
                  <Text
                    style={{
                      color: colors.white,
                      fontWeight: '900',
                      fontSize: 12,
                      textAlign: 'right',
                      marginBottom: spacing.xs,
                    }}
                  >
                    المواصفات الفنية
                  </Text>

                  {allSpecKeys.map((key) => (
                    <View
                      key={key}
                      style={{
                        marginBottom: 8,
                        backgroundColor: '#101010',
                        padding: 6,
                        borderRadius: borderRadius.sm,
                      }}
                    >
                      <Text style={{ color: colors.gray, fontSize: 10, textAlign: 'right' }}>
                        {key}
                      </Text>
                      <Text
                        style={{
                          color: colors.white,
                          fontWeight: '700',
                          fontSize: 11,
                          textAlign: 'right',
                          marginTop: 2,
                        }}
                      >
                        {product.specs[key as keyof typeof product.specs] || '—'}
                      </Text>
                    </View>
                  ))}

                  <Text
                    style={{
                      color: colors.gray,
                      fontSize: 10,
                      textAlign: 'right',
                      marginTop: spacing.xs,
                    }}
                  >
                    نبذة فنية
                  </Text>
                  <Text
                    style={{
                      color: colors.white,
                      fontSize: 11,
                      textAlign: 'right',
                      lineHeight: 16,
                      marginTop: 2,
                    }}
                  >
                    {product.desc}
                  </Text>
                </View>
              </View>
            ))}

            {/* Add more button */}
            {compareList.length < 4 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Marketplace')}
                style={{
                  width: 200,
                  backgroundColor: colors.darkCard,
                  borderRadius: borderRadius.xl,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: spacing.md,
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    backgroundColor: 'rgba(212,175,55,0.15)',
                    borderRadius: 25,
                    borderWidth: 1,
                    borderColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.sm,
                  }}
                >
                  <Plus color={colors.primary} size={24} />
                </View>
                <Text style={{ color: colors.white, fontWeight: '900', fontSize: 13, textAlign: 'center' }}>
                  إضافة قطعة أخرى للمقارنة
                </Text>
                <Text style={{ color: colors.gray, fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                  يمكنك مقارنة حتى 4 قطع في وقت واحد
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
