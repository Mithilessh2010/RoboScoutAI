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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatchScores = void 0;
const get_from_ftc_api_1 = require("./get-from-ftc-api");
function getMatchScores(season, eventCode) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let [qual, playoff] = yield Promise.all([
            (0, get_from_ftc_api_1.getFromFtcApi)(`${season}/scores/${eventCode}/qual`),
            (0, get_from_ftc_api_1.getFromFtcApi)(`${season}/scores/${eventCode}/playoff`),
        ]);
        return [...((_a = qual === null || qual === void 0 ? void 0 : qual["matchScores"]) !== null && _a !== void 0 ? _a : []), ...((_b = playoff === null || playoff === void 0 ? void 0 : playoff["matchScores"]) !== null && _b !== void 0 ? _b : [])];
    });
}
exports.getMatchScores = getMatchScores;
//# sourceMappingURL=get-match-scores.js.map