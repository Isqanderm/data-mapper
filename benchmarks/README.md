# Benchmarks

This package is a private workspace member (not published) that measures
om-data-mapper's own throughput and, where a real upstream library exists for
comparison, benchmarks om against it directly. It contains **no performance
numbers or result tables** — see [Why no numbers here](#why-no-numbers-here)
below, which also states the rules the root README's dated snapshot follows.

## Structure

- `core/` — om's core mapping engine (`@om-data-mapper/core`) against a
  hand-written vanilla JavaScript baseline for the same transformation. There
  is no upstream library equivalent to core mapping, so the comparison is
  always om vs. vanilla, scenario by scenario (simple field mapping, nested
  property access, array/bulk transforms, complex multi-strategy mapping).
- `compat/` — om's drop-in compatibility layers
  (`@om-data-mapper/class-validator`, `@om-data-mapper/class-transformer`)
  against the real upstream libraries they mirror: `class-validator` and
  `class-transformer`. Each scenario runs the identical fixture through both
  om's decorators and the real library's decorators.

## How to run

From the repo root, the root-level scripts build the workspace packages
first, then run the bench suite:

```bash
pnpm bench          # everything: core/ + compat/
pnpm bench:core     # core/ only
pnpm bench:compat   # compat/ only
```

To run a single file (packages must already be built — run `pnpm -r build`
first if you haven't):

```bash
pnpm --filter benchmarks exec vitest bench --run compat/validation.bench.ts
```

Any other file under `core/` or `compat/` can be substituted the same way,
e.g. `core/simple.bench.ts` or `compat/transformation.bench.ts`.

## The honesty-guard contract

Every comparison file in this package asserts, before any `bench()` block
runs, that both engines under comparison actually do real work on the
scenario data — and throws if that assertion fails. For `compat/`, that means
running both the om and the upstream engine against the same fixture and
checking their output is correct (right validation errors on invalid input,
none on valid input; correct transformed field values, renames, exclusions,
and prototypes). For `core/`, that means comparing om's mapped output against
the hand-written vanilla baseline's output for equality. A guard failure is a
hard `throw` that aborts the entire run before any benchmark timing happens.

This exists because of a documented v4 failure: an earlier benchmark fed
class-validator-decorated classes straight into om's own validation engine.
om's engine looked for its own decorator metadata, found none on foreign
classes, and `validateSync` silently returned `[]` — a no-op dressed up as a
result. That no-op was timed, reported as a dramatic speed win, and the
published numbers were fabricated: they measured an engine doing nothing.
The guards in this package make that class of mistake structurally
impossible — a benchmark that isn't exercising real logic on both sides never
gets to the timing loop.

## Why no numbers here

Benchmark results are only ever produced by actually running the suite on
real hardware, in real conditions, at the time you need them. This README
intentionally contains no ops/sec figures, no percentile tables, and no
"expected performance" targets — such numbers go stale the moment the code,
the runtime, or the machine changes. Run `pnpm bench` (or one of the narrower
scripts) and read the output.

The root [`README.md`](../README.md) is the one exception: it carries a dated
snapshot of the `pnpm bench:compat` and `pnpm bench:core` results, because a
library README that says nothing about performance is not useful to someone
deciding whether to adopt it. That snapshot is bound by three rules, and any
future published number is bound by the same ones:

1. **It names the command that regenerates it.** A number nobody can reproduce
   is the v4 failure described above.
2. **It records the environment** — CPU, OS, Node version, upstream package
   versions, and the date — so a reader can tell whether it applies to them.
3. **It reports the losses too.** The root README's second table shows
   hand-written JavaScript beating the core mapper in three of four scenarios.
   Publishing only the favourable half is how "20,000% faster" happened.

If you update the snapshot, rerun both scripts on one machine and replace the
whole section, including the environment stamp — never edit individual rows.

## Fairness notes

- **Metadata is pre-warmed on both sides.** om attaches its decorator
  metadata lazily, on first instantiation of a decorated class. Every
  comparison file instantiates every om class and every upstream class at
  least once in a guard step before any `bench()` runs, so both engines enter
  the measured loop with warm metadata / JIT-compiled validators — neither
  side pays a one-time compile cost the other doesn't.
- **Upstream legacy decorators are applied programmatically.** The
  `class-validator` and `class-transformer` fixture models in `compat/` apply
  their decorators as plain function calls (`IsString()(Cls.prototype, 'x')`,
  etc.) rather than via `experimentalDecorators` class syntax. This keeps the
  same decorator semantics as normal usage of those libraries without
  requiring a different TypeScript decorator mode in this repo, so there's no
  build-step asymmetry between the om and upstream fixtures.
- **Vanilla baselines are hand-written per scenario** in `core/` and are
  expected to win some benchmarks — a hand-written function with no
  decorator/metadata machinery at all is a legitimate, and sometimes faster,
  point of comparison. The goal of these benchmarks is honest measurement,
  not a guaranteed win for om.
