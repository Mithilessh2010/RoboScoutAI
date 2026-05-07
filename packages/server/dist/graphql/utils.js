"use strict";
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
exports.keyListToWhereClause = exports.dataLoaderResolverList = exports.dataLoaderResolverSingle = exports.dataLoaderResolver = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const typeorm_1 = require("typeorm");
function dataLoaderResolver(argsToKey, keysToResults, groupResults) {
    let dl = new dataloader_1.default((kAndI) => __awaiter(this, void 0, void 0, function* () {
        let keys = kAndI.map((k) => k[0]);
        let info = kAndI.map((k) => k[1]);
        let results = yield keysToResults(keys, info);
        let groups = groupResults(keys, results);
        return groups;
    }), { cache: false });
    return (source, args, _ctx, info) => __awaiter(this, void 0, void 0, function* () {
        let key = argsToKey(source, args);
        let res = yield dl.load([key, info]);
        return res;
    });
}
exports.dataLoaderResolver = dataLoaderResolver;
function matchByKeys(k, r) {
    if (k == null || typeof k != "object" || typeof r != "object")
        throw "Can only use matchByKey with objects";
    for (let key of Object.keys(k)) {
        if (k[key] != r[key])
            return false;
    }
    return true;
}
function dataLoaderResolverSingle(argsToKey, keysToResults, keyMatchesResult = matchByKeys) {
    return dataLoaderResolver(argsToKey, keysToResults, (keys, results) => keys.map((k) => { var _a; return (_a = results.find((r) => keyMatchesResult(k, r))) !== null && _a !== void 0 ? _a : null; }));
}
exports.dataLoaderResolverSingle = dataLoaderResolverSingle;
function dataLoaderResolverList(argsToKey, keysToResults, keyMatchesResult = matchByKeys) {
    return dataLoaderResolver(argsToKey, keysToResults, (keys, results) => keys.map((k) => results.filter((r) => keyMatchesResult(k, r))));
}
exports.dataLoaderResolverList = dataLoaderResolverList;
function keyListToWhereClause(tableName, keys) {
    let vIdx = 0;
    return new typeorm_1.Brackets((qb) => {
        for (let key of keys) {
            let thisKey = new typeorm_1.Brackets((subQb) => {
                for (let [k, v] of Object.entries(key)) {
                    subQb.andWhere(`${tableName}.${k} = :v${vIdx}`, { [`v${vIdx}`]: v });
                    vIdx += 1;
                }
            });
            qb.orWhere(thisKey);
        }
    });
}
exports.keyListToWhereClause = keyListToWhereClause;
//# sourceMappingURL=utils.js.map