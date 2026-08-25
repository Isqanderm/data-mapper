# Руководство по миграции: class-transformer → om-data-mapper

Это руководство поможет перейти с `class-transformer` на `om-data-mapper`
для лучшей производительности при сохранении совместимости.

## Быстрый старт: готовая замена

Проще всего мигрировать с помощью слоя совместимости:

```ts
// Before (class-transformer)
import { plainToClass, Expose, Type } from 'class-transformer';

// After (om-data-mapper) - Just change the import!
import { plainToClass, Expose, Type } from 'om-data-mapper/class-transformer-compat';

// Your existing code works exactly the same, backed by JIT compilation instead of interpretation 🚀
```

## Паттерны миграции

### Паттерн 1: Базовое отображение свойств

**До (class-transformer):**

```ts
import 'reflect-metadata';
import { plainToClass, Expose } from 'class-transformer';

class UserDTO {
  @Expose()
  id: number;

  @Expose({ name: 'user_name' })
  name: string;
}

const user = plainToClass(UserDTO, { id: 1, user_name: 'John' });
```

**После (om-data-mapper - слой совместимости):**

```ts
// No reflect-metadata needed!
import { plainToClass, Expose } from 'om-data-mapper/class-transformer-compat';

class UserDTO {
  @Expose()
  id: number;

  @Expose({ name: 'user_name' })
  name: string;
}

const user = plainToClass(UserDTO, { id: 1, user_name: 'John' });
```

**После (om-data-mapper - нативный API, рекомендуется):**

```ts
import { Mapper, Map, plainToInstance } from 'om-data-mapper';

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('id')
  id!: number;

  @Map('user_name')
  name!: string;
}

const user = plainToInstance(UserMapper, { id: 1, user_name: 'John' });
```

---

### Паттерн 2: Вложенные объекты с Type

**До (class-transformer):**

```ts
import { plainToClass, Type } from 'class-transformer';

class AddressDTO {
  street: string;
  city: string;
}

class UserDTO {
  name: string;

  @Type(() => AddressDTO)
  address: AddressDTO;
}

const user = plainToClass(UserDTO, data);
```

**После (om-data-mapper - слой совместимости):**

```ts
import { plainToClass, Type } from 'om-data-mapper/class-transformer-compat';

class AddressDTO {
  street: string;
  city: string;
}

class UserDTO {
  name: string;

  @Type(() => AddressDTO)
  address: AddressDTO;
}

const user = plainToClass(UserDTO, data);
```

**После (om-data-mapper - нативный API, рекомендуется):**

```ts
import { Mapper, Map, MapWith, plainToInstance } from 'om-data-mapper';

@Mapper<AddressSource, AddressDTO>()
class AddressMapper {
  @Map('street')
  street!: string;

  @Map('city')
  city!: string;
}

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  name!: string;

  @MapWith(AddressMapper)
  @Map('address')
  address!: AddressDTO;
}

const user = plainToInstance(UserMapper, data);
```

---

### Паттерн 3: Пользовательские трансформации

**До (class-transformer):**

```ts
import { plainToClass, Transform } from 'class-transformer';

class UserDTO {
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @Transform(({ value }) => new Date(value))
  createdAt: Date;
}

const user = plainToClass(UserDTO, data);
```

**После (om-data-mapper - слой совместимости):**

```ts
import { plainToClass, Transform } from 'om-data-mapper/class-transformer-compat';

class UserDTO {
  @Transform(({ value }) => value.toUpperCase())
  name: string;

  @Transform(({ value }) => new Date(value))
  createdAt: Date;
}

const user = plainToClass(UserDTO, data);
```

**После (om-data-mapper - нативный API, рекомендуется):**

```ts
import { Mapper, MapFrom, Transform, plainToInstance } from 'om-data-mapper';

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @MapFrom((src: UserSource) => src.name.toUpperCase())
  name!: string;

  @MapFrom((src: UserSource) => new Date(src.createdAt))
  createdAt!: Date;
}

const user = plainToInstance(UserMapper, data);
```

