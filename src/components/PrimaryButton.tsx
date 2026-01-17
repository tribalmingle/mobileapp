import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import GoldButton from './universal/GoldButton';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  gradient?: readonly string[];
};

// Thin wrapper to match legacy PrimaryButton API
export default function PrimaryButton({ title, onPress, disabled, loading, style, gradient }: PrimaryButtonProps) {
  const combinedStyle: ViewStyle = { ...styles.button, ...(style as object) };
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
