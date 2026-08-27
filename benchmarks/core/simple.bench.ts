import { bench, describe } from 'vitest';
import { Mapper, Map as MapProp, createMapper } from '@tech-pioneer/data-mapper-core';

interface Source {
  id: number;
  name: string;
  details: {
    age: number;
    address: string;
  };
}

interface Target {
  userId: number;
  fullName: string;
  age: number;
  location: string;
}

const sourceData: Source = {
  id: 1,
  name: 'John Doe',
  details: {
    age: 30,
    address: '123 Main St',
  },
};

@Mapper<Source, Target>()
class SimpleMapper {
  @MapProp('id')
  userId!: number;

  @MapProp('name')
  fullName!: string;

  @MapProp('details.age')
  age!: number;

  @MapProp('details.address')
  location!: string;
}

const mapper = createMapper<Source, Target>(SimpleMapper);

function vanillaMapper(source: Source): Target {
  return {
    userId: source.id,
    fullName: source.name,
    age: source.details.age,
    location: source.details.address,
  };
}

// Honesty guard: prove the JIT-compiled mapper actually produces the
// vanilla-equivalent output before trusting the throughput numbers below.
const omResult = mapper.transform(sourceData);
const vanillaResult = vanillaMapper(sourceData);
if (JSON.stringify(omResult) !== JSON.stringify(vanillaResult)) {
  throw new Error(
    `honesty guard: om mapping output differs from vanilla baseline: ${JSON.stringify(omResult)} vs ${JSON.stringify(vanillaResult)}`,
  );
}

describe('Simple Mapping Benchmark', () => {
  bench('OmDataMapper - Simple mapping', () => {
    mapper.transform(sourceData);
  });

  bench('Vanilla - Simple mapping', () => {
    vanillaMapper(sourceData);
  });
});
