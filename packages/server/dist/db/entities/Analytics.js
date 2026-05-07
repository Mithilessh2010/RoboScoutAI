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
const typeorm_1 = require("typeorm");
let Analytics = exports.Analytics = class Analytics extends typeorm_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Analytics.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Analytics.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Object)
], Analytics.prototype, "fromUrl", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Boolean)
], Analytics.prototype, "pathChanged", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Analytics.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Analytics.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Analytics.prototype, "browser", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], Analytics.prototype, "deviceType", void 0);
__decorate([
    (0, typeorm_1.Column)("timestamptz"),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], Analytics.prototype, "date", void 0);
exports.Analytics = Analytics = __decorate([
    (0, typeorm_1.Entity)()
], Analytics);
//# sourceMappingURL=Analytics.js.map