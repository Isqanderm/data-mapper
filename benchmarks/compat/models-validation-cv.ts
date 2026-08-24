/**
 * Upstream class-validator models — legacy decorators applied
 * PROGRAMMATICALLY (no experimentalDecorators needed in this repo).
 * Mirrors models-validation-om.ts field-for-field; keep both in sync.
 */
import 'reflect-metadata';
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
} from 'class-validator';

export class CvSimpleUser {
  firstName!: string;
  lastName!: string;
  email!: string;
  age!: number;
}
for (const name of ['firstName', 'lastName'] as const) {
  IsString()(CvSimpleUser.prototype, name);
  MinLength(2)(CvSimpleUser.prototype, name);
  MaxLength(50)(CvSimpleUser.prototype, name);
}
IsEmail()(CvSimpleUser.prototype, 'email');
IsInt()(CvSimpleUser.prototype, 'age');
Min(0)(CvSimpleUser.prototype, 'age');
Max(150)(CvSimpleUser.prototype, 'age');

export class CvOptionalUser {
  name!: string;
  nickname?: string;
  score?: number;
}
IsString()(CvOptionalUser.prototype, 'name');
MinLength(2)(CvOptionalUser.prototype, 'name');
IsOptional()(CvOptionalUser.prototype, 'nickname');
IsString()(CvOptionalUser.prototype, 'nickname');
MinLength(5)(CvOptionalUser.prototype, 'nickname');
IsOptional()(CvOptionalUser.prototype, 'score');
IsInt()(CvOptionalUser.prototype, 'score');
Min(0)(CvOptionalUser.prototype, 'score');

// Nested scenario — mirrors OmAddress / OmUserWithAddress in
// models-validation-om.ts. Instances are built by hand (never
// plainToInstance from JSON), so @Type() from class-transformer is not
// needed for the recursion to run.
export class CvAddress {
  street!: string;
  city!: string;
}
IsString()(CvAddress.prototype, 'street');
MinLength(3)(CvAddress.prototype, 'street');
IsString()(CvAddress.prototype, 'city');
MinLength(2)(CvAddress.prototype, 'city');

export class CvUserWithAddress {
  name!: string;
  address!: CvAddress;
}
IsString()(CvUserWithAddress.prototype, 'name');
MinLength(2)(CvUserWithAddress.prototype, 'name');
ValidateNested()(CvUserWithAddress.prototype, 'address');
