# JIT-компиляция трансформации - Внутренняя архитектура

## Обзор

Модуль трансформации в `om-data-mapper` использует **JIT-компиляцию (Just-In-Time)** для достижения высокопроизводительных трансформаций объектов. Система генерирует оптимизированный JavaScript-код с помощью `new Function()`, который выполняет логику трансформации напрямую, устраняя накладные расходы интерпретации во время выполнения.

Этот документ объясняет детали внутренней реализации системы JIT-компиляции для модуля трансформации.

---

## Компоненты архитектуры

### 1. Хранение метаданных

И нативный decorator API, и API совместимости с class-transformer хранят свои метаданные
одинаково — в модульном `WeakMap<Function, ...>`, ключом которого служит конструктор класса.
Различается между ними форма хранимых метаданных, а не сам механизм хранения.

#### Decorator API (`packages/core/src/decorators/metadata.ts`)

Использует **хранилище метаданных на основе `WeakMap`** для нативного decorator API:

```typescript
const metadataStore = new WeakMap<Function, MapperMetadata>();

interface MapperMetadata {
  properties: Map<string | symbol, PropertyMapping>;
  options?: MapperOptions;
}

interface PropertyMapping {
  type: 'path' | 'transform' | 'nested' | 'ignore';
  sourcePath?: string;
  transformer?: Function;
  transformValue?: Function;
  nestedMapper?: any;
  defaultValue?: any;
  condition?: Function;
}
```

#### API совместимости с class-transformer (`packages/class-transformer/src/metadata.ts`)

Также использует **хранилище метаданных на основе `WeakMap`**, с ключом по конструктору
класса, для совместимости с class-transformer:

```typescript
const metadataStorage = new WeakMap<Function, ClassMetadata>();

interface ClassMetadata {
  properties: Map<string | symbol, PropertyMetadata>;
  classOptions?: {
    expose?: boolean;
    exclude?: boolean;
  };
}

interface PropertyMetadata {
  expose?: boolean;
  exclude?: boolean;
  exposeOptions?: ExposeOptions;
  excludeOptions?: ExcludeOptions;
  typeFunction?: TypeHelpFunction;
  transformFn?: TransformFn;
  name?: string; // Отображение имени свойства
}
```

**Ключевые различия:**

- **Механизм хранения**: Идентичен — оба используют `WeakMap<Function, ...>` с ключом по
  конструктору класса, поэтому метаданные удаляются сборщиком мусора вместе с классом и
  ручная очистка не нужна.
- **Форма метаданных**: Различается — Decorator API хранит плоскую карту `properties` с
  записями `PropertyMapping` плюс `options` уровня маппера; API совместимости хранит записи
  `PropertyMetadata` (информация expose/exclude/type/transform) плюс `classOptions`.
- **Оба**: Используют TC39 Stage 3 декораторы

---

### 2. Процесс JIT-компиляции

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Применение декораторов (время определения класса)       │
│    - @Map(), @MapFrom(), @Transform() и др.                │
│    - Метаданные сохраняются в конструкторе класса          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Создание экземпляра класса                               │
│    - new UserMapper() или plainToInstance(UserMapper, data) │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Триггер компиляции (context.addInitializer)             │
│    - Выполняется один раз при первом создании экземпляра   │
│    - Вызывает _compileMapper()                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Получение метаданных                                     │
│    - getMapperMetadata(this.constructor)                    │
│    - Возвращает MapperMetadata со всеми отображениями      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Генерация кода                                           │
│    - Для каждого свойства: _generatePropertyCode()          │
│    - Создаёт строки JavaScript-кода                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Компиляция функции                                       │
│    - new Function('source', 'target', '__errors', code)     │
│    - Создаёт исполняемую функцию трансформации              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Создание маппера                                         │
│    - Оборачивает скомпилированную функцию в API,            │
│      совместимый с BaseMapper                               │
│    - Сохраняет в переменной compiledMapper                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Выполнение                                               │
│    - mapper.transform(source) вызывает скомпилированную     │
│      функцию                                                │
│    - Возвращает трансформированный объект                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Стратегия генерации кода

### 1. Отображение путей (`@Map('sourcePath')`)

Генерирует безопасный доступ к свойствам с optional chaining:

