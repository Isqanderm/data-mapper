import type { Mapper } from "./index";
export type ExcludeMapperProperties<T> = {
    [Key in keyof T as T[Key] extends Mapper<any, any> ? never : Key]: T[Key];
};
export type IsObjectWithProperties<T> = T extends Record<string, any> ? true : false;
export type IsArray<T> = T extends Array<any> ? true : false;
export type IsString<T> = T extends String ? true : false;
export type Nullable<T> = {
    [Key in keyof T]: T[Key] | null;
};
export type ExtractArrayType<T> = T extends Array<infer U> ? U : T;
export type DefaultValues<T> = Partial<Nullable<ExcludeMapperProperties<T>>>;
export type Transformer<T, Result> = (source: T) => Result;
export type DeepPath<Source, K extends keyof Source> = K extends string ? IsObjectWithProperties<Source[K]> extends true ? IsArray<Source[K]> extends true ? K | `${K}.${number}` | `${K}.${number}.${DeepPath<ExtractArrayType<Source[K]>, keyof ExtractArrayType<Source[K]>>}` : K | `${K}.${DeepPath<Source[K], keyof Source[K]>}` : K : never;
export type MappingConfiguration<Source, Target> = {
    [P in keyof Target]: keyof Source | Transformer<Source, Target[P]> | Mapper<any, Target[P]> | DeepPath<Source, keyof Source> | MappingConfiguration<Source, Target[P]>;
};
//# sourceMappingURL=interface.d.ts.map