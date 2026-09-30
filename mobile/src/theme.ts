// src/theme.ts
export const colors = {
  // الألوان الأساسية - القسم 23.1.1
  primary: '#D4AF37',       // ذهبي أساسي
  primaryDark: '#B8952E',   // ذهبي غامق
  primaryLight: '#F5D76E',  // ذهبي فاتح
  dark: '#0A0A0A',          // أسود أساسي (الخلفية)
  card: '#141416',          // أسود بطاقات
  darkCard: '#141416',      // أسود بطاقات
  border: '#27272A',        // أسود حدود
  white: '#FFFFFF',         // أبيض
  grayLight: '#E4E4E7',     // رمادي فاتح
  grayMedium: '#A1A1AA',    // رمادي متوسط
  grayDark: '#71717A',      // رمادي غامق
  gray: '#A1A1AA',          // افتراضي للنصوص الثانوية
  danger: '#EF4444',        // أحمر خطر
  success: '#10B981',       // أخضر نجاح
  warning: '#F59E0B',       // برتقالي تحذير
  info: '#3B82F6',          // أزرق معلومة

  // ألوان الرتب المعتمدة بدقة - القسم 23.1.2
  owner: '#D4AF37',         // المالك - ذهبي
  manager: '#1E40AF',       // المدير - أزرق داكن
  programmer: '#7C3AED',    // المبرمج - بنفسجي
  support: '#0D9488',       // خدمة العملاء - فيروزي
  technician: '#EA580C',    // الفني - برتقالي
  merchant: '#15803D',      // التاجر - أخضر زيتوني
  customer: '#6B7280',      // العميل - رمادي فضي

  // خلفيات الرتب
  ownerBg: 'rgba(212, 175, 55, 0.15)',
  managerBg: 'rgba(30, 64, 175, 0.15)',
  programmerBg: 'rgba(124, 58, 237, 0.15)',
  supportBg: 'rgba(13, 148, 136, 0.15)',
  technicianBg: 'rgba(234, 88, 12, 0.15)',
  merchantBg: 'rgba(21, 128, 61, 0.15)',
  customerBg: 'rgba(107, 114, 128, 0.15)',

  // Backward compat (Forced to Dark & Gold Theme)
  bgLight: '#0A0A0A',
  cardBg: '#1A1A2E',
  text: '#FFFFFF',
  textDim: '#94A3B8',
  blue: '#D4AF37', // Replaced blue with gold for all old buttons
  blueDark: '#B8952E',
  blueLight: 'rgba(212, 175, 55, 0.15)',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  successLight: '#D1FAE5',
  successBg: '#ECFDF5',
  dangerLight: '#FEE2E2',
  warningLight: '#FEF3C7',
  warningBg: '#FFFBEB',
  infoLight: 'rgba(212, 175, 55, 0.1)',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  orange: '#EA580C',
  orangeLight: '#FFEDD5',
  textSecondary: '#A1A1AA',
  background: '#0A0A0A',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
} as const;

export const typography = {
  fontFamily: 'Cairo',
  sizes: {
    xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 22, xxxl: 28, xxxxl: 34,
  },
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  body1: { fontSize: 16, fontFamily: 'Cairo' },
  body2: { fontSize: 14, fontFamily: 'Cairo' },
  h1: { fontSize: 28, fontWeight: '700' as const, fontFamily: 'Cairo' },
  h2: { fontSize: 22, fontWeight: '700' as const, fontFamily: 'Cairo' },
  h3: { fontSize: 18, fontWeight: '700' as const, fontFamily: 'Cairo' },
  caption: { fontSize: 12, fontFamily: 'Cairo' },
  fonts: {
    regular: 'Cairo',
    medium: 'Cairo',
    bold: 'Cairo',
    black: 'Cairo',
  },
} as const;

export const borderRadius = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, full: 9999, round: 9999,
} as const;

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 },
} as const;

/* ==========================================================================
   RESPONSIVE HELPERS — كمبيوتر / تابلت / تلفون
   ========================================================================== */
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/** أقصى عرض للمحتوى على الشاشات الكبيرة (كمبيوتر/تابلت) لتجنب Strech الغريب */
export const MAX_CONTENT_WIDTH = 820;

/** أقصى عرض لصندوق الشات نفسه */
export const MAX_CHAT_WIDTH = 900;

export const breakpoints = {
  phone: 0,
  largePhone: 411,
  tablet: 768,
  desktop: 1100,
} as const;

export const isSmallPhone = (w: number = SCREEN_W) => w < 360;
export const isPhone = (w: number = SCREEN_W) => w < breakpoints.tablet;
export const isTablet = (w: number = SCREEN_W) =>
  w >= breakpoints.tablet && w < breakpoints.desktop;
export const isDesktop = (w: number = SCREEN_W) => w >= breakpoints.desktop;

/** تكبير خفيف جداً على التابلت عشان يبقى مقروء */
export const fontScaleFor = (w: number = SCREEN_W) => {
  if (w >= breakpoints.desktop) return 1;
  if (w >= breakpoints.tablet) return 1.05;
  if (w < 360) return 0.95;
  return 1;
};

/** معامل المسافات حسب حجم الشاشة */
export const spaceScale = (w: number = SCREEN_W) => {
  if (w >= breakpoints.desktop) return 1.15;
  if (w >= breakpoints.tablet) return 1.08;
  if (w < 360) return 0.9;
  return 1;
};

/** حاوية مركزية بعرض أقصى على الكمبيوتر/التابلت */
export const contentContainer = (maxWidth: number = MAX_CONTENT_WIDTH) => ({
  width: '100%',
  maxWidth,
  alignSelf: 'center' as const,
});

/** يمنع أي تمدد أفقي (يمين/شمال) على كل الشاشات */
export const noHorizontalOverflow = {
  width: '100%' as const,
  maxWidth: '100%' as const,
  alignSelf: 'stretch' as const,
  overflow: 'hidden' as const,
};

/** يمنع تكبير الخط بشكل مجنون حسب إعدادات المستخدم */
export const fixedText = {
  allowFontScaling: false,
} as const;

/** ارتفاع شريط الإدخال متجاوب مع الكيبورد */
export const inputBarPaddingBottom = () => {
  if (Platform.OS === 'ios') return 26;
  if (SCREEN_H < 700) return 6;
  return 12;
};

export const screen = { width: SCREEN_W, height: SCREEN_H, pixelRatio: PixelRatio.get() };

// Backward compat
export const COLORS = {
  gold: '#D4AF37', bg: '#09090b', surface: '#18181b',
  border: 'rgba(255,255,255,0.08)', text: '#ffffff',
  textDim: 'rgba(255,255,255,0.5)', textFaint: 'rgba(255,255,255,0.3)',
  green: '#22c55e', red: '#ef4444', blue: '#3b82f6',
  indigo: '#4f46e5', violet: '#8b5cf6', amber: '#f59e0b', sky: '#0ea5e9',
} as const;

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40 } as const;

export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  MAX_CONTENT_WIDTH,
  MAX_CHAT_WIDTH,
  contentContainer,
  noHorizontalOverflow,
  fixedText,
  fontScaleFor,
  spaceScale,
  isPhone,
  isTablet,
  isDesktop,
  isSmallPhone,
  inputBarPaddingBottom,
};
