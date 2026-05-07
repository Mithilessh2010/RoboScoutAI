"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DESCRIPTORS_LIST = exports.DESCRIPTORS = void 0;
const SkystoneDescriptor_1 = require("./seasons/SkystoneDescriptor");
const UltimateGoalDescriptor_1 = require("./seasons/UltimateGoalDescriptor");
const FreightFrenzyDescriptor_1 = require("./seasons/FreightFrenzyDescriptor");
const PowerPlayDescriptor_1 = require("./seasons/PowerPlayDescriptor");
const CenterStageDescriptor_1 = require("./seasons/CenterStageDescriptor");
const IntoTheDeepDescriptor_1 = require("./seasons/IntoTheDeepDescriptor");
const DecodeDescriptor_1 = require("./seasons/DecodeDescriptor");
const Season_1 = require("../Season");
exports.DESCRIPTORS = {
    [Season_1.Season.Decode]: DecodeDescriptor_1.Descriptor2025,
    [Season_1.Season.IntoTheDeep]: IntoTheDeepDescriptor_1.Descriptor2024,
    [Season_1.Season.CenterStage]: CenterStageDescriptor_1.Descriptor2023,
    [Season_1.Season.PowerPlay]: PowerPlayDescriptor_1.Descriptor2022,
    [Season_1.Season.FreightFrenzy]: FreightFrenzyDescriptor_1.Descriptor2021,
    [Season_1.Season.UltimateGoal]: UltimateGoalDescriptor_1.Descriptor2020,
    [Season_1.Season.Skystone]: SkystoneDescriptor_1.Descriptor2019,
};
exports.DESCRIPTORS_LIST = Season_1.ALL_SEASONS.map((s) => exports.DESCRIPTORS[s]);
//# sourceMappingURL=descriptor-list.js.map