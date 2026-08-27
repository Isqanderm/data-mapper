# Security Policy

## Supported Versions

We provide security updates **only for version 4.0.0 and above**. Versions below 4.0.0 are no longer supported and will not receive security patches.

| Version | Supported          |
| ------- | ------------------ |
| 4.x.x   | :white_check_mark: |
| < 4.0.0 | :x:                |

**Note:** If you are using a version below 4.0.0, we strongly recommend upgrading to the latest 4.x.x version to receive security updates and bug fixes.

## Reporting a Vulnerability

We take the security of `om-data-mapper` seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them using one of the following methods:

1. **GitHub Security Advisories (Preferred)**
   - Navigate to the [Security tab](https://github.com/Isqanderm/data-mapper/security/advisories) of this repository
   - Click "Report a vulnerability"
   - Fill out the form with details about the vulnerability

2. **Email**
   - Send an email to: aleksandr.melnik.personal@gmail.com
   - Include the word "SECURITY" in the subject line
   - Provide a detailed description of the vulnerability

### What to Include in Your Report

Please include the following information in your report:

- Type of vulnerability (e.g., XSS, SQL injection, code injection, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Status Update**: We will send you regular updates about our progress, at least every 5 business days
- **Resolution**: We aim to resolve critical vulnerabilities within 30 days of the initial report

### What to Expect

After you submit a report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find any similar problems
3. Prepare fixes for all supported versions
4. Release new versions and publish a security advisory

### Disclosure Policy

- We request that you give us reasonable time to address the vulnerability before any public disclosure
- We will credit you in the security advisory (unless you prefer to remain anonymous)
- We will keep you informed about our progress toward a fix

### Security Update Process

When we release a security update:

1. We will publish a GitHub Security Advisory
2. We will release a new version with the fix
3. We will update the CHANGELOG.md with security fix details
4. We will notify users through GitHub releases and npm

## Security Best Practices for Users

When using `om-data-mapper`:

1. Always use the latest version to ensure you have the latest security patches
2. Review the CHANGELOG.md for security-related updates
3. Enable Dependabot or similar tools to get notified of security updates
4. Follow the principle of least privilege when processing untrusted data
5. Validate and sanitize all input data before mapping

### ⚠️ Critical: Dynamic Code Generation Security

The **Decorator API** (`@Mapper`, `@Map`, `@Transform`, etc.) is the only mapping API this
package publishes — `packages/core/src/index.ts` does not re-export the legacy `Mapper` class,
and there is no deep-import subpath for it, so it cannot be reached by any consumer of the
published package. The Decorator API compiles field paths into a function body via
`new Function()` for performance. Keys and paths are emitted through JSON-escaped bracket access
(`packages/core/src/decorators/core.ts`), so arbitrary key/path strings — including kebab-case
keys or keys containing quotes — cannot break out of the generated string literal.

#### ✅ Safe Usage

```typescript
// ✅ SAFE: mapping paths are literal strings written by a developer in source
// code, evaluated once at class-definition time — never derived from a
// request at runtime
@Mapper()
class UserDTO {
  @Map('user.fullName')
  name: string;

  @Map('user.email')
  email: string;
}
```

#### ❌ Unsafe Usage - NEVER DO THIS

```typescript
// ❌ DANGEROUS: building a decorator argument from untrusted runtime data
const path = request.query.mappingPath; // attacker-controlled

@Mapper()
class UserDTO {
  @Map(path) // NEVER pass a runtime-derived string here
  name: string;
}
```

**Why this matters**: a `@Map` argument is compiled into generated source. The generator escapes
what it's given, but mapping paths should always be literal strings a developer wrote, never a
value threaded through from request data at runtime.

> **The legacy `Mapper.create()` class API is not part of the published surface, and it is not
> safe.** `packages/core/src/core/Mapper.ts` keeps a `Mapper` class around only as an internal
> implementation detail — the decorator API references it in type position and the core
> package's own tests exercise it via direct `src` imports, but no consumer can import it. It
> also has its own unescaped-interpolation hazard the decorator API's generator does not share
> (see the `@internal` warning at the top of that file): it interpolates config-derived keys and
> paths verbatim into generated source, so a kebab-case key compiles to a `SyntaxError` and a
> quote-bearing key escapes the string literal and injects code, regardless of how trusted the
> source of that config is. It has not been fixed to match the Decorator API's JSON-escaped
> codegen. Do not treat any example using `Mapper.create()` as safe, supported guidance.

See the class documentation and `docs/transformer-usage.md` for more details.

## Additional Resources

- [GitHub Security Advisories](https://github.com/Isqanderm/data-mapper/security/advisories)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Comments on This Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue.

---

Thank you for helping keep `om-data-mapper` and its users safe!
