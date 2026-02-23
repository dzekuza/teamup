// TeamUp Design System - matching web app
import { TextStyle, ViewStyle } from 'react-native';

export const Brand = {
  accent: '#C1FF2F',
  accentDark: '#111111',
  background: '#111111',
  surface: '#1E1E1E',
  border: '#333333',
  borderFocused: '#C1FF2F',
  borderError: '#FF4D4F',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textDisabled: '#444444',
} as const;

export const Colors = {
  // Brand
  primary: '#C1FF2F',
  primaryMuted: '#CDEA68',
  mainColor: '#B4D91E',

  // Backgrounds
  background: '#111111',
  backgroundDark: '#10130C',
  surface: '#1E1E1E',
  surfaceLight: '#2A2A2A',
  surfaceLighter: '#333333',
  darkGreen: '#151905',
  lightGreen: 'rgba(180,217,30,0.05)',

  // Text
  text: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#808080',
  textOnPrimary: '#000000',
  inputText: '#8B9182',

  // Status
  error: '#FF4444',
  success: '#4CAF50',
  warning: '#FFC107',

  // Borders
  border: '#333333',
  borderLight: '#444444',
  darkGreenBorder: '#1D210D',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.55)',
  overlayGradientEnd: 'rgba(30, 30, 30, 0.95)',

  // Semantic
  errorBg: 'rgba(255, 68, 68, 0.1)',
  primaryBgSubtle: 'rgba(193, 255, 47, 0.08)',
  markerBg: 'rgba(30, 30, 30, 0.8)',
  link: '#0a7ea4',
  textLight: '#E1E1E1',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ── Typography Scale ──────────────────────────────────────────────
// Reduced to 5 core sizes (per Vercel RN best practice: limit font sizes,
// use weight + color for hierarchy). Line heights use ~1.4x multiplier
// for readability on mobile.

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  hero: 34,
};

export const LineHeight = {
  xs: 14,    // FontSize.xs × 1.4
  sm: 16,    // FontSize.sm × 1.33
  md: 20,    // FontSize.md × 1.43
  lg: 22,    // FontSize.lg × 1.375
  xl: 24,    // FontSize.xl × 1.33
  xxl: 28,   // FontSize.xxl × 1.27
  xxxl: 36,  // FontSize.xxxl × 1.29
  hero: 42,  // FontSize.hero × 1.24
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// ── Typography Presets ────────────────────────────────────────────
// Pre-composed text styles to reduce inline style duplication.
// Use: <Text style={Typography.title}>

export const Typography = {
  // Hero / display headings
  hero: {
    fontSize: FontSize.hero,
    lineHeight: LineHeight.hero,
    fontWeight: FontWeight.extrabold,
    color: Colors.text,
  } as TextStyle,

  // Page-level headings
  h1: {
    fontSize: FontSize.xxxl,
    lineHeight: LineHeight.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  } as TextStyle,

  // Section headings
  h2: {
    fontSize: FontSize.xxl,
    lineHeight: LineHeight.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  } as TextStyle,

  // Card titles, large labels
  title: {
    fontSize: FontSize.xl,
    lineHeight: LineHeight.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  } as TextStyle,

  // Subtitles, emphasized body
  subtitle: {
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  } as TextStyle,

  // Default body text
  body: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: FontWeight.regular,
    color: Colors.text,
  } as TextStyle,

  // Body text - semibold variant
  bodySemibold: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  } as TextStyle,

  // Secondary body text
  bodySecondary: {
    fontSize: FontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  } as TextStyle,

  // Small / captions
  caption: {
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textMuted,
  } as TextStyle,

  // Caption - semibold variant (badges, labels)
  captionSemibold: {
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  } as TextStyle,

  // Tiny labels, badges
  micro: {
    fontSize: FontSize.xs,
    lineHeight: LineHeight.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
  } as TextStyle,

  // Button text
  button: {
    fontSize: FontSize.lg,
    lineHeight: LineHeight.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
  } as TextStyle,

  // Small button text
  buttonSmall: {
    fontSize: FontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textOnPrimary,
  } as TextStyle,
} as const;
