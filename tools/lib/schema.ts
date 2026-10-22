/**
 * Authoritative, validated schemas for every machine-readable artifact in
 * A.A.Y.N.T.N.. These are the contracts that `tools/validate-content` enforces
 * before the site is allowed to build.
 *
 * Keep this file in sync with `docs/.vitepress/data/types.ts`; the two are
 * checked against each other by `tests/content/schema-parity.test.ts`.
 */
import { z } from "zod";

export const languageIdSchema = z.enum(["c", "cpp17", "java", "python", "pascal", "javascript"]);

export const divisionSchema = z.enum(["bronze", "silver", "gold", "platinum"]);

export const importanceSchema = z.enum([
    "core-prerequisite",
    "common-contest-technique",
    "advanced-technique",
    "specialized-technique",
    "extended-reference",
]);

export const subjectSchema = z.enum([
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
]);

export const recommendationSchema = z.enum(["recommended", "conditional", "not-applicable"]);

export const implementationKindSchema = z.enum(["minimal", "program", "educational"]);

export const verificationStatusSchema = z.enum(["verified", "unverified"]);

/* ------------------------------------------------------------------ */
/* Lesson frontmatter                                                  */
/* ------------------------------------------------------------------ */

export const lessonFrontmatterSchema = z.object({
    id: z
        .string()
        .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "lesson ids must be lowercase dotted segments"),
    title: z.string().min(1),
    summary: z.string().min(1).optional(),
    division: z.array(divisionSchema).default([]),
    subjects: z.array(subjectSchema).default([]),
    level: z.enum(["introductory", "intermediate", "advanced"]).default("introductory"),
    importance: importanceSchema.default("core-prerequisite"),
    prerequisites: z
        .object({
            required: z.array(z.string()).default([]),
            recommended: z.array(z.string()).default([]),
        })
        .default({ required: [], recommended: [] }),
    complexity: z
        .object({
            time: z.string().default(""),
            space: z.string().default(""),
        })
        .optional(),
    assumptions: z.array(z.string()).default([]),
    implementations: z.string().optional(),
    visualization: z.string().optional(),
    problems: z.array(z.string()).default([]),
    reviewed: z.boolean().default(false),
    draft: z.boolean().default(false),
});

export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;

/* ------------------------------------------------------------------ */
/* Algorithm implementation manifests                                   */
/* ------------------------------------------------------------------ */

export const algorithmVariantSchema = z.object({
    id: z
        .string()
        .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "variant ids must be lowercase dotted segments"),
    language: languageIdSchema,
    file: z.string().min(1),
    kind: implementationKindSchema.default("minimal"),
    recommended: recommendationSchema.default("conditional"),
    reason: z.string().min(1),
    time: z.string().min(1),
    auxiliarySpace: z.string().min(1),
    status: verificationStatusSchema.default("unverified"),
    inputs: z.string().optional(),
    outputs: z.string().optional(),
    notes: z.string().optional(),
    operations: z.array(z.string()).default([]),
});

export const algorithmManifestSchema = z.object({
    algorithm: z
        .string()
        .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "algorithm ids must be lowercase dotted segments"),
    title: z.string().min(1),
    summary: z.string().min(1),
    subject: subjectSchema,
    divisions: z.array(divisionSchema).default([]),
    importance: importanceSchema.default("common-contest-technique"),
    prerequisites: z
        .object({
            required: z.array(z.string()).default([]),
            recommended: z.array(z.string()).default([]),
        })
        .default({ required: [], recommended: [] }),
    complexity: z.object({
        time: z.string().min(1),
        space: z.string().min(1),
    }),
    assumptions: z.array(z.string()).default([]),
    variants: z.array(algorithmVariantSchema).min(1),
    visualization: z.string().optional(),
    reviewed: z.boolean().default(false),
});

export type AlgorithmManifest = z.infer<typeof algorithmManifestSchema>;

/* ------------------------------------------------------------------ */
/* Problems                                                            */
/* ------------------------------------------------------------------ */

export const problemSchema = z.object({
    id: z
        .string()
        .regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/, "problem ids must be lowercase dotted segments"),
    title: z.string().min(1),
    source: z.string().min(1),
    contest: z.string().optional(),
    division: divisionSchema.optional(),
    url: z.string().url().optional(),
    editorialUrl: z.string().url().optional(),
    techniques: z.array(z.string()).default([]),
    prerequisites: z.array(z.string()).default([]),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    estimatedMinutes: z.number().int().positive().optional(),
    specialConstraints: z.array(z.string()).default([]),
    recommendedLanguages: z.array(languageIdSchema).default([]),
    hints: z.array(z.string()).default([]),
    discussion: z.string().optional(),
    related: z.array(z.string()).default([]),
});

export type ProblemRecord = z.infer<typeof problemSchema>;

/* ------------------------------------------------------------------ */
/* Visualizations                                                      */
/* ------------------------------------------------------------------ */

export const visualizationSchema = z.object({
    id: z
        .string()
        .regex(
            /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/,
            "visualization ids must be lowercase dotted segments",
        ),
    title: z.string().min(1),
    algorithm: z.string().min(1),
    scene: z.string().min(1),
    preset: z.string().optional(),
    maxVertices: z.number().int().positive().max(200).optional(),
    maxEdges: z.number().int().positive().max(600).optional(),
    storyboard: z
        .array(
            z.object({
                title: z.string().min(1),
                description: z.string().min(1),
            }),
        )
        .default([]),
});

export type VisualizationRecord = z.infer<typeof visualizationSchema>;

/* ------------------------------------------------------------------ */
/* Curriculum                                                          */
/* ------------------------------------------------------------------ */

export const curriculumTrackSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    division: divisionSchema,
    lessons: z.array(z.string()).min(1),
});

export type CurriculumTrackRecord = z.infer<typeof curriculumTrackSchema>;

/* ------------------------------------------------------------------ */
/* Synonyms                                                            */
/* ------------------------------------------------------------------ */

export const synonymsSchema = z.record(z.string(), z.array(z.string()).min(1));

export type SynonymRecord = z.infer<typeof synonymsSchema>;
