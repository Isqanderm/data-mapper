import { describe, it, expect } from 'vitest';
import { Matches, Validate, ValidateBy, validateSync } from '../../../../src';
import { getValidationMetadata } from '../../../../src/engine/metadata';

class AlwaysFailsConstraint {
  validate() {
    return false;
  }
}

function IsFailing() {
  return ValidateBy({
    name: 'isFailing',
    validator: { validate: () => false, defaultMessage: () => 'nope' },
  });
}

describe('constraint metadata does not grow per instantiation', () => {
  it('@Matches registers exactly one constraint after 50 constructions', () => {
    class Dto {
      @Matches(/^a+$/)
      s!: string;
    }
    for (let i = 0; i < 50; i++) new Dto();
    expect(getValidationMetadata(Dto).properties.get('s')!.constraints).toHaveLength(1);
  });

  it('@Validate registers exactly one constraint after 50 constructions', () => {
    class Dto {
      @Validate(AlwaysFailsConstraint)
      s!: string;
    }
    for (let i = 0; i < 50; i++) new Dto();
    expect(getValidationMetadata(Dto).properties.get('s')!.constraints).toHaveLength(1);
  });

  it('@ValidateBy registers exactly one constraint after 50 constructions', () => {
    class Dto {
      @IsFailing()
      s!: string;
    }
    for (let i = 0; i < 50; i++) new Dto();
    expect(getValidationMetadata(Dto).properties.get('s')!.constraints).toHaveLength(1);
  });

  it('errors carry a single constraint key after many constructions', () => {
    class Dto {
      @Matches(/^a+$/)
      s!: string;
    }
    for (let i = 0; i < 50; i++) new Dto();
    const errors = validateSync(Object.assign(new Dto(), { s: '!!!' }));
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints!)).toEqual(['matches']);
  });

  it('stores metadata under the global symbol registry key (survives duplicate installs)', () => {
    class Dto {
      @Matches(/^a$/)
      s!: string;
    }
    new Dto();
    expect((Dto as any)[Symbol.for('om-data-mapper:validation-metadata')]).toBeDefined();
  });
});
