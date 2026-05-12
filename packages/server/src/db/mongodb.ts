import mongoose from "mongoose";
import { DATABASE_URL, LOGGING } from "../constants";

let isConnected = false;
let connection: typeof mongoose | null = null;

export async function connectDB() {
    if (isConnected && connection) {
        if (LOGGING) console.log("Using existing MongoDB connection");
        return connection;
    }

    if (!DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    try {
        if (LOGGING) console.log("Connecting to MongoDB...");
        
        connection = await mongoose.connect(DATABASE_URL, {
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

export async function disconnectDB() {
    if (connection) {
        await mongoose.disconnect();
        isConnected = false;
        connection = null;
        if (LOGGING) console.log("MongoDB disconnected");
    }
}

export function getDBConnection() {
    if (!connection) {
        throw new Error("Database not connected. Call connectDB() first.");
    }
    return connection;
}
