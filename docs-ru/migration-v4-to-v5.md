# Руководство по миграции: om-data-mapper v4 → v5

v5 разбивает старый монолит `om-data-mapper` на четыре пакета: движок
маппера/трансформера ядра плюс отдельные адаптеры совместимости с
class-transformer и class-validator, при этом сам `om-data-mapper`
становится мета-пакетом, реэкспортирующим все три. Для большинства
пользователей, обновляющих мета-пакет, **изменения кода не требуются** —
тот же импорт верхнего уровня продолжает работать.

## Структура пакетов

| Пакет                               | Версия | Что это                                                                                 |
| ----------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| `om-data-mapper`                    | 5.0.0  | Мета-пакет. Реэкспортирует `@om-data-mapper/core` и сохраняет подпути совместимости v4. |
| `@om-data-mapper/core`              | 1.0.0  | Движок маппера/трансформера (JIT-компиляция, декораторы, базовые типы).                 |
| `@om-data-mapper/class-transformer` | 1.0.0  | API, совместимый с `class-transformer`, построенный на core.                            |
| `@om-data-mapper/class-validator`   | 1.0.0  | API, совместимый с `class-validator`, с собственным движком валидации.                  |

Скоуп-пакеты (`@om-data-mapper/core`, `@om-data-mapper/class-transformer`,
`@om-data-mapper/class-validator`) можно устанавливать по отдельности, если
нужна только часть функциональности — это даёт меньший объём зависимостей,
чем подключение мета-пакета `om-data-mapper`.

## Импорты

**Без изменений** — импорт из мета-пакета продолжает работать, потому что он
реэкспортирует `@om-data-mapper/core`:

```typescript
import { Mapper, Map } from 'om-data-mapper';
```

**Всё ещё работает** — подпути совместимости v4 сохранены как алиасы на
мета-пакете:

```typescript
import { plainToInstance, Type } from 'om-data-mapper/class-transformer-compat';
```

```typescript
import { validate, IsString } from 'om-data-mapper/class-validator-compat';
```

При желании можно перейти с этих двух на скоуп-пакеты напрямую — тот же API,
на одно перенаправление меньше:

```typescript
import { plainToInstance, Type } from '@om-data-mapper/class-transformer';
```

```typescript
import { validate, IsString } from '@om-data-mapper/class-validator';
```

## Изменения поведения в адаптере class-validator

В v4 несколько документированных опций `ValidatorOptions` были объявлены в
типах, но никогда не были подключены к движку валидации — их передача молча
ничего не делала. В v5 все перечисленные ниже теперь действительно работают:
`whitelist`, `forbidNonWhitelisted`, `skipMissingProperties`,
`skipNullProperties`, `skipUndefinedProperties`, `stopAtFirstError`,
`forbidUnknownValues`.

**`whitelist: true` теперь действительно удаляет неизвестные свойства.** В
v4 эта опция была молчаливым no-op; в v5 она мутирует валидируемый объект и
удаляет свойства, у которых нет декораторов валидации (свойства, помеченные
`@Allow()`, сохраняются):

```typescript
class Dto {
  @IsString()
  name: any = 'ok';
  @Allow()
  extraAllowed: any = 1;
}

const dto: any = new Dto();
dto.rogue = 'x';
validateSync(dto, { whitelist: true });
// dto.rogue no longer exists — it was stripped
```

Если вы передавали `whitelist: true` в v4, ожидая, что она будет
проигнорирована, теперь ваш код получает обратно другой (урезанный) объект.
Поскольку это приводит поведение адаптера в соответствие с тем, что опция
всегда обещала делать, это поставляется как исправление ошибки в рамках
данной мажорной версии — проверьте весь код, полагающийся на старое
поведение no-op.

`forbidUnknownValues` по умолчанию имеет значение `false`, что расходится с
поведением апстрима `class-validator@0.14`, где по умолчанию `true`. Такое
значение по умолчанию выбрано, чтобы обновление не начало неожиданно
отклонять объекты с нераспознанной формой; передайте `forbidUnknownValues: true`
явно, чтобы включить более строгое поведение, соответствующее апстриму. См.
[`./compat-class-validator.md`](./compat-class-validator.md) для подробностей.