```typescript
// Декоратор: @Map('user.profile.email')
// Сгенерированный код:
target.email = source?.user?.profile?.email;

// Со значением по умолчанию: @Map('score') @Default(0)
target.score = source?.score ?? cache['__defValues']['score'];

// С трансформацией значения: @Map('name') @Transform(v => v.toUpperCase())
target.name = cache['name__valueTransform'](source?.name);
```

**Оптимизация**: Использует optional chaining (`?.`) вместо try-catch для безопасности от null.

### 2. Функция трансформации (`@MapFrom(fn)`)

Сохраняет трансформер в кэше и вызывает его:

```typescript
// Декоратор: @MapFrom((src) => src.firstName + ' ' + src.lastName)
// Сгенерированный код:
target.fullName = cache['fullName__transformer'](source);

// Со значением по умолчанию: @MapFrom(fn) @Default('Unknown')
target.fullName = cache['fullName__transformer'](source) ?? cache['__defValues']['fullName'];

// Кодогенерация условия существует внутри (`PropertyMapping.condition`), но
// сегодня ни один публичный декоратор её не задаёт — функция `@MapFrom`
// получает весь исходный объект, поэтому условное отображение выражается
// прямо в ней:
// @MapFrom((src) => (src.isPremium ? src.premiumName : undefined))
```

**Оптимизация**: Функции хранятся в кэше, чтобы избежать накладных расходов замыканий.

### 3. Вложенный маппер (`@MapWith(NestedMapper)`)

Вызывает собственный скомпилированный `transform()` вложенного маппера:

```typescript
// Декораторы: @MapWith(AddressMapper) @Map('address')
// Сгенерированный код:
const __nestedSource = source?.address;
target.address =
  __nestedSource !== undefined && __nestedSource !== null
    ? cache['address__nestedMapper'].transform(__nestedSource)
    : undefined;
```

**Оптимизация**: Вложенные мапперы предварительно компилируются и кэшируются.

### 4. Отображение массивов

Обрабатывает трансформации массивов:

```typescript
// Декоратор: @MapFrom((src) => src.items.map(i => i.name))
// Сгенерированный код:
target.itemNames = cache['itemNames__transformer'](source);
```

Отдельного пути кодогенерации для массивов вложенных мапперов не существует —
массивы вложенных объектов обрабатываются точно так же, вызовом `transform()`
вложенного маппера изнутри функции `@MapFrom`:

```typescript
@MapFrom((src: Source) => src.items.map((item) => new ItemMapper().transform(item)))
items!: ItemTarget[];
```

---

## Генерация безопасного доступа к свойствам

Функция `generateSafePropertyAccess()` преобразует пути с точечной нотацией в optional chaining:

```typescript
function generateSafePropertyAccess(sourcePath: string): string {
  const parts = sourcePath.split('.');
  if (parts.length === 1) {
    return sourcePath;
  }
  return parts.join('?.');
}

// Примеры:
// 'name' → 'name'
// 'user.name' → 'user?.name'
// 'user.profile.email' → 'user?.profile?.email'
```

**Почему Optional Chaining?**

- ✅ Быстрее, чем try-catch
- ✅ Более читаемый сгенерированный код
- ✅ Нативная возможность JavaScript (ES2020+)
- ✅ Без накладных расходов во время выполнения

---

## Стратегии обработки ошибок

### Небезопасный режим (по умолчанию)

Без обработки ошибок - максимальная производительность:

```typescript
// Сгенерированный код (небезопасный режим):
target.name = source?.firstName;
target.email = source?.user?.email;
```

**Использовать когда**: Данные доверенные и производительность критична.

### Безопасный режим

Оборачивает каждое свойство в try-catch:

```typescript
// Сгенерированный код (безопасный режим):
try {
  target.name = source?.firstName;
} catch (error) {
  __errors.push("Mapping error at field 'name': " + error.message);
}

try {
  target.email = source?.user?.email;
} catch (error) {
  __errors.push("Mapping error at field 'email': " + error.message);
}
```

**Использовать когда**: Данные недоверенные или требуется отладка.

---

## Техники оптимизации

### 1. **Предварительная компиляция**

Мапперы компилируются один раз при создании экземпляра класса:

```typescript
// Компиляция происходит здесь (один раз)
const mapper = new UserMapper();

// Выполнение быстрое (использует предварительно скомпилированную функцию)
const result1 = mapper.transform(source1);
const result2 = mapper.transform(source2);
const result3 = mapper.transform(source3);
```

