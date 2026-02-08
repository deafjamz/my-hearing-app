# Audio Development Workflow - SoundSteps

This skill ensures safe, high-quality audio feature development for hearing rehabilitation.

## When to Activate

- Adding audio playback features
- Modifying SNR mixing logic
- Working with audio preloading/caching
- Testing audio on iOS Safari
- Implementing voice selection

## Audio Development Checklist

### Before Writing Code

1. **Check Audio Inventory**
   ```bash
   cat docs/AUDIO_INVENTORY.md | head -50
   ```

2. **Verify Voice Roster**
   - Primary: sarah, marcus, david
   - Extended: alice, bill, charlie, matilda, daniel, aravind

3. **Check Supabase Schema**
   ```sql
   -- Verify audio_assets structure
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'audio_assets';
   ```

### Implementation Patterns

#### AudioContext Management

```typescript
// ALWAYS: Handle iOS Safari AudioContext unlock
const unlockAudioContext = async (ctx: AudioContext) => {
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

// Attach to user gesture
document.addEventListener('touchstart', () => unlockAudioContext(audioContext), { once: true })
document.addEventListener('click', () => unlockAudioContext(audioContext), { once: true })
```

#### SNR Mixing

```typescript
// Signal-to-Noise Ratio mixing
const mixWithNoise = (speechGain: GainNode, noiseGain: GainNode, snrDb: number) => {
  // Speech at reference level (1.0)
  speechGain.gain.value = 1.0

  // Noise attenuated by SNR
  // 0 dB = same level, +10 dB = noise 10dB quieter
  noiseGain.gain.value = Math.pow(10, -snrDb / 20)
}

// "Silent Sentinel" - keeps audio route alive on Bluetooth
const SILENT_SENTINEL_GAIN = 0.0001
```

#### Audio Preloading

```typescript
// Preload next audio while current plays
const preloadQueue = new Map<string, HTMLAudioElement>()

const preloadAudio = (url: string) => {
  if (preloadQueue.has(url)) return preloadQueue.get(url)!

  const audio = new Audio()
  audio.preload = 'auto'
  audio.src = url
  preloadQueue.set(url, audio)

  // LRU eviction at 50 files
  if (preloadQueue.size > 50) {
    const oldest = preloadQueue.keys().next().value
    preloadQueue.delete(oldest)
  }

  return audio
}
```

#### Memory Cleanup

```typescript
// ALWAYS: Clean up audio in useEffect
useEffect(() => {
  const audio = new Audio(src)

  const handleCanPlay = () => setLoading(false)
  audio.addEventListener('canplaythrough', handleCanPlay)

  return () => {
    audio.removeEventListener('canplaythrough', handleCanPlay)
    audio.pause()
    audio.src = ''  // Release memory
  }
}, [src])
```

### Testing Audio Features

#### Unit Test Mocks

```typescript
// Mock AudioContext
const mockAudioContext = {
  state: 'running',
  resume: vi.fn(() => Promise.resolve()),
  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn(),
  })),
  createMediaElementSource: vi.fn(() => ({
    connect: vi.fn(),
  })),
}

vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext))
vi.stubGlobal('webkitAudioContext', vi.fn(() => mockAudioContext))

// Mock Audio element
const mockAudio = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  load: vi.fn(),
  src: '',
  preload: '',
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

vi.spyOn(window, 'Audio').mockImplementation(() => mockAudio as any)
```

#### Manual Testing

- [ ] Test on iOS Safari (requires user gesture)
- [ ] Test on Android Chrome
- [ ] Test with Bluetooth headphones (audio route switching)
- [ ] Test with hearing aids (MFi/ASHA)
- [ ] Verify preloading works (network tab)
- [ ] Check memory usage during long sessions

### Audio Quality Standards

- Format: MP3 128kbps
- Normalization: -20 LUFS target
- Peak: < -1dB (no clipping)
- Sample Rate: 44.1kHz

### Common Pitfalls

1. **iOS Safari AudioContext** - Must resume on user gesture
2. **Bluetooth audio routing** - Silent audio keeps route alive
3. **Memory leaks** - Always clean up Audio elements
4. **Race conditions** - Use refs to track current audio
5. **Cache invalidation** - Clear cache on voice change

## Verification

After audio changes, verify:
```bash
npm run build && npm test
```

Test on real device with audio output.
