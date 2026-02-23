import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand } from '@/constants/theme';

export interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  snapHeight?: number;
}

export function BottomSheet({
  visible,
  onDismiss,
  children,
  snapHeight = 300,
}: BottomSheetProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useSharedValue(snapHeight);
  const backdropOpacity = useSharedValue(0);
  const { bottom } = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(1, { duration: 250 });
    } else {
      translateY.value = withSpring(
        snapHeight,
        { damping: 20, stiffness: 200 },
        (finished) => {
          if (finished) {
            runOnJS(setModalVisible)(false);
          }
        }
      );
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, snapHeight]);

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  function handleDismiss() {
    translateY.value = withSpring(
      snapHeight,
      { damping: 20, stiffness: 200 },
      (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      }
    );
    backdropOpacity.value = withTiming(0, { duration: 200 });
  }

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={handleDismiss}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropAnimStyle]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
          accessibilityLabel="Close"
          accessibilityRole="button"
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { height: snapHeight, paddingBottom: 16 + bottom },
          sheetAnimStyle,
        ]}
      >
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Brand.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Brand.accent,
  },
});
