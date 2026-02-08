# Browser Compatibility Matrix

> Last Updated: 2026-01-25
>
> This document outlines browser support for SoundSteps features, with special attention to audio APIs critical for hearing rehabilitation.

## Platform Support Summary

| Platform | Min Version | Status | Notes |
|----------|-------------|--------|-------|
| Chrome Desktop | 90+ | ✅ Full | Primary development target |
| Safari Desktop | 14+ | ✅ Full | Requires user gesture for audio |
| Firefox Desktop | 88+ | ✅ Full | Full Web Audio support |
| Edge Desktop | 90+ | ✅ Full | Chromium-based |
| iOS Safari | 14+ | ✅ Full | MFi hearing device integration |
| iOS Chrome | 14+ | ⚠️ Partial | Uses WebKit, same as Safari |
| Android Chrome | 90+ | ✅ Full | ASHA hearing device support |
| Android Firefox | 88+ | ✅ Full | Good Web Audio support |

## Feature Compatibility

### Web Audio API

| Feature | Chrome | Safari | Firefox | iOS | Android |
|---------|--------|--------|---------|-----|---------|
| AudioContext | ✅ | ✅ | ✅ | ✅* | ✅ |
| AudioContext.resume() | Auto | Manual* | Auto | Manual* | Manual |
| GainNode | ✅ | ✅ | ✅ | ✅ | ✅ |
| AudioBufferSourceNode | ✅ | ✅ | ✅ | ✅ | ✅ |
| decodeAudioData() | ✅ | ✅ | ✅ | ✅ | ✅ |
| MP3 Decoding | ✅ | ✅ | ✅ | ✅ | ✅ |

**\* Critical:** iOS Safari requires user tap to unlock AudioContext. The `resumeAudio()` function in `useSNRMixer` handles this.

### PWA Features

| Feature | Chrome | Safari | Firefox | iOS | Android |
|---------|--------|--------|---------|-----|---------|
| Service Worker | ✅ | ✅ | ✅ | ✅ | ✅ |
| Install Prompt | ✅ | ❌* | ❌ | ❌* | ✅ |
| Offline Mode | ✅ | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ❌ | ✅ | ❌ | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ❌ | ✅ |

**\* iOS:** Users must manually "Add to Home Screen" from Safari share menu.

### Capacitor Native Features

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| Haptics | ✅ | ✅ | Taptic Engine / Vibration API |
| Filesystem | ✅ | ✅ | App-sandboxed storage |
| Status Bar | ✅ | ✅ | Dark mode styling |
| Splash Screen | ✅ | ✅ | Custom branding |

## Audio Unlocking Strategy

### The Problem

Mobile browsers suspend `AudioContext` until user interaction. This is a power-saving measure but breaks seamless audio playback.

### Our Solution: Silent Sentinel Pattern

```typescript
// From useSNRMixer.ts

// 1. Create AudioContext on mount (suspended state)
audioContextRef.current = new AudioContext();

// 2. Resume on first user interaction
const resumeAudio = async () => {
  if (audioContextRef.current.state === 'suspended') {
    await audioContextRef.current.resume();
  }
};

// 3. Keep Bluetooth alive with Silent Sentinel (0.0001 gain)
// Prevents MFi/ASHA connection beeps between exercises
noiseGainRef.current.gain.value = noiseEnabled ? calculatedGain : 0.0001;
```

### Integration Points

1. **First Button Tap:** Call `resumeAudio()` on "Start Session" or first play button
2. **Session Start:** Start Silent Sentinel noise loop
3. **During Exercise:** Play target audio on top of noise bed
4. **Session End:** Stop noise loop (fade out)

## Hearing Device Considerations

### iOS MFi Hearing Aids

- **Audio Session Category:** Use `.playback` for uninterrupted streaming
- **Bluetooth:** Audio routes automatically to connected MFi devices
- **Silent Sentinel:** Prevents reconnection audio artifacts
- **Background Audio:** Requires `UIBackgroundModes: ['audio']` in Info.plist

### Android ASHA Hearing Aids

- **Bluetooth Permissions:** `BLUETOOTH_CONNECT` for Android 12+
- **Audio Focus:** Request `AUDIOFOCUS_GAIN` for exercise playback
- **Stream Type:** Use `AudioManager.STREAM_MUSIC`
- **ASHA Protocol:** Automatic routing when device is connected

## Known Issues & Workarounds

### iOS Safari Audio Delay

**Issue:** First audio playback has ~300ms delay on iOS Safari.

**Workaround:** Preload and decode audio buffers before playback:

```typescript
// Preload during idle time
const buffer = await audioContext.decodeAudioData(arrayBuffer);
// Later, instant playback
sourceNode.buffer = buffer;
sourceNode.start(0);
```

### Firefox AudioContext State

**Issue:** Firefox may report `AudioContext.state` as `running` even when suspended.

**Workaround:** Always call `resume()` before first playback:

```typescript
// Safe for all browsers
await audioContext.resume();
sourceNode.start(0);
```

### Safari 15 Web Audio Regression

**Issue:** Safari 15.0-15.3 had Web Audio API issues with specific sample rates.

**Status:** Fixed in Safari 15.4+

**Workaround:** Ensure AudioContext uses default sample rate (don't specify explicitly).

## Testing Checklist

### Desktop Browsers

- [ ] Chrome: AudioContext auto-resumes
- [ ] Safari: AudioContext resumes on first tap
- [ ] Firefox: All Web Audio features work
- [ ] Edge: Matches Chrome behavior

### Mobile Devices

- [ ] iOS Safari: Requires tap to unlock audio
- [ ] iOS + MFi Hearing Aid: Audio routes correctly
- [ ] Android Chrome: AudioContext behavior
- [ ] Android + ASHA Hearing Aid: Audio routes correctly

### PWA Scenarios

- [ ] Install from Chrome (Android)
- [ ] Add to Home Screen (iOS)
- [ ] Offline mode (cached content)
- [ ] App update flow

## Browser Detection

Use `src/lib/browserDetect.ts` for runtime platform detection:

```typescript
import { getBrowserInfo, isIOS, isAndroid, requiresUserGesture } from '@/lib/browserDetect';

// Check if audio unlock is needed
if (requiresUserGesture()) {
  showTapToStartPrompt();
}
```

## Resources

- [Web Audio API Spec](https://webaudio.github.io/web-audio-api/)
- [Can I Use: Web Audio](https://caniuse.com/audio-api)
- [Apple MFi Hearing Devices](https://support.apple.com/en-us/HT201466)
- [Android ASHA Protocol](https://source.android.com/devices/bluetooth/asha)
