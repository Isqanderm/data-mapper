import { bench, describe } from 'vitest';
import { Mapper, Map as MapProp, createMapper } from '@tech-pioneer/data-mapper-core';

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

@Mapper<Item, ItemDTO>()
class ItemMapper {
  @MapProp('id')
  itemId!: number;

  @MapProp('name')
  itemName!: string;

  @MapProp('price')
  cost!: number;
}

const itemMapper = createMapper<Item, ItemDTO>(ItemMapper);

function vanillaArrayMapper(items: Item[]): ItemDTO[] {
  return items.map((item) => ({
    itemId: item.id,
    itemName: item.name,
    cost: item.price,
  }));
}

// Honesty guard: prove the JIT-compiled mapper produces the vanilla-equivalent
// array output (per-item, in order) before trusting the throughput numbers below.
const omResult = items.map((item) => itemMapper.transform(item));
const vanillaResult = vanillaArrayMapper(items);
if (JSON.stringify(omResult) !== JSON.stringify(vanillaResult)) {
  throw new Error(
    `honesty guard: om mapping output differs from vanilla baseline: ${JSON.stringify(omResult)} vs ${JSON.stringify(vanillaResult)}`,
  );
}

describe('Array Mapping Benchmark', () => {
  bench('OmDataMapper - Map 100 items', () => {
    items.map((item) => itemMapper.transform(item));
  });

  bench('Vanilla - Map 100 items', () => {
    vanillaArrayMapper(items);
  });
});
