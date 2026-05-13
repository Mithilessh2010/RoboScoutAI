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
exports.WatchRoom = void 0;
let WatchRoom = exports.WatchRoom = class WatchRoom extends BaseEntity {
};
__decorate([
    PrimaryColumn(),
    __metadata("design:type", String)
], WatchRoom.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], WatchRoom.prototype, "name", void 0);
__decorate([
    Column({ type: "smallint", nullable: true }),
    __metadata("design:type", Object)
], WatchRoom.prototype, "season", void 0);
__decorate([
    Column({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], WatchRoom.prototype, "eventCode", void 0);
__decorate([
    Column({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], WatchRoom.prototype, "hostParticipantId", void 0);
__decorate([
    Column({ type: "varchar", default: "HOST_ONLY" }),
    __metadata("design:type", String)
], WatchRoom.prototype, "controlMode", void 0);
__decorate([
    Column({ type: "varchar" }),
    __metadata("design:type", String)
], WatchRoom.prototype, "layoutPreference", void 0);
__decorate([
    Column({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], WatchRoom.prototype, "focusStreamId", void 0);
__decorate([
    Column("json"),
    __metadata("design:type", Array)
], WatchRoom.prototype, "streams", void 0);
__decorate([
    Column("json"),
    __metadata("design:type", Object)
], WatchRoom.prototype, "playbackState", void 0);
__decorate([
    Column("json"),
    __metadata("design:type", Array)
], WatchRoom.prototype, "participants", void 0);
__decorate([
    CreateDateColumn({ type: "timestamptz" }),
    __metadata("design:type", Date)
], WatchRoom.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: "timestamptz" }),
    __metadata("design:type", Date)
], WatchRoom.prototype, "updatedAt", void 0);
exports.WatchRoom = WatchRoom = __decorate([
    Entity()
], WatchRoom);
//# sourceMappingURL=WatchRoom.js.map