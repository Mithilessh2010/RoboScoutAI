"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterGroupTyGQL = exports.FilterOpGQL = exports.SortDirGQL = exports.AwardTypeGQL = exports.TournamentLevelGQL = exports.RegionOptionGQL = exports.RemoteOptionGQL = exports.EventTypeOptionGQL = exports.EventTypeGQL = exports.AllianceRoleGQL = exports.StationGQL = exports.AllianceGQL = void 0;
const common_1 = require("@ftc-scout/common");
const Award_1 = require("../../db/entities/Award");
exports.AllianceGQL = (0, common_1.makeGQLEnum)(common_1.Alliance, "Alliance");
exports.StationGQL = (0, common_1.makeGQLEnum)(common_1.Station, "Station");
exports.AllianceRoleGQL = (0, common_1.makeGQLEnum)(common_1.AllianceRole, "AllianceRole");
exports.EventTypeGQL = (0, common_1.makeGQLEnum)(common_1.EventType, "EventType");
exports.EventTypeOptionGQL = (0, common_1.makeGQLEnum)(common_1.EventTypeOption, "EventTypeOption");
exports.RemoteOptionGQL = (0, common_1.makeGQLEnum)(common_1.RemoteOption, "RemoteOption");
exports.RegionOptionGQL = (0, common_1.makeGQLEnum)(common_1.RegionOption, "RegionOption");
exports.TournamentLevelGQL = (0, common_1.makeGQLEnum)(common_1.TournamentLevel, "TournamentLevel");
exports.AwardTypeGQL = (0, common_1.makeGQLEnum)(Award_1.AwardType, "AwardType");
exports.SortDirGQL = (0, common_1.makeGQLEnum)(common_1.SortDir, "SortDir");
exports.FilterOpGQL = (0, common_1.makeGQLEnum)(common_1.FilterOp, "FilterOp");
exports.FilterGroupTyGQL = (0, common_1.makeGQLEnum)(common_1.FilterGroupTy, "FilterGroupTy");
//# sourceMappingURL=enums.js.map