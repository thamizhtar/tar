import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
}

export default function Card({
  children,
  className = '',
  style,
  padding = 'medium',
  shadow = true,
}: CardProps) {
  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'small':
        return 'p-3';
      case 'medium':
        return 'p-4';
      case 'large':
        return 'p-6';
      default:
        return 'p-4';
    }
  };

  return (
    <View
      className={`bg-white rounded-xl border border-gray-200 ${getPaddingStyles()} ${className}`}
      style={style}
    >
      {children}
    </View>
  );
}
