import { MappingConfiguration } from "./interface";

export class Mapper<TSource, TTarget> {
  private transformFunction: (source: TSource) => TTarget;

  constructor(mappingConfig: MappingConfiguration<TSource, TTarget>) {
    this.transformFunction = this.compile(mappingConfig);
  }

  private compile(mappingConfig: MappingConfiguration<TSource, TTarget>): (source: TSource) => TTarget {
    const body = Object.entries(mappingConfig).map(([targetKey, configValue]) => {
      if (typeof configValue === 'function') {
        return `target['${targetKey}'] = (${configValue.toString()})(source);`;
      } else if (configValue instanceof Mapper) {
        return `target['${targetKey}'] = ${configValue.transformFunction.toString()}(source['${targetKey}']);`;
      } else {
        return `target['${targetKey}'] = source['${configValue}'];`;
      }
    }).join("\n");

    // console.log('body: ', body);

    const func = new Function('source', `const target = {}; ${body} return target;`);
    return func as (source: TSource) => TTarget;
  }

  map(source: TSource): TTarget {
    return this.transformFunction(source);
  }
}
