"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTeamEventStats = void 0;
const Alliance_1 = require("../Alliance");
const Station_1 = require("../Station");
const TournamentLevel_1 = require("../TournamentLevel");
const descriptor_list_1 = require("../descriptors/descriptor-list");
const calculate_opr_1 = require("./calculate-opr");
function calculateTeamEventStats(season, eventCode, isRemote, matches, teams) {
    matches = filterMatches(matches);
    let descriptor = descriptor_list_1.DESCRIPTORS[season];
    let emptyGroup = {};
    for (let c of descriptor.tepColumns()) {
        emptyGroup[c.apiName] = 0;
    }
    let teps = {};
    teams.forEach((t) => (teps[t] = {
        season: season,
        eventCode,
        teamNumber: t,
        isRemote,
        hasStats: false,
        rank: 0,
        rp: 0,
        tb1: 0,
        tb2: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        dqs: 0,
        qualMatchesPlayed: 0,
        tot: Object.assign({}, emptyGroup),
        avg: Object.assign({}, emptyGroup),
        min: Object.assign({}, emptyGroup),
        max: Object.assign({}, emptyGroup),
        dev: Object.assign({}, emptyGroup),
        opr: Object.assign({}, emptyGroup),
    }));
    (isRemote ? calculateRemoteMatchesPlayed : calculateRecords)(matches, teps);
    calculateGroupStats(matches, teps, descriptor, isRemote);
    calculateOprs(matches, teps, isRemote, descriptor);
    calculateRanks(teps, matches, descriptor);
    return Object.values(teps);
}
exports.calculateTeamEventStats = calculateTeamEventStats;
function filterMatches(matches) {
    return matches.filter((m) => m.tournamentLevel == TournamentLevel_1.TournamentLevel.Quals && (m === null || m === void 0 ? void 0 : m.scores));
}
function winner(red, blue) {
    if (red.totalPoints > blue.totalPoints) {
        return Alliance_1.Alliance.Red;
    }
    else if (blue.totalPoints > red.totalPoints) {
        return Alliance_1.Alliance.Blue;
    }
    else {
        return null;
    }
}
function calculateRecords(matches, teps) {
    for (let m of matches) {
        let red = m.scores.red;
        let blue = m.scores.blue;
        let winningAlliance = winner(red, blue);
        for (let t of m.teams) {
            if (t.surrogate)
                continue;
            let r = teps[t.teamNumber];
            r.qualMatchesPlayed++;
            r.hasStats = true;
            if (t.alliance == winningAlliance) {
                r.wins++;
            }
            else if (winningAlliance == null) {
                r.ties++;
            }
            else {
                r.losses++;
            }
            if (t.dq)
                r.dqs++;
        }
    }
}
function calculateRemoteMatchesPlayed(matches, teps) {
    for (let m of matches) {
        let t = m.teams[0];
        if (t.onField) {
            teps[t.teamNumber].qualMatchesPlayed++;
            teps[t.teamNumber].hasStats = true;
        }
    }
}
const tot = (arr) => (arr.length == 0 ? null : arr.reduce((a, b) => a + b, 0));
const avg = (arr) => (arr.length == 0 ? null : tot(arr) / arr.length);
const min = (arr) => (arr.length == 0 ? null : Math.min(...arr));
const max = (arr) => (arr.length == 0 ? null : Math.max(...arr));
const dev = (arr) => {
    if (arr.length == 0)
        return null;
    let a = avg(arr);
    let diffAvg = avg(arr.map((n) => (a - n) * (a - n)));
    return Math.sqrt(diffAvg);
};
function calculateGroupStats(matches, teps, descriptor, remote) {
    let dataPoints = {};
    for (let team of Object.keys(teps)) {
        dataPoints[+team] = {};
        for (let c of descriptor.tepColumns()) {
            dataPoints[+team][c.apiName] = [];
        }
    }
    for (let m of matches) {
        let allianceScores = {
            Red: m.scores.red,
            Blue: m.scores.blue,
            Solo: m.scores,
        };
        for (let t of m.teams) {
            if (t.surrogate)
                continue;
            let s = allianceScores[t.alliance];
            for (let c of descriptor.tepColumns()) {
                if (c.tradOnly && remote)
                    continue;
                dataPoints[t.teamNumber][c.apiName].push(c.make(s, t.station));
            }
        }
    }
    for (let [team, data] of Object.entries(dataPoints)) {
        for (let [name, points] of Object.entries(data)) {
            teps[+team].tot[name] = tot(points);
            teps[+team].avg[name] = avg(points);
            teps[+team].min[name] = min(points);
            teps[+team].max[name] = max(points);
            teps[+team].dev[name] = dev(points);
        }
    }
}
function calculateOprs(matches, teps, isRemote, descriptor) {
    if (isRemote) {
        for (let [team, data] of Object.entries(teps)) {
            teps[+team].opr = data.avg;
        }
        return;
    }
    let dataPoints = {};
    for (let c of descriptor.tepColumns()) {
        dataPoints[c.apiName] = [];
        if (c.isIndividual) {
            for (let [team, data] of Object.entries(teps)) {
                teps[+team].opr[c.apiName] = data.avg[c.apiName];
            }
        }
    }
    for (let m of matches) {
        for (let a of [Alliance_1.Alliance.Red, Alliance_1.Alliance.Blue]) {
            let [team1, team2] = m.teams.filter((t) => t.alliance == a).map((t) => t.teamNumber);
            let s = a == Alliance_1.Alliance.Red ? m.scores.red : m.scores.blue;
            for (let c of descriptor.tepColumns()) {
                if (c.isIndividual)
                    continue;
                dataPoints[c.apiName].push({ team1, team2, result: c.make(s, Station_1.Station.One) });
            }
        }
    }
    for (let [name, data] of Object.entries(dataPoints)) {
        let oprs = (0, calculate_opr_1.calculateOpr)(data);
        for (let [team, opr] of Object.entries(oprs)) {
            teps[+team].opr[name] = opr;
        }
    }
}
function calculateRanks(teps, matches, descriptor) {
    for (let stats of Object.values(teps)) {
        if (!stats.hasStats)
            continue;
        switch (descriptor.rankings.rp) {
            case "TotalPoints":
                stats.rp = stats.tot.totalPoints;
                break;
            case "Record":
                stats.rp =
                    stats.qualMatchesPlayed == 0
                        ? 0
                        : (2 * stats.wins + stats.ties) / stats.qualMatchesPlayed;
                break;
            case "DecodeRP":
                stats.rp =
                    stats.qualMatchesPlayed == 0
                        ? 0
                        : (3 * stats.wins +
                            stats.ties +
                            stats.tot.movementRp +
                            stats.tot.goalRp +
                            stats.tot.patternRp) /
                            stats.qualMatchesPlayed;
                break;
        }
    }
    for (let stats of Object.values(teps)) {
        if (!stats.hasStats)
            continue;
        switch (descriptor.rankings.tb) {
            case "AutoEndgameTot":
                stats.tb1 = stats.tot.autoPoints;
                stats.tb2 = stats.tot.egPoints;
                break;
            case "AutoAscentAvg":
                stats.tb1 = stats.avg.autoPoints;
                stats.tb2 = stats.avg.dcParkPoints;
                break;
            case "AutoEndgameAvg":
                stats.tb1 = stats.avg.autoPoints;
                stats.tb2 = stats.avg.egPoints;
                break;
            case "LosingScore":
                calcLosingScoreTb(teps, matches);
                break;
            case "AvgNpBase":
                stats.tb1 = stats.avg.totalPointsNp;
                stats.tb2 = stats.avg.dcBasePoints;
                break;
        }
    }
    let ranked = Object.entries(teps)
        .filter(([_, s]) => s.hasStats)
        .sort(([_1, s1], [_2, s2]) => s2.tb2 - s1.tb2)
        .sort(([_1, s1], [_2, s2]) => s2.tb1 - s1.tb1)
        .sort(([_1, s1], [_2, s2]) => s2.rp - s1.rp);
    for (let rank = 0; rank < ranked.length; rank++) {
        teps[+ranked[rank][0]].rank = rank + 1;
    }
}
function calcLosingScoreTb(teps, matches) {
    let tbs = {};
    for (let team of Object.keys(teps)) {
        tbs[+team] = [];
    }
    for (let m of matches) {
        let lowestScore = Math.min(m.scores.red.totalPointsNp, m.scores.blue.totalPointsNp);
        for (let t of m.teams) {
            if (t.surrogate)
                continue;
            tbs[t.teamNumber].push(t.dq ? -1 : lowestScore);
        }
    }
    for (let team of Object.keys(teps)) {
        let scores = tbs[+team];
        let dqs = scores.filter((s) => s == -1).length;
        let realScores = scores.filter((s) => s != -1).sort((a, b) => b - a);
        let denom;
        if (scores.length == 5 || scores.length == 6) {
            denom = scores.length - 1;
        }
        else if (scores.length >= 7) {
            denom = scores.length - 2;
        }
        else {
            denom = scores.length;
        }
        let taken = Math.max(0, denom - dqs);
        teps[+team].tb1 =
            denom == 0 ? 0 : realScores.slice(0, taken).reduce((a, b) => a + b, 0) / denom;
        teps[+team].tb2 = 0;
    }
}
//# sourceMappingURL=calculate-team-event-stats.js.map