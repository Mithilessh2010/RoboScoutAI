"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Descriptor2022 = exports.ConeType = exports.AutoNav2022 = void 0;
const graphql_1 = require("graphql");
const Alliance_1 = require("../../Alliance");
const Season_1 = require("../../Season");
const descriptor_1 = require("../descriptor");
const types_1 = require("../types");
const Station_1 = require("../../Station");
const n_of_1 = require("../../../utils/format/n-of");
exports.AutoNav2022 = {
    None: "None",
    Terminal: "Terminal",
    Signal: "Signal",
    TeamSignal: "TeamSignal",
};
const AutoNav2022DTy = (0, types_1.EnumDTy)(exports.AutoNav2022, "AutoNav2022", "auto_nav_2022_enum");
function autoNav2022FromApi(place, signalSleeve) {
    if (place == "NONE") {
        return exports.AutoNav2022.None;
    }
    else if (place == "SIGNAL_ZONE") {
        return signalSleeve ? exports.AutoNav2022.TeamSignal : exports.AutoNav2022.Signal;
    }
    else {
        return exports.AutoNav2022.Terminal;
    }
}
function autoNav2022Points(autoNav) {
    switch (autoNav) {
        case "None":
            return 0;
        case "Terminal":
            return 2;
        case "Signal":
            return 10;
        case "TeamSignal":
            return 20;
    }
}
function formatAutoNav2022(autoNav) {
    switch (autoNav) {
        case "None":
            return "No Park";
        case "Terminal":
            return "Parked in Terminal";
        case "Signal":
            return "Parked in Signal Zone";
        case "TeamSignal":
            return "Parked in Signal Zone with Custom Sleeve";
    }
}
exports.ConeType = {
    RedCone: "RedCone",
    BlueCone: "BlueCone",
    RedBeacon1: "RedBeacon1",
    BlueBeacon1: "BlueBeacon1",
    RedBeacon2: "RedBeacon2",
    BlueBeacon2: "BlueBeacon2",
};
const ConeTypeDTy = (0, types_1.EnumDTy)(exports.ConeType, "ConeType", "cone_type_enum");
function coneTypeFromApi(coneType, myColor) {
    switch (coneType) {
        case "MY_CONE":
            return myColor == Alliance_1.Alliance.Red ? exports.ConeType.RedCone : exports.ConeType.BlueCone;
        case "OTHER_CONE":
            return myColor == Alliance_1.Alliance.Red ? exports.ConeType.BlueCone : exports.ConeType.RedCone;
        case "MY_R1_BEACON":
            return myColor == Alliance_1.Alliance.Red ? exports.ConeType.RedBeacon1 : exports.ConeType.BlueBeacon1;
        case "MY_R2_BEACON":
            return myColor == Alliance_1.Alliance.Red ? exports.ConeType.RedBeacon2 : exports.ConeType.BlueBeacon2;
        case "OTHER_R1_BEACON":
            return myColor == Alliance_1.Alliance.Red ? exports.ConeType.BlueBeacon1 : exports.ConeType.RedBeacon1;
        case "OTHER_R2_BEACON":
            return myColor == Alliance_1.Alliance.Red ? exports.ConeType.BlueBeacon2 : exports.ConeType.RedBeacon2;
    }
}
function junctionsFromApi(api, myAlliance) {
    let res = [
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
        [[], [], [], [], []],
    ];
    for (let x = 0; x < 5; x++) {
        for (let y = 0; y < 5; y++) {
            if (api.length > x && api[x].length > y) {
                for (let c of api[x][y]) {
                    res[4 - y][4 - x].push(coneTypeFromApi(c, myAlliance));
                }
            }
        }
    }
    return res;
}
let coneLayoutGQL = new graphql_1.GraphQLObjectType({
    name: "ConeLayout",
    fields: {
        redNearTerminal: types_1.IntTy,
        redFarTerminal: types_1.IntTy,
        blueNearTerminal: types_1.IntTy,
        blueFarTerminal: types_1.IntTy,
        junctions: (0, types_1.listTy)((0, types_1.listTy)((0, types_1.listTy)({ type: (0, types_1.nn)(ConeTypeDTy.gql) }))),
    },
});
const ConeLayoutDTy = (0, types_1.AnyDTy)(coneLayoutGQL);
function coneLayoutFromDb(red, blue, auto) {
    return {
        redNearTerminal: auto ? red.autoTerminalCones : red.dcNearTerminalCones,
        redFarTerminal: auto ? 0 : red.dcFarTerminalCones,
        blueNearTerminal: auto ? blue.autoTerminalCones : blue.dcNearTerminalCones,
        blueFarTerminal: auto ? 0 : blue.dcFarTerminalCones,
        junctions: auto ? red.autoConeLayout : red.dcConeLayout,
    };
}
exports.Descriptor2022 = new descriptor_1.Descriptor({
    season: Season_1.Season.PowerPlay,
    seasonName: "Power Play",
    hasRemote: false,
    hasEndgame: true,
    pensSubtract: false,
    rankings: {
        rp: "Record",
        tb: "AutoEndgameAvg",
    },
    firstDate: new Date("2022-09-10"),
    lastDate: new Date("2023-09-05"),
    kickoff: new Date("2022-09-10"),
})
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoNav1" })
    .addMatchScore({
    apiName: "autoNav2022_1",
    remoteApiName: "autoNav2022",
    fromApi: (api) => autoNav2022FromApi(api.robot1Auto, api.initSignalSleeve1),
    dataTy: AutoNav2022DTy,
})
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Nav 1",
    fullName: "Robot 1 Auto Navigation Points",
    getValue: (ms) => autoNav2022Points(ms.autoNav2022_1),
    getTitle: (ms) => formatAutoNav2022(ms.autoNav2022_1),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoNav2" })
    .addMatchScore({
    apiName: "autoNav2022_2",
    fromApi: (api) => autoNav2022FromApi(api.robot2Auto, api.initSignalSleeve2),
    dataTy: AutoNav2022DTy,
})
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Nav 2",
    fullName: "Robot 2 Auto Navigation Points",
    getValue: (ms) => autoNav2022Points(ms.autoNav2022_2),
    getTitle: (ms) => formatAutoNav2022(ms.autoNav2022_2),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoTerminalCones" })
    .addMatchScore({
    fromApi: (api) => api.autoTerminal,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoGroundCones" })
    .addMatchScore({
    fromApi: (api) => api.autoJunctionCones[0],
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoLowCones" })
    .addMatchScore({
    fromApi: (api) => api.autoJunctionCones[1],
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoMediumCones" })
    .addMatchScore({
    fromApi: (api) => api.autoJunctionCones[2],
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoHighCones" })
    .addMatchScore({
    fromApi: (api) => api.autoJunctionCones[3],
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoConeLayout" })
    .addMatchScore({
    outer: true,
    fromApi: (api) => junctionsFromApi(api.autoJunctions, api.alliance),
    dataTy: ConeLayoutDTy,
    apiMap: (r, b) => coneLayoutFromDb(r, b, true),
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcNearTerminalCones" })
    .addMatchScore({
    fromApi: (api) => api.dcTerminalNear,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcFarTerminalCones" })
    .addMatchScore({
    fromApi: (api) => api.dcTerminalFar,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcTerminalCones" })
    .addMatchScore({
    fromSelf: (self) => self.dcNearTerminalCones + self.dcFarTerminalCones,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcGroundCones" })
    .addMatchScore({
    fromApi: (api) => api.dcJunctionCones[0],
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcLowCones" })
    .addMatchScore({
    fromApi: (api) => api.dcJunctionCones[1],
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcMediumCones" })
    .addMatchScore({
    fromApi: (api) => api.dcJunctionCones[2],
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcHighCones" })
    .addMatchScore({
    fromApi: (api) => api.dcJunctionCones[3],
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcConeLayout" })
    .addMatchScore({
    outer: true,
    fromApi: (api) => junctionsFromApi(api.dcJunctions, api.alliance),
    dataTy: ConeLayoutDTy,
    apiMap: (r, b) => coneLayoutFromDb(r, b, false),
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egNav1" })
    .addMatchScore({
    remoteApiName: "egNav",
    fromApi: (api) => api.egNavigated1,
    dataTy: types_1.BoolDTy,
})
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Endgame Nav 1",
    fullName: "Robot 1 Endgame Navigation Points",
    getValue: (ms) => ms.egNav1 * 2,
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egNav2" })
    .addMatchScore({
    fromApi: (api) => api.egNavigated2,
    dataTy: types_1.BoolDTy,
})
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Endgame Nav 2",
    fullName: "Robot 2 Endgame Navigation Points",
    getValue: (ms) => ms.egNav2 * 2,
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "coneOwnedJunctions" })
    .addMatchScore({
    fromApi: (api) => api.ownedJunctions - api.beacons,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "beaconOwnedJunctions" })
    .addMatchScore({
    fromApi: (api) => api.beacons,
    dataTy: types_1.Int16DTy,
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "circuit" })
    .addMatchScore({
    fromApi: (api) => api.circuit,
    dataTy: types_1.BoolDTy,
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
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoNavPoints" })
    .addMatchScore({
    fromSelf: (self) => "autoNav2022" in self
        ? autoNav2022Points(self.autoNav2022)
        : autoNav2022Points(self.autoNav2022_1) +
            autoNav2022Points(self.autoNav2022_2),
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
    make: (ms, station) => station == Station_1.Station.One
        ? autoNav2022Points(ms.autoNav2022_1)
        : station == Station_1.Station.Solo
            ? autoNav2022Points(ms.autoNav2022)
            : autoNav2022Points(ms.autoNav2022_2),
    columnPrefix: "Auto Nav Individual",
    dialogName: "Individual",
    fullName: "Auto Navigation Points Individual",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoConePoints" })
    .addMatchScore({
    fromSelf: (self) => self.autoTerminalCones * 1 +
        self.autoGroundCones * 2 +
        self.autoLowCones * 3 +
        self.autoMediumCones * 4 +
        self.autoHighCones * 5,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Cone Points",
    columnPrefix: "Auto Cone",
    fullName: "Auto Cone Points",
})
    .addTep({
    columnPrefix: "Auto Cone",
    dialogName: "Cone Points",
    fullName: "Auto Cone Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoTerminalPoints" })
    .addScoreModal({
    displayName: "Terminal",
    columnPrefix: "Auto Terminal",
    fullName: "Auto Terminal Points",
    sql: (ms) => `(${ms}.autoTerminalCones * 1)`,
    getValue: (ms) => ms.autoTerminalCones * 1,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.autoTerminalCones, "Cone"),
})
    .addTep({
    make: (ms) => ms.autoTerminalCones * 1,
    columnPrefix: "Auto Terminal",
    fullName: "Auto Terminal Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoGroundPoints" })
    .addScoreModal({
    displayName: "Ground",
    columnPrefix: "Auto Ground",
    fullName: "Auto Ground Junction Points",
    sql: (ms) => `(${ms}.autoGroundCones * 2)`,
    getValue: (ms) => ms.autoGroundCones * 2,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.autoGroundCones, "Cone"),
})
    .addTep({
    make: (ms) => ms.autoGroundCones * 2,
    columnPrefix: "Auto Ground",
    fullName: "Auto Ground Junction Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoLowPoints" })
    .addScoreModal({
    displayName: "Low",
    columnPrefix: "Auto Low",
    fullName: "Auto Low Junction Points",
    sql: (ms) => `(${ms}.autoLowCones * 3)`,
    getValue: (ms) => ms.autoLowCones * 3,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.autoLowCones, "Cone"),
})
    .addTep({
    make: (ms) => ms.autoLowCones * 3,
    columnPrefix: "Auto Low",
    fullName: "Auto Low Junction Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoMediumPoints" })
    .addScoreModal({
    displayName: "Medium",
    columnPrefix: "Auto Medium",
    fullName: "Auto Medium Junction Points",
    sql: (ms) => `(${ms}.autoMediumCones * 4)`,
    getValue: (ms) => ms.autoMediumCones * 4,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.autoMediumCones, "Cone"),
})
    .addTep({
    make: (ms) => ms.autoMediumCones * 4,
    columnPrefix: "Auto Medium",
    fullName: "Auto Medium Junction Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoHighPoints" })
    .addScoreModal({
    displayName: "High",
    columnPrefix: "Auto High",
    fullName: "Auto High Junction Points",
    sql: (ms) => `(${ms}.autoHighCones * 5)`,
    getValue: (ms) => ms.autoHighCones * 5,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.autoHighCones, "Cone"),
})
    .addTep({
    make: (ms) => ms.autoHighCones * 5,
    columnPrefix: "Auto High",
    fullName: "Auto High Junction Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egNavPoints" })
    .addMatchScore({
    fromSelf: (self) => self.egNav1 * 2 + self.egNav2 * 2,
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
    make: (ms, station) => (station == Station_1.Station.One
        ? ms.egNav1
        : station == Station_1.Station.Solo
            ? ms.egNav
            : ms.egNav2) * 2,
    columnPrefix: "Endgame Nav Individual",
    dialogName: "Individual",
    fullName: "Endgame Navigation Points Individual",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "ownershipPoints" })
    .addMatchScore({
    fromSelf: (self) => self.coneOwnedJunctions * 3 + self.beaconOwnedJunctions * 10,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Ownership Points",
    columnPrefix: "Ownership",
    fullName: "Ownership Points",
})
    .addTep({ columnPrefix: "Ownership", fullName: "Ownership Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "coneOwnershipPoints" })
    .addScoreModal({
    displayName: "Regular",
    columnPrefix: "Cone Ownership",
    fullName: "Cone Ownership Points",
    sql: (ms) => `(${ms}.coneOwnedJunctions * 3)`,
    getValue: (ms) => ms.coneOwnedJunctions * 3,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.coneOwnedJunctions, "Junction"),
})
    .addTep({
    make: (ms) => ms.coneOwnedJunctions * 3,
    columnPrefix: "Regular Ownership",
    fullName: "Cone Ownership Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "beaconOwnershipPoints" })
    .addScoreModal({
    displayName: "Beacon",
    columnPrefix: "Beacon Ownership",
    fullName: "Beacon Ownership Points",
    sql: (ms) => `(${ms}.beaconOwnedJunctions * 10)`,
    getValue: (ms) => ms.beaconOwnedJunctions * 10,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.beaconOwnedJunctions, "Beacon"),
})
    .addTep({
    make: (ms) => ms.beaconOwnedJunctions * 10,
    columnPrefix: "Beacon Ownership",
    fullName: "Beacon Ownership Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "circuitPoints" })
    .addMatchScore({
    fromSelf: (self) => self.circuit * 20,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Circuit Points",
    columnPrefix: "Circuit",
    fullName: "Circuit Points",
})
    .addTep({ columnPrefix: "Circuit", fullName: "Circuit Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsCommittedPoints" })
    .addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points Committed",
    sql: (ms) => `(${ms}.majorsCommitted * 30)`,
    getValue: (ms) => ms.majorsCommitted * 30,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.majorsCommitted, "Major Committed", "Majors Committed"),
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
    fullName: "Minor Penalty Points Committed",
    sql: (ms) => `(${ms}.minorsCommitted * 10)`,
    getValue: (ms) => ms.minorsCommitted * 10,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.minorsCommitted, "Minor Committed", "Minors Committed"),
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
    fullName: "Penalty Points By Opponent",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoPoints" })
    .addMatchScore({
    fromSelf: (self) => self.autoNavPoints + self.autoConePoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({ displayName: "Auto", columnPrefix: "Auto", fullName: "Auto Points" })
    .addTep({ columnPrefix: "Auto", dialogName: "Auto Points", fullName: "Auto Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcPoints" })
    .addMatchScore({
    fromSelf: (self) => self.dcTerminalCones * 1 +
        self.dcGroundCones * 2 +
        self.dcLowCones * 3 +
        self.dcMediumCones * 4 +
        self.dcHighCones * 5,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Driver-Controlled",
    columnPrefix: "Teleop",
    fullName: "Teleop Points",
})
    .addTep({
    columnPrefix: "Teleop",
    dialogName: "Teleop Points",
    fullName: "Teleop Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcTerminalPoints" })
    .addScoreModal({
    displayName: "Terminal",
    columnPrefix: "DC Terminal",
    fullName: "Teleop Terminal Points",
    sql: (ms) => `(${ms}.dcTerminalCones * 1)`,
    getValue: (ms) => ms.dcTerminalCones * 1,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.dcTerminalCones, "Cone"),
})
    .addTep({
    make: (ms) => ms.dcTerminalCones * 1,
    columnPrefix: "DC Terminal",
    fullName: "Teleop Terminal Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcGroundPoints" })
    .addScoreModal({
    displayName: "Ground",
    columnPrefix: "DC Ground",
    fullName: "Teleop Ground Junction Points",
    sql: (ms) => `(${ms}.dcGroundCones * 2)`,
    getValue: (ms) => ms.dcGroundCones * 2,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.dcGroundCones, "Cone"),
})
    .addTep({
    make: (ms) => ms.dcGroundCones * 2,
    columnPrefix: "DC Ground",
    fullName: "Teleop Ground Junction Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcLowPoints" })
    .addScoreModal({
    displayName: "Low",
    columnPrefix: "DC Low",
    fullName: "Teleop Low Junction Points",
    sql: (ms) => `(${ms}.dcLowCones * 3)`,
    getValue: (ms) => ms.dcLowCones * 3,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.dcLowCones, "Cone"),
})
    .addTep({
    make: (ms) => ms.dcLowCones * 3,
    columnPrefix: "DC Low",
    fullName: "Teleop Low Junction Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcMediumPoints" })
    .addScoreModal({
    displayName: "Medium",
    columnPrefix: "DC Medium",
    fullName: "Teleop Medium Junction Points",
    sql: (ms) => `(${ms}.dcMediumCones * 4)`,
    getValue: (ms) => ms.dcMediumCones * 4,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.dcMediumCones, "Cone"),
})
    .addTep({
    make: (ms) => ms.dcMediumCones * 4,
    columnPrefix: "DC Medium",
    fullName: "Teleop Medium Junction Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcHighPoints" })
    .addScoreModal({
    displayName: "High",
    columnPrefix: "DC High",
    fullName: "Teleop High Junction Points",
    sql: (ms) => `(${ms}.dcHighCones * 5)`,
    getValue: (ms) => ms.dcHighCones * 5,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.dcHighCones, "Cone"),
})
    .addTep({
    make: (ms) => ms.dcHighCones * 5,
    columnPrefix: "DC High",
    fullName: "Teleop High Junction Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egPoints" })
    .addMatchScore({
    fromSelf: (self) => self.egNavPoints + self.ownershipPoints + self.circuitPoints,
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
                val: "autoConePoints",
                children: [
                    { val: "autoTerminalPoints", children: [] },
                    { val: "autoGroundPoints", children: [] },
                    { val: "autoLowPoints", children: [] },
                    { val: "autoMediumPoints", children: [] },
                    { val: "autoHighPoints", children: [] },
                ],
            },
        ],
    },
    {
        val: "dcPoints",
        children: [
            { val: "dcTerminalPoints", children: [] },
            { val: "dcGroundPoints", children: [] },
            { val: "dcLowPoints", children: [] },
            { val: "dcMediumPoints", children: [] },
            { val: "dcHighPoints", children: [] },
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
                val: "ownershipPoints",
                children: [
                    { val: "coneOwnershipPoints", children: [] },
                    { val: "beaconOwnershipPoints", children: [] },
                ],
            },
            { val: "circuitPoints", children: [] },
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
    .addMatchInsightCols(["autoConePoints", "circuitPoints"], ["autoConePoints", "circuitPoints"])
    .finish();
//# sourceMappingURL=PowerPlayDescriptor.js.map