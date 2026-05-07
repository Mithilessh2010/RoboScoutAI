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
exports.getFromFtcApi = exports.throttledMakeRequest = void 0;
const common_1 = require("@ftc-scout/common");
const constants_1 = require("../constants");
const FtcApiReq_1 = require("../db/entities/FtcApiReq");
function makeRequest(url) {
    return __awaiter(this, void 0, void 0, function* () {
        console.info(`Making a request to ${url}`);
        if (!constants_1.FTC_API_KEY) {
            console.error("FTC API credentials are missing. Set FTC_API_KEY or FTC_EVENTS_USERNAME/FTC_EVENTS_AUTH_KEY in packages/server/.env.");
            return null;
        }
        const headers = {
            Authorization: `Basic ${constants_1.FTC_API_KEY}`,
        };
        let response = yield fetch(url, { headers });
        try {
            let text = (yield response.text()).trim();
            let json = JSON.parse(text);
            return json;
        }
        catch (e) {
            console.error(`Failure while making a request to ${url}. Received error ${e}.`);
            return null;
        }
    });
}
exports.throttledMakeRequest = (0, common_1.throttled)(makeRequest, constants_1.FTC_API_THROTTLE_MS);
function getFromFtcApi(path, params = {}) {
    return __awaiter(this, void 0, void 0, function* () {
        let paramsString = Object.entries(params)
            .map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(String(x[1]))}`)
            .join("&");
        let url = `${constants_1.FTC_API_BASE_URL}/${path}?${paramsString}`;
        if (constants_1.CACHE_REQ) {
            let req = yield FtcApiReq_1.FtcApiReq.findOneBy({ url });
            if (req) {
                console.info(`Using cached resp for ${url}`);
                return req.resp;
            }
        }
        let resp = yield (0, exports.throttledMakeRequest)(url);
        if (constants_1.CACHE_REQ && !!resp) {
            yield FtcApiReq_1.FtcApiReq.createQueryBuilder()
                .insert()
                .values({ url, resp })
                .orIgnore()
                .execute();
        }
        return resp;
    });
}
exports.getFromFtcApi = getFromFtcApi;
//# sourceMappingURL=get-from-ftc-api.js.map