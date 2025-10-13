# Version Conflict Resolution Guide

## Problem

The semantic-release workflow is failing with the error:

```
npm error 403 403 Forbidden - PUT https://registry.npmjs.org/om-data-mapper - 
You cannot publish over the previously published versions: 1.0.0.
```

## Root Cause

The issue occurred because:

1. The `main` branch had a semantic-release run that created version `1.0.0`
2. The `refactoring` branch contains all the new setup commits (Steps 0-13)
3. The `refactoring` branch is based on the old history with tag `v2.0.5`
4. The branches have diverged, causing version confusion

## Current State

```
main branch:        ... → chore(release): 1.0.0 [skip ci]
                              ↓
                         (version 1.0.0, already published)

refactoring branch: ... → v2.0.5 → [all setup commits] → HEAD
                              ↓
                         (based on old history)
```

## Solution

Merge the `refactoring` branch into `main` to consolidate all the new commits. Semantic-release will then calculate the correct next version based on the commit history.

### Step 1: Verify Current State

```bash
# Check current branch
git branch --show-current
# Should show: main

# Check git status
git status
# Should be clean

# View recent commits on both branches
git log --oneline --graph --all --decorate -10
```

### Step 2: Merge Refactoring Branch

```bash
# Make sure you're on main
git checkout main

# Pull latest changes
git pull origin main

# Merge refactoring branch
git merge refactoring

# If there are conflicts, resolve them
# Then continue with:
# git add .
# git commit
```

### Step 3: Push to Main

```bash
# Push the merged changes
git push origin main
```

### Step 4: Monitor the Release

1. Go to GitHub Actions tab
2. Watch the "Release" workflow run
3. Semantic-release will:
   - Analyze all the new commits from refactoring branch
   - Calculate the next version (likely 1.1.0 or 2.0.0 depending on commits)
   - Create a new release
   - Publish to npm

## Expected Outcome

After merging, semantic-release will see commits like:

- `feat: add vitest config and smoke test with coverage`
- `feat(ci): add node20 build/test/coverage workflow`
- `feat(ci): add codeql analysis`
- `feat(ci): add semantic-release config and workflow`
- `fix(ci): add proper permissions to release workflow`
- `docs: add contributing, code of conduct, and issue/pr templates`
- etc.

Based on these commits, semantic-release will:
- **If there are `feat:` commits:** Bump to `1.1.0` (minor version)
- **If there are `feat!:` or `BREAKING CHANGE:`:** Bump to `2.0.0` (major version)
- **If only `fix:`, `docs:`, `chore:`:** Bump to `1.0.1` (patch version)

## Alternative Solution (If Merge Conflicts Are Complex)

If the merge has too many conflicts, you can reset the main branch to the refactoring branch:

```bash
# ⚠️ WARNING: This will overwrite main branch history
# Only do this if you're sure you want to discard the current main branch

# Backup current main (optional)
git branch main-backup

# Reset main to refactoring
git checkout main
git reset --hard refactoring

# Force push to remote (requires force push permissions)
git push origin main --force
```

**Note:** This approach requires force push permissions and will rewrite history. Only use if necessary.

## Manual Version Bump (Last Resort)

If you need to manually set the version:

1. Edit `package.json` and set version to `2.0.6` (or next appropriate version)
2. Create a git tag:
   ```bash
   git tag v2.0.6
   git push origin v2.0.6
   ```
3. Disable semantic-release temporarily by removing the release workflow or adding `[skip ci]` to commits

**Note:** This defeats the purpose of semantic-release and is not recommended.

## Prevention

To prevent this issue in the future:

1. **Always work on main branch** for semantic-release projects
2. **Use feature branches** for individual features, merge them to main frequently
3. **Don't let branches diverge** for extended periods
4. **Configure branch protection** to require PR reviews before merging to main

## Verification

After merging and the release workflow completes:

1. Check that a new version tag was created (e.g., `v1.1.0`)
2. Verify the GitHub release was created
3. Confirm the package was published to npm:
   ```bash
   npm view om-data-mapper versions
   ```
4. Check that CHANGELOG.md was updated
5. Verify package.json version was bumped

## Troubleshooting

### If the release still fails:

1. **Check NPM_TOKEN:** Ensure it's valid and has publish permissions
2. **Check workflow permissions:** Verify "Read and write permissions" are enabled
3. **Check commit messages:** Ensure they follow Conventional Commits format
4. **Check git history:** Ensure semantic-release can access full history (`fetch-depth: 0`)

### If version is still wrong:

1. Check existing git tags: `git tag -l`
2. Check npm published versions: `npm view om-data-mapper versions`
3. Verify semantic-release configuration in `.releaserc.json`
4. Check that the merge included all commits from refactoring branch

## Summary

**Recommended Action:**

```bash
# 1. Ensure you're on main
git checkout main

# 2. Merge refactoring branch
git merge refactoring

# 3. Resolve any conflicts if needed

# 4. Push to trigger release
git push origin main

# 5. Monitor GitHub Actions for the release workflow
```

This will consolidate all the setup work from the refactoring branch and allow semantic-release to properly calculate the next version.

---

**Last Updated:** 2025-10-13  
**Status:** Awaiting merge of refactoring branch into main

