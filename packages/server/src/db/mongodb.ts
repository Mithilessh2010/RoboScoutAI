import mongoose from "mongoose";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { DATABASE_URL, LOGGING } from "../constants";

let isConnected = false;
let connection: typeof mongoose | null = null;

export async function connectDB(): Promise<any> {
    if (isConnected && connection) {
        if (LOGGING) console.log("Using existing MongoDB connection");
        return connection;
    }

    const databaseUrl = readRootEnv("DATABASE_URL") || process.env.DATABASE_URL || (DATABASE_URL.startsWith("mongodb://localhost") ? "" : DATABASE_URL);
    if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    try {
        if (LOGGING) console.log("Connecting to MongoDB...");
        
        connection = await mongoose.connect(databaseUrl, {
            // Connection pooling - optimal for serverless
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        isConnected = true;
        if (LOGGING) console.log("MongoDB connected successfully");
        return connection;
    } catch (error) {
        isConnected = false;
        connection = null;
        console.error("MongoDB connection error:", error);
        throw error;
    }
}

function readRootEnv(key: string) {
    let current = process.cwd();
    for (let i = 0; i < 8; i += 1) {
        const envPath = path.join(current, ".env.local");
        if (existsSync(envPath)) {
            const line = readFileSync(envPath, "utf8")
                .split(/\r?\n/)
                .find((entry) => entry.trim().startsWith(`${key}=`));
            if (!line) return "";
            return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
        }
        const parent = path.dirname(current);
        if (parent === current) break;
        current = parent;
    }
    return "";
}

export async function disconnectDB(): Promise<void> {
    if (connection) {
        await mongoose.disconnect();
        isConnected = false;
        connection = null;
        if (LOGGING) console.log("MongoDB disconnected");
    }
}

export function getDBConnection(): any {
    if (!connection) {
        throw new Error("Database not connected. Call connectDB() first.");
    }
    return connection;
}
