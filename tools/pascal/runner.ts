/**
 * The Pascal runner.
 *
 * The Free Pascal compiler is available as a WebAssembly module published on
 * npm, so a Pascal program can be compiled and run without anything being
 * installed on the machine. The compiler needs a Node flag for the
 * WebAssembly exception-handling instructions it uses, and that flag cannot
 * be set through the environment, so the work is done in a child process that
 * carries it.
 */
import { spawn } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WORKER = join(HERE, "worker.mjs");

export interface PascalJob {
    /** The source file. */
    path: string;
    /** The whole of the standard input. */
    input: string;
}

export interface PascalResult {
    path: string;
    ok: boolean;
    output: string;
    error?: string;
}

/** Whether the toolchain is usable on this machine. */
export async function pascalAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
        const child = spawn(
            process.execPath,
            ["--experimental-wasm-exnref", "--no-warnings", "-e", "process.exit(0)"],
            { windowsHide: true },
        );
        child.on("error", () => resolve(false));
        child.on("close", (code) => resolve(code === 0));
    });
}

/**
 * Compile and run a batch of Pascal programs.
 *
 * The whole batch costs one process, because the compiler binary is nine
 * megabytes and is worth compiling once.
 */
export async function runPascalBatch(jobs: PascalJob[]): Promise<PascalResult[]> {
    if (jobs.length === 0) return [];

    const scratch = await mkdtemp(join(tmpdir(), "aayntn-pascal-"));
    const jobFile = join(scratch, "jobs.json");
    await writeFile(jobFile, JSON.stringify({ jobs }), "utf8");

    try {
        return await new Promise((resolve, reject) => {
            const child = spawn(
                process.execPath,
                ["--experimental-wasm-exnref", "--no-warnings", WORKER, jobFile],
                { windowsHide: true },
            );

            let stdout = "";
            let stderr = "";
            child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
            child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
            child.on("error", reject);
            child.on("close", (code) => {
                if (code !== 0) {
                    reject(
                        new Error(`the Pascal worker failed with code ${code}: ${stderr.trim()}`),
                    );
                    return;
                }
                try {
                    resolve(JSON.parse(stdout).results as PascalResult[]);
                } catch {
                    reject(
                        new Error(
                            `the Pascal worker returned an unreadable result: ${stderr.trim()}`,
                        ),
                    );
                }
            });
        });
    } finally {
        await rm(scratch, { recursive: true, force: true });
    }
}
