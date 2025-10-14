import { bench, describe } from 'vitest';
import { Mapper } from '../src';

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

const complexMapper = Mapper.create<ComplexSource, ComplexTarget>({
  userId: 'id',
  fullName: (src) => `${src.user.firstName} ${src.user.lastName}`,
  age: 'user.profile.age',
  email: 'user.profile.email',
  orderIds: (src) => src.orders.map((o) => o.orderId),
  totalAmount: (src) => src.orders.reduce((sum, o) => sum + o.amount, 0),
  productCount: (src) => src.orders.reduce((sum, o) => sum + o.items.length, 0),
  created: 'metadata.createdAt',
  updated: 'metadata.updatedAt',
});

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

describe('Complex Mapping Benchmark', () => {
  bench('OmDataMapper - Complex mapping with transformers', () => {
    complexMapper.execute(complexSourceData);
  });

  bench('Vanilla - Complex mapping with transformers', () => {
    vanillaComplexMapper(complexSourceData);
  });
});

