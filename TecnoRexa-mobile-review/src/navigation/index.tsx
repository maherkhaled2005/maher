// src/navigation/index.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, Platform, Image } from 'react-native';
import { useAuthStore } from '../store/authStore';
import { normalizeRole } from '../utils/permissions';
import { colors, typography, spacing, borderRadius } from '../theme';

// Lucide icons
import {
  Home, ShoppingBag, Package, MessageCircle, User,
  HelpCircle, Ticket, Wallet, Shield, FileText, AlertTriangle,
  Code, Bot, BookOpen, Wrench, DollarSign, Truck, Box, Globe,
  BarChart2, Bell, CheckSquare, Users, Settings, Star, ShoppingCart,
} from 'lucide-react-native';

// ===== شاشات المصادقة =====
import LandingScreen from '../screens/Landing/LandingScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import OTPScreen from '../screens/Auth/OTPScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import BannedScreen from '../screens/Auth/BannedScreen';
import PendingApprovalScreen from '../screens/Auth/PendingApprovalScreen';

// ===== لوحات التحكم =====
import OwnerDashboard from '../screens/Dashboard/OwnerDashboard';
import ManagerDashboard from '../screens/Dashboard/ManagerDashboard';
import ProgrammerDashboard from '../screens/Dashboard/ProgrammerDashboard';
import SupportDashboard from '../screens/Dashboard/SupportDashboard';
import TechnicianDashboard from '../screens/Dashboard/TechnicianDashboard';
import MerchantDashboard from '../screens/Dashboard/MerchantDashboard';
import ClientDashboard from '../screens/Dashboard/ClientDashboard';

// ===== السوق =====
import MarketplaceScreen from '../screens/Marketplace/MarketplaceScreen';
import ProductDetailsScreen from '../screens/Marketplace/ProductDetailsScreen';
import AddProductScreen from '../screens/Marketplace/AddProductScreen';
import MyProductsScreen from '../screens/Marketplace/MyProductsScreen';
import CartScreen from '../screens/Marketplace/CartScreen';
import ComparisonScreen from '../screens/Marketplace/ComparisonScreen';

// ===== الطلبات =====
import OrdersScreen from '../screens/Orders/OrdersScreen';
import OrderDetailsScreen from '../screens/Orders/OrderDetailsScreen';
import TrackingScreen from '../screens/Orders/TrackingScreen';

// ===== الدردشة =====
import ChatListScreen from '../screens/Chat/ChatListScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import NewChatScreen from '../screens/Chat/NewChatScreen';
import DevChatScreen from '../screens/Chat/DevChatScreen';

// ===== الدعم =====
import SupportScreen from '../screens/Support/SupportScreen';
import TicketsScreen from '../screens/Support/TicketsScreen';
import TicketDetailsScreen from '../screens/Support/TicketDetailsScreen';
import ContactScreen from '../screens/Support/ContactScreen';
import FAQScreen from '../screens/Support/FAQScreen';

// ===== المحفظة والإشعارات =====
import WalletScreen from '../screens/Wallet/WalletScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';

// ===== الملف الشخصي =====
import ProfileScreen from '../screens/Profile/ProfileScreen';
import EditProfileScreen from '../screens/Profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import SubscriptionScreen from '../screens/Subscription/SubscriptionScreen';
import AddressesScreen from '../screens/Profile/AddressesScreen';
import PrivacyPolicyScreen from '../screens/Legal/PrivacyPolicyScreen';
import TermsScreen from '../screens/Legal/TermsScreen';

