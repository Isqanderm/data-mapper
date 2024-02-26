import { MappingConfiguration } from "./interface";
export declare class Mapper<TSource, TTarget> {
    private readonly transformFunction;
    constructor(mappingConfig: MappingConfiguration<TSource, TTarget>);
    private getValueByPath;
    private compile;
    execute(source: TSource): TTarget;
}
//# sourceMappingURL=Mapper.d.ts.map