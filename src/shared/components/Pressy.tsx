import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Buttons, cards, chips and tabs sink slightly when pressed and spring back. */
export function Pressy({
  children,
  onPress,
  style,
  disabled,
  depth = 0.97,
  label,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  depth?: number;
  label?: string;
}) {
  const pressed = useSharedValue(0);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * (1 - depth) }, { translateY: pressed.value }],
  }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        pressed.value = withSpring(0, { damping: 7, stiffness: 320 });
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}

/** Plain text links only dim when pressed. Never animate plain text. */
export function Tap({
  children,
  onPress,
  style,
  label,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && { opacity: 0.55 }]}>
      {children}
    </Pressable>
  );
}
