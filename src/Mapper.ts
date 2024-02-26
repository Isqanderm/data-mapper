import { DefaultValues, MappingConfiguration } from "./interface";

export class Mapper<TSource, TTarget> {
  private readonly transformFunction: (source: TSource) => TTarget;
  private readonly defaultValues?: DefaultValues<TTarget>;

  constructor(
    mappingConfig: MappingConfiguration<TSource, TTarget>,
    defaultValues?: DefaultValues<TTarget>,
  ) {
    this.defaultValues = defaultValues;
    this.transformFunction = this.compile(mappingConfig);

    this.execute = this.execute.bind(this);
  }

  private getValueByPath(configValue: string): string {
    return configValue.split(".").reduce((accum, part) => {
      accum += `['${part}']`;

      return accum;
    }, "");
  }

  private compile(
    mappingConfig: MappingConfiguration<TSource, TTarget>,
  ): (source: TSource) => TTarget {
    const body = Object.entries(mappingConfig)
      .map(([targetKey, configValue]) => {
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
        }
      })
      .join("\n");

    const func = new Function(
      "source",
      `const target = ${this.defaultValues ? JSON.stringify(this.defaultValues) : "{}"}; ${body} return target;`,
    );

    return func as (source: TSource) => TTarget;
  }

  execute(source: TSource): TTarget {
    return this.transformFunction(source);
  }
}
