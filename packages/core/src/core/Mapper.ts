import { DefaultValues, MapperConfig, MappingConfiguration, MappingResult } from './interfaces';
import { getValueByPath, PathObject } from './utils';

/**
 * BaseMapper - Internal/Legacy API
 *
 * @deprecated For new projects, use the Decorator API (@Mapper, @Map, @Transform, etc.)
 * which compiles mappings to specialized functions instead of interpreting configuration
 * per call, and offers a better developer experience.
 *
 * This class is retained only as an in-repo implementation detail: the decorator API
 * references it in type position (`decorators/core.ts` imports it as `BaseMapper`) and
 * builds its own compiled object, and the core package's unit tests exercise it through
 * direct `src` imports. It is not part of the published surface.
 *
 * ⚠️ **SECURITY NOTICE**: This mapper uses dynamic code generation (`new Function()`)
 * for performance optimization. Mapping configurations MUST come from trusted sources only.
 * Never pass user-controlled data as mapping configuration to prevent code injection attacks.
 *
 * ⚠️ **NOT EXPORTED — DO NOT RE-EXPORT WITHOUT FIXING THE CODEGEN FIRST**: this class
 * interpolates config-derived keys and paths verbatim into the generated source — both
 * into member expressions and into `'...'` string literals. A kebab-case key compiles to
 * a SyntaxError; a quote-bearing key escapes the literal and injects code. The decorator
 * API's generator was fixed to emit JSON-escaped bracket access; this one was not,
 * because it is unreachable from the published surface (`packages/core/src/index.ts`
 * does not re-export it, and the package declares no deep-import subpath). Fix the
 * escaping before this class is ever exported again.
 *
 * See docs/transformer-usage.md for the recommended approach.
 * See docs/migration-v4-to-v5.md for migration instructions.
 *
 * @internal
 */
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

  private constructor(
    private readonly mappingConfig: MappingConfiguration<Source, Target>,
    private readonly defaultValues?: DefaultValues<Target>,
    private readonly config?: MapperConfig,
  ) {
    this.execute = this.execute.bind(this);
    this.createCompiler = this.createCompiler.bind(this);
  }

  /**
   * Creates a new Mapper instance with the specified configuration.
   *
   * ⚠️ **SECURITY WARNING**: The `mappingConfig` parameter MUST come from a trusted source.
   * This mapper uses dynamic code generation for performance. Passing user-controlled data
   * as mapping configuration can lead to arbitrary code execution vulnerabilities.
   *
   * **Safe usage examples**:
   * ```typescript
   * // ✅ Safe: Configuration defined by developer
   * const mapper = Mapper.create({
   *   name: 'user.fullName',
   *   email: 'user.email'
   * });
   *
   * // ✅ Safe: Configuration from trusted internal source
   * const mapper = Mapper.create(TRUSTED_MAPPING_CONFIGS.userMapper);
   * ```
   *
   * **Unsafe usage examples**:
   * ```typescript
   * // ❌ UNSAFE: User input as mapping config
   * const userConfig = JSON.parse(request.body);
   * const mapper = Mapper.create(userConfig); // DANGEROUS!
   *
   * // ❌ UNSAFE: External untrusted source
   * const externalConfig = await fetch('untrusted-api.com/config');
   * const mapper = Mapper.create(externalConfig); // DANGEROUS!
   * ```
   *
   * @param mappingConfig - Mapping configuration (MUST be from trusted source)
   * @param defaultValues - Optional default values for target properties
   * @param config - Optional mapper configuration
   * @returns A new Mapper instance
   *
   * @public
   */
  public static create<Source, Target>(
    mappingConfig: MappingConfiguration<Source, Target>,
    defaultValues?: DefaultValues<Target>,
    config?: MapperConfig,
  ) {
    return new Mapper<Source, Target>(mappingConfig, defaultValues, config);
  }

  private static renderTemplateForKeySelect({
    pathConfig,
    parentTarget,
    relativeToMapper,
    targetPath,
    targetKey,
    configValue,
    nested = false,
    config,
  }: {
    pathConfig: PathObject[];
    parentTarget?: string;
    relativeToMapper: boolean;
    targetPath: string;
    targetKey: string;
    configValue: string;
    nested: boolean;
    config?: MapperConfig;
  }): string {
    const [keyPath, ...restPaths] = pathConfig;
    const path = [parentTarget, keyPath.path].filter(Boolean).join('?.');
    const sourcePath = relativeToMapper ? path : keyPath.path;

    if (restPaths.length > 0 && nested) {
      const nestedAction = Mapper.renderTemplateForKeySelect({
        pathConfig: restPaths,
        parentTarget: 'item',
        relativeToMapper: false,
        targetPath: 'item',
        targetKey: '',
        configValue,
        nested: true,
        config,
      });

      const body = `
        return item?.${sourcePath}?.map((item) => { ${nestedAction} });
      `;

      if (config?.useUnsafe) {
        return body;
      }

      return `try {
        ${body}
      } catch(error) {
        __errors.push("Mapping error at field '${targetPath}' from source field '${configValue}': " + error.message);
      }`;
    }

    if (restPaths.length > 0) {
      const nestedAction = Mapper.renderTemplateForKeySelect({
        pathConfig: restPaths,
        parentTarget: 'item',
        relativeToMapper: false,
        targetPath: 'item',
        targetKey: '',
        configValue,
        nested: true,
        config,
      });

      const body = `
        target.${targetPath} = source?.${sourcePath}?.map((item) => {
          ${nestedAction}
        }) || cache['${parentTarget}__defValues']?.${targetKey};
      `;

      if (config?.useUnsafe) {
        return body;
      }

      return `try {
        ${body}
      } catch(error) {
        __errors.push("Mapping error at field '${targetPath}' from source field '${configValue}': " + error.message);
      }`;
    }

    if (nested) {
      const body = `
        return item${sourcePath ? `.${sourcePath}` : ''};
      `;

      if (config?.useUnsafe) {
        return body;
      }

      return `try {
        ${body}
      } catch(error) {
        __errors.push("Mapping error at field '${targetPath}' from source field '${configValue}': " + error.message);
      }`;
    }

    const body = `
      target.${targetPath} = source${sourcePath ? `?.${sourcePath}` : ''} || cache['${parentTarget}__defValues']?.${targetKey};
    `;

    if (config?.useUnsafe) {
      return body;
    }

    return `try {
      ${body}
    } catch(error) {
      __errors.push("Mapping error at field '${targetPath}' from source field '${configValue}': " + error.message);
    }`;
  }

  private createCompiler(
    [targetKey, configValue]: [string, Mapper<any, any> | string | Function | unknown],
    cache: { [key: string]: any },
    parentTarget: string = '',
    relativeToMapper: boolean = false,
    config?: MapperConfig,
  ) {
    const targetPath = [parentTarget, targetKey].filter(Boolean).join('.');

    if (typeof configValue === 'function') {
      cache[`${targetPath}__handler`] = configValue;
      let body;
      if (relativeToMapper) {
        body = `
          target.${targetPath} = source${parentTarget ? `?.${parentTarget}` : ''} ? (cache['${targetPath}__handler'])(source${parentTarget ? `?.${parentTarget}` : ''}) : cache['${parentTarget}__defValues']?.${targetKey}
        `;
      } else {
        body = `
          target.${targetPath} = source ? (cache['${targetPath}__handler'])(source) : cache['${parentTarget}__defValues']?.${targetKey}
        `;
      }

      if (config?.useUnsafe) {
        return body;
      }

      return `
        try {
          ${body}
        } catch(error) {
          __errors.push("Mapping error at field by function '${targetPath}': " + error.message);
        }
      `;
    } else if (configValue instanceof Mapper) {
      const transformFunc = configValue.getCompiledFnBody(
        configValue.mappingConfig,
        targetPath,
        true,
        config,
      );
      cache[`${targetPath}__defValues`] =
        (this.defaultValues as any)?.[targetKey] || configValue.defaultValues;
      Object.assign(cache, configValue.cache);

      const body = `
        target.${targetPath} = {};
        ${transformFunc}
      `;

      if (config?.useUnsafe) {
        return body;
      }

      return `
        try {
          ${body}
        } catch(error) {
          __errors.push("Mapping error at Mapper '${targetPath}': " + error.message);
        }
      `;
    } else if (typeof configValue === 'string') {
      const pathConfig = getValueByPath(configValue);

      return Mapper.renderTemplateForKeySelect({
        pathConfig,
        parentTarget,
        relativeToMapper,
        targetPath,
        targetKey,
        configValue,
        nested: false,
        config,
      });
    } else if (typeof configValue === 'object' && configValue !== null) {
      const nestedMapping = this.getCompiledFnBody(
        configValue as any,
        targetPath,
        undefined,
        config,
      );
      cache[`${targetPath}__defValues`] = (this.defaultValues as any)?.[targetKey];
      Object.assign(cache, this.cache);

      const body = `
        target.${targetPath} = {};
        ${nestedMapping}
      `;

      if (config?.useUnsafe) {
        return body;
      }

      return `
        try {
          ${body}
        } catch(error) {
          __errors.push("Mapping error at nested field '${targetPath}': " + error.message);
        }
      `;
    }
  }

  private getCompiledFnBody(
    mappingConfig: MappingConfiguration<Source, Target>,
    parentTarget?: string,
    relativeToMapper?: boolean,
    config?: MapperConfig,
  ): string {
    return Object.entries(mappingConfig)
      .map((item) => this.createCompiler(item, this.cache, parentTarget, relativeToMapper, config))
      .join('\n');
  }

  /**
   * Compiles mapping configuration into an optimized function using dynamic code generation.
   *
   * ⚠️ **SECURITY WARNING**: This method uses `new Function()` for performance optimization.
   * The mapping configuration MUST come from trusted sources only (developer-defined code).
   * DO NOT pass user-controlled data as mapping configuration, as this could lead to
   * arbitrary code execution. Target keys and source paths are interpolated unescaped
   * into the generated source (see the class-level notice) — this is a code-injection and
   * SyntaxError hazard that must be fixed before this class is exported again.
   *
   * **Safe usage**: Mapping configuration is defined by developers at compile-time
   * ```typescript
   * const mapper = Mapper.create({
   *   name: 'user.fullName',  // ✅ Safe: developer-defined
   *   age: 'user.age'
   * });
   * ```
   *
   * **Unsafe usage**: DO NOT DO THIS
   * ```typescript
   * const userConfig = JSON.parse(request.body); // ❌ UNSAFE: user input
   * const mapper = Mapper.create(userConfig);
   * ```
   *
   * @param mappingConfig - Mapping configuration (MUST be from trusted source)
   * @param parentTarget - Optional parent target path for nested mappings
   * @returns Compiled mapping function optimized for performance
   *
   * @internal
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
   * @see https://owasp.org/www-community/attacks/Code_Injection
   */
  private getCompiledFn(
    mappingConfig: MappingConfiguration<Source, Target>,
    parentTarget?: string,
  ): (
    source: Source,
    target: {},
    __errors: string[],
    cache: { [key: string]: any },
  ) => MappingResult<Target> {
    const body = this.getCompiledFnBody(mappingConfig, parentTarget, undefined, this.config);
    // Using new Function for performance optimization - mapping config MUST be from trusted source
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

    this.cache['__defValues'] = this.defaultValues;

    const errors: string[] = [];
    const target = {};
    this.transformFunction!(source, target, errors, this.cache);
    return { errors, result: target as Target };
  }
}
