import {
  DefaultValues,
  MappingConfiguration,
  MappingResult,
} from "./interface";

export class Mapper<Source, Target> {
  private transformFunction:
    | ((
        source: Source,
        target: {},
        __errors: string[],
        cache: { [key: string]: any },
      ) => MappingResult<Target>)
    | undefined;
  private readonly cache: { [key: string]: any } = {};

  constructor(
    private readonly mappingConfig: MappingConfiguration<Source, Target>,
    private readonly defaultValues?: DefaultValues<Target>,
  ) {
    this.execute = this.execute.bind(this);
    this.createCompiler = this.createCompiler.bind(this);
  }

  private getValueByPath(configValue: string): string {
    return configValue
      .split(".")
      .map((part) => `${part}`)
      .join("?.");
  }

  private createCompiler(
    [targetKey, configValue]: [
      string,
      Mapper<any, any> | string | Function | unknown,
    ],
    cache: { [key: string]: any },
    parentTarget: string = "", // "foo.bar"
    relativeToMapper: boolean = false,
  ) {
    const targetPath = [parentTarget, targetKey].filter(Boolean).join(".");
    if (typeof configValue === "function") {
      cache[`${targetPath}__handler`] = configValue;
      return `try {
            target.${targetPath} = (cache['${targetPath}__handler'])(source${parentTarget ? `.${parentTarget}` : ""});
          } catch(error) {
            __errors.push("Mapping error at field by function '${targetPath}': " + error.message);
          }`;
    } else if (configValue instanceof Mapper) {
      const transformFunc = configValue.getCompiledFnBody(
        configValue.mappingConfig,
        targetPath,
        true,
      );
      cache[`${targetPath}__defValues`] = configValue.defaultValues;
      Object.assign(cache, configValue.cache);
      return `try {
            target.${targetPath} = {};
            ${transformFunc}
          } catch(error) {
            __errors.push("Mapping error at Mapper '${targetPath}': " + error.message);
          }`;
    } else if (typeof configValue === "string") {
      const configPath = this.getValueByPath(configValue);
      const path = [parentTarget, configPath].filter(Boolean).join("?.");

      return `try {
            target.${targetPath} = source.${relativeToMapper ? path : configPath} || cache['${parentTarget}__defValues']?.${targetKey};
          } catch(error) {
            __errors.push("Mapping error at field '${targetPath}' from source field '${configValue}': " + error.message);
          }`;
    } else if (typeof configValue === "object" && configValue !== null) {
      const nestedMapping = this.getCompiledFnBody(
        configValue as MappingConfiguration<any, any>,
        targetPath,
      );
      cache[`${targetPath}__defValues`] = this.defaultValues
        ? // @ts-ignore
          this.defaultValues[targetKey]
        : undefined;
      Object.assign(cache, this.cache);
      return `try {
            target.${targetPath} = {};
            ${nestedMapping}
          } catch(error) {
            __errors.push("Mapping error at nested field '${targetPath}': " + error.message);
          }`;
    }
  }

  private getCompiledFnBody(
    mappingConfig: MappingConfiguration<Source, Target>,
    parentTarget?: string,
    relativeToMapper?: boolean,
  ): string {
    return Object.entries(mappingConfig)
      .map((item) =>
        this.createCompiler(item, this.cache, parentTarget, relativeToMapper),
      )
      .join("\n");
  }

  private getCompiledFn(
    mappingConfig: MappingConfiguration<Source, Target>,
    parentTarget?: string,
  ): (
    source: Source,
    target: {},
    __errors: string[],
    cache: { [key: string]: any },
  ) => MappingResult<Target> {
    const body = this.getCompiledFnBody(mappingConfig, parentTarget);

    const func = new Function(`source, target, __errors, cache`, `${body}`);

    return func as (
      source: Source,
      target: {},
      __errors: string[],
      cache: { [key: string]: any },
    ) => MappingResult<Target>;
  }

  compile() {
    this.transformFunction = this.getCompiledFn(this.mappingConfig);
  }

  execute(source: Source): MappingResult<Target> {
    if (!this.transformFunction) {
      this.compile();
    }

    this.cache["__defValues"] = this.defaultValues;

    const errors: string[] = [];
    const target = {};
    this.transformFunction!(source, target, errors, this.cache);
    return { errors, result: target as Target };
  }
}
