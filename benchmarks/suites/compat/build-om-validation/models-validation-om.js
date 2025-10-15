"use strict";
// @ts-nocheck - Import path is relative to compiled output, module resolution disabled for benchmarks
/**
 * Validation models using om-data-mapper/class-validator-compat
 * These models will be compiled and used in benchmarks
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplexUserDto = exports.MixedDto = exports.ProductDto = exports.SimpleUserDto = void 0;
const class_validator_1 = require("../../../../build/compat/class-validator");
/**
 * Simple DTO with string validators
 */
let SimpleUserDto = (() => {
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    return class SimpleUserDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(3), (0, class_validator_1.MaxLength)(50)];
            _email_decorators = [(0, class_validator_1.IsEmail)()];
            _password_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(8)];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        name = __runInitializers(this, _name_initializers, void 0);
        email = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _email_initializers, void 0));
        password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
        constructor() {
            __runInitializers(this, _password_extraInitializers);
        }
    };
})();
exports.SimpleUserDto = SimpleUserDto;
/**
 * DTO with number validators
 */
let ProductDto = (() => {
    let _name_decorators;
    let _name_initializers = [];
    let _name_extraInitializers = [];
    let _price_decorators;
    let _price_initializers = [];
    let _price_extraInitializers = [];
    let _quantity_decorators;
    let _quantity_initializers = [];
    let _quantity_extraInitializers = [];
    let _inStock_decorators;
    let _inStock_initializers = [];
    let _inStock_extraInitializers = [];
    return class ProductDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _price_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(1000000)];
            _quantity_decorators = [(0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(0)];
            _inStock_decorators = [(0, class_validator_1.IsBoolean)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: obj => "name" in obj, get: obj => obj.name, set: (obj, value) => { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _price_decorators, { kind: "field", name: "price", static: false, private: false, access: { has: obj => "price" in obj, get: obj => obj.price, set: (obj, value) => { obj.price = value; } }, metadata: _metadata }, _price_initializers, _price_extraInitializers);
            __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: obj => "quantity" in obj, get: obj => obj.quantity, set: (obj, value) => { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
            __esDecorate(null, null, _inStock_decorators, { kind: "field", name: "inStock", static: false, private: false, access: { has: obj => "inStock" in obj, get: obj => obj.inStock, set: (obj, value) => { obj.inStock = value; } }, metadata: _metadata }, _inStock_initializers, _inStock_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        name = __runInitializers(this, _name_initializers, void 0);
        price = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _price_initializers, void 0));
        quantity = (__runInitializers(this, _price_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
        inStock = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _inStock_initializers, void 0));
        constructor() {
            __runInitializers(this, _inStock_extraInitializers);
        }
    };
})();
exports.ProductDto = ProductDto;
/**
 * DTO with mixed validators and optional fields
 */
let MixedDto = (() => {
    let _firstName_decorators;
    let _firstName_initializers = [];
    let _firstName_extraInitializers = [];
    let _lastName_decorators;
    let _lastName_initializers = [];
    let _lastName_extraInitializers = [];
    let _middleName_decorators;
    let _middleName_initializers = [];
    let _middleName_extraInitializers = [];
    let _age_decorators;
    let _age_initializers = [];
    let _age_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _phone_decorators;
    let _phone_initializers = [];
    let _phone_extraInitializers = [];
    return class MixedDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _firstName_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(3)];
            _lastName_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(3)];
            _middleName_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _age_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(0), (0, class_validator_1.Max)(150)];
            _email_decorators = [(0, class_validator_1.IsEmail)()];
            _phone_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: obj => "firstName" in obj, get: obj => obj.firstName, set: (obj, value) => { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
            __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: obj => "lastName" in obj, get: obj => obj.lastName, set: (obj, value) => { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
            __esDecorate(null, null, _middleName_decorators, { kind: "field", name: "middleName", static: false, private: false, access: { has: obj => "middleName" in obj, get: obj => obj.middleName, set: (obj, value) => { obj.middleName = value; } }, metadata: _metadata }, _middleName_initializers, _middleName_extraInitializers);
            __esDecorate(null, null, _age_decorators, { kind: "field", name: "age", static: false, private: false, access: { has: obj => "age" in obj, get: obj => obj.age, set: (obj, value) => { obj.age = value; } }, metadata: _metadata }, _age_initializers, _age_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: obj => "phone" in obj, get: obj => obj.phone, set: (obj, value) => { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        firstName = __runInitializers(this, _firstName_initializers, void 0);
        lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
        middleName = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _middleName_initializers, void 0));
        age = (__runInitializers(this, _middleName_extraInitializers), __runInitializers(this, _age_initializers, void 0));
        email = (__runInitializers(this, _age_extraInitializers), __runInitializers(this, _email_initializers, void 0));
        phone = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
        constructor() {
            __runInitializers(this, _phone_extraInitializers);
        }
    };
})();
exports.MixedDto = MixedDto;
/**
 * Complex DTO with many properties (10+ fields)
 */
