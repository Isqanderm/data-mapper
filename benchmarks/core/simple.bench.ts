import { bench, describe } from 'vitest';
import { Mapper } from '../../../src/core/Mapper';

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

const mapper = Mapper.create<Source, Target>({
  userId: 'id',
  fullName: 'name',
  age: 'details.age',
  location: 'details.address',
});

function vanillaMapper(source: Source): Target {
  return {
    userId: source.id,
    fullName: source.name,
    age: source.details.age,
    location: source.details.address,
  };
}

describe('Simple Mapping Benchmark', () => {
  bench('OmDataMapper - Simple mapping', () => {
    mapper.execute(sourceData);
  });

  bench('Vanilla - Simple mapping', () => {
    vanillaMapper(sourceData);
  });
});

