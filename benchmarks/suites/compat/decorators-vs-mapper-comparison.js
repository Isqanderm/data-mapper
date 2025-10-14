/**
 * Comprehensive benchmark comparing decorator-based approach vs Mapper.create() approach
 *
 * This benchmark measures performance differences between:
 * 1. Traditional Mapper.create() API (src/core/Mapper.ts)
 * 2. Decorator-based API (src/decorators/)
 *
 * Run: node benchmarks/suites/compat/decorators-vs-mapper-comparison.js
 */

const { Suite } = require('benchmark');
const { Mapper } = require('../../../build/core/Mapper');
const {
  SimpleDecoratorMapper,
  ComplexDecoratorMapper,
  NestedDecoratorMapper,
  ArrayItemDecoratorMapper,
  ConditionalDecoratorMapper,
} = require('../../../build/benchmarks/decorator-mappers');

console.log('\n' + '='.repeat(80));
console.log('🔬 DECORATOR-BASED API vs MAPPER.CREATE() PERFORMANCE COMPARISON');
console.log('='.repeat(80) + '\n');

// ============================================================================
// Scenario 1: Simple Mapping (5-10 fields)
// ============================================================================

console.log('📊 Scenario 1: Simple Mapping (5-10 fields)');
console.log('-'.repeat(80));

// Traditional approach
const simpleMapperTraditional = Mapper.create({
  userId: 'id',
  fullName: (src) => `${src.firstName} ${src.lastName}`,
  contactEmail: 'email',
  userAge: 'age',
  active: 'isActive',
  created: 'createdAt',
});

// Decorator approach - using compiled class
const simpleMapperDecorator = new SimpleDecoratorMapper();

const simpleData = {
  id: 1,
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  age: 30,
  isActive: true,
  createdAt: '2024-01-01',
};

const suite1 = new Suite();

suite1
  .add('Traditional Mapper.create() - Simple', function () {
    simpleMapperTraditional.execute(simpleData);
  })
  .add('Decorator-based Mapper - Simple', function () {
    simpleMapperDecorator.transform(simpleData);
  })
  .on('cycle', function (event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function () {
    const fastest = this.filter('fastest').map('name');
    const traditional = this[0];
    const decorator = this[1];

    if (traditional && decorator) {
      const diff = ((traditional.hz / decorator.hz - 1) * 100).toFixed(2);
      const percentage = ((decorator.hz / traditional.hz) * 100).toFixed(2);
      console.log(`\n  📈 Decorator performance: ${percentage}% of Traditional`);
      console.log(`  📊 Performance difference: ${Math.abs(diff)}% ${diff > 0 ? 'slower' : 'faster'} (Decorator vs Traditional)`);
    }
    console.log(`  ⚡ Fastest: ${fastest}\n`);
  })
  .run({ async: false });

// ============================================================================
// Scenario 2: Complex Transformations
// ============================================================================

console.log('📊 Scenario 2: Complex Transformations');
console.log('-'.repeat(80));

const complexMapperTraditional = Mapper.create({
  id: 'user.id',
  displayName: (src) => `${src.user.profile.firstName} ${src.user.profile.lastName}`,
  isAdult: (src) => src.user.profile.age >= 18,
  preferences: {
    theme: 'settings.theme',
    notificationsEnabled: 'settings.notifications',
  },
  timestamps: {
    created: (src) => new Date(src.metadata.createdAt),
    updated: (src) => new Date(src.metadata.updatedAt),
  },
});

const complexData = {
  user: {
    id: 1,
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
      age: 25,
    },
  },
  settings: {
    theme: 'dark',
    notifications: true,
  },
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:00:00Z',
  },
};

// Decorator approach
const complexMapperDecorator = new ComplexDecoratorMapper();

const suite2 = new Suite();

suite2
  .add('Traditional Mapper.create() - Complex', function () {
    complexMapperTraditional.execute(complexData);
  })
  .add('Decorator-based Mapper - Complex', function () {
    complexMapperDecorator.transform(complexData);
  })
  .on('cycle', function (event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function () {
    const fastest = this.filter('fastest').map('name');
    const traditional = this[0];
    const decorator = this[1];

    if (traditional && decorator) {
      const percentage = ((decorator.hz / traditional.hz) * 100).toFixed(2);
      console.log(`\n  📈 Decorator performance: ${percentage}% of Traditional`);
    }
    console.log(`  ⚡ Fastest: ${fastest}\n`);
  })
  .run({ async: false });

// ============================================================================
// Scenario 3: Nested Objects
// ============================================================================

console.log('📊 Scenario 3: Nested Objects');
console.log('-'.repeat(80));

const nestedMapperTraditional = Mapper.create({
  companyName: 'company.name',
  location: (src) => `${src.company.address.city}, ${src.company.address.country}`,
  employeeName: 'employee.name',
  role: 'employee.position',
  compensation: 'employee.salary',
});

const nestedData = {
  company: {
    name: 'Tech Corp',
    address: {
      street: '123 Main St',
      city: 'San Francisco',
      country: 'USA',
    },
  },
  employee: {
    name: 'Alice Johnson',
    position: 'Senior Developer',
    salary: 120000,
  },
};

// Decorator approach
const nestedMapperDecorator = new NestedDecoratorMapper();

const suite3 = new Suite();

suite3
  .add('Traditional Mapper.create() - Nested', function () {
    nestedMapperTraditional.execute(nestedData);
  })
  .add('Decorator-based Mapper - Nested', function () {
    nestedMapperDecorator.transform(nestedData);
  })
  .on('cycle', function (event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function () {
    const fastest = this.filter('fastest').map('name');
    const traditional = this[0];
    const decorator = this[1];

    if (traditional && decorator) {
      const percentage = ((decorator.hz / traditional.hz) * 100).toFixed(2);
      console.log(`\n  📈 Decorator performance: ${percentage}% of Traditional`);
    }
    console.log(`  ⚡ Fastest: ${fastest}\n`);
  })
  .run({ async: false });

// ============================================================================
// Scenario 4: Array Mapping (100 elements)
// ============================================================================

console.log('📊 Scenario 4: Array Mapping (100 elements)');
console.log('-'.repeat(80));

const arrayItemMapperTraditional = Mapper.create({
  itemId: 'id',
  itemName: 'name',
  itemValue: 'value',
});

const arrayData = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  value: Math.random() * 1000,
}));

