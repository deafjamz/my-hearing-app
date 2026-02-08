# Coding Style - SoundSteps

## Immutability (CRITICAL)

ALWAYS create new objects, NEVER mutate:

```typescript
// WRONG: Mutation
function updateProgress(progress, score) {
  progress.score = score  // MUTATION!
  return progress
}

// CORRECT: Immutability
function updateProgress(progress, score) {
  return { ...progress, score }
}
```

## File Organization

- 200-400 lines typical, 800 max per file
- Organize by feature/domain in `src/`:
  - `components/` - Reusable UI (primitives/, ui/, auth/, feedback/)
  - `hooks/` - Custom React hooks
  - `pages/` - Route components
  - `lib/` - Utilities and services
  - `store/` - Context providers
  - `types/` - TypeScript definitions
  - `data/` - Static data (word pairs, scenarios)

## React Patterns

```typescript
// ALWAYS: Functional components with hooks
export function ExerciseCard({ exercise }: Props) {
  const [score, setScore] = useState(0)
  return <Card>...</Card>
}

// ALWAYS: Extract logic to custom hooks
export function useAudioPlayer(src: string) {
  // Audio state and controls
}

// ALWAYS: Use TypeScript interfaces for props
interface ExerciseCardProps {
  exercise: Exercise
  onComplete: (score: number) => void
}
```

## Error Handling

```typescript
try {
  const audio = await loadAudio(url)
  return audio
} catch (error) {
  console.error('Audio load failed:', error)
  // Show user-friendly feedback, not technical details
  throw new Error('Unable to load audio. Please try again.')
}
```

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<800 lines)
- [ ] Proper TypeScript types (no `any` unless justified)
- [ ] No console.log in production paths
- [ ] No hardcoded values (use constants/config)
- [ ] Immutable patterns used
