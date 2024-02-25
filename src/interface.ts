import type { Mapper } from "./index";

export type Transformer<T, TResult> = (source: T) => TResult;

export type MappingConfiguration<TSource, TTarget> = {
  [P in keyof TTarget]?:
    | keyof TSource
    | Transformer<TSource, TTarget[P]>
    | Mapper<any, any>;
};
