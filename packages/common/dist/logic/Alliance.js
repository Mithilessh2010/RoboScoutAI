"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allianceRoleFromApiStation = exports.AllianceRole = exports.allianceFromApiStation = exports.Alliance = void 0;
exports.Alliance = {
    Red: "Red",
    Blue: "Blue",
    Solo: "Solo",
};
function allianceFromApiStation(station) {
    switch (station) {
        case "Red1":
            return exports.Alliance.Red;
        case "Red2":
            return exports.Alliance.Red;
        case "Red3":
            return exports.Alliance.Red;
        case "Blue1":
            return exports.Alliance.Blue;
        case "Blue2":
            return exports.Alliance.Blue;
        case "Blue3":
            return exports.Alliance.Blue;
        case "1":
            return exports.Alliance.Solo;
    }
}
exports.allianceFromApiStation = allianceFromApiStation;
exports.AllianceRole = {
    Captain: "Captain",
    FirstPick: "FirstPick",
    SecondPick: "SecondPick",
    Solo: "Solo",
};
function allianceRoleFromApiStation(station) {
    switch (station) {
        case "Red1":
            return exports.AllianceRole.Captain;
        case "Red2":
            return exports.AllianceRole.FirstPick;
        case "Red3":
            return exports.AllianceRole.SecondPick;
        case "Blue1":
            return exports.AllianceRole.Captain;
        case "Blue2":
            return exports.AllianceRole.FirstPick;
        case "Blue3":
            return exports.AllianceRole.SecondPick;
        case "1":
            return exports.AllianceRole.Solo;
    }
}
exports.allianceRoleFromApiStation = allianceRoleFromApiStation;
//# sourceMappingURL=Alliance.js.map