# Verification Loop - SoundSteps

A comprehensive verification system for ensuring code quality before commits and PRs.

## When to Use

- After completing a feature
- Before creating a PR
- After refactoring
- When quality is uncertain

## Verification Phases

### Phase 1: Build Check

```bash
npm run build 2>&1 | tail -20
```

If build fails, STOP and fix before continuing.

### Phase 2: Type Check

```bash
npx tsc --noEmit 2>&1 | head -30
```

Report all type errors. Fix critical ones before continuing.

### Phase 3: Test Suite

```bash
npm test 2>&1 | tail -30
```

All tests must pass. Check coverage:
```bash
npm run test:coverage
```

Target: 80% minimum coverage.

### Phase 4: Lint Check

```bash
npm run lint 2>&1 | head -30
```

### Phase 5: Security Scan

```bash
# Check for console.log in source
grep -rn "console.log" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10

# Check for hardcoded secrets
grep -rn "sk-\|api_key\|password" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10

# Check for "clinical" terminology
grep -rn "clinical" src/ --include="*.tsx" 2>/dev/null | head -10
```

### Phase 6: Audio-Specific Checks

```bash
# Verify audio hooks clean up properly
grep -rn "audio.src = ''" src/hooks/ 2>/dev/null

# Check AudioContext handling
grep -rn "audioContext.resume" src/ 2>/dev/null
```

### Phase 7: Git Status

```bash
git status
git diff --stat
```

Review uncommitted changes for unintended modifications.

## Output Format

```
VERIFICATION REPORT - SoundSteps
================================

Build:      [PASS/FAIL]
Types:      [PASS/FAIL] (X errors)
Tests:      [PASS/FAIL] (X/Y passed, Z% coverage)
Lint:       [PASS/FAIL] (X warnings)
Security:   [PASS/FAIL] (console.logs, secrets, clinical terms)
Audio:      [PASS/FAIL] (cleanup, iOS compat)
Diff:       [X files changed]

Overall:    [READY/NOT READY] for commit

Issues to Fix:
1. ...
2. ...
```

## Quick Verification

For fast checks during development:
```bash
npm run build && npm test
```

## Pre-PR Verification

Full check before creating PR:
```bash
npm run build && \
npm test && \
npx tsc --noEmit && \
npm run lint
```

## Continuous Mode

Run verification every 15-20 minutes during long sessions:
- After completing each component
- After finishing a hook
- Before context compaction
