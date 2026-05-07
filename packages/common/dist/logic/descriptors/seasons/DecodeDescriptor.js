"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Descriptor2025 = exports.ArtifactType = void 0;
const Season_1 = require("../../Season");
const Station_1 = require("../../Station");
const descriptor_1 = require("../descriptor");
const types_1 = require("../types");
const type_1 = require("graphql/type");
const n_of_1 = require("../../../utils/format/n-of");
function leavePoints(didLeave) {
    return didLeave ? 3 : 0;
}
function formatLeave(points) {
    return points ? "Left Staging Area" : "Stayed";
}
function basePoints(returnState) {
    switch (returnState) {
        case "PARTIAL":
            return 5;
        case "FULL":
            return 10;
        default:
            return 0;
    }
}
function formatBase(points) {
    switch (points) {
        case 0:
            return "Not Returned";
        case 5:
            return "Partially Returned";
        case 10:
            return "Fully Returned";
        default:
            return "";
    }
}
function baseBonus(r1, r2) {
    return r1 == "FULL" && r2 == "FULL" ? 10 : 0;
}
exports.ArtifactType = {
    None: "None",
    Purple: "Purple",
    Green: "Green",
};
const ArtifactTypeDTy = (0, types_1.EnumDTy)(exports.ArtifactType, "ArtifactType", "artifact_type_enum");
function artifactTypeFromApi(artifactType) {
    switch (artifactType) {
        case "NONE":
            return exports.ArtifactType.None;
        case "PURPLE":
            return exports.ArtifactType.Purple;
        case "GREEN":
            return exports.ArtifactType.Green;
    }
}
function classifierStateFromApi(api) {
    let classifier = [];
    for (const artifact of api) {
        classifier.push(artifactTypeFromApi(artifact));
    }
    return classifier;
}
let classifierStateGQL = new type_1.GraphQLList(ArtifactTypeDTy.gql);
const ClassiferStateDTy = (0, types_1.AnyDTy)(classifierStateGQL);
exports.Descriptor2025 = new descriptor_1.Descriptor({
    season: Season_1.Season.Decode,
    seasonName: "Decode",
    hasRemote: false,
    hasEndgame: false,
    pensSubtract: false,
    rankings: {
        rp: "DecodeRP",
        tb: "AvgNpBase",
    },
    rankingPoints: [
        {
            id: "movementRp",
            name: "Movement Ranking Point",
        },
        {
            id: "goalRp",
            name: "Goal Ranking Point",
        },
        {
            id: "patternRp",
            name: "Pattern Ranking Point",
        },
    ],
    firstDate: new Date("2025-09-06"),
    lastDate: new Date("2026-09-01"),
    kickoff: new Date("2025-09-06"),
})
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoLeavePoints" })
    .addMatchScore({
    fromApi: (api) => api.autoLeavePoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Leave Points",
    columnPrefix: "Auto Leave",
    fullName: "Auto Leave Points",
})
    .addTep({
    columnPrefix: "Auto Leave",
    dialogName: "Leave Points",
    fullName: "Auto Leave Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoLeave1" })
    .addMatchScore({
    fromApi: (api) => leavePoints(api.robot1Auto),
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Leave 1",
    fullName: "Robot 1 Auto Leave Points",
    getTitle: (ms) => formatLeave(ms.autoLeave1),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoLeave2" })
    .addMatchScore({
    fromApi: (api) => leavePoints(api.robot2Auto),
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Leave 2",
    fullName: "Robot 2 Auto Leave Points",
    getTitle: (ms) => formatLeave(ms.autoLeave2),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoLeavePointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station_1.Station.One ? ms.autoLeave1 : station == Station_1.Station.Two ? ms.autoLeave2 : 0,
    columnPrefix: "Auto Leave Individual",
    dialogName: "Individual",
    fullName: "Auto Leave Points Individual",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoArtifactPoints" })
    .addMatchScore({
    fromApi: (api) => api.autoArtifactPoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Artifacts",
    columnPrefix: "Auto Artifact",
    fullName: "Auto Artifact Points",
})
    .addTep({
    columnPrefix: "Auto Artifact",
    fullName: "Auto Artifact Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoArtifactClassifiedPoints" })
    .addMatchScore({
    fromApi: (api) => api.autoClassifiedArtifacts * 3,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Classified",
    columnPrefix: "Auto Artifact Classified",
    fullName: "Auto Classified Artifact Points",
})
    .addTep({
    columnPrefix: "Auto Artifact Classified",
    fullName: "Auto Classified Artifact Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoArtifactOverflowPoints" })
    .addMatchScore({
    fromApi: (api) => api.autoOverflowArtifacts * 1,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Overflow",
    columnPrefix: "Auto Artifact Overflow",
    fullName: "Auto Overflow Artifact Points",
})
    .addTep({
    columnPrefix: "Auto Artifact Overflow",
    fullName: "Auto Overflow Artifact Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoPatternPoints" })
    .addMatchScore({
    fromApi: (api) => api.autoPatternPoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Pattern",
    columnPrefix: "Auto Pattern",
    fullName: "Auto Pattern Points",
})
    .addTep({
    columnPrefix: "Auto Pattern",
    fullName: "Auto Pattern Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoClassifierState" }).addMatchScore({
    fromApi: (api) => classifierStateFromApi(api.autoClassifierState),
    dataTy: ClassiferStateDTy,
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcBasePoints" })
    .addMatchScore({
    fromApi: (api) => api.teleopBasePoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Base Points",
    columnPrefix: "DC Base",
    fullName: "DC Base Points",
})
    .addTep({
    columnPrefix: "DC Base",
    fullName: "DC Base Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcBase1" })
    .addMatchScore({
    fromApi: (api) => basePoints(api.robot1Teleop),
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "DC Base 1",
    fullName: "Robot 1 Base Points",
    getTitle: (ms) => formatBase(ms.dcBase1),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcBase2" })
    .addMatchScore({
    fromApi: (api) => basePoints(api.robot2Teleop),
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "DC Base 2",
    fullName: "Robot 2 Base Points",
    getTitle: (ms) => formatBase(ms.dcBase2),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcBaseBonus" })
    .addMatchScore({
    fromApi: (api) => baseBonus(api.robot1Teleop, api.robot2Teleop),
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Bonus",
    columnPrefix: "DC Base Bonus",
    fullName: "DC Base Bonus Points",
})
    .addTep({
    columnPrefix: "DC Base Bonus",
    dialogName: "Bonus",
    fullName: "DC Base Bonus Points",
    make: (ms) => { var _a; return (_a = ms.dcBaseBonus) !== null && _a !== void 0 ? _a : 0; },
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcBasePointsIndividual" }).addTep({
    isIndividual: true,
    make: (ms, station) => station == Station_1.Station.One ? ms.dcBase1 : station == Station_1.Station.Two ? ms.dcBase2 : 0,
    columnPrefix: "DC Base Individual",
    dialogName: "Individual",
    fullName: "DC Base Points Individual",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcBasePointsCombined" }).addTep({
    columnPrefix: "DC Base Combined",
    dialogName: "Combined",
    fullName: "DC Base Points Combined",
    make: (ms) => { var _a, _b; return ((_a = ms.dcBase1) !== null && _a !== void 0 ? _a : 0) + ((_b = ms.dcBase2) !== null && _b !== void 0 ? _b : 0); },
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcArtifactPoints" })
    .addMatchScore({
    fromApi: (api) => api.teleopArtifactPoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Artifacts",
    columnPrefix: "DC Artifact",
    fullName: "DC Artifact Points",
})
    .addTep({
    columnPrefix: "DC Artifact",
    fullName: "DC Artifact Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcArtifactClassifiedPoints" })
    .addMatchScore({
    fromApi: (api) => api.teleopClassifiedArtifacts * 3,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Classified",
    columnPrefix: "DC Artifact Classified",
    fullName: "DC Classified Artifact Points",
})
    .addTep({
    columnPrefix: "DC Artifact Classified",
    fullName: "DC Classified Artifact Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcArtifactOverflowPoints" })
    .addMatchScore({
    fromApi: (api) => api.teleopOverflowArtifacts * 1,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Overflow",
    columnPrefix: "DC Artifact Overflow",
    fullName: "DC Overflow Artifact Points",
})
    .addTep({
    columnPrefix: "DC Artifact Overflow",
    fullName: "DC Overflow Artifact Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcPatternPoints" })
    .addMatchScore({
    fromApi: (api) => api.teleopPatternPoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Pattern",
    columnPrefix: "DC Pattern",
    fullName: "DC Pattern Points",
})
    .addTep({
    columnPrefix: "DC Pattern",
    fullName: "DC Pattern Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcDepotPoints" })
    .addMatchScore({
    fromApi: (api) => api.teleopDepotPoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Depot",
    columnPrefix: "DC Depot",
    fullName: "DC Depot Points",
})
    .addTep({
    columnPrefix: "DC Depot",
    fullName: "DC Depot Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcClassifierState" }).addMatchScore({
    fromApi: (api) => classifierStateFromApi(api.teleopClassifierState),
    dataTy: ClassiferStateDTy,
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "movementRp", tradOnly: true })
    .addMatchScore({
    fromApi: (api) => api.movementRP,
    dataTy: types_1.BoolDTy,
})
    .addTep({
    columnPrefix: "Movement RP",
    fullName: "Movement Ranking Points",
    make: (ms) => (ms.movementRp ? 1 : 0),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "goalRp", tradOnly: true })
    .addMatchScore({
    fromApi: (api) => api.goalRP,
    dataTy: types_1.BoolDTy,
})
    .addTep({
    columnPrefix: "Goal RP",
    fullName: "Goal Ranking Points",
    make: (ms) => (ms.goalRp ? 1 : 0),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "patternRp", tradOnly: true })
    .addMatchScore({
    fromApi: (api) => api.patternRP,
    dataTy: types_1.BoolDTy,
})
    .addTep({
    columnPrefix: "Pattern RP",
    fullName: "Pattern Ranking Points",
    make: (ms) => (ms.patternRp ? 1 : 0),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoPoints" })
    .addMatchScore({
    fromApi: (api) => api.autoPoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Auto Points",
    columnPrefix: "Auto",
    fullName: "Auto Points",
})
    .addTep({
    columnPrefix: "Auto",
    fullName: "Auto Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcPoints" })
    .addMatchScore({
    fromApi: (api) => api.teleopPoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "DC Points",
    columnPrefix: "DC",
    fullName: "Driver-Controlled Points",
})
    .addTep({
    columnPrefix: "Teleop",
    dialogName: "Teleop Points",
    fullName: "Driver-Controlled Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsCommitted" })
    .addMatchScore({
    fromApi: (api) => api.minorFouls,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsCommitted" })
    .addMatchScore({
    fromApi: (api) => api.majorFouls,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsByOpp" })
    .addMatchScore({
    fromApi: (_, api) => api.minorFouls,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsByOpp" })
    .addMatchScore({
    fromApi: (_, api) => api.majorFouls,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsCommittedPoints" })
    .addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points Committed",
    sql: (ms) => `(${ms}.majorsCommitted * 15)`,
    getValue: (ms) => ms.majorsCommitted * 15,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.majorsCommitted, "Major Committed", "Majors Committed"),
})
    .addTep({
    make: (ms) => ms.majorsCommitted * 15,
    columnPrefix: "Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points Committed",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsCommittedPoints" })
    .addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalty Points Committed",
    sql: (ms) => `(${ms}.minorsCommitted * 5)`,
    getValue: (ms) => ms.minorsCommitted * 5,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.minorsCommitted, "Minor Committed", "Minors Committed"),
})
    .addTep({
    make: (ms) => ms.minorsCommitted * 5,
    columnPrefix: "Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points Committed",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "penaltyPointsCommitted" })
    .addMatchScore({
    fromSelf: (self) => self.majorsCommitted * 15 + self.minorsCommitted * 5,
    dataTy: types_1.Int16DTy,
})
    .addTep({
    columnPrefix: "Penalties Committed",
    dialogName: "Penalty Points",
    fullName: "Penalty Points Committed",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsByOppPoints" })
    .addTep({
    make: (ms) => ms.majorsByOpp * 15,
    columnPrefix: "Opp Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalty Points by Opponent",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsByOppPoints" })
    .addTep({
    make: (ms) => ms.minorsByOpp * 5,
    columnPrefix: "Opp Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalty Points by Opponent",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "penaltyPointsByOpp" })
    .addMatchScore({
    fromSelf: (self) => self.majorsByOpp * 15 + self.minorsByOpp * 5,
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
    fullName: "Penalty Points By Opponent",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "totalPointsNp" })
    .addMatchScore({
    fromSelf: (self) => self.autoPoints + self.dcPoints,
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
    .addTep({
    columnPrefix: "",
    dialogName: "Total Points",
    fullName: "Total Points",
}))
    .addTree([
    { val: "totalPoints", children: [] },
    { val: "totalPointsNp", children: [] },
    {
        val: "autoPoints",
        children: [
            {
                val: "autoLeavePoints",
                children: [
                    { val: "autoLeave1", children: [] },
                    { val: "autoLeave2", children: [] },
                    { val: "autoLeavePointsIndividual", for: "tep", children: [] },
                ],
            },
            {
                val: "autoArtifactPoints",
                children: [
                    { val: "autoArtifactClassifiedPoints", children: [] },
                    { val: "autoArtifactOverflowPoints", children: [] },
                ],
            },
            { val: "autoPatternPoints", children: [] },
        ],
    },
    {
        val: "dcPoints",
        children: [
            {
                val: "dcBasePoints",
                children: [
                    { val: "dcBase1", children: [] },
                    { val: "dcBase2", children: [] },
                    { val: "dcBasePointsIndividual", for: "tep", children: [] },
                    { val: "dcBasePointsCombined", for: "tep", children: [] },
                    { val: "dcBaseBonus", children: [] },
                ],
            },
            {
                val: "dcArtifactPoints",
                children: [
                    { val: "dcArtifactClassifiedPoints", children: [] },
                    { val: "dcArtifactOverflowPoints", children: [] },
                ],
            },
            { val: "dcPatternPoints", children: [] },
            { val: "dcDepotPoints", children: [] },
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
    .addMatchInsightCols([
    "autoArtifactPoints",
    "autoPatternPoints",
    "dcArtifactPoints",
    "dcPatternPoints",
    "dcBasePoints",
], [
    "autoArtifactPoints",
    "autoPatternPoints",
    "dcArtifactPoints",
    "dcPatternPoints",
    "dcBasePoints",
])
    .finish();
//# sourceMappingURL=DecodeDescriptor.js.map