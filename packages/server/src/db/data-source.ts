import { DataSource } from "typeorm";
import { DATABASE_URL, LOGGING, SYNC_DB, DB_TYPE } from "../constants";
import { ENTITIES } from "./entities";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

const baseConfig = {
    synchronize: SYNC_DB,
    logging: LOGGING,
    entities: ENTITIES,
    namingStrategy: new SnakeNamingStrategy(),
};

const config =
    DB_TYPE === "sqlite"
        ? {
              ...baseConfig,
              type: "sqlite" as const,
              database: DATABASE_URL.replace("sqlite:", ""),
          }
        : {
              ...baseConfig,
              type: "postgres" as const,
              url: DATABASE_URL,
          };

export const DATA_SOURCE = new DataSource(config);
