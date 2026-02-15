# Session Start Command

Bootstrap a new Claude Code session with full project context.

## Instructions

Execute these steps in order:

1. **Verify working directory**
   ```bash
   pwd
   ```
   Must show `/Users/clyle/Projects/my-hearing-app`. If not, STOP and warn.

2. **Read essential files** (parallel)
   - Read `STATUS.md` (first 100 lines for quick orientation)
   - Read `CLAUDE.md` (project rules)
   - Run `git log --oneline -10` (recent commits)
   - Run `git status --short` (uncommitted changes)

3. **Produce a situation report**

Output a concise status briefing:

```
SESSION START — SoundSteps
==========================
Branch: [current branch]
Last commit: [hash + message]
Uncommitted: [count or "clean"]
Build: [read from STATUS.md header]
Tests: [read from STATUS.md header]

COMPLETED (most recent session):
- [bullet list from STATUS.md]

NEXT PRIORITIES:
- [bullet list from STATUS.md TODO section]

Ready. What would you like to work on?
```

4. **Key rules reminder** (include in output)

```
RULES:
- Dark mode always on (no light mode)
- Primitives: import { Button, Card } from '@/components/primitives'
- Audio: Web Audio API only (useSilentSentinel.playUrl)
- No "clinical" in UI text
- No Co-Authored-By in commits
- No gradients, no purple, font-bold max
```

## Arguments

$ARGUMENTS can be:
- `quick` — Skip file reads, just git status + rules
- `full` — All checks + read STATUS.md fully (default)
