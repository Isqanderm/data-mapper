# Совместимость с class-validator

Статус `@tech-pioneer/data-mapper-class-validator` относительно `class-validator@0.14`.

Эта таблица сгенерирована на основе чтения текущего исходного кода
(`packages/class-validator/src`), а не документации апстрима. Если
поведение, описанное здесь, и код когда-либо разойдутся — прав код,
пожалуйста, заведите issue.

## ValidatorOptions

| Опция                           | Статус | Примечания                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| groups                          | ✅     | без опции groups (или с пустым массивом) выполняются все ограничения; при заданном фильтре выполняются только те, чьи группы пересекаются, а ограничение без групп пропускается — как в upstream                                                                                                       |
| always                          | ✅     | задаётся у декоратора или по умолчанию через `ValidatorOptions.always`; ограничение с always игнорирует фильтр групп                                                                                                                                                                                   |
| skipMissingProperties           | ✅     | `@IsDefined` всё равно срабатывает, как и в апстриме                                                                                                                                                                                                                                                   |
| skipNullProperties              | ✅     |                                                                                                                                                                                                                                                                                                        |
| skipUndefinedProperties         | ✅     |                                                                                                                                                                                                                                                                                                        |
| whitelist                       | ✅     | мутирует валидируемый объект (удаляет неизвестные свойства), как и в апстриме                                                                                                                                                                                                                          |
| forbidNonWhitelisted            | ✅     | действует только вместе с `whitelist: true`                                                                                                                                                                                                                                                            |
| stopAtFirstError                | ✅     | посвойственно; для `validate()` (асинхронной) ограничения всё равно планируются/ожидаются в порядке объявления, а проверка «остановки» применяется постфактум (после обрезки), поэтому асинхронное ограничение после первой ошибки может успеть выполниться до того, как будет отброшено из результата |
| forbidUnknownValues             | ⚠️     | реализовано; **по умолчанию `false`** (в апстриме ≥0.14 по умолчанию `true`) — это намеренное расхождение, а не ошибка                                                                                                                                                                                 |
| validationError.target / .value | ✅     | обрезаются рекурсивно через `children`, включая синтетическую ошибку от `forbidUnknownValues`                                                                                                                                                                                                          |
| strictGroups                    | ❌     | не реализовано                                                                                                                                                                                                                                                                                         |
| dismissDefaultMessages          | ❌     | не реализовано                                                                                                                                                                                                                                                                                         |
| enableDebugMessages             | ❌     | no-op                                                                                                                                                                                                                                                                                                  |

## API

| API                                                                        | Статус | Примечания                                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| validate / validateSync / validateOrReject                                 | ✅     | плюс отсутствующие в апстриме `validateMany` / `validateManySync` / `validateOrRejectSync`                                                                                                                                                                                                                                                      |
| registerDecorator                                                          | ✅     | должен вызываться изнутри TC39 `addInitializer` (см. пример ниже); контекста декоратора legacy `reflect-metadata`, к которому можно подключиться, нет. Ключи ошибок берутся из зарегистрированного имени — см. «Ключи ошибок для пользовательских валидаторов»                                                                                  |
| getMetadataStorage                                                         | ⚠️     | минимальный фасад: реализован только `getTargetValidationMetadatas(target)`; нет `addValidationMetadata`, `groupedValidationMetadatas` и т. д.                                                                                                                                                                                                  |
| ValidationError.target/value/children/constraints                          | ✅     | `contexts` **не** реализовано — у `ValidationError` нет поля `contexts`                                                                                                                                                                                                                                                                         |
| message как функция                                                        | ✅     | вызывается с `{ value, constraints, targetName, object, property }` (`ValidationArguments`)                                                                                                                                                                                                                                                     |
| шаблонизация `$property` / `$value` / `$constraint` в строковых сообщениях | ❌     | строковые сообщения используются буквально; используйте вместо этого функцию-сообщение                                                                                                                                                                                                                                                          |
| опция декоратора `each`                                                    | ✅     | применяет ограничение к каждому элементу массива или `Set`; одна ошибка на свойство, а не на элемент; значение, не являющееся коллекцией, не проверяется. Сообщения по умолчанию получают префикс `each value ` (в upstream — `each value in `, потому что там за префиксом следует имя свойства, которое upstream включает в каждое сообщение) |
| формат сообщений по умолчанию                                              | ✅     | сообщения называют своё свойство, как в upstream (`username must be at least 3 characters`); при `each` имя свойства идёт после префикса `each value in `. Формулировки самих сообщений собственные и дословно с upstream не совпадают                                                                                                          |
| наследование ограничений                                                   | ✅     | подкласс проверяет как свои ограничения, так и унаследованные; на родителя его подклассы не влияют                                                                                                                                                                                                                                              |

