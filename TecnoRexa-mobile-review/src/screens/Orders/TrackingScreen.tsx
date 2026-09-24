import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Dimensions, Alert, Linking, Platform } from 'react-native';
import { ArrowLeft, ChevronRight, Phone, ShieldCheck, MapPin, Navigation } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../theme';
import * as Location from 'expo-location';

// Import our safe wrappers
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../../components/MapWrapper';

const { width, height } = Dimensions.get('window');

export default function TrackingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params || {};
  const { user } = useAuthStore();
  
  const isCustomer = user?.role === 'customer';

  // Coordinates for live tracking
  // Customer is typically at a fixed location (their home).
  const customerCoords = { latitude: 30.0626, longitude: 31.3413 }; 
  
  // Technician moves. We start them a bit far.
  const [techCoords, setTechCoords] = useState({ latitude: 30.0700, longitude: 31.3500 });
  const [eta, setEta] = useState('15 دقيقة');
  const [distance, setDistance] = useState('2.4 كم');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
      }
    })();

    // Simulate technician moving towards customer
    const interval = setInterval(() => {
      setTechCoords(prev => {
        // Move slightly towards customer
        const latDiff = customerCoords.latitude - prev.latitude;
        const lngDiff = customerCoords.longitude - prev.longitude;
        
        // If very close, stop moving
        if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
          setEta('وصل الفني');
          setDistance('0 كم');
          return customerCoords;
        }

        return {
          latitude: prev.latitude + latDiff * 0.1,
          longitude: prev.longitude + lngDiff * 0.1
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.dark },
        
      ]}
    >
      {/* Absolute Back Button */}
      <TouchableOpacity 
        onPress={() => {
          if (navigation?.canGoBack && navigation.canGoBack()) {
            navigation.goBack();
          } else if (navigation?.navigate) {
            navigation.navigate('Orders');
          }
        }}
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 50 : 20,
          right: 20,
          zIndex: 100,
          backgroundColor: '#1A1A1A',
          borderWidth: 1,
          borderColor: '#333',
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 5,
        }}
      >
        <ChevronRight color={colors.white} size={24} />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: (customerCoords.latitude + techCoords.latitude) / 2,
            longitude: (customerCoords.longitude + techCoords.longitude) / 2,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {/* Customer Marker */}
          <Marker coordinate={customerCoords} title={isCustomer ? "موقعك" : "موقع العميل"}>
            <View style={{ backgroundColor: colors.primary, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: colors.dark }}>
              <MapPin color={colors.dark} size={16} />
            </View>
          </Marker>

          {/* Technician Marker */}
          <Marker coordinate={techCoords} title={isCustomer ? "الفني" : "موقعك"}>
            <View style={{ backgroundColor: colors.success, padding: 8, borderRadius: 20, borderWidth: 2, borderColor: colors.dark }}>
              <Navigation color={colors.white} size={16} />
            </View>
          </Marker>

          {/* Polyline connecting them */}
          <Polyline 
            coordinates={[techCoords, customerCoords]}
            strokeColor={colors.primary}
            strokeWidth={4}
            lineDashPattern={[10, 10]}
          />
        </MapView>
      </View>

      {/* ETA & Info Bottom Sheet */}
      <View
        style={{
          backgroundColor: '#141414',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 20,
          borderTopWidth: 1,
          borderColor: '#222',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.4,
          shadowRadius: 15,
          elevation: 15,
          marginTop: -20,
        }}
      >
        {/* Handle bar */}
        <View style={{ width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
        
        <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary }}>{eta}</Text>
            <Text style={{ color: colors.gray, fontSize: 13, fontWeight: '700', marginTop: 2 }}>الوقت المتوقع للوصول</Text>
          </View>
          <View style={{ backgroundColor: 'rgba(212,175,55,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.primary }}>
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16 }}>{distance}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: '#1A1A1A', padding: 14, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: '#333' }}>
          <View style={{ width: 46, height: 46, backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: 23, alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck color={colors.primary} size={24} />
          </View>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.white, textAlign: 'right' }}>
              {isCustomer ? (route.params?.technicianName ? `${route.params.technicianName} (فني معتمد)` : 'الفني المعتمد للمهمة') : (route.params?.customerName || user?.name || 'العميل')}
            </Text>
            <Text style={{ color: colors.gray, fontSize: 12, textAlign: 'right', marginTop: 2 }}>
              {isCustomer ? 'صيانة تكييفات وأجهزة منزلية' : 'طلب صيانة منزلية'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row-reverse', gap: 10 }}>
          <TouchableOpacity 
            onPress={() => {
              const tel = route.params?.phone || (isCustomer ? '01000000005' : '01000000007');
              Linking.openURL(`tel:${tel}`).catch(() => {});
            }}
            style={{ flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8 }}
          >
            <Phone color={colors.dark} size={18} />
            <Text style={{ color: colors.dark, fontWeight: '900', fontSize: 15 }}>اتصال مباشر</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
