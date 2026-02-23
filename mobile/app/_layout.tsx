import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <KeyboardProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
            // Default for push navigation: native iOS-style right slide
            animation: 'slide_from_right',
            // Smooth gesture-driven feel
            gestureEnabled: true,
            gestureDirection: 'horizontal',
            // Custom transition spec — faster than default, feels snappier
            animationDuration: 320,
          }}
        >
          {/* Auth flow — fade in so it doesn't "slide from" somewhere */}
          <Stack.Screen
            name="(auth)"
            options={{
              headerShown: false,
              animation: 'fade',
              animationDuration: 280,
            }}
          />

          {/* Tab root — no animation (already inside, just show instantly) */}
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              animation: 'none',
            }}
          />

          {/* Event detail — slides up like a native card */}
          <Stack.Screen
            name="event/[id]"
            options={{
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right',
              animationDuration: 300,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}
          />

          {/* Map — slides in from right, swiped back horizontally */}
          <Stack.Screen
            name="map"
            options={{
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right',
              animationDuration: 300,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }}
          />

          {/* Edit event — slides up as modal sheet */}
          <Stack.Screen
            name="edit-event/[id]"
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 340,
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />

          {/* Edit profile — slides up as modal sheet */}
          <Stack.Screen
            name="edit-profile"
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 340,
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />

          {/* Create event — slides up as modal sheet */}
          <Stack.Screen
            name="create-event"
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
              animationDuration: 340,
              gestureEnabled: true,
              gestureDirection: 'vertical',
            }}
          />
        </Stack>
      </AuthProvider>
    </KeyboardProvider>
  );
}
