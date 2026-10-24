/**
 * Compile and run every reference implementation.
 *
 * A listing that does not compile is not a listing, and a listing that
 * compiles but disagrees with the other five languages is worse. This tool
 * does all three things:
 *
 *   1. Compiles each source file with the strictest reasonable flags for its
 *      language.
 *   2. Runs the program variant of every algorithm on the shared fixtures
 *      and compares the output byte for byte across the six languages.
 *   3. Runs the reusable variants, which carry their own self-checks, and
 *      requires a clean exit.
 *
 * A toolchain that is not installed is reported as skipped rather than as a
 * failure, so a contributor without Free Pascal is not blocked; the continuous
 * integration job installs every toolchain it needs.
 */
import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import fg from "fast-glob";
import { parse as parseYaml } from "yaml";
import { IMPLEMENTATIONS_DIR, ROOT, rel } from "../lib/paths.ts";
import { algorithmManifestSchema } from "../lib/schema.ts";
import { runPascalBatch, type PascalJob, type PascalResult } from "../pascal/runner.ts";
import type { LanguageId } from "../../docs/.vitepress/data/types.ts";

/* ------------------------------------------------------------------ */
/* Process helpers                                                     */
/* ------------------------------------------------------------------ */

interface RunResult {
    code: number;
    stdout: string;
    stderr: string;
}

/**
 * The six languages do not agree on the platform line ending: the C and C++
 * standard streams and the Java print methods translate it, while Node writes
 * the byte it is given. The comparison is therefore made on the normalized
 * text, which is what the reader actually sees.
 */
function normalizeNewlines(value: string): string {
    return value.replace(/\r\n/g, "\n");
}

function run(
    command: string,
    args: string[],
    options: { input?: string; cwd?: string; timeoutMs?: number } = {},
): Promise<RunResult> {
    return new Promise((resolve) => {
        const child = spawn(command, args, {
            cwd: options.cwd ?? ROOT,
            shell: process.platform === "win32",
            windowsHide: true,
        });
        let stdout = "";
        let stderr = "";
        child.stdout?.on("data", (chunk) => (stdout += chunk.toString()));
        child.stderr?.on("data", (chunk) => (stderr += chunk.toString()));

        const timer = setTimeout(() => child.kill(), options.timeoutMs ?? 60_000);
        child.on("error", (error) => {
            clearTimeout(timer);
            resolve({ code: 127, stdout, stderr: `${stderr}\n${error.message}` });
        });
        child.on("close", (code) => {
            clearTimeout(timer);
            resolve({ code: code ?? -1, stdout, stderr });
        });

        if (options.input !== undefined) {
            child.stdin?.write(options.input);
            child.stdin?.end();
        }
    });
}

async function which(command: string): Promise<boolean> {
    const probe =
        process.platform === "win32"
            ? spawn("where", [command], { shell: true, windowsHide: true })
            : spawn("which", [command], { shell: false });
    return new Promise((resolve) => {
        probe.on("error", () => resolve(false));
        probe.on("close", (code) => resolve(code === 0));
    });
}

/* ------------------------------------------------------------------ */
/* Language runners                                                    */
/* ------------------------------------------------------------------ */

interface LanguageRunner {
    id: LanguageId;
    /** The command that must exist for this language to be testable. */
    toolchain: string;
    /** Compile the file, throwing an Error with the compiler output on failure. */
    compile(file: string, workDir: string): Promise<void>;
    /** Run the compiled file with the given input, returning its output. */
    execute(file: string, workDir: string, input: string): Promise<RunResult>;
}

