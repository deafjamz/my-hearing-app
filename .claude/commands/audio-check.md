# Audio Check Command

Verify audio-related code quality and iOS compatibility.

## Instructions

Run these checks for audio code:

1. **AudioContext Resume Pattern**
   ```bash
   grep -rn "audioContext.resume\|AudioContext" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10
   ```
   Verify iOS Safari unlock pattern exists.

2. **Audio Cleanup**
   ```bash
   grep -rn "audio.src = ''" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10
   ```
   Verify Audio elements are cleaned up in useEffect return.

3. **Memory Leak Prevention**
   ```bash
   grep -rn "removeEventListener" src/hooks/ --include="*.ts" 2>/dev/null | head -10
   ```
   Verify event listeners are removed.

4. **SNR Mixing**
   ```bash
   grep -rn "gain.value\|GainNode" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10
   ```
   Check SNR mixing implementation.

5. **Voice Roster**
   ```bash
   grep -rn "sarah\|marcus\|david\|alice\|bill" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -10
   ```
   Verify correct voice IDs used.

## Output

```
AUDIO CHECK: [PASS/FAIL]

iOS AudioContext:   [OK/MISSING]
Audio Cleanup:      [OK/MISSING]
Event Listeners:    [OK/LEAKING]
SNR Implementation: [OK/ISSUES]
Voice IDs:          [OK/INVALID]

Issues:
1. ...
```

## Common Fixes

- **Missing AudioContext resume**: Add user gesture handler
- **Missing cleanup**: Add `audio.src = ''` in useEffect return
- **Event listener leaks**: Store refs and remove in cleanup
