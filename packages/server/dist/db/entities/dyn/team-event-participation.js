"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTep = exports.TeamEventParticipation = exports.TeamEventParticipationSchemas = void 0;
const common_1 = require("@ftc-scout/common");
const typeorm_1 = require("typeorm");
const data_source_1 = require("../../data-source");
const typeorm_naming_strategies_1 = require("typeorm-naming-strategies");
const ns = new typeorm_naming_strategies_1.SnakeNamingStrategy();
function makeTep(descriptor) {
    let agg = getAggregateStatColumns(descriptor);
    return new typeorm_1.EntitySchema({
        tableName: `tep_${descriptor.season}`,
        name: `tep_${descriptor.season}`,
        columns: {
            season: {
                type: "smallint",
                primary: true,
            },
            eventCode: {
                type: "varchar",
                primary: true,
            },
            teamNumber: {
                type: "int",
                primary: true,
            },
            isRemote: { type: "bool" },
            rank: { type: "int" },
            rp: { type: "float" },
            tb1: { type: "float" },
            tb2: { type: "float" },
            wins: { type: "int" },
            losses: { type: "int" },
            ties: { type: "int" },
            dqs: { type: "int" },
            qualMatchesPlayed: { type: "int" },
            hasStats: { type: "bool" },
            createdAt: {
                type: "timestamptz",
                createDate: true,
            },
            updatedAt: {
                type: "timestamptz",
                updateDate: true,
            },
        },
        embeddeds: {
            tot: { schema: agg },
            avg: { schema: agg },
            min: { schema: agg },
            max: { schema: agg },
            dev: { schema: agg },
            opr: { schema: agg },
        },
        checks: [
            { expression: "rp <> 'NaN'" },
            { expression: "tb1 <> 'NaN'" },
            { expression: "tb2 <> 'NaN'" },
            ...descriptor.tepColumns().flatMap((c) => {
                return [
                    { expression: `${ns.columnName(c.dbName, undefined, ["tot"])} <> 'NaN'` },
                    { expression: `${ns.columnName(c.dbName, undefined, ["avg"])} <> 'NaN'` },
                    { expression: `${ns.columnName(c.dbName, undefined, ["min"])} <> 'NaN'` },
                    { expression: `${ns.columnName(c.dbName, undefined, ["max"])} <> 'NaN'` },
                    { expression: `${ns.columnName(c.dbName, undefined, ["dev"])} <> 'NaN'` },
                    { expression: `${ns.columnName(c.dbName, undefined, ["opr"])} <> 'NaN'` },
                ];
            }),
        ],
    });
}
function getAggregateStatColumns(descriptor) {
    let columns = {};
    descriptor.tepColumns().forEach((c) => {
        columns[c.dbName] = { type: "float", nullable: true };
    });
    return new typeorm_1.EntitySchema({
        name: `test${descriptor.season}`,
        columns,
    });
}
exports.TeamEventParticipationSchemas = {};
for (let d of common_1.DESCRIPTORS_LIST) {
    exports.TeamEventParticipationSchemas[d.season] = makeTep(d);
}
exports.TeamEventParticipation = {};
function initTep() {
    for (let d of common_1.DESCRIPTORS_LIST) {
        exports.TeamEventParticipation[d.season] = data_source_1.DATA_SOURCE.getRepository(exports.TeamEventParticipationSchemas[d.season]);
    }
}
exports.initTep = initTep;
//# sourceMappingURL=team-event-participation.js.map