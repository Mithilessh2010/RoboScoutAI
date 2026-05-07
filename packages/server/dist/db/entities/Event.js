"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Event_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@ftc-scout/common");
const Match_1 = require("./Match");
let Event = exports.Event = Event_1 = class Event extends typeorm_1.BaseEntity {
    static fromApi(api, season) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        let type = (0, common_1.eventTypeFromFtcApi)((_a = api.typeName) !== null && _a !== void 0 ? _a : "");
        if (api.code == null ||
            type == null ||
            api.country == null ||
            api.stateprov == null ||
            api.city == null) {
            console.error(api, type);
            console.error(`Rejecting api event ${season} ${api.code}.`);
            return null;
        }
        const EDIT_EVENT_BY_CODE = {
            FTCCMP1: "FIRST World Championship - Finals Division",
            FTCCMP1FRNK: "FIRST World Championship - Franklin Division",
            FTCCMP1FRAN: "FIRST World Championship - Franklin Division",
            FTCCMP1JEMI: "FIRST World Championship - Jemison Division",
            FTCCMP1EDIS: "FIRST World Championship - Edison Division",
            FTCCMP1OCHO: "FIRST World Championship - Ochoa Division",
            FTCCMP1JACK: "FIRST World Championship - Jackson Division",
            FTCCMP1GOOD: "FIRST World Championship - Goodall Division",
            FTCCMP1LOVE: "FIRST World Championship - Lovelace Division",
            FTCCMP1ROSS: "FIRST World Championship - Ross Division",
            "19MICMP2": "FIRST in Michigan FTC State Championship - Warren",
            "19MICMP2MARIECURIE": "FIRST in Michigan FTC State Championship - Warren - Marie Curie Division",
            "19MICMP2WOODIEFLOWER": "FIRST in Michigan FTC State Championship - Warren - Woodie Flowers Division",
            "2019FLC1": "Florida FTC State Championship",
            "2019FLC1LAWRENCE": "Florida FTC State Championship - Lawrence Division",
            "2019FLC1SCOTT": "Florida FTC State Championship - Scott Division",
            "2019GACMP": "Georgia State Championship",
            "2019GACMPKILRAIN": "Georgia State Championship - Kilrain Division",
            "2019GACMPPEMBERTON": "Georgia State Championship - Pemberton Division",
            "2019IACMP1": "Iowa Championship",
            "2019IACMP1BLACK": "Iowa Championship - Black Division",
            "2019IACMP1GOLD": "Iowa Championship - Gold Division",
            "2019MOC1": "Missouri State Championship",
            "2019MOC1SDIVISION": "Missouri State Championship - S Division",
            "2019MOC1TDIVISION": "Missouri State Championship - T Division",
            "2019TXCCMP": "Central Texas FIRST Tech Challenge Regional Championship",
            "2019TXCCMPKANE": "Central Texas FIRST Tech Challenge Regional Championship - Kane Division",
            "2019TXCCMPNAYLOR": "Central Texas FIRST Tech Challenge Regional Championship - Naylor Division",
            "63707970587.8573": "2019-2020 MN FTC Stratasys State Championship",
            "63707970587.8573GALA": "2019-2020 MN FTC Stratasys State Championship - Galaxy Division",
            "63707970587.8573NANO": "2019-2020 MN FTC Stratasys State Championship - Nano Division",
            "63713064000.6815": ",MD-DC SKYSTONE Championship",
            "63713064000.6815COLL": "MD-DC SKYSTONE Championship - Collins Aerospace Division",
            "63713064000.6815KAHL": "MD-DC SKYSTONE Championship - Kahlert Division",
            AZFTCCP: "Arizona FIRST Tech Challenge Championship",
            AZFTCCPGRANDCANYON: "Arizona FIRST Tech Challenge Championship - Grand Canyon Division",
            AZFTCCPSAGUARO: "Arizona FIRST Tech Challenge Championship - Saguaro Division",
            LACHAMP: "Los Angeles Championship Monrovia, CA",
            LACHAMPGALILEO: "Los Angeles Championship Monrovia, CA - Galileo Division",
            LACHAMPODYSSEY: "Los Angeles Championship Monrovia, CA - Odyssey Division",
            NTXCH01: "North Texas FTC Regional Championship",
            NTXCH01RUBY: "North Texas FTC Regional Championship - Ruby Division",
            NTXCH01SAPPHIRE: "North Texas FTC Regional Championship - Sapphire Division",
            PACHAMP1: "Pennsylvania FTC Championship",
            PACHAMP1ALLEGHENY: "Pennsylvania FTC Championship - Allegheny Division",
            PACHAMP1POCONO: "Pennsylvania FTC Championship - Pocono Division",
        };
        function fixLocations(event_name) {
            const replacements = [["Chinese Taipei", "Taiwan"]];
            for (const [old_str, new_str] of replacements) {
                if (event_name.includes(old_str)) {
                    return event_name.replace(old_str, new_str);
                }
            }
            return event_name;
        }
        const MODIFIED_RULES = [
            "USTXCECCS",
        ];
        const MODIFIED_REGION_CODES = {
            NE: common_1.RegionCode.USNE,
        };
        const EVENT_LIVESTREAM_OVERRIDES = {
            [common_1.Season.Decode]: {
                FTCCMP1: [
                    {
                        day: new Date("2026-04-29"),
                        liveStreamURL: "https://www.youtube.com/watch?v=llW0_BOPt_E",
                    },
                    {
                        day: new Date("2026-04-30"),
                        liveStreamURL: "https://www.youtube.com/watch?v=SuBzmIbCyFE",
                    },
                    {
                        day: new Date("2026-05-01"),
                        liveStreamURL: "https://www.youtube.com/watch?v=zNKWz-nAI7E",
                    },
                    {
                        day: new Date("2026-05-02"),
                        liveStreamURL: "https://www.youtube.com/watch?v=abjNLBFk1N8",
                    },
                    {
                        day: new Date("2026-05-03"),
                        liveStreamURL: "https://www.youtube.com/watch?v=6PZDgfPz14Y",
                    },
                ],
                FTCCMP1EDIS: [
                    {
                        day: new Date("2026-04-29"),
                        liveStreamURL: "https://www.youtube.com/watch?v=SEbooZaBoIs",
                    },
                    {
                        day: new Date("2026-04-30"),
                        liveStreamURL: "https://www.youtube.com/watch?v=v_KlA02le9g",
                    },
                    {
                        day: new Date("2026-05-01"),
                        liveStreamURL: "https://www.youtube.com/watch?v=ATn3vKK9Cac",
                    },
                    {
                        day: new Date("2026-05-02"),
                        liveStreamURL: "https://www.youtube.com/watch?v=WQUBVjbh-hM",
                    },
                ],
                FTCCMP1FRAN: [
                    {
                        day: new Date("2026-04-29"),
                        liveStreamURL: "https://www.youtube.com/watch?v=76X4pB5eljY",
                    },
                    {
                        day: new Date("2026-04-30"),
                        liveStreamURL: "https://www.youtube.com/watch?v=MeaiooVeA70",
                    },
                    {
                        day: new Date("2026-05-01"),
                        liveStreamURL: "https://www.youtube.com/watch?v=U3-l-scDglY",
                    },
                    {
                        day: new Date("2026-05-02"),
                        liveStreamURL: "https://www.youtube.com/watch?v=iCMhB5nhEZU",
                    },
                ],
                FTCCMP1GOOD: [
                    {
                        day: new Date("2026-04-29"),
                        liveStreamURL: "https://www.youtube.com/watch?v=ws7CKWmZ2J4",
                    },
                    {
                        day: new Date("2026-04-30"),
                        liveStreamURL: "https://www.youtube.com/watch?v=ZEzRZXUkgEI",
                    },
                    {
                        day: new Date("2026-05-01"),
                        liveStreamURL: "https://www.youtube.com/watch?v=nNWYRvkSHvw",
                    },
                    {
                        day: new Date("2026-05-02"),
                        liveStreamURL: "https://www.youtube.com/watch?v=H920hSVJw7E",
                    },
                ],
                FTCCMP1JACK: [
                    {
                        day: new Date("2026-04-29"),
                        liveStreamURL: "https://www.youtube.com/watch?v=njxbmoGyvQE",
                    },
                    {
                        day: new Date("2026-04-30"),
                        liveStreamURL: "https://www.youtube.com/watch?v=Yd5q_PokJ0Y",
                    },
                    {
                        day: new Date("2026-05-01"),
                        liveStreamURL: "https://www.youtube.com/watch?v=C5hddvlYfKQ",
                    },
                    {
                        day: new Date("2026-05-02"),
                        liveStreamURL: "https://www.youtube.com/watch?v=56Elss5raPo",
                    },
                ],
                FTCCMP1LOVE: [
                    {
                        day: new Date("2026-04-29"),
                        liveStreamURL: "https://www.youtube.com/watch?v=lalSiHiXbxc",
                    },
                    {
                        day: new Date("2026-04-30"),
                        liveStreamURL: "https://www.youtube.com/watch?v=KbMURIWFcMg",
                    },
                    {
                        day: new Date("2026-05-01"),
                        liveStreamURL: "https://www.youtube.com/watch?v=imScd0Dv9IA",
                    },
                    {
                        day: new Date("2026-05-02"),
                        liveStreamURL: "https://www.youtube.com/watch?v=lZNmEpiOSx8",
                    },
                ],
                FTCCMP1ROSS: [
                    {
                        day: new Date("2026-04-29"),
                        liveStreamURL: "https://www.youtube.com/watch?v=WoGngaj3ABk",
                    },
                    {
                        day: new Date("2026-04-30"),
                        liveStreamURL: "https://www.youtube.com/watch?v=oTLneTQGnsM",
                    },
                    {
                        day: new Date("2026-05-01"),
                        liveStreamURL: "https://www.youtube.com/watch?v=ps5rsAdW4-Q",
                    },
                    {
                        day: new Date("2026-05-02"),
                        liveStreamURL: "https://www.youtube.com/watch?v=oG0JzHFcf5A",
                    },
                ],
            },
        };
        return Event_1.create({
            season,
            code: api.code,
            divisionCode: api.divisionCode ? api.divisionCode : null,
            name: fixLocations((_b = EDIT_EVENT_BY_CODE[api.code]) !== null && _b !== void 0 ? _b : api.name).trim(),
            remote: api.remote,
            hybrid: api.hybrid,
            fieldCount: api.fieldCount,
            published: api.published,
            type,
            regionCode: api.regionCode
                ? (_c = MODIFIED_REGION_CODES[api.regionCode]) !== null && _c !== void 0 ? _c : api.regionCode
                : null,
            leagueCode: api.leagueCode,
            districtCode: api.districtCode ? api.districtCode : null,
            venue: (_e = (_d = api.venue) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : null,
            address: (_g = (_f = api.address) === null || _f === void 0 ? void 0 : _f.trim()) !== null && _g !== void 0 ? _g : null,
            country: fixLocations(api.country),
            state: fixLocations(api.stateprov),
            city: fixLocations(api.city),
            website: api.website ? api.website.trim() : null,
            liveStreamURL: api.liveStreamUrl && api.liveStreamUrl.startsWith("https://")
                ? api.liveStreamUrl.trim()
                : null,
            livestreamsByDay: (_j = (_h = EVENT_LIVESTREAM_OVERRIDES[season]) === null || _h === void 0 ? void 0 : _h[api.code]) !== null && _j !== void 0 ? _j : null,
            webcasts: api.webcasts ? api.webcasts : [],
            timezone: api.timezone === "Asia/Calcutta" ? "Asia/Kolkata" : (_k = api.timezone) !== null && _k !== void 0 ? _k : "UTC",
            start: new Date(api.dateStart),
            end: new Date(api.dateEnd),
            modifiedRules: MODIFIED_RULES.indexOf(api.code) != -1,
        });
    }
};
__decorate([
    (0, typeorm_1.PrimaryColumn)("smallint"),
    __metadata("design:type", Number)
], Event.prototype, "season", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", String)
], Event.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Match_1.Match, (match) => match.event),
    __metadata("design:type", Array)
], Event.prototype, "matches", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "divisionCode", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Event.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], Event.prototype, "remote", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], Event.prototype, "hybrid", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Event.prototype, "fieldCount", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], Event.prototype, "published", void 0);
__decorate([
    (0, typeorm_1.Column)("enum", { enum: common_1.EventType, enumName: "event_type_enum" }),
    __metadata("design:type", String)
], Event.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "regionCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "leagueCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "districtCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "venue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Event.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Event.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Event.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "website", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "liveStreamURL", void 0);
__decorate([
    (0, typeorm_1.Column)("json", { nullable: true }),
    __metadata("design:type", Object)
], Event.prototype, "livestreamsByDay", void 0);
__decorate([
    (0, typeorm_1.Column)("json"),
    __metadata("design:type", Array)
], Event.prototype, "webcasts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], Event.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)("date"),
    __metadata("design:type", Date)
], Event.prototype, "start", void 0);
__decorate([
    (0, typeorm_1.Column)("date"),
    __metadata("design:type", Date)
], Event.prototype, "end", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], Event.prototype, "modifiedRules", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Event.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Event.prototype, "updatedAt", void 0);
exports.Event = Event = Event_1 = __decorate([
    (0, typeorm_1.Entity)()
], Event);
//# sourceMappingURL=Event.js.map