"use strict";
/**
 * Model classes for class-transformer benchmarks
 * Using legacy decorators (experimentalDecorators)
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureUser = exports.TransformUser = exports.Product = exports.ComplexUser = exports.Company = exports.Address = exports.SimpleUser = void 0;
require("reflect-metadata");
const class_transformer_1 = require("class-transformer");
// ============================================================================
// Scenario 1: Simple Transformation (5-10 properties)
// ============================================================================
class SimpleUser {
}
exports.SimpleUser = SimpleUser;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], SimpleUser.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SimpleUser.prototype, "firstName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SimpleUser.prototype, "lastName", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SimpleUser.prototype, "email", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], SimpleUser.prototype, "age", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], SimpleUser.prototype, "isActive", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SimpleUser.prototype, "role", void 0);
// ============================================================================
// Scenario 2: Complex Nested Transformation
// ============================================================================
class Address {
}
exports.Address = Address;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], Address.prototype, "street", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], Address.prototype, "city", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], Address.prototype, "country", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], Address.prototype, "zipCode", void 0);
class Company {
}
exports.Company = Company;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], Company.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => Address),
    __metadata("design:type", Address)
], Company.prototype, "address", void 0);
class ComplexUser {
}
exports.ComplexUser = ComplexUser;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], ComplexUser.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], ComplexUser.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => Address),
    __metadata("design:type", Address)
], ComplexUser.prototype, "homeAddress", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => Company),
    __metadata("design:type", Company)
], ComplexUser.prototype, "company", void 0);
// ============================================================================
// Scenario 3: Array Transformation
// ============================================================================
class Product {
}
exports.Product = Product;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Boolean)
], Product.prototype, "inStock", void 0);
// ============================================================================
// Scenario 4: Transformation with Custom Logic
// ============================================================================
class TransformUser {
}
exports.TransformUser = TransformUser;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], TransformUser.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ value }) => value.toUpperCase()),
    __metadata("design:type", String)
], TransformUser.prototype, "name", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ value }) => new Date(value)),
    __metadata("design:type", Date)
], TransformUser.prototype, "createdAt", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Transform)(({ obj }) => `${obj.firstName} ${obj.lastName}`),
    __metadata("design:type", String)
], TransformUser.prototype, "fullName", void 0);
__decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], TransformUser.prototype, "password", void 0);
// ============================================================================
// Scenario 5: Exclude/Expose Mix
// ============================================================================
class SecureUser {
}
exports.SecureUser = SecureUser;
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", Number)
], SecureUser.prototype, "id", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SecureUser.prototype, "username", void 0);
__decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], SecureUser.prototype, "password", void 0);
__decorate([
    (0, class_transformer_1.Exclude)(),
    __metadata("design:type", String)
], SecureUser.prototype, "secretKey", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SecureUser.prototype, "email", void 0);
__decorate([
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SecureUser.prototype, "role", void 0);
