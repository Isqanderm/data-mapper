# Codecov Setup Guide

## Overview

The CI workflow now uses Codecov v5 with token authentication for uploading coverage reports. This provides better security and reliability compared to tokenless uploads.

## Quick Setup

### Step 1: Get Codecov Token

1. Go to [codecov.io](https://codecov.io/)
2. Sign in with your GitHub account
3. Navigate to your repository: `Isqanderm/data-mapper`
   - If the repository is not listed, click **Add new repository** and select it
4. Go to **Settings** → **General**
5. Find the **Repository Upload Token** section
6. Copy the token (it looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 2: Add Token to GitHub Secrets

1. Go to your GitHub repository: https://github.com/Isqanderm/data-mapper
2. Click **Settings** (top navigation)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in the form:
   - **Name:** `CODECOV_TOKEN`
   - **Secret:** Paste the token from Step 1
6. Click **Add secret**

### Step 3: Verify Setup

After adding the token, the next CI workflow run will automatically upload coverage reports to Codecov.

To trigger a workflow run:

```bash
# Make a small change and push
git commit --allow-empty -m "ci: test codecov integration"
git push origin main
```

Then:

1. Go to **Actions** tab in GitHub
2. Watch the CI workflow run
3. Check that the "Upload coverage reports to Codecov" step succeeds
4. Visit [codecov.io](https://codecov.io/) to see your coverage reports

## What Changed

### Before (Codecov v4)

```yaml
- uses: codecov/codecov-action@v4
  with:
    fail_ci_if_error: false
```

**Issues:**
- Tokenless upload is being deprecated
- Less secure
- May fail intermittently

### After (Codecov v5)

```yaml
- name: Upload coverage reports to Codecov
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    fail_ci_if_error: false
```

**Benefits:**
- ✅ More secure with token authentication
- ✅ More reliable uploads
- ✅ Better error reporting
- ✅ Future-proof (v5 is the latest version)

## Troubleshooting

### Error: "Missing repository upload token"

**Symptom:**
```
Error: Codecov token not found. Please provide Codecov token with -t flag
```

**Solution:**
- Verify that `CODECOV_TOKEN` secret is added to GitHub repository
- Check that the secret name is exactly `CODECOV_TOKEN` (case-sensitive)
- Ensure the token is valid and not expired

### Error: "Invalid token"

**Symptom:**
```
Error: Invalid upload token
```

**Solution:**
- Go to Codecov and regenerate the token
- Update the `CODECOV_TOKEN` secret in GitHub with the new token

### Coverage not showing on Codecov

**Symptom:**
- CI workflow succeeds but coverage doesn't appear on Codecov

**Solution:**
1. Check that tests are generating coverage files:
   ```bash
   npm test
   ls -la coverage/
   ```
2. Verify `coverage/lcov.info` exists
3. Check Codecov workflow logs for upload confirmation
4. Wait a few minutes for Codecov to process the upload

### Badge not updating

**Symptom:**
- Coverage badge in README shows old data or "unknown"

**Solution:**
1. Clear browser cache
2. Wait for Codecov to process the latest upload
3. Check that the badge URL is correct:
   ```markdown
   [![codecov](https://codecov.io/gh/Isqanderm/data-mapper/branch/main/graph/badge.svg)](https://codecov.io/gh/Isqanderm/data-mapper)
   ```

## Coverage Configuration

The coverage is configured in `vitest.config.mts`:

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  include: ['src/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.spec.ts'],
  thresholds: {
    lines: 50,
    functions: 50,
    branches: 30,
    statements: 50,
  },
}
```

### Adjusting Thresholds

To increase coverage requirements, edit `vitest.config.mts`:

```typescript
thresholds: {
  lines: 80,      // Increase from 50 to 80
  functions: 80,  // Increase from 50 to 80
  branches: 70,   // Increase from 30 to 70
  statements: 80, // Increase from 50 to 80
}
```

## Codecov Features

Once set up, Codecov provides:

### 1. Coverage Reports
- Line-by-line coverage visualization
- File-level coverage metrics
- Historical coverage trends

### 2. Pull Request Comments
- Automatic comments on PRs with coverage changes
- Shows which lines are covered/uncovered
- Highlights coverage increases/decreases

### 3. Coverage Badges
- Display coverage percentage in README
- Updates automatically with each push
- Multiple badge styles available

### 4. Coverage Graphs
- Sunburst chart showing file coverage
- Icicle chart for directory structure
- Line graphs for coverage trends over time

### 5. Notifications
- Email notifications for coverage drops
- Slack/Discord integrations available
- Customizable notification rules

## Best Practices

### 1. Set Coverage Goals

Configure coverage thresholds in `vitest.config.mts` to enforce minimum coverage:

```typescript
thresholds: {
  lines: 80,
  functions: 80,
  branches: 70,
  statements: 80,
}
```

### 2. Monitor Coverage Trends

- Check Codecov dashboard regularly
- Watch for coverage drops in PRs
- Aim for gradual coverage increases

### 3. Write Meaningful Tests

- Focus on testing critical paths
- Don't just aim for 100% coverage
- Test edge cases and error handling

### 4. Use Coverage Reports

- Identify untested code
- Prioritize testing high-risk areas
- Review coverage before releases

## Additional Configuration (Optional)

### Codecov Configuration File

Create `.codecov.yml` in repository root for advanced configuration:

```yaml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 1%
    patch:
      default:
        target: 80%

comment:
  layout: "reach,diff,flags,tree"
  behavior: default
  require_changes: false
```

### Ignore Files

Add to `.codecov.yml` to exclude files from coverage:

```yaml
ignore:
  - "tests/**/*"
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "benchmarks/**/*"
```

## Summary

**Required Action:**

1. ✅ Get Codecov token from [codecov.io](https://codecov.io/)
2. ✅ Add `CODECOV_TOKEN` to GitHub repository secrets
3. ✅ Push a commit to trigger CI workflow
4. ✅ Verify coverage upload succeeds

**Benefits:**

- ✅ Secure token-based authentication
- ✅ Reliable coverage uploads
- ✅ Detailed coverage reports and trends
- ✅ Automatic PR comments with coverage changes
- ✅ Coverage badges for README

**Next Steps:**

1. Set up Codecov token (see Step 1-2 above)
2. Monitor first coverage upload
3. Configure coverage thresholds as needed
4. Review coverage reports on Codecov dashboard

---

**Last Updated:** 2025-10-13  
**Maintained By:** Repository Administrators