### 2. **Кэширование функций**

Функции трансформации хранятся в объекте кэша:

```typescript
const cache = {
  fullName__transformer: (src) => src.firstName + ' ' + src.lastName,
  age__condition: (src) => src.age !== undefined,
  __defValues: { score: 0, status: 'active' },
};
```

**Преимущества:**

- Избегает накладных расходов замыканий
- Позволяет переиспользовать функции
- Упрощает сгенерированный код

### 3. **Встраивание генерации кода**

Простые операции встраиваются вместо вызовов функций:

```typescript
// ❌ Медленно: Вызов функции
target.name = transformName(source.firstName);

// ✅ Быстро: Встроенный код
target.name = source?.firstName;
```

### 4. **Условная компиляция**

Генерирует код только для существующих свойств:

```typescript
// Если нет декоратора @Ignore(), генерирует код
// Если есть декоратор @Ignore(), пропускает генерацию кода
if (mapping.type === 'ignore') {
  continue; // Пропустить это свойство
}
```

### 5. **Optional Chaining**

Использует нативный optional chaining вместо ручных проверок на null:

```typescript
// ❌ Медленно: Ручные проверки
if (source && source.user && source.user.profile) {
  target.email = source.user.profile.email;
}

// ✅ Быстро: Optional chaining
target.email = source?.user?.profile?.email;
```

---

## Слой совместимости с class-transformer

Слой совместимости предоставляет другой подход к трансформации:

### Поток трансформации:

```
plainToClass(UserDto, plainObject)
         ↓
transformPlainToClass(UserDto, plainObject, 'plainToClass', options)
         ↓
1. Создание экземпляра: new UserDto()
2. Получение метаданных: getCompatMetadata(UserDto)
3. Для каждого свойства:
   - Проверка, должно ли быть раскрыто: shouldExposeProperty()
   - Получение имени исходного свойства: getSourcePropertyName()
   - Трансформация значения: transformValue()
   - Применение функции @Transform, если существует
   - Применение трансформации @Type, если существует
   - Установка в экземпляр
4. Возврат экземпляра
```

### Ключевые различия с Decorator API:

| Возможность          | Decorator API                               | class-transformer Compat                                                   |
| -------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| Компиляция           | JIT при создании экземпляра                 | Интерпретируется во время выполнения (обход зарегистрированных метаданных) |
| Метаданные           | На основе WeakMap (форма `PropertyMapping`) | На основе WeakMap (форма `PropertyMetadata`)                               |
| API                  | `@Map()`, `@MapFrom()`                      | `@Expose()`, `@Type()`                                                     |
| Случай использования | Новые проекты                               | Миграция с class-transformer                                               |

---

## Характеристики производительности

Эти два API ведут себя по-разному:

- **Decorator/core API**: компилирует специализированную функцию трансформации один раз для
  каждого класса маппера, при первом использовании (`context.addInitializer` запускает
  `_compileMapper()`, см. `packages/core/src/decorators/core.ts` и
  `packages/core/src/core/Mapper.ts`), и переиспользует эту скомпилированную функцию при каждом
  последующем вызове — после первого создания экземпляра нет ни рефлексии на каждый вызов, ни
  повторного разбора метаданных.
- **API совместимости с class-transformer**: регистрирует метаданные один раз, во время
  определения класса (через декораторы `@Expose()`/`@Exclude()`/`@Type()`/`@Transform()`), но
  функцию не компилирует. Каждый вызов `plainToClass`/`plainToInstance`/и т. п. обходит эти
  зарегистрированные метаданные и интерпретирует их напрямую — в этом пути кода нет шага
  `new Function()`.

Измеренную пропускную способность смотрите в [`../benchmarks/README.md`](../benchmarks/README.md),
где реальный код этого пакета сравнивается с настоящим class-transformer.

---

## Примеры сгенерированного кода

### Пример 1: Простое отображение

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @Map('firstName')
  name!: string;

  @Map('email')
  email!: string;
}

// Сгенерированный код:
function transform(source, target, __errors, cache) {
  target.name = source?.firstName;
  target.email = source?.email;
}
```

### Пример 2: Сложные трансформации

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @MapFrom((src) => src.firstName + ' ' + src.lastName)
  fullName!: string;

  @MapFrom((src) => src.age >= 18)
  isAdult!: boolean;

  @Default(0)
  @Map('score')
  score!: number;
}

// Сгенерированный код:
function transform(source, target, __errors, cache) {
  target.fullName = cache['fullName__transformer'](source);
  target.isAdult = cache['isAdult__transformer'](source);
  target.score = source?.score ?? cache['__defValues']['score'];
}
```