## Декораторы

### Поддерживаются

Список получен из веток `case '...'` в
`packages/class-validator/src/engine/compiler.ts` и экспортов декораторов
в `packages/class-validator/src/decorators/`:

Общие: `IsOptional`, `IsDefined`, `IsNotEmpty`, `Equals`, `NotEquals`, `IsIn`, `IsNotIn`, `IsEmpty`

Проверка типа: `IsBoolean`, `IsDate`, `IsString`, `IsNumber`, `IsInt`, `IsArray`, `IsObject`,
`IsEnum`, `IsInstance`, `IsNotEmptyObject`

Числа: `Min`, `Max`, `IsPositive`, `IsNegative`, `IsDivisibleBy`, `IsDecimal`

Даты: `MinDate`, `MaxDate`

Массивы: `ArrayNotEmpty`, `ArrayMinSize`, `ArrayMaxSize`, `ArrayContains`, `ArrayNotContains`,
`ArrayUnique`

Географические: `IsLatLong`, `IsLatitude`, `IsLongitude`

Строки: `IsString` (см. выше), `MinLength`, `MaxLength`, `Length`, `IsEmail`, `IsURL` (также экспортируется как `IsUrl`), `IsUUID`,
`IsJSON`, `IsAlpha`, `IsAlphanumeric`, `IsHexColor`, `IsIP`, `IsCreditCard`, `IsISBN`,
`IsPhoneNumber`, `Contains`, `NotContains`, `IsLowercase`, `IsUppercase`, `Matches`, `IsFQDN`,
`IsISO8601`, `IsDateString`, `IsMobilePhone`, `IsPostalCode`, `IsMongoId`, `IsJWT`,
`IsStrongPassword`, `IsPort`, `IsMACAddress`, `IsBase64`, `IsIBAN`, `IsBIC`, `IsCurrency`,
`IsISO4217CurrencyCode`, `IsEthereumAddress`, `IsBtcAddress`, `IsPassportNumber`, `IsIdentityCard`,
`IsEAN`, `IsISIN`, `IsMagnetURI`, `IsDataURI`, `IsISO31661Alpha2`, `IsISO31661Alpha3`, `IsLocale`,
`IsSemVer`, `IsMimeType`, `IsTimeZone`, `IsRFC3339` `IsAscii`, `IsBase32`, `IsBase58`, `IsBooleanString`, `IsByteLength`, `IsFirebasePushId`, `IsFullWidth`, `IsHSL`, `IsHalfWidth`, `IsHash`, `IsHexadecimal`, `IsISRC`, `IsISSN`, `IsMilitaryTime`, `IsMultibyte`, `IsNumberString`, `IsOctal`, `IsRgbColor`, `IsSurrogatePair`, `IsTaxId`, `IsVariableWidth`.

Вложенные / условные: `ValidateNested`, `ValidateIf`, `ValidatePromise`

Пользовательские: `Validate`, `ValidateBy`, `Allow`, `ValidatorConstraint`

Примечание: `IsPositive`/`IsNegative` реализованы через переиспользование ограничения движка
`min`/`max` (`min: 0.000001` / `max: -0.000001`), а не через отдельные типы ограничений, а `Length`
компилируется в комбинацию `minLength` + `maxLength` — оба варианта ведут себя идентично апстриму
с точки зрения вызывающего кода.

### Отсутствует относительно апстрима

Ничего. Все декораторы, которые экспортирует `class-validator@0.14.4`, экспортируются и здесь —
проверено сравнением рантайм-экспортов обоих пакетов, а не чтением списков. Различается глубина, а
не наличие: часть декораторов игнорирует объект опций validator.js, который принимает апстрим
(`@IsEmail`, `@IsURL`, `@IsStrongPassword`, версия у `@IsUUID`, `@IsHash` сверх имени алгоритма), а
`@IsTaxId` распознаёт только формат `en-US`. Эти строки отмечены в таблицах выше.

## Миграция пользовательских декораторов (registerDecorator)

