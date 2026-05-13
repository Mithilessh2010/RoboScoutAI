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
exports.WatchRoomMessage = void 0;
let WatchRoomMessage = exports.WatchRoomMessage = class WatchRoomMessage extends BaseEntity {
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], WatchRoomMessage.prototype, "id", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], WatchRoomMessage.prototype, "roomId", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], WatchRoomMessage.prototype, "senderParticipantId", void 0);
__decorate([
    Column(),
    __metadata("design:type", String)
], WatchRoomMessage.prototype, "senderName", void 0);
__decorate([
    Column("text"),
    __metadata("design:type", String)
], WatchRoomMessage.prototype, "message", void 0);
__decorate([
    CreateDateColumn({ type: "timestamptz" }),
    __metadata("design:type", Date)
], WatchRoomMessage.prototype, "createdAt", void 0);
exports.WatchRoomMessage = WatchRoomMessage = __decorate([
    Entity(),
    Index(["roomId", "createdAt"])
], WatchRoomMessage);
//# sourceMappingURL=WatchRoomMessage.js.map