// ===== الإدارة =====
import AdminUsersScreen from '../screens/Admin/AdminUsersScreen';
import AdminAddUserScreen from '../screens/Admin/AdminAddUserScreen';
import AdminCategoriesScreen from '../screens/Admin/AdminCategoriesScreen';
import WarehousesScreen from '../screens/Warehouses/WarehousesScreen';
import WarehouseInventoryScreen from '../screens/Warehouses/WarehouseInventoryScreen';
import AuditLogsScreen from '../screens/Admin/AuditLogsScreen';
import ErrorReportsScreen from '../screens/Admin/ErrorReportsScreen';
import SystemOpsScreen from '../screens/Admin/SystemOpsScreen';
import TradeRequestsScreen from '../screens/Admin/TradeRequestsScreen';
import TechniciansTeamScreen from '../screens/Admin/TechniciansTeamScreen';

// ===== المطورون =====
import DevHubScreen from '../screens/Developer/DevHubScreen';
import CodeSnippetsScreen from '../screens/Developer/CodeSnippetsScreen';

// ===== المجتمع والذكاء الاصطناعي =====
import WebCommunityScreen from '../screens/Community/WebCommunityScreen';
import AIChatScreen from '../screens/AI/AIChatScreen';
import CoursesScreen from '../screens/Courses/CoursesScreen';
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';
import MarketingScreen from '../screens/Marketing/MarketingScreen';
import MediaApprovalScreen from '../screens/Media/MediaApprovalScreen';
import OfflineLibraryScreen from '../screens/Media/OfflineLibraryScreen';
import OnboardingModal from '../components/OnboardingModal';

// ─────────────────────────────────────────────────────────────
// Tab definitions per role
// ─────────────────────────────────────────────────────────────
type TabDef = { name: string; label: string; Icon: React.ComponentType<any>; screen: React.ComponentType<any> };

const getDashboardComponent = (role: string): React.ComponentType<any> => {
  const r = normalizeRole(role);
  const map: Record<string, React.ComponentType<any>> = {
    owner: OwnerDashboard,
    manager: ManagerDashboard,
    programmer: ProgrammerDashboard,
    customer_support: SupportDashboard,
    technician: TechnicianDashboard,
    merchant: MerchantDashboard,
    customer: ClientDashboard,
  };
  return map[r] || ClientDashboard;
};