`registerDecorator` должен вызываться из колбэка TC39 `addInitializer` — контекста фабрики
декоратора на основе `reflect-metadata`, к которому можно было бы подключиться напрямую, не
существует. Это паттерн, используемый во всём тестовом наборе (дословно из
`tests/unit/compat/class-validator/register-decorator.test.ts`):

```typescript
import {
  registerDecorator,
  type ValidationArguments,
  type ValidationDecoratorOptions,
} from '@tech-pioneer/data-mapper-class-validator';

function IsLongerThan(property: string, options?: ValidationDecoratorOptions) {
  return function (_: undefined, context: ClassFieldDecoratorContext) {
    context.addInitializer(function (this: any) {
      registerDecorator({
        name: 'isLongerThan',
        target: this.constructor,
        propertyName: String(context.name),
        constraints: [property],
        options,
        validator: {
          validate(value: any, args?: ValidationArguments) {
            const [related] = args!.constraints;
            const other = (args!.object as any)[related];
            return (
              typeof value === 'string' && typeof other === 'string' && value.length > other.length
            );
          },
          defaultMessage(args?: ValidationArguments) {
            return `${args!.property} must be longer than ${args!.constraints[0]}`;
          },
        },
      });
    });
  };
}

class Dto {
  firstName: string = 'Alexander';

  @IsLongerThan('firstName')
  lastName: string = 'Li';
}
```

### Ключи ошибок для пользовательских валидаторов

Как и в upstream, валидатор-класс сообщает об ошибке под своим **зарегистрированным именем**, а не
под общим ключом `custom`. Имя определяется в следующем порядке:

1. `@ValidatorConstraint({ name })` на классе-ограничении — а если класс декорирован без `name`, то
   имя класса как есть. Это соответствует upstream, где собственные метаданные класса-ограничения
   всегда побеждают.
2. Явное `name`, переданное в `registerDecorator({ name })` — оно попадает в ключ ошибки только
   тогда, когда у класса-ограничения нет метаданных `@ValidatorConstraint`. Передача `name`,
   расходящегося с декорированным классом, **не** переименовывает ключ.
3. Имя класса со строчной первой буквой
   (`IsLongerThanConstraint` → `isLongerThanConstraint`). Этот шаг — **расширение только для
   compat-слоя**: upstream вообще откажется выполнять класс-ограничение, который не был
   зарегистрирован через `@ValidatorConstraint`.

Это работает и для `registerDecorator({ validator: SomeConstraintClass })`, и для
`@Validate(SomeConstraintClass)` (использует шаги 1 и 3) — одинаково в `validate` и `validateSync`:

```typescript
const errors = validateSync(dto);
errors[0].constraints; // { isLongerThan: 'lastName must be longer than firstName' }
```

Поскольку шаг 3 читает `Class.name`, бандлер, коверкающий имена классов, незаметно меняет ключ
ошибки в production-сборке — всегда указывайте production-классу-ограничению явное
`@ValidatorConstraint({ name })`.

Имя, не являющееся корректным JavaScript-идентификатором, откатывается к ключу `custom`; то же
касается имени `__proto__`. **Инлайновый** объект-валидатор, зарегистрированный без `name`,
по-прежнему сообщает об ошибке под ключом `customValidation` — передайте `name` в
`registerDecorator`, если нужен конкретный ключ.

Повторные регистрации дедуплицируются по идентичности валидатора — классу-ограничению либо (для
инлайнового валидатора) его имени, ссылке на объект и исходному коду его функции `validate` — вместе
с массивом `constraints` и опциями (`message`, `groups`, `always`). Поэтому повторный запуск того же
`addInitializer` при каждом создании экземпляра не наращивает метаданные, а две действительно разные
регистрации на одном свойстве сохраняются и обе применяются.

Из сравнения по исходному коду следует одно ограничение: два применения **одной и той же
параметризованной инлайновой фабрики** к одному свойству (`@MinLen(3) @MinLen(5)`, где каждое
применение регистрирует `{ validate: (v) => v.length >= n }`) дают идентичный исходный текст и
схлопываются в одну регистрацию. Чтобы сохранить обе, дайте каждому применению отдельное `name` или
используйте разные `constraints`. Вынесение объекта-валидатора наружу из `addInitializer` ничего не
меняет: проверка дедупликации сначала сравнивает по ссылке как быстрый путь, а затем откатывается к
сравнению `validate.toString()`, причём равенство ссылок всегда влечёт равенство исходного текста —
поэтому вынесение объекта наружу не даёт эффекта, наблюдаемого потребителем.
