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
exports.apiLoggerMiddleware = exports.ApiReq = void 0;
const typeorm_1 = require("typeorm");
const constants_1 = require("../../constants");
let ApiReq = exports.ApiReq = class ApiReq extends typeorm_1.BaseEntity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ApiReq.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)("json"),
    __metadata("design:type", Object)
], ApiReq.prototype, "headers", void 0);
__decorate([
    (0, typeorm_1.Column)("json"),
    __metadata("design:type", Object)
], ApiReq.prototype, "req", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], ApiReq.prototype, "createdAt", void 0);
exports.ApiReq = ApiReq = __decorate([
    (0, typeorm_1.Entity)()
], ApiReq);
function apiLoggerMiddleware(req, _, next) {
    var _a;
    if (!(constants_1.FRONTEND_CODE in req.headers) && ((_a = req.body) === null || _a === void 0 ? void 0 : _a["operationName"]) != "IntrospectionQuery") {
        ApiReq.save({ req: req.body, headers: req.rawHeaders });
    }
    next();
}
exports.apiLoggerMiddleware = apiLoggerMiddleware;
//# sourceMappingURL=ApiReq.js.map