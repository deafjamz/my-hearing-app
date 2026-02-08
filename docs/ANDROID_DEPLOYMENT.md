# Android Deployment Guide

## Prerequisites

### Required Software
- **Android Studio Hedgehog (2023.1.1) or newer**
- **JDK 17** (bundled with Android Studio)
- **Android SDK** with Build-Tools 34+
- **Google Play Developer Account** - $25 one-time fee

### First-Time Setup

```bash
# Verify Android Studio installation
# Open Android Studio → SDK Manager → Install:
# - Android 14.0 (API 34)
# - Android SDK Build-Tools 34
# - Android SDK Command-line Tools

# Set ANDROID_HOME (add to ~/.zshrc or ~/.bashrc)
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

---

## Project Setup

### 1. Build and Sync

```bash
# Build the web app
npm run build

# Sync to Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

### 2. Configure Signing

For release builds, create a keystore:

```bash
keytool -genkey -v -keystore soundsteps-release.keystore \
  -alias soundsteps \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Store keystore credentials securely (do NOT commit to git).

### 3. Configure Gradle

Create `android/keystore.properties` (add to .gitignore):

```properties
storeFile=../soundsteps-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=soundsteps
keyPassword=YOUR_KEY_PASSWORD
```

---

## ASHA Hearing Device Support

SoundSteps supports Audio Streaming for Hearing Aids (ASHA) on Android.

### Requirements

- Android 10+ (API 29+)
- ASHA-compatible hearing devices
- Bluetooth enabled

### Configuration

Already configured in `capacitor.config.ts`:
```typescript
android: {
  allowMixedContent: true,
  minSdkVersion: 24
}
```

### Required Permissions

Add to `android/app/src/main/AndroidManifest.xml` if not present:

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

### Audio Focus Handling

The app properly handles Android audio focus for:
- Pausing when calls come in
- Resuming after interruptions
- Respecting hearing device routing

---

## Build Configurations

### Debug Build

```bash
# Run on emulator
npx cap run android

# Run on connected device
npx cap run android --target=<device-id>

# List available devices
npx cap run android --list
```

### Release Build

```bash
# Generate release APK
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk
```

### AAB for Play Store

```bash
# Generate Android App Bundle
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

---

## Play Store Deployment

### 1. Create App in Play Console

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create app
3. Fill app details:
   - App name: **SoundSteps**
   - Default language: English (US)
   - App or game: App
   - Free or paid: Free (with in-app purchases)

### 2. Store Listing

#### Required Assets

| Asset | Dimensions | Format |
|-------|------------|--------|
| Hi-res icon | 512x512 | PNG (32-bit) |
| Feature graphic | 1024x500 | PNG/JPEG |
| Phone screenshots | 16:9 or 9:16 | PNG/JPEG |
| 7" tablet screenshots | Optional | PNG/JPEG |
| 10" tablet screenshots | Optional | PNG/JPEG |

#### App Details

- **Title**: SoundSteps - Hearing Training
- **Short description** (80 chars): Train your hearing with speech exercises designed for CI users
- **Full description** (4000 chars): Comprehensive rehabilitation exercises...
- **Category**: Health & Fitness
- **Tags**: hearing, rehabilitation, cochlear implant, speech therapy

### 3. Release Tracks

| Track | Purpose | Testers |
|-------|---------|---------|
| Internal | Quick testing | Up to 100 |
| Closed | Beta testing | Invite-only |
| Open | Public beta | Anyone |
| Production | Live app | Everyone |

#### Recommended Rollout

1. **Internal testing** - Core team validation
2. **Closed testing** - CI users and audiologists
3. **Open testing** - Wider beta
4. **Production** - Staged rollout (5% → 20% → 50% → 100%)

---

## Privacy & Permissions

### Required Permissions

| Permission | Reason |
|------------|--------|
| INTERNET | Fetching audio files, cloud sync |
| BLUETOOTH | ASHA hearing device support |
| BLUETOOTH_CONNECT | Connecting to hearing devices |

### Data Safety Declaration

For Play Console:
- **No data shared with third parties**
- **Data collected**:
  - Email (if signed in)
  - App activity (exercise progress)
- **Data encrypted in transit**: Yes
- **Data can be deleted**: Yes (account deletion)

---

## Troubleshooting

### Gradle Sync Fails

```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew build
```

### SDK Version Errors

Open Android Studio → File → Project Structure → Modules → App:
- Compile SDK: 34
- Min SDK: 24
- Target SDK: 34

### APK Install Fails

```bash
# Enable installation from unknown sources on device
# Or use ADB:
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### ProGuard/R8 Issues

If release builds crash, check ProGuard rules in:
`android/app/proguard-rules.pro`

Add keep rules for Capacitor plugins if needed:
```proguard
-keep class com.getcapacitor.** { *; }
```

---

## Testing Matrix

### Recommended Test Devices

| Device | Screen | Android | Priority |
|--------|--------|---------|----------|
| Pixel 6a | Small | 13+ | High |
| Pixel 8 Pro | Large | 14 | High |
| Samsung Galaxy S23 | AMOLED | 13+ | High |
| Samsung Galaxy A54 | Mid-range | 13 | Medium |
| Older device | Any | 10 | Low |

### ASHA Testing

1. Pair ASHA hearing aids via Settings → Accessibility → Hearing devices
2. Play audio in SoundSteps
3. Verify audio routes to hearing aids
4. Test SNR adjustments
5. Verify audio continues when screen off

---

## Release Checklist

- [ ] Version code incremented in `android/app/build.gradle`
- [ ] Version name matches `package.json`
- [ ] Signed with release keystore
- [ ] ProGuard/R8 not stripping needed code
- [ ] All tests passing
- [ ] Tested on:
  - [ ] Small screen (Pixel 6a or similar)
  - [ ] Large screen (tablet or large phone)
  - [ ] Android 10 (minimum)
  - [ ] Android 14 (latest)
  - [ ] With ASHA hearing devices

---

## Contacts

- **Google Play Support**: [support.google.com/googleplay/android-developer](https://support.google.com/googleplay/android-developer)
- **Android Developer Docs**: [developer.android.com](https://developer.android.com)
