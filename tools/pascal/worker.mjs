/**
 * The Pascal worker.
 *
 * The Free Pascal compiler ships as a WebAssembly module, so a Pascal program
 * can be compiled and run without anything being installed on the machine.
 * The compiler cannot read from the console, because a browser console has no
 * input, so the small unit in this directory supplies the missing half: it
 * reads the standard input that the host installs.
 *
 * The unit is injected for the run only. A published listing is an ordinary
 * Free Pascal program that reads from the standard input, and it compiles and
 * runs unchanged under a normal Free Pascal installation.
 *
 * The worker reads a job list from standard input and writes the results to
 * standard output, so that the whole batch costs one process and one
 * compilation of the nine-megabyte compiler binary.
 *
 * Usage:
 *   node --experimental-wasm-exnref --no-warnings tools/pascal/worker.mjs < jobs.json
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext, runInContext } from "node:vm";
import { createCompiler } from "@live-codes/pascal-wasm";

const HERE = dirname(fileURLToPath(import.meta.url));
const SHIM_PATH = join(HERE, "aayntnconsole.pas");

/**
 * Inject the console unit into a program's uses clause, and replace the
 * calls to Halt, which the browser build of the compiler does not provide.
 *
 * The unit has to come first, because a program that already has a uses
 * clause cannot have two.
 */
function injectUnit(source) {
    const usesMatch = /(\buses\s+)([^;]+);/i.exec(source);
    if (usesMatch && usesMatch.index !== undefined) {
        const before = source.slice(0, usesMatch.index);
        const after = source.slice(usesMatch.index + usesMatch[0].length);
        return `${before}${usesMatch[1]}aayntnconsole, ${usesMatch[2]};${after}`;
    }
    const programMatch = /(\bprogram\s+\w+\s*;)/i.exec(source);
    if (programMatch && programMatch.index !== undefined) {
        const before = source.slice(0, programMatch.index + programMatch[0].length);
        const after = source.slice(programMatch.index + programMatch[0].length);
        return `${before}\nuses aayntnconsole;${after}`;
    }
    return `uses aayntnconsole;\n${source}`;
}

/** Replace the calls to Halt with the stand-in the console unit provides. */
function replaceHalt(source) {
    return source.replace(/\bHalt\s*\(/g, "AayntnHalt(");
}

/**
 * Join the captured lines.
 *
 * The compiler writes each line with a line break, and the host receives the
 * line without it, so the break is put back. A program that wrote nothing
 * produced nothing at all.
 */
function joinLines(lines) {
    return lines.length === 0 ? "" : lines.join("\n") + "\n";
}

/** Read the job list from the file named on the command line. */
async function readJobs() {
    const path = process.argv[2];
    if (!path) throw new Error("the worker needs the path of a job file");
    const parsed = JSON.parse(await readFile(path, "utf8"));
    // The file may hold the job list directly or under a `jobs` key.
    return parsed.jobs ?? parsed;
}

const jobs = await readJobs();
const shim = await readFile(SHIM_PATH, "utf8");
const compiler = await createCompiler();

const results = [];

for (const job of jobs) {
    const source = await readFile(job.path, "utf8");
    const compiled = await compiler.compile(replaceHalt(injectUnit(source)), {
        units: { "aayntnconsole.pas": shim },
    });

    if (!compiled.js) {
        const errors = compiled.diagnostics
            .split("\n")
            .filter((line) => /Error|Fatal/.test(line))
            .slice(0, 6)
            .join("\n");
        results.push({
            path: job.path,
            ok: false,
            output: "",
            error: errors || "the program did not compile",
        });
        continue;
    }

    const lines = [];
    const context = createContext({
        console: {
            log: (...args) => lines.push(args.map((value) => String(value)).join(" ")),
            error: () => {},
            warn: () => {},
        },
        // The shim reads the standard input from here.
        aayntnInput: () => job.input,
        Math,
        Date,
        JSON,
        Object,
        Array,
        String,
        Number,
        Boolean,
        Error,
        parseInt,
        parseFloat,
        isNaN,
        setTimeout,
        clearTimeout,
    });

    try {
        runInContext(compiled.js, context, { timeout: 30_000 });
        context.rtl?.run?.();
        results.push({ path: job.path, ok: true, output: joinLines(lines) });
    } catch (error) {
        // A program that stops through Halt raises, and that is a normal end.
        // The message of a Pascal exception arrives in fMessage.
        const message = String(error?.fMessage ?? error?.message ?? error);
        const halt = /^halt (-?\d+)/.exec(message);
        if (halt) {
            results.push({
                path: job.path,
                ok: true,
                output: joinLines(lines),
                exitCode: Number(halt[1]),
            });
            continue;
        }
        results.push({ path: job.path, ok: false, output: joinLines(lines), error: message });
    }
}

process.stdout.write(JSON.stringify({ results }));
