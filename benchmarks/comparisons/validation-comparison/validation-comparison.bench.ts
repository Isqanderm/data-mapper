/**
 * Comprehensive benchmark comparing om-data-mapper's validation engine
 * with the original class-validator library
 *
 * This benchmark uses class-validator decorators for both libraries to ensure
 * a fair comparison. om-data-mapper's JIT compilation should provide significant
 * performance improvements while maintaining API compatibility.
 */

import { Suite } from 'benchmark';
import 'reflect-metadata';

// Import class-validator
import {
  validateSync as cvValidateSync,
  IsString,
  IsNumber,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsOptional,
  IsDefined,
  IsNotEmpty,
  IsPositive,
} from 'class-validator';

// Import om-data-mapper validation engine
// Note: om-data-mapper can validate class-validator decorated classes
import { validateSync as omValidateSync } from '../../src/compat/class-validator';

// ============================================================================
// Scenario 1: Simple Property Validation (5-10 properties)
// ============================================================================

class SimpleUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsString()
  @MinLength(5)
  email!: string;

  @IsInt()
  @Min(0)
  @Max(150)
  age!: number;

  @IsNumber()
  @IsPositive()
  score!: number;
}

const validSimpleUser = Object.assign(new SimpleUserDto(), {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  age: 30,
  score: 95.5,
});

const invalidSimpleUser = Object.assign(new SimpleUserDto(), {
  firstName: 'J', // Too short
  lastName: 'Doe',
  email: 'john@example.com',
  age: 200, // Too high
  score: -10, // Negative
});

// ============================================================================
// Scenario 2: Optional Fields
// ============================================================================

class OptionalFieldsDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  age?: number;

  @IsDefined()
  @IsString()
  email!: string;
}

const validOptionalData = Object.assign(new OptionalFieldsDto(), {
  name: 'John Doe',
  email: 'john@example.com',
});

const invalidOptionalData = Object.assign(new OptionalFieldsDto(), {
  name: '',
  middleName: 123 as any, // Wrong type
  email: 'john@example.com',
});

// ============================================================================
// Scenario 3: Array Validation (100+ objects)
// ============================================================================

const validUserArray = Array.from({ length: 100 }, (_, i) =>
  Object.assign(new SimpleUserDto(), {
    firstName: `User${i}`,
    lastName: `Last${i}`,
    email: `user${i}@example.com`,
    age: 20 + (i % 50),
    score: 50 + (i % 50),
  })
);

const invalidUserArray = Array.from({ length: 100 }, (_, i) =>
  Object.assign(new SimpleUserDto(), {
    firstName: i % 10 === 0 ? 'X' : `User${i}`, // Every 10th is invalid
    lastName: `Last${i}`,
    email: `user${i}@example.com`,
    age: i % 15 === 0 ? 200 : 20 + (i % 50), // Every 15th is invalid
    score: 50 + (i % 50),
  })
);

// ============================================================================
// Scenario 4: Complex Validation (Multiple Constraints)
// ============================================================================

class ComplexProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description!: string;

  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  price!: number;

  @IsInt()
  @Min(0)
  @Max(10000)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsString()
  @IsNotEmpty()
  sku!: string;
}

const validProduct = Object.assign(new ComplexProductDto(), {
  name: 'Laptop Computer',
  description: 'High-performance laptop with 16GB RAM and 512GB SSD',
  price: 1299.99,
  quantity: 50,
  sku: 'LAP-001',
});

const invalidProduct = Object.assign(new ComplexProductDto(), {
  name: 'PC', // Too short
  description: 'Short', // Too short
  price: -100, // Negative
  quantity: 20000, // Too high
  discount: 150, // Too high
  sku: '', // Empty
});

// ============================================================================
// Scenario 5: Large Objects (50+ properties)
// ============================================================================

class LargeDto {
  @IsString() field0!: string;
  @IsString() field1!: string;
  @IsString() field2!: string;
  @IsString() field3!: string;
  @IsString() field4!: string;
  @IsString() field5!: string;
  @IsString() field6!: string;
  @IsString() field7!: string;
  @IsString() field8!: string;
  @IsString() field9!: string;
  @IsString() field10!: string;
  @IsString() field11!: string;
  @IsString() field12!: string;
  @IsString() field13!: string;
  @IsString() field14!: string;
  @IsString() field15!: string;
  @IsString() field16!: string;
  @IsString() field17!: string;
  @IsString() field18!: string;
  @IsString() field19!: string;
  @IsString() field20!: string;
  @IsString() field21!: string;
  @IsString() field22!: string;
  @IsString() field23!: string;
  @IsString() field24!: string;
  @IsString() field25!: string;
  @IsString() field26!: string;
  @IsString() field27!: string;
  @IsString() field28!: string;
  @IsString() field29!: string;
  @IsString() field30!: string;
  @IsString() field31!: string;
  @IsString() field32!: string;
  @IsString() field33!: string;
  @IsString() field34!: string;
  @IsString() field35!: string;
  @IsString() field36!: string;
  @IsString() field37!: string;
  @IsString() field38!: string;
  @IsString() field39!: string;
  @IsString() field40!: string;
  @IsString() field41!: string;
  @IsString() field42!: string;
  @IsString() field43!: string;
  @IsString() field44!: string;
  @IsString() field45!: string;
  @IsString() field46!: string;
  @IsString() field47!: string;
  @IsString() field48!: string;
  @IsString() field49!: string;
}

