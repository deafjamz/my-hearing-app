# Git Workflow - SoundSteps

## Commit Message Format

```
<type>: <description>

<optional body>
```

Types: feat, fix, refactor, docs, test, chore, perf, ci

Examples:
- `feat: Add voice selection to settings`
- `fix: Resolve iOS audio autoplay issue`
- `refactor: Extract SNR mixing to custom hook`
- `docs: Update audio inventory with new voices`

## Branch Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance tasks

## Pre-Commit Checklist

Before committing:
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No TypeScript errors
- [ ] No console.log statements
- [ ] No hardcoded secrets
- [ ] No "clinical" terminology in user-facing text

## Pull Request Workflow

1. Create feature branch from `main`
2. Make changes with atomic commits
3. Run full test suite
4. Create PR with description:
   - Summary of changes
   - Test plan
   - Screenshots (for UI changes)
5. Address review feedback
6. Squash and merge

## Deployment

- Vercel auto-deploys `main` branch
- Preview deployments for PRs
- Environment variables in Vercel dashboard

## Rollback

If production issue:
1. Revert commit: `git revert <sha>`
2. Push to main
3. Vercel auto-deploys revert
