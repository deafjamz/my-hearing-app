# Audio Handling Rules - SoundSteps

## Audio Standards

- **Format:** MP3 128kbps (CDN-hosted)
- **Normalization:** -20 LUFS target
- **Peak:** < -1dB (no clipping)
- **Sample Rate:** 44.1kHz

## iOS Safari Compatibility (CRITICAL)

iOS Safari requires user gesture to unlock AudioContext:

```typescript
// ALWAYS: Resume AudioContext on user interaction
const handleUserInteraction = async () => {
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
}

// Attach to first user tap/click
document.addEventListener('click', handleUserInteraction, { once: true })
```

## Audio Preloading

```typescript
// ALWAYS: Preload next audio while current plays
const preloadNext = (nextUrl: string) => {
  const audio = new Audio()
  audio.preload = 'auto'
  audio.src = nextUrl
}

// Cache limit: 50 files with LRU eviction
```

## SNR Mixing

```typescript
// Signal-to-Noise Ratio mixing for speech-in-noise training
const mixAudio = (speech: AudioNode, noise: AudioNode, snrDb: number) => {
  const noiseGain = Math.pow(10, -snrDb / 20)
  noiseGainNode.gain.value = noiseGain
}

// "Silent Sentinel" for Bluetooth: 0.0001 gain when disabled
// Prevents audio route switching on some devices
```

## Audio Loading States

```typescript
// ALWAYS: Show loading state while audio loads
const [isLoading, setIsLoading] = useState(true)

audio.oncanplaythrough = () => setIsLoading(false)
audio.onerror = () => {
  setIsLoading(false)
  setError('Audio unavailable')
}
```

## Memory Management

```typescript
// ALWAYS: Clean up audio resources
useEffect(() => {
  const audio = new Audio(src)

  return () => {
    audio.pause()
    audio.src = ''  // Release memory
  }
}, [src])
```

## Voice Selection (CRITICAL - Read Before Modifying)

### 9-Voice Roster

| Voice | Region | Gender |
|-------|--------|--------|
| sarah | US | Female |
| emma | US | Female |
| bill | US | Male |
| michael | US | Male |
| alice | UK | Female |
| daniel | UK | Male |
| matilda | AU | Female |
| charlie | AU | Male |
| aravind | IN | Male |

### Audio URL Pattern (Dynamic Construction)

**DO NOT use database columns for voice audio paths.**

Audio URLs are constructed dynamically in `src/hooks/useActivityData.ts`:

```typescript
// Pattern: {SUPABASE_URL}/storage/v1/object/public/audio/words_v2/{voice}/{word}.mp3
function buildAudioUrl(voice: string, word: string): string {
  const normalized = word.toLowerCase().replace(/\s+/g, '_');
  return `${SUPABASE_URL}/storage/v1/object/public/audio/words_v2/${voice}/${normalized}.mp3`;
}
```

### Adding a New Voice

1. Generate audio to `audio/words_v2/{voice}/` in Supabase Storage
2. Add voice ID to `AVAILABLE_VOICES` in `src/hooks/useActivityData.ts`
3. Add voice details to `VOICES` in `src/store/VoiceContext.tsx`
4. Update `docs/VOICE_LIBRARY.md`

**NO database migrations needed.**

### Legacy Warning

The `word_pairs` table has legacy columns (`audio_1_path_sarah`, etc.) for 4 voices.
These are **NOT USED** by the current code. Ignore them.

## Audio Inventory

See: `docs/VOICE_LIBRARY.md` for complete voice specifications and audio architecture.
