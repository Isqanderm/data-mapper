# Совместимость с class-transformer

Статус `@om-data-mapper/class-transformer` относительно `class-transformer@0.5`.

Эта таблица сгенерирована на основе чтения текущего исходного кода
(`packages/class-transformer/src`), а не документации апстрима. Если
поведение, описанное здесь, и код когда-либо разойдутся — прав код,
пожалуйста, заведите issue.

## ClassTransformOptions

| Опция                    | Статус     | Примечания                                                                                                                                                                                                                                                                                                      |
| ------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| strategy                 | ✅         | `'excludeAll' \| 'exposeAll'`, по умолчанию `'exposeAll'`                                                                                                                                                                                                                                                       |
| excludeExtraneousValues  | ✅         | эквивалентно `strategy: 'excludeAll'`                                                                                                                                                                                                                                                                           |
| groups                   | ✅         |                                                                                                                                                                                                                                                                                                                 |
| version                  | ✅         | `since` / `until` на `@Expose`                                                                                                                                                                                                                                                                                  |
| excludePrefixes          | ✅         |                                                                                                                                                                                                                                                                                                                 |
| ignoreDecorators         | ✅         |                                                                                                                                                                                                                                                                                                                 |
| enableImplicitConversion | ⚠️         | **требует `@Type(() => Number/String/Boolean/Date)` на свойстве** — под декораторами TC39 нет выводимого через `reflect-metadata` типа времени разработки, поэтому без явного `@Type` попросту не к чему приводить значение. Массивы (например, `@Type(() => Number) values: number[]`) приводятся поэлементно. |
| enableCircularCheck      | ❌ удалено | не реализовано; этот движок не выполняет обнаружение циклических ссылок во время трансформации                                                                                                                                                                                                                  |
| exposeUnsetFields        | ❌ удалено | не реализовано                                                                                                                                                                                                                                                                                                  |
| targetMaps               | ❌ удалено | не реализовано                                                                                                                                                                                                                                                                                                  |
| enableValidation         | ❌ удалено | не реализовано — этот пакет не выполняет валидацию; используйте `@om-data-mapper/class-validator` отдельно                                                                                                                                                                                                      |

## Функции

| API                               | Статус | Примечания                                                                                          |
| --------------------------------- | ------ | --------------------------------------------------------------------------------------------------- |
| plainToClass / plainToInstance    | ✅     | `plainToInstance` — алиас для `plainToClass`                                                        |
| classToPlain / instanceToPlain    | ✅     | `instanceToPlain` — алиас для `classToPlain`                                                        |
| classToClass / instanceToInstance | ✅     | `instanceToInstance` — алиас для `classToClass`; реализован как цепочка classToPlain → plainToClass |
| plainToClassFromExist             | ✅     |                                                                                                     |
| serialize                         | ✅     |                                                                                                     |
| deserialize                       | ✅     |                                                                                                     |
| deserializeArray                  | ✅     | выбрасывает исключение, если распарсенный JSON не является массивом                                 |

## Декораторы

| Декоратор                                                                | Статус | Примечания                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @Expose                                                                  | ✅     | поддерживает `name`, `groups`, `since`, `until`, `toClassOnly`, `toPlainOnly`                                                                                                                                                                                                            |
| @Exclude                                                                 | ✅     | поддерживает `toClassOnly`, `toPlainOnly`                                                                                                                                                                                                                                                |
| @Type                                                                    | ✅     | поддерживает трансформацию вложенных классов и, в сочетании с `enableImplicitConversion`, приведение примитивов (см. оговорку выше)                                                                                                                                                      |
| @Type discriminator                                                      | ❌     | `TypeOptions.discriminator` и `TypeOptions.keepDiscriminatorProperty` объявлены в сигнатуре типа (`packages/class-transformer/src/types.ts`), но **нигде не читаются** в `decorators.ts` или `functions.ts` — передача discriminator не даёт эффекта. Полиморфный `@Type` не реализован. |
| @Transform                                                               | ✅     | получает `{ value, key, obj, type, options }`; поддерживает `toClassOnly`/`toPlainOnly`                                                                                                                                                                                                  |
| @TransformClassToPlain / @TransformClassToClass / @TransformPlainToClass | ✅     | декораторы методов, формально не входят в задокументированный публичный API апстрима, но поставляются здесь для паритета с legacy-использованием                                                                                                                                         |

## @Expose / @Exclude на уровне класса

`@Expose()` / `@Exclude()`, применённые на уровне класса (а не поля),
принимаются синтаксически, но являются **no-op** — на трансформацию сейчас
влияет только использование на уровне поля. Не полагайтесь на поведение
exclude/expose по умолчанию на уровне класса.
