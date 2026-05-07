"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var DataHasBeenLoaded_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataHasBeenLoaded = void 0;
const common_1 = require("@ftc-scout/common");
const typeorm_1 = require("typeorm");
let DataHasBeenLoaded = exports.DataHasBeenLoaded = DataHasBeenLoaded_1 = class DataHasBeenLoaded extends typeorm_1.BaseEntity {
    static teamsHaveBeenLoaded(season) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            return (_b = (_a = (yield DataHasBeenLoaded_1.findOneBy({ season }))) === null || _a === void 0 ? void 0 : _a.teams) !== null && _b !== void 0 ? _b : false;
        });
    }
    static eventsHaveBeenLoaded(season) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            return (_b = (_a = (yield DataHasBeenLoaded_1.findOneBy({ season }))) === null || _a === void 0 ? void 0 : _a.events) !== null && _b !== void 0 ? _b : false;
        });
    }
    static matchesHaveBeenLoaded(season) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            return (_b = (_a = (yield DataHasBeenLoaded_1.findOneBy({ season }))) === null || _a === void 0 ? void 0 : _a.matches) !== null && _b !== void 0 ? _b : false;
        });
    }
    static awardsHaveBeenLoaded(season) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            return (_b = (_a = (yield DataHasBeenLoaded_1.findOneBy({ season }))) === null || _a === void 0 ? void 0 : _a.awards) !== null && _b !== void 0 ? _b : false;
        });
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)("int"),
    __metadata("design:type", Number)
], DataHasBeenLoaded.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DataHasBeenLoaded.prototype, "teams", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DataHasBeenLoaded.prototype, "events", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DataHasBeenLoaded.prototype, "matches", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DataHasBeenLoaded.prototype, "awards", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], DataHasBeenLoaded.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], DataHasBeenLoaded.prototype, "updatedAt", void 0);
exports.DataHasBeenLoaded = DataHasBeenLoaded = DataHasBeenLoaded_1 = __decorate([
    (0, typeorm_1.Entity)()
], DataHasBeenLoaded);
//# sourceMappingURL=DataHasBeenLoaded.js.map