# Contributing to om-data-mapper

Thank you for your interest in contributing to `om-data-mapper`! We welcome contributions from the community and are grateful for your support.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to aleksandr.melnik.personal@gmail.com.

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm 10.x or higher
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/data-mapper.git
   cd data-mapper
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/Isqanderm/data-mapper.git
   ```

## Development Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Build the project:

   ```bash
   pnpm run build
   ```

3. Run tests:

   ```bash
   pnpm test
   ```

4. Run linting:

   ```bash
   pnpm run lint
   ```

5. Format code:
   ```bash
   pnpm run format
   ```

### Available Scripts

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm run build` - Watch mode for development
- `pnpm test` - Run tests with coverage
- `pnpm run test:watch` - Run tests in watch mode
- `pnpm run lint` - Check code for linting errors
- `pnpm run lint:fix` - Fix linting errors automatically
- `pnpm run format` - Format code with Prettier
- `pnpm run format:check` - Check code formatting
- `pnpm run clean` - Remove build artifacts

## Making Changes

### Create a Branch

Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications
- `chore/` - Maintenance tasks

### Make Your Changes

1. Write your code following our [coding standards](#coding-standards)
2. Add or update tests as needed
3. Update documentation if necessary
4. Ensure all tests pass: `pnpm test`
5. Ensure linting passes: `pnpm run lint`
6. Ensure formatting is correct: `pnpm run format:check`

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This enables automatic changelog generation and semantic versioning.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools
- `ci`: Changes to CI configuration files and scripts

### Examples

```bash
# Feature
git commit -m "feat: add support for nested array mapping"

# Bug fix
git commit -m "fix: resolve issue with undefined values in deep mapping"

# Documentation
git commit -m "docs: update README with new examples"

# Breaking change
git commit -m "feat!: redesign mapper API

BREAKING CHANGE: The create method now requires explicit type parameters"
```

### Scope (Optional)

The scope should be the name of the affected module:

- `mapper`
- `utils`
- `types`
- `ci`
- `deps`

Example:

```bash
git commit -m "feat(mapper): add caching support"
```

## Pull Request Process

### Before Submitting

1. Update your branch with the latest changes from upstream:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. Ensure all checks pass:

   ```bash
   pnpm run build
   pnpm test
   pnpm run lint
   pnpm run format:check
   ```

3. Update documentation if needed

### Submitting a Pull Request

1. Push your branch to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

2. Go to the repository on GitHub and create a Pull Request

3. Fill out the PR template with:
   - Clear description of changes
   - Related issue numbers (if applicable)
   - Screenshots (if UI changes)
   - Checklist completion

4. Wait for review and address feedback

### PR Requirements

- ✅ All tests pass
- ✅ **Code coverage maintained or improved** (blocking requirement)
- ✅ Code is linted and formatted
- ✅ Documentation is updated
- ✅ Commit messages follow conventions
- ✅ No merge conflicts
- ✅ Approved by at least one maintainer

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Provide proper type annotations
- Avoid `any` type when possible
- Use interfaces for object shapes
- Use type aliases for complex types

### Code Style

- Follow the existing code style
- Use meaningful variable and function names
- Keep functions small and focused
- Add comments for complex logic
- Use JSDoc for public APIs

### File Organization

```
src/
  ├── Mapper.ts       # Main mapper class
  ├── interface.ts    # Type definitions
  ├── utils.ts        # Utility functions
  └── index.ts        # Public exports
```

## Testing

### 🛡️ Code Coverage Protection

**Important:** This repository has automated code coverage protection enabled. All pull requests must maintain or improve the current code coverage percentage.

- ✅ **Coverage maintained or improved** → PR can be merged
- ❌ **Coverage decreased** → PR is automatically blocked

When you submit a PR, the CI will:

1. Run tests on your branch and collect coverage
2. Run tests on the main branch and collect coverage
3. Compare the coverage metrics
4. Post a detailed comparison comment on your PR
5. **Block the PR from merging** if coverage decreases

Coverage thresholds are enforced via the `coverage.thresholds` config in
[`vitest.config.mts`](./vitest.config.mts); run `pnpm test` locally (it runs with coverage enabled) to see your numbers before opening a PR.

### Writing Tests

- Write tests for all new features
- Write tests for bug fixes
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- **Ensure your tests cover all new/modified code**

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { Mapper, Map, plainToInstance } from '../src';

@Mapper()
class ExampleMapper {
  @Map('sourceField')
  targetField!: string;
}

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = {
      sourceField: 'value',
    };

    // Act
    const result = plainToInstance(ExampleMapper, input);

    // Assert
    expect(result).toEqual({ targetField: 'value' });
  });
});
```

`Mapper` here is the class decorator (the only mapping API this package publishes) — not the
retired `Mapper.create()` class API, which is no longer re-exported from `../src` at all. See
[docs/transformer-usage.md](./docs/transformer-usage.md) for the full Decorator API guide.

### Running Tests

```bash
# Run all tests with coverage
pnpm test

# Run tests in watch mode
pnpm run test:watch

# Run specific test file
pnpm exec vitest tests/smoke.test.ts
```

### Checking Coverage Locally

Before submitting your PR, verify that coverage is maintained:

```bash
# Run tests with coverage
pnpm test

# Open the HTML coverage report
open coverage/index.html

# Check coverage summary in terminal
# The output will show coverage percentages for:
# - Lines
# - Statements
# - Functions
# - Branches
```

The HTML report will highlight:

- ✅ **Green**: Covered lines
- ❌ **Red**: Uncovered lines
- ⚠️ **Yellow**: Partially covered branches

Focus on covering the red and yellow lines in your tests.

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Include examples in documentation
- Document parameters and return types
- Explain complex algorithms

### README Updates

- Update README.md for new features
- Add examples for new functionality
- Keep installation instructions current
- Update API documentation section

### Examples

Add examples to the `example/` directory:

- Create a new directory for your example
- Include a README explaining the example
- Provide runnable code

## Getting Help

### Questions

- Check existing [issues](https://github.com/Isqanderm/data-mapper/issues)
- Search [discussions](https://github.com/Isqanderm/data-mapper/discussions)
- Ask in a new discussion thread

### Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml) and include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Code samples

### Requesting Features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml) and include:

- Clear description of the feature
- Use cases and benefits
- Proposed API (if applicable)
- Alternatives considered

## Recognition

Contributors will be recognized in:

- GitHub contributors list
- Release notes (for significant contributions)
- CHANGELOG.md

## License

By contributing to `om-data-mapper`, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to `om-data-mapper`! 🎉
