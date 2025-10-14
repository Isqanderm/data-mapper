import { bench, describe } from 'vitest';
import { Mapper } from '../src';

interface NestedSource {
  level1: {
    level2: {
      level3: {
        level4: {
          value: string;
          number: number;
        };
      };
    };
  };
  array: Array<{
    items: Array<{
      data: string;
    }>;
  }>;
}

interface NestedTarget {
  deepValue: string;
  deepNumber: number;
  flattenedData: string[];
}

const nestedSourceData: NestedSource = {
  level1: {
    level2: {
      level3: {
        level4: {
          value: 'deep value',
          number: 42,
        },
      },
    },
  },
  array: [
    {
      items: [{ data: 'item1' }, { data: 'item2' }],
    },
    {
      items: [{ data: 'item3' }],
    },
  ],
};

const nestedMapper = Mapper.create<NestedSource, NestedTarget>({
  deepValue: 'level1.level2.level3.level4.value',
  deepNumber: 'level1.level2.level3.level4.number',
  flattenedData: (src) => src.array.flatMap((a) => a.items.map((i) => i.data)),
});

function vanillaNestedMapper(source: NestedSource): NestedTarget {
  return {
    deepValue: source.level1.level2.level3.level4.value,
    deepNumber: source.level1.level2.level3.level4.number,
    flattenedData: source.array.flatMap((a) => a.items.map((i) => i.data)),
  };
}

describe('Nested Mapping Benchmark', () => {
  bench('OmDataMapper - Deep nested access', () => {
    nestedMapper.execute(nestedSourceData);
  });

  bench('Vanilla - Deep nested access', () => {
    vanillaNestedMapper(nestedSourceData);
  });
});

