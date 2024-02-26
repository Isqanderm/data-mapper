import { MappingConfiguration } from "./interface";

export class Mapper<TSource, TTarget> {
  private readonly transformFunction: (source: TSource) => TTarget;

  constructor(mappingConfig: MappingConfiguration<TSource, TTarget>) {
    this.transformFunction = this.compile(mappingConfig);
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
            target['${targetKey}'] = (${configValue.toString()})(source);
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
            target['${targetKey}'] = source${this.getValueByPath(configValue)};
          } catch(error) {
            throw new Error("Mapping error at field '${targetKey}' from source field '${configValue}': " + error.message);
          }
        `;
        }
      })
      .join("\n");

    const func = new Function(
      "source",
      `const target = {}; ${body} return target;`,
    );
    return func as (source: TSource) => TTarget;
  }

  execute(source: TSource): TTarget {
    return this.transformFunction(source);
  }
}
