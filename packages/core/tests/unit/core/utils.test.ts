import { describe, it, expect } from 'vitest';
import { getValueByPath, parsePath, PathObject } from '../../../src/core/utils';

describe('parsePath()', () => {
  it('parses a single key', () => {
    expect(parsePath('foo')).toEqual([{ type: 'key', part: 'foo' }]);
  });

  it('parses nested keys separated by dots', () => {
    expect(parsePath('user.name.first')).toEqual([
      { type: 'key', part: 'user' },
      { type: 'key', part: 'name' },
      { type: 'key', part: 'first' },
    ]);
  });

  it('parses wildcard array selectors', () => {
    expect(parsePath('items.[]')).toEqual([
      { type: 'key', part: 'items' },
      { type: 'array', part: '[]' },
    ]);
  });

  it('parses numeric indices', () => {
    expect(parsePath('list.[3].name')).toEqual([
      { type: 'key', part: 'list' },
      { type: 'index', part: '3' },
      { type: 'key', part: 'name' },
    ]);
  });

  it('parses argument indices', () => {
    expect(parsePath('$0.[2]')).toEqual([
      { type: 'args_index', part: '0' },
      { type: 'index', part: '2' },
    ]);
  });

  it('parses complex mixed paths', () => {
    expect(parsePath('data.items.[]')).toEqual([
      { type: 'key', part: 'data' },
      { type: 'key', part: 'items' },
      { type: 'array', part: '[]' },
    ]);
  });
});

describe('getValueByPath()', () => {
  function mapPaths(input: string): string[] {
    return getValueByPath(input).map((obj: PathObject) => obj.path);
  }

  it('returns a single path object for simple keys', () => {
    expect(mapPaths('foo')).toEqual(['foo']);
  });

  it('chains nested keys with optional chaining', () => {
    expect(mapPaths('foo.bar.baz')).toEqual(['foo?.bar?.baz']);
  });

  it('handles numeric index and continues the chain', () => {
    expect(mapPaths('arr.[1].value')).toEqual(['arr?.[1]?.value']);
  });

  it('resets on wildcard array and emits multiple path objects', () => {
    expect(mapPaths('items.[].value')).toEqual(['items', 'value']);
  });

  it('handles argument index correctly', () => {
    expect(mapPaths('$0.[2].city')).toEqual(['[0]?.[2]?.city']);
  });

  it('processes complex mixed path patterns', () => {
    expect(mapPaths('data.items.[].[3].field')).toEqual(['data?.items', '[3]?.field']);
  });
});

