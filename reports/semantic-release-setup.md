# Semantic-Release Setup and Troubleshooting

## Problem: Version Mismatch

### Issue
Semantic-release is trying to publish version `1.0.0`, but the package.json shows version `2.0.5`. This causes a conflict because version `1.0.0` already exists on npm.

### Root Cause
Semantic-release determines the next version by:
1. Looking at the latest git tag in the repository
2. Analyzing commits since that tag
3. Calculating the next version based on conventional commits

**The problem:** This repository has no git tags, so semantic-release starts from `1.0.0` by default, ignoring the version in package.json.

### Solution
Create a git tag for the current version so semantic-release knows where to start.

---

## Fix: Create Initial Version Tag

### Step 1: Create the Tag

Run the following commands to create a tag for the current version:

```bash
# Create an annotated tag for the current version
git tag -a v2.0.5 -m "chore(release): tag existing version 2.0.5"

# Push the tag to GitHub
git push origin v2.0.5
```

### Step 2: Verify the Tag

```bash
# List all tags
git tag -l

# Show tag details
git show v2.0.5
```

### Step 3: Test Semantic-Release Locally (Optional)

```bash
# Dry run to see what version would be released
npx semantic-release --dry-run
```

---

## How Semantic-Release Works

### Version Calculation

Semantic-release analyzes commits since the last tag and determines the version bump:

| Commit Type | Version Bump | Example |
|-------------|--------------|---------|
| `fix:` | Patch | 2.0.5 → 2.0.6 |
| `feat:` | Minor | 2.0.5 → 2.1.0 |
| `feat!:` or `BREAKING CHANGE:` | Major | 2.0.5 → 3.0.0 |
| `docs:`, `chore:`, `style:`, etc. | No release | - |

### Tag Format

Semantic-release expects tags in the format: `v{version}`
- ✅ Correct: `v2.0.5`, `v2.1.0`, `v3.0.0`
- ❌ Incorrect: `2.0.5`, `release-2.0.5`, `version-2.0.5`

---

## Workflow Behavior

### On Push to Main

When you push to the `main` branch:

1. **Checkout:** Full git history is fetched (`fetch-depth: 0`)
2. **Install:** Dependencies are installed
3. **Build:** Project is built
4. **Test:** Tests are run
5. **Analyze:** Commits since last tag are analyzed
6. **Version:** Next version is calculated
7. **Changelog:** CHANGELOG.md is updated
8. **Commit:** Changes are committed with `[skip ci]`
9. **Tag:** New version tag is created
10. **Publish:** Package is published to npm
11. **Release:** GitHub release is created

### What Gets Updated

- `package.json` - version field
- `package-lock.json` - version field
- `CHANGELOG.md` - new release notes
- Git tag - new version tag
- GitHub release - with changelog
- npm registry - new package version

---

## Troubleshooting

### Error: Cannot Publish Over Previously Published Version

**Symptom:**
```
npm error 403 You cannot publish over the previously published versions: 1.0.0
```

**Cause:** No git tags exist, so semantic-release starts from 1.0.0

**Solution:** Create a tag for the current version (see Step 1 above)

### Error: No Release Published

**Symptom:** Workflow succeeds but no release is created

**Possible Causes:**
1. No commits with `feat:` or `fix:` since last tag
2. Only `chore:`, `docs:`, or other non-release commits
3. Commits don't follow conventional commit format

**Solution:** 
- Ensure commits follow conventional commits format
- Use `feat:` for new features or `fix:` for bug fixes
- Check commit messages: `git log --oneline`

### Error: Permission Denied

**Symptom:**
```
remote: Permission to Isqanderm/data-mapper.git denied to github-actions[bot]
```

**Solution:** Configure workflow permissions (see `reports/github-actions-setup.md`)

### Error: NPM Authentication Failed

**Symptom:**
```
npm ERR! code ENEEDAUTH
npm ERR! need auth This command requires you to be logged in
```

**Solution:** Add `NPM_TOKEN` secret to repository settings

---

## Best Practices

### 1. Always Use Conventional Commits

```bash
# Good
git commit -m "feat: add new mapping feature"
git commit -m "fix: resolve undefined value handling"
git commit -m "docs: update README examples"

# Bad
git commit -m "added feature"
git commit -m "bug fix"
git commit -m "updates"
```

### 2. Use Scopes for Clarity

```bash
git commit -m "feat(mapper): add caching support"
git commit -m "fix(utils): handle edge case in deep merge"
git commit -m "docs(readme): add installation instructions"
```

### 3. Document Breaking Changes

```bash
git commit -m "feat!: redesign mapper API

BREAKING CHANGE: The create method now requires explicit type parameters.
Migration: Update Mapper.create() to Mapper.create<Source, Target>()"
```

### 4. Keep Commits Atomic

- One logical change per commit
- Each commit should be self-contained
- Easier to review and revert if needed

### 5. Test Before Merging to Main

```bash
# On feature branch
npm run build
npm test
npm run lint

# Dry run semantic-release
npx semantic-release --dry-run
```

---

## Manual Release Process (Emergency)

If automated releases fail, you can manually release:

### 1. Update Version

```bash
# Patch: 2.0.5 → 2.0.6
npm version patch

# Minor: 2.0.5 → 2.1.0
npm version minor

# Major: 2.0.5 → 3.0.0
npm version major
```

### 2. Build and Test

```bash
npm run clean
npm run build
npm test
```

### 3. Publish to npm

```bash
npm publish
```

### 4. Create GitHub Release

1. Go to repository → Releases → Draft a new release
2. Create a new tag (e.g., `v2.0.6`)
3. Add release notes
4. Publish release

---

## Verification Checklist

Before pushing to main:

- [ ] Git tag exists for current version (`git tag -l`)
- [ ] Workflow permissions are configured (read/write)
- [ ] NPM_TOKEN secret is added
- [ ] Commits follow conventional commits format
- [ ] All tests pass locally
- [ ] Build succeeds locally
- [ ] No uncommitted changes

After pushing to main:

- [ ] Workflow completes successfully
- [ ] New version tag is created
- [ ] GitHub release is created
- [ ] Package is published to npm
- [ ] CHANGELOG.md is updated
- [ ] package.json version is bumped

---

## Configuration Files

### .releaserc.json

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        "assets": ["CHANGELOG.md", "package.json"],
        "message": "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}"
      }
    ]
  ]
}
```

### Release Workflow

```yaml
permissions:
  contents: write      # Push tags and commits
  issues: write        # Comment on issues
  pull-requests: write # Comment on PRs

steps:
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0  # Full history for semantic-release
```

---

## Summary

**To fix the current issue:**

1. Create tag: `git tag -a v2.0.5 -m "chore(release): tag existing version 2.0.5"`
2. Push tag: `git push origin v2.0.5`
3. Verify: `git tag -l`
4. Next push to main will calculate version from v2.0.5

**For future releases:**

- Use conventional commits
- Push to main branch
- Semantic-release handles everything automatically

---

**Last Updated:** 2025-10-13  
**Maintained By:** Repository Administrators

