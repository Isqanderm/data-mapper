/**
 * getMetadataStorage compat API
 *
 * Minimal facade over the Symbol-based validation metadata storage,
 * exposing just enough surface (`getTargetValidationMetadatas`) to match
 * the class-validator migration pattern of inspecting registered
 * constraints for a target class.
 */

import { getValidationMetadata } from './engine/metadata';

export interface ValidationMetadataEntry {
  target: Function;
  propertyName: string;
  type: string;
  constraints: any[];
  message?: unknown;
  groups?: string[];
  always?: boolean;
}

/**
 * Minimal compat facade over the Symbol-based metadata storage.
 * Only getTargetValidationMetadatas is provided.
 */
class CompatMetadataStorage {
  getTargetValidationMetadatas(target: Function): ValidationMetadataEntry[] {
    const metadata = getValidationMetadata(target);
    const entries: ValidationMetadataEntry[] = [];
    for (const [propertyKey, propMeta] of metadata.properties.entries()) {
      for (const constraint of propMeta.constraints) {
        entries.push({
          target,
          propertyName: String(propertyKey),
          type: constraint.type,
          constraints: Array.isArray(constraint.value?.constraints)
            ? constraint.value.constraints
            : constraint.value !== undefined
              ? [constraint.value]
              : [],
          message: constraint.message,
          groups: constraint.groups,
          always: constraint.always,
        });
      }
    }
    return entries;
  }
}

const storage = new CompatMetadataStorage();

export function getMetadataStorage(): CompatMetadataStorage {
  return storage;
}
