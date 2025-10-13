# GitHub Actions Setup Guide

This document provides step-by-step instructions for configuring GitHub repository settings to enable automated releases and publishing with semantic-release.

## Problem

The semantic-release workflow requires specific permissions to:
- Create and push git tags
- Create GitHub releases
- Update CHANGELOG.md and package.json
- Publish to npm registry

By default, GitHub Actions has limited permissions that prevent these operations.

## Solution

Configure the repository settings to grant GitHub Actions the necessary permissions.

---

## Step 1: Configure Workflow Permissions

### Navigate to Repository Settings

1. Go to your repository on GitHub
2. Click **Settings** (top navigation)
3. In the left sidebar, click **Actions** → **General**

### Update Workflow Permissions

Scroll down to the **Workflow permissions** section and configure:

1. **Select:** "Read and write permissions"
   - This allows workflows to push commits and tags
   
2. **Check:** ✅ "Allow GitHub Actions to create and approve pull requests"
   - This enables automated PR creation (useful for Dependabot and other automations)

3. Click **Save** to apply changes

### Why This Is Needed

- **Read and write permissions:** Allows semantic-release to push version tags and update files
- **Create PRs:** Enables Dependabot and other automation tools to create pull requests

---

## Step 2: Add NPM Token (For Publishing)

If you want to publish to npm automatically, you need to add an NPM token.

### Generate NPM Token

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Click your profile icon → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** type (recommended for CI/CD)
5. Copy the generated token (you won't see it again!)

### Add Token to GitHub Secrets

1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **Add secret**

### Why This Is Needed

- Semantic-release uses this token to publish new versions to npm
- Without it, the release will succeed on GitHub but won't publish to npm

---

## Step 3: Verify Release Workflow Configuration

The release workflow (`.github/workflows/release.yml`) should have:

```yaml
permissions:
  contents: write      # Push tags and commits
  issues: write        # Comment on issues
  pull-requests: write # Comment on PRs
```

This is already configured in the repository.

---

## Step 4: Test the Setup

### Trigger a Release

1. Make sure you're on the `main` branch
2. Create a commit with a conventional commit message:
   ```bash
   git commit -m "feat: add new feature"
   # or
   git commit -m "fix: resolve bug"
   ```
3. Push to main:
   ```bash
   git push origin main
   ```

### Monitor the Workflow

1. Go to **Actions** tab in your repository
2. Watch the **Release** workflow run
3. Check for any errors

### Expected Outcome

If everything is configured correctly:
- ✅ Workflow completes successfully
- ✅ New version tag is created (e.g., `v2.0.6`)
- ✅ GitHub release is created with changelog
- ✅ CHANGELOG.md is updated
- ✅ package.json version is bumped
- ✅ Package is published to npm (if NPM_TOKEN is configured)

---

## Troubleshooting

### Error: Permission Denied

**Symptom:**
```
remote: Permission to Isqanderm/data-mapper.git denied to github-actions[bot].
```

**Solution:**
- Verify **Workflow permissions** are set to "Read and write permissions"
- Make sure you saved the settings

### Error: NPM Publish Failed

**Symptom:**
```
npm ERR! code ENEEDAUTH
npm ERR! need auth This command requires you to be logged in.
```

**Solution:**
- Add `NPM_TOKEN` secret to repository
- Verify the token is valid and has publish permissions
- Check that the token type is "Automation"

### Error: No Release Created

**Symptom:**
- Workflow runs successfully but no release is created

**Solution:**
- Check commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
- Valid prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `ci:`
- Breaking changes: Add `BREAKING CHANGE:` in commit body or use `!` (e.g., `feat!:`)

### Error: Fetch Depth Issue

**Symptom:**
```
semantic-release cannot analyze commits
```

**Solution:**
- Verify `fetch-depth: 0` is set in checkout action (already configured)
- This ensures full git history is available

---

## Conventional Commits Guide

Semantic-release uses commit messages to determine version bumps:

### Patch Release (2.0.5 → 2.0.6)

```bash
git commit -m "fix: correct mapping error"
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
```

### Minor Release (2.0.5 → 2.1.0)

```bash
git commit -m "feat: add new mapping feature"
```

### Major Release (2.0.5 → 3.0.0)

```bash
git commit -m "feat!: redesign API

BREAKING CHANGE: The API has been completely redesigned"
```

Or:

```bash
git commit -m "feat: redesign API

BREAKING CHANGE: The API has been completely redesigned"
```

---

## Security Considerations

### Protect Secrets

- ✅ Never commit tokens to the repository
- ✅ Use GitHub Secrets for sensitive data
- ✅ Rotate tokens periodically
- ✅ Use minimal permissions (Automation token for npm)

### Branch Protection

- ✅ Enable branch protection on `main`
- ✅ Require status checks to pass
- ✅ Require pull request reviews
- ✅ See `reports/policies.md` for detailed recommendations

---

## Additional Configuration (Optional)

### Customize Release Behavior

Edit `.releaserc.json` to customize semantic-release:

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

### Skip CI on Release Commits

The release workflow automatically adds `[skip ci]` to release commits to prevent infinite loops.

---

## Verification Checklist

Before pushing to main, verify:

- [ ] Workflow permissions set to "Read and write permissions"
- [ ] "Allow GitHub Actions to create and approve pull requests" is checked
- [ ] NPM_TOKEN secret is added (if publishing to npm)
- [ ] Release workflow has proper permissions in YAML
- [ ] Commits follow Conventional Commits format
- [ ] All tests pass locally

---

## Summary

**Required Settings:**

1. **Actions → General → Workflow permissions:**
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

2. **Secrets → Actions:**
   - ✅ NPM_TOKEN (for npm publishing)

**Workflow Features:**

- ✅ Automatic version bumping based on commits
- ✅ Changelog generation
- ✅ GitHub releases
- ✅ npm publishing
- ✅ Git tag creation

**Next Steps:**

1. Configure repository settings as described above
2. Merge changes to `main` branch
3. Push a commit with conventional commit message
4. Monitor the release workflow
5. Verify release is created successfully

---

**Last Updated:** 2025-10-13  
**Maintained By:** Repository Administrators

