/**
 * Typography scale for CarbonSense
 * Display: DM Serif Display — editorial, organic, memorable
 * Body: DM Sans — clean, modern, highly legible
 *
 * Install with:
 *   npx expo install @expo-google-fonts/dm-serif-display @expo-google-fonts/dm-sans expo-font
 */

export const Fonts = {
  // Display / serif — for headlines and question text
  displayRegular: 'DMSerifDisplay_400Regular',
  displayItalic: 'DMSerifDisplay_400Regular_Italic',

  // Sans — for body, labels, buttons
  sansRegular: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansSemiBold: 'DMSans_600SemiBold',
  sansBold: 'DMSans_700Bold',
} as const;

export const FontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
  '4xl': 48,
} as const;

export const LineHeights = {
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.65,
} as const;
