/**
 * registerDecorator compat API
 *
 * Lets consumers build custom TC39-decorator-based validators using the
 * same shape as class-validator's `registerDecorator`, without requiring
 * a `@ValidatorConstraint`-decorated class.
 */

import { addValidationConstraint, getValidationMetadata } from './engine/metadata';
import type {
  ValidationDecoratorOptions,
  ValidationArguments,
  ValidationConstraint,
} from './types';
import type { ValidatorConstraintInterface } from './decorators/custom';

export interface RegisterDecoratorOptions {
  /**
   * Constraint name used as the key in ValidationError.constraints.
   * For a `@ValidatorConstraint`-decorated class the class's own registered
   * name takes precedence, matching upstream class-validator.
   */
  name?: string;
  /** Class constructor the property belongs to */
  target: Function;
  propertyName: string;
  /** Extra constraint arguments, exposed as ValidationArguments.constraints */
  constraints?: any[];
  options?: ValidationDecoratorOptions;
  /** Inline validator object or ValidatorConstraint class */
  validator: ValidatorConstraintInterface | (new () => ValidatorConstraintInterface);
  async?: boolean;
}

function lowerFirst(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function sameArray(a: any[] | undefined, b: any[] | undefined): boolean {
  const left = a || [];
  const right = b || [];
  return left.length === right.length && left.every((item, i) => item === right[i]);
}

export function registerDecorator(args: RegisterDecoratorOptions): void {
  const { validator } = args;
  const constraints = args.constraints || [];

  // addInitializer runs on every instance construction; guard against
  // re-registering the same logical constraint on repeated instantiation —
  // without silently swallowing genuinely different registrations.
  const existingConstraints = getValidationMetadata(args.target).properties.get(
    args.propertyName,
  )?.constraints;
  if (existingConstraints) {
    // Options take part in the identity: two registrations differing only by
    // groups/message/always are different constraints in the generated code.
    const sameOptions = (existing: ValidationConstraint): boolean =>
      existing.message === args.options?.message &&
      existing.always === args.options?.always &&
      sameArray(existing.groups, args.options?.groups);

    const isDuplicate = existingConstraints.some((existing) => {
      if (!sameOptions(existing)) return false;
      if (typeof validator === 'function') {
        return (
          existing.type === 'custom' &&
          existing.value?.constraintClass === validator &&
          sameArray(existing.value?.constraints, constraints)
        );
      }
      return (
        existing.type === 'validateBy' &&
        existing.value?.name === (args.name || 'customValidation') &&
        sameArray(existing.value?.constraints, constraints) &&
        // Reference identity first: a validator object hoisted out of
        // addInitializer is the same object on every construction, so this
        // settles the common case without stringifying anything. When the
        // reference differs we fall back to comparing the source of
        // `validate`, which is what makes the "object literal rebuilt inside
        // addInitializer" pattern dedupe across constructions instead of
        // growing the metadata without bound.
        //
        // Note the ref check can only ever agree with the source check (equal
        // references imply equal source), so it is a fast path and a statement
        // of intent, not a behaviour change. The source-text comparison stays
        // the discriminator, and its known false positive — two applications
        // of one parameterized inline factory — is documented in
        // docs/compat-class-validator.md and pinned by a test.
        (existing.value?.validatorRef === validator ||
          existing.value?.validatorSource === validator.validate.toString())
      );
    });
    if (isDuplicate) return;
  }

  if (typeof validator === 'function') {
    // ValidatorConstraint class → compiled via the 'custom' constraint path
    addValidationConstraint(args.target, args.propertyName, {
      type: 'custom',
      value: {
        constraintClass: validator,
        // Upstream precedence: the class's own ConstraintMetadata name
        // (@ValidatorConstraint({name}), defaulting to the class name) wins;
        // an explicit `name` only applies to a class without that metadata.
        // The lower-cased class name is a compat-only extension — upstream
        // would not run an unregistered constraint class at all.
        name:
          (validator as any).__validatorMetadata?.name || args.name || lowerFirst(validator.name),
        constraints,
      },
      message: args.options?.message,
      groups: args.options?.groups,
      always: args.options?.always,
      each: args.options?.each,
    });
  } else {
    // Inline validator object → compiled via the 'validateBy' path
    addValidationConstraint(args.target, args.propertyName, {
      type: 'validateBy',
      value: {
        name: args.name || 'customValidation',
        validator: (value: any, validationArgs?: ValidationArguments) =>
          validator.validate(value, validationArgs),
        defaultMessage: validator.defaultMessage?.bind(validator),
        // Dedup metadata only — never read by the compiler.
        validatorRef: validator,
        validatorSource: validator.validate.toString(),
        constraints,
      },
      message: args.options?.message,
      groups: args.options?.groups,
      always: args.options?.always,
      each: args.options?.each,
    });
  }
}
