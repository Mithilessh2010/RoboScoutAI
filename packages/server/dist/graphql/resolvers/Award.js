"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamAwareAwardLoader = exports.AwardGQL = void 0;
const graphql_1 = require("graphql");
const utils_1 = require("../utils");
const enums_1 = require("./enums");
const Team_1 = require("./Team");
const Award_1 = require("../../db/schemas/Award");
const Event_1 = require("./Event");
const Event_2 = require("../../db/schemas/Event");
const common_1 = require("@ftc-scout/common");
const graphql_fields_1 = __importDefault(require("graphql-fields"));
exports.AwardGQL = new graphql_1.GraphQLObjectType({
    name: "Award",
    fields: () => ({
        season: common_1.IntTy,
        eventCode: common_1.StrTy,
        teamNumber: common_1.IntTy,
        divisionName: (0, common_1.nullTy)(common_1.StrTy),
        personName: (0, common_1.nullTy)(common_1.StrTy),
        type: { type: (0, common_1.nn)(enums_1.AwardTypeGQL) },
        placement: common_1.IntTy,
        createdAt: common_1.DateTimeTy,
        updatedAt: common_1.DateTimeTy,
        team: { type: (0, common_1.nn)(Team_1.TeamGQL) },
        event: {
            type: (0, common_1.nn)(Event_1.EventGQL),
            resolve: (0, utils_1.dataLoaderResolverSingle)((a) => ({ season: a.season, code: a.eventCode }), (keys) => Event_2.Event.find(keys)),
        },
    }),
});
function teamAwareAwardLoader(keys, info) {
    return __awaiter(this, void 0, void 0, function* () {
        let includeTeam = info.some((i) => "team" in (0, graphql_fields_1.default)(i));
        let awards = [];
        for (let key of keys) {
            let award = yield Award_1.Award.findOne(key);
            if (award)
                awards.push(award);
        }
        if (includeTeam) {
            const { Team } = yield Promise.resolve().then(() => __importStar(require("../../db/schemas/Team")));
            for (let award of awards) {
                const team = yield Team.findOne({ number: award.teamNumber });
                award.team = team;
            }
        }
        return awards;
    });
}
exports.teamAwareAwardLoader = teamAwareAwardLoader;
//# sourceMappingURL=Award.js.map