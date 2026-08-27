import { bench, describe } from 'vitest';
import { Mapper, Map as MapProp, MapFrom, createMapper } from '@tech-pioneer/data-mapper-core';

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

@Mapper<NestedSource, NestedTarget>()
class NestedMapper {
  @MapProp('level1.level2.level3.level4.value')
  deepValue!: string;

  @MapProp('level1.level2.level3.level4.number')
  deepNumber!: number;

  @MapFrom((src: NestedSource) => src.array.flatMap((a) => a.items.map((i) => i.data)))
  flattenedData!: string[];
}

const nestedMapper = createMapper<NestedSource, NestedTarget>(NestedMapper);

function vanillaNestedMapper(source: NestedSource): NestedTarget {
  return {
    deepValue: source.level1.level2.level3.level4.value,
    deepNumber: source.level1.level2.level3.level4.number,
    flattenedData: source.array.flatMap((a) => a.items.map((i) => i.data)),
  };
}

// Honesty guard: prove the JIT-compiled mapper actually produces the
// vanilla-equivalent output (including the flattened nested array) before
// trusting the throughput numbers below.
const omResult = nestedMapper.transform(nestedSourceData);
const vanillaResult = vanillaNestedMapper(nestedSourceData);
if (JSON.stringify(omResult) !== JSON.stringify(vanillaResult)) {
  throw new Error(
    `honesty guard: om mapping output differs from vanilla baseline: ${JSON.stringify(omResult)} vs ${JSON.stringify(vanillaResult)}`,
  );
}

describe('Nested Mapping Benchmark', () => {
  bench('OmDataMapper - Deep nested access', () => {
    nestedMapper.transform(nestedSourceData);
  });

  bench('Vanilla - Deep nested access', () => {
    vanillaNestedMapper(nestedSourceData);
  });
});
