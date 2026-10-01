import React from 'react';
import { View, Text } from 'react-native';

let ActualMapView: any = null;
let ActualMarker: any = null;
let ActualPolyline: any = null;
let ActualPROVIDER_GOOGLE: any = 'google';

try {
  const Maps = require('react-native-maps');
  ActualMapView = Maps.default || Maps;
  ActualMarker = Maps.Marker;
  ActualPolyline = Maps.Polyline;
  if (Maps.PROVIDER_GOOGLE) {
    ActualPROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  }
} catch (e) {
  console.warn('react-native-maps not loaded, using fallback:', e);
}

export const PROVIDER_GOOGLE = ActualPROVIDER_GOOGLE;

export const Marker = (props: any) => {
  if (ActualMarker) {
    try {
      return <ActualMarker {...props} />;
    } catch {}
  }
  return null;
};

export const Polyline = (props: any) => {
  if (ActualPolyline) {
    try {
      return <ActualPolyline {...props} />;
    } catch {}
  }
  return null;
};

const SafeMapView = React.forwardRef((props: any, ref: any) => {
  if (ActualMapView) {
    try {
      return <ActualMapView ref={ref} {...props} />;
    } catch (e) {
      console.warn('Error rendering MapView:', e);
    }
  }
  return (
    <View style={[{ backgroundColor: '#18181B', justifyContent: 'center', alignItems: 'center' }, props.style]}>
      <Text style={{ color: '#D4AF37', fontWeight: 'bold' }}>📍 خريطة التتبع المباشر</Text>
    </View>
  );
});

export default SafeMapView;