// Decorator approach
const arrayItemMapperDecorator = new ArrayItemDecoratorMapper();

const suite4 = new Suite();

suite4
  .add('Traditional Mapper.create() - Array (100 items)', function () {
    arrayData.forEach(item => arrayItemMapperTraditional.execute(item));
  })
  .add('Decorator-based Mapper - Array (100 items)', function () {
    arrayData.forEach(item => arrayItemMapperDecorator.transform(item));
  })
  .on('cycle', function (event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function () {
    const fastest = this.filter('fastest').map('name');
    const traditional = this[0];
    const decorator = this[1];

    if (traditional && decorator) {
      const percentage = ((decorator.hz / traditional.hz) * 100).toFixed(2);
      console.log(`\n  📈 Decorator performance: ${percentage}% of Traditional`);
    }
    console.log(`  ⚡ Fastest: ${fastest}\n`);
  })
  .run({ async: false });

// ============================================================================
// Scenario 5: Conditional Mapping with Defaults
// ============================================================================

console.log('📊 Scenario 5: Conditional Mapping with Defaults');
console.log('-'.repeat(80));

const conditionalMapperTraditional = Mapper.create(
  {
    isActive: (src) => src.status === 'active',
    userScore: (src) => src.score ?? 0,
    isPremium: (src) => src.premium ?? false,
    lastAccess: (src) => src.lastLogin ?? 'Never',
    statusLabel: (src) => {
      switch (src.status) {
        case 'active': return 'Active User';
        case 'inactive': return 'Inactive User';
        case 'pending': return 'Pending Activation';
        default: return 'Unknown';
      }
    },
  },
  {
    userScore: 0,
    isPremium: false,
    lastAccess: 'Never',
  }
);

const conditionalData = {
  status: 'active',
  score: 85,
  premium: true,
  lastLogin: '2024-01-15',
};

const conditionalDataMinimal = {
  status: 'pending',
};

// Decorator approach
const conditionalMapperDecorator = new ConditionalDecoratorMapper();

const suite5 = new Suite();

suite5
  .add('Traditional Mapper.create() - Conditional (Full data)', function () {
    conditionalMapperTraditional.execute(conditionalData);
  })
  .add('Decorator-based Mapper - Conditional (Full data)', function () {
    conditionalMapperDecorator.transform(conditionalData);
  })
  .add('Traditional Mapper.create() - Conditional (Minimal data)', function () {
    conditionalMapperTraditional.execute(conditionalDataMinimal);
  })
  .add('Decorator-based Mapper - Conditional (Minimal data)', function () {
    conditionalMapperDecorator.transform(conditionalDataMinimal);
  })
  .on('cycle', function (event) {
    console.log('  ' + String(event.target));
  })
  .on('complete', function () {
    const fastest = this.filter('fastest').map('name');
    const traditionalFull = this[0];
    const decoratorFull = this[1];
    const traditionalMinimal = this[2];
    const decoratorMinimal = this[3];

    if (traditionalFull && decoratorFull) {
      const percentageFull = ((decoratorFull.hz / traditionalFull.hz) * 100).toFixed(2);
      console.log(`\n  📈 Decorator performance (Full data): ${percentageFull}% of Traditional`);
    }
    if (traditionalMinimal && decoratorMinimal) {
      const percentageMinimal = ((decoratorMinimal.hz / traditionalMinimal.hz) * 100).toFixed(2);
      console.log(`  📈 Decorator performance (Minimal data): ${percentageMinimal}% of Traditional`);
    }
    console.log(`  ⚡ Fastest: ${fastest}\n`);
  })
  .run({ async: false });

console.log('='.repeat(80));
console.log('✅ BENCHMARK COMPLETE');
console.log('='.repeat(80) + '\n');

console.log('📝 SUMMARY:');
console.log('   ✓ All scenarios tested with both Traditional and Decorator approaches');
console.log('   ✓ Decorator classes compiled from TypeScript with TC39 Stage 3 decorators');
console.log('   ✓ Performance metrics show relative overhead of decorator-based API');
console.log('\n   Success criteria: Decorator performance should be ≥90% of Traditional');
console.log('   (i.e., no more than 10% slower)\n');