// Each role has EXACTLY 5 DIFFERENT tabs
const getTabsForRole = (role: string): TabDef[] => {
  const r = normalizeRole(role);
  const HomeScreen = getDashboardComponent(role);

  const tabSets: Record<string, TabDef[]> = {
    // 👑 المالك: الرئيسية | السوق | الإدارة | التقارير | حسابي
    owner: [
      { name: 'Home', label: 'الرئيسية', Icon: Home, screen: HomeScreen },
      { name: 'Marketplace', label: 'السوق', Icon: ShoppingBag, screen: MarketplaceScreen },
      { name: 'AdminUsers', label: 'الإدارة', Icon: Settings, screen: AdminUsersScreen },
      { name: 'Analytics', label: 'التقارير', Icon: BarChart2, screen: AnalyticsScreen },
      { name: 'Profile', label: 'حسابي', Icon: User, screen: ProfileScreen },
    ],
    // 👔 المدير: الرئيسية | السوق | الطلبات | الدعم | حسابي
    manager: [
      { name: 'Home', label: 'الرئيسية', Icon: Home, screen: HomeScreen },
      { name: 'Marketplace', label: 'السوق', Icon: ShoppingBag, screen: MarketplaceScreen },
      { name: 'Orders', label: 'الطلبات', Icon: Package, screen: OrdersScreen },
      { name: 'Tickets', label: 'الدعم', Icon: Ticket, screen: TicketsScreen },
      { name: 'Profile', label: 'حسابي', Icon: User, screen: ProfileScreen },
    ],
    // 💻 المبرمج: الرئيسية | المهام | الأخطاء | الشات | حسابي
    programmer: [
      { name: 'Home', label: 'الرئيسية', Icon: Home, screen: HomeScreen },
      { name: 'DevHub', label: 'المهام', Icon: Code, screen: DevHubScreen },
      { name: 'ErrorReports', label: 'الأخطاء', Icon: AlertTriangle, screen: ErrorReportsScreen },
      { name: 'DevChat', label: 'الشات', Icon: MessageCircle, screen: DevChatScreen },
      { name: 'Profile', label: 'حسابي', Icon: User, screen: ProfileScreen },
    ],
    // 🎧 خدمة العملاء: الرئيسية | التذاكر | الشات | الفنيين | حسابي
    customer_support: [
      { name: 'Home', label: 'الرئيسية', Icon: Home, screen: HomeScreen },
      { name: 'Tickets', label: 'التذاكر', Icon: Ticket, screen: TicketsScreen },
      { name: 'ChatList', label: 'الشات', Icon: MessageCircle, screen: ChatListScreen },
      { name: 'TechniciansTeam', label: 'الفنيين', Icon: Wrench, screen: TechniciansTeamScreen },
      { name: 'Profile', label: 'حسابي', Icon: User, screen: ProfileScreen },
    ],
    // 🔧 الفني: الرئيسية | الطلبات | الكورسات | المحفظة | حسابي
    technician: [
      { name: 'Home', label: 'الرئيسية', Icon: Home, screen: HomeScreen },
      { name: 'Orders', label: 'الطلبات', Icon: Package, screen: OrdersScreen },
      { name: 'Courses', label: 'الكورسات', Icon: BookOpen, screen: CoursesScreen },
      { name: 'Wallet', label: 'المحفظة', Icon: Wallet, screen: WalletScreen },
      { name: 'Profile', label: 'حسابي', Icon: User, screen: ProfileScreen },
    ],
    // 🏪 التاجر: الرئيسية | منتجاتي | الطلبات | المحفظة | حسابي
    merchant: [
      { name: 'Home', label: 'الرئيسية', Icon: Home, screen: HomeScreen },
      { name: 'MyProducts', label: 'منتجاتي', Icon: Box, screen: MyProductsScreen },
      { name: 'Orders', label: 'الطلبات', Icon: Truck, screen: OrdersScreen },
      { name: 'Wallet', label: 'المحفظة', Icon: Wallet, screen: WalletScreen },
      { name: 'Profile', label: 'حسابي', Icon: User, screen: ProfileScreen },
    ],
    // 👤 العميل: الرئيسية | السوق | الفنيين | الذكاء الاصطناعي | حسابي
    customer: [
      { name: 'Home', label: 'الرئيسية', Icon: Home, screen: HomeScreen },
      { name: 'Marketplace', label: 'السوق', Icon: ShoppingBag, screen: MarketplaceScreen },
      { name: 'TechniciansTeam', label: 'الفنيين', Icon: Wrench, screen: TechniciansTeamScreen },
      { name: 'AIChat', label: 'الذكاء الاصطناعي', Icon: Bot, screen: AIChatScreen },
      { name: 'Profile', label: 'حسابي', Icon: User, screen: ProfileScreen },
    ],
  };

  return tabSets[r] || tabSets.customer;
};

// Role accent colors
const ROLE_COLORS: Record<string, string> = {
  owner: colors.owner,
  manager: colors.manager,
  programmer: colors.programmer,
  customer_support: colors.support,
  technician: colors.technician,
  merchant: colors.merchant,
  customer: colors.customer,
};

// ─────────────────────────────────────────────────────────────
// Bottom Tab Navigator
// ─────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

