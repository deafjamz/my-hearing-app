# React Patterns - SoundSteps

Frontend development patterns specific to SoundSteps hearing rehabilitation app.

## Component Architecture

### Page Components (src/pages/)

```typescript
// Page components handle routing and layout
export default function StoryList() {
  const { data, loading, error } = useStoryData()

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <Layout>
      <ActivityHeader title="Stories" />
      <StoryGrid stories={data} />
    </Layout>
  )
}
```

### UI Components (src/components/ui/)

```typescript
// UI components are reusable, stateless when possible
interface QuizCardProps {
  question: string
  options: string[]
  onAnswer: (selected: string) => void
  disabled?: boolean
}

export function QuizCard({ question, options, onAnswer, disabled }: QuizCardProps) {
  return (
    <Card>
      <CardHeader>{question}</CardHeader>
      <CardContent>
        {options.map(opt => (
          <Button key={opt} onClick={() => onAnswer(opt)} disabled={disabled}>
            {opt}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
```

### Primitive Components (src/components/primitives/)

```typescript
// Primitives have no business logic, only styling variants
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}
```

## Custom Hooks Patterns

### Data Fetching Hook

```typescript
// src/hooks/useStoryData.ts
export function useStoryData() {
  const [data, setData] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .order('difficulty_level')

        if (error) throw error
        setData(data)
      } catch (e) {
        setError(e as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchStories()
  }, [])

  return { data, loading, error }
}
```

### Audio Player Hook

```typescript
// src/hooks/useAudioPlayer.ts
export function useAudioPlayer(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const audio = new Audio(src)
    audioRef.current = audio

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime / audio.duration)
    }

    const handleEnded = () => {
      setPlaying(false)
      setProgress(0)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
      audio.src = ''  // CRITICAL: Release memory
    }
  }, [src])

  const play = async () => {
    if (audioRef.current) {
      await audioRef.current.play()
      setPlaying(true)
    }
  }

  const pause = () => {
    audioRef.current?.pause()
    setPlaying(false)
  }

  return { playing, progress, play, pause }
}
```

### Progress Tracking Hook

```typescript
// src/hooks/useProgress.ts
export function useProgress() {
  const { user } = useUser()

  const logProgress = async (activityType: string, score: number, metadata?: object) => {
    if (!user) {
      // Guest mode: store in localStorage
      const guestProgress = JSON.parse(localStorage.getItem('guestProgress') || '[]')
      guestProgress.push({ activityType, score, metadata, timestamp: new Date().toISOString() })
      localStorage.setItem('guestProgress', JSON.stringify(guestProgress))
      return
    }

    // Authenticated: store in Supabase
    await supabase.from('user_progress').insert({
      user_id: user.id,
      activity_type: activityType,
      score,
      metadata
    })
  }

  return { logProgress }
}
```

## Context Patterns

### User Context

```typescript
// Already implemented in src/store/UserContext.tsx
// Key patterns:
// - Handles auth state
// - Manages subscription tier
// - Provides hasAccess() for tier checking
// - Syncs with localStorage for guest mode
```

### Voice Context

```typescript
// src/store/VoiceContext.tsx
// Manages selected voice across the app
// Voice IDs: sarah, marcus, david, alice, bill, charlie, matilda, daniel, aravind
```

### Theme Context

```typescript
// src/store/ThemeContext.tsx
// Manages dark/light mode
// Persists to localStorage
```

## Performance Patterns

### Memoization

```typescript
// Memoize expensive computations
const sortedStories = useMemo(() => {
  return stories.sort((a, b) => a.difficulty_level - b.difficulty_level)
}, [stories])

// Memoize callbacks passed to children
const handleAnswer = useCallback((answer: string) => {
  setSelected(answer)
  onSubmit(answer)
}, [onSubmit])
```

### Code Splitting

```typescript
// Lazy load heavy components
const ScenarioPlayer = lazy(() => import('./ScenarioPlayer'))
const AudioVisualizer = lazy(() => import('./AudioVisualizer'))

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <ScenarioPlayer scenario={scenario} />
</Suspense>
```

## Error Handling

### Error Boundary (Already implemented)

```typescript
// src/components/ErrorBoundary.tsx
// Wraps entire app in src/App.tsx
// Catches JavaScript errors and shows fallback UI
```

### Async Error Handling

```typescript
// In hooks and components
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  // Show user-friendly message
  setError('Something went wrong. Please try again.')
}
```

## Accessibility Patterns

### Focus Management

```typescript
// Auto-focus first interactive element
const inputRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  inputRef.current?.focus()
}, [])

// Trap focus in modals
// Restore focus when closing
```

### ARIA Labels

```typescript
<button
  aria-label="Play audio"
  aria-pressed={isPlaying}
  onClick={togglePlay}
>
  {isPlaying ? <PauseIcon /> : <PlayIcon />}
</button>
```

### Keyboard Navigation

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  switch (e.key) {
    case 'Enter':
    case ' ':
      handleSelect()
      break
    case 'ArrowDown':
      focusNext()
      break
    case 'ArrowUp':
      focusPrevious()
      break
  }
}
```

## Testing Patterns

See `.claude/rules/testing.md` for comprehensive testing guidance.

Key patterns:
- Mock Supabase client
- Mock AudioContext
- Test user interactions with RTL
- Verify accessibility with axe-core
