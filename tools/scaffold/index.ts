/**
 * Scaffold a new algorithm.
 *
 * The default workflow for adding an algorithm is: write the lesson, declare
 * its metadata, add the source files, register the visualization, associate
 * the problems, and validate. This script creates the directory structure, the
 * manifest and the starter source files so that only the interesting parts
 * have to be written by hand.
 *
 * Usage:
 *   pnpm run scaffold -- --id searching.lower-bound --title "Lower bound" --subject searching
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { IMPLEMENTATIONS_DIR, ROOT } from "../lib/paths.ts";
import type { LanguageId } from "../../docs/.vitepress/data/types.ts";

const SUBJECTS = [
    "foundations",
    "enumeration",
    "searching",
    "greedy",
    "arrays",
    "range-queries",
    "graphs",
    "trees",
    "dynamic-programming",
    "strings",
    "number-theory",
    "combinatorics",
    "geometry",
    "advanced",
];

const LANGUAGES: { id: LanguageId; extension: string; comment: string }[] = [
    { id: "c", extension: "c", comment: "/* */" },
    { id: "cpp17", extension: "cpp", comment: "//" },
    { id: "java", extension: "java", comment: "//" },
    { id: "python", extension: "py", comment: "#" },
    { id: "pascal", extension: "pas", comment: "{ }" },
    { id: "javascript", extension: "js", comment: "//" },
];

function parseArguments(argv: string[]): Record<string, string> {
    const options: Record<string, string> = {};
    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index]!;
        if (!token.startsWith("--")) continue;
        const key = token.slice(2);
        const value = argv[index + 1]!;
        if (value === undefined || value.startsWith("--")) {
            options[key] = "true";
        } else {
            options[key] = value;
            index += 1;
        }
    }
    return options;
}

async function main() {
    const options = parseArguments(process.argv.slice(2));

    const id = options["id"];
    const title = options["title"];
    const subject = options["subject"] ?? "foundations";

    if (!id || !title) {
        process.stderr.write(
            'usage: scaffold --id <dotted.id> --title "<Title>" --subject <subject>\n',
        );
        process.exit(1);
    }
    if (!/^[a-z0-9]+(?:\.[a-z0-9]+)+$/.test(id)) {
        process.stderr.write(
            "the identifier must be lowercase dotted segments, for example graphs.dijkstra\n",
        );
        process.exit(1);
    }
    if (!SUBJECTS.includes(subject)) {
        process.stderr.write(`the subject must be one of: ${SUBJECTS.join(", ")}\n`);
        process.exit(1);
    }

    const segments = id.split(".");
    const directory = join(IMPLEMENTATIONS_DIR, ...segments);
    await mkdir(directory, { recursive: true });

    const manifest = `algorithm: ${id}
title: ${title}
summary: >
  One sentence that says what the algorithm computes and under what conditions.
subject: ${subject}
divisions: [silver]
importance: common-contest-technique
prerequisites:
  required: []
  recommended: []
complexity:
  time: "O(n log n)"
  space: "O(n)"
assumptions:
  - The input satisfies the condition the algorithm depends on.
reviewed: false
variants:
${LANGUAGES.map(
    (language) => `  - id: minimal
    language: ${language.id}
    file: ${language.id}/minimal.${language.extension}
    kind: minimal
    recommended: recommended
    reason: "Say precisely why this form is the one to reach for."
    time: "O(n log n)"
    auxiliarySpace: "O(n)"
    status: unverified
    inputs: "Describe what the reusable form expects."
    outputs: "Describe what it returns.",
    notes: "Record the language-specific detail a reader would otherwise get wrong.",
    operations: []`,
).join("\n")}
`;
    await writeFile(join(directory, "algorithm.yaml"), manifest, "utf8");

    for (const language of LANGUAGES) {
        const languageDir = join(directory, language.id);
        await mkdir(languageDir, { recursive: true });
        await writeFile(
            join(languageDir, `minimal.${language.extension}`),
            `// ${title}: the reusable implementation.\n//\n` +
                `// Document the contract here: what the function expects, what it returns,\n` +
                `// and the condition under which it is correct.\n\n` +
                `// TODO: implement the algorithm.\n`,
            "utf8",
        );
    }

    const relative = directory
        .slice(ROOT.length + 1)
        .split("\\")
        .join("/");
    process.stdout.write(
        `scaffolded ${relative}\n\n` +
            `Next steps:\n` +
            `  1. Implement the six minimal variants.\n` +
            `  2. Add a program variant per language that follows the shared input contract.\n` +
            `  3. Add the cases to tests/fixtures/cases.yaml.\n` +
            `  4. Write the lesson and point its frontmatter at this manifest.\n` +
            `  5. Run pnpm run validate and pnpm run validate:code.\n`,
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
