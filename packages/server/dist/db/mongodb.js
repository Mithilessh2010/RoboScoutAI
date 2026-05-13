"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDBConnection = exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants");
let isConnected = false;
let connection = null;
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (isConnected && connection) {
            if (constants_1.LOGGING)
                console.log("Using existing MongoDB connection");
            return connection;
        }
        if (!constants_1.DATABASE_URL) {
            throw new Error("DATABASE_URL environment variable is not set");
        }
        try {
            if (constants_1.LOGGING)
                console.log("Connecting to MongoDB...");
            connection = yield mongoose_1.default.connect(constants_1.DATABASE_URL, {
                maxPoolSize: 10,
                minPoolSize: 2,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            isConnected = true;
            if (constants_1.LOGGING)
                console.log("MongoDB connected successfully");
            return connection;
        }
        catch (error) {
            isConnected = false;
            connection = null;
            console.error("MongoDB connection error:", error);
            throw error;
        }
    });
}
exports.connectDB = connectDB;
function disconnectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (connection) {
            yield mongoose_1.default.disconnect();
            isConnected = false;
            connection = null;
            if (constants_1.LOGGING)
                console.log("MongoDB disconnected");
        }
    });
}
exports.disconnectDB = disconnectDB;
function getDBConnection() {
    if (!connection) {
        throw new Error("Database not connected. Call connectDB() first.");
    }
    return connection;
}
exports.getDBConnection = getDBConnection;
//# sourceMappingURL=mongodb.js.map