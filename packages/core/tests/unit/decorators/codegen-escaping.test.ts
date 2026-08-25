import { describe, it, expect } from 'vitest';
import { Mapper, Map } from '../../../src/decorators';

describe('codegen escaping', () => {
  it('maps kebab-case source keys', () => {
    @Mapper()
    class HeaderMapper {
      @Map('content-type')
      contentType!: string;
    }
    const result = new HeaderMapper().transform({ 'content-type': 'application/json' } as any);
    expect(result.contentType).toBe('application/json');
  });

  it('maps nested kebab-case source paths', () => {
    @Mapper()
    class UserMapper {
      @Map('user-info.first-name')
      firstName!: string;
    }
    const result = new UserMapper().transform({
      'user-info': { 'first-name': 'Ada' },
    } as any);
    expect(result.firstName).toBe('Ada');
  });

  it('maps quoted (non-identifier) target field names', () => {
    @Mapper()
    class WeirdMapper {
      @Map('a')
      'weird-key'!: string;
    }
    const result = new WeirdMapper().transform({ a: 'ok' } as any);
    expect((result as any)['weird-key']).toBe('ok');
  });

  it('neutralizes code-bearing keys instead of executing them', () => {
    // No '.' in the payload: @Map() treats dots as path separators, so a dotted
    // key is a legitimate nested path, not a single key. This payload escapes
    // the raw `source?.<path>` emission with a statement separator instead.
    const hostile = 'a; globalThis["__pwned"] = true; //';
    @Mapper()
    class HostileMapper {
      @Map(hostile)
      v!: string;
    }
    const result = new HostileMapper().transform({ [hostile]: 'ok' } as any);
    expect(result.v).toBe('ok');
    expect((globalThis as any).__pwned).toBeUndefined();
  });
});
