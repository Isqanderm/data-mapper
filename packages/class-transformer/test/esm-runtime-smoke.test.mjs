#!/usr/bin/env node
/**
 * ESM Runtime Smoke Test — @om-data-mapper/class-transformer
 *
 * Catches exactly the bug class that shipped broken once: a `require()`
 * call inside TransformClassToPlain / TransformClassToClass /
 * TransformPlainToClass that only threw when a decorated method was
 * actually CALLED under Node's ESM loader
 * ("ReferenceError: require is not defined in ES module scope"). Nothing
 * ran the built ESM output in a real ESM process, so it shipped unnoticed
 * (fixed in the commit that added the static imports these decorators now
 * use — see packages/class-transformer/src/decorators.ts).
 *
 * TC39 decorators are plain functions of shape `(value, context) =>
 * replacement`; a `@Decorator` class/method can't be written in a plain
 * .mjs file (decorator syntax needs a transpiler). So this file imports
 * the decorators from the BUILT ESM output and applies them manually, the
 * way a decorator transform would, then actually CALLS the decorated
 * methods — the exact code path the require() bug only broke at call
 * time, not at decoration time. A reintroduced require() fails this run
 * instead of passing silently.
 *
 * Imports by package name (self-reference through the package.json
 * `exports` map), the same resolution a real ESM consumer gets — not a
 * raw path into build/.
 */
import { strict as assert } from 'assert';

console.log('🧪 class-transformer ESM Runtime Smoke Test\n');

const { plainToInstance, TransformClassToPlain, TransformClassToClass, TransformPlainToClass } =
  await import('@om-data-mapper/class-transformer');

// Minimal TC39 method-decorator context. None of the three decorators under
// test read `name` or call `addInitializer`, but both are provided to match
// the real ClassMethodDecoratorContext shape.
function methodContext(name) {
  return { kind: 'method', name, addInitializer: () => {} };
}

class User {}

// ---------------------------------------------------------------------------
// 1. Core function: plainToInstance
// ---------------------------------------------------------------------------
console.log('1. plainToInstance...');
const instance = plainToInstance(User, { name: 'Alice', age: 30 });
assert.ok(instance instanceof User, 'plainToInstance should return a User instance');
assert.strictEqual(instance.name, 'Alice');
assert.strictEqual(instance.age, 30);
console.log('   ✓ plainToInstance produced a real User instance');

// ---------------------------------------------------------------------------
// 2. @TransformClassToPlain — method's return value goes through classToPlain
// ---------------------------------------------------------------------------
console.log('\n2. @TransformClassToPlain...');
class Report {
  build() {
    return Object.assign(new User(), { name: 'Bob', age: 40 });
  }
}
Report.prototype.build = TransformClassToPlain()(Report.prototype.build, methodContext('build'));
const plain = new Report().build();
assert.strictEqual(plain.name, 'Bob');
assert.strictEqual(plain.age, 40);
assert.ok(
  !(plain instanceof User),
  'TransformClassToPlain output should be a plain object, not a User instance',
);
console.log(
  '   ✓ decorated method call reached classToPlain via a static import (no require() error)',
);

// ---------------------------------------------------------------------------
// 3. @TransformClassToClass — deep clone through the class pipeline
// ---------------------------------------------------------------------------
console.log('\n3. @TransformClassToClass...');
class Cloner {
  build() {
    return Object.assign(new User(), { name: 'Cara', age: 22 });
  }
}
Cloner.prototype.build = TransformClassToClass()(Cloner.prototype.build, methodContext('build'));
const cloned = new Cloner().build();
assert.ok(cloned instanceof User, 'TransformClassToClass output should still be a User instance');
assert.strictEqual(cloned.name, 'Cara');
assert.strictEqual(cloned.age, 22);
console.log(
  '   ✓ decorated method call reached classToClass via a static import (no require() error)',
);

// ---------------------------------------------------------------------------
// 4. @TransformPlainToClass — method's return value goes through plainToClass
// ---------------------------------------------------------------------------
console.log('\n4. @TransformPlainToClass...');
class Loader {
  build() {
    return { name: 'Dee', age: 55 };
  }
}
Loader.prototype.build = TransformPlainToClass(User)(
  Loader.prototype.build,
  methodContext('build'),
);
const loaded = new Loader().build();
assert.ok(loaded instanceof User, 'TransformPlainToClass output should be a User instance');
assert.strictEqual(loaded.name, 'Dee');
assert.strictEqual(loaded.age, 55);
console.log(
  '   ✓ decorated method call reached plainToClass via a static import (no require() error)',
);

console.log(
  '\n✅ All ESM smoke tests passed — built ESM output, real decorator invocation, no require().\n',
);
