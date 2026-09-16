import React from 'react';
import { View, Text } from 'react-native';
import { MapPin } from 'lucide-react-native';

const MapView = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12 }, style]}>
    <MapPin color="#94a3b8" size={32} />
    <Text style={{ color: '#94a3b8', fontWeight: '700', marginTop: 8 }}>الخرائط تعمل على تطبيق الهاتف فقط</Text>
    {children}
  </View>
);

export const Marker = ({ children }: any) => <>{children}</>;
export const Polyline = () => null;
export const PROVIDER_GOOGLE = 'google';

export default MapView;
