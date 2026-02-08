# Verify Command

Run comprehensive verification on current codebase state.

## Instructions

Execute verification in this exact order:

1. **Build Check**
   ```bash
   npm run build 2>&1 | tail -20
   ```
   If it fails, report errors and STOP.

2. **Type Check**
   ```bash
   npx tsc --noEmit 2>&1 | head -30
   ```
   Report all errors with file:line.

3. **Test Suite**
   ```bash
   npm test 2>&1 | tail -30
   ```
   Report pass/fail count.

4. **Console.log Audit**
   ```bash
   grep -rn "console.log" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10
   ```
   Report locations.

5. **Regulatory Check**
   ```bash
   grep -rn "clinical" src/ --include="*.tsx" 2>/dev/null | head -5
   ```
   Flag any "clinical" terminology in user-facing code.

6. **Git Status**
   ```bash
   git status --short
   ```
   Show uncommitted changes.

## Output

Produce a concise verification report:

```
VERIFICATION: [PASS/FAIL]

Build:      [OK/FAIL]
Types:      [OK/X errors]
Tests:      [X/Y passed]
Logs:       [OK/X console.logs]
Regulatory: [OK/X issues]

Ready for commit: [YES/NO]
```

If any critical issues, list them with fix suggestions.

## Arguments

$ARGUMENTS can be:
- `quick` - Only build + types
- `full` - All checks (default)
- `pre-commit` - Build + tests + logs + regulatory
