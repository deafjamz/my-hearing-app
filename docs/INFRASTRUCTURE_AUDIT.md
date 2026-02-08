# Infrastructure Audit Report

> **Audit Date:** 2026-01-24 (last updated 2026-02-08)
> **Auditor:** CTO/Security Engineer Review
> **Status:** CRITICAL ISSUES RESOLVED, MONITORING RECOMMENDED

---

## Executive Summary

| Category | Status | Details |
|----------|--------|---------|
| Build System | ✅ FIXED | Reduced from 11+ min to ~6 sec |
| PWA Support | ✅ ADDED | Manifest, service worker, icons |
| Security | ✅ FIXED | react-router XSS vulnerability patched |
| Storage | ⚠️ MONITOR | Supabase free tier bandwidth limits |
| Deployment | ✅ READY | Can deploy to Vercel |

---

## 1. Build System

### Problem Identified
```
162MB of audio files in public/hearing-rehab-audio
Vite build timeout: ETIMEDOUT after 11m 46s
```

### Root Cause
Legacy audio files duplicated locally when already stored in Supabase Storage.

### Resolution
```bash
# Removed unused directories:
rm -rf public/hearing-rehab-audio  # 162MB, 2,784 files
rm -rf public/audio_quality_test   # Dev-only test files
rm -rf public/noise_files          # Legacy noise (now in Supabase)
rm src/data/minimalPairs.ts        # Dead code, never imported
```

### Result
- Build time: **11+ minutes → 5-6 seconds**
- Bundle size: 1.34 MB (gzipped: 378 KB)

### Remaining Concern
Bundle size was 1.3MB. Code splitting implemented in Session 12:
- React.lazy() for all page components
- Vendor chunk splitting (797KB → 272KB main + chunks)
- Current main bundle: ~248KB

---

## 2. PWA Configuration

### Added Files
| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest with icons, theme |
| `public/sw.js` | Service worker for caching |
| `public/icon-512.png` | App icon (1024x1024) |
| `public/icon-192.png` | Small app icon |

### Features Enabled
- ✅ Installable on mobile home screen
- ✅ Standalone display mode (no browser chrome)
- ✅ Offline fallback to cached index.html
- ✅ Static asset caching (JS, CSS, images)
- ✅ Apple mobile web app meta tags

### Caching Strategy
```
Static assets (JS/CSS/images): Cache-first
Navigation: Network-first with offline fallback
Audio files: Network-only (no cache - too large)
```

### Future Improvements Needed
- [ ] Generate proper 192x192 icon (current is 72x72)
- [ ] Add splash screens for iOS
- [ ] Implement audio preloading strategy
- [ ] Add background sync for offline progress

---

## 3. Security Audit

### Vulnerabilities Fixed

#### HIGH: react-router XSS (CVE-2024-XXXX)
```
Affected: react-router 7.0.0 - 7.11.0
Fixed: Updated to 7.13.0
```

#### MEDIUM: @capacitor/cli tar vulnerability
```
Status: Build-time only, not runtime
Risk: Low (only affects local development)
```

### Secrets Management

| Check | Status | Details |
|-------|--------|---------|
| Service role key exposed | ✅ PASS | Not found in source |
| Hardcoded API keys | ✅ PASS | No secrets in code |
| .env in .gitignore | ✅ PASS | All env files excluded |
| Supabase anon key | ✅ EXPECTED | Required for client, RLS protects data |

### Row Level Security (RLS)

| Table | RLS | Policy |
|-------|-----|--------|
| `stimuli_catalog` | ✅ Enabled | Public read |
| `audio_assets` | ✅ Enabled | Public read |
| `noise_assets` | ✅ Enabled | Public read |
| `user_progress` | ✅ Enabled | User-specific (auth.uid() = user_id) |
| `profiles` | ✅ Enabled | User-specific |
| `word_pairs` | ⚠️ Check | Verify RLS enabled |
| `stories` | ⚠️ Check | Verify RLS enabled |

### XSS Prevention
- ✅ No `dangerouslySetInnerHTML` usage
- ✅ React auto-escapes JSX content
- ✅ No raw SQL queries (Supabase parameterizes)

### Edge Function Security
```typescript
// evaluate-session function
CORS: '*' (open - acceptable for public API)
Auth: None required (stateless calculation)
DB Access: None (pure computation)
Risk: LOW
```

---

## 4. Storage Architecture

### Current State
```
Supabase Storage (source of truth):
├── audio/words_v2/     # 20,301 files
├── audio/sentences_v1/ # 5,659 files
├── audio/stories/      # 440 files
├── audio/conversations/# 1,400 files
├── audio/drills/       # ~3,600 files
├── audio/noise/        # 8 files
└── audio/environmental/# 50 files

Total: ~31,000+ files, ~500MB-1GB
```

### Bandwidth Concerns

| Tier | Limit | Risk |
|------|-------|------|
| Free | 2GB/month | HIGH - Easily exceeded |
| Pro ($25/mo) | 250GB/month | SAFE for moderate use |

#### Usage Projection
```
50 users × 20 exercises × 10 files × 100KB = 1GB/day
Free tier exhausted in ~2 days at scale
```

