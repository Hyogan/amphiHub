import { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

/** Shakes the part of the screen that just changed. Apply `style` to an Animated.View and call `shake()`. */
export function useShake() {
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const shake = () => {
    x.value = withSequence(
      withTiming(-6, { duration: 45 }),
      withRepeat(withTiming(6, { duration: 80 }), 3, true),
      withTiming(0, { duration: 45 }),
    );
  };
  return { style, shake };
}

/** A quick grow-and-settle, for an icon that just changed state (saved, checked). */
export function usePop() {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const pop = () => {
    scale.value = withSequence(withTiming(1.4, { duration: 110 }), withSpring(1, { damping: 5, stiffness: 260 }));
  };
  return { style, pop };
}
