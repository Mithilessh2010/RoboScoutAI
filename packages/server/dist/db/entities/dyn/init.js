"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDynamicEntities = void 0;
const match_score_1 = require("./match-score");
const team_event_participation_1 = require("./team-event-participation");
function initDynamicEntities() {
    (0, match_score_1.initMS)();
    (0, team_event_participation_1.initTep)();
}
exports.initDynamicEntities = initDynamicEntities;
//# sourceMappingURL=init.js.map