import { bench, describe } from 'vitest';
import { Mapper } from '../src';

interface Item {
  id: number;
  name: string;
  price: number;
}

interface ItemDTO {
  itemId: number;
  itemName: string;
  cost: number;
}

const items: Item[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Item ${i + 1}`,
  price: Math.random() * 100,
}));

const itemMapper = Mapper.create<Item, ItemDTO>({
  itemId: 'id',
  itemName: 'name',
  cost: 'price',
});

function vanillaArrayMapper(items: Item[]): ItemDTO[] {
  return items.map((item) => ({
    itemId: item.id,
    itemName: item.name,
    cost: item.price,
  }));
}

describe('Array Mapping Benchmark', () => {
  bench('OmDataMapper - Map 100 items', () => {
    items.map((item) => itemMapper.execute(item).result);
  });

  bench('Vanilla - Map 100 items', () => {
    vanillaArrayMapper(items);
  });
});

