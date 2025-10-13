# Repository Policies and Recommended Settings

This document outlines the recommended GitHub repository settings and branch protection rules for the `om-data-mapper` project. These settings help maintain code quality, security, and a smooth contribution workflow.

**Note:** These settings must be configured manually in the GitHub repository UI. This document serves as a reference for repository administrators.

---

## Branch Protection Rules

### Main Branch (`main`)

The `main` branch should be protected with the following rules to ensure code quality and prevent accidental changes.

#### Required Settings

**Navigate to:** Repository Settings → Branches → Add branch protection rule

**Branch name pattern:** `main`

#### Protection Rules

1. **Require a pull request before merging**
   - ✅ Enable this setting
   - **Require approvals:** 1-2 (recommended: 1 for small teams, 2 for larger teams)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require review from Code Owners (if CODEOWNERS file is configured)

2. **Require status checks to pass before merging**
   - ✅ Enable this setting
   - ✅ Require branches to be up to date before merging
   - **Required status checks:**
     - `test` (from CI workflow)
     - `CodeQL` (from CodeQL workflow)
     - `build` (if separate build job exists)
     - Coverage checks (optional - can be set to non-blocking)

3. **Require conversation resolution before merging**
   - ✅ Enable this setting
   - Ensures all review comments are addressed before merging

4. **Require signed commits** (optional but recommended)
   - ⚠️ Optional: Enable if your team uses GPG signing
   - Provides additional security and authenticity

5. **Require linear history** (optional)
   - ⚠️ Optional: Enable to enforce rebase/squash merging
   - Keeps git history clean and linear

6. **Include administrators**
   - ⚠️ Recommended: Do NOT include administrators in restrictions
   - Allows admins to bypass rules in emergency situations
   - Alternatively, enable for maximum security

7. **Restrict who can push to matching branches**
   - ✅ Enable this setting
   - **Allowed to push:** None (all changes via PR)
   - **Allowed to force push:** None
   - **Allow deletions:** ❌ Disable

8. **Allow force pushes**
   - ❌ Disable this setting
   - Prevents history rewriting on protected branch

9. **Allow deletions**
   - ❌ Disable this setting
   - Prevents accidental branch deletion

---

## Additional Branch Protection (Optional)

### Development/Staging Branches

If you use additional long-lived branches (e.g., `develop`, `staging`), consider applying similar but slightly relaxed rules:

- Require pull request reviews: 1 approval
- Require status checks: Same as main
- Allow force pushes: ❌ No
- Allow deletions: ❌ No

---

## Repository Settings

### General Settings

**Navigate to:** Repository Settings → General

#### Features

- ✅ **Wikis:** Enable if you want community-editable documentation
- ✅ **Issues:** Enable for bug reports and feature requests
- ✅ **Sponsorships:** Enable if you have GitHub Sponsors configured
- ✅ **Discussions:** Enable for community Q&A and discussions (recommended)
- ✅ **Projects:** Enable if using GitHub Projects for project management

#### Pull Requests

- ✅ **Allow merge commits:** Enable
- ✅ **Allow squash merging:** Enable (recommended default)
- ✅ **Allow rebase merging:** Enable
- ✅ **Always suggest updating pull request branches:** Enable
- ✅ **Automatically delete head branches:** Enable (keeps repo clean)

#### Archives

- ❌ **Archive this repository:** Keep disabled unless deprecating

---

## Security Settings

### Security & Analysis

**Navigate to:** Repository Settings → Security & analysis

#### Dependency Graph

- ✅ **Dependency graph:** Enable
- Automatically enabled for public repositories

#### Dependabot Alerts

- ✅ **Dependabot alerts:** Enable
- Notifies you of security vulnerabilities in dependencies

#### Dependabot Security Updates

- ✅ **Dependabot security updates:** Enable
- Automatically creates PRs to update vulnerable dependencies

#### Code Scanning

- ✅ **CodeQL analysis:** Enable (already configured via workflow)
- Runs automated security scanning on code

#### Secret Scanning

- ✅ **Secret scanning:** Enable
- Automatically enabled for public repositories
- Detects accidentally committed secrets

#### Private Vulnerability Reporting

- ✅ **Private vulnerability reporting:** Enable
- Allows security researchers to privately report vulnerabilities

---

## Code Owners (Optional)

### CODEOWNERS File

Create a `.github/CODEOWNERS` file to automatically request reviews from specific people or teams:

