import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 36 }: LogoProps) {
  return (
    <View style={styles.container}>
      <Text style={[styles.textWhite, { fontSize: size }]}>Tecno</Text>
      <Text style={[styles.textGold, { fontSize: size }]}>Rexa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWhite: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  textGold: {
    color: '#D4AF37', // Gold color as per requirements
    fontWeight: '900',
    letterSpacing: 1,
  },
});
