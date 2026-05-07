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
var TeamMatchParticipation_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamMatchParticipation = void 0;
const common_1 = require("@ftc-scout/common");
const typeorm_1 = require("typeorm");
const Team_1 = require("./Team");
let TeamMatchParticipation = exports.TeamMatchParticipation = TeamMatchParticipation_1 = class TeamMatchParticipation extends typeorm_1.BaseEntity {
    static fromApi(teams, match, remote) {
        const cmp = (a, b) => a.station.localeCompare(b.station);
        function getOnField(teams, color) {
            let onFieldCount = teams.filter((t) => t.onField && t.station.includes(color)).length;
            return teams
                .filter((t) => {
                var _a;
                if (!t.station.includes(color))
                    return false;
                if (match.eventSeason == 2019)
                    return true;
                if (onFieldCount <= 1)
                    return true;
                if (!t.dq && !((_a = t.onField) !== null && _a !== void 0 ? _a : true))
                    return false;
                return true;
            })
                .sort(cmp);
        }
        let redTeams = getOnField(teams, "Red");
        let blueTeams = getOnField(teams, "Blue");
        function getStation(team) {
            var _a, _b, _c, _d;
            if (remote) {
                return common_1.Station.Solo;
            }
            else if (team.teamNumber == ((_a = redTeams === null || redTeams === void 0 ? void 0 : redTeams[0]) === null || _a === void 0 ? void 0 : _a.teamNumber) ||
                team.teamNumber == ((_b = blueTeams === null || blueTeams === void 0 ? void 0 : blueTeams[0]) === null || _b === void 0 ? void 0 : _b.teamNumber)) {
                return common_1.Station.One;
            }
            else if (team.teamNumber == ((_c = redTeams === null || redTeams === void 0 ? void 0 : redTeams[1]) === null || _c === void 0 ? void 0 : _c.teamNumber) ||
                team.teamNumber == ((_d = blueTeams === null || blueTeams === void 0 ? void 0 : blueTeams[1]) === null || _d === void 0 ? void 0 : _d.teamNumber)) {
                return common_1.Station.Two;
            }
            else {
                return common_1.Station.NotOnField;
            }
        }
        return teams
            .map((t) => {
            var _a, _b;
            if (t.teamNumber == null)
                return null;
            return TeamMatchParticipation_1.create({
                season: match.eventSeason,
                eventCode: match.eventCode,
                matchId: match.id,
                alliance: (0, common_1.allianceFromApiStation)(t.station),
                station: getStation(t),
                teamNumber: t.teamNumber,
                allianceRole: (0, common_1.allianceRoleFromApiStation)(t.station),
                surrogate: t.surrogate,
                noShow: t.noShow,
                dq: match.eventSeason == 2019 ? false : (_a = t.dq) !== null && _a !== void 0 ? _a : false,
                onField: match.eventSeason == 2019 ? true : (_b = t.onField) !== null && _b !== void 0 ? _b : true,
            });
        })
            .filter(common_1.notEmpty);
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)("smallint"),
    __metadata("design:type", Number)
], TeamMatchParticipation.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], TeamMatchParticipation.prototype, "eventCode", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)("int"),
    __metadata("design:type", Number)
], TeamMatchParticipation.prototype, "matchId", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)("enum", { enum: common_1.Alliance, enumName: "alliance_enum" }),
    __metadata("design:type", String)
], TeamMatchParticipation.prototype, "alliance", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)("enum", { enum: common_1.Station, enumName: "station_enum" }),
    __metadata("design:type", String)
], TeamMatchParticipation.prototype, "station", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Team_1.Team, (team) => team.matches),
    __metadata("design:type", Team_1.Team)
], TeamMatchParticipation.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.Column)("int"),
    __metadata("design:type", Number)
], TeamMatchParticipation.prototype, "teamNumber", void 0);
__decorate([
    (0, typeorm_1.Column)("enum", { enum: common_1.AllianceRole, enumName: "alliance_role_enum" }),
    __metadata("design:type", String)
], TeamMatchParticipation.prototype, "allianceRole", void 0);
__decorate([
    (0, typeorm_1.Column)("bool"),
    __metadata("design:type", Boolean)
], TeamMatchParticipation.prototype, "surrogate", void 0);
__decorate([
    (0, typeorm_1.Column)("bool"),
    __metadata("design:type", Boolean)
], TeamMatchParticipation.prototype, "noShow", void 0);
__decorate([
    (0, typeorm_1.Column)("bool"),
    __metadata("design:type", Boolean)
], TeamMatchParticipation.prototype, "dq", void 0);
__decorate([
    (0, typeorm_1.Column)("bool"),
    __metadata("design:type", Boolean)
], TeamMatchParticipation.prototype, "onField", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], TeamMatchParticipation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], TeamMatchParticipation.prototype, "updatedAt", void 0);
exports.TeamMatchParticipation = TeamMatchParticipation = TeamMatchParticipation_1 = __decorate([
    (0, typeorm_1.Entity)()
], TeamMatchParticipation);
//# sourceMappingURL=TeamMatchParticipation.js.map