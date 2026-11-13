import { useState } from "react";
import { Pressable, type GestureResponderEvent, type PressableProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable com animação divertida: encolhe ao tocar e quica de volta ao soltar,
 * com um leve balanço. Aceita as mesmas props do Pressable (inclusive `style` como função).
 */
export function BouncyPressable({
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...rest
}: PressableProps) {
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);
  const tilt = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${tilt.value}deg` }],
  }));

  const handlePressIn = (event: GestureResponderEvent) => {
    setPressed(true);
    if (!disabled) {
      scale.value = withTiming(0.9, { duration: 90 });
    }
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    setPressed(false);
    if (!disabled) {
      scale.value = withSpring(1, { damping: 4, stiffness: 320, mass: 0.6 });
      tilt.value = withSequence(
        withTiming(-2.5, { duration: 70 }),
        withTiming(2.5, { duration: 90 }),
        withSpring(0, { damping: 6, stiffness: 260 }),
      );
    }
    onPressOut?.(event);
  };

  const baseStyle = typeof style === "function" ? style({ pressed }) : style;

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[baseStyle, animatedStyle]}
    />
  );
}
