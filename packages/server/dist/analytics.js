"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAnalytics = void 0;
const Analytics_1 = require("./db/entities/Analytics");
const ua_parser_js_1 = __importDefault(require("ua-parser-js"));
const md5_1 = __importDefault(require("md5"));
function handleAnalytics(req, res) {
    var _a, _b;
    res.end();
    try {
        let parsed = JSON.parse(req.body);
        let url = parsed.url;
        let fromUrl = parsed.from;
        let sessionId = parsed.sessionId;
        let pathChanged = !!parsed.pathChanged;
        let time = +parsed.time;
        if (!url ||
            !time ||
            !sessionId ||
            typeof url != "string" ||
            (fromUrl != null && typeof fromUrl != "string") ||
            typeof sessionId != "string" ||
            Number.isNaN(time)) {
            return;
        }
        let uaString = req.get("User-Agent");
        if (!uaString)
            return;
        let uaData = new ua_parser_js_1.default(uaString).getResult();
        let browser = uaData.browser.name;
        let deviceType = (_a = uaData.device.type) !== null && _a !== void 0 ? _a : "desktop";
        if (!browser || !deviceType)
            return;
        let ip = (_b = req.get("x-forwarded-for")) !== null && _b !== void 0 ? _b : req.socket.remoteAddress;
        let userId = (0, md5_1.default)("ftcscout" + uaString + ip);
        Analytics_1.Analytics.create({
            url,
            fromUrl,
            pathChanged,
            sessionId,
            userId,
            browser,
            deviceType,
            date: new Date(time),
        }).save();
    }
    catch (e) { }
}
exports.handleAnalytics = handleAnalytics;
//# sourceMappingURL=analytics.js.map