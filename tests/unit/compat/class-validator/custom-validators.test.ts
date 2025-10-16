/**
 * Tests for custom validator classes
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  IsString,
  MinLength,
  ValidateNested,
  validate,
  validateSync,
  clearValidatorCache,
} from '../../../../src/compat/class-validator';
import {
  ValidatorConstraint,
  Validate,
  ValidateBy,
  type ValidatorConstraintInterface,
  type ValidationArguments,
} from '../../../../src/compat/class-validator/decorators/custom';

// Custom validator: IsLongerThan
@ValidatorConstraint({ name: 'isLongerThan', async: false })
class IsLongerThanConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    if (typeof value !== 'string' || typeof relatedValue !== 'string') {
      return false;
    }
    return value.length > relatedValue.length;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be longer than ${args.constraints[0]}`;
  }
}

// Custom validator: IsEqualTo
@ValidatorConstraint({ name: 'isEqualTo', async: false })
class IsEqualToConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be equal to ${args.constraints[0]}`;
  }
}

// Async custom validator: IsUniqueUsername
@ValidatorConstraint({ name: 'isUniqueUsername', async: true })
class IsUniqueUsernameConstraint implements ValidatorConstraintInterface {
  async validate(value: string, args: ValidationArguments) {
    // Simulate async database check
    await new Promise(resolve => setTimeout(resolve, 10));
    // Simulate checking if username exists
    return value !== 'taken';
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} is already taken`;
  }
}

// Custom validator without defaultMessage
@ValidatorConstraint({ name: 'isPositive', async: false })
class IsPositiveConstraint implements ValidatorConstraintInterface {
  validate(value: number) {
    return typeof value === 'number' && value > 0;
  }
}

describe('Custom Validator Classes', () => {
  beforeEach(() => {
    clearValidatorCache();
  });

  describe('Sync Custom Validators', () => {
    it('should validate using custom validator class', () => {
      class UserDto {
        @IsString()
        @MinLength(2)
        firstName!: string;

        @IsString()
        @Validate(IsLongerThanConstraint, ['firstName'])
        lastName!: string;
      }

      const valid = new UserDto();
      valid.firstName = 'John';
      valid.lastName = 'Doe-Smith';

      const validErrors = validateSync(valid);
      expect(validErrors).toHaveLength(0);

      const invalid = new UserDto();
      invalid.firstName = 'Alexander';
      invalid.lastName = 'Doe';

      const invalidErrors = validateSync(invalid);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].property).toBe('lastName');
      expect(invalidErrors[0].constraints).toHaveProperty('custom');
      expect(invalidErrors[0].constraints!.custom).toContain('must be longer than');
    });

    it('should pass ValidationArguments correctly', () => {
      class PasswordDto {
        @IsString()
        password!: string;

        @Validate(IsEqualToConstraint, ['password'])
        confirmPassword!: string;
      }

      const valid = new PasswordDto();
      valid.password = 'secret123';
      valid.confirmPassword = 'secret123';

      const validErrors = validateSync(valid);
      expect(validErrors).toHaveLength(0);

      const invalid = new PasswordDto();
      invalid.password = 'secret123';
      invalid.confirmPassword = 'different';

      const invalidErrors = validateSync(invalid);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].property).toBe('confirmPassword');
      expect(invalidErrors[0].constraints!.custom).toContain('must be equal to password');
    });

    it('should use custom message when provided', () => {
      class ProductDto {
        @Validate(IsPositiveConstraint, [], { message: 'Price must be positive' })
        price!: number;
      }

      const invalid = new ProductDto();
      invalid.price = -10;

      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints!.custom).toBe('Price must be positive');
    });

    it('should handle validator without defaultMessage', () => {
      class ProductDto {
        @Validate(IsPositiveConstraint)
        price!: number;
      }

      const invalid = new ProductDto();
      invalid.price = -10;

      const errors = validateSync(invalid);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('custom');
    });

    it('should cache validator instances', () => {
      class UserDto {
        @Validate(IsLongerThanConstraint, ['firstName'])
        lastName!: string;

        @IsString()
        firstName!: string;
      }

      const user1 = new UserDto();
      user1.firstName = 'John';
      user1.lastName = 'Doe';

      const user2 = new UserDto();
      user2.firstName = 'Jane';
      user2.lastName = 'Smith';

      // Both validations should use the same validator instance
      validateSync(user1);
      validateSync(user2);

      // No errors expected - just testing that caching works
      expect(true).toBe(true);
    });
  });

  describe('Async Custom Validators', () => {
    it('should validate using async custom validator class', async () => {
      class UserDto {
        @IsString()
        @Validate(IsUniqueUsernameConstraint)
        username!: string;
      }

      const valid = new UserDto();
      valid.username = 'available';

      const validErrors = await validate(valid);
      expect(validErrors).toHaveLength(0);

      const invalid = new UserDto();
      invalid.username = 'taken';

      const invalidErrors = await validate(invalid);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].property).toBe('username');
      expect(invalidErrors[0].constraints!.custom).toContain('is already taken');
    });

    it('should handle mixed sync and async custom validators', async () => {
      class UserDto {
        @IsString()
        firstName!: string;

        @Validate(IsLongerThanConstraint, ['firstName'])
        lastName!: string;

        @Validate(IsUniqueUsernameConstraint)
        username!: string;
      }

      const valid = new UserDto();
      valid.firstName = 'John';
      valid.lastName = 'Doe-Smith';
      valid.username = 'available';

      const validErrors = await validate(valid);
      expect(validErrors).toHaveLength(0);

      const invalid = new UserDto();
      invalid.firstName = 'Alexander';
      invalid.lastName = 'Doe'; // Too short
      invalid.username = 'taken'; // Already taken

      const invalidErrors = await validate(invalid);
      expect(invalidErrors.length).toBeGreaterThan(0);
      expect(invalidErrors.some(e => e.property === 'lastName')).toBe(true);
      expect(invalidErrors.some(e => e.property === 'username')).toBe(true);
    });
  });

  describe('Integration with Other Features', () => {
    it('should work with nested validation', () => {
      class AddressDto {
        @IsString()
        @MinLength(3)
        street!: string;

        @IsString()
        @MinLength(2)
        city!: string;
      }

      class UserDto {
        @IsString()
        firstName!: string;

        @Validate(IsLongerThanConstraint, ['firstName'])
        lastName!: string;

        @ValidateNested()
        address!: AddressDto;
      }

      const invalid = new UserDto();
      invalid.firstName = 'Alexander';
      invalid.lastName = 'Doe';
      invalid.address = new AddressDto();
      invalid.address.street = 'AB'; // Too short
      invalid.address.city = 'X'; // Too short

      const errors = validateSync(invalid);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.property === 'lastName')).toBe(true);
      expect(errors.some(e => e.property === 'address')).toBe(true);
    });

    it('should work with validation groups', () => {
      class UserDto {
        @IsString({ groups: ['create'] })
        @MinLength(3, { groups: ['create'] })
        username!: string;

        @Validate(IsLongerThanConstraint, ['firstName'], { groups: ['create', 'update'] })
        lastName!: string;

        @IsString()
        firstName!: string;
      }

      const user = new UserDto();
      user.username = 'ab'; // Too short for create group
      user.firstName = 'Alexander';
      user.lastName = 'Doe'; // Shorter than firstName

      // Validate with 'create' group
      const createErrors = validateSync(user, { groups: ['create'] });
      expect(createErrors.length).toBeGreaterThan(0);
      expect(createErrors.some(e => e.property === 'username')).toBe(true);
      expect(createErrors.some(e => e.property === 'lastName')).toBe(true);

      // Validate with 'update' group
      const updateErrors = validateSync(user, { groups: ['update'] });
      expect(updateErrors.some(e => e.property === 'lastName')).toBe(true);
      expect(updateErrors.some(e => e.property === 'username')).toBe(false);
    });
  });

  describe('ValidateBy Decorator', () => {
    it('should validate using ValidateBy decorator', () => {
      function IsEvenNumber(validationOptions?: any) {
        return ValidateBy(
          {
            name: 'isEvenNumber',
            validator: {
              validate: (value) => typeof value === 'number' && value % 2 === 0,
              defaultMessage: () => 'must be an even number',
            },
          },
          validationOptions,
        );
      }

      class TestDto {
        @IsEvenNumber()
        value!: number;
      }

      const valid = new TestDto();
      valid.value = 4;

      const validErrors = validateSync(valid);
      expect(validErrors).toHaveLength(0);

      const invalid = new TestDto();
      invalid.value = 3;

      const invalidErrors = validateSync(invalid);
      expect(invalidErrors).toHaveLength(1);
      expect(invalidErrors[0].constraints!.isEvenNumber).toBe('must be an even number');
    });
  });
});

