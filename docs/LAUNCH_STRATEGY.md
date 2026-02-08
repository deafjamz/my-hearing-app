# SoundSteps Launch Strategy

> **Timeline:** 2 days to soft launch
> **Date:** 2026-01-24
> **Status:** Strategic planning complete

---

## Executive Summary

**Reality Check:** A true "polished app store launch" takes 2-4 weeks minimum (App Store review alone is 1-2 weeks). However, a **soft launch** as a **Progressive Web App (PWA)** can happen in 2 days.

**Recommended Path:**
1. Day 1-2: PWA soft launch (web-based, installable)
2. Week 2-4: Native app store submission (iOS/Android)
3. Month 2+: Iterate based on feedback

---

## Part 1: LLC & Anonymity Strategy

### The Cochlear Employment Risk

**Key concern:** Your employment agreement likely includes:
- IP assignment clauses (work product belongs to employer)
- Non-compete provisions
- Moonlighting disclosure requirements

**Mitigation strategies:**
1. **Review your employment contract** - Look for:
   - Scope of IP assignment (work time only? all hearing-related?)
   - Non-compete geographic/time limits
   - Disclosure requirements for outside business

2. **Time separation:** All development done on personal time, personal equipment
3. **No Cochlear resources:** Fresh iPhone not connected to work = good
4. **Different market segment:** You're B2C consumer training; Cochlear is B2B medical devices

### Wyoming Anonymous LLC Setup

**Why Wyoming:**
- No state income tax
- No disclosure of member names in public filings
- Low fees ($100 filing + $60/year)
- Strong asset protection

**Cost breakdown:**

| Item | One-time | Annual |
|------|----------|--------|
| WY LLC Filing | $100 | - |
| Registered Agent | - | $25-125 |
| Annual Report | - | $60 |
| **Total** | **$100** | **$85-185** |

