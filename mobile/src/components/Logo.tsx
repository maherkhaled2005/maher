import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface LogoProps {
  size?: number;
  showText?: boolean;
  imageSize?: number;
}

export default function Logo({ size = 20, showText = true, imageSize = 28 }: LogoProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/icon.png')}
        style={{
          width: imageSize,
          height: imageSize,
          borderRadius: Math.round(imageSize * 0.28),
          marginRight: showText ? 8 : 0,
        }}
        resizeMode="contain"
      />
      {showText && (
        <View style={styles.textRow}>
          <Text style={[styles.textWhite, { fontSize: size }]}>Tecno</Text>
          <Text style={[styles.textGold, { fontSize: size }]}>Rexa</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWhite: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  textGold: {
    color: '#D4AF37',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
