"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTypename = exports.makeTepTypes = void 0;
const common_1 = require("@ftc-scout/common");
const graphql_1 = require("graphql");
function makeTepTypes(descriptor) {
    let l = [make(descriptor, false), descriptor.hasRemote ? make(descriptor, true) : null];
    return l.filter(common_1.notEmpty);
}
exports.makeTepTypes = makeTepTypes;
function addTypename(tep) {
    let suffix = common_1.DESCRIPTORS[tep.season].typeSuffix(tep.isRemote);
    let __typename = `TeamEventStats${tep.season}${suffix}`;
    return Object.assign(Object.assign({}, tep), { __typename });
}
exports.addTypename = addTypename;
function make(descriptor, remote) {
    let nameSuffix = descriptor.typeSuffix(remote);
    let innerFields = {};
    for (let c of descriptor.tepColumns()) {
        if (c.tradOnly && remote)
            continue;
        innerFields[c.apiName] = common_1.FloatTy;
    }
    let inner = new graphql_1.GraphQLObjectType({
        name: `TeamEventStats${descriptor.season}${nameSuffix}Group`,
        fields: innerFields,
    });
    let hasTb2 = descriptor.rankings.tb != "LosingScore";
    let outer = new graphql_1.GraphQLObjectType({
        name: `TeamEventStats${descriptor.season}${nameSuffix}`,
        fields: Object.assign(Object.assign(Object.assign({ rank: common_1.IntTy, rp: common_1.FloatTy, tb1: common_1.FloatTy }, (hasTb2 ? { tb2: common_1.FloatTy } : {})), (!remote ? { wins: common_1.IntTy, losses: common_1.IntTy, ties: common_1.IntTy, dqs: common_1.IntTy } : {})), { qualMatchesPlayed: common_1.IntTy, tot: { type: (0, common_1.nn)(inner) }, avg: { type: (0, common_1.nn)(inner) }, min: { type: (0, common_1.nn)(inner) }, max: { type: (0, common_1.nn)(inner) }, dev: { type: (0, common_1.nn)(inner) }, opr: { type: (0, common_1.nn)(inner) } }),
    });
    return outer;
}
//# sourceMappingURL=tep.js.map