import { MongoMemoryReplSet } from "mongodb-memory-server";
import type { TestProject } from "vitest/node";

let replSet: MongoMemoryReplSet | undefined;

/**
 * Starts one throwaway mongod for the whole run. It must be a replica set:
 * join, leave, like and delete use transactions, which a standalone mongod rejects (E13).
 * Each test file connects to its own database on it (see testEnv.ts).
 *
 * Downloads are disabled in package.json ("config.mongodbMemoryServer.runtimeDownload"),
 * because the Windows archive is ~800 MB. Point MONGOMS_SYSTEM_BINARY at a local mongod
 * (7.0 or newer), e.g. "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe".
 */
export async function setup(project: TestProject): Promise<void> {
    replSet = await MongoMemoryReplSet.create({
        replSet: { count: 1, storageEngine: "wiredTiger" },
    });
    project.provide("mongoUri", replSet.getUri());
}

export async function teardown(): Promise<void> {
    await replSet?.stop();
}
