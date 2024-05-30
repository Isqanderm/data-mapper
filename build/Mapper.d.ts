import { MappingConfiguration, MappingResult } from "./interface";
export declare class Mapper<Source, Target> {
    private readonly mappingConfig;
    private readonly defaultValues?;
    private transformFunction;
    private readonly cache;
    constructor(mappingConfig: MappingConfiguration<Source, Target>, defaultValues?: Partial<import("./interface").Nullable<import("./interface").ExcludeMapperProperties<Target>>> | undefined);
    private static renderTemplateForKeySelect;
    private createCompiler;
    private getCompiledFnBody;
    private getCompiledFn;
    compile(): void;
    execute(source: Source): MappingResult<Target>;
}
//# sourceMappingURL=Mapper.d.ts.map