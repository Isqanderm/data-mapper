import type { Mapper } from './Mapper';

// === 1) Basic utility types ===

/**
 * Excludes nested Mapper properties from a type
 *
 * This utility type filters out any properties that are Mapper instances,
 * leaving only regular data properties. Used internally for default value handling.
 *
 * @template T - The type to filter
 *
 * @example
 * ```typescript
 * type User = {
 *   name: string;
 *   address: AddressMapper;  // This will be excluded
 *   age: number;
 * };
 *
 * type Filtered = ExcludeMapperProperties<User>;
 * // { name: string; age: number }
 * ```
 */
export type ExcludeMapperProperties<T> = {
  [K in keyof T as T[K] extends Mapper<any, any> ? never : K]: T[K];
};

/**
 * Default values type for target objects
 *
 * Represents partial default values for a target type, where each property
 * can be the property's type or null. Nested objects are handled recursively.
 * Mapper properties are automatically excluded.
 *
 * @template T - The target type
 *
 * @example
 * ```typescript
 * type UserDTO = {
 *   name: string;
 *   age: number;
 *   address: {
 *     city: string;
 *   };
 * };
 *
 * const defaults: DefaultValues<UserDTO> = {
 *   name: 'Unknown',
 *   age: null,
 *   address: { city: 'N/A' }
 * };
 * ```
 */
export type DefaultValues<T> = {
  [K in keyof ExcludeMapperProperties<T>]?: T[K] extends object
    ? DefaultValues<T[K]> | null
    : T[K] | null;
};

/**
 * Extracts the element type from an array type
 *
 * @template T - The array type or regular type
 * @returns The element type if T is an array, otherwise T itself
 *
 * @example
 * ```typescript
 * type StringArray = string[];
 * type Element = ExtractArrayType<StringArray>;  // string
 *
 * type NotArray = number;
 * type Same = ExtractArrayType<NotArray>;  // number
 * ```
 */
export type ExtractArrayType<T> = T extends readonly (infer U)[] ? U : T;

/**
 * Transformer function type
 *
 * Represents a function that transforms a value from type T to type R.
 * Used throughout the mapper system for custom transformations.
 *
 * @template T - The input type
 * @template R - The output type
 *
 * @example
 * ```typescript
 * const toUpperCase: Transformer<string, string> = (value) => value.toUpperCase();
 * const toNumber: Transformer<string, number> = (value) => parseInt(value, 10);
 * const combine: Transformer<User, string> = (user) => `${user.firstName} ${user.lastName}`;
 * ```
 */
export type Transformer<T, R> = (source: T) => R;

/**
 * Extracts only string keys from an object type
 *
 * Filters out symbol and number keys, leaving only string property names.
 * Used internally for type-safe property path construction.
 *
 * @template S - The source object type
 *
 * @example
 * ```typescript
 * type Mixed = {
 *   name: string;
 *   [Symbol.iterator]: () => void;
 *   123: number;
 * };
 *
 * type StringKeys = ObjKey<Mixed>;  // 'name'
 * ```
 */
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
type PathValueFromObject<S, P extends string> = P extends `${infer Key}.[].${infer Rest}`
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
export type NumericIndex<Args extends readonly any[]> = Extract<keyof Args, `${number}`>;

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
        | (Target[K] extends object ? MappingConfiguration<Source, Target[K]> : never);
    }
  : {
      [K in keyof Target]:
        | Transformer<Source, Target[K]>
        | (K extends keyof Source
            ? Mapper<Source[K], Target[K]> | Mapper<NonNullable<Source[K]>, NonNullable<Target[K]>>
            : never)
        | ValidKeys<Source, Target[K]>
        | ValidObjPaths<Source, Target[K]>
        | (Target[K] extends object ? MappingConfiguration<Source, Target[K]> : never);
    };

// === 7) Mapping results and configuration ===

/**
 * Result of a mapping transformation
 *
 * Contains both the transformed result and any errors that occurred during the mapping process.
 * This interface enables graceful error handling without throwing exceptions, allowing you to
 * inspect transformation errors while still accessing the partially transformed result.
 *
 * @template T - The type of the transformed target object
 *
 * @example Basic usage with error checking
 * ```typescript
 * const { result, errors } = mapper.tryTransform(source);
 *
 * if (errors.length > 0) {
 *   console.error('Mapping errors:', errors);
 *   // Handle errors appropriately
 * } else {
 *   // Use the successfully transformed result
 *   console.log('Transformed:', result);
 * }
 * ```
 *
 * @example Using with tryPlainToInstance
 * ```typescript
 * import { tryPlainToInstance } from 'om-data-mapper';
 *
 * const { result, errors } = tryPlainToInstance(UserMapper, source);
 *
 * // Result is always present, even if there were errors
 * // Errors array will be empty if transformation succeeded
 * ```
 *
 * @see {@link IMapper.tryTransform} for the method that returns this type
 */
export interface MappingResult<T> {
  /** The transformed target object (may be partial if errors occurred) */
  result: T;
  /** Array of error messages encountered during transformation (empty if successful) */
  errors: string[];
}

/**
 * Configuration options for mapper instances
 *
 * Controls the behavior of the mapper during transformation, particularly
 * around error handling and performance optimization.
 *
 * @example
 * ```typescript
 * const config: MapperConfig = {
 *   useUnsafe: true  // Disable error handling for maximum performance
 * };
 * ```
 */
export interface MapperConfig {
  /**
   * If true, disables try-catch error handling for maximum performance.
   * Only use when you're certain the source data is valid.
   * @default false
   */
  useUnsafe: boolean;
}
