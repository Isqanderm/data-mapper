import { bench, describe } from 'vitest';
import { Mapper, Map as MapProp, MapFrom, createMapper } from '@om-data-mapper/core';

interface ComplexSource {
  id: number;
  user: {
    firstName: string;
    lastName: string;
    profile: {
      age: number;
      email: string;
    };
  };
  orders: Array<{
    orderId: number;
    amount: number;
    items: Array<{
      productId: number;
      quantity: number;
    }>;
  }>;
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

interface ComplexTarget {
  userId: number;
  fullName: string;
  age: number;
  email: string;
  orderIds: number[];
  totalAmount: number;
  productCount: number;
  created: string;
  updated: string;
}

const complexSourceData: ComplexSource = {
  id: 1,
  user: {
    firstName: 'John',
    lastName: 'Doe',
    profile: {
      age: 30,
      email: 'john@example.com',
    },
  },
  orders: [
    {
      orderId: 101,
      amount: 250,
      items: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
    },
    {
      orderId: 102,
      amount: 150,
      items: [{ productId: 3, quantity: 3 }],
    },
  ],
  metadata: {
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  },
};

@Mapper<ComplexSource, ComplexTarget>()
class ComplexMapper {
  @MapProp('id')
  userId!: number;

  @MapFrom((src: ComplexSource) => `${src.user.firstName} ${src.user.lastName}`)
  fullName!: string;

  @MapProp('user.profile.age')
  age!: number;

  @MapProp('user.profile.email')
  email!: string;

  @MapFrom((src: ComplexSource) => src.orders.map((o) => o.orderId))
  orderIds!: number[];

  @MapFrom((src: ComplexSource) => src.orders.reduce((sum, o) => sum + o.amount, 0))
  totalAmount!: number;

  @MapFrom((src: ComplexSource) => src.orders.reduce((sum, o) => sum + o.items.length, 0))
  productCount!: number;

  @MapProp('metadata.createdAt')
  created!: string;

  @MapProp('metadata.updatedAt')
  updated!: string;
}

const complexMapper = createMapper<ComplexSource, ComplexTarget>(ComplexMapper);

function vanillaComplexMapper(source: ComplexSource): ComplexTarget {
  return {
    userId: source.id,
    fullName: `${source.user.firstName} ${source.user.lastName}`,
    age: source.user.profile.age,
    email: source.user.profile.email,
    orderIds: source.orders.map((o) => o.orderId),
    totalAmount: source.orders.reduce((sum, o) => sum + o.amount, 0),
    productCount: source.orders.reduce((sum, o) => sum + o.items.length, 0),
    created: source.metadata.createdAt,
    updated: source.metadata.updatedAt,
  };
}

// Honesty guard: prove the JIT-compiled mapper actually produces the
// vanilla-equivalent output before trusting the throughput numbers below.
const omResult = complexMapper.transform(complexSourceData);
const vanillaResult = vanillaComplexMapper(complexSourceData);
if (JSON.stringify(omResult) !== JSON.stringify(vanillaResult)) {
  throw new Error(
    `honesty guard: om mapping output differs from vanilla baseline: ${JSON.stringify(omResult)} vs ${JSON.stringify(vanillaResult)}`,
  );
}

describe('Complex Mapping Benchmark', () => {
  bench('OmDataMapper - Complex mapping with transformers', () => {
    complexMapper.transform(complexSourceData);
  });

  bench('Vanilla - Complex mapping with transformers', () => {
    vanillaComplexMapper(complexSourceData);
  });
});
