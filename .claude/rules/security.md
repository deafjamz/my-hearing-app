# Security Rules - SoundSteps

## Mandatory Security Checks

Before ANY commit:
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] Supabase RLS policies verified
- [ ] No sensitive data in console.log
- [ ] Error messages don't leak internal details

## Secret Management

```typescript
// NEVER: Hardcoded secrets
const apiKey = "sk-xxxxx"

// ALWAYS: Environment variables with VITE_ prefix
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL not configured')
}
```

## Supabase Security

```typescript
// ALWAYS: Use typed Supabase client
import { supabase } from '@/lib/supabase'

// ALWAYS: Let RLS handle authorization
const { data } = await supabase
  .from('user_progress')
  .select('*')  // RLS filters by auth.uid()

// NEVER: Trust client-provided user IDs for sensitive operations
```

## Audio Asset Security

```typescript
// ALWAYS: Use CDN URLs for audio (public assets)
const audioUrl = `${CDN_BASE}/audio/${voiceId}/${filename}.mp3`

// NEVER: Allow user-provided URLs for audio sources
// NEVER: Store user audio recordings (privacy)
```

## Environment Files

- `.env` - Production secrets (NEVER commit)
- `.env.local` - Local development overrides
- `.env.example` - Template with placeholder values (safe to commit)

## Security Response Protocol

If security issue found:
1. STOP immediately
2. Fix CRITICAL issues before continuing
3. Rotate any exposed secrets in Supabase dashboard
4. Review similar patterns across codebase
