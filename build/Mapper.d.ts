import { DefaultValues, MappingConfiguration } from "./interface";
export declare class Mapper<TSource, TTarget> {
    private readonly transformFunction;
    private readonly defaultValues?;
    constructor(mappingConfig: MappingConfiguration<TSource, TTarget>, defaultValues?: DefaultValues<TTarget>);
    private getValueByPath;
    private compile;
    execute(source: TSource): TTarget;
}
//# sourceMappingURL=Mapper.d.ts.map