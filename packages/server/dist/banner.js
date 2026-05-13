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
exports.eventBanner = exports.setupBannerRoutes = void 0;
const path_1 = require("path");
const Team_1 = require("./db/schemas/Team");
const team_event_participation_1 = require("./db/schemas/dyn/team-event-participation");
const common_1 = require("@ftc-scout/common");
const Event_1 = require("./db/schemas/Event");
const canvas_1 = require("canvas");
const promises_1 = require("fs/promises");
const match_score_1 = require("./db/schemas/dyn/match-score");
const luxon_1 = require("luxon");
function sendBanner(res) {
    res.sendFile((0, path_1.resolve)("src/res/banner.png"));
}
function setupBannerRoutes(app) {
    app.get("/banners/teams/:team_num", (req, res) => __awaiter(this, void 0, void 0, function* () {
        if (+req.params.team_num) {
            teamBanner(+req.params.team_num, res);
        }
        else {
            sendBanner(res);
        }
    }));
    app.get("/banners/events/:season/:code", (req, res) => __awaiter(this, void 0, void 0, function* () {
        if (/^\d+$/.test(req.params.season)) {
            yield eventBanner(+req.params.season, req.params.code, res);
        }
        else {
            sendBanner(res);
        }
    }));
}
exports.setupBannerRoutes = setupBannerRoutes;
function teamBanner(number, res) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        let teamData = yield Team_1.Team.findOne({ number });
        if (!teamData)
            return sendBanner(res);
        let pensSub = common_1.DESCRIPTORS[common_1.CURRENT_SEASON].pensSubtract;
        let bestEvent = yield team_event_participation_1.TeamEventParticipation[common_1.CURRENT_SEASON]
            .aggregate([
            { $match: { teamNumber: number, season: common_1.CURRENT_SEASON } },
            {
                $lookup: {
                    from: Event_1.Event.collection.name,
                    localField: "eventCode",
                    foreignField: "code",
                    as: "event",
                },
            },
            { $unwind: "$event" },
            { $match: { "event.remote": false } },
            {
                $sort: {
                    [pensSub ? "oprTotalPoints" : "totalPointsNp"]: -1,
                },
            },
            { $limit: 1 },
        ])
            .then((rows) => { var _a; return (_a = rows[0]) !== null && _a !== void 0 ? _a : null; });
        let bestOpr = (_b = (_a = bestEvent === null || bestEvent === void 0 ? void 0 : bestEvent.opr) === null || _a === void 0 ? void 0 : _a[pensSub ? "totalPoints" : "totalPointsNp"]) !== null && _b !== void 0 ? _b : null;
        let bestOprStr = bestOpr != null ? Math.round(bestOpr * 100) / 100 + "" : "N/A";
        (0, canvas_1.registerFont)("src/res/Inter-SemiBold.ttf", { family: "InterSB" });
        (0, canvas_1.registerFont)("src/res/Inter-Bold.ttf", { family: "InterB" });
        var img = (0, canvas_1.createCanvas)(1200, 628);
        var ctx = img.getContext("2d");
        let waveBuffer = yield (0, promises_1.readFile)("src/res/wave.png");
        const image = new canvas_1.Image();
        image.onload = () => ctx.drawImage(image, 0, 0);
        image.src = waveBuffer;
        ctx.fillStyle = "#000";
        ctx.font = "45pt InterB";
        ctx.fillText(teamData.number + "", 80, 270);
        ctx.fillText(bestOprStr, 80, 380);
        ctx.fillText(teamData.rookieYear + "", 330, 380);
        var size = 45;
        while (ctx.measureText(teamData.name).width > 800) {
            size -= 1;
            ctx.font = `${size}pt InterB`;
        }
        ctx.fillText(teamData.name, 330, 270);
        ctx.font = "24pt InterSB";
        ctx.fillText("Top OPR", 80, 320);
        ctx.fillText("Rookie Year", 330, 320);
        ctx.fillText("Team Number", 80, 205);
        ctx.fillText("Team Name", 330, 205);
        img.createPNGStream().pipe(res);
    });
}
function eventBanner(season, code, res) {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function* () {
        let eventData = yield Event_1.Event.findOne({ season, code });
        if (!eventData)
            return sendBanner(res);
        let bestMatch = yield match_score_1.MatchScore[season]
            .findOne({ season, eventCode: code })
            .sort({ "scores.totalPoints": -1 });
        let bestScore = (_c = (_b = (_a = bestMatch === null || bestMatch === void 0 ? void 0 : bestMatch.scores) === null || _a === void 0 ? void 0 : _a.totalPoints) !== null && _b !== void 0 ? _b : bestMatch === null || bestMatch === void 0 ? void 0 : bestMatch.totalPoints) !== null && _c !== void 0 ? _c : null;
        let winningTeam = yield team_event_participation_1.TeamEventParticipation[season]
            .findOne({ season, eventCode: code, rp: { $ne: null } })
            .sort({ rp: -1 });
        let winningTeamNum = (_d = winningTeam === null || winningTeam === void 0 ? void 0 : winningTeam.teamNumber) !== null && _d !== void 0 ? _d : null;
        (0, canvas_1.registerFont)("src/res/Inter-SemiBold.ttf", { family: "InterSB" });
        (0, canvas_1.registerFont)("src/res/Inter-Bold.ttf", { family: "InterB" });
        var img = (0, canvas_1.createCanvas)(1200, 628);
        var ctx = img.getContext("2d");
        let waveBuffer = yield (0, promises_1.readFile)("src/res/wave.png");
        const image = new canvas_1.Image();
        image.onload = () => ctx.drawImage(image, 0, 0);
        image.src = waveBuffer;
        ctx.fillStyle = "#000";
        ctx.font = "45pt InterB";
        let drawLeft = bestScore != null || winningTeamNum != null;
        let rightX = drawLeft ? 360 : 80;
        if (drawLeft) {
            ctx.fillText(winningTeamNum == null ? "N/A" : winningTeamNum + "", 80, 270);
            ctx.fillText(bestScore == null ? "N/A" : bestScore + "", 80, 380);
        }
        let dateStr = luxon_1.DateTime.fromISO(eventData.start, {
            zone: eventData.timezone,
        }).toLocaleString({
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        ctx.fillText(dateStr, rightX, 380);
        var size = 45;
        while (ctx.measureText(eventData.name).width > 1200 - rightX) {
            size -= 1;
            ctx.font = `${size}pt InterB`;
        }
        ctx.fillText(eventData.name, rightX, 270);
        ctx.font = "24pt InterSB";
        if (drawLeft) {
            ctx.fillText("Top Score", 80, 320);
            ctx.fillText("Top Qualifier", 80, 205);
        }
        ctx.fillText("Date", rightX, 320);
        ctx.fillText("Event", rightX, 205);
        img.createPNGStream().pipe(res);
    });
}
exports.eventBanner = eventBanner;
//# sourceMappingURL=banner.js.map