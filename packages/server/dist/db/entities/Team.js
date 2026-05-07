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
var Team_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = void 0;
const typeorm_1 = require("typeorm");
const TeamMatchParticipation_1 = require("./TeamMatchParticipation");
let Team = exports.Team = Team_1 = class Team extends typeorm_1.BaseEntity {
    static fromApi(api) {
        var _a, _b, _c, _d, _e;
        if (api.nameShort == null || api.rookieYear == null) {
            console.warn(`Rejecting api team ${api.teamNumber}.`);
            return null;
        }
        function fixLocations(event_name) {
            const replacements = [["Chinese Taipei", "Taiwan"]];
            for (const [old_str, new_str] of replacements) {
                if (event_name.includes(old_str)) {
                    return event_name.replace(old_str, new_str);
                }
            }
            return event_name;
        }
        let name = api.nameShort.trim();
        let schoolName;
        let sponsors;
        if (api.nameFull == null) {
            schoolName = "Unknown";
            sponsors = [];
        }
        else if (api.nameFull.includes("&")) {
            let index = api.nameFull.lastIndexOf("&");
            let teamNamePart = api.nameFull.slice(index + 1);
            let sponsorsPart = api.nameFull.slice(0, index);
            schoolName = teamNamePart.trim();
            sponsors = sponsorsPart
                .split("/")
                .map((s) => s.trim())
                .filter((s) => !!s);
        }
        else {
            schoolName = (_b = (_a = api.nameFull) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : null;
            sponsors = [];
        }
        return Team_1.create({
            number: api.teamNumber,
            name,
            schoolName,
            sponsors,
            country: fixLocations((_c = api.country) !== null && _c !== void 0 ? _c : ""),
            state: fixLocations((_d = api.stateProv) !== null && _d !== void 0 ? _d : ""),
            city: fixLocations((_e = api.city) !== null && _e !== void 0 ? _e : ""),
            rookieYear: api.rookieYear,
            website: api.website,
        });
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)("int"),
    __metadata("design:type", Number)
], Team.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => TeamMatchParticipation_1.TeamMatchParticipation, (tmp) => tmp.team),
    __metadata("design:type", Array)
], Team.prototype, "matches", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Team.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Team.prototype, "schoolName", void 0);
__decorate([
    (0, typeorm_1.Column)("json"),
    __metadata("design:type", Array)
], Team.prototype, "sponsors", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Team.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Team.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Team.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Team.prototype, "rookieYear", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Team.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Team.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Team.prototype, "updatedAt", void 0);
exports.Team = Team = Team_1 = __decorate([
    (0, typeorm_1.Entity)()
], Team);
//# sourceMappingURL=Team.js.map