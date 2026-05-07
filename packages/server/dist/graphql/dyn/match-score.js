"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.frontendMSFromDB = exports.makeMatchScoreTys = void 0;
const common_1 = require("@ftc-scout/common");
const graphql_1 = require("graphql");
const enums_1 = require("../resolvers/enums");
function makeMatchScoreTys(descriptor) {
    return [makeMSTysTrad(descriptor), makeMSTysRemote(descriptor)].filter(common_1.notEmpty);
}
exports.makeMatchScoreTys = makeMatchScoreTys;
function frontendMSFromDB(ms) {
    function fields(s, remote) {
        let ret = {};
        let descriptor = common_1.DESCRIPTORS[s.season];
        for (let c of descriptor.msColumns()) {
            if (c.outer || (remote && c.tradOnly))
                continue;
            ret[c.getApiName(remote)] = s[c.dbColName];
        }
        return ret;
    }
    if (ms.length == 1) {
        let s = ms[0];
        if (s.alliance != common_1.Alliance.Solo)
            return null;
        return Object.assign({ __typename: `MatchScores${s.season}Remote`, season: s.season, eventCode: s.eventCode, matchId: s.matchId, alliance: common_1.Alliance.Solo }, fields(s, true));
    }
    else if (ms.length == 2) {
        let red = ms.find((s) => s.alliance == common_1.Alliance.Red);
        let blue = ms.find((s) => s.alliance == common_1.Alliance.Blue);
        if (red == undefined || blue == undefined)
            return null;
        let ret = {
            __typename: common_1.DESCRIPTORS[red.season].hasRemote
                ? `MatchScores${red.season}Trad`
                : `MatchScores${red.season}`,
            season: red.season,
            eventCode: red.eventCode,
            matchId: red.matchId,
            red: Object.assign({ season: red.season, eventCode: red.eventCode, matchId: red.matchId, alliance: common_1.Alliance.Red }, fields(red, false)),
            blue: Object.assign({ season: red.season, eventCode: red.eventCode, matchId: red.matchId, alliance: common_1.Alliance.Blue }, fields(blue, false)),
        };
        let descriptor = common_1.DESCRIPTORS[red.season];
        for (let c of descriptor.msColumns()) {
            if (!c.outer)
                continue;
            ret[c.getApiName(false)] =
                "apiMap" in c && c.apiMap ? c.apiMap(red, blue) : red[c.dbColName];
        }
        return ret;
    }
    return null;
}
exports.frontendMSFromDB = frontendMSFromDB;
function makeMSTysTrad(descriptor) {
    let innerFields = {
        season: common_1.IntTy,
        eventCode: common_1.StrTy,
        matchId: common_1.IntTy,
        alliance: { type: (0, common_1.nn)(enums_1.AllianceGQL) },
    };
    let outerFields = {
        season: common_1.IntTy,
        eventCode: common_1.StrTy,
        matchId: common_1.IntTy,
    };
    for (let c of descriptor.msColumns()) {
        let type = new graphql_1.GraphQLNonNull(c.dataTy.gql);
        if (c.outer) {
            outerFields[c.getApiName(false)] = { type };
        }
        else {
            innerFields[c.getApiName(false)] = { type };
        }
    }
    let allianceTy = new graphql_1.GraphQLObjectType({
        name: `MatchScores${descriptor.season}Alliance`,
        fields: innerFields,
    });
    let outerTy = new graphql_1.GraphQLObjectType({
        name: descriptor.hasRemote
            ? `MatchScores${descriptor.season}Trad`
            : `MatchScores${descriptor.season}`,
        fields: Object.assign(Object.assign({}, outerFields), { red: { type: (0, common_1.nn)(allianceTy) }, blue: { type: (0, common_1.nn)(allianceTy) } }),
    });
    return outerTy;
}
function makeMSTysRemote(descriptor) {
    if (!descriptor.hasRemote)
        return null;
    let fields = {
        season: common_1.IntTy,
        eventCode: common_1.StrTy,
        matchId: common_1.IntTy,
        alliance: { type: (0, common_1.nn)(enums_1.AllianceGQL) },
    };
    for (let c of descriptor.msColumns()) {
        if (c.tradOnly)
            continue;
        let type = c.dataTy.gql;
        fields[c.getApiName(true)] = { type: new graphql_1.GraphQLNonNull(type) };
    }
    let outerTy = new graphql_1.GraphQLObjectType({
        name: `MatchScores${descriptor.season}Remote`,
        fields,
    });
    return outerTy;
}
//# sourceMappingURL=match-score.js.map