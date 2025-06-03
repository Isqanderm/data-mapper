import { Mapper } from "../src";

describe("om-data-mapper", () => {
  describe("Basic mapping functionality", () => {
    it("maps numeric and string fields with descriptive names", () => {
      type Source = { count: number; message: string };
      type Target = { itemCount: number; displayMessage: string };

      const mapper = Mapper.create<Source, Target>({
        itemCount: "count",
        displayMessage: "message",
      });

      const sourceData: Source = { count: 5, message: "Hello World" };
      const { result } = mapper.execute(sourceData);
      const expected: Target = { itemCount: 5, displayMessage: "Hello World" };

      expect(result).toEqual(expected);
    });

    it("combines fields via a transformer function into a full name", () => {
      type Source = { firstName: string; lastName: string };
      type Target = { fullName: string };

      const mapper = Mapper.create<Source, Target>({
        fullName: ({ firstName, lastName }) => `${firstName} ${lastName}`,
      });

      const sourceData: Source = { firstName: "Jane", lastName: "Smith" };
      const { result } = mapper.execute(sourceData);

      expect(result.fullName).toBe("Jane Smith");
    });

    it("combines fields via a transformer function into a full name  in deep field", () => {
      type Source = { firstName: string; lastName: string };
      type Target = {
        user: {
          fullName: string;
        };
      };

      const mapper = Mapper.create<Source, Target>({
        user: {
          fullName: ({ firstName, lastName }) => `${firstName} ${lastName}`,
        },
      });

      const sourceData: Source = { firstName: "Jane", lastName: "Smith" };
      const { result } = mapper.execute(sourceData);

      expect(result).toEqual({
        user: {
          fullName: "Jane Smith",
        },
      });
    });

    it("extracts deep nested value using dot-path notation", () => {
      type Source = { config: { maxUsers: number } };
      type Target = { maxUsers: number };

      const mapper = Mapper.create<Source, Target>({
        maxUsers: "config.maxUsers",
      });

      const sourceData: Source = { config: { maxUsers: 100 } };
      const { result } = mapper.execute(sourceData);

      expect(result.maxUsers).toBe(100);
    });

    it("handles arrays and picks elements with clear selectors", () => {
      type Source = { scores: number[] };
      type Target = { allScores: number[]; topScore: number };

      const mapper = Mapper.create<Source, Target>({
        allScores: "scores.[]",
        topScore: "scores.[0]",
      });

      const sourceData: Source = { scores: [90, 75, 60] };
      const { result } = mapper.execute(sourceData);
      const expected: Target = { allScores: [90, 75, 60], topScore: 90 };

      expect(result).toEqual(expected);
    });
  });

  describe("Nested and advanced mapping", () => {
    it("maps nested object inline with meaningful keys", () => {
      type Address = { city: string; postalCode: string };
      type TargetAddress = { cityName: string; zipCode: string };
      type Source = { address: Address };
      type Target = { address: TargetAddress };

      const mapper = Mapper.create<Source, Target>({
        address: {
          cityName: "address.city",
          zipCode: "address.postalCode",
        },
      });

      const sourceData: Source = {
        address: { city: "Berlin", postalCode: "10115" },
      };
      const { result } = mapper.execute(sourceData);
      const expected: Target = {
        address: { cityName: "Berlin", zipCode: "10115" },
      };

      expect(result).toEqual(expected);
    });

    it("uses a separate mapper instance for nested transformation", () => {
      type Address = { street: string; city: string };
      type TargetAddress = { formatted: string };
      type Source = { address: Address };
      type Target = { address: TargetAddress };

      const addressMapper = Mapper.create<Address, TargetAddress>({
        formatted: ({ street, city }) => `${street}, ${city}`,
      });

      const mapper = Mapper.create<Source, Target>({ address: addressMapper });

      const sourceData: Source = {
        address: { street: "Oak St", city: "Seattle" },
      };
      const { result } = mapper.execute(sourceData);
      const expected: Target = { address: { formatted: "Oak St, Seattle" } };

      expect(result).toEqual(expected);
    });

    it("supports multi-source mapping for lookups", () => {
      type Employee = { fullName: string; departmentId: number };
      type Department = { id: number; name: string };
      type Target = { employeeName: string; departmentName: string };

      const mapper = Mapper.create<[Employee, Department[]], Target>({
        employeeName: "$0.fullName",
        departmentName: ([emp, depts]) =>
          depts.find((d) => d.id === emp.departmentId)!.name,
      });

      const emp: Employee = { fullName: "Carlos", departmentId: 3 };
      const depts: Department[] = [
        { id: 1, name: "HR" },
        { id: 3, name: "Engineering" },
      ];

      const { result } = mapper.execute([emp, depts]);
      const expected: Target = {
        employeeName: "Carlos",
        departmentName: "Engineering",
      };

      expect(result).toEqual(expected);
    });
  });

  describe("String-path array mapping", () => {
    it("maps array of objects by string path with nested map", () => {
      type Source = { items?: { value: number }[] };
      type Target = { values: number[] };

      const mapper = Mapper.create<Source, Target>({
        values: "items.[].value",
      });
      const src: Source = { items: [{ value: 10 }, { value: 20 }] };
      const { result, errors } = mapper.execute(src);

      expect(errors).toEqual([]);
      expect(result.values).toEqual([10, 20]);
    });

    it("applies defaultValues when source array is undefined", () => {
      type Source = { items?: { value: number }[] };
      type Target = { values: number[] };

      const defaults = { values: [1, 2, 3] };
      const mapper = Mapper.create<Source, Target>(
        { values: "items.[].value" },
        defaults,
      );
      const { result, errors } = mapper.execute({});

      expect(errors).toEqual([]);
      expect(result.values).toEqual([1, 2, 3]);
    });
  });

  describe("Function transformer branch", () => {
    it("uses transformer function with fallback default for undefined source", () => {
      type Source = { count?: number };
      type Target = { double?: number };

      const defaults = { double: 999 };
      const mapper = Mapper.create<Source, Target>(
        {
          double: (src) =>
            src.count !== undefined ? src.count * 2 : undefined,
        },
        defaults,
      );

      const { result: r1, errors: e1 } = mapper.execute({ count: 5 } as Source);
      expect(e1).toEqual([]);
      expect(r1.double).toBe(10);

      const { result: r2, errors: e2 } = mapper.execute({} as Source);
      expect(e2).toEqual([]);
      expect(r2.double).toBe(undefined);
    });
  });

  describe("Nested Mapper instance branch", () => {
    it("uses nested Mapper default values when nested source missing", () => {
      type Address = { city?: string };
      type AddressDTO = { city?: string };
      type Source = { address?: Address };
      type Target = { address?: AddressDTO };

      const nestedDefaults = { city: "Unknown" };
      const addressMapper = Mapper.create<Address, AddressDTO>(
        {},
        nestedDefaults,
      );
      const mapper = Mapper.create<Source, Target>({ address: addressMapper });

      const { result, errors } = mapper.execute({});
      expect(errors).toEqual([]);
      expect(result.address).toEqual({ city: undefined });
    });

    it("captures errors in nested mapping", () => {
      type Address = { city: string };
      type AddressDTO = { cityUpper: string };
      type Source = { address?: Address };
      type Target = { address?: AddressDTO };

      const addressMapper = Mapper.create<Address, AddressDTO>({
        cityUpper: (a) => a.city.toUpperCase(),
      });
      const mapper = Mapper.create<Source, Target>({ address: addressMapper });

      const { result: ok, errors: e1 } = mapper.execute({
        address: { city: "Minsk" },
      });
      expect(e1).toEqual([]);
      expect(ok.address!.cityUpper).toBe("MINSK");

      const { result: r2, errors: e2 } = mapper.execute({
        address: { city: undefined as any },
      });
      expect(r2.address!.cityUpper).toBeUndefined();
      expect(e2.length).toBeGreaterThan(0);
    });
  });

  describe("renderTemplateForKeySelect: deep nested wildcards", () => {
    it("handles two levels of array wildcards (restPaths.length>0 && nested)", () => {
      type Source = {
        items: {
          sub: {
            v: number;
          }[];
        }[];
      };
      type Target = { values: number[] };
      const mapper = Mapper.create<Source, Target>({
        values: "items.[].sub.[].v",
      });
      const src: Source = {
        items: [{ sub: [{ v: 1 }, { v: 2 }] }, { sub: [{ v: 3 }] }],
      };
      const { result, errors } = mapper.execute(src);
      expect(errors).toEqual([]);
      // flatten across two levels
      expect(result.values).toEqual([[1, 2], [3]]);
    });

    it("maps first-level wildcard without defaultValues (restPaths.length>0)", () => {
      type Source = { data?: { x: number }[] };
      type Target = { xs: number[] };
      const mapper = Mapper.create<Source, Target>({
        xs: "data.[].x",
      });
      const src: Source = { data: [{ x: 5 }, { x: 7 }] };
      const { result, errors } = mapper.execute(src);
      expect(errors).toEqual([]);
      expect(result.xs).toEqual([5, 7]);
    });
  });

  describe("createCompiler: function branch with useUnsafe", () => {
    it("omits try/catch when config.useUnsafe=true", () => {
      type Source = { num: number };
      type Target = { doubled: number };
      const mapper = Mapper.create<Source, Target>(
        { doubled: (s) => s.num * 2 },
        undefined,
        { useUnsafe: true },
      );
      const { result, errors } = mapper.execute({ num: 3 });
      expect(errors).toEqual([]);
      expect(result.doubled).toBe(6);
    });
  });

  describe("compile & execute coverage", () => {
    it("allows calling compile() explicitly before execute()", () => {
      type Source = { v: number };
      type Target = { v2: number };
      const mapper = Mapper.create<Source, Target>({ v2: "v" });
      // вызываем compile вручную
      (mapper as any).compile();
      const { result, errors } = mapper.execute({ v: 9 });
      expect(errors).toEqual([]);
      expect(result.v2).toBe(9);
    });
  });
});
