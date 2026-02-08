# Testing Rules - SoundSteps

## Minimum Test Coverage: 80%

Test Types (ALL required for new features):
1. **Unit Tests** - Hooks, utilities, pure functions
2. **Integration Tests** - Component interactions, Supabase calls
3. **E2E Tests** - Critical user flows (Playwright)

## Test-Driven Development

MANDATORY workflow for new features:
1. Write test first (RED)
2. Run test - it should FAIL
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+)

## Testing Stack

- **Framework:** Vitest (fast Vite-native)
- **React Testing:** @testing-library/react + @testing-library/user-event
- **Coverage:** Vitest with v8 provider
- **E2E:** Playwright

## Audio Testing Strategy

```typescript
// Mock AudioContext in unit tests
vi.mock('@/lib/audioUtils', () => ({
  createAudioContext: vi.fn(() => ({
    createGain: vi.fn(() => ({ connect: vi.fn(), gain: { value: 1 } })),
    createMediaElementSource: vi.fn(() => ({ connect: vi.fn() })),
  })),
}))

// Mock audio elements
const mockAudio = {
  play: vi.fn(() => Promise.resolve()),
  pause: vi.fn(),
  load: vi.fn(),
  src: '',
}
vi.spyOn(window, 'Audio').mockImplementation(() => mockAudio as any)
```

## Supabase Testing

```typescript
// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
      }))
    })),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: mockSession } }))
    }
  }
}))
```

## Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode during development
npm run test:coverage # Generate coverage report
```

## Test Quality Checklist

- [ ] All hooks have unit tests
- [ ] Critical user flows have E2E tests
- [ ] Audio mocking works correctly
- [ ] Supabase calls are mocked
- [ ] Edge cases covered (null, empty, error states)
- [ ] Tests are independent (no shared state)
