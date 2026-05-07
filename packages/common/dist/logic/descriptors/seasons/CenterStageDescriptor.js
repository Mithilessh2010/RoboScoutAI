"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Descriptor2023 = exports.EgNav2023 = exports.AutoSpecialScoring = void 0;
const Season_1 = require("../../Season");
const descriptor_1 = require("../descriptor");
const types_1 = require("../types");
const Station_1 = require("../../Station");
const n_of_1 = require("../../../utils/format/n-of");
exports.AutoSpecialScoring = {
    None: "None",
    NoProp: "NoProp",
    TeamProp: "TeamProp",
};
const AutoSpecialScoringDTy = (0, types_1.EnumDTy)(exports.AutoSpecialScoring, "AutoSpecialScoring", "auto_special_scoring_enum");
function autoSpecialScoringFromAPI(scored, teamProp) {
    if (scored) {
        if (teamProp) {
            return exports.AutoSpecialScoring.TeamProp;
        }
        else {
            return exports.AutoSpecialScoring.NoProp;
        }
    }
    else {
        return exports.AutoSpecialScoring.None;
    }
}
function autoSpecialScoringPoints(autoSpecialScoring) {
    switch (autoSpecialScoring) {
        case "None":
            return 0;
        case "NoProp":
            return 10;
        case "TeamProp":
            return 20;
    }
}
function formatAutoSpecialScoringPoints(autoSpecialScoring) {
    switch (autoSpecialScoring) {
        case "None":
            return "Not scored";
        case "NoProp":
            return "Scored without prop";
        case "TeamProp":
            return "Scored with team prop";
    }
}
function dronePoints(zone) {
    if (zone == 0) {
        return 0;
    }
    else {
        return (4 - zone) * 10;
    }
}
exports.EgNav2023 = {
    None: "None",
    Backstage: "Backstage",
    Rigging: "Rigging",
};
const EgNav2023DTy = (0, types_1.EnumDTy)(exports.EgNav2023, "EgNav2023", "endgame_nav_2023_enum");
function egNav2023FromApi(place) {
    if (place == "NONE") {
        return exports.EgNav2023.None;
    }
    else if (place == "BACKSTAGE") {
        return exports.EgNav2023.Backstage;
    }
    else {
        return exports.EgNav2023.Rigging;
    }
}
function egNav2023Points(egNav) {
    switch (egNav) {
        case "None":
            return 0;
        case "Backstage":
            return 5;
        case "Rigging":
            return 20;
    }
}
function formatEgNav2023(egNav) {
    switch (egNav) {
        case "None":
            return "No Park";
        case "Backstage":
            return "Parked Backstage";
        case "Rigging":
            return "Suspended on Rigging";
    }
}
exports.Descriptor2023 = new descriptor_1.Descriptor({
    season: Season_1.Season.CenterStage,
    seasonName: "Centerstage",
    hasRemote: false,
    hasEndgame: true,
    pensSubtract: false,
    rankings: {
        rp: "Record",
        tb: "AutoEndgameAvg",
    },
    firstDate: new Date("2023-09-10"),
    lastDate: new Date("2024-09-05"),
    kickoff: new Date("2023-09-09"),
})
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egNav1" })
    .addMatchScore({
    apiName: "egNav2023_1",
    fromApi: (api) => egNav2023FromApi(api.egRobot1),
    dataTy: EgNav2023DTy,
})
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Endgame Nav 1",
    fullName: "Robot 1 Endgame Navigation Points",
    getValue: (ms) => egNav2023Points(ms.egNav2023_1),
    getTitle: (ms) => formatEgNav2023(ms.egNav2023_1),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egNav2" })
    .addMatchScore({
    apiName: "egNav2023_2",
    fromApi: (api) => egNav2023FromApi(api.egRobot2),
    dataTy: EgNav2023DTy,
})
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Endgame Nav 2",
    fullName: "Robot 2 Endgame Navigation Points",
    getValue: (ms) => egNav2023Points(ms.egNav2023_2),
    getTitle: (ms) => formatEgNav2023(ms.egNav2023_2),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "purple1" })
    .addMatchScore({
    fromApi: (api) => autoSpecialScoringFromAPI(api.spikeMarkPixel1, api.initTeamProp1),
    dataTy: AutoSpecialScoringDTy,
})
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Purple 1",
    fullName: "Robot 1 Purple Bonus Points",
    getValue: (ms) => autoSpecialScoringPoints(ms.purple1),
    getTitle: (ms) => formatAutoSpecialScoringPoints(ms.purple1),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "purple2" })
    .addMatchScore({
    fromApi: (api) => autoSpecialScoringFromAPI(api.spikeMarkPixel2, api.initTeamProp2),
    dataTy: AutoSpecialScoringDTy,
})
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Purple 2",
    fullName: "Robot 2 Purple Bonus Points",
    getValue: (ms) => autoSpecialScoringPoints(ms.purple2),
    getTitle: (ms) => formatAutoSpecialScoringPoints(ms.purple2),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "yellow1" })
    .addMatchScore({
    fromApi: (api) => autoSpecialScoringFromAPI(api.targetBackdropPixel1, api.initTeamProp1),
    dataTy: AutoSpecialScoringDTy,
})
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Yellow 1",
    fullName: "Robot 1 Yellow Bonus Points",
    getValue: (ms) => autoSpecialScoringPoints(ms.yellow1),
    getTitle: (ms) => formatAutoSpecialScoringPoints(ms.yellow1),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "yellow2" })
    .addMatchScore({
    fromApi: (api) => autoSpecialScoringFromAPI(api.targetBackdropPixel2, api.initTeamProp2),
    dataTy: AutoSpecialScoringDTy,
})
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Yellow 2",
    fullName: "Robot 2 Yellow Bonus Points",
    getValue: (ms) => autoSpecialScoringPoints(ms.yellow2),
    getTitle: (ms) => formatAutoSpecialScoringPoints(ms.yellow2),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoBackdrop" })
    .addMatchScore({
    fromApi: (api) => api.autoBackdrop,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoBackstage" })
    .addMatchScore({
    fromApi: (api) => api.autoBackstage,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcBackstage" })
    .addMatchScore({
    fromApi: (api) => api.dcBackstagePoints,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcBackdrop" })
    .addMatchScore({
    fromApi: (api) => api.dcBackdrop,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoNav1" })
    .addMatchScore({
    fromApi: (api) => api.robot1Auto,
    dataTy: types_1.BoolDTy,
})
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Nav 1",
    fullName: "Robot 1 Auto Navigation Points",
    getValue: (ms) => ms.autoNav1 * 5,
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoNav2" })
    .addMatchScore({
    fromApi: (api) => api.robot2Auto,
    dataTy: types_1.BoolDTy,
})
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Nav 2",
    fullName: "Robot 2 Auto Navigation Points",
    getValue: (ms) => ms.autoNav2 * 5,
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "drone1" })
    .addMatchScore({
    fromApi: (api) => api.drone1,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Drone 1",
    columnPrefix: "Drone 1",
    fullName: "Robot 1 Drone Points",
    getValue: (ms) => dronePoints(ms.drone1),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "drone2" })
    .addMatchScore({
    fromApi: (api) => api.drone2,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Drone 2",
    columnPrefix: "Drone 2",
    fullName: "Robot 2 Drone Points",
    getValue: (ms) => dronePoints(ms.drone2),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "maxSetLine" })
    .addMatchScore({
    fromApi: (api) => api.maxSetLine,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "mosaics" })
    .addMatchScore({
    fromApi: (api) => api.mosaics,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsCommitted" })
    .addMatchScore({
    fromApi: (api) => api.minorPenalties,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsCommitted" })
    .addMatchScore({
    fromApi: (api) => api.majorPenalties,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsByOpp" })
    .addMatchScore({
    fromApi: (_, api) => api.minorPenalties,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsByOpp" })
    .addMatchScore({
    fromApi: (_, api) => api.majorPenalties,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egNavPoints" })
    .addMatchScore({
    fromSelf: (self) => "egNav2023" in self
        ? egNav2023Points(self.egNav2023)
        : egNav2023Points(self.egNav2023_1) + egNav2023Points(self.egNav2023_2),
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Navigation Points",
    columnPrefix: "Endgame Nav",
    fullName: "Endgame Navigation Points",
})
    .addTep({ columnPrefix: "Endgame Nav", fullName: "Endgame Navigation Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egNavPointsIndividual" })
    .addTep({
    isIndividual: true,
    make: (ms, station) => station == Station_1.Station.One
        ? egNav2023Points(ms.egNav2023_1)
        : station == Station_1.Station.Solo
            ? egNav2023Points(ms.egNav2023)
            : egNav2023Points(ms.egNav2023_2),
    columnPrefix: "Endgame Nav Individual",
    dialogName: "Individual",
    fullName: "Endgame Navigation Points Individual",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "purplePoints" })
    .addMatchScore({
    fromSelf: (self) => autoSpecialScoringPoints(self.purple1) + autoSpecialScoringPoints(self.purple2),
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Purple Bonus Points",
    columnPrefix: "Purple",
    fullName: "Purple Bonus Points",
})
    .addTep({ columnPrefix: "Purple", fullName: "Purple Bonus Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "purplePointsIndividual" })
    .addTep({
    isIndividual: true,
    make: (ms, station) => station == Station_1.Station.One
        ? autoSpecialScoringPoints(ms.purple1)
        : autoSpecialScoringPoints(ms.purple2),
    columnPrefix: "Purple Bonus Individual",
    dialogName: "Individual",
    fullName: "Purple Bonus Points Individual",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "yellowPoints" })
    .addMatchScore({
    fromSelf: (self) => autoSpecialScoringPoints(self.yellow1) + autoSpecialScoringPoints(self.yellow2),
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Yellow Bonus Points",
    columnPrefix: "Yellow",
    fullName: "Yellow Bonus Points",
})
    .addTep({ columnPrefix: "Yellow", fullName: "Yellow Bonus Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "yellowPointsIndividual" })
    .addTep({
    isIndividual: true,
    make: (ms, station) => station == Station_1.Station.One
        ? autoSpecialScoringPoints(ms.yellow1)
        : autoSpecialScoringPoints(ms.yellow2),
    columnPrefix: "Yellow Bonus Individual",
    dialogName: "Individual",
    fullName: "Yellow Bonus Points Individual",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoPixelPoints" })
    .addMatchScore({
    fromSelf: (self) => self.autoBackdrop * 5 + self.autoBackstage * 3,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Pixel Points",
    columnPrefix: "Auto Pixel",
    fullName: "Auto Pixel Points",
})
    .addTep({
    columnPrefix: "Auto Pixel",
    dialogName: "Pixel Points",
    fullName: "Auto Pixel Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoBackstagePoints" })
    .addScoreModal({
    displayName: "Backstage",
    columnPrefix: "Auto Backstage",
    fullName: "Auto Backstage Points",
    getValue: (ms) => ms.autoBackstage * 3,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.autoBackstage, "Pixel"),
    sql: (ms) => `(${ms}.autoBackstage * 3)`,
})
    .addTep({
    make: (ms) => ms.autoBackstage * 3,
    columnPrefix: "Auto Backstage",
    fullName: "Auto Backstage Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoBackdropPoints" })
    .addScoreModal({
    displayName: "Backdrop",
    columnPrefix: "Auto Backdrop",
    fullName: "Auto Backdrop Points",
    getValue: (ms) => ms.autoBackdrop * 5,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.autoBackdrop, "Pixel"),
    sql: (ms) => `(${ms}.autoBackdrop * 5)`,
})
    .addTep({
    make: (ms) => ms.autoBackdrop * 5,
    columnPrefix: "Auto Backdrop",
    fullName: "Auto Backdrop Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoNavPoints" })
    .addMatchScore({
    fromSelf: (self) => self.autoNav1 * 5 + self.autoNav2 * 5,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Navigation Points",
    columnPrefix: "Auto Nav",
    fullName: "Auto Navigation Points",
})
    .addTep({ columnPrefix: "Auto Nav", fullName: "Auto Navigation Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoNavPointsIndividual" })
    .addTep({
    isIndividual: true,
    make: (ms, station) => (station == Station_1.Station.One
        ? ms.autoNav1
        : station == Station_1.Station.Solo
            ? ms.autoNav
            : ms.autoNav2) * 5,
    columnPrefix: "Auto Nav Individual",
    dialogName: "Individual",
    fullName: "Auto Navigation Points Individual",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dronePoints" })
    .addMatchScore({
    fromSelf: (self) => dronePoints(self.drone1) + dronePoints(self.drone2),
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Drone Points",
    columnPrefix: "Drone",
    fullName: "Drone Points",
})
    .addTep({ columnPrefix: "Drone", fullName: "Drone Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dronePointsIndividual" })
    .addTep({
    isIndividual: true,
    make: (ms, station) => dronePoints(station == Station_1.Station.One ? ms.drone1 : ms.drone2),
    columnPrefix: "Drone Individual",
    dialogName: "Individual",
    fullName: "Drone Points Individual",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "setLinePoints" })
    .addMatchScore({
    fromSelf: (self) => self.maxSetLine * 10,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Setline Points",
    columnPrefix: "Setline",
    fullName: "Setline points",
})
    .addTep({ columnPrefix: "Setline", fullName: "Setline Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "mosaicPoints" })
    .addMatchScore({
    fromSelf: (self) => self.mosaics * 10,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Mosaic Points",
    columnPrefix: "Mosaic",
    fullName: "Mosaic Points",
})
    .addTep({ columnPrefix: "Mosaic", fullName: "Mosaic Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsCommittedPoints" })
    .addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points",
    getValue: (ms) => ms.majorsCommitted * 30,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.majorsCommitted, "Major Committed", "Majors Committed"),
    sql: (ms) => `(${ms}.majorsCommitted * 30)`,
})
    .addTep({
    make: (ms) => ms.majorsCommitted * 30,
    columnPrefix: "Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points Committed",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsCommittedPoints" })
    .addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalty Points",
    getValue: (ms) => ms.minorsCommitted * 10,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.minorsCommitted, "Minor Committed", "Minors Committed"),
    sql: (ms) => `(${ms}.minorsCommitted * 30)`,
})
    .addTep({
    make: (ms) => ms.minorsCommitted * 10,
    columnPrefix: "Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points Committed",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "penaltyPointsCommitted" })
    .addMatchScore({
    fromSelf: (self) => self.majorsCommitted * 30 + self.minorsCommitted * 10,
    dataTy: types_1.Int16DTy,
})
    .addTep({
    columnPrefix: "Penalties Committed",
    dialogName: "Penalty Points",
    fullName: "Penalty Points Committed",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsByOppPoints" })
    .addTep({
    make: (ms) => ms.majorsByOpp * 30,
    columnPrefix: "Opp Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points by Opponent",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsByOppPoints" })
    .addTep({
    make: (ms) => ms.minorsByOpp * 10,
    columnPrefix: "Opp Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points by Opponent",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "penaltyPointsByOpp" })
    .addMatchScore({
    fromSelf: (self) => self.majorsByOpp * 30 + self.minorsByOpp * 10,
    dataTy: types_1.Int16DTy,
})
    .addTep({
    columnPrefix: "Opp Penalties Committed",
    dialogName: "Opp Penalty Points",
    fullName: "Penalty Points by Opponent",
})
    .addScoreModal({
    displayName: "Penalties",
    columnPrefix: "Penalties",
    fullName: "Penalty Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoPoints" })
    .addMatchScore({
    fromSelf: (self) => self.autoNavPoints +
        self.autoPixelPoints +
        self.purplePoints +
        self.yellowPoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({ displayName: "Auto", columnPrefix: "Auto", fullName: "Auto Points" })
    .addTep({ columnPrefix: "Auto", dialogName: "Auto Points", fullName: "Auto Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcPoints" })
    .addMatchScore({
    fromSelf: (self) => self.dcBackdrop * 3 +
        self.dcBackstage * 1 +
        self.mosaicPoints +
        self.setLinePoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Driver-Controlled",
    columnPrefix: "Teleop",
    fullName: "Driver Controlled Points",
})
    .addTep({
    columnPrefix: "Teleop",
    dialogName: "Teleop Points",
    fullName: "Teleop Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcBackdropPoints" })
    .addScoreModal({
    displayName: "Backdrop",
    columnPrefix: "DC Backdrop",
    fullName: "Driver Controlled Backdrop Points",
    getValue: (ms) => ms.dcBackdrop * 3,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.dcBackdrop, "Pixel"),
    sql: (ms) => `(${ms}.dcBackdrop * 3)`,
})
    .addTep({
    make: (ms) => ms.dcBackdrop * 3,
    columnPrefix: "DC Backdrop",
    fullName: "Teleop Backdrop Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcBackstagePoints" })
    .addScoreModal({
    displayName: "Backstage",
    columnPrefix: "DC Backstage",
    fullName: "Driver Controlled Backstage Points",
    getValue: (ms) => ms.dcBackstage * 1,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.dcBackstage, "Pixel"),
    sql: (ms) => `(${ms}.dcBackstage * 1)`,
})
    .addTep({
    make: (ms) => ms.dcBackstage * 1,
    columnPrefix: "DC Backstage",
    fullName: "Teleop Backstage Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egPoints" })
    .addMatchScore({
    fromSelf: (self) => self.egNavPoints + self.dronePoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Endgame",
    columnPrefix: "Endgame",
    fullName: "Endgame Points",
})
    .addTep({
    columnPrefix: "Endgame",
    dialogName: "Endgame Points",
    fullName: "Endgame Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "totalPointsNp" })
    .addMatchScore({
    fromSelf: (self) => self.autoPoints + self.dcPoints + self.egPoints,
    dataTy: types_1.Int16DTy,
})
    .addTep({
    columnPrefix: "np",
    dialogName: "Total Points NP",
    fullName: "Total Points No Penalties",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "totalPoints" })
    .addMatchScore({
    fromSelf: (self) => self.totalPointsNp + self.penaltyPointsByOpp,
    dataTy: types_1.Int16DTy,
})
    .addTep({ columnPrefix: "", dialogName: "Total Points", fullName: "Total Points" }))
    .addTree([
    { val: "totalPoints", children: [] },
    { val: "totalPointsNp", children: [] },
    {
        val: "autoPoints",
        children: [
            {
                val: "autoNavPoints",
                children: [
                    { val: "autoNav1", children: [] },
                    { val: "autoNav2", children: [] },
                    { val: "autoNavPointsIndividual", children: [] },
                ],
            },
            {
                val: "autoPixelPoints",
                children: [
                    { val: "autoBackdropPoints", children: [] },
                    { val: "autoBackstagePoints", children: [] },
                ],
            },
            {
                val: "purplePoints",
                children: [
                    { val: "purple1", children: [] },
                    { val: "purple2", children: [] },
                    { val: "purplePointsIndividual", children: [] },
                ],
            },
            {
                val: "yellowPoints",
                children: [
                    { val: "yellow1", children: [] },
                    { val: "yellow2", children: [] },
                    { val: "yellowPointsIndividual", children: [] },
                ],
            },
        ],
    },
    {
        val: "dcPoints",
        children: [
            { val: "dcBackdropPoints", children: [] },
            { val: "dcBackstagePoints", children: [] },
            { val: "mosaicPoints", children: [] },
            { val: "setLinePoints", children: [] },
        ],
    },
    {
        val: "egPoints",
        children: [
            {
                val: "egNavPoints",
                children: [
                    { val: "egNav1", children: [] },
                    { val: "egNav2", children: [] },
                    { val: "egNavPointsIndividual", children: [] },
                ],
            },
            {
                val: "dronePoints",
                children: [
                    { val: "drone1", children: [] },
                    { val: "drone2", children: [] },
                    { val: "dronePointsIndividual", children: [] },
                ],
            },
        ],
    },
    {
        val: "penaltyPointsCommitted",
        children: [
            { val: "majorsCommittedPoints", children: [] },
            { val: "minorsCommittedPoints", children: [] },
        ],
    },
    {
        val: "penaltyPointsByOpp",
        children: [
            { val: "majorsCommittedPoints", for: "sm", children: [] },
            { val: "minorsCommittedPoints", for: "sm", children: [] },
            { val: "majorsByOppPoints", for: "tep", children: [] },
            { val: "minorsByOppPoints", for: "tep", children: [] },
        ],
    },
])
    .addMatchInsightCols(["autoPixelPoints", "mosaicPoints"], ["autoPixelPoints", "mosaicPoints"])
    .finish();
//# sourceMappingURL=CenterStageDescriptor.js.map