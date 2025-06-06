import { Suite } from "benchmark";
import { Mapper } from "../../src";

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
  name: "John Doe",
  details: {
    age: 30,
    address: "123 Main St",
  },
};

const mapper = Mapper.create<Source, Target>({
  userId: "id",
  fullName: "name",
  age: "details.age",
  location: "details.address",
});

function vanillaMapper(source: Source): Target {
  return {
    userId: source.id,
    fullName: source.name,
    age: source.details.age,
    location: source.details.address,
  };
}

const suite = new Suite();

suite
  .add("Mapper#execute", function () {
    mapper.execute(sourceData);
  })
  .add("Vanilla mapper", function () {
    vanillaMapper(sourceData);
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    const results = this.map((bench: any) => ({
      name: bench.name,
      hz: bench.hz,
      rme: bench.stats.rme,
      sampleCount: bench.stats.sample.length,
    }));
    console.log(JSON.stringify(results, null, 2));
  })
  .run({ async: true });
