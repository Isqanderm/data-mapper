# Core Benchmarks

Benchmarks for `@tech-pioneer/data-mapper-core`'s mapping engine, each compared against
a hand-written vanilla JavaScript baseline for the same transformation. There
is no upstream library equivalent to core mapping, so every scenario here is
om vs. vanilla, not om vs. a third-party competitor — see the
[compat/ benchmarks](../compat/) for comparisons against real libraries.

See the [top-level benchmarks README](../README.md) for the honesty-guard
contract and fairness notes that apply to every file in this package,
including these. No performance numbers are recorded here or anywhere in
this package — run the suite to see current results.

## Files

- `simple.bench.ts` — direct field mapping and simple transformations.
- `complex.bench.ts` — nested object mapping, array transformations, custom
  transform functions, multiple mapping strategies.
- `nested.bench.ts` — deep, multi-level property traversal and extraction.
- `array.bench.ts` — bulk array transformation (mapping a batch of items).

Each file's honesty guard compares om's mapped output against its
hand-written vanilla equivalent for exact equality before any `bench()`
block runs; a mismatch throws and aborts the run.

## Running

From the repo root (builds the workspace packages first):

```bash
pnpm bench:core
```

A single file:

```bash
pnpm --filter benchmarks exec vitest bench --run core/simple.bench.ts
```

Watch mode:

```bash
pnpm --filter benchmarks exec vitest bench core/ --watch
```

## Adding a new benchmark

1. Create a new `.bench.ts` file in this directory.
2. Import Vitest's bench utilities and the mapper:

   ```typescript
   import { bench, describe } from 'vitest';
   import { Mapper, createMapper } from '@tech-pioneer/data-mapper-core';
   ```

3. Write a hand-written vanilla equivalent of whatever transform you're
   benchmarking, and add a guard that compares om's output against it for
   equality before the `describe`/`bench` block — follow the pattern in
   `simple.bench.ts`.
4. Add the `describe`/`bench` pair(s) comparing om against the vanilla
   baseline.
5. Run it: `pnpm --filter benchmarks exec vitest bench --run core/my-benchmark.bench.ts`.

## Troubleshooting

- **Nothing runs / import errors**: run `pnpm -r build` from the repo root
  first — the bench scripts depend on the built `@tech-pioneer/data-mapper-core`
  package, and `pnpm bench` / `pnpm bench:core` do this automatically.
- **Inconsistent results across runs**: close other applications, avoid
  running benchmarks under CPU frequency scaling, and re-run rather than
  trusting a single sample.
