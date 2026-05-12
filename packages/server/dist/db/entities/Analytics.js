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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analytics = void 0;
let Analytics = exports.Analytics = class Analytics extends BaseEntity {
};
__decorate([
    PrimaryGeneratedColumn(),
    __metadata("design:type", Number)
], Analytics.prototype, "id", void 0);
__decorate([
    Column(),
    Index(),
    __metadata("design:type", String)
], Analytics.prototype, "url", void 0);
__decorate([
    Column("varchar", { nullable: true }),
    Index(),
    __metadata("design:type", Object)
], Analytics.prototype, "fromUrl", void 0);
__decorate([
    Column(),
    Index(),
    __metadata("design:type", Boolean)
], Analytics.prototype, "pathChanged", void 0);
__decorate([
    Column(),
    Index(),
    __metadata("design:type", String)
], Analytics.prototype, "sessionId", void 0);
__decorate([
    Column(),
    Index(),
    __metadata("design:type", String)
], Analytics.prototype, "userId", void 0);
__decorate([
    Column(),
    Index(),
    __metadata("design:type", String)
], Analytics.prototype, "browser", void 0);
__decorate([
    Column(),
    Index(),
    __metadata("design:type", String)
], Analytics.prototype, "deviceType", void 0);
__decorate([
    Column("timestamptz"),
    Index(),
    __metadata("design:type", Date)
], Analytics.prototype, "date", void 0);
exports.Analytics = Analytics = __decorate([
    Entity()
], Analytics);
//# sourceMappingURL=Analytics.js.map