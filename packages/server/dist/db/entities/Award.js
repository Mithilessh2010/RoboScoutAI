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
var Award_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.awardCodeFromFtcApi = exports.Award = exports.AwardType = void 0;
const common_1 = require("@ftc-scout/common");
const typeorm_1 = require("typeorm");
exports.AwardType = {
    DeansListFinalist: "DeansListFinalist",
    DeansListSemiFinalist: "DeansListSemiFinalist",
    DeansListWinner: "DeansListWinner",
    JudgesChoice: "JudgesChoice",
    DivisionFinalist: "DivisionFinalist",
    DivisionWinner: "DivisionWinner",
    ConferenceFinalist: "ConferenceFinalist",
    Compass: "Compass",
    Promote: "Promote",
    Control: "Control",
    Motivate: "Motivate",
    Reach: "Reach",
    Sustain: "Sustain",
    Design: "Design",
    Innovate: "Innovate",
    Connect: "Connect",
    Think: "Think",
    TopRanked: "TopRanked",
    Inspire: "Inspire",
    Winner: "Winner",
    Finalist: "Finalist",
};
let Award = exports.Award = Award_1 = class Award extends typeorm_1.BaseEntity {
    static fromApi(season, api) {
        var _a, _b;
        if (api.eventCode == null || api.teamNumber == null) {
            return null;
        }
        let divisionName = api.name.includes("Division")
            ? api.name.split("Division")[0].trim()
            : api.name.includes("Conference")
                ? api.name.split("Conference")[0].trim()
                : null;
        let awardCode = awardCodeFromFtcApi(api);
        if (awardCode != null) {
            return Award_1.create({
                season,
                eventCode: api.eventCode,
                teamNumber: api.teamNumber,
                type: awardCode[0],
                placement: awardCode[1],
                divisionName,
                personName: (_b = (_a = api.person) === null || _a === void 0 ? void 0 : _a.trim()) !== null && _b !== void 0 ? _b : null,
            });
        }
        else {
            return null;
        }
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)("smallint"),
    __metadata("design:type", Number)
], Award.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Award.prototype, "eventCode", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)("int"),
    __metadata("design:type", Number)
], Award.prototype, "teamNumber", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)("enum", { enum: exports.AwardType, enumName: "award_type_enum" }),
    __metadata("design:type", String)
], Award.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)("smallint"),
    __metadata("design:type", Number)
], Award.prototype, "placement", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { nullable: true }),
    __metadata("design:type", Object)
], Award.prototype, "divisionName", void 0);
__decorate([
    (0, typeorm_1.Column)("varchar", { nullable: true }),
    __metadata("design:type", Object)
], Award.prototype, "personName", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Award.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Award.prototype, "updatedAt", void 0);
exports.Award = Award = Award_1 = __decorate([
    (0, typeorm_1.Entity)()
], Award);
function awardCodeFromFtcApi(award) {
    switch (award.awardId) {
        case 1:
            return [exports.AwardType.JudgesChoice, awardTop(award, 7)];
        case 2:
            return [exports.AwardType.Compass, awardTop(award, 3)];
        case 3:
            return [exports.AwardType.Promote, awardTop(award, 3)];
        case 4:
            return [exports.AwardType.Control, awardTop(award, 3)];
        case 5:
            return [exports.AwardType.Motivate, awardTop(award, 3)];
        case 6:
            return [exports.AwardType.Design, awardTop(award, 3)];
        case 7:
            return [exports.AwardType.Innovate, awardTop(award, 3)];
        case 8:
            return [exports.AwardType.Connect, awardTop(award, 3)];
        case 9:
            return [exports.AwardType.Think, awardTop(award, 3)];
        case 10:
            if (award.name.includes(" Finalists")) {
                return [exports.AwardType.DeansListFinalist, awardTop(award, 100)];
            }
            else if (award.name.includes(" Semi-Finalists")) {
                return [exports.AwardType.DeansListSemiFinalist, awardTop(award, 100)];
            }
            else if (award.name.includes(" Winner")) {
                return [exports.AwardType.DeansListWinner, awardTop(award, 100)];
            }
            else {
                throw `Can't handle Dean's List named '${award.name}'`;
            }
        case 11:
            return [exports.AwardType.Inspire, awardTop(award, 3)];
        case 13:
            return [exports.AwardType.Winner, awardTop(award, 3)];
        case 12:
            return [exports.AwardType.Finalist, awardTop(award, 3)];
        case 14:
            return [exports.AwardType.TopRanked, awardTop(award, 6)];
        case 15:
            return [exports.AwardType.Finalist, awardTop(award, 999)];
        case 17:
            return [exports.AwardType.Winner, awardTop(award, 1)];
        case 18:
        case 19:
            return null;
        case 22:
            return [exports.AwardType.DivisionFinalist, awardTop(award, 3)];
        case 23:
            return [exports.AwardType.DivisionWinner, awardTop(award, 3)];
        case 24:
            return [exports.AwardType.ConferenceFinalist, awardTop(award, 3)];
        case 25:
            return [exports.AwardType.Reach, awardTop(award, 3)];
        case 26:
            return [exports.AwardType.Sustain, awardTop(award, 3)];
        case 102:
            return [exports.AwardType.Compass, awardTop(award, 5, true)];
        case 103:
            return [exports.AwardType.Promote, awardTop(award, 5, true)];
        case 104:
            return [exports.AwardType.Control, awardTop(award, 5, true)];
        case 105:
            return [exports.AwardType.Motivate, awardTop(award, 5, true)];
        case 106:
            return [exports.AwardType.Design, awardTop(award, 5, true)];
        case 107:
            return [exports.AwardType.Innovate, awardTop(award, 5, true)];
        case 108:
            return [exports.AwardType.Connect, awardTop(award, 5, true)];
        case 109:
            return [exports.AwardType.Think, awardTop(award, 5, true)];
        case 111:
            return [exports.AwardType.Inspire, awardTop(award, 4, true)];
        case 125:
            return [exports.AwardType.Reach, awardTop(award, 5, true)];
        case 126:
            return [exports.AwardType.Sustain, awardTop(award, 5, true)];
        default:
            throw "Can't handle award: " + JSON.stringify(award);
    }
}
exports.awardCodeFromFtcApi = awardCodeFromFtcApi;
function awardTop(award, top, shift = false) {
    if (award.series <= top) {
        return award.series + (shift ? 1 : 0);
    }
    else {
        throw "Can't handle award: " + JSON.stringify(award);
    }
}
//# sourceMappingURL=Award.js.map