const runners: Record<LanguageId, LanguageRunner> = {
    c: {
        id: "c",
        toolchain: "gcc",
        async compile(file, workDir) {
            const binary = join(workDir, "a.out");
            const result = await run("gcc", [
                "-std=c11",
                "-O2",
                "-Wall",
                "-Wextra",
                "-Werror",
                file,
                "-o",
                binary,
                "-lm",
            ]);
            if (result.code !== 0) throw new Error(result.stderr.trim() || "gcc failed");
        },
        async execute(file, workDir, input) {
            return run(join(workDir, "a.out"), [], { input });
        },
    },
    cpp17: {
        id: "cpp17",
        toolchain: "g++",
        async compile(file, workDir) {
            const binary = join(workDir, "a.out");
            const result = await run("g++", [
                "-std=c++17",
                "-O2",
                "-Wall",
                "-Wextra",
                "-Werror",
                file,
                "-o",
                binary,
            ]);
            if (result.code !== 0) throw new Error(result.stderr.trim() || "g++ failed");
        },
        async execute(file, workDir, input) {
            return run(join(workDir, "a.out"), [], { input });
        },
    },
    java: {
        id: "java",
        toolchain: "javac",
        async compile(file, workDir) {
            const result = await run("javac", ["-Xlint:all", "-d", workDir, file]);
            if (result.code !== 0) throw new Error(result.stderr.trim() || "javac failed");
        },
        async execute(file, workDir, input) {
            const className = file.replace(/^.*[\\/]/, "").replace(/\.java$/, "");
            return run("java", ["-cp", workDir, className], { input });
        },
    },
    python: {
        id: "python",
        toolchain: "python",
        async compile() {
            // Python has no compilation step; the syntax check happens at run time.
        },
        async execute(file, workDir, input) {
            return run("python", [file], { input, cwd: workDir });
        },
    },
    pascal: {
        id: "pascal",
        toolchain: "fpc",
        async compile(file, workDir) {
            const result = await run("fpc", [
                "-Mobjfpc",
                "-Sh",
                "-O2",
                `-FE${workDir}`,
                "-FU" + workDir,
                file,
            ]);
            if (result.code !== 0) throw new Error(result.stderr.trim() || "fpc failed");
        },
        async execute(file, workDir, input) {
            const name = file.replace(/^.*[\\/]/, "").replace(/\.pas$/i, "");
            return run(join(workDir, name + ".exe"), [], { input });
        },
    },
    javascript: {
        id: "javascript",
        toolchain: "node",
        async compile() {
            // Node parses the file when it runs it.
        },
        async execute(file, workDir, input) {
            return run("node", [file], { input, cwd: workDir });
        },
    },
};

/* ------------------------------------------------------------------ */
/* Fixtures                                                            */
/* ------------------------------------------------------------------ */

interface Fixture {
    name: string;
    input: string;
    expected?: string;
}