const largeValidData: any = {};
const largeInvalidData: any = {};

for (let i = 0; i < 50; i++) {
  largeValidData[`field${i}`] = `value${i}`;
  largeInvalidData[`field${i}`] = i % 5 === 0 ? 123 : `value${i}`; // Every 5th is wrong type
}

const validLargeDto = Object.assign(new LargeDto(), largeValidData);
const invalidLargeDto = Object.assign(new LargeDto(), largeInvalidData);

// ============================================================================
// Run Benchmarks
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('VALIDATION PERFORMANCE COMPARISON');
console.log('om-data-mapper JIT validation vs original class-validator');
console.log('='.repeat(80) + '\n');

const results: any[] = [];

// Scenario 1a: Simple Property Validation - Valid Data
console.log('Running Scenario 1a: Simple Property Validation (Valid Data)...\n');
new Suite('Scenario 1a: Simple Validation - Valid')
  .add('om-data-mapper: validateSync (simple, valid)', function () {
    omValidateSync(validSimpleUser);
  })
  .add('class-validator: validateSync (simple, valid)', function () {
    cvValidateSync(validSimpleUser);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const cvHz = this[1].hz;
    const improvement = ((omHz - cvHz) / cvHz) * 100;
    results.push({
      scenario: 'Simple Validation (Valid)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classValidator: Math.round(cvHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 1b: Simple Property Validation - Invalid Data
console.log('Running Scenario 1b: Simple Property Validation (Invalid Data)...\n');
new Suite('Scenario 1b: Simple Validation - Invalid')
  .add('om-data-mapper: validateSync (simple, invalid)', function () {
    omValidateSync(invalidSimpleUser);
  })
  .add('class-validator: validateSync (simple, invalid)', function () {
    cvValidateSync(invalidSimpleUser);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const cvHz = this[1].hz;
    const improvement = ((omHz - cvHz) / cvHz) * 100;
    results.push({
      scenario: 'Simple Validation (Invalid)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classValidator: Math.round(cvHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 2a: Optional Fields - Valid Data
console.log('Running Scenario 2a: Optional Fields (Valid Data)...\n');
new Suite('Scenario 2a: Optional Fields - Valid')
  .add('om-data-mapper: validateSync (optional, valid)', function () {
    omValidateSync(validOptionalData);
  })
  .add('class-validator: validateSync (optional, valid)', function () {
    cvValidateSync(validOptionalData);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const cvHz = this[1].hz;
    const improvement = ((omHz - cvHz) / cvHz) * 100;
    results.push({
      scenario: 'Optional Fields (Valid)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classValidator: Math.round(cvHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 2b: Optional Fields - Invalid Data
console.log('Running Scenario 2b: Optional Fields (Invalid Data)...\n');
new Suite('Scenario 2b: Optional Fields - Invalid')
  .add('om-data-mapper: validateSync (optional, invalid)', function () {
    omValidateSync(invalidOptionalData);
  })
  .add('class-validator: validateSync (optional, invalid)', function () {
    cvValidateSync(invalidOptionalData);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const cvHz = this[1].hz;
    const improvement = ((omHz - cvHz) / cvHz) * 100;
    results.push({
      scenario: 'Optional Fields (Invalid)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classValidator: Math.round(cvHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 3a: Array Validation - Valid Data
console.log('Running Scenario 3a: Array Validation (100 objects, Valid)...\n');
new Suite('Scenario 3a: Array Validation - Valid')
  .add('om-data-mapper: validateSync (array, valid)', function () {
    validUserArray.forEach((dto) => omValidateSync(dto));
  })
  .add('class-validator: validateSync (array, valid)', function () {
    validUserArray.forEach((dto) => cvValidateSync(dto));
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const cvHz = this[1].hz;
    const improvement = ((omHz - cvHz) / cvHz) * 100;
    results.push({
      scenario: 'Array Validation (100 items, Valid)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classValidator: Math.round(cvHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 3b: Array Validation - Invalid Data
console.log('Running Scenario 3b: Array Validation (100 objects, Invalid)...\n');
new Suite('Scenario 3b: Array Validation - Invalid')
  .add('om-data-mapper: validateSync (array, invalid)', function () {
    invalidUserArray.forEach((dto) => omValidateSync(dto));
  })
  .add('class-validator: validateSync (array, invalid)', function () {
    invalidUserArray.forEach((dto) => cvValidateSync(dto));
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const cvHz = this[1].hz;
    const improvement = ((omHz - cvHz) / cvHz) * 100;
    results.push({
      scenario: 'Array Validation (100 items, Invalid)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classValidator: Math.round(cvHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 4a: Complex Validation - Valid Data
console.log('Running Scenario 4a: Complex Validation (Valid Data)...\n');
new Suite('Scenario 4a: Complex Validation - Valid')
  .add('om-data-mapper: validateSync (complex, valid)', function () {
    omValidateSync(validProduct);
  })
  .add('class-validator: validateSync (complex, valid)', function () {
    cvValidateSync(validProduct);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const cvHz = this[1].hz;
    const improvement = ((omHz - cvHz) / cvHz) * 100;
    results.push({
      scenario: 'Complex Validation (Valid)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classValidator: Math.round(cvHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 4b: Complex Validation - Invalid Data
console.log('Running Scenario 4b: Complex Validation (Invalid Data)...\n');
new Suite('Scenario 4b: Complex Validation - Invalid')
  .add('om-data-mapper: validateSync (complex, invalid)', function () {
    omValidateSync(invalidProduct);
  })
  .add('class-validator: validateSync (complex, invalid)', function () {
    cvValidateSync(invalidProduct);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const cvHz = this[1].hz;
    const improvement = ((omHz - cvHz) / cvHz) * 100;
    results.push({
      scenario: 'Complex Validation (Invalid)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classValidator: Math.round(cvHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 5a: Large Objects - Valid Data
console.log('Running Scenario 5a: Large Objects (50 properties, Valid)...\n');
new Suite('Scenario 5a: Large Objects - Valid')
  .add('om-data-mapper: validateSync (large, valid)', function () {
    omValidateSync(validLargeDto);
  })
  .add('class-validator: validateSync (large, valid)', function () {
    cvValidateSync(validLargeDto);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const cvHz = this[1].hz;
    const improvement = ((omHz - cvHz) / cvHz) * 100;
    results.push({
      scenario: 'Large Objects (50 properties, Valid)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classValidator: Math.round(cvHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);
  })
  .run({ async: false });

// Scenario 5b: Large Objects - Invalid Data
console.log('Running Scenario 5b: Large Objects (50 properties, Invalid)...\n');
new Suite('Scenario 5b: Large Objects - Invalid')
  .add('om-data-mapper: validateSync (large, invalid)', function () {
    omValidateSync(invalidLargeDto);
  })
  .add('class-validator: validateSync (large, invalid)', function () {
    cvValidateSync(invalidLargeDto);
  })
  .on('cycle', function (event: any) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function (this: any) {
    const omHz = this[0].hz;
    const cvHz = this[1].hz;
    const improvement = ((omHz - cvHz) / cvHz) * 100;
    results.push({
      scenario: 'Large Objects (50 properties, Invalid)',
      omDataMapper: Math.round(omHz).toLocaleString() + ' ops/sec',
      classValidator: Math.round(cvHz).toLocaleString() + ' ops/sec',
      improvement: improvement.toFixed(2) + '%',
    });
    console.log(`  → om-data-mapper is ${improvement > 0 ? improvement.toFixed(2) + '% faster' : Math.abs(improvement).toFixed(2) + '% slower'}\n`);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80) + '\n');
    console.table(results);

    // Calculate average improvement
    const improvements = results.map((r) => parseFloat(r.improvement));
    const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
    console.log(`\nAverage Performance: ${avgImprovement > 0 ? avgImprovement.toFixed(2) + '% faster' : Math.abs(avgImprovement).toFixed(2) + '% slower'}`);

    // Find best and worst scenarios
    const maxImprovement = Math.max(...improvements);
    const minImprovement = Math.min(...improvements);
    const bestScenario = results.find((r) => parseFloat(r.improvement) === maxImprovement);
    const worstScenario = results.find((r) => parseFloat(r.improvement) === minImprovement);

    console.log(`\nBest Performance: ${bestScenario?.scenario} (${maxImprovement.toFixed(2)}% ${maxImprovement > 0 ? 'faster' : 'slower'})`);
    console.log(`Worst Performance: ${worstScenario?.scenario} (${minImprovement.toFixed(2)}% ${minImprovement > 0 ? 'faster' : 'slower'})`);

    console.log('\n' + '='.repeat(80));
    console.log('NOTES:');
    console.log('- om-data-mapper uses JIT compilation for ultra-fast validation');
    console.log('- First validation compiles the validator, subsequent calls use cached version');
    console.log('- Performance gains are most significant with repeated validations');
    console.log('- Both libraries use class-validator decorators for compatibility');
    console.log('='.repeat(80) + '\n');
  })
  .run({ async: false });
