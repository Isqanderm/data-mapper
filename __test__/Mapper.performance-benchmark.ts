import { Suite } from "benchmark";
import { MappingConfiguration } from "../src/interface";
import { Mapper } from "../src/Mapper";

// Пример конфигурации маппинга
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

const mappingConfig: MappingConfiguration<Source, Target> = {
  userId: "id",
  fullName: "name",
  age: "details.age",
  location: "details.address",
};

// Пример данных
const sourceData: Source = {
  id: 1,
  name: "John Doe",
  details: {
    age: 30,
    address: "123 Main St",
  },
};

// Инициализация маппера
const mapper = new Mapper<Source, Target>(mappingConfig);

// Создание тестового набора
const suite = new Suite();

suite
  .add("Mapper#execute", function () {
    mapper.execute(sourceData);
  })
  .on("cycle", function (event: any) {
    console.log(String(event.target));
  })
  .on("complete", function (this: any) {
    console.log("Fastest is " + this.filter("fastest").map("name"));
  })
  .run({ async: true });
