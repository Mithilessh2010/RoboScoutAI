"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Descriptor2019 = void 0;
const Season_1 = require("../../Season");
const descriptor_1 = require("../descriptor");
const types_1 = require("../types");
const Station_1 = require("../../Station");
const n_of_1 = require("../../../utils/format/n-of");
function cappingPoints(level) {
    return level == -1 ? 0 : level + 5;
}
function formatCapLevel(level) {
    return level == -1 ? "No Cap" : (0, n_of_1.nOf)(level, "Level");
}
exports.Descriptor2019 = new descriptor_1.Descriptor({
    season: Season_1.Season.Skystone,
    seasonName: "Skystone",
    hasRemote: false,
    hasEndgame: true,
    pensSubtract: false,
    rankings: {
        rp: "Record",
        tb: "LosingScore",
    },
    firstDate: new Date("2019-05-10"),
    lastDate: new Date("2020-05-02"),
    kickoff: new Date("2019-09-07"),
})
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoNav1" })
    .addMatchScore({
    apiName: "autoNav2019_1",
    fromApi: (api) => api.robot1Navigated,
    dataTy: types_1.BoolDTy,
})
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Auto Nav 1",
    fullName: "Robot 1 Auto Navigation Points",
    getValue: (ms) => ms.autoNav2019_1 * 5,
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoNav2" })
    .addMatchScore({
    apiName: "autoNav2019_2",
    fromApi: (api) => api.robot2Navigated,
    dataTy: types_1.BoolDTy,
})
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Auto Nav 2",
    fullName: "Robot 2 Auto Navigation Points",
    getValue: (ms) => ms.autoNav2019_2 * 5,
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "repositioned" })
    .addMatchScore({ fromApi: (api) => api.foundationRepositioned, dataTy: types_1.BoolDTy })
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoDelivered" })
    .addMatchScore({ fromApi: (api) => api.autoDelivered, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Regular Stones",
    columnPrefix: "Auto Regular",
    fullName: "Auto Regular Stone Delivery Points",
    getValue: (ms) => (ms.autoDelivered - ms.autoSkystonesDeliveredFirst) * 2,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.autoDelivered - ms.autoSkystonesDeliveredFirst, "Stone"),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoSkystonesDeliveredFirst" })
    .addMatchScore({
    fromApi: (api) => api.autoStones
        ? +(api.autoStones[0] == "SKYSTONE") + +(api.autoStones[1] == "SKYSTONE")
        : 0,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Skystones",
    columnPrefix: "Auto Skystones",
    fullName: "Auto Skystone Delivery Points",
    getValue: (ms) => ms.autoSkystonesDeliveredFirst * 10,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.autoSkystonesDeliveredFirst, "Skystone"),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoReturned" })
    .addMatchScore({ fromApi: (api) => api.autoReturned, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Returned",
    columnPrefix: "Auto Returned",
    fullName: "Auto Stone Return Points",
    getValue: (ms) => ms.autoReturned * -2 + ms.autoFirstReturnedSkystone * -8,
    getTitle: (ms) => ms.autoFirstReturnedSkystone
        ? `${(0, n_of_1.nOf)(ms.autoReturned, "Stone")} and 1 Skystone`
        : (0, n_of_1.nOf)(ms.autoReturned, "Stone"),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoFirstReturnedSkystone" })
    .addMatchScore({ fromApi: (api) => api.firstReturnedIsSkystone, dataTy: types_1.BoolDTy })
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoPlaced" })
    .addMatchScore({ fromApi: (api) => api.autoPlaced, dataTy: types_1.Int16DTy })
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcDelivered" })
    .addMatchScore({
    fromApi: (api) => api.driverControlledDelivered,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Delivered",
    columnPrefix: "DC Delivered",
    fullName: "Teleop Delivery Points",
    getTitle: (ms) => (0, n_of_1.nOf)(ms.dcDelivered, "Stone"),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcReturned" })
    .addMatchScore({
    fromApi: (api) => api.driverControlledReturned,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Returned",
    columnPrefix: "DC Returned",
    fullName: "Teleop Stone Return Points",
    getValue: (ms) => -ms.dcReturned,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.dcReturned, "Stone"),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcPlaced" })
    .addMatchScore({ fromApi: (api) => api.driverControlledPlaced, dataTy: types_1.Int16DTy })
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "skyscraperHeight" })
    .addMatchScore({ fromApi: (api) => api.tallestSkyscraper, dataTy: types_1.Int16DTy })
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "capLevel1" })
    .addMatchScore({ fromApi: (api) => api.robot1CapstoneLevel, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Cap 1",
    fullName: "Robot 1 Capping Points",
    getValue: (ms) => cappingPoints(ms.capLevel1),
    getTitle: (ms) => formatCapLevel(ms.capLevel1),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "capLevel2" })
    .addMatchScore({ fromApi: (api) => api.robot2CapstoneLevel, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Cap 2",
    fullName: "Robot 2 Capping Points",
    getValue: (ms) => cappingPoints(ms.capLevel2),
    getTitle: (ms) => formatCapLevel(ms.capLevel2),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egFoundationMoved" })
    .addMatchScore({ fromApi: (api) => api.foundationMoved, dataTy: types_1.BoolDTy })
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egParked1" })
    .addMatchScore({ fromApi: (api) => api.robot1Parked, dataTy: types_1.BoolDTy })
    .addScoreModal({
    displayName: "Robot 1",
    columnPrefix: "Endgame Park 1",
    fullName: "Robot 1 Endgame Parking Points",
    getValue: (ms) => ms.egParked1 * 5,
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egParked2" })
    .addMatchScore({ fromApi: (api) => api.robot2Parked, dataTy: types_1.BoolDTy })
    .addScoreModal({
    displayName: "Robot 2",
    columnPrefix: "Endgame Park 2",
    fullName: "Robot 2 Endgame Parking Points",
    getValue: (ms) => ms.egParked2 * 5,
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsCommitted" })
    .addMatchScore({ fromApi: (api) => api.minorPenalties, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalty Points",
    getValue: (ms) => ms.minorsCommitted * 5,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.minorsCommitted, "Minor Committed", "Minors Committed"),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsCommitted" })
    .addMatchScore({ fromApi: (api) => api.majorPenalties, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalty Points",
    getValue: (ms) => ms.majorsCommitted * 20,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.majorsCommitted, "Major Committed", "Majors Committed"),
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsCommittedPoints" })
    .addScoreModal({
    displayName: "Majors Points",
    columnPrefix: "Majors",
    fullName: "Major Penalties Committed Points",
    sql: (ms) => `(${ms}.majorsCommitted * 20)`,
    getValue: (ms) => ms.majorsCommitted * 20,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.majorsCommitted, "Major Committed", "Majors Committed"),
})
    .addTep({
    make: (ms) => ms.majorsCommitted * 20,
    columnPrefix: "Majors Committed",
    dialogName: "Majors",
    fullName: "Major Penalties Committed Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsCommittedPoints" })
    .addScoreModal({
    displayName: "Minors Points",
    columnPrefix: "Minors",
    fullName: "Minor Penalties Committed Points",
    sql: (ms) => `(${ms}.minorsCommitted * 5)`,
    getValue: (ms) => ms.minorsCommitted * 5,
    getTitle: (ms) => (0, n_of_1.nOf)(ms.minorsCommitted, "Minor Committed", "Minors Committed"),
})
    .addTep({
    make: (ms) => ms.minorsCommitted * 5,
    columnPrefix: "Minors Committed",
    dialogName: "Minors",
    fullName: "Minor Penalties Committed Points",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "penaltyPointsCommitted" })
    .addMatchScore({
    fromSelf: (self) => self.minorsCommitted * 5 + self.majorsCommitted * 20,
    dataTy: types_1.Int16DTy,
})
    .addTep({
    columnPrefix: "Penalties Committed",
    dialogName: "Penalty Points",
    fullName: "Penalty Points Committed",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "minorsByOpp" })
    .addMatchScore({ fromApi: (_, oth) => oth.minorPenalties, dataTy: types_1.Int16DTy })
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsByOpp" })
    .addMatchScore({ fromApi: (_, oth) => oth.majorPenalties, dataTy: types_1.Int16DTy })
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "majorsByOppPoints" })
    .addTep({
    make: (ms) => ms.majorsByOpp * 20,
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
    fromSelf: (self) => self.minorsByOpp * 5 + self.majorsByOpp * 20,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Penalties",
    columnPrefix: "Penalties",
    fullName: "Penalty Points by Opponent",
})
    .addTep({
    columnPrefix: "Opp Penalties Committed",
    dialogName: "Opp Penalty Points",
    fullName: "Penalty Points by Opponent",
}))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoNavPoints" })
    .addMatchScore({
    fromSelf: (self) => self.autoNav2019_1 * 5 + self.autoNav2019_2 * 5,
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
    make: (ms, station) => station == Station_1.Station.One ? ms.autoNav2019_1 * 5 : ms.autoNav2019_2 * 5,
    columnPrefix: "Auto Nav Individual",
    dialogName: "Individual",
    fullName: "Auto Navigation Points Individual",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoRepositioningPoints" })
    .addMatchScore({ fromSelf: (self) => self.repositioned * 10, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Repositioning Points",
    columnPrefix: "Auto Reposition",
    fullName: "Auto Repositioning Points",
})
    .addTep({ columnPrefix: "Auto Reposition", fullName: "Auto Repositioning Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoDeliveryPoints" })
    .addMatchScore({
    fromSelf: (self) => self.autoDelivered * 2 +
        self.autoSkystonesDeliveredFirst * 8 -
        self.autoReturned * 2 -
        self.autoFirstReturnedSkystone * 8,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Delivery Points",
    columnPrefix: "Auto Delivery",
    fullName: "Auto Delivery Points",
})
    .addTep({ columnPrefix: "Auto Delivery", fullName: "Auto Delivery Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoPlacementPoints" })
    .addMatchScore({ fromSelf: (self) => self.autoPlaced * 4, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Placement Points",
    columnPrefix: "Auto Placement",
    fullName: "Auto Placement Points",
    getTitle: (ms) => (0, n_of_1.nOf)(ms.autoPlaced, "Stone"),
})
    .addTep({ columnPrefix: "Auto Placement", fullName: "Auto Placement Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcDeliveryPoints" })
    .addMatchScore({
    fromSelf: (self) => self.dcDelivered - self.dcReturned,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Delivery Points",
    columnPrefix: "Delivery",
    fullName: "Teleop Delivery Points",
})
    .addTep({ columnPrefix: "Delivery", fullName: "Teleop Delivery Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcPlacementPoints" })
    .addMatchScore({ fromSelf: (self) => self.dcPlaced, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Placement Points",
    columnPrefix: "Placement",
    fullName: "Teleop Placement Points",
    getTitle: (ms) => (0, n_of_1.nOf)(ms.dcPlaced, "Stone"),
})
    .addTep({ columnPrefix: "Placement", fullName: "Teleop Placement Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "skyscraperBonusPoints" })
    .addMatchScore({ fromSelf: (self) => self.skyscraperHeight * 2, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Skyscraper Points",
    columnPrefix: "Skyscraper",
    fullName: "Skyscraper Bonus Points",
    getTitle: (ms) => (0, n_of_1.nOf)(ms.skyscraperHeight, "Level"),
})
    .addTep({ columnPrefix: "Skyscraper", fullName: "Skyscraper Bonus Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "cappingPoints" })
    .addMatchScore({
    fromSelf: (self) => cappingPoints(self.capLevel1) + cappingPoints(self.capLevel2),
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Capping Points",
    columnPrefix: "Capping",
    fullName: "Capping Points",
})
    .addTep({ columnPrefix: "Capping", fullName: "Capping Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "cappingPointsIndividual" })
    .addTep({
    isIndividual: true,
    make: (ms, station) => cappingPoints(station == Station_1.Station.One ? ms.capLevel1 : ms.capLevel2),
    columnPrefix: "Capping Individual",
    dialogName: "Individual",
    fullName: "Capping Points Individual",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egParkPoints" })
    .addMatchScore({
    fromSelf: (self) => self.egParked1 * 5 + self.egParked2 * 5,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({
    displayName: "Parking Points",
    columnPrefix: "Parking",
    fullName: "Parking Points",
})
    .addTep({ columnPrefix: "Parking", fullName: "Parking Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egParkPointsIndividual" })
    .addTep({
    isIndividual: true,
    make: (ms, station) => station == Station_1.Station.One ? ms.egParked1 * 5 : ms.egParked2 * 5,
    columnPrefix: "Parking Individual",
    dialogName: "Individual",
    fullName: "Parking Points Individual",
})
    .finish())
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egFoundationMovedPoints" })
    .addMatchScore({ fromSelf: (self) => self.egFoundationMoved * 15, dataTy: types_1.Int16DTy })
    .addScoreModal({
    displayName: "Movement Points",
    columnPrefix: "Foundation Moved",
    fullName: "Foundation Moved Points",
})
    .addTep({ columnPrefix: "Foundation Moved", fullName: "Foundation Moved Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "autoPoints" })
    .addMatchScore({
    fromSelf: (self) => self.autoNavPoints +
        self.autoRepositioningPoints +
        self.autoDeliveryPoints +
        self.autoPlacementPoints,
    dataTy: types_1.Int16DTy,
})
    .addScoreModal({ displayName: "Auto", columnPrefix: "Auto", fullName: "Auto Points" })
    .addTep({ columnPrefix: "Auto", dialogName: "Auto Points", fullName: "Auto Points" }))
    .addColumn(new descriptor_1.DescriptorColumn({ name: "dcPoints" })
    .addMatchScore({
    fromSelf: (self) => self.dcDeliveryPoints + self.dcPlacementPoints + self.skyscraperBonusPoints,
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
    .addColumn(new descriptor_1.DescriptorColumn({ name: "egPoints" })
    .addMatchScore({
    fromSelf: (self) => self.cappingPoints + self.egParkPoints + self.egFoundationMovedPoints,
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
                val: "autoDeliveryPoints",
                children: [
                    { val: "autoSkystonesDeliveredFirst", children: [] },
                    { val: "autoDelivered", children: [] },
                    { val: "autoReturned", children: [] },
                ],
            },
            { val: "autoPlacementPoints", children: [] },
            { val: "autoRepositioningPoints", children: [] },
            {
                val: "autoNavPoints",
                children: [
                    { val: "autoNav1", children: [] },
                    { val: "autoNav2", children: [] },
                    { val: "autoNavPointsIndividual", children: [] },
                ],
            },
        ],
    },
    {
        val: "dcPoints",
        children: [
            {
                val: "dcDeliveryPoints",
                children: [
                    { val: "dcDelivered", children: [] },
                    { val: "dcReturned", children: [] },
                ],
            },
            { val: "dcPlacementPoints", children: [] },
            { val: "skyscraperBonusPoints", children: [] },
        ],
    },
    {
        val: "egPoints",
        children: [
            {
                val: "cappingPoints",
                children: [
                    { val: "capLevel1", children: [] },
                    { val: "capLevel2", children: [] },
                    { val: "cappingPointsIndividual", children: [] },
                ],
            },
            { val: "egFoundationMovedPoints", children: [] },
            {
                val: "egParkPoints",
                children: [
                    { val: "egParked1", children: [] },
                    { val: "egParked2", children: [] },
                    { val: "egParkPointsIndividual", children: [] },
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
    .addMatchInsightCols(["autoPlacementPoints", "skyscraperBonusPoints", "cappingPoints"], ["autoPlacementPoints", "skyscraperBonusPoints", "cappingPoints"])
    .finish();
//# sourceMappingURL=SkystoneDescriptor.js.map