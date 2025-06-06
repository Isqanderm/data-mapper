import type { Mapper } from "./index";

// === 1) Базовые утилиты ===

/** Исключаем вложенные Mapper из DefaultValues */
export type ExcludeMapperProperties<T> = {
  [K in keyof T as T[K] extends Mapper<any, any> ? never : K]: T[K];
};

/** Значения по умолчанию для Target, частичные и допускают null */
export type DefaultValues<T> = {
  [K in keyof ExcludeMapperProperties<T>]?: T[K] extends object
    ? DefaultValues<T[K]> | null
    : T[K] | null;
};

/** Извлекаем тип элемента массива */
export type ExtractArrayType<T> = T extends readonly (infer U)[] ? U : T;

/** Функция-трансформер */
export type Transformer<T, R> = (source: T) => R;

/** Только строковые ключи объекта */
export type ObjKey<S> = Extract<keyof S, string>;

// === 2) DeepPath: строит пути для объектов и массивов ===

export type DeepPath<S> = S extends object
  ? {
      [K in ObjKey<S>]: NonNullable<S[K]> extends readonly (infer U)[]
        ?
            | K
            | `${K}.[]`
            | `${K}.[${number}]`
            | `${K}.[].${DeepPath<U>}`
            | `${K}.[${number}].${DeepPath<U>}`
        : NonNullable<S[K]> extends object
          ? K | `${K}.${DeepPath<NonNullable<S[K]>>}`
          : K;
    }[ObjKey<S>]
  : never;

// === 3) PathValue: вычисление типа по строковому пути ===

/** Разбор для объекта */
type PathValueFromObject<
  S,
  P extends string,
> = P extends `${infer Key}.[].${infer Rest}`
  ? Key extends ObjKey<S>
    ? PathValueFromObject<ExtractArrayType<NonNullable<S[Key]>>, Rest>[]
    : never
  : P extends `${infer Key}.[]`
    ? Key extends ObjKey<S>
      ? ExtractArrayType<NonNullable<S[Key]>>[]
      : never
    : P extends `${infer Key}.[${infer _Idx}]`
      ? Key extends ObjKey<S>
        ? ExtractArrayType<NonNullable<S[Key]>>
        : never
      : P extends `${infer Key}.${infer Rest}`
        ? Key extends ObjKey<S>
          ? PathValueFromObject<NonNullable<S[Key]>, Rest>
          : never
        : P extends ObjKey<S>
          ? S[P]
          : never;

/** Разбор для tuple-источника */
type PathValueFromTuple<
  Args extends readonly any[],
  P extends string,
> = P extends `$${infer I}.[].${infer Rest}`
  ? I extends `${infer N extends number}`
    ? PathValueFromObject<ExtractArrayType<Args[N]>, Rest>[]
    : never
  : P extends `$${infer I}.[${infer _Idx}].${infer Rest}`
    ? I extends `${infer N extends number}`
      ? PathValueFromObject<ExtractArrayType<Args[N]>, Rest>
      : never
    : P extends `$${infer I}.${infer Rest}`
      ? I extends `${infer N extends number}`
        ? PathValueFromObject<Args[N], Rest>
        : never
      : P extends `$${infer I}`
        ? I extends `${infer N extends number}`
          ? Args[N]
          : never
        : never;

/** Объединение: выбираем разбор по типу Source */
export type PathValue<Source, P extends string> = Source extends readonly any[]
  ? PathValueFromTuple<Source, P>
  : PathValueFromObject<Source, P>;

// === 4) Фильтрация валидных ключей и путей ===

/** Корневые ключи S, тип которых совместим с T */
export type ValidKeys<S, T> = {
  [K in ObjKey<S>]: S[K] extends T ? K : never;
}[ObjKey<S>];

/** Рекомендуется: вместо ValidDeepPaths используйте ниже ValidObjPaths */
export type ValidDeepPaths<S, T> = ValidObjPaths<S, T>;

/** Только правильные строки-пути для объектов */
export type ValidObjPaths<S, T> = {
  [P in DeepPath<S>]: PathValue<S, P> extends T ? P : never;
}[DeepPath<S>];

// === 5) Поддержка tuple-источника ===

/** Числовые ключи кортежа */
export type NumericIndex<Args extends readonly any[]> = Extract<
  keyof Args,
  `${number}`
>;

/** Пути для tuple: wildcard и индексы */
export type ArgPath<Args extends readonly any[]> = {
  [I in NumericIndex<Args>]: NonNullable<Args[I]> extends readonly any[]
    ?
        | `$${I}`
        | `$${I}.[]`
        | `$${I}.[${number}]`
        | `$${I}.[].${DeepPath<ExtractArrayType<Args[I]>>}`
        | `$${I}.[${number}].${DeepPath<ExtractArrayType<Args[I]>>}`
    : NonNullable<Args[I]> extends object
      ? `$${I}` | `$${I}.${ObjKey<Args[I]>}`
      : `$${I}`;
}[NumericIndex<Args>];

/** Из ArgPath оставляем только те, которые возвращают T */
export type ValidArgPaths<Args extends readonly any[], T> = {
  [P in ArgPath<Args>]: PathValue<Args, P> extends T ? P : never;
}[ArgPath<Args>];

// === 6) Основная конфигурация маппера ===

export type MappingConfiguration<Source, Target> = Source extends readonly any[]
  ? {
      [K in keyof Target]:
        | Transformer<Source, Target[K]>
        | Mapper<Source, Target[K]>
        | ValidArgPaths<Source, Target[K]>
        | (Target[K] extends object
            ? MappingConfiguration<Source, Target[K]>
            : never);
    }
  : {
      [K in keyof Target]:
        | Transformer<Source, Target[K]>
        | (K extends keyof Source
            ?
                | Mapper<Source[K], Target[K]>
                | Mapper<NonNullable<Source[K]>, NonNullable<Target[K]>>
            : never)
        | ValidKeys<Source, Target[K]>
        | ValidObjPaths<Source, Target[K]>
        | (Target[K] extends object
            ? MappingConfiguration<Source, Target[K]>
            : never);
    };

// === 7) Результаты и конфиг ===

export interface MappingResult<T> {
  result: T;
  errors: string[];
}

export interface MapperConfig {
  useUnsafe: boolean;
}