```
# Default owners for everything in the repo
* @Isqanderm

# Specific owners for source code
/src/ @Isqanderm

# Specific owners for CI/CD
/.github/ @Isqanderm

# Specific owners for documentation
/README.md @Isqanderm
/CONTRIBUTING.md @Isqanderm
```

**Benefits:**
- Automatic reviewer assignment
- Ensures domain experts review relevant changes
- Enforces review requirements via branch protection

---

## Repository Topics/Keywords

### Recommended Topics

**Navigate to:** Repository main page → About section → Settings (gear icon) → Topics

Add the following topics to improve discoverability:

- `typescript`
- `javascript`
- `mapper`
- `data-mapping`
- `object-mapper`
- `performance`
- `jit-compiler`
- `type-safe`
- `data-transformation`
- `dto`
- `serialization`
- `high-performance`

**Benefits:**
- Improved discoverability in GitHub search
- Better categorization
- Attracts relevant contributors

---

## Notifications and Integrations

### Recommended Integrations

1. **Codecov**
   - Already configured via CI workflow
   - Provides coverage reports and trends

2. **Dependabot**
   - Already configured via `.github/dependabot.yml`
   - Automated dependency updates

3. **GitHub Actions**
   - CI/CD workflows already configured
   - Automated testing, linting, and releases

### Notification Settings

**For Repository Administrators:**

- Watch the repository for all activity
- Enable notifications for:
  - Pull requests
  - Issues
  - Security alerts
  - Dependabot alerts

---

## Access and Permissions

### Collaborator Access Levels

**Navigate to:** Repository Settings → Collaborators and teams

#### Recommended Access Levels

- **Admin:** Repository owner and core maintainers only
- **Maintain:** Trusted long-term contributors
- **Write:** Regular contributors (can push to non-protected branches)
- **Triage:** Community moderators (can manage issues/PRs)
- **Read:** Public (default for public repositories)

#### Best Practices

- Minimize the number of users with Admin access
- Use teams for group permissions
- Regularly audit collaborator access
- Remove inactive collaborators

---

## Automation Rules (GitHub Actions)

### Existing Workflows

The repository already has the following automated workflows:

1. **CI Workflow** (`.github/workflows/ci.yml`)
   - Runs on: Push, Pull Request
   - Actions: Build, Test, Coverage

2. **CodeQL Workflow** (`.github/workflows/codeql.yml`)
   - Runs on: Push, Pull Request, Schedule (weekly)
   - Actions: Security scanning

3. **Release Workflow** (`.github/workflows/release.yml`)
   - Runs on: Push to main
   - Actions: Semantic versioning, GitHub releases, npm publish

### Recommended Additional Workflows (Optional)

- **Stale Issue/PR Management:** Auto-close stale issues/PRs
- **Welcome Bot:** Greet first-time contributors
- **Label Sync:** Keep labels consistent across repositories

---

## Issue and Pull Request Templates

### Existing Templates

The repository should have the following templates (to be created in Step 9):

- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/PULL_REQUEST_TEMPLATE.md`

### Benefits

- Consistent issue/PR format
- Ensures necessary information is provided
- Reduces back-and-forth communication
- Improves triage efficiency

---

## Maintenance Checklist

### Weekly

- [ ] Review and merge Dependabot PRs
- [ ] Triage new issues
- [ ] Review open pull requests

### Monthly

- [ ] Review security alerts
- [ ] Audit collaborator access
- [ ] Check CI/CD workflow performance
- [ ] Review and update documentation

### Quarterly

- [ ] Review branch protection rules
- [ ] Update repository topics/keywords
- [ ] Review and update CODEOWNERS
- [ ] Audit integrations and webhooks

---

## Summary

By implementing these policies and settings, the `om-data-mapper` repository will have:

✅ Protected main branch with required reviews and status checks  
✅ Automated security scanning and vulnerability alerts  
✅ Automated dependency updates  
✅ Clean and organized contribution workflow  
✅ Clear access controls and permissions  
✅ Improved discoverability through topics  
✅ Comprehensive automation via GitHub Actions  

**Next Steps:**

1. Apply branch protection rules to `main` branch
2. Enable security features in repository settings
3. Add repository topics for discoverability
4. Configure CODEOWNERS file (optional)
5. Review and adjust settings based on team needs

---

**Last Updated:** 2025-10-13  
**Maintained By:** Repository Administrators