let ComplexUserDto = (() => {
    let _username_decorators;
    let _username_initializers = [];
    let _username_extraInitializers = [];
    let _email_decorators;
    let _email_initializers = [];
    let _email_extraInitializers = [];
    let _password_decorators;
    let _password_initializers = [];
    let _password_extraInitializers = [];
    let _firstName_decorators;
    let _firstName_initializers = [];
    let _firstName_extraInitializers = [];
    let _lastName_decorators;
    let _lastName_initializers = [];
    let _lastName_extraInitializers = [];
    let _middleName_decorators;
    let _middleName_initializers = [];
    let _middleName_extraInitializers = [];
    let _age_decorators;
    let _age_initializers = [];
    let _age_extraInitializers = [];
    let _country_decorators;
    let _country_initializers = [];
    let _country_extraInitializers = [];
    let _city_decorators;
    let _city_initializers = [];
    let _city_extraInitializers = [];
    let _address_decorators;
    let _address_initializers = [];
    let _address_extraInitializers = [];
    let _phone_decorators;
    let _phone_initializers = [];
    let _phone_extraInitializers = [];
    let _isActive_decorators;
    let _isActive_initializers = [];
    let _isActive_extraInitializers = [];
    let _emailVerified_decorators;
    let _emailVerified_initializers = [];
    let _emailVerified_extraInitializers = [];
    let _bio_decorators;
    let _bio_initializers = [];
    let _bio_extraInitializers = [];
    return class ComplexUserDto {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _username_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(3), (0, class_validator_1.MaxLength)(50)];
            _email_decorators = [(0, class_validator_1.IsEmail)()];
            _password_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(8), (0, class_validator_1.MaxLength)(100)];
            _firstName_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(50)];
            _lastName_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2), (0, class_validator_1.MaxLength)(50)];
            _middleName_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MaxLength)(50)];
            _age_decorators = [(0, class_validator_1.IsNumber)(), (0, class_validator_1.Min)(18), (0, class_validator_1.Max)(120)];
            _country_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _city_decorators = [(0, class_validator_1.IsString)(), (0, class_validator_1.IsNotEmpty)()];
            _address_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _phone_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _isActive_decorators = [(0, class_validator_1.IsBoolean)()];
            _emailVerified_decorators = [(0, class_validator_1.IsBoolean)()];
            _bio_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _username_decorators, { kind: "field", name: "username", static: false, private: false, access: { has: obj => "username" in obj, get: obj => obj.username, set: (obj, value) => { obj.username = value; } }, metadata: _metadata }, _username_initializers, _username_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: obj => "email" in obj, get: obj => obj.email, set: (obj, value) => { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _password_decorators, { kind: "field", name: "password", static: false, private: false, access: { has: obj => "password" in obj, get: obj => obj.password, set: (obj, value) => { obj.password = value; } }, metadata: _metadata }, _password_initializers, _password_extraInitializers);
            __esDecorate(null, null, _firstName_decorators, { kind: "field", name: "firstName", static: false, private: false, access: { has: obj => "firstName" in obj, get: obj => obj.firstName, set: (obj, value) => { obj.firstName = value; } }, metadata: _metadata }, _firstName_initializers, _firstName_extraInitializers);
            __esDecorate(null, null, _lastName_decorators, { kind: "field", name: "lastName", static: false, private: false, access: { has: obj => "lastName" in obj, get: obj => obj.lastName, set: (obj, value) => { obj.lastName = value; } }, metadata: _metadata }, _lastName_initializers, _lastName_extraInitializers);
            __esDecorate(null, null, _middleName_decorators, { kind: "field", name: "middleName", static: false, private: false, access: { has: obj => "middleName" in obj, get: obj => obj.middleName, set: (obj, value) => { obj.middleName = value; } }, metadata: _metadata }, _middleName_initializers, _middleName_extraInitializers);
            __esDecorate(null, null, _age_decorators, { kind: "field", name: "age", static: false, private: false, access: { has: obj => "age" in obj, get: obj => obj.age, set: (obj, value) => { obj.age = value; } }, metadata: _metadata }, _age_initializers, _age_extraInitializers);
            __esDecorate(null, null, _country_decorators, { kind: "field", name: "country", static: false, private: false, access: { has: obj => "country" in obj, get: obj => obj.country, set: (obj, value) => { obj.country = value; } }, metadata: _metadata }, _country_initializers, _country_extraInitializers);
            __esDecorate(null, null, _city_decorators, { kind: "field", name: "city", static: false, private: false, access: { has: obj => "city" in obj, get: obj => obj.city, set: (obj, value) => { obj.city = value; } }, metadata: _metadata }, _city_initializers, _city_extraInitializers);
            __esDecorate(null, null, _address_decorators, { kind: "field", name: "address", static: false, private: false, access: { has: obj => "address" in obj, get: obj => obj.address, set: (obj, value) => { obj.address = value; } }, metadata: _metadata }, _address_initializers, _address_extraInitializers);
            __esDecorate(null, null, _phone_decorators, { kind: "field", name: "phone", static: false, private: false, access: { has: obj => "phone" in obj, get: obj => obj.phone, set: (obj, value) => { obj.phone = value; } }, metadata: _metadata }, _phone_initializers, _phone_extraInitializers);
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: obj => "isActive" in obj, get: obj => obj.isActive, set: (obj, value) => { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _emailVerified_decorators, { kind: "field", name: "emailVerified", static: false, private: false, access: { has: obj => "emailVerified" in obj, get: obj => obj.emailVerified, set: (obj, value) => { obj.emailVerified = value; } }, metadata: _metadata }, _emailVerified_initializers, _emailVerified_extraInitializers);
            __esDecorate(null, null, _bio_decorators, { kind: "field", name: "bio", static: false, private: false, access: { has: obj => "bio" in obj, get: obj => obj.bio, set: (obj, value) => { obj.bio = value; } }, metadata: _metadata }, _bio_initializers, _bio_extraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        username = __runInitializers(this, _username_initializers, void 0);
        email = (__runInitializers(this, _username_extraInitializers), __runInitializers(this, _email_initializers, void 0));
        password = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _password_initializers, void 0));
        firstName = (__runInitializers(this, _password_extraInitializers), __runInitializers(this, _firstName_initializers, void 0));
        lastName = (__runInitializers(this, _firstName_extraInitializers), __runInitializers(this, _lastName_initializers, void 0));
        middleName = (__runInitializers(this, _lastName_extraInitializers), __runInitializers(this, _middleName_initializers, void 0));
        age = (__runInitializers(this, _middleName_extraInitializers), __runInitializers(this, _age_initializers, void 0));
        country = (__runInitializers(this, _age_extraInitializers), __runInitializers(this, _country_initializers, void 0));
        city = (__runInitializers(this, _country_extraInitializers), __runInitializers(this, _city_initializers, void 0));
        address = (__runInitializers(this, _city_extraInitializers), __runInitializers(this, _address_initializers, void 0));
        phone = (__runInitializers(this, _address_extraInitializers), __runInitializers(this, _phone_initializers, void 0));
        isActive = (__runInitializers(this, _phone_extraInitializers), __runInitializers(this, _isActive_initializers, void 0));
        emailVerified = (__runInitializers(this, _isActive_extraInitializers), __runInitializers(this, _emailVerified_initializers, void 0));
        bio = (__runInitializers(this, _emailVerified_extraInitializers), __runInitializers(this, _bio_initializers, void 0));
        constructor() {
            __runInitializers(this, _bio_extraInitializers);
        }
    };
})();
exports.ComplexUserDto = ComplexUserDto;
