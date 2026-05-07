"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_SOURCE = void 0;
const typeorm_1 = require("typeorm");
const constants_1 = require("../constants");
const entities_1 = require("./entities");
const typeorm_naming_strategies_1 = require("typeorm-naming-strategies");
exports.DATA_SOURCE = new typeorm_1.DataSource({
    type: "postgres",
    url: constants_1.DATABASE_URL,
    synchronize: constants_1.SYNC_DB,
    logging: constants_1.LOGGING,
    entities: entities_1.ENTITIES,
    namingStrategy: new typeorm_naming_strategies_1.SnakeNamingStrategy(),
});
//# sourceMappingURL=data-source.js.map