**Recommended service:** [Wyoming Agents](https://www.wyomingagents.com/) - $25/year registered agent

**Privacy layers:**
1. Wyoming LLC (your name not on public record)
2. Registered Agent address (not your home)
3. Privacy.com or similar for payments
4. ProtonMail for business email
5. Separate bank account in LLC name

### App Store Considerations

**Apple Developer Account:** Requires real name/entity, but:
- LLC can be the entity
- Your name appears as "Account Holder" (not public)
- App listing shows LLC name only

**Google Play Developer Account:**
- $25 one-time fee
- Can use LLC name
- Physical address required (use registered agent)

### Recommended Action Plan

```
Week 1:
□ File Wyoming LLC online (~$100, 24-48 hour processing)
□ Sign up for registered agent service (~$25)
□ Get EIN from IRS (free, instant online)
□ Open business bank account (Mercury, Relay, or local credit union)

Week 2:
□ Apple Developer enrollment ($99/year) using LLC
□ Google Play enrollment ($25 one-time) using LLC
```

---

## Part 2: 2-Day Soft Launch Plan

### What's Actually Shippable Now

| Feature | Status | Launch Ready? |
|---------|--------|---------------|
| Dashboard | ✅ Polished | Yes |
| RapidFire (Word Pairs) | ✅ Working | Yes |
| Stories | ✅ Working | Yes |
| Scenarios | ✅ Working | Yes |
| Smart Coach | ✅ Working | Yes |
| Guest Mode | ✅ Working | Yes |
| Authentication | ⚠️ Buggy | Skip for soft launch |
| Programs | ⚠️ UI exists | Hold for v1.1 |
| New content (Drills, Conversations) | ❌ No UI | Hold for v1.2 |

### Day 1 (Today): Polish & Prep

**Morning (4 hours):**
- [ ] Fix any build errors
- [ ] Test core flows on Pixel 6 + iPhone 11
- [ ] Remove/hide incomplete features (ClinicalReport page, etc.)
- [ ] Add simple onboarding tooltip or welcome modal
- [ ] Verify PWA manifest and icons

**Afternoon (4 hours):**
- [ ] Deploy to Vercel/Netlify (free tier)
- [ ] Set up custom domain (optional: soundsteps.app)
- [ ] Create Privacy Policy page (required for app stores)
- [ ] Create Terms of Service page
- [ ] Test on both devices via deployed URL

### Day 2: Launch & Legal

**Morning (4 hours):**
- [ ] File Wyoming LLC (if ready to commit)
- [ ] Final bug fixes from Day 1 testing
- [ ] Create simple landing page / marketing site
- [ ] Set up basic analytics (Plausible or privacy-friendly option)

**Afternoon (4 hours):**
- [ ] "Soft launch" to friends/family/CI community
- [ ] Post in relevant communities (CI forums, Reddit r/cochlearimplants)
- [ ] Gather initial feedback
- [ ] Document bugs and feedback

### Technical: PWA Setup Verification

```bash
# Verify PWA manifest exists
cat public/manifest.json

# Build and test locally
npm run build
npx serve dist

# Test PWA install on mobile
# 1. Open in Chrome/Safari
# 2. "Add to Home Screen"
# 3. Verify offline capability
```

---

## Part 3: Tier & Pricing Strategy

### Market Research Summary

| Competitor | Model | Price | Notes |
|------------|-------|-------|-------|
| [LACE AI Pro](https://www.laceauditorytraining.com/) | One-time | $349-499 | 20+ years market presence |
| [Cochlear CoPilot](https://www.cochlear.com/us/en/home/ongoing-care-and-support/rehabilitation-resources/copilot) | Free | $0 | Manufacturer app, limited |
| Generic hearing games | Subscription | ~$25/mo | Various quality |
| Language learning (Duolingo) | Freemium | $0-13/mo | Comparable engagement model |

### Recommended Tier Structure

#### Free Tier (Hook)
**Goal:** Get users in, demonstrate value, collect testimonials

| Included | Limit |
|----------|-------|
| Word Pairs (RapidFire) | 50 pairs/day |
| Stories | 3 stories |
| Scenarios | 2 scenarios |
| Smart Coach | Basic (fixed SNR) |
| Progress tracking | Last 7 days |
| Voices | 2 voices |

#### Plus Tier ($7.99/month or $59.99/year)
**Goal:** Casual users who want more content

| Included | Limit |
|----------|-------|
| Word Pairs | Unlimited |
| Stories | All 100+ |
| Scenarios | All 30+ |
| Smart Coach | Full adaptive |
| Progress tracking | Full history |
| Voices | All 9 voices |
| Speaking rate variants | Yes |
| Phoneme drill packs | 3 packs |

#### Premium Tier ($14.99/month or $99.99/year)
**Goal:** Serious users, clinical use

| Included | Everything in Plus + |
|----------|---------------------|
| All phoneme drill packs | 10 packs |
| Conversational Q&A | 200 pairs |
| Environmental sounds | 50 sounds |
| Progress reports (PDF) | Yes |
| Priority new content | Yes |
| Email support | Yes |

### Pricing Rationale

**Why subscription over one-time:**
- Recurring revenue for sustainability
- Aligns incentive to keep adding content
- Lower barrier to entry than $349 one-time
- Monthly allows users to try risk-free

**Why these price points:**
- $7.99/mo = "cup of coffee" psychology, below $10 threshold
- $14.99/mo = serious but still accessible (< cost of one audiology visit)
- Annual discount = 37% off (incentivize commitment)
- Undercuts LACE significantly while being premium vs. free

### ROI Projections

**Assumptions:**
- Month 1-3: 50 users (friends, CI community, soft launch)
- Month 4-6: 200 users (organic + word of mouth)
- Month 7-12: 500 users (content marketing, audiologist partnerships)
- Month 13-24: 2,000 users (established presence)

**Conversion assumptions:** 5% free→Plus, 2% free→Premium

| Timeframe | Users | Paid | MRR | Notes |
|-----------|-------|------|-----|-------|
| Month 3 | 50 | 3 | $35 | Validation phase |
| Month 6 | 200 | 14 | $130 | Product-market fit |
| Month 12 | 500 | 35 | $350 | Sustainable hobby |
| Month 24 | 2,000 | 140 | $1,400 | Side business |

**Break-even analysis:**
- Monthly costs: ~$50 (hosting, ElevenLabs, services)
- Break-even: ~7 paid users
- Achievable by Month 4-5

**Upside scenario (if it takes off):**
- 5,000 users, 10% conversion = 500 paid
- 500 × $10 avg = $5,000 MRR
- This is "quit your job" territory (but don't until stable)

---

## Part 4: Maintenance Strategy

### Low-Lift Maintenance Model

**Weekly (30 min):**
- Monitor error logs (Sentry free tier)
- Check user feedback (if any)
- Review basic analytics

**Monthly (2-4 hours):**
- Generate new audio content (when credits replenish)
- Minor bug fixes
- Content updates to CSV files

**Quarterly (1-2 days):**
- New feature consideration
- Design refresh if needed
- Pricing/tier adjustments

### Content Generation Cadence

Your ElevenLabs subscription replenishes monthly. Plan:

| Month | Credits | Content to Generate |
|-------|---------|---------------------|
| Feb | ~30k | Complete sentences_v2 (2,862 remaining) |
| Mar | ~30k | 20 new stories + questions |
| Apr | ~30k | 100 new sentence variants |
| May | ~30k | New phoneme drill pack |
| Jun+ | ~30k | User-requested content |

### Automation Opportunities

- **Audio generation:** Scripts already built, just run them
- **Database updates:** CSV → DB ingestion automated
- **Deployment:** CI/CD via Vercel/Netlify (auto-deploy on push)
- **Monitoring:** Free tiers of Sentry, Plausible, UptimeRobot

---

## Part 5: Blind Spots & Risks

### Legal/Compliance

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Cochlear employment conflict** | HIGH | Review contract, time separation, different market |
| **FDA regulatory creep** | MEDIUM | Stick to "training app" language (see REGULATORY_LANGUAGE_GUIDE.md) |
| **HIPAA if storing health data** | MEDIUM | Don't store PHI; audiogram data is optional profile field |
| **App Store health app policies** | LOW | You're training, not diagnosing |
| **COPPA (children under 13)** | LOW | Add age gate or 13+ requirement |

### Technical

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Supabase outage** | MEDIUM | Free tier has good uptime; consider backup |
| **ElevenLabs API changes** | MEDIUM | Audio is pre-generated, not live API calls |
| **React/Vite breaking changes** | LOW | Lock dependency versions |
| **Audio playback issues on iOS** | MEDIUM | Test thoroughly on iPhone 11 |

### Business

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Cochlear releases competing free app** | HIGH | Differentiate on content depth, UX, community |
| **Low conversion rate** | MEDIUM | Focus on free tier value, testimonials |
| **Support burden** | MEDIUM | FAQ page, community forum vs 1:1 support |
| **Churn** | MEDIUM | Regular content updates, engagement features |

### Things You Haven't Mentioned

1. **Privacy Policy & Terms of Service**
   - Required for app stores
   - Required for GDPR/CCPA compliance
   - Use generator like Termly or hire lawyer ($200-500)

2. **Customer Support Infrastructure**
   - Email? Chat? Forum?
   - Recommendation: Simple email (support@soundsteps.app) + FAQ page

3. **Refund Policy**
   - App stores handle this mostly
   - Have a written policy anyway

4. **Backup & Disaster Recovery**
   - Supabase has backups on paid tier
   - Export user data periodically

5. **Accessibility Beyond Hearing**
   - Color blindness considerations
   - Screen reader compatibility (ironic if hearing app isn't accessible)
   - Large text support

6. **Onboarding Flow**
   - New users need guidance
   - Consider 3-screen intro or tooltip tour

7. **Offline Capability**
   - PWA can cache content
   - Critical for users in poor connectivity areas

8. **Analytics & Metrics**
   - What does success look like?
   - Track: DAU, session length, completion rate, conversion

9. **Community Building**
   - Discord? Forum? Facebook group?
   - User testimonials are your best marketing

10. **Audiologist Partnerships**
    - Potential B2B channel
    - "Recommended by audiologists" is powerful
    - Consider affiliate/referral program

---

## Recommended Priority Order

### This Weekend (Days 1-2)
1. ✅ Build and test PWA
2. ✅ Deploy to Vercel
3. ✅ Basic Privacy Policy
4. ✅ Soft launch to 5-10 trusted users

### Week 2
1. File Wyoming LLC
2. Gather feedback, fix critical bugs
3. Add onboarding flow
4. Prepare app store assets (screenshots, description)

### Week 3-4
1. Submit to App Store (expect 1-2 week review)
2. Submit to Google Play (expect 1-3 day review)
3. Implement tier locking (if not already)
4. Set up Stripe/RevenueCat for payments

### Month 2
1. Process store feedback/rejections
2. Content marketing (blog posts, CI community)
3. First audiologist outreach
4. Complete remaining audio generation

### Month 3+
1. Iterate based on user feedback
2. Quarterly feature planning
3. Consider ProductHunt launch when polished

---

## Decision Points for You

### DECIDED: Two-Phase Launch Strategy

**Phase 1: Anonymous (Months 1-6)**
- Wyoming LLC with registered agent (no personal name public)
- Generic founder identity ("the SoundSteps team")
- Marketing via CI communities, word-of-mouth only
- Protects during Cochlear re-org period

**Phase 2: Public (Month 6+)**
- Reveal founder identity when timing is right
- Leverage unique credibility:
  - Bilateral CI recipient (lived experience)
  - Longtime recipient advocate
  - Clinical and industry relationships
- "Built by someone who actually uses cochlear implants"
- Audiologist partnership outreach
- Media/press opportunities

### Remaining Decisions

2. **PWA-first or Native-first?**
   - PWA: Launch in 2 days, less polish
   - Native: Launch in 3-4 weeks, more polish

3. **Free tier limits?**
   - Generous: More users, lower conversion
   - Restrictive: Fewer users, higher conversion

4. **Support model?**
   - Email only: Low effort, slower response
   - Community: Medium effort, scalable
   - Chat: High effort, better experience

5. **Pricing commitment?**
   - Start low, raise later (risks early adopter anger)
   - Start at target, offer launch discount (cleaner)

---

## Sources

- [Wyoming Agents - $25/year registered agent](https://www.wyomingagents.com/)
- [LLC University - Wyoming LLC Guide](https://www.llcuniversity.com/wyoming-llc/)
- [LACE AI Pro - $349-499 one-time](https://www.laceauditorytraining.com/)
- [Cochlear CoPilot - Free](https://www.cochlear.com/us/en/home/ongoing-care-and-support/rehabilitation-resources/copilot)
