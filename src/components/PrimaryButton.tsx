import React from 'react';
import { StyleSheet, StyleProp, ViewStyle } from 'react-native';
import GoldButton from './universal/GoldButton';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  gradient?: readonly string[];
};

// Thin wrapper to match legacy PrimaryButton API
export default function PrimaryButton({ title, onPress, disabled, loading, style, gradient }: PrimaryButtonProps) {
  const combinedStyle: StyleProp<ViewStyle> = [styles.button, style];
  return (
    <GoldButton
      title={title}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      style={combinedStyle}
      variant={gradient ? 'primary' : 'primary'}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
  },
});
