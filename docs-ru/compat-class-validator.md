# Совместимость с class-validator

Статус `@om-data-mapper/class-validator` относительно `class-validator@0.14`.

Эта таблица сгенерирована на основе чтения текущего исходного кода
(`packages/class-validator/src`), а не документации апстрима. Если
поведение, описанное здесь, и код когда-либо разойдутся — прав код,
пожалуйста, заведите issue.

## ValidatorOptions

| Опция                           | Статус | Примечания                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| groups                          | ✅     |                                                                                                                                                                                                                                                                                                        |
| always                          | ❌     | сохраняется в метаданных, но компилятор его никогда не читает — сейчас это no-op                                                                                                                                                                                                                       |
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

| API                                                                        | Статус | Примечания                                                                                                                                            |
| -------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| validate / validateSync / validateOrReject                                 | ✅     | плюс отсутствующие в апстриме `validateMany` / `validateManySync` / `validateOrRejectSync`                                                            |
| registerDecorator                                                          | ✅     | должен вызываться изнутри TC39 `addInitializer` (см. пример ниже); контекста декоратора legacy `reflect-metadata`, к которому можно подключиться, нет |
| getMetadataStorage                                                         | ⚠️     | минимальный фасад: реализован только `getTargetValidationMetadatas(target)`; нет `addValidationMetadata`, `groupedValidationMetadatas` и т. д.        |
| ValidationError.target/value/children/constraints                          | ✅     | `contexts` **не** реализовано — у `ValidationError` нет поля `contexts`                                                                               |
| message как функция                                                        | ✅     | вызывается с `{ value, constraints, targetName, object, property }` (`ValidationArguments`)                                                           |
| шаблонизация `$property` / `$value` / `$constraint` в строковых сообщениях | ❌     | строковые сообщения используются буквально; используйте вместо этого функцию-сообщение                                                                |

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

Строки: `IsString` (см. выше), `MinLength`, `MaxLength`, `Length`, `IsEmail`, `IsURL`, `IsUUID`,
`IsJSON`, `IsAlpha`, `IsAlphanumeric`, `IsHexColor`, `IsIP`, `IsCreditCard`, `IsISBN`,
`IsPhoneNumber`, `Contains`, `NotContains`, `IsLowercase`, `IsUppercase`, `Matches`, `IsFQDN`,
`IsISO8601`, `IsDateString`, `IsMobilePhone`, `IsPostalCode`, `IsMongoId`, `IsJWT`,
`IsStrongPassword`, `IsPort`, `IsMACAddress`, `IsBase64`, `IsIBAN`, `IsBIC`, `IsCurrency`,
`IsISO4217CurrencyCode`, `IsEthereumAddress`, `IsBtcAddress`, `IsPassportNumber`, `IsIdentityCard`,
`IsEAN`, `IsISIN`, `IsMagnetURI`, `IsDataURI`, `IsISO31661Alpha2`, `IsISO31661Alpha3`, `IsLocale`,
`IsSemVer`, `IsMimeType`, `IsTimeZone`, `IsRFC3339`

Вложенные / условные: `ValidateNested`, `ValidateIf`, `ValidatePromise`

Пользовательские: `Validate`, `ValidateBy`, `Allow`, `ValidatorConstraint`

Примечание: `IsPositive`/`IsNegative` реализованы через переиспользование ограничения движка
`min`/`max` (`min: 0.000001` / `max: -0.000001`), а не через отдельные типы ограничений, а `Length`
компилируется в комбинацию `minLength` + `maxLength` — оба варианта ведут себя идентично апстриму
с точки зрения вызывающего кода.

### Отсутствует относительно апстрима (список неполный)

Сопоставлено со списком публичных декораторов `class-validator@0.14` по памяти — воспринимайте
этот раздел как отправную точку, а не гарантию, и проверяйте по апстриму, прежде чем полагаться на
отсутствие декоратора:

- `IsBooleanString`, `IsNumberString`
- `IsHexadecimal`, `IsOctal`, `IsAscii`
- `IsFullWidth`, `IsHalfWidth`, `IsVariableWidth`, `IsMultibyte`, `IsSurrogatePair`
- `IsBase32`, `IsBase58`
- `IsHash`, `IsISRC`
- `IsRgbColor`, `IsHSL`
- `IsMilitaryTime`
- `IsTaxId`
- `IsISO31661Alpha3` под-варианты / опции декораторов рядом со `strictGroups` (см. таблицу
  ValidatorOptions выше)

Если вам нужен один из этих декораторов и он не отмечен здесь как поддерживаемый, считайте его
отсутствующим, пока обратное не подтверждено чтением `packages/class-validator/src/decorators/`.

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
} from '@om-data-mapper/class-validator';

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
