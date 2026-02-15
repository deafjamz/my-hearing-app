import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration for SoundSteps
 *
 * This configures the native iOS and Android builds.
 *
 * Key considerations for hearing rehabilitation app:
 * - iOS: MFi hearing device support via AVAudioSession
 * - Android: ASHA hearing device support via Bluetooth
 * - Both: Inline media playback, minimal user action requirements
 */
const config: CapacitorConfig = {
  appId: 'com.soundsteps.app',
  appName: 'SoundSteps',
  webDir: 'dist',

  // Server configuration
  server: {
    // Use custom scheme to avoid CORS issues
    androidScheme: 'https',
    // Allow loading from localhost during development
    cleartext: false,
  },

  // iOS-specific configuration
  ios: {
    // Audio playback without user interaction (after initial unlock)
    allowsLinkPreview: false,

    // CRITICAL for hearing apps: Allow inline media playback
    // This prevents fullscreen video/audio which disrupts hearing device connection
    contentInset: 'automatic',

    // Preferred status bar style
    preferredContentMode: 'mobile',

    // Background audio capability (add to Info.plist manually)
    // Required for MFi hearing aid streaming
    // UIBackgroundModes: ['audio']
  },

  // Android-specific configuration
  android: {
    // Allow mixed content for development
    allowMixedContent: true,

    // Minimum SDK version (Android 7.0+)
    // Required for modern Bluetooth audio codecs
    minSdkVersion: 24,

    // Enable hardware acceleration for better audio performance
    useLegacyBridge: false,

    // Build configuration
    buildOptions: {
      // Sign release builds
      releaseType: 'APK',
    },
  },

  // Plugin configurations
  plugins: {
    // Haptics for tactile feedback on correct/incorrect
    Haptics: {
      // No special config needed
    },

    // Filesystem for audio caching
    Filesystem: {
      // No special config needed
    },

    // Keyboard handling
    Keyboard: {
      // Resize behavior
      resize: 'body',
      // Scroll to input on focus
      scrollAssist: true,
    },

    // Splash screen
    SplashScreen: {
      // Fade out duration
      launchFadeDuration: 300,
      // Background color (matches app background)
      backgroundColor: '#0A0A0A',
      // Show spinner while loading
      launchShowDuration: 2000,
      // Auto hide after app ready
      launchAutoHide: true,
    },

    // Status bar
    StatusBar: {
      // Match dark theme
      style: 'DARK',
      backgroundColor: '#0A0A0A',
    },
  },
};

export default config;
