"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_SOURCE = void 0;
const constants_1 = require("../constants");
const entities_1 = require("./entities");
const typeorm_naming_strategies_1 = require("typeorm-naming-strategies");
const baseConfig = {
    synchronize: constants_1.SYNC_DB,
    logging: constants_1.LOGGING,
    entities: entities_1.ENTITIES,
    namingStrategy: new typeorm_naming_strategies_1.SnakeNamingStrategy(),
};
const config = constants_1.DB_TYPE === "sqlite"
    ? Object.assign(Object.assign({}, baseConfig), { type: "sqlite", database: constants_1.DATABASE_URL.replace("sqlite:", "") }) : Object.assign(Object.assign({}, baseConfig), { type: "postgres", url: constants_1.DATABASE_URL });
exports.DATA_SOURCE = new DataSource(config);
//# sourceMappingURL=data-source.js.map