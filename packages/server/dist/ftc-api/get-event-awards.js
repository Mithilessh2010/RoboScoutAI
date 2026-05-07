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
exports.getEventAwards = void 0;
const get_from_ftc_api_1 = require("./get-from-ftc-api");
function getEventAwards(season, eventCode) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let resp = yield (0, get_from_ftc_api_1.getFromFtcApi)(`${season}/awards/${eventCode}`);
        return (_a = resp === null || resp === void 0 ? void 0 : resp["awards"]) !== null && _a !== void 0 ? _a : [];
    });
}
exports.getEventAwards = getEventAwards;
//# sourceMappingURL=get-event-awards.js.map