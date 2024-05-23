import { DefaultValues, MappingConfiguration } from "./interface";

export class Mapper<Source, Target> {
  private readonly transformFunction: (source: Source) => Target;
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
    return configValue.split(".").reduce((accum, part) => {
      accum += `['${part}']`;

      return accum;
    }, "");
  }

  private createCompiler([targetKey, configValue]: [
    string,
    Mapper<any, any> | string | Function | unknown,
  ]) {
    if (typeof configValue === "function") {
      return `try {
            const result = (${configValue.toString()})(source);
            result === undefined ? void 0 : target['${targetKey}'] = result;
          } catch(error) {
            throw new Error("Mapping error at field '${targetKey}': " + error.message);
          }
        `;
    } else if (configValue instanceof Mapper) {
      return `try {
            target['${targetKey}'] = ${configValue.transformFunction.toString()}(source['${targetKey}']);
          } catch(error) {
            throw new Error("Mapping error at field '${targetKey}': " + error.message);
          }
        `;
    } else if (typeof configValue === "string") {
      return `try {
            const result = source${this.getValueByPath(configValue)};
            result === undefined ? void 0 : target['${targetKey}'] = result;
          } catch(error) {
            throw new Error("Mapping error at field '${targetKey}' from source field '${configValue}': " + error.message);
          }
        `;
    } else if (typeof configValue === "object" && configValue !== null) {
      const nestedMapping = this.compile(configValue as MappingConfiguration<any, any>);
      return `try {
            target['${targetKey}'] = (${nestedMapping.toString()})(source);
          } catch(error) {
            throw new Error("Mapping error at nested field '${targetKey}': " + error.message);
          }
        `;
    }
  }

  private compile(
    mappingConfig: MappingConfiguration<Source, Target>,
  ): (source: Source) => Target {
    const body = Object.entries(mappingConfig)
      .map(this.createCompiler)
      .join("\n");

    const func = new Function(
      "source",
      `const target = ${this.defaultValues ? JSON.stringify(this.defaultValues) : "{}"}; ${body} return target;`,
    );

    return func as (source: Source) => Target;
  }

  execute(source: Source): Target {
    return this.transformFunction(source);
  }
}
