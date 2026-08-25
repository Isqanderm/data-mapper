# Устранение неполадок

Частые проблемы и их решения при работе с `om-data-mapper`.

## Быстрая навигация

- [Ошибки декораторов TypeScript](#ошибки-декораторов-typescript)
- [Производительность ниже ожидаемой](#производительность-ниже-ожидаемой)
- [Проблемы при миграции с class-transformer](#проблемы-при-миграции-с-class-transformer)
- [Отображение вложенных объектов не работает](#отображение-вложенных-объектов-не-работает)
- [Проблемы с выводом типов](#проблемы-с-выводом-типов)
- [Ошибки трансформации не видны](#ошибки-трансформации-не-видны)
- [Значения по умолчанию не применяются](#значения-по-умолчанию-не-применяются)
- [Опасения по поводу размера бандла](#опасения-по-поводу-размера-бандла)
- [Ошибки времени выполнения в продакшене](#ошибки-времени-выполнения-в-продакшене)
- [Получение помощи](#получение-помощи)

---

## Ошибки декораторов TypeScript

**Проблема:** Вы видите ошибки вроде `Experimental support for decorators is a feature that is subject to change`, или декораторы ведут себя не так, как ожидалось.

**Причина:** `om-data-mapper` использует **декораторы TC39 Stage 3** (современный стандарт JavaScript), а не устаревшие экспериментальные декораторы. Флаг `experimentalDecorators: true` включает старый синтаксис декораторов, который несовместим с библиотекой.

**Решение:** Настройте `tsconfig.json` на использование декораторов TC39. Это та же конфигурация, что используется в самом репозитории (см. корневой `tsconfig.json`):

**Неправильно:**

```json
{
  "compilerOptions": {
    "experimentalDecorators": true, // Wrong! This enables legacy decorators
    "emitDecoratorMetadata": true // Not needed for om-data-mapper
  }
}
```

**Правильно:**

```json
{
  "compilerOptions": {
    "target": "ES2022", // Required for TC39 decorators
    "experimentalDecorators": false, // Must be false (or omit entirely)
    "useDefineForClassFields": true // Required for modern decorators
  }
}
```

> Не устанавливайте `experimentalDecorators: true`. `emitDecoratorMetadata` не требуется — `om-data-mapper` не использует `reflect-metadata`.

### Конфигурации для конкретных окружений

<details>
<summary><strong>Node.js (ts-node / Jest / SWC)</strong></summary>

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "experimentalDecorators": false,
    "useDefineForClassFields": true
  }
}
```

Для проектов на Node.js рекомендуется `module: "NodeNext"` — он даёт лучшую совместимость ESM/CJS.

</details>

<details>
<summary><strong>Next.js / Vite</strong></summary>

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": false,
    "useDefineForClassFields": true
  }
}
```

</details>

---

## Производительность ниже ожидаемой

**Проблема:** Трансформации кажутся медленнее, чем ожидалось.

**Решение 1:** Переиспользуйте экземпляры мапперов вместо создания нового на каждую трансформацию. `getMapper`/`createMapper` кэшируют JIT-скомпилированный маппер, поэтому стоимость компиляции оплачивается один раз, а не при каждом вызове.

**Неэффективно (маппер-класс запускается заново на каждый вызов):**

```ts
function transformUsers(users: UserSource[]) {
  return users.map((user) => plainToInstance(UserMapper, user));
}
```

**Лучше (переиспользуется один скомпилированный экземпляр маппера):**

```ts
import { getMapper } from 'om-data-mapper';

const userMapper = getMapper<UserSource, UserDTO>(UserMapper);

function transformUsers(users: UserSource[]) {
  return users.map((user) => userMapper.transform(user));
}
```

**Решение 2:** Для пакетных трансформаций используйте `plainToInstanceArray` вместо вызова `plainToInstance` в цикле по массиву — это избавляет от повторного создания экземпляра маппера для каждого элемента:

```ts
import { plainToInstanceArray } from 'om-data-mapper';

const results = plainToInstanceArray(MyMapper, sources);
```

**Решение 3:** Включайте небезопасный режим только для доверенных данных. `@Mapper({ unsafe: true })` пропускает обработку ошибок через try/catch на каждом поле, что снижает накладные расходы, но означает, что некорректный ввод может выбросить исключение вместо того, чтобы быть сообщённым как ошибка трансформации.

> **Предупреждение:** Используйте `@Mapper({ unsafe: true })` **только с доверенными данными** (например, на внутренних границах сервисов). Для недоверенных или внешних данных используйте `try*`-API (`tryPlainToInstance` или `.tryTransform()` маппера), чтобы ошибки сообщались, а не выбрасывались.

```ts
@Mapper<Source, Target>({ unsafe: true })
class FastMapper {
  @Map('name')
  name!: string;
}

// Safe for trusted internal data
const internalMapper = getMapper<InternalSource, InternalDTO>(FastMapper);
const result = internalMapper.transform(trustedInternalData);

// For untrusted external data, prefer a mapper WITHOUT unsafe mode and the try* API:
const { result, errors } = tryPlainToInstance(SafeMapper, untrustedExternalData);
```

Если хотите увидеть, как эти решения реально влияют на вашу нагрузку, запустите `pnpm bench` локально — см. [`../benchmarks/README.md`](../benchmarks/README.md).

---

## Проблемы при миграции с class-transformer

**Проблема:** Код, работавший с `class-transformer`, ведёт себя иначе после перехода.

**Решение 1:** Используйте слой совместимости — это готовая замена для поддерживаемого подмножества API class-transformer (для покрытых декораторов/функций меняется только путь импорта); что именно покрыто, смотрите в [таблице совместимости](./compat-class-transformer.md):

```ts
// Before:
import { plainToClass, Expose, Type } from 'class-transformer';

// After:
import { plainToClass, Expose, Type } from 'om-data-mapper/class-transformer-compat';
// or, from the standalone package:
// import { plainToClass, Expose, Type } from '@om-data-mapper/class-transformer';
```

**Решение 2:** Уберите импорт `reflect-metadata` — он не нужен:

**Не нужен с om-data-mapper:**

```ts
import 'reflect-metadata'; // Remove this line
import { plainToClass } from 'om-data-mapper/class-transformer-compat';
```

**Правильно:**

```ts
import { plainToClass } from 'om-data-mapper/class-transformer-compat';
```

Подробные паттерны миграции и таблицу совместимости по каждому декоратору смотрите в [руководстве по миграции](./migration-class-transformer.md) и в [справочнике совместимости class-transformer](./compat-class-transformer.md).

---

## Отображение вложенных объектов не работает

**Проблема:** Вложенные объекты не трансформируются — проходят насквозь без изменений.

**Решение:** Используйте декоратор `@MapWith`, чтобы указать свойству вложенный маппер.

**Неправильно (вложенный объект копируется как есть, без трансформации):**

```ts
type UserSource = { name: string; address: { street: string; city: string } };
type UserDTO = { name: string; address: AddressDTO };
type AddressDTO = { street: string; city: string };

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  name!: string;

  @Map('address') // This alone does not run the nested object through a mapper
  address!: AddressDTO;
}
```

**Правильно (вложенный объект трансформируется собственным маппером):**

```ts
type AddressSource = { street: string; city: string };
type AddressDTO = { street: string; city: string };
type UserSource = { name: string; address: AddressSource };
type UserDTO = { name: string; address: AddressDTO };

// Define the nested mapper first
@Mapper<AddressSource, AddressDTO>()
class AddressMapper {
  @Map('street')
  street!: string;

  @Map('city')
  city!: string;
}

// Reference it with @MapWith on the parent mapper
@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  name!: string;

  @MapWith(AddressMapper)
  @Map('address')
  address!: AddressDTO;
}

const source: UserSource = {
  name: 'John',
  address: { street: '123 Main St', city: 'NYC' },
};
const result = plainToInstance(UserMapper, source);
// result: { name: 'John', address: { street: '123 Main St', city: 'NYC' } }
```

`@MapWith` также работает с `@MapFrom` вместо `@Map`, когда вложенному исходному значению требуется собственная логика получения.

---

## Проблемы с выводом типов

**Проблема:** TypeScript выводит `any` для результата трансформации или показывает ошибки типов.

**Решение:** Явно указывайте параметры типа или используйте аннотации типов.

**Вывод типов может не сработать (тип результата — `any`):**

```ts
const result = plainToInstance(UserMapper, source);
// result: any
```

**Вариант 1: явные обобщённые параметры:**

```ts
const result = plainToInstance<UserSource, UserDTO>(UserMapper, source);
// result: UserDTO
```

**Вариант 2: аннотация типа для результата:**

```ts
const result: UserDTO = plainToInstance(UserMapper, source);
```

**Вариант 3: используйте `createMapper` для типизированного, переиспользуемого экземпляра маппера:**

```ts
const mapper = createMapper<UserSource, UserDTO>(UserMapper);
const result = mapper.transform(source);
// result: UserDTO, with autocomplete on mapper.transform
```

**Вариант 4: аннотация возвращаемого типа оборачивающей функции:**

```ts
function transformUser(source: UserSource): UserDTO {
  return plainToInstance(UserMapper, source);
}
```

---

## Ошибки трансформации не видны

**Проблема:** Трансформация молча завершается неудачей — нет ни исключения, ни признаков того, что что-то пошло не так.

**Решение:** Используйте `tryPlainToInstance` или метод `.tryTransform()` маппера, чтобы получать ошибки, а не терять их.

**Ошибки скрыты:**

```ts
const result = plainToInstance(UserMapper, source);
// If a field transform throws internally, you may not see why.
```

**Вариант 1: `tryPlainToInstance` (для разовых трансформаций):**

```ts
import { tryPlainToInstance } from 'om-data-mapper';

const { result, errors } = tryPlainToInstance(UserMapper, source);

if (errors.length > 0) {
  console.error('Transformation errors:', errors);
} else {
  console.log('Success:', result);
}
```

**Вариант 2: `.tryTransform()` на переиспользуемом экземпляре маппера:**

```ts
import { getMapper } from 'om-data-mapper';

const mapper = getMapper<UserSource, UserDTO>(UserMapper);
const { result, errors } = mapper.tryTransform(source);

if (errors.length > 0) {
  console.error('Transformation errors:', errors);
  // result may be partial if some fields failed
} else {
  console.log('Success:', result);
}
```

**Вариант 3: используйте напрямую в обработчике API:**

```ts
app.post('/api/users', (req, res) => {
  const { result, errors } = tryPlainToInstance(UserMapper, req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors,
    });
  }

  res.json(result);
});
```

---

## Значения по умолчанию не применяются

**Проблема:** Значение `@Default`, похоже, не применяется.

**Что делает `@Default`:** Он подставляет запасное значение для поля всякий раз, когда отображённое исходное значение равно `undefined` или `null`, независимо от того, заполняется ли поле через `@Map`, `@MapFrom` или `@MapWith`.

```ts
type UserSource = { name?: string; role?: string; status?: string };
type UserDTO = { name: string; role: string; status: string };

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Default('Anonymous')
  @Map('name')
  name!: string;

  @Default('user')
  @Map('role')
  role!: string;

  @Default('active')
  @Map('status')
  status!: string;
}

const result = plainToInstance(UserMapper, {});
// result: { name: 'Anonymous', role: 'user', status: 'active' }
```

**Когда использовать `@Default`:**

- Обработка необязательных полей API с запасным значением
- Разумные значения по умолчанию для отсутствующей конфигурации
- Гарантия ненулевых значений в DTO даже при неполном источнике

**Если значение по умолчанию всё ещё не появляется**, проверьте, что именно доходит до поля: `@Default` срабатывает только когда отображённое значение равно `undefined` или `null` — отображённая пустая строка, `0` или `false` его не запустят. Если `@Transform` на том же поле всегда возвращает значение, отличное от `null`/`undefined`, значение по умолчанию никогда не будет использовано.

---

## Опасения по поводу размера бандла

**Проблема:** Размер бандла больше ожидаемого после добавления `om-data-mapper`.

**Хорошая новость:** пакет спроектирован для tree-shaking:

- Помечен как `"sideEffects": false` в `package.json`
- Поставляет сборки ESM для современных бандлеров
- Не имеет зависимостей времени выполнения

**Решение 1:** Импортируйте только то, что используете — остальное уберёт tree-shaking:

```ts
import { Mapper, Map, plainToInstance } from 'om-data-mapper';
```

**Решение 2:** Убедитесь, что ваш бандлер настроен на tree-shaking.

<details>
<summary><strong>Vite (конфигурация по умолчанию работает)</strong></summary>

Vite по умолчанию делает tree-shaking; специальная настройка не требуется.

</details>

<details>
<summary><strong>Webpack 5+ (production-режим)</strong></summary>

```js
// webpack.config.js
module.exports = {
  mode: 'production', // Enables tree-shaking automatically
  optimization: {
    usedExports: true,
    sideEffects: true, // Respect package.json "sideEffects" field
  },
};
```

Обычно не нужно самостоятельно устанавливать `sideEffects: false` — `package.json` пакета уже это декларирует.

</details>

<details>
<summary><strong>Rollup</strong></summary>

```js
// rollup.config.js
export default {
  treeshake: true, // Enabled by default in Rollup
};
```

</details>

**Решение 3:** Используйте анализатор бандла, чтобы понять, откуда на самом деле берётся размер:

```bash
# Webpack
npm install --save-dev webpack-bundle-analyzer

# Vite / Rollup
npm install --save-dev rollup-plugin-visualizer
```

---

## Ошибки времени выполнения в продакшене

**Проблема:** Код работает в разработке, но падает в продакшен-сборке.

**Решение 1:** Убедитесь, что цель сборки не понижается ниже уровня, на котором поддерживаются декораторы TC39:

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022", // Don't downlevel to ES5 — decorators require ES2022+
    "module": "ESNext" // Or "NodeNext" for Node.js projects
  }
}
```

**Решение 2 (ситуативное):** `om-data-mapper` не полагается на имена классов или функций во время выполнения для своей собственной логики — JIT-скомпилированные мапперы работают одинаково независимо от минификации/замены имён. Если вы отдельно полагаетесь на имена классов для логирования, сообщений об ошибках или инструмента отладки, настройте минификатор так, чтобы он их сохранял:

```js
// webpack.config.js — only if you need readable class names in errors/debugging
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_classnames: /Mapper$/, // Preserve only *Mapper classes
          keep_fnames: false,
        },
      }),
    ],
  },
};
```

**Решение 3:** Убедитесь, что продакшен-сборка действительно запускается:

```bash
npm run build
NODE_ENV=production node dist/index.js
```

---

## Получение помощи

Если проблема не решена:

1. **Проверьте документацию:**
   - [Справочник API (TypeDoc)](https://isqanderm.github.io/data-mapper/) — сгенерированная документация API
   - [Руководство по использованию трансформации](./transformer-usage.md)
   - [Руководство по использованию валидации](./validation-usage.md)
   - [Руководство по миграции](./migration-class-transformer.md)
   - [docs-ru/README.md](./README.md) — полный индекс документации

2. **Поищите в существующих issues:** [GitHub Issues](https://github.com/Isqanderm/data-mapper/issues)

3. **Сообщите об ошибке:** [создайте новый issue](https://github.com/Isqanderm/data-mapper/issues/new)

При сообщении об ошибке, пожалуйста, укажите:

- Версию TypeScript (`tsc --version`)
- Вашу конфигурацию `tsconfig.json`
- Минимальный воспроизводимый пример
- Ожидаемое и фактическое поведение
- Любые сообщения об ошибках
