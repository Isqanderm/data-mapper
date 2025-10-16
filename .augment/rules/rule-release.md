---
type: "manual"
---

# Release Management Guide for om-data-mapper

## 🎯 Цель

Эта инструкция описывает процесс создания релизов для проекта `om-data-mapper`. Следуя этой инструкции, ИИ-ассистент может автоматически подготовить и опубликовать новую версию проекта.

## 📋 Когда использовать

Создавайте новый релиз в следующих случаях:

1. **После мержа feature branch в main** - когда новая функциональность готова к публикации
2. **После исправления критических багов** - hotfix релизы
3. **После накопления нескольких minor изменений** - patch релизы
4. **По запросу пользователя** - когда пользователь явно просит создать релиз

**НЕ создавайте релиз:**
- Из feature branch (только из main/master)
- Без прохождения всех тестов
- Без обновления документации
- Без согласования с пользователем (для major релизов)

---

## 📊 Semantic Versioning (SemVer)

Проект следует [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─── PATCH: Bug fixes (backward compatible)
  │     └───────── MINOR: New features (backward compatible)
  └─────────────── MAJOR: Breaking changes (NOT backward compatible)
```

### Как определить версию:

#### MAJOR (x.0.0) - Breaking Changes
Увеличивайте MAJOR версию, когда:
- ❌ Удаляете публичные API
- ❌ Меняете сигнатуры существующих функций
- ❌ Меняете поведение существующих функций (breaking change)
- ❌ Удаляете или переименовываете экспортируемые классы/функции
- ❌ Меняете формат данных (например, формат ошибок валидации)

**Примеры:**
- Удаление deprecated API
- Изменение формата возвращаемых ошибок
- Переименование декораторов

#### MINOR (x.y.0) - New Features
Увеличивайте MINOR версию, когда:
- ✅ Добавляете новые функции (backward compatible)
- ✅ Добавляете новые декораторы
- ✅ Добавляете новые опции (с дефолтными значениями)
- ✅ Улучшаете производительность (без breaking changes)
- ✅ Добавляете новые тесты или улучшаете покрытие
- ✅ Deprecate существующие API (но не удаляете)

**Примеры:**
- Добавление новых валидаторов (@IsEmail, @IsURL)
- Добавление property-based тестов
- Улучшение производительности на 2x

#### PATCH (x.y.z) - Bug Fixes
Увеличивайте PATCH версию, когда:
- 🐛 Исправляете баги (backward compatible)
- 📝 Обновляете документацию
- 🔧 Исправляете опечатки
- 🧪 Исправляете тесты (без изменения кода)
- 🔒 Исправляете уязвимости безопасности (без breaking changes)

**Примеры:**
- Исправление memory leak
- Исправление неправильной валидации
- Обновление README

### Текущая версия проекта

Текущая версия всегда указана в `package.json`:

```json
{
  "version": "4.0.4"
}
```

**Следующая версия зависит от типа изменений:**
- Bug fixes → 4.0.5 (PATCH)
- New features → 4.1.0 (MINOR)
- Breaking changes → 5.0.0 (MAJOR)

---

## ✅ Checklist перед релизом

Перед созданием релиза **ОБЯЗАТЕЛЬНО** проверьте:

### 1. Код и тесты
- [ ] Все тесты проходят (`npm test`)
- [ ] Coverage не упал (проверить в отчете)
- [ ] Build успешен (`npm run build`)
- [ ] Lint проходит (`npm run lint`)
- [ ] Нет TypeScript ошибок

### 2. Документация
- [ ] README.md обновлен (если нужно)
- [ ] CHANGELOG.md обновлен
- [ ] Документация в `docs/` актуальна
- [ ] Примеры в `examples/` работают

### 3. Версионирование
- [ ] Версия в `package.json` корректна
- [ ] Версия соответствует типу изменений (SemVer)
- [ ] CHANGELOG.md содержит секцию для новой версии

### 4. Git
- [ ] Все изменения закоммичены
- [ ] Коммиты следуют Conventional Commits (если используется)
- [ ] Ветка синхронизирована с remote
- [ ] Нет незакоммиченных изменений

### 5. Согласование (для MAJOR релизов)
- [ ] Пользователь одобрил breaking changes
- [ ] Migration guide написан
- [ ] Deprecation warnings добавлены (если применимо)

---

## 🚀 Шаги релиза

### Шаг 1: Определите версию

```bash
# Посмотрите текущую версию
cat package.json | grep version

# Определите тип изменений и новую версию
# Bug fixes → PATCH (4.0.4 → 4.0.5)
# New features → MINOR (4.0.4 → 4.1.0)
# Breaking changes → MAJOR (4.0.4 → 5.0.0)
```

### Шаг 2: Обновите CHANGELOG.md

1. Откройте `CHANGELOG.md`
2. Добавьте новую секцию под `## [Unreleased]`:

```markdown
## [Unreleased]

## [4.1.0] - 2025-10-16

### Added
- New feature 1
- New feature 2

### Changed
- Changed behavior 1

### Fixed
- Bug fix 1

### Performance
- Performance improvement 1

### Related
- PR #XX
- Commit: abc123
```

3. Обновите ссылки в конце файла:

```markdown
[Unreleased]: https://github.com/Isqanderm/data-mapper/compare/v4.1.0...HEAD
[4.1.0]: https://github.com/Isqanderm/data-mapper/compare/v4.0.0...v4.1.0
```

### Шаг 3: Создайте Release Notes

Создайте файл `RELEASE_NOTES_v{VERSION}.md`:

```markdown
# Release Notes - v4.1.0

**Release Date:** 2025-10-16
**Type:** Minor Release
**Focus:** Brief description

## Overview
Brief overview of the release

## What's New
- Feature 1
- Feature 2

## Performance
- Performance metrics

## Installation
```bash
npm install om-data-mapper@4.1.0
```

## Migration Guide
How to upgrade from previous version

## Related Links
- PR #XX
- Commit: abc123
```

### Шаг 4: Обновите package.json

```bash
# Используйте npm version для автоматического обновления
npm version patch   # для PATCH (4.0.4 → 4.0.5)
npm version minor   # для MINOR (4.0.4 → 4.1.0)
npm version major   # для MAJOR (4.0.4 → 5.0.0)

# Это автоматически:
# 1. Обновит version в package.json
# 2. Создаст git commit
# 3. Создаст git tag
```

**Альтернативно (вручную):**

```json
{
  "version": "4.1.0"
}
```

### Шаг 5: Создайте Git Tag

```bash
# Если не использовали npm version
git add .
git commit -m "chore: release v4.1.0"
git tag -a v4.1.0 -m "Release v4.1.0"
```

### Шаг 6: Запустите финальные проверки

```bash
# Запустите все тесты
npm test

# Проверьте build
npm run build

# Проверьте lint
npm run lint
```

### Шаг 7: Запушьте изменения

```bash
# Запушьте коммиты
git push origin main

# Запушьте теги
git push origin v4.1.0

# Или запушьте все теги сразу
git push --tags
```

### Шаг 8: Создайте GitHub Release

**Вариант 1: Через GitHub CLI**

```bash
gh release create v4.1.0 \
  --title "v4.1.0 - Brief Title" \
  --notes-file RELEASE_NOTES_v4.1.0.md
```

**Вариант 2: Через GitHub UI**

1. Перейдите на https://github.com/Isqanderm/data-mapper/releases/new
2. Выберите tag: `v4.1.0`
3. Release title: `v4.1.0 - Brief Title`
4. Description: Скопируйте содержимое `RELEASE_NOTES_v4.1.0.md`
5. Нажмите "Publish release"

### Шаг 9: Опубликуйте в npm (опционально)

**⚠️ ВНИМАНИЕ: Спросите разрешения у пользователя перед публикацией в npm!**

```bash
# Убедитесь, что вы залогинены
npm whoami

# Опубликуйте пакет
npm publish

# Для beta/alpha версий
npm publish --tag beta
```

### Шаг 10: Проверьте релиз

```bash
# Проверьте, что tag создан
git tag -l

# Проверьте GitHub Release
gh release view v4.1.0

# Проверьте npm (если опубликовали)
npm view om-data-mapper version
```

---


## 📝 Формат CHANGELOG

Проект следует [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) формату.

### Структура секции релиза

```markdown
## [VERSION] - YYYY-MM-DD

### Added
- New features, new APIs, new decorators
- Use bullet points
- Be specific and concise

### Changed
- Changes in existing functionality
- Improvements to existing features
- Refactoring (if user-visible)

### Deprecated
- Features that will be removed in future versions
- Include migration path

### Removed
- Removed features
- Removed APIs
- Breaking changes

### Fixed
- Bug fixes
- Security fixes
- Error corrections

### Performance
- Performance improvements
- Optimization details
- Benchmark results

### Security
- Security fixes
- Vulnerability patches

### Testing
- New tests added
- Coverage improvements
- Testing infrastructure

### Documentation
- Documentation updates
- New guides
- README changes

### Related
- PR links
- Issue links
- Commit hashes
```

### Категории (в порядке приоритета)

1. **Added** - Новые функции (самое важное для пользователей)
2. **Changed** - Изменения в существующем функционале
3. **Deprecated** - Что будет удалено (важно для миграции)
4. **Removed** - Что удалено (breaking changes)
5. **Fixed** - Исправленные баги
6. **Performance** - Улучшения производительности
7. **Security** - Исправления безопасности
8. **Testing** - Улучшения тестирования
9. **Documentation** - Обновления документации
10. **Related** - Ссылки на PR, issues, commits

### Правила написания

1. **Используйте активный залог**: "Add feature" вместо "Feature was added"
2. **Будьте конкретны**: "Add @IsEmail validator" вместо "Add validators"
3. **Включайте метрики**: "Improve performance by 2x" вместо "Improve performance"
4. **Добавляйте ссылки**: PR #XX, commit abc123
5. **Группируйте связанные изменения**: Все тесты в одну секцию
6. **Используйте markdown**: Код в backticks, списки, заголовки

### Примеры хороших записей

✅ **Хорошо:**
```markdown
### Added
- **Property-Based Testing** - Added 25 tests using fast-check library
  - Tests validators with ~2,000 random inputs
  - Covers edge cases: @IsEmail, @IsURL, @IsUUID, etc.
  - File: `tests/unit/compat/class-validator/property-based.test.ts`
```

❌ **Плохо:**
```markdown
### Added
- Added tests
```

✅ **Хорошо:**
```markdown
### Performance
- **Validation Performance** - 70-909x faster than baseline
  - Simple validation: 0.0023ms (217x faster)
  - Complex validation: 0.0022ms (909x faster)
```

❌ **Плохо:**
```markdown
### Performance
- Faster validation
```

---

## 📄 Формат Release Notes

Release Notes - это user-facing документ, который должен быть понятен конечным пользователям.

### Структура Release Notes

```markdown
# Release Notes - vX.Y.Z

**Release Date:** YYYY-MM-DD
**Type:** Major/Minor/Patch Release
**Focus:** Brief one-line description

---

## 🎯 Overview

2-3 параграфа о том, что включает этот релиз.
Объясните основную цель релиза.

---

## ✨ What's New

### Feature 1
Detailed description of feature 1
- Bullet point 1
- Bullet point 2

**Why this matters:** Explain the value to users

### Feature 2
Detailed description of feature 2

**Why this matters:** Explain the value to users

---

## 📊 Metrics (if applicable)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Tests  | 450    | 518   | +68    |

---

## 🚀 Performance (if applicable)

Performance improvements with specific numbers

---

## 💥 Breaking Changes (if applicable)

List all breaking changes with migration instructions

---

## 📦 Installation

```bash
npm install om-data-mapper@X.Y.Z
```

---

## 💡 Usage

Code examples showing how to use new features

---

## 🔄 Migration Guide

Step-by-step instructions for upgrading

---

## 🔗 Related Links

- PR #XX
- Commit: abc123
- Full Changelog: CHANGELOG.md

---

## 🙏 Contributors

List of contributors

---

## 📝 Notes

Additional notes, caveats, known issues
```

### Правила написания Release Notes

1. **Пишите для пользователей, не для разработчиков**
   - Объясняйте "зачем", а не только "что"
   - Используйте простой язык
   - Избегайте технического жаргона

2. **Используйте визуальные элементы**
   - Эмодзи для секций (🎯, ✨, 🚀, etc.)
   - Таблицы для метрик
   - Code blocks для примеров
   - Списки для перечислений

3. **Будьте конкретны**
   - Включайте цифры и метрики
   - Показывайте примеры кода
   - Объясняйте "Why this matters"

4. **Структурируйте информацию**
   - Используйте заголовки
   - Разделяйте секции горизонтальными линиями
   - Группируйте связанную информацию

5. **Добавляйте контекст**
   - Ссылки на PR и commits
   - Ссылки на документацию
   - Ссылки на migration guides

---

## 📚 Примеры для om-data-mapper

### Пример 1: Minor Release (New Features)

```markdown
# Release Notes - v4.1.0

**Release Date:** October 16, 2025
**Type:** Minor Release
**Focus:** Comprehensive Testing Infrastructure

## Overview
This release adds 68 new tests across 5 categories...

## What's New

### Property-Based Testing (25 tests)
Using fast-check library, we now test validators with thousands of random inputs...

**Why this matters:** Catches edge cases that traditional tests miss.

### Performance Benchmarks (7 tests)
Added regression tests to ensure performance doesn't degrade...

**Why this matters:** Guarantees 70-909x performance improvements.
```

### Пример 2: Patch Release (Bug Fixes)

```markdown
# Release Notes - v4.0.5

**Release Date:** October 20, 2025
**Type:** Patch Release
**Focus:** Bug Fixes

## Overview
This release fixes 3 critical bugs in the validation system.

## Bug Fixes

### Fixed Memory Leak in Nested Validation
- Issue: Memory leaked when validating deeply nested objects
- Fix: Properly cleanup validation context after each validation
- Impact: Reduces memory usage by 30% in nested scenarios

### Fixed @IsOptional with Validation Groups
- Issue: @IsOptional didn't work with validation groups
- Fix: Ensure validators and @IsOptional use same groups
- Impact: Optional fields now work correctly with groups
```

### Пример 3: Major Release (Breaking Changes)

```markdown
# Release Notes - v5.0.0

**Release Date:** November 1, 2025
**Type:** Major Release
**Focus:** API Modernization

## ⚠️ Breaking Changes

### Changed Error Format
**Before:**
```typescript
{ field: 'name', error: 'too short' }
```

**After:**
```typescript
{ property: 'name', constraints: { minLength: 'must be at least 3 characters' } }
```

**Migration:**
Update your error handling code to use the new format.

### Removed Deprecated APIs
- Removed `validateLegacy()` (deprecated in v4.0.0)
- Use `validate()` instead

**Migration:**
```typescript
// Before
const errors = await validateLegacy(dto);

// After
const errors = await validate(dto);
```
```

---

## 🤖 Автоматизация

### Использование semantic-release

Проект настроен на использование `semantic-release` для автоматизации релизов.

**Конфигурация в package.json:**

```json
{
  "scripts": {
    "release": "semantic-release"
  },
  "devDependencies": {
    "@semantic-release/commit-analyzer": "^13.0.1",
    "@semantic-release/git": "^10.0.1",
    "@semantic-release/github": "^11.0.6",
    "@semantic-release/npm": "^13.0.0",
    "@semantic-release/release-notes-generator": "^14.1.0",
    "semantic-release": "^24.2.9"
  }
}
```

### Conventional Commits

Для автоматической генерации changelog используйте Conventional Commits:

```
feat: add new validator
fix: resolve memory leak
docs: update README
perf: improve compilation speed
test: add property-based tests
chore: update dependencies
```

**Формат:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` - новая функция (MINOR)
- `fix:` - исправление бага (PATCH)
- `docs:` - изменения в документации
- `perf:` - улучшение производительности
- `test:` - добавление тестов
- `chore:` - изменения в build процессе
- `BREAKING CHANGE:` - breaking change (MAJOR)

### Автоматический релиз через CI/CD

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    branches:
      - main

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
      - run: npx semantic-release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 🎯 Checklist для ИИ-ассистента

При создании релиза, ИИ-ассистент должен:

- [ ] Определить тип релиза (MAJOR/MINOR/PATCH) на основе изменений
- [ ] Обновить `package.json` с новой версией
- [ ] Обновить `CHANGELOG.md` с новой секцией
- [ ] Создать `RELEASE_NOTES_vX.Y.Z.md`
- [ ] Создать git commit с сообщением "chore: release vX.Y.Z"
- [ ] Создать git tag `vX.Y.Z`
- [ ] Запустить тесты (`npm test`)
- [ ] Запустить build (`npm run build`)
- [ ] Запушить изменения в remote
- [ ] Запушить теги в remote
- [ ] Создать GitHub Release (если есть доступ)
- [ ] **СПРОСИТЬ** пользователя перед публикацией в npm
- [ ] Показать пользователю summary релиза

---

## 📖 Дополнительные ресурсы

- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [semantic-release](https://github.com/semantic-release/semantic-release)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github)

---

## ⚠️ Важные замечания

1. **Всегда спрашивайте разрешения** перед публикацией в npm
2. **Всегда запускайте тесты** перед созданием релиза
3. **Всегда обновляйте CHANGELOG** перед релизом
4. **Никогда не создавайте релиз** из feature branch
5. **Всегда проверяйте** что версия соответствует SemVer
6. **Для MAJOR релизов** всегда пишите migration guide
7. **Для breaking changes** всегда предупреждайте пользователей

---

**Эта инструкция должна обновляться** по мере эволюции процесса релизов в проекте.
