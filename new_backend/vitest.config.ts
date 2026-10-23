import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        globalSetup: ["tests/setup/globalSetup.ts"],
        setupFiles: ["tests/setup/testEnv.ts"],
        testTimeout: 20_000,
        // The first run may download a mongod binary; later runs use the cache.
        hookTimeout: 120_000,
    },
});
