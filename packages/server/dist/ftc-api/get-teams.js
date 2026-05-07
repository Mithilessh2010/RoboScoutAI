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
exports.getTeams = void 0;
const get_from_ftc_api_1 = require("./get-from-ftc-api");
function getTeams(season, eventCode = null) {
    return __awaiter(this, void 0, void 0, function* () {
        let teams = [];
        let currentPage = 1;
        while (currentPage != null) {
            let [pageTeams, nextPage] = yield oneTeamPage(season, eventCode, currentPage);
            teams = teams.concat(pageTeams);
            currentPage = nextPage;
        }
        return teams;
    });
}
exports.getTeams = getTeams;
function oneTeamPage(season, eventCode, page) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let args = eventCode ? { eventCode, page } : { page };
        let resp = yield (0, get_from_ftc_api_1.getFromFtcApi)(`${season}/teams`, args);
        let teams = (_a = resp === null || resp === void 0 ? void 0 : resp["teams"]) !== null && _a !== void 0 ? _a : [];
        let maxPage = (_b = resp === null || resp === void 0 ? void 0 : resp["pageTotal"]) !== null && _b !== void 0 ? _b : 0;
        let nextPage = page >= maxPage ? null : page + 1;
        return [teams, nextPage];
    });
}
//# sourceMappingURL=get-teams.js.map