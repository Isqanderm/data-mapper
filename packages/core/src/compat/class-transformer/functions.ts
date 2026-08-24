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
export function classToPlain<T>(object: T[], options?: ClassTransformOptions): Record<string, any>[];
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
  if (Array.isArray(object)) {
    return object.map((item) => {
      const plain = transformClassToPlain(item, 'classToClass', options);
      return transformPlainToClass((item as any).constructor, plain, 'classToClass', options);
    });
  }

  const plain = transformClassToPlain(object, 'classToClass', options);
  return transformPlainToClass((object as any).constructor, plain, 'classToClass', options);
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

    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return transformPlainToClass(TypeClass as any, item, transformationType, options);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      return transformPlainToClass(TypeClass as any, value, transformationType, options);
    }
  }

  return value;
}

