import type { Mapper } from "./index";
export type Transformer<T, TResult> = (source: T) => TResult;
export type DeepPath<Source, K extends keyof Source> = K extends string ? Source[K] extends Record<string, any> ? Source[K] extends Array<any> ? K | `${K}.${DeepPath<Source[K], Exclude<keyof Source[K], keyof any[]>>}` : K | `${K}.${DeepPath<Source[K], keyof Source[K]>}` : K : never;
export type MappingConfiguration<TSource, TTarget> = {
    [P in keyof TTarget]?: keyof TSource | Transformer<TSource, TTarget[P]> | Mapper<any, any> | DeepPath<TSource, keyof TSource>;
};
//# sourceMappingURL=interface.d.ts.map