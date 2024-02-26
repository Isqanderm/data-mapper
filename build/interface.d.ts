import type { Mapper } from "./index";
export type ExcludeMapperProperties<T> = {
    [Key in keyof T as T[Key] extends Mapper<any, any> ? never : Key]: T[Key];
};
export type Nullable<T> = {
    [Key in keyof T]: T[Key] | null;
};
export type DefaultValues<T> = Partial<Nullable<ExcludeMapperProperties<T>>>;
export type Transformer<T, TResult> = (source: T) => TResult;
export type DeepPath<Source, K extends keyof Source> = K extends string ? Source[K] extends Record<string, any> ? Source[K] extends Array<any> ? K | `${K}.${DeepPath<Source[K], Exclude<keyof Source[K], keyof any[]>>}` : K | `${K}.${DeepPath<Source[K], keyof Source[K]>}` : K : never;
export type MappingConfiguration<TSource, TTarget> = {
    [P in keyof TTarget]: keyof TSource | Transformer<TSource, TTarget[P]> | Mapper<any, any> | DeepPath<TSource, keyof TSource>;
};
//# sourceMappingURL=interface.d.ts.map