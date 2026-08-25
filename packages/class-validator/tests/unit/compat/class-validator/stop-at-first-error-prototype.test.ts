import { describe, it, expect } from 'vitest';
import { validate, ValidateBy } from '../../../../src';

// Helper to declare a ValidateBy constraint under an arbitrary name.
function ValidateByNamed(name: string, pass: boolean) {
  return ValidateBy({
    name,
    validator: { validate: () => pass, defaultMessage: () => `${name} failed` },
  });
}

describe('stopAtFirstError with prototype-colliding validator names', () => {
  it('keeps the real errors instead of dropping them entirely (async path)', async () => {
    // 'toString' passes sanitizeValidatorName's IDENTIFIER_REGEX but is an
    // inherited key on every plain object — the exact prototype collision.
    //
    // Decorators apply closest-to-declaration first, so the 'toString'
    // constraint (bottom-most here) becomes metadata.constraints[0] and its
    // ValidateBy check fires as an async task ahead of 'foo' and 'bar'.
    // Because 'toString' passes, it never becomes an own key of
    // propertyErrors — but `k in propertyErrors` is true for it regardless
    // (inherited from Object.prototype), so the old `order.find(k => k in
    // propertyErrors)` lookup matches 'toString' first and the trim then
    // deletes every real failure ('foo', 'bar'), dropping the property's
    // error entirely.
    class Dto {
      @ValidateByNamed('bar', false)
      @ValidateByNamed('foo', false)
      @ValidateByNamed('toString', true)
      s!: string;
    }
    const instance = Object.assign(new Dto(), { s: 'x' });
    const errors = await validate(instance, { stopAtFirstError: true });
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toHaveLength(1);
  });
});
