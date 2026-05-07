"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoteOption = exports.NON_COMPETITION_EVENT_TYPES = exports.OFFICIAL_EVENT_TYPES = exports.COMPETITION_EVENT_TYPES = exports.getEventTypes = exports.EventTypeOption = exports.eventTypeFromFtcApi = exports.EventType = void 0;
exports.EventType = {
    Scrimmage: "Scrimmage",
    LeagueMeet: "LeagueMeet",
    Qualifier: "Qualifier",
    LeagueTournament: "LeagueTournament",
    Championship: "Championship",
    Other: "Other",
    FIRSTChampionship: "FIRSTChampionship",
    SuperQualifier: "SuperQualifier",
    InnovationChallenge: "InnovationChallenge",
    OffSeason: "OffSeason",
    Kickoff: "Kickoff",
    Workshop: "Workshop",
    DemoExhibition: "DemoExhibition",
    VolunteerSignup: "VolunteerSignup",
    PracticeDay: "PracticeDay",
    Premier: "Premier",
};
function eventTypeFromFtcApi(str) {
    let trimmed = str.replace(/[\s\-/]/g, "");
    return Object.keys(exports.EventType).indexOf(trimmed) != -1 ? trimmed : null;
}
exports.eventTypeFromFtcApi = eventTypeFromFtcApi;
exports.EventTypeOption = Object.assign({ All: "All", Competition: "Competition", Official: "Official", NonCompetition: "NonCompetition" }, exports.EventType);
function getEventTypes(option) {
    switch (option) {
        case exports.EventTypeOption.All:
            return Object.values(exports.EventType);
        case exports.EventTypeOption.Competition:
            return exports.COMPETITION_EVENT_TYPES;
        case exports.EventTypeOption.Official:
            return exports.OFFICIAL_EVENT_TYPES;
        case exports.EventTypeOption.NonCompetition:
            return exports.NON_COMPETITION_EVENT_TYPES;
        default:
            return [option];
    }
}
exports.getEventTypes = getEventTypes;
exports.COMPETITION_EVENT_TYPES = [
    exports.EventType.Scrimmage,
    exports.EventType.LeagueMeet,
    exports.EventType.Qualifier,
    exports.EventType.LeagueTournament,
    exports.EventType.Championship,
    exports.EventType.FIRSTChampionship,
    exports.EventType.SuperQualifier,
    exports.EventType.OffSeason,
    exports.EventType.Premier
];
exports.OFFICIAL_EVENT_TYPES = [
    exports.EventType.LeagueMeet,
    exports.EventType.Qualifier,
    exports.EventType.LeagueTournament,
    exports.EventType.Championship,
    exports.EventType.FIRSTChampionship,
    exports.EventType.SuperQualifier,
    exports.EventType.Premier
];
exports.NON_COMPETITION_EVENT_TYPES = [
    exports.EventType.Kickoff,
    exports.EventType.Workshop,
    exports.EventType.DemoExhibition,
    exports.EventType.VolunteerSignup,
    exports.EventType.PracticeDay,
    exports.EventType.InnovationChallenge,
    exports.EventType.Other,
];
exports.RemoteOption = {
    All: "All",
    Trad: "Trad",
    Remote: "Remote",
};
//# sourceMappingURL=EventType.js.map