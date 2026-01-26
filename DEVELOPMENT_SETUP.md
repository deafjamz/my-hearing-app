# Development Setup - CRITICAL READ FIRST

> **Last Updated:** 2026-01-25
> **Issue Severity:** CRITICAL - Will cause complete development blockage if ignored

---

## THE ICLOUD PROBLEM

### What Happens

If you work from `~/Desktop/my-hearing-app` (or any iCloud-synced folder), **ALL terminal commands will hang indefinitely**:

```bash
# These commands will NEVER complete in iCloud folders:
npm install          # Hangs forever
npm run build        # Hangs forever
npm run dev          # Hangs forever
git status           # Hangs forever
mv file.ts other.ts  # Hangs forever
```

### Why It Happens

1. **iCloud Desktop Sync**: macOS syncs `~/Desktop` to iCloud by default
2. **node_modules nightmare**: `node_modules/` contains 125MB+ and thousands of tiny files
3. **Constant sync checks**: Every file operation triggers iCloud sync verification
4. **I/O deadlock**: The sync process blocks all file operations

### How to Identify the Problem

If you see these symptoms, you're in an iCloud-synced folder:
- Commands hang with no output
- Terminal shows no errors, just... nothing
- Even simple commands like `ls` take 10+ seconds
- Activity Monitor shows `bird` or `cloudd` processes with high CPU

Check if a folder is iCloud-synced:
```bash
# If this shows "com.apple.icloud" extended attributes, it's synced
xattr ~/Desktop
```

---

## THE SOLUTION

### Canonical Working Directory

**ALWAYS work from this location:**

```
~/Projects/my-hearing-app
```

This folder is:
- NOT synced to iCloud
- Fast for all Node.js operations
- The canonical source of truth for development

### First-Time Setup

```bash
# 1. Create Projects directory (if needed)
mkdir -p ~/Projects

# 2. Clone fresh from GitHub
cd ~/Projects
git clone git@github.com:deafjamz/my-hearing-app.git

# 3. Install dependencies (will be fast!)
cd my-hearing-app
npm install

# 4. Verify build works
npm run build
```

### If You Accidentally Work in Desktop

If you've made changes in `~/Desktop/my-hearing-app` that aren't committed:

```bash
# File reads still work even when commands hang!
# Use Claude to read files from Desktop and write to Projects

# Or manually copy specific files:
cp ~/Desktop/my-hearing-app/src/components/NewFile.tsx ~/Projects/my-hearing-app/src/components/
```

---

## DIRECTORY STRUCTURE

### What Lives Where

| Location | Purpose | iCloud Synced? |
|----------|---------|----------------|
| `~/Projects/my-hearing-app` | **ACTIVE DEVELOPMENT** | NO |
| `~/Desktop/my-hearing-app` | LEGACY - Do not use | YES (broken) |
| `~/Desktop/my-hearing-app-fresh` | LEGACY - Do not use | YES (broken) |

### Why Two Desktop Repos Exist

Historical context (for cleanup later):
- `my-hearing-app` - Original repo, has full history
- `my-hearing-app-fresh` - Attempted fresh clone to fix issues

Both are now obsolete. The canonical repo is in `~/Projects/`.

---

## QUICK REFERENCE

### Starting a New Session

```bash
# 1. Navigate to correct directory
cd ~/Projects/my-hearing-app

# 2. Verify you're in the right place
pwd  # Should show /Users/clyle/Projects/my-hearing-app

# 3. Pull latest changes
git pull

# 4. Start development
npm run dev
```

### Verifying Your Environment

```bash
# Check Node version
node --version  # Should be v24.x

# Check npm version
npm --version   # Should be 11.x

# Test that commands work (should complete in <5 seconds)
time npm run build
```

### If Commands Start Hanging

1. **Check your directory**: `pwd` - are you in `~/Projects/`?
2. **Check for iCloud**: `xattr .` - any `com.apple.icloud` attributes?
3. **Move to Projects**: `cd ~/Projects/my-hearing-app`

---

## DEPLOYMENT

### Vercel Deployment

The app is configured for Vercel deployment. The `vercel.json` handles:
- SPA routing (all routes -> index.html)
- PWA headers for service worker
- Asset caching

**Deploy via:**
1. **Web UI**: vercel.com -> New Project -> Import `deafjamz/my-hearing-app`
2. **CLI**: `npx vercel --prod` (from `~/Projects/my-hearing-app`)

### GitHub Remote

```
Origin: git@github.com:deafjamz/my-hearing-app.git
Branch: main
```

---

## TROUBLESHOOTING

### "Command hangs forever"
**Cause:** You're in an iCloud-synced directory
**Fix:** `cd ~/Projects/my-hearing-app`

### "Module not found" errors during build
**Cause:** Files exist in Desktop but not in Projects
**Fix:** Use Claude to read from Desktop and write to Projects, or manually copy

### "Cannot find module 'xyz'" after fresh clone
**Cause:** Missing `npm install`
**Fix:** `npm install`

### Git push fails
**Cause:** SSH key not configured or wrong remote
**Fix:**
```bash
# Check remote
git remote -v

# Should show:
# origin  git@github.com:deafjamz/my-hearing-app.git (fetch)
# origin  git@github.com:deafjamz/my-hearing-app.git (push)
```

---

## LESSONS LEARNED (2026-01-25)

This documentation exists because of a painful debugging session:

1. **Morning**: Commands hanging in `~/Desktop/my-hearing-app`
2. **Diagnosis**: iCloud sync causing I/O deadlock on node_modules
3. **Failed attempts**: Creating `my-hearing-app-fresh` (same problem - still on Desktop)
4. **Solution**: Clone to `~/Projects/` (not iCloud synced)
5. **Recovery**: Read 20 missing files from Desktop via Claude, wrote to Projects
6. **Success**: Build completed in 3.2 seconds, pushed to GitHub

**Never again work from iCloud-synced folders with Node.js projects.**
