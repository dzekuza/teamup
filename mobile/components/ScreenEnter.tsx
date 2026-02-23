/**
 * ScreenEnter — wraps screen content in a smooth fade + slide-up entrance.
 * Usage: wrap the SafeAreaView content children (not SafeAreaView itself).
 *
 * Example:
 *   <SafeAreaView style={styles.container} edges={['top']}>
 *     <ScreenEnter>
 *       <View style={styles.header}>...</View>
 *       <FlatList ... />
 *     </ScreenEnter>
 *   </SafeAreaView>
 */
import React, { useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing,
} from 'react-native-reanimated';

interface ScreenEnterProps {
    children: React.ReactNode;
    /** Delay before animation starts (ms). Default: 0 */
    delay?: number;
    /** How far below origin the content starts (px). Default: 18 */
    slideDistance?: number;
}

export function ScreenEnter({
    children,
    delay = 0,
    slideDistance = 18,
}: ScreenEnterProps) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(slideDistance);

    useEffect(() => {
        const timer = setTimeout(() => {
            opacity.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.quad) });
            translateY.value = withSpring(0, { damping: 20, stiffness: 180, mass: 0.7 });
        }, delay);
        return () => clearTimeout(timer);
    }, []);

    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
        flex: 1,
    }));

    return <Animated.View style={animStyle}>{children}</Animated.View>;
}
