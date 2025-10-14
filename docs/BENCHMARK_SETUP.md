# Automated Benchmark Setup Guide

This guide explains how the automated benchmark system works and how to set it up.

## 🎯 Overview

The project uses **GitHub Actions + github-action-benchmark** to automatically:

1. ✅ Run benchmarks on every PR
2. ✅ Post results as PR comments
3. ✅ Track performance history on GitHub Pages
4. ✅ Alert on performance regressions
5. ✅ Update existing comments (no spam)

## 📊 What You Get

### On Every Pull Request

Automatic comment with benchmark results:

```
🚀 Performance Benchmark Results

📊 om-data-mapper vs class-transformer Comparison

┌─────────────────────────────────────────┬──────────────┬─────────────────┐
│ Scenario                                │ Winner       │ Performance     │
├─────────────────────────────────────────┼──────────────┼─────────────────┤
│ Simple Transformation                   │ om-data-mapper │ +1370.91% faster │
│ Complex Nested Transformation           │ om-data-mapper │ +4362.85% faster │
│ Array Transformation                    │ om-data-mapper │ +1146.48% faster │
│ Custom Transformation                   │ om-data-mapper │ +1360.77% faster │
│ Exclude/Expose                          │ om-data-mapper │ +569.96% faster │
└─────────────────────────────────────────┴──────────────┴─────────────────┘

✨ om-data-mapper won 5/5 scenarios
⚡ Average performance improvement: 1762.19%
```

### On Main Branch

- Historical data stored in `gh-pages` branch
- Interactive charts at: `https://isqanderm.github.io/data-mapper/dev/bench/`
- Performance trend tracking over time

## 🛠️ Setup Instructions

### 1. Enable GitHub Pages (One-Time Setup)

1. Go to your repository settings
2. Navigate to **Pages** section
3. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

The workflow will automatically create the `gh-pages` branch on the first run.

### 2. Verify Workflow Permissions

Ensure GitHub Actions has write permissions:

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Click **Save**

### 3. Test the Setup

Create a test PR to verify everything works:

```bash
git checkout -b test-benchmark
git commit --allow-empty -m "test: trigger benchmark"
git push origin test-benchmark
```

Then create a PR and check:
- ✅ Benchmark workflow runs successfully
- ✅ Comment appears on the PR
- ✅ Results are formatted correctly

## 📁 File Structure

```
.github/workflows/
  └── benchmark.yml          # Main workflow file

benchmarks/suites/compat/
  ├── comparison.js          # Human-readable output
  ├── comparison-json.js     # JSON output for tracking
  ├── models-ct.ts           # class-transformer models
  ├── models-om.ts           # om-data-mapper models
  └── README.md              # Benchmark documentation

package.json
  └── scripts:
      ├── bench:compat       # Run comparison (formatted)
      └── bench:compat:json  # Run comparison (JSON)
```

## 🔧 How It Works

### Workflow Triggers

The benchmark workflow runs on:

- **Pull Requests** to `main` branch
- **Pushes** to `main` branch
- **Manual trigger** via workflow_dispatch

### Workflow Steps

1. **Checkout code** - Gets the latest code
2. **Setup Node.js** - Installs Node.js 20
3. **Install dependencies** - Runs `npm ci`
4. **Build project** - Compiles TypeScript
5. **Build benchmarks** - Compiles benchmark models
6. **Run benchmarks** - Executes all benchmark suites
7. **Generate JSON** - Creates JSON output for tracking
8. **Store results** - Saves to GitHub Pages (main only)
9. **Comment PR** - Posts results to PR (PRs only)

### Data Storage

- **Main branch**: Results stored in `gh-pages` branch at `dev/bench/`
- **Pull requests**: Results posted as comments only (not stored)

### Performance Alerts

If performance degrades by >150%:

- ⚠️ Alert comment on commit
- 📧 Notification to `@Isqanderm`
- ❌ Workflow does NOT fail (configurable)

## 🎨 Customization

### Change Alert Threshold

Edit `.github/workflows/benchmark.yml`:

```yaml
- name: Store benchmark result
  uses: benchmark-action/github-action-benchmark@v1
  with:
    alert-threshold: '150%'  # Change this value
```

### Fail on Performance Regression

```yaml
- name: Store benchmark result
  uses: benchmark-action/github-action-benchmark@v1
  with:
    fail-on-alert: true  # Change to true
```

### Change Benchmark Scenarios

Edit `benchmarks/suites/compat/comparison-json.js` to add/remove scenarios.

### Customize PR Comment Format

Edit the `Comment PR with comparison results` step in `benchmark.yml`.

## 📈 Viewing Historical Data

After the first merge to `main`:

1. Visit: `https://isqanderm.github.io/data-mapper/dev/bench/`
2. View interactive charts
3. Compare performance over time
4. Identify trends and regressions

## 🐛 Troubleshooting

### Workflow Fails with "Permission Denied"

**Solution**: Enable write permissions in repository settings (see Setup step 2)

### No Comment on PR

**Possible causes**:
1. Workflow didn't run (check Actions tab)
2. Benchmark failed (check workflow logs)
3. Bot doesn't have permission to comment

**Solution**: Check workflow logs for errors

### GitHub Pages Not Working

**Possible causes**:
1. `gh-pages` branch doesn't exist yet
2. GitHub Pages not enabled
3. Wrong branch/folder selected

**Solution**: 
1. Wait for first merge to `main` to create `gh-pages` branch
2. Enable GitHub Pages in settings (see Setup step 1)

### Benchmark Results Look Wrong

**Solution**: 
1. Check if `npm run bench:compat` works locally
2. Verify `comparison-json.js` outputs valid JSON
3. Check workflow logs for errors

## 🔄 Updating Benchmarks

### Add New Scenario

1. Edit `benchmarks/suites/compat/comparison.js`
2. Add new benchmark suite
3. Edit `benchmarks/suites/compat/comparison-json.js`
4. Add corresponding JSON output
5. Update `totalSuites` counter
6. Test locally: `npm run bench:compat:json`

### Remove Scenario

1. Remove from both `comparison.js` and `comparison-json.js`
2. Update `totalSuites` counter
3. Test locally

## 📚 Related Documentation

- [GitHub Action Benchmark](https://github.com/benchmark-action/github-action-benchmark)
- [Benchmark.js Documentation](https://benchmarkjs.com/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 💡 Tips

1. **Keep benchmarks fast**: Long-running benchmarks slow down CI
2. **Use meaningful names**: Clear scenario names help identify regressions
3. **Monitor trends**: Check GitHub Pages regularly for performance trends
4. **Test locally first**: Always run `npm run bench:compat` before pushing
5. **Update documentation**: Keep this guide updated when changing benchmarks

## 🎯 Next Steps

After setup is complete:

1. ✅ Merge this PR to `main`
2. ✅ Verify GitHub Pages is accessible
3. ✅ Create a test PR to verify comments work
4. ✅ Monitor performance trends over time
5. ✅ Celebrate automated benchmarking! 🎉