---

### Паттерн 4: Трансформация массивов

**До (class-transformer):**

```ts
import { plainToClass } from 'class-transformer';

const users = data.map((item) => plainToClass(UserDTO, item));
```

**После (om-data-mapper - слой совместимости):**

```ts
import { plainToClass } from 'om-data-mapper/class-transformer-compat';

const users = data.map((item) => plainToClass(UserDTO, item));
```

**После (om-data-mapper - нативный API, рекомендуется):**

```ts
import { plainToInstanceArray } from 'om-data-mapper';

// More efficient - single mapper instance
const users = plainToInstanceArray(UserMapper, data);
```

---

### Паттерн 5: Исключение свойств

**До (class-transformer):**

```ts
import { Exclude } from 'class-transformer';

class UserDTO {
  name: string;

  @Exclude()
  password: string;
}
```

**После (om-data-mapper - слой совместимости):**

```ts
import { Exclude } from 'om-data-mapper/class-transformer-compat';

class UserDTO {
  name: string;

  @Exclude()
  password: string;
}
```

**После (om-data-mapper - нативный API, рекомендуется):**

```ts
import { Mapper, Map, Ignore } from 'om-data-mapper';

@Mapper<UserSource, UserDTO>()
class UserMapper {
  @Map('name')
  name!: string;

  @Ignore()
  password!: string;
}
```

---

## Ключевые различия

| Возможность          | class-transformer                    | om-data-mapper                                      |
| -------------------- | ------------------------------------ | --------------------------------------------------- |
| **Метаданные**       | Требует `reflect-metadata`           | Метаданные не нужны                                 |
| **Декораторы**       | Устаревшие экспериментальные         | TC39 Stage 3 (стандарт)                             |
| **Компиляция**       | Интерпретируется во время выполнения | JIT-компилируется один раз, дальше переиспользуется |
| **Зависимости**      | Есть зависимости                     | Нулевые зависимости                                 |
| **Размер бандла**    | Больше                               | Меньше (tree-shakeable)                             |
| **Типобезопасность** | Ограниченная                         | Полная поддержка TypeScript                         |

## Чек-лист миграции

- [ ] Удалите `import 'reflect-metadata'` из кода
- [ ] Обновите `tsconfig.json` для использования декораторов TC39 (см. [Конфигурация TypeScript](#конфигурация-typescript))
- [ ] Замените импорты с `class-transformer` на `om-data-mapper/class-transformer-compat`
- [ ] Протестируйте трансформации
- [ ] (Опционально) Перейдите на нативный API для лучшей производительности и типобезопасности

## Конфигурация TypeScript

Обновите `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": false, // Do not use legacy decorators
    "emitDecoratorMetadata": false // Not needed
  }
}
```

## Советы по производительности

Измеренную пропускную способность относительно class-transformer смотрите в
[`../benchmarks/README.md`](../benchmarks/README.md), где реальный код
этого пакета сравнивается с настоящей библиотекой class-transformer.
Приведённые ниже советы полезны в любом случае:

1. **Переиспользуйте экземпляры мапперов** вместо создания новых:

   ```ts
   // ❌ Slow
   data.map((item) => plainToClass(UserDTO, item));

   // ✅ Fast
   const mapper = getMapper(UserMapper);
   data.map((item) => mapper.transform(item));
   ```

2. **Используйте пакетные функции** для массивов:

   ```ts
   // ✅ More efficient
   plainToInstanceArray(UserMapper, data);
   ```

3. **Включайте небезопасный режим** для доверенных данных:
   ```ts
   @Mapper<Source, Target>({ unsafe: true })
   class FastMapper {
     /* ... */
   }
   ```

## Нужна помощь?

- **Документация**: [README.md](../README.md)
- **Справочник API**: [TypeDoc](https://isqanderm.github.io/data-mapper/)
- **Issues**: [GitHub Issues](https://github.com/Isqanderm/data-mapper/issues)
- **Обсуждения**: [GitHub Discussions](https://github.com/Isqanderm/data-mapper/discussions)
