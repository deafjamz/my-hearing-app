# Smart Coach Edge Function - Deployment Guide

## Overview

The **Smart Coach** is an adaptive difficulty algorithm that adjusts SNR (Signal-to-Noise Ratio) based on user performance using a **staircase method**.

**Location:** `supabase/functions/evaluate-session/index.ts`

**Algorithm:**
- ≥80% accuracy → Decrease SNR by 5dB (harder)
- ≤50% accuracy → Increase SNR by 5dB (easier)
- 51-79% accuracy → Maintain current SNR

**SNR Bounds:** -10 dB (very hard) to +20 dB (very easy)

---

## Prerequisites

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### 2. Link to Your Supabase Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <YOUR_PROJECT_REF>

# Get your project ref from: https://supabase.com/dashboard/project/_/settings/general
```

---

## Deployment

### Option 1: Deploy via Supabase CLI (Recommended)

```bash
# Deploy the function
supabase functions deploy evaluate-session

# Set environment variables (if needed)
supabase secrets set MY_SECRET=value
```

### Option 2: Deploy via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/_/functions
2. Click "Create a new function"
3. Name: `evaluate-session`
4. Copy/paste contents of `supabase/functions/evaluate-session/index.ts`
5. Click "Deploy"

---

## Testing

### Local Testing (Requires Supabase CLI)

```bash
# Start local Supabase services
supabase start

# Serve function locally
supabase functions serve evaluate-session

# In another terminal, run test suite
deno run --allow-net supabase/functions/evaluate-session/test.ts
```

### Manual cURL Testing

**Test Case 1: High Performance (Should Decrease SNR)**
```bash
curl -i --location --request POST 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/evaluate-session' \
  --header 'Authorization: Bearer <YOUR_ANON_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "current_snr": 10,
    "results": [true, true, true, true, true, true, true, true, false, false]
  }'
```

**Expected Response:**
```json
{
  "next_snr": 5,
  "action": "decrease",
  "accuracy": 0.8,
  "recommendation": "Excellent performance! Increasing difficulty."
}
```

**Test Case 2: Poor Performance (Should Increase SNR)**
```bash
curl -i --location --request POST 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/evaluate-session' \
  --header 'Authorization: Bearer <YOUR_ANON_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "current_snr": 5,
    "results": [true, true, false, false, false, false, false, false, false, false]
  }'
```

**Expected Response:**
```json
{
  "next_snr": 10,
  "action": "increase",
  "accuracy": 0.2,
  "recommendation": "Let's make this a bit easier to build confidence."
}
```

**Test Case 3: Moderate Performance (Should Maintain)**
```bash
curl -i --location --request POST 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/evaluate-session' \
  --header 'Authorization: Bearer <YOUR_ANON_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "current_snr": 10,
    "results": [true, true, true, true, true, true, true, false, false, false]
  }'
```

**Expected Response:**
```json
{
  "next_snr": 10,
  "action": "maintain",
  "accuracy": 0.7,
  "recommendation": "Good challenge level. Keep practicing at this difficulty."
}
```

---

## Integration with Frontend

### React Hook Example

```typescript
// src/hooks/useSmartCoach.ts
import { supabase } from '@/lib/supabase';

export async function evaluateSession(currentSNR: number, results: boolean[]) {
  const { data, error } = await supabase.functions.invoke('evaluate-session', {
    body: {
      current_snr: currentSNR,
      results: results
    }
  });

  if (error) throw error;
  return data;
}

// Usage in component
const handleSessionComplete = async () => {
  const results = [true, true, false, true, true, true, true, false, true, true];
  const currentSNR = 10;

  const { next_snr, action, recommendation } = await evaluateSession(currentSNR, results);

  console.log(`Next SNR: ${next_snr} dB`);
  console.log(`Action: ${action}`);
  console.log(`Recommendation: ${recommendation}`);
};
```

---

## Algorithm Details

### Staircase Method (Clinical Standard)

The staircase method is widely used in psychoacoustics and audiology for adaptive threshold estimation:

1. **Start at comfortable level** (e.g., +10 dB SNR)
2. **Monitor performance** over N trials (typically 10)
3. **Adjust difficulty** based on accuracy:
   - High accuracy (≥80%): Decrease SNR (make harder)
   - Low accuracy (≤50%): Increase SNR (make easier)
   - Moderate accuracy: Maintain current level
4. **Repeat** until convergence to user's threshold

**Benefits:**
- Efficient testing (fewer trials needed)
- Personalized difficulty
- Maintains engagement ("flow state")
- Clinically validated approach

**Parameters:**
- **Step size:** 5 dB (balance between precision and speed)
- **Window size:** Last 10 trials (responsive but stable)
- **Bounds:** -10 to +20 dB (clinical safety range)

---

## Monitoring & Analytics

### Recommended Database Schema

```sql
-- Track user performance over time
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  exercise_type TEXT NOT NULL,
  session_date TIMESTAMPTZ DEFAULT NOW(),
  starting_snr INTEGER NOT NULL,
  ending_snr INTEGER NOT NULL,
  total_trials INTEGER NOT NULL,
  correct_trials INTEGER NOT NULL,
  accuracy DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track individual trials
CREATE TABLE trial_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES user_sessions(id),
  trial_number INTEGER NOT NULL,
  snr INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Analytics Queries

```sql
-- User's SNR improvement over time
SELECT
  session_date,
  ending_snr,
  accuracy
FROM user_sessions
WHERE user_id = '<USER_ID>'
ORDER BY session_date DESC
LIMIT 10;

-- Average accuracy by SNR level
SELECT
  snr,
  AVG(CASE WHEN correct THEN 1.0 ELSE 0.0 END) as avg_accuracy,
  COUNT(*) as trial_count
FROM trial_results
GROUP BY snr
ORDER BY snr DESC;
```

---

## Troubleshooting

### Error: "Function not found"
- Ensure function is deployed: `supabase functions list`
- Check project is linked: `supabase projects list`

### Error: "Invalid token"
- Use `SUPABASE_ANON_KEY` for client calls
- Use `SUPABASE_SERVICE_ROLE_KEY` for admin operations

### Error: "CORS policy"
- CORS headers are included in function
- If issues persist, check Supabase dashboard → Settings → API

---

## Next Steps

1. **Deploy Edge Function** to production
2. **Test** with curl commands above
3. **Integrate** into RapidFire exercise
4. **Track** user performance in database
5. **Validate** with pilot users

---

**Status:** Ready for deployment
**Version:** 1.0.0
**Last Updated:** 2025-11-29
