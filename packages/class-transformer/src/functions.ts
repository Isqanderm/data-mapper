/**
 * Transformation functions compatible with class-transformer
 * Using TC39 Stage 3 decorators for metadata storage
 */

import {
  getCompatMetadata,
  shouldExposeProperty,
  getSourcePropertyName,
  type PropertyMetadata,
} from './metadata';
import type { ClassTransformOptions, TransformationType } from './types';

/**
 * Converts a plain object to a class instance.
 * Compatible with class-transformer plainToClass function.
 *
 * @param cls - Class constructor
 * @param plain - Plain object or array of plain objects
 * @param options - Transformation options
 * @returns Class instance or array of class instances
 */
export function plainToClass<T, V extends Array<any>>(
  cls: new (...args: any[]) => T,
  plain: V,
  options?: ClassTransformOptions,
): T[];
export function plainToClass<T, V>(
  cls: new (...args: any[]) => T,
  plain: V,
  options?: ClassTransformOptions,
): T;
export function plainToClass<T, V>(
  cls: new (...args: any[]) => T,
  plain: V | V[],
  options: ClassTransformOptions = {},
): T | T[] {
  if (Array.isArray(plain)) {
    return plain.map((item) => transformPlainToClass(cls, item, 'plainToClass', options));
  }
  return transformPlainToClass(cls, plain, 'plainToClass', options);
}

/**
 * Alias for plainToClass
 */
export const plainToInstance = plainToClass;

/**
 * Converts a plain object to an existing class instance.
 * Compatible with class-transformer plainToClassFromExist function.
 *
 * @param clsObject - Existing class instance
 * @param plain - Plain object
 * @param options - Transformation options
 * @returns Updated class instance
 */
export function plainToClassFromExist<T, V>(
  clsObject: T,
  plain: V,
  options: ClassTransformOptions = {},
): T {
  const cls = (clsObject as any).constructor;
  const metadata = getCompatMetadata(cls);

  // Build source-to-target property map
  const sourceToTargetMap = new Map<string, string | symbol>();
  for (const [propertyKey, propertyMeta] of metadata.properties.entries()) {
    const sourceName = getSourcePropertyName(propertyMeta, propertyKey);
    sourceToTargetMap.set(sourceName, propertyKey);
  }

  // Transform properties
  for (const [sourceKey, value] of Object.entries(plain as any)) {
    const targetKey = sourceToTargetMap.get(sourceKey) || sourceKey;
    const propertyMeta = metadata.properties.get(targetKey);

    if (!shouldExposeProperty(propertyMeta, targetKey, 'plainToClass', options)) {
      continue;
    }

    const transformedValue = transformValue(
      value,
      propertyMeta,
      sourceKey,
      plain,
      'plainToClass',
      options,
    );

    (clsObject as any)[targetKey] = transformedValue;
  }

  return clsObject;
}

/**
 * Converts a class instance to a plain object.
 * Compatible with class-transformer classToPlain function.
 *
 * @param object - Class instance or array of class instances
 * @param options - Transformation options
 * @returns Plain object or array of plain objects
 */
export function classToPlain<T>(object: T, options?: ClassTransformOptions): Record<string, any>;
export function classToPlain<T>(
  object: T[],
  options?: ClassTransformOptions,
): Record<string, any>[];
export function classToPlain<T>(
  object: T | T[],
  options: ClassTransformOptions = {},
): Record<string, any> | Record<string, any>[] {
  if (Array.isArray(object)) {
    return object.map((item) => transformClassToPlain(item, 'classToPlain', options));
  }
  return transformClassToPlain(object, 'classToPlain', options);
}

/**
 * Alias for classToPlain
 */
export const instanceToPlain = classToPlain;

/**
 * Creates a deep clone of a class instance.
 * Compatible with class-transformer classToClass function.
 *
 * @param object - Class instance or array of class instances
 * @param options - Transformation options
 * @returns Cloned class instance or array of cloned instances
 */
export function classToClass<T>(object: T, options?: ClassTransformOptions): T;
export function classToClass<T>(object: T[], options?: ClassTransformOptions): T[];
export function classToClass<T>(object: T | T[], options: ClassTransformOptions = {}): T | T[] {
  return cloneInstance(object, options) as T | T[];
}