**Замечание про NestJS:** опции по умолчанию `ValidationPipe`
(`whitelist`, `forbidNonWhitelisted` и подобные) теперь реально применяются.
Если вы используете `@om-data-mapper/class-validator` (или алиас
`class-validator-compat`) за `ValidationPipe` от NestJS с его настройками по
умолчанию, обновление до v5 может начать удалять или отклонять свойства,
которые раньше проходили без изменений — проверьте свои DTO.

v5 также добавляет API, которых полностью не было в v4:

- Функциональная форма `message` в опциях валидации, вызываемая с
  `ValidationArguments` (`{ value, constraints, targetName, object, property }`):

  ```typescript
  class Dto {
    @IsString({
      message: (args: ValidationArguments) =>
        `${args.property} of ${args.targetName} got ${args.value}`,
    })
    name: any = 42;
  }
  ```

- `registerDecorator`, для написания собственных декораторов. Его нужно
  вызывать изнутри колбэка TC39 `addInitializer` — см.
  [`./compat-class-validator.md`](./compat-class-validator.md#миграция-пользовательских-декораторов-registerdecorator)
  для полного паттерна, поскольку контекста декоратора на основе
  `reflect-metadata`, к которому можно было бы подключиться, больше нет.
- `getMetadataStorage`, как минимальный фасад.
- Обрезка `target`/`value` в `ValidationError`: `error.target` и
  `error.value` рекурсивно обрезаются (в том числе через `children`), чтобы
  ошибки по умолчанию не раскрывали весь валидируемый объект.

## Изменения поведения в адаптере class-transformer

`enableImplicitConversion` теперь реализована — приведение примитивов через
`@Type`:

```typescript
class Dto {
  @Type(() => Number)
  age!: number;
}

const dto = plainToInstance(Dto, { age: '42' }, { enableImplicitConversion: true });
// dto.age === 42 (number)
```

Это требует явного `@Type(() => Number/String/Boolean/Date)` на свойстве —
без типов времени разработки, выводимых из `reflect-metadata`, под
декораторами TC39 приводить попросту не к чему без явного `@Type`. См.
[`./compat-class-transformer.md`](./compat-class-transformer.md) про
оговорку про массивы примитивов.

Следующие неработавшие поля `ClassTransformOptions` были **удалены из
типов**: `enableCircularCheck`, `exposeUnsetFields`, `targetMaps`,
`enableValidation`. Они никогда ничего не делали в v4 — код, который их
передаёт, теперь не проходит компиляцию TypeScript. Решение — удалить опцию
в месте вызова; замена не нужна, поскольку ни одна из них не имела эффекта
и раньше.

## Что НЕ поддерживается

Полный и честный список того, что каждый адаптер реализует, а что нет —
нереализованные `ValidatorOptions`, отсутствующие декораторы и пробелы API
относительно апстрима `class-validator`/`class-transformer` — смотрите в
таблицах совместимости, а не полагайтесь на исчерпывающесть этого
руководства:

- [`./compat-class-validator.md`](./compat-class-validator.md)
- [`./compat-class-transformer.md`](./compat-class-transformer.md)

Ни один из адаптеров не заявляет полного паритета с апстримом; они являются
готовой заменой для поддерживаемого подмножества, описанного в этих
таблицах.

## Чек-лист

- [ ] Обновите `om-data-mapper` (или используемые скоуп-пакеты) до версий v5.
- [ ] При желании перейдите с мета-пакета на используемые скоуп-пакеты
      `@om-data-mapper/*`, чтобы уменьшить объём зависимостей.
- [ ] Проверьте весь код, передающий `whitelist: true` (напрямую или через
      настройки `ValidationPipe` в NestJS по умолчанию) — теперь он
      действительно удаляет неизвестные свойства.
- [ ] Уберите все использования удалённых опций class-transformer
      (`enableCircularCheck`, `exposeUnsetFields`, `targetMaps`,
      `enableValidation`) — они никогда ничего не делали, поэтому удалить их
      безопасно.
- [ ] Запустите тестовый набор.
