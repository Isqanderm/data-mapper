// @ts-nocheck - Import path is relative to compiled output, module resolution disabled for benchmarks
/**
 * Validation models using om-data-mapper/class-validator-compat
 * These models will be compiled and used in benchmarks
 */

import {
  IsString,
  IsNumber,
  IsEmail,
  IsBoolean,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsOptional,
  IsNotEmpty,
  IsInt,
} from '../../../../build/compat/class-validator';

/**
 * Simple DTO with string validators
 */
export class SimpleUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

/**
 * DTO with number validators
 */
export class ProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  price!: number;

  @IsInt()
  @Min(0)
  quantity!: number;

  @IsBoolean()
  inStock!: boolean;
}

/**
 * DTO with mixed validators and optional fields
 */
export class MixedDto {
  @IsString()
  @MinLength(3)
  firstName!: string;

  @IsString()
  @MinLength(3)
  lastName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsNumber()
  @Min(0)
  @Max(150)
  age!: number;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

/**
 * Complex DTO with many properties (10+ fields)
 */
export class ComplexUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  middleName?: string;

  @IsNumber()
  @Min(18)
  @Max(120)
  age!: number;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsBoolean()
  isActive!: boolean;

  @IsBoolean()
  emailVerified!: boolean;

  @IsOptional()
  @IsString()
  bio?: string;
}