/**
 * Recursively clone a value, keeping each object's class.
 *
 * This used to be a classToPlain -> plainToClass round trip carrying the
 * 'classToClass' type through both legs. Neither leg recursed — each descends
 * only for its own direction — so nested values were copied by reference,
 * while `@Transform` ran on both legs and was applied twice.
 *
 * The class of a nested value is taken from the value itself rather than from
 * `@Type`, matching upstream: it clones a nested instance back into its own
 * class whether or not the property carries a `@Type`.
 */
function cloneInstance(value: any, options: ClassTransformOptions): any {
  if (Array.isArray(value)) {
    return value.map((item) => cloneInstance(item, options));
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  // Values that carry their own contents rather than decorated properties.
  // Walking them as plain objects would empty them.
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (value instanceof Map) {
    return new Map(value);
  }
  if (value instanceof Set) {
    return new Set(value);
  }

  const cls = value.constructor;
  const metadata = getCompatMetadata(cls);
  // Constructed, not Object.create'd: an excluded property is not copied, and
  // upstream leaves it holding whatever the field initializer gives it rather
  // than leaving it absent. This is also how transformPlainToClass builds its
  // target, so both directions treat a class the same way.
  const result = cls === Object ? {} : new cls();

  const allKeys = new Set<string | symbol>([...Object.keys(value), ...metadata.properties.keys()]);

  for (const propertyKey of allKeys) {
    const propertyMeta = metadata.properties.get(propertyKey);

    if (!shouldExposeProperty(propertyMeta, propertyKey, 'classToClass', options)) {
      continue;
    }

    let propertyValue = value[propertyKey];

    // Applied here and nowhere else, so it runs once per property.
    if (propertyMeta?.transformFn) {
      const transformOpts = propertyMeta.transformOptions || {};
      if (!transformOpts.toPlainOnly && !transformOpts.toClassOnly) {
        propertyValue = propertyMeta.transformFn({
          value: propertyValue,
          key: String(propertyKey),
          obj: value,
          type: 'classToClass',
          options,
        });
      }
    }

    // The property keeps its own name: unlike class->plain, this direction
    // does not rename through `@Expose({ name })`.
    result[propertyKey] = cloneInstance(propertyValue, options);
  }

  return result;
}

/**
 * Alias for classToClass
 */
export const instanceToInstance = classToClass;

/**
 * Serializes a class instance to a JSON string.
 * Compatible with class-transformer serialize function.
 *
 * @param object - Class instance or array of class instances
 * @param options - Transformation options
 * @returns JSON string
 */
export function serialize<T>(object: T | T[], options: ClassTransformOptions = {}): string {
  const plain = classToPlain(object as any, options);
  return JSON.stringify(plain);
}

/**
 * Deserializes a JSON string to a class instance.
 * Compatible with class-transformer deserialize function.
 *
 * @param cls - Class constructor
 * @param json - JSON string
 * @param options - Transformation options
 * @returns Class instance
 */
export function deserialize<T>(
  cls: new (...args: any[]) => T,
  json: string,
  options: ClassTransformOptions = {},
): T {
  const plain = JSON.parse(json);
  return transformPlainToClass(cls, plain, 'plainToClass', options);
}

/**
 * Deserializes a JSON array to class instances.
 * Compatible with class-transformer deserializeArray function.
 *
 * @param cls - Class constructor
 * @param json - JSON string
 * @param options - Transformation options
 * @returns Array of class instances
 */
export function deserializeArray<T>(
  cls: new (...args: any[]) => T,
  json: string,
  options: ClassTransformOptions = {},
): T[] {
  const plain = JSON.parse(json);
  if (!Array.isArray(plain)) {
    throw new Error('JSON does not represent an array');
  }
  return plainToClass(cls, plain, options);
}

// ============================================================================
// Internal transformation helpers
// ============================================================================

/**
 * Transform a plain object to a class instance
 */
function transformPlainToClass<T>(
  cls: new (...args: any[]) => T,
  plain: any,
  transformationType: TransformationType,
  options: ClassTransformOptions,
): T {
  const instance = new cls();
  const metadata = getCompatMetadata(cls);

  // Build source-to-target property map
  const sourceToTargetMap = new Map<string, string | symbol>();
  for (const [propertyKey, propertyMeta] of metadata.properties.entries()) {
    const sourceName = getSourcePropertyName(propertyMeta, propertyKey);
    sourceToTargetMap.set(sourceName, propertyKey);
  }

  // Transform properties from plain object
  for (const [sourceKey, value] of Object.entries(plain)) {
    const targetKey = sourceToTargetMap.get(sourceKey) || sourceKey;
    const propertyMeta = metadata.properties.get(targetKey);

    if (!shouldExposeProperty(propertyMeta, targetKey, transformationType, options)) {
      continue;
    }

    const transformedValue = transformValue(
      value,
      propertyMeta,
      sourceKey,
      plain,
      transformationType,
      options,
    );

    (instance as any)[targetKey] = transformedValue;
  }

  return instance;
}

/**
 * Transform a class instance to a plain object
 */
function transformClassToPlain<T>(
  object: T,
  transformationType: TransformationType,
  options: ClassTransformOptions,
): Record<string, any> {
  const cls = (object as any).constructor;
  const metadata = getCompatMetadata(cls);
  const result: Record<string, any> = {};

  // Get all property keys from the instance
  const allKeys = new Set<string | symbol>([
    ...Object.keys(object as any),
    ...metadata.properties.keys(),
  ]);

  for (const propertyKey of allKeys) {
    const propertyMeta = metadata.properties.get(propertyKey);

    if (!shouldExposeProperty(propertyMeta, propertyKey, transformationType, options)) {
      continue;
    }

    const value = (object as any)[propertyKey];
    const outputKey = propertyMeta?.name || String(propertyKey);

    const transformedValue = transformValue(
      value,
      propertyMeta,
      String(propertyKey),
      object,
      transformationType,
      options,
    );

    result[outputKey] = transformedValue;
  }

  return result;
}

/**
 * Transform a single value based on metadata
 */
function transformValue(
  value: any,
  propertyMeta: PropertyMetadata | undefined,
  key: string,
  obj: any,
  transformationType: TransformationType,
  options: ClassTransformOptions,
): any {
  // Apply custom transform function if exists
  if (propertyMeta?.transformFn) {
    const transformOpts = propertyMeta.transformOptions || {};

    // Check if transform should be applied for this transformation type
    if (transformationType === 'plainToClass' && transformOpts.toPlainOnly) {
      // Skip transform
    } else if (transformationType === 'classToPlain' && transformOpts.toClassOnly) {
      // Skip transform
    } else {
      value = propertyMeta.transformFn({
        value,
        key,
        obj,
        type: transformationType,
        options,
      });
    }
  }

  // Apply type transformation if exists
  if (propertyMeta?.typeFunction && transformationType === 'plainToClass') {
    const TypeClass = propertyMeta.typeFunction();

    const isPrimitiveTarget =
      TypeClass === Number || TypeClass === String || TypeClass === Boolean || TypeClass === Date;
    const coercePrimitive = (input: any): any => {
      if (TypeClass === Number) return typeof input === 'number' ? input : Number(input);
      if (TypeClass === String) return typeof input === 'string' ? input : String(input);
      if (TypeClass === Boolean) return typeof input === 'boolean' ? input : Boolean(input);
      return input instanceof Date ? input : new Date(input as any);
    };

    if (Array.isArray(value)) {
      return value.map((item) => {
        if (
          options.enableImplicitConversion &&
          isPrimitiveTarget &&
          item !== null &&
          item !== undefined
        ) {
          return coercePrimitive(item);
        }
        if (typeof item === 'object' && item !== null) {
          return transformPlainToClass(TypeClass as any, item, transformationType, options);
        }
        return item;
      });
    }

    if (
      options.enableImplicitConversion &&
      isPrimitiveTarget &&
      value !== null &&
      value !== undefined
    ) {
      return coercePrimitive(value);
    }

    if (typeof value === 'object' && value !== null) {
      return transformPlainToClass(TypeClass as any, value, transformationType, options);
    }
  }

  // A nested instance carries its own metadata, so its @Exclude/@Expose only
  // run if we transform it too — otherwise an excluded field is copied straight
  // into the output. Not gated on `typeFunction`: in the class->plain direction
  // the class is known from the value itself, and upstream recurses whether or
  // not the property carries a @Type.
  if (transformationType === 'classToPlain') {
    return transformNestedToPlain(value, transformationType, options);
  }

  return value;
}

/**
 * Recursively transform a value on its way out to a plain object.
 */
function transformNestedToPlain(
  value: any,
  transformationType: TransformationType,
  options: ClassTransformOptions,
): any {
  if (Array.isArray(value)) {
    return value.map((item) => transformNestedToPlain(item, transformationType, options));
  }

  // A Date is a value, not a structure to expand — upstream passes it through.
  if (value === null || typeof value !== 'object' || value instanceof Date) {
    return value;
  }

  return transformClassToPlain(value, transformationType, options);
}