function BottomTabs() {
  const { user } = useAuthStore();
  const role = user?.role || 'customer';
  const tabs = getTabsForRole(role);
  const normalizedRole = normalizeRole(role);
  const activeColor = ROLE_COLORS[normalizedRole] || colors.primary;

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const tab = tabs.find(t => t.name === route.name);
          const Icon = tab?.Icon;
          return {
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#121212',
              borderTopColor: activeColor + '44',
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 84 : 78,
              paddingBottom: Platform.OS === 'ios' ? 24 : 18,
              marginBottom: Platform.OS === 'web' ? 0 : 12,
              paddingTop: 8,
              marginHorizontal: Platform.OS === 'web' ? 0 : 8,
              borderRadius: Platform.OS === 'web' ? 0 : borderRadius.lg,
              position: Platform.OS === 'web' ? ('relative' as any) : ('absolute' as any),
              bottom: Platform.OS === 'web' ? 0 : 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 12,
            },
            tabBarActiveTintColor: activeColor,
            tabBarInactiveTintColor: colors.gray,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: '700' as const,
            },
            tabBarIcon: ({ focused, color }) =>
              Icon ? <Icon color={color} size={focused ? 26 : 22} /> : null,
          };
        }}
      >
        {tabs.map(tab => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.screen}
            options={{ tabBarLabel: tab.label }}
          />
        ))}
      </Tab.Navigator>
      <OnboardingModal user={user} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Root Stack Navigator
// ─────────────────────────────────────────────────────────────
const Stack = createStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const isBanned = !!(user && (user.status === 'banned' || user.status === 'suspended'));
  const isPendingApproval = !!(user && (user.status === 'pending_approval' || ((user.role === 'technician' || user.role === 'merchant') && !user.isPro && user.status !== 'active')));
  const mustChangePassword = !!(user && (user.mustChangePassword === true || (user as any).mustChangePassword === 1));

  React.useEffect(() => {
    checkAuth?.();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="FAQ" component={FAQScreen} />
          </>
        ) : isBanned ? (
          <Stack.Screen name="Banned" component={BannedScreen} />
        ) : isPendingApproval ? (
          <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        ) : mustChangePassword ? (
          <Stack.Screen name="ForcedChangePassword" component={ChangePasswordScreen} />
        ) : (
          <>
            {/* Main Tab Navigator */}
            <Stack.Screen name="Main" component={BottomTabs} />
            <Stack.Screen name="Home" component={BottomTabs} />
            <Stack.Screen name="Dashboard" component={BottomTabs} />

            {/* Stack screens pushed on top */}
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="MyProducts" component={MyProductsScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
            <Stack.Screen name="Tracking" component={TrackingScreen} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} />
            <Stack.Screen name="NewChat" component={NewChatScreen} />
            <Stack.Screen name="DevChat" component={DevChatScreen} />
            <Stack.Screen name="TicketDetails" component={TicketDetailsScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Subscription" component={SubscriptionScreen} />
            <Stack.Screen name="Addresses" component={AddressesScreen} />
            <Stack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
            <Stack.Screen name="Warehouses" component={WarehousesScreen} />
            <Stack.Screen name="WarehouseInventory" component={WarehouseInventoryScreen} />
            <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
            <Stack.Screen name="ErrorReports" component={ErrorReportsScreen} />
            <Stack.Screen name="SystemOps" component={SystemOpsScreen} />
            <Stack.Screen name="TradeRequests" component={TradeRequestsScreen} />
            <Stack.Screen name="TechniciansTeam" component={TechniciansTeamScreen} />
            <Stack.Screen name="DevHub" component={DevHubScreen} />
            <Stack.Screen name="CodeSnippets" component={CodeSnippetsScreen} />
            <Stack.Screen name="WebCommunity" component={WebCommunityScreen} />
            <Stack.Screen name="AIChat" component={AIChatScreen} />
            <Stack.Screen name="Courses" component={CoursesScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Analytics" component={AnalyticsScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Tickets" component={TicketsScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
            <Stack.Screen name="Marketing" component={MarketingScreen} />
            <Stack.Screen name="MediaApproval" component={MediaApprovalScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="AdminAddUser" component={AdminAddUserScreen} />
            <Stack.Screen name="Comparison" component={ComparisonScreen} />
            <Stack.Screen name="Contact" component={ContactScreen} />
            <Stack.Screen name="FAQ" component={FAQScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="OfflineLibrary" component={OfflineLibraryScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
