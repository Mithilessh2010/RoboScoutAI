"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMS = exports.MatchScore = exports.MatchScoreSchemas = void 0;
const common_1 = require("@ftc-scout/common");
function makeMatchScore(descriptor) {
    return new EntitySchema({
        tableName: `match_score_${descriptor.season}`,
        name: `match_score_${descriptor.season}`,
        columns: getMatchScoreColumns(descriptor),
    });
}
function getMatchScoreColumns(descriptor) {
    let baseColumns = {
        season: {
            type: "smallint",
            primary: true,
        },
        eventCode: {
            type: "varchar",
            primary: true,
        },
        matchId: {
            type: "int",
            primary: true,
        },
        alliance: {
            type: "enum",
            enum: common_1.Alliance,
            enumName: "alliance_enum",
            primary: true,
        },
        createdAt: {
            type: "timestamptz",
            createDate: true,
        },
        updatedAt: {
            type: "timestamptz",
            updateDate: true,
        },
    };
    let extraColumns = {};
    descriptor.msColumns().forEach((c) => {
        extraColumns[c.dbColName] = Object.assign(Object.assign({}, c.dataTy.typeorm), { nullable: c.tradOnly });
    });
    return Object.assign(Object.assign({}, baseColumns), extraColumns);
}
exports.MatchScoreSchemas = {};
for (let d of common_1.DESCRIPTORS_LIST) {
    exports.MatchScoreSchemas[d.season] = makeMatchScore(d);
}
exports.MatchScore = {};
function initMS() {
    for (let d of common_1.DESCRIPTORS_LIST) {
        exports.MatchScore[d.season] = DATA_SOURCE.getRepository(exports.MatchScoreSchemas[d.season]);
    }
    exports.MatchScore.fromApi = (api, match, remote) => {
        let scores = "scores" in api ? [api.scores] : api.alliances;
        return scores.map((s, i) => {
            let other = scores.length == 2 ? scores[1 - i] : null;
            let dbScore = {
                season: match.eventSeason,
                eventCode: match.eventCode,
                matchId: match.id,
                alliance: "alliance" in s ? s.alliance : common_1.Alliance.Solo,
            };
            let apiScore = {
                season: match.eventSeason,
                eventCode: match.eventCode,
                matchId: match.id,
                alliance: "alliance" in s ? s.alliance : common_1.Alliance.Solo,
            };
            let descriptor = common_1.DESCRIPTORS[match.eventSeason];
            for (let column of descriptor.msColumns()) {
                column.addSelfFromApi(s, other, dbScore, apiScore, remote);
            }
            return exports.MatchScore[match.eventSeason].create(dbScore);
        });
    };
}
exports.initMS = initMS;
//# sourceMappingURL=match-score.js.map