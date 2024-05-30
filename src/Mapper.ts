import {
  DefaultValues,
  MappingConfiguration,
  MappingResult,
} from "./interface";
import { getValueByPath, PathObject } from "./utils";

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

  private static renderTemplateForKeySelect({
    pathConfig,
    parentTarget,
    relativeToMapper,
    targetPath,
    targetKey,
    configValue,
    nested = false,
  }: {
    pathConfig: PathObject[];
    parentTarget?: string;
    relativeToMapper: boolean;
    targetPath: string;
    targetKey: string;
    configValue: string;
    nested: boolean;
  }): string {
    const [keyPath, ...restPaths] = pathConfig;
    const path = [parentTarget, keyPath.path].filter(Boolean).join("?.");
    const sourcePath = relativeToMapper ? path : keyPath.path;

    if (restPaths.length > 0 && nested) {
      const nestedAction = Mapper.renderTemplateForKeySelect({
        pathConfig: restPaths,
        parentTarget: "item",
        relativeToMapper: false,
        targetPath: "item",
        targetKey: "",
        configValue,
        nested: true,
      });

      return `try {
        return item.${sourcePath}.map((item) => { ${nestedAction} });
      } catch(error) {
        __errors.push("Mapping error at field '${targetPath}' from source field '${configValue}': " + error.message);
      }`;
    }

    if (restPaths.length > 0) {
      const nestedAction = Mapper.renderTemplateForKeySelect({
        pathConfig: restPaths,
        parentTarget: "item",
        relativeToMapper: false,
        targetPath: "item",
        targetKey: "",
        configValue,
        nested: true,
      });

      return `try {
        target.${targetPath} = source.${sourcePath}.map((item) => {
          ${nestedAction}
        }) || cache['${parentTarget}__defValues']?.${targetKey};
      } catch(error) {
        __errors.push("Mapping error at field '${targetPath}' from source field '${configValue}': " + error.message);
      }`;
    }

    if (nested) {
      return `try {
        return item.${sourcePath};
      } catch(error) {
        __errors.push("Mapping error at field '${targetPath}' from source field '${configValue}': " + error.message);
      }`;
    }

    return `try {
      target.${targetPath} = source.${sourcePath} || cache['${parentTarget}__defValues']?.${targetKey};
    } catch(error) {
      __errors.push("Mapping error at field '${targetPath}' from source field '${configValue}': " + error.message);
    }`;
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
      const pathConfig = getValueByPath(configValue);

      return Mapper.renderTemplateForKeySelect({
        pathConfig,
        parentTarget,
        relativeToMapper,
        targetPath,
        targetKey,
        configValue,
        nested: false,
      });
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
