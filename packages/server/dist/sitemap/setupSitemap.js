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
exports.setupSiteMap = void 0;
const Team_1 = require("../db/entities/Team");
const Event_1 = require("../db/entities/Event");
const common_1 = require("@ftc-scout/common");
function setupSiteMap(app) {
    app.get("/sitemap.xml", sitemap);
}
exports.setupSiteMap = setupSiteMap;
function sitemap(_req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n';
        const urlsetHeader = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
        const urlsetFooter = "</urlset>";
        const pre = "https://ftcscout.org";
        let urls = [];
        let xmls = [];
        let teams = yield Team_1.Team.find();
        let events = yield Event_1.Event.find();
        let seasons = yield common_1.ALL_SEASONS;
        for (const team of teams) {
            urls.push(`/teams/${team.number}`);
        }
        for (const event of events) {
            urls.push(`/events/${event.season}/${event.code}`);
        }
        for (const season of seasons) {
            urls.push(`/records/${season}/teams`);
            urls.push(`/records/${season}/matches`);
            urls.push(`/events/${season}`);
        }
        urls.push("/about");
        urls.push("/api");
        urls.push("/api/rest");
        urls.push("/blog");
        urls.push("/privacy");
        urls.push("/teams");
        urls.push("/sponsors");
        urls.push("/sponsors/info");
        urls.push("/first");
        urls.push("/");
        xmls = urls.map((url) => {
            return `  <url><loc>${pre}${url}</loc></url>\n`;
        });
        res.header("Content-Type", "application/xml");
        res.send(xmlHeader + urlsetHeader + xmls.join("") + urlsetFooter);
    });
}
//# sourceMappingURL=setupSitemap.js.map