### Recommendations
1. **Short-term:** Monitor bandwidth usage in Supabase dashboard
2. **Medium-term:** Upgrade to Pro when approaching 2GB
3. **Long-term:** Consider CloudFlare R2 for audio ($0 egress)

---

## 5. Application Routes

### Production Routes (Always Available)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | ActivityList | Practice Hub (default landing) |
| `/practice` | ActivityList | Practice Hub (alias) |
| `/dashboard` | Dashboard | Stats & progress (opt-in) |
| `/practice/detection` | Detection | Erber Level 1 |
| `/practice/gross-discrimination` | GrossDiscrimination | Erber Level 2 |
| `/categories` | CategoryLibrary | Word pair categories |
| `/sentences` | SentenceTraining | Sentence exercises |
| `/scenarios` | ScenarioPlayer | Multi-speaker dialogue |
| `/programs` | ProgramLibrary | Curated programs |
| `/progress` | ProgressReport | Charts and print-to-PDF |
| `/settings` | Settings | User preferences |

### Dev-Only Routes (Hidden in Production)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/qc` | QualityControl | Audio QC tools |
| `/qa` | AudioQA | Audio comparison |
| `/db-test` | DatabaseTest | Database diagnostics |
| `/snr-test` | SNRMixerTest | Audio mixer testing |

---

## 6. Dependencies

### Critical Dependencies
| Package | Version | Notes |
|---------|---------|-------|
| react | 19.2.0 | Latest major - test thoroughly |
| react-router-dom | 7.13.0 | UPDATED - XSS fix |
| @supabase/supabase-js | 2.86.0 | Current stable |
| framer-motion | 12.23.24 | Animation library |
| @capacitor/core | 7.4.4 | Native bridge |

### React 19 Considerations
- New concurrent rendering behaviors
- Some libraries may have compatibility issues
- Consider testing on actual devices before launch

---

## 7. Deployment Checklist

### Pre-Deploy
- [x] Build succeeds without errors
- [x] No HIGH severity vulnerabilities
- [x] PWA manifest configured
- [x] Service worker registered
- [x] Environment variables documented

### Deploy to Vercel
```bash
# Auto-deploy: push to main branch (recommended)
git push origin main

# Manual deploy (if needed):
npx vercel --prod
```

### DNS & Domain
- **Domain:** soundsteps.app
- **DNS provider:** Cloudflare (migrated from Namecheap, 2026-02-08)
- **Email routing:** support@soundsteps.app → soundstepsapp@gmail.com (Cloudflare Email Routing)
- **SSL:** Auto-provisioned via Let's Encrypt (Vercel)

### Post-Deploy
- [ ] Verify PWA install on mobile
- [ ] Test audio playback
- [ ] Check Supabase connection
- [ ] Monitor error rates

---

## 8. Monitoring Setup (Recommended)

### Error Tracking
```bash
npm install @sentry/react
```

### Analytics (Privacy-Friendly)
- Plausible Analytics (EU-hosted, no cookies)
- Or Vercel Analytics (free tier)

### Uptime Monitoring
- UptimeRobot (free tier: 50 monitors)
- Monitor: Homepage, Supabase API

---

## 9. Cost Projection

### Current (Free Tier)
| Service | Cost | Limit |
|---------|------|-------|
| Supabase | $0 | 500MB storage, 2GB bandwidth |
| Vercel | $0 | 100GB bandwidth |
| Total | **$0/mo** | |

### At 200 Users
| Service | Cost | Limit |
|---------|------|-------|
| Supabase Pro | $25 | 8GB storage, 250GB bandwidth |
| Vercel | $0 | Still free tier |
| Total | **$25/mo** | |

### At 2000 Users
| Service | Cost | Notes |
|---------|------|-------|
| Supabase Pro | $25 | May need Team tier |
| CloudFlare R2 | ~$5 | Audio storage |
| Vercel Pro | $20 | If needed |
| Total | **~$50/mo** | |

---

## 10. Action Items

### Immediate (Before Launch)
- [x] Fix build system
- [x] Add PWA support
- [x] Fix react-router vulnerability
- [x] Add Privacy Policy page
- [x] Add Terms of Service page
- [ ] Test on Pixel 6 + iPhone 11

### Week 1 Post-Launch
- [ ] Set up Sentry error tracking
- [ ] Configure Plausible analytics
- [ ] Monitor Supabase bandwidth

### Month 1
- [ ] Evaluate upgrade to Supabase Pro
- [ ] Consider CloudFlare R2 migration
- [x] Implement code splitting ✅ (Session 12 — React.lazy + vendor chunks)

---

## Appendix: Files Changed in Audit

| File | Change |
|------|--------|
| `public/hearing-rehab-audio/` | DELETED (162MB) |
| `public/audio_quality_test/` | DELETED |
| `public/noise_files/` | DELETED |
| `src/data/minimalPairs.ts` | DELETED (dead code) |
| `public/manifest.json` | CREATED |
| `public/sw.js` | CREATED |
| `public/icon-*.png` | CREATED |
| `index.html` | UPDATED (PWA meta tags) |
| `src/main.tsx` | UPDATED (SW registration) |
| `src/App.tsx` | UPDATED (dev routes conditional) |
| `package.json` | UPDATED (react-router 7.13.0) |

---

*Report generated as part of go-live preparation. Review quarterly.*
