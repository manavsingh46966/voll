import mongoose from "mongoose";
import { MONGODB_URI } from "./envConfig.ts";

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

export async function initMongoDB(): Promise<void> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
            console.log("Connected to MongoDB instance.");
            try {
                const eventsColl = mongoose.connection.collection('events');
                const indexes = await eventsColl.indexes();
                for (const idx of indexes) {
                    if (idx.name && (idx.name === 'eventId_1' || (idx.key && 'eventId' in idx.key))) {
                        console.log(`Dropping stale index: ${idx.name}`);
                        await eventsColl.dropIndex(idx.name);
                    }
                }
            } catch {
                // Ignore index inspection error if collection doesn't exist yet
            }
            return;
        } catch (err) {
            const isLast = attempt === MAX_RETRIES;
            console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed.`);
            if (isLast) {
                console.error(
                    "\n  Possible causes:\n" +
                    "  1. Your IP is not whitelisted — Atlas > Network Access > Add Current IP\n" +
                    "  2. Cluster is paused — Atlas > Clusters > Resume\n" +
                    "  3. MONGODB_URI in .env is incorrect\n"
                );
                throw err;
            }
            console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
            await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
        }
    }
}