async function loadFixtures(): Promise<Map<string, Fixture[]>> {
    const path = join(ROOT, "tests", "fixtures", "cases.yaml");
    if (!existsSync(path)) return new Map();
    const raw = parseYaml(await readFile(path, "utf8")) as Record<string, Fixture[]>;
    return new Map(Object.entries(raw));
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

interface ManifestEntry {
    algorithm: string;
    file: string;
    directory: string;
    variants: {
        id: string;
        language: LanguageId;
        file: string;
        kind: string;
        status: string;
    }[];
}

async function main() {
    const workRoot = join(ROOT, ".tmp", "validate-code");
    await rm(workRoot, { recursive: true, force: true });
    await mkdir(workRoot, { recursive: true });

    const manifestFiles = await fg("**/algorithm.yaml", {
        cwd: IMPLEMENTATIONS_DIR,
        absolute: true,
        onlyFiles: true,
    });

    const manifests: ManifestEntry[] = [];
    for (const file of manifestFiles.sort()) {
        const parsed = algorithmManifestSchema.parse(parseYaml(await readFile(file, "utf8")));
        manifests.push({
            algorithm: parsed.algorithm,
            file: rel(ROOT, file),
            directory: file.slice(0, -"/algorithm.yaml".length),
            variants: parsed.variants.map((variant) => ({
                id: variant.id,
                language: variant.language,
                file: variant.file,
                kind: variant.kind,
                status: variant.status,
            })),
        });
    }

    const fixtures = await loadFixtures();

    const available = new Map<LanguageId, boolean>();
    for (const runner of Object.values(runners)) {
        available.set(runner.id, await which(runner.toolchain));
    }
    for (const [language, present] of available) {
        if (!present && language !== "pascal") {
            process.stdout.write(
                `skipping ${language}: the ${runners[language].toolchain} toolchain is not installed\n`,
            );
        }
    }

    /*
     * Pascal is handled separately. The Free Pascal compiler is a WebAssembly
     * module published on npm, so it needs no installation, but the browser
     * build of the compiler has no console input and no Halt, so the work is
     * done in a batch by the Pascal runner.
     */
    const pascalJobs: PascalJob[] = [];
    /** The fixture that each Pascal job belongs to, in the same order. */
    const pascalCases: { manifest: ManifestEntry; variant: string; fixture: Fixture | null }[] = [];

    const failures: string[] = [];
    let compiled = 0;
    let skipped = 0;
    let compared = 0;

    for (const manifest of manifests) {
        const cases = fixtures.get(manifest.algorithm) ?? [];

        for (const variant of manifest.variants) {
            if (variant.language === "pascal") {
                if (variant.kind === "program") {
                    for (const fixture of cases) {
                        pascalJobs.push({
                            path: join(manifest.directory, variant.file),
                            input: fixture.input,
                        });
                        pascalCases.push({ manifest, variant: variant.id, fixture });
                    }
                } else {
                    // A reusable variant carries its own self-check, so it runs
                    // once with an empty input and is only required not to fail.
                    pascalJobs.push({
                        path: join(manifest.directory, variant.file),
                        input: "",
                    });
                    pascalCases.push({ manifest, variant: variant.id, fixture: null });
                }
                skipped += 1;
                continue;
            }

            const runner = runners[variant.language];
            if (!available.get(variant.language)) {
                skipped += 1;
                continue;
            }

            const source = join(manifest.directory, variant.file);
            const workDir = join(
                workRoot,
                manifest.algorithm.replace(/\./g, "_"),
                variant.language,
                variant.id,
            );
            await mkdir(workDir, { recursive: true });

            try {
                await runner.compile(source, workDir);
                compiled += 1;
            } catch (error) {
                failures.push(
                    `${manifest.file} [${variant.language}.${variant.id}] did not compile: ${(error as Error).message}`,
                );
                continue;
            }

            if (variant.kind === "program") {
                if (cases.length === 0) {
                    failures.push(
                        `${manifest.file} [${variant.language}.${variant.id}] has no fixture cases to run`,
                    );
                    continue;
                }
                for (const fixture of cases) {
                    const result = await runner.execute(source, workDir, fixture.input);
                    if (result.code !== 0) {
                        failures.push(
                            `${manifest.file} [${variant.language}.${variant.id}] exited with ${result.code} on case "${fixture.name}": ${result.stderr.trim()}`,
                        );
                        continue;
                    }
                    if (
                        fixture.expected !== undefined &&
                        normalizeNewlines(result.stdout) !== fixture.expected
                    ) {
                        failures.push(
                            `${manifest.file} [${variant.language}.${variant.id}] produced the wrong output on case "${fixture.name}".\n` +
                                `  expected: ${JSON.stringify(fixture.expected)}\n` +
                                `  actual:   ${JSON.stringify(normalizeNewlines(result.stdout))}`,
                        );
                    }
                }
            } else {
                // A reusable variant carries its own self-check.
                const result = await runner.execute(source, workDir, "");
                if (result.code !== 0) {
                    failures.push(
                        `${manifest.file} [${variant.language}.${variant.id}] self-check exited with ${result.code}: ${result.stderr.trim()}`,
                    );
                }
            }
        }

        /*
         * Every language of a program variant must produce identical output.
         */
        const programVariants = manifest.variants.filter((variant) => variant.kind === "program");
        for (const fixture of cases) {
            const outputs = new Map<string, string>();
            for (const variant of programVariants) {
                if (variant.language === "pascal") continue;
                if (!available.get(variant.language)) continue;
                const source = join(manifest.directory, variant.file);
                const workDir = join(
                    workRoot,
                    manifest.algorithm.replace(/\./g, "_"),
                    variant.language,
                    variant.id,
                );
                const result = await runners[variant.language]!.execute(
                    source,
                    workDir,
                    fixture.input,
                );
                if (result.code !== 0) continue;
                outputs.set(variant.language, normalizeNewlines(result.stdout));
            }
            const distinct = new Set(outputs.values());
            compared += 1;
            if (distinct.size > 1) {
                const detail = [...outputs.entries()]
                    .map(([language, output]) => `  ${language}: ${JSON.stringify(output)}`)
                    .join("\n");
                failures.push(
                    `${manifest.algorithm} produced different output across languages on case "${fixture.name}":\n${detail}`,
                );
            }
        }
    }

    /*
     * The Pascal listings run last, because the compiler is a WebAssembly
     * module and the whole batch costs one process. The results come back in
     * the order of the jobs, so the two lists line up.
     */
    if (pascalJobs.length > 0) {
        let pascalResults: PascalResult[] = [];
        try {
            pascalResults = await runPascalBatch(pascalJobs);
        } catch (error) {
            failures.push(`the Pascal runner failed: ${(error as Error).message}`);
        }

        /*
         * The results come back in the order of the jobs, so each one is
         * checked against the fixture it belongs to.
         */
        const pascalOutput = new Map<string, string>();
        for (let index = 0; index < pascalResults.length; index += 1) {
            const result = pascalResults[index]!;
            const owner = pascalCases[index];
            if (!owner) continue;
            if (!result.ok) {
                failures.push(
                    `${owner.manifest.file} [pascal.${owner.variant}] did not run on case "${owner.fixture?.name ?? "the self-check"}": ${result.error ?? "unknown error"}`,
                );
                continue;
            }
            compiled += 1;
            const output = normalizeNewlines(result.output);
            if (!owner.fixture) {
                // A reusable variant only has to compile and to run its own
                // self-check without failing.
                continue;
            }
            pascalOutput.set(
                `${owner.manifest.algorithm}|${owner.variant}|${owner.fixture.name}`,
                output,
            );
            if (owner.fixture.expected !== undefined && output !== owner.fixture.expected) {
                failures.push(
                    `${owner.manifest.file} [pascal.${owner.variant}] produced the wrong output on case "${owner.fixture.name}".\n` +
                        `  expected: ${JSON.stringify(owner.fixture.expected)}\n` +
                        `  actual:   ${JSON.stringify(output)}`,
                );
            }
        }

        // Compare the Pascal output with the output of the other languages.
        for (const manifest of manifests) {
            const cases = fixtures.get(manifest.algorithm) ?? [];
            const programVariants = manifest.variants.filter(
                (variant) => variant.kind === "program",
            );
            for (const fixture of cases) {
                const outputs = new Map<string, string>();
                for (const variant of programVariants) {
                    if (!available.get(variant.language)) continue;
                    const source = join(manifest.directory, variant.file);
                    const workDir = join(
                        workRoot,
                        manifest.algorithm.replace(/\./g, "_"),
                        variant.language,
                        variant.id,
                    );
                    const result = await runners[variant.language]!.execute(
                        source,
                        workDir,
                        fixture.input,
                    );
                    if (result.code !== 0) continue;
                    outputs.set(variant.language, normalizeNewlines(result.stdout));
                }
                for (const variant of programVariants) {
                    if (variant.language !== "pascal") continue;
                    const output = pascalOutput.get(
                        `${manifest.algorithm}|${variant.id}|${fixture.name}`,
                    );
                    if (output !== undefined) outputs.set("pascal", output);
                }
                const distinct = new Set(outputs.values());
                compared += 1;
                if (distinct.size > 1) {
                    const detail = [...outputs.entries()]
                        .map(([language, output]) => `  ${language}: ${JSON.stringify(output)}`)
                        .join("\n");
                    failures.push(
                        `${manifest.algorithm} produced different output across languages on case "${fixture.name}":\n${detail}`,
                    );
                }
            }
        }
    }

    if (failures.length > 0) {
        for (const failure of failures) process.stderr.write(`error: ${failure}\n`);
        process.stderr.write(`\n${failures.length} implementation problem(s) found.\n`);
        process.exit(1);
    }

    await rm(workRoot, { recursive: true, force: true });
    process.stdout.write(
        `implementations are valid: ${compiled} compiled, ${compared} cross-language comparisons, ${skipped} skipped\n`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
