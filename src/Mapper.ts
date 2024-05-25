import { DefaultValues, MappingConfiguration } from "./interface";

export class Mapper<Source, Target> {
  private readonly transformFunction: (
    source: Source,
  ) => Target;
  private readonly defaultValues?: DefaultValues<Target>;

  constructor(
    mappingConfig: MappingConfiguration<Source, Target>,
    defaultValues?: DefaultValues<Target>,
  ) {
    this.execute = this.execute.bind(this);
    this.createCompiler = this.createCompiler.bind(this);

    this.defaultValues = defaultValues;
    this.transformFunction = this.compile(mappingConfig);
  }

  private getValueByPath(configValue: string): string {
    return configValue.split(".").map(part => `['${part}']`).join('');
  }

  private get defValues() {
    return this.defaultValues ? JSON.stringify(this.defaultValues) : "{}";
  }

  private createCompiler([targetKey, configValue]: [
    string,
    Mapper<any, any> | string | Function | unknown,
  ]) {
    if (typeof configValue === "function") {
      const funcBody = configValue.toString();
      return `try {
            target['${targetKey}'] = (${funcBody})(source, defaultValues['${targetKey}'] || {}) || defaultValues['${targetKey}'];
          } catch(error) {
            throw new Error("Mapping error at field '${targetKey}': " + error.message);
          }
        `;
    } else if (configValue instanceof Mapper) {
      const transformFunc = configValue.transformFunction.toString();
      return `try {
            target['${targetKey}'] = ${transformFunc}(source['${targetKey}']);
          } catch(error) {
            throw new Error("Mapping error at field '${targetKey}': " + error.message);
          }
        `;
    } else if (typeof configValue === "string") {
      const path = this.getValueByPath(configValue);
      return `try {
            target['${targetKey}'] = source${path} || defaultValues['${targetKey}'];
          } catch(error) {
            throw new Error("Mapping error at field '${targetKey}' from source field '${configValue}': " + error.message);
          }
        `;
    } else if (typeof configValue === "object" && configValue !== null) {
      const nestedMapping = this.compile(
        configValue as MappingConfiguration<any, any>,
      ).toString();
      return `try {
            target['${targetKey}'] = (${nestedMapping})(source, defaultValues['${targetKey}'] || {});
          } catch(error) {
            throw new Error("Mapping error at nested field '${targetKey}': " + error.message);
          }
        `;
    }
  }

  private compile(
    mappingConfig: MappingConfiguration<Source, Target>,
  ): (source: Source, defaultValues?: DefaultValues<Target>) => Target {
    const body = Object.entries(mappingConfig)
      .map(this.createCompiler)
      .join("\n");

    const func = new Function(
      `source, defaultValues = ${this.defValues}`,
      `const target = {}; ${body} return target;`,
    );

    return func as (
      source: Source
    ) => Target;
  }

  execute(source: Source): Target {
    return this.transformFunction(source);
  }
}
