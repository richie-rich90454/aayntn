import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["tests/**/*.test.ts"],
        environment: "node",
        reporters: "default",
        /*
         * The suite that compiles every page as a template renders the whole
         * site through the Markdown pipeline, which legitimately takes longer
         * than the default budget of a unit test.
         */
        testTimeout: 30_000,
    },
});
