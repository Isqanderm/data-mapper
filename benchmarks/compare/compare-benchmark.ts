// bench.ts
import { Suite } from "benchmark";
import { Mapper } from "../../src"; // OmDataMapper
import mapperJs from "@cookbook/mapper-js"; // @cookbook/mapper-js
import "automapper-ts"; // Loedeman’s AutoMapper (global `automapper`)
import objectMapper from "object-mapper"; // object-mapper
import createTransformer from "morphism"; // morphism
import { plainToClass, Transform } from "class-transformer";

// 1) Define Source and Target interfaces
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

// 2) Sample source data
const sourceData: Source = {
  id: 1,
  name: "John Doe",
  details: {
    age: 30,
    address: "123 Main St",
  },
};

class TargetCT {
  @Transform(({ obj }) => obj.id, { toClassOnly: true })
  userId: number | undefined;

  @Transform(({ obj }) => obj.name, { toClassOnly: true })
  fullName: string | undefined;

  @Transform(({ obj }) => obj.details.age, { toClassOnly: true })
  age: number | undefined;

  @Transform(({ obj }) => obj.details.address, { toClassOnly: true })
  location: string | undefined;
}

// ----------------------
// 3) OmDataMapper setup
// ----------------------
const omMapper = Mapper.create<Source, Target>({
  userId: "id",
  fullName: "name",
  age: "details.age",
  location: "details.address",
});

// --------------------------
// 4) @cookbook/mapper-js setup
// --------------------------
const mappingJs = mapperJs((map) => ({
  userId: map("id").value,
  fullName: map("name").value,
  age: map("details.age").value,
  location: map("details.address").value,
}));

// ----------------------------------------------
// 5) AutoMapper (automapper-ts) setup
// ----------------------------------------------
// The `opts` parameter is typed as `any` to avoid TS7006.
automapper
  .createMap("Source", "Target")
  .forMember("userId", (opts: any) => opts.mapFrom("id"))
  .forMember("fullName", (opts: any) => opts.mapFrom("name"))
  .forMember("age", (opts: any) => opts.mapFrom("details.age"))
  .forMember("location", (opts: any) => opts.mapFrom("details.address"));

// -----------------------------
// 6) object-mapper setup
// -----------------------------
const objMapSpec: Record<string, string> = {
  id: "userId",
  name: "fullName",
  "details.age": "age",
  "details.address": "location",
};

// -----------------------------
// 7) morphism setup
// -----------------------------
// const morphTransform = createTransformer<Source, Target>({
//   userId: "id",
//   fullName: "name",
//   age: "details.age",
//   location: "details.address",
// });

// -----------------------------
// 8) Vanilla (hand-written) mapping
// -----------------------------
function vanillaMapper(source: Source): Target {
  return {
    userId: source.id,
    fullName: source.name,
    age: source.details.age,
    location: source.details.address,
  };
}

// -------------------------------------------
// 9) Build Benchmark.js suite
// -------------------------------------------
const suite = new Suite();

suite
  .add("OmDataMapper#execute", function () {
    omMapper.execute(sourceData);
  })
  .add("class-transformer", function () {
    plainToClass(TargetCT, sourceData);
  })
  .add("@cookbook/mapper-js", function () {
    // @ts-ignore: mappingJs may not have perfect typings
    mappingJs(sourceData);
  })
  .add("AutoMapper (automapper-ts)", function () {
    automapper.map("Source", "Target", sourceData);
  })
  .add("object-mapper", function () {
    objectMapper.merge(sourceData, objMapSpec);
  })
  .add("morphism", function () {
    createTransformer(
      {
        userId: "id",
        fullName: "name",
        age: "details.age",
        location: "details.address",
      },
      sourceData,
    );
  })
  .add("Vanilla mapper", function () {
    vanillaMapper(sourceData);
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    // Collect name, hz, rme, sampleCount for each test
    const results = this.map((bench: any) => ({
      name: bench.name,
      hz: bench.hz,
      rme: bench.stats.rme,
      sampleCount: bench.stats.sample.length,
    }));
    console.log(JSON.stringify(results, null, 2));
  })
  .run({ async: true });
