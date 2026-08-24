/**
 * om-data-mapper validation models — TC39 decorators (om's own API).
 * Mirrors models-validation-cv.ts field-for-field; keep both in sync.
 */
import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsEmail,
  ValidateNested,
} from '@om-data-mapper/class-validator';

export class OmSimpleUser {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsInt()
  @Min(0)
  @Max(150)
  age!: number;
}

export class OmOptionalUser {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  nickname?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  score?: number;
}

// Nested scenario: ValidateNested is on the compat-supported list
// (docs/compat-class-validator.md, "Nested / conditional") and
// packages/class-validator/src/engine/compiler.ts resolves the nested
// validator directly from `obj.constructor`'s own registered metadata —
// it does not require @Type() from class-transformer. Since the bench
// builds instances by hand (never plainToInstance from JSON), @Type()
// is not needed here; see packages/class-validator/tests/unit/compat/
// class-validator/nested-validation.test.ts for the same pattern.
export class OmAddress {
  @IsString()
  @MinLength(3)
  street!: string;

  @IsString()
  @MinLength(2)
  city!: string;
}

export class OmUserWithAddress {
  @IsString()
  @MinLength(2)
  name!: string;

  @ValidateNested()
  address!: OmAddress;
}
