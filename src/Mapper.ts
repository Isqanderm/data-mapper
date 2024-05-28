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
        fnMap: { [key: string]: any },
        defaultValues?: DefaultValues<Target>,
      ) => MappingResult<Target>)
    | undefined;
  private readonly fnMap: { [key: string]: any } = {};

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
      .map((part) => `['${part}']`)
      .join("");
  }

  private get defValues() {
    return this.defaultValues ? JSON.stringify(this.defaultValues) : "{}";
  }

  private createCompiler(
    [targetKey, configValue]: [
      string,
      Mapper<any, any> | string | Function | unknown,
    ],
    fnMap: { [key: string]: any },
    parentTarget?: string, // "['foo']['bar']"
  ) {
    const targetPath = `${parentTarget || ''}['${targetKey}']`;
    if (typeof configValue === "function") {
      fnMap[targetKey] = configValue;
      return `try {
            var value = (fnMap['${targetKey}'])(source);
            target${targetPath} = value !== undefined ? value : defaultValues['${targetKey}'];
          } catch(error) {
            __errors.push("Mapping error at field '${targetPath}': " + error.message);
          }
        `;
    } else if (configValue instanceof Mapper) {
      const transformFunc = configValue.getCompiledFn(configValue.mappingConfig, targetPath);
      fnMap[targetKey] = configValue.fnMap || {};
      return `try {
            target${targetPath} = {};
            (${transformFunc})(source['${targetKey}'], target, __errors, fnMap['${targetKey}']);
          } catch(error) {
            __errors.push("Mapping error at Mapper '${targetPath}': " + error.message);
          }
        `;
    } else if (typeof configValue === "string") {
      const path = this.getValueByPath(configValue);
      return `try {
            var value = source${path};
            target${targetPath} = value !== undefined ? value : defaultValues['${targetKey}'];
          } catch(error) {
            __errors.push("Mapping error at field '${targetPath}' from source field '${configValue}': " + error.message);
          }
        `;
    } else if (typeof configValue === "object" && configValue !== null) {
      const nestedMapping = this.getCompiledFn(
        configValue as MappingConfiguration<any, any>,
        targetPath,
      );
      return `try {
            target${targetPath} = {};
            (${nestedMapping})(source, target, __errors, fnMap['${targetKey}'] = fnMap['${targetKey}'] || {}, defaultValues['${targetKey}'] || {});
          } catch(error) {
            __errors.push("Mapping error at nested field '${targetPath}': " + error.message);
          }
        `;
    }
  }

  private getCompiledFn(
    mappingConfig: MappingConfiguration<Source, Target>,
    parentTarget?: string,
  ): (
    source: Source,
    target: {},
    __errors: string[],
    fnMap: { [key: string]: any },
    defaultValues?: DefaultValues<Target>,
  ) => MappingResult<Target> {
    const body = Object.entries(mappingConfig)
      .map((item) => this.createCompiler(item, this.fnMap, parentTarget))
      .join("\n");

    const func = new Function(
      `source, target, __errors, fnMap, defaultValues`,
      `var __errors = __errors || []; var defaultValues = defaultValues || ${this.defValues}; ${body}`,
    );

    return func as (
      source: Source,
      target: {},
      __errors: string[],
      fnMap: { [key: string]: any },
      defaultValues?: DefaultValues<Target>,
    ) => MappingResult<Target>;
  }

  compile() {
    this.transformFunction = this.getCompiledFn(this.mappingConfig);
  }

  execute(source: Source): MappingResult<Target> {
    if (!this.transformFunction) {
      this.compile();
    }

    const errors: string[] = [];
    const target = {};
    this.transformFunction!(source, target, errors, this.fnMap);
    return { errors, result: target as Target };
  }
}
