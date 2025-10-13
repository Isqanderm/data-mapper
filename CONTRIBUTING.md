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
- npm 10.x or higher
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
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Run linting:
   ```bash
   npm run lint
   ```

5. Format code:
   ```bash
   npm run format
   ```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:watch` - Watch mode for development
- `npm test` - Run tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Fix linting errors automatically
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run clean` - Remove build artifacts

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
4. Ensure all tests pass: `npm test`
5. Ensure linting passes: `npm run lint`
6. Ensure formatting is correct: `npm run format:check`

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
   npm run build
   npm test
   npm run lint
   npm run format:check
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

### Writing Tests

- Write tests for all new features
- Write tests for bug fixes
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Aim for high code coverage

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { Mapper } from '../src';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange
    const input = { /* ... */ };
    
    // Act
    const result = Mapper.create(/* ... */).execute(input);
    
    // Assert
    expect(result).toEqual(/* ... */);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest tests/smoke.test.ts
```

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

