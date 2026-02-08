# iOS Deployment Guide

## Prerequisites

### Required Software
- **macOS** - iOS development requires a Mac
- **Xcode 15+** - Download from Mac App Store
- **CocoaPods** - `sudo gem install cocoapods`
- **Apple Developer Account** - $99/year for App Store distribution

### First-Time Setup

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Set active developer directory to Xcode (not CLI tools)
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version
xcodebuild -version
```

---

## Project Setup

### 1. Build and Sync

```bash
# Build the web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### 2. Configure Signing

1. Open `ios/App/App.xcworkspace` in Xcode
2. Select the **App** target
3. Go to **Signing & Capabilities**
4. Select your Team (Apple Developer Account)
5. Set Bundle Identifier: `com.soundsteps.app`

### 3. Configure Capabilities

Add these capabilities in Xcode:
- **Background Modes** → Audio, AirPlay, Picture in Picture
- **App Groups** (for shared data between app and extensions)

---

## MFi Hearing Device Support

SoundSteps supports Made for iPhone (MFi) hearing devices.

### Required Configuration

1. **Audio Session Category**
   Already configured in `capacitor.config.ts`:
   ```typescript
   ios: {
     allowsInlineMediaPlayback: true,
     mediaTypesRequiringUserAction: 'none'
   }
   ```

2. **Info.plist Additions**
   Add to `ios/App/App/Info.plist`:
   ```xml
   <key>UIBackgroundModes</key>
   <array>
       <string>audio</string>
   </array>
   ```

3. **Test with MFi Devices**
   - Connect MFi hearing aids via Settings → Accessibility → Hearing Devices
   - Verify audio routing
   - Test with different SNR levels

---

## Build Configurations

### Development Build

```bash
# Run on simulator
npx cap run ios

# Run on connected device
npx cap run ios --target=<device-id>

# List available devices
npx cap run ios --list
```

### TestFlight Distribution

1. In Xcode, select **Product → Archive**
2. Once archived, click **Distribute App**
3. Select **App Store Connect**
4. Choose **TestFlight Only** or **App Store** distribution
5. Follow the upload wizard

### App Store Submission

#### Required Assets

| Asset | Dimensions | Format |
|-------|------------|--------|
| App Icon | 1024x1024 | PNG (no alpha) |
| iPhone Screenshots | 1290x2796 | PNG/JPEG |
| iPad Screenshots | 2048x2732 | PNG/JPEG |

#### Required Information

- App Name: **SoundSteps**
- Bundle ID: `com.soundsteps.app`
- Version: See `package.json`
- Category: Health & Fitness
- Age Rating: 4+ (no objectionable content)
- Privacy Policy URL: Required

---

## Privacy & Permissions

### Required Privacy Declarations

SoundSteps requests minimal permissions:

| Permission | Usage |
|------------|-------|
| None required | Audio playback works without special permissions |

### App Privacy Details

For App Store Connect, declare:

- **Data Not Collected** - SoundSteps can function in guest mode
- **Data Linked to You** (if signed in):
  - Email address
  - Usage data (exercise progress)

---

## Troubleshooting

### "xcode-select" Errors

```bash
# Point to Xcode, not Command Line Tools
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

### CocoaPods Issues

```bash
# Clean and reinstall pods
cd ios/App
rm -rf Pods Podfile.lock
pod install --repo-update
```

### Signing Certificate Issues

1. Open Keychain Access
2. Delete expired/revoked certificates
3. In Xcode, Preferences → Accounts → Download Manual Profiles

### Simulator Audio Issues

iOS Simulator may not accurately represent hearing device audio routing. Always test on physical devices with actual MFi hearing aids.

---

## Release Checklist

- [ ] Version number updated in `package.json` and Xcode
- [ ] All tests passing
- [ ] TestFlight build uploaded and tested
- [ ] Screenshots updated for current UI
- [ ] Privacy policy current
- [ ] App Store description finalized
- [ ] Tested on:
  - [ ] iPhone SE (smallest screen)
  - [ ] iPhone 15 Pro Max (largest screen)
  - [ ] iPad (if universal)
  - [ ] With MFi hearing devices

---

## Contacts

- **Apple Developer Support**: [developer.apple.com/support](https://developer.apple.com/support)
- **TestFlight Documentation**: [developer.apple.com/testflight](https://developer.apple.com/testflight)