### Пример 3: Условное отображение

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @MapFrom((src) => (src.isPremium ? src.premiumFeatures : undefined))
  features?: string[];
}

// Сгенерированный код:
function transform(source, target, __errors, cache) {
  target.features = cache['features__transformer'](source);
}
```

### Пример 4: Вложенное отображение

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @MapWith(AddressMapper)
  @Map('address')
  address!: Address;
}

// Сгенерированный код:
function transform(source, target, __errors, cache) {
  const __nestedSource = source?.address;
  target.address =
    __nestedSource !== undefined && __nestedSource !== null
      ? cache['address__nestedMapper'].transform(__nestedSource)
      : undefined;
}
```

---

## Отладка сгенерированного кода

### Просмотр сгенерированного кода:

```typescript
@Mapper<Source, Target>()
class UserMapper {
  @Map('name')
  name!: string;

  // Добавьте этот метод для просмотра сгенерированного кода
  _debugGeneratedCode() {
    const metadata = getMapperMetadata(this.constructor);
    const cache = {};
    const defaultValues = {};
    const codeLines = [];

    for (const [propertyKey, mapping] of metadata.properties) {
      const code = this._generatePropertyCode(
        String(propertyKey),
        mapping,
        cache,
        defaultValues,
        false,
      );
      if (code) codeLines.push(code);
    }

    console.log(codeLines.join('\n'));
  }
}

const mapper = new UserMapper();
mapper._debugGeneratedCode();
```

### Профилирование производительности:

```typescript
console.time('compilation');
const mapper = new UserMapper();
console.timeEnd('compilation');

console.time('execution');
const result = mapper.transform(source);
console.timeEnd('execution');

console.time('1000 executions');
for (let i = 0; i < 1000; i++) {
  mapper.transform(source);
}
console.timeEnd('1000 executions');
```

---

## Потокобезопасность

- **Без глобального состояния**: Каждый экземпляр маппера имеет изолированную скомпилированную функцию
- **Неизменяемые метаданные**: Метаданные устанавливаются во время определения класса
- **Изоляция кэша**: Каждый маппер имеет свой собственный объект кэша
- **Безопасность параллелизма**: Несколько мапперов могут выполняться одновременно

---

## Сравнение с BaseMapper

Decorator API использует тот же подход JIT-компиляции, что и BaseMapper, но с лучшей эргономикой:

| Возможность        | BaseMapper    | Decorator API                           |
| ------------------ | ------------- | --------------------------------------- |
| Стиль API          | Императивный  | Декларативный                           |
| Типобезопасность   | Ручная        | Автоматическая                          |
| Генерация кода     | ✅ Да         | ✅ Да                                   |
| Производительность | Быстрая       | **Быстрее** (меньше накладных расходов) |
| Поддерживаемость   | Средняя       | Высокая                                 |
| Рекомендуется      | ❌ Устаревший | ✅ Современный                          |

---

## Будущие оптимизации

1. **Ahead-of-Time компиляция**: Предварительная компиляция мапперов во время сборки
2. **WebAssembly**: Компиляция в WASM для ещё более быстрого выполнения
3. **SIMD**: Использование SIMD-инструкций для трансформации массивов
4. **Параллельное выполнение**: Трансформация массивов параллельно с использованием Worker Threads
5. **Мемоизация**: Кэширование результатов трансформации для идентичных входных данных

---

## Заключение

Подход с JIT-компиляцией Decorator/core API обеспечивает:

- ✅ **JIT-компиляция** - специализированная функция генерируется один раз для каждого класса и переиспользуется, без рефлексии на каждый вызов
- ✅ **Нулевые накладные расходы во время выполнения** после компиляции
- ✅ **Типобезопасность** с полной поддержкой TypeScript
- ✅ **Эффективность памяти** с кэшированием функций
- ✅ **Расширяемость** с пользовательскими трансформерами

API совместимости с class-transformer функцию не компилирует — см. раздел
[Характеристики производительности](#характеристики-производительности) выше.

Измеренную пропускную способность относительно class-transformer смотрите в [`../benchmarks/README.md`](../benchmarks/README.md).
