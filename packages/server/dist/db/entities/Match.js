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
var Match_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Match = void 0;
const common_1 = require("@ftc-scout/common");
const typeorm_1 = require("typeorm");
const Event_1 = require("./Event");
const luxon_1 = require("luxon");
const match_score_1 = require("../../graphql/dyn/match-score");
let Match = exports.Match = Match_1 = class Match extends typeorm_1.BaseEntity {
    get matchNum() {
        return this.id % 1000;
    }
    get description() {
        switch (this.tournamentLevel) {
            case common_1.TournamentLevel.Quals:
                return `Q-${this.matchNum}`;
            case common_1.TournamentLevel.Semis:
                return `SF${this.series}-${this.matchNum}`;
            case common_1.TournamentLevel.Finals:
                return `F-${this.matchNum}`;
            case common_1.TournamentLevel.DoubleElim:
                return this.matchNum > 1 ? `M-${this.series}.${this.matchNum}` : `M-${this.series}`;
        }
    }
    static fromApi(api, event, hasBeenPlayed, allMatches) {
        let timezone = event.timezone;
        let tournamentLevel = (0, common_1.tournamentLevelFromFtcApi)(api.tournamentLevel);
        let [tournamentLevel_, series, matchNum] = computeMatchOrder(tournamentLevel, api, event, allMatches);
        tournamentLevel = tournamentLevel_;
        return Match_1.create({
            eventSeason: event.season,
            eventCode: event.code,
            id: event.remote
                ? api.teams[0].teamNumber * 1000 + matchNum
                : (0, common_1.tournamentLevelValue)(tournamentLevel) * 10000 + series * 1000 + matchNum,
            hasBeenPlayed,
            scheduledStartTime: luxon_1.DateTime.fromISO(api.startTime, { zone: timezone }).year > 2000
                ? luxon_1.DateTime.fromISO(api.startTime, { zone: timezone }).toJSDate()
                : null,
            actualStartTime: api.actualStartTime
                ? luxon_1.DateTime.fromISO(api.actualStartTime, { zone: timezone }).toJSDate()
                : null,
            postResultTime: api.postResultTime
                ? luxon_1.DateTime.fromISO(api.postResultTime, { zone: timezone }).toJSDate()
                : null,
            tournamentLevel,
            series,
        });
    }
    toFrontend() {
        return Object.assign(Object.assign({}, this), { scores: (0, match_score_1.frontendMSFromDB)(this.scores) });
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)("smallint"),
    __metadata("design:type", Number)
], Match.prototype, "eventSeason", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Match.prototype, "eventCode", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)("int"),
    __metadata("design:type", Number)
], Match.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Event_1.Event, (event) => event.matches),
    __metadata("design:type", Event_1.Event)
], Match.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], Match.prototype, "hasBeenPlayed", void 0);
__decorate([
    (0, typeorm_1.Column)("timestamptz", { nullable: true }),
    __metadata("design:type", Object)
], Match.prototype, "scheduledStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)("timestamptz", { nullable: true }),
    __metadata("design:type", Object)
], Match.prototype, "actualStartTime", void 0);
__decorate([
    (0, typeorm_1.Column)("timestamptz", { nullable: true }),
    __metadata("design:type", Object)
], Match.prototype, "postResultTime", void 0);
__decorate([
    (0, typeorm_1.Column)("enum", { enum: common_1.TournamentLevel, enumName: "tournament_level_enum" }),
    __metadata("design:type", String)
], Match.prototype, "tournamentLevel", void 0);
__decorate([
    (0, typeorm_1.Column)("smallint"),
    __metadata("design:type", Number)
], Match.prototype, "series", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Match.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Match.prototype, "updatedAt", void 0);
exports.Match = Match = Match_1 = __decorate([
    (0, typeorm_1.Entity)()
], Match);
function computeMatchOrder(level, api, event, allMatches) {
    if (event.remote) {
        return [level, 0, api.matchNumber];
    }
    if (level != common_1.TournamentLevel.DoubleElim) {
        return [level, api.series, api.matchNumber];
    }
    let uniquePlayoffTeams = allMatches
        .filter((m) => m.tournamentLevel == "PLAYOFF")
        .flatMap((m) => m.teams.map((t) => t.teamNumber));
    uniquePlayoffTeams = [...new Set(uniquePlayoffTeams)];
    if (uniquePlayoffTeams.length <= 4) {
        level = common_1.TournamentLevel.Finals;
        return [level, 0, api.matchNumber];
    }
    return [level, api.series, api.matchNumber];
}
//# sourceMappingURL=Match.js.map