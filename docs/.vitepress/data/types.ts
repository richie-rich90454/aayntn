/**
 * Client-facing data contracts for aayntn.
 *
 * These types describe the *shape* of the JSON documents produced by
 * `tools/generate-indexes` and consumed by the Vue theme. They deliberately
 * contain no runtime dependency on Zod so they can be imported into the
 * browser bundle without pulling a validation library into it.
 *
 * The authoritative, validated definitions live in `tools/lib/schema.ts`.
 */

/** The six languages aayntn provides reference implementations in. */
export type LanguageId = "c" | "cpp17" | "java" | "python" | "pascal" | "javascript";

export const LANGUAGE_IDS: readonly LanguageId[] = [
    "c",
    "cpp17",
    "java",
    "python",
    "pascal",
    "javascript",
];

export const LANGUAGE_LABELS: Record<LanguageId, string> = {
    c: "C",
    cpp17: "C++17",
    java: "Java",
    python: "Python",
    pascal: "Pascal",
    javascript: "JavaScript",
};

/** USACO currently accepts C, C++, Java and Python for submission. */
export const USACO_SUBMITTABLE_LANGUAGES: readonly LanguageId[] = ["c", "cpp17", "java", "python"];

export function isUsacoSubmittable(language: LanguageId): boolean {
    return USACO_SUBMITTABLE_LANGUAGES.includes(language);
}

export type Division = "bronze" | "silver" | "gold" | "platinum";

export const DIVISIONS: readonly Division[] = ["bronze", "silver", "gold", "platinum"];

export const DIVISION_LABELS: Record<Division, string> = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
};

/**
 * Importance is deliberately independent of division. A technique can be an
 * excellent extension topic while being rare in actual USACO contests.
 */
export type Importance =
    | "core-prerequisite"
    | "common-contest-technique"
    | "advanced-technique"
    | "specialized-technique"
    | "extended-reference";

export const IMPORTANCE_LABELS: Record<Importance, string> = {
    "core-prerequisite": "Core prerequisite",
    "common-contest-technique": "Common contest technique",
    "advanced-technique": "Advanced technique",
    "specialized-technique": "Specialized technique",
    "extended-reference": "Extended reference",
};

export type Subject =
    | "foundations"
    | "enumeration"
    | "searching"
    | "greedy"
    | "arrays"
    | "range-queries"
    | "graphs"
    | "trees"
    | "dynamic-programming"
    | "strings"
    | "number-theory"
    | "combinatorics"
    | "geometry"
    | "advanced";

export const SUBJECTS: readonly Subject[] = [
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

export const SUBJECT_LABELS: Record<Subject, string> = {
    foundations: "Foundations and complexity",
    enumeration: "Enumeration, searching and greedy methods",
    searching: "Searching",
    greedy: "Greedy methods",
    arrays: "Arrays, sequences and range queries",
    "range-queries": "Range query structures",
    graphs: "Graphs and shortest paths",
    trees: "Trees and decompositions",
    "dynamic-programming": "Dynamic programming",
    strings: "Strings",
    "number-theory": "Number theory",
    combinatorics: "Combinatorics",
    geometry: "Computational geometry",
    advanced: "Advanced algorithms and special techniques",
};

/** How strongly a variant should be presented to the reader. */
export type Recommendation = "recommended" | "conditional" | "not-applicable";

export type ImplementationKind = "minimal" | "program" | "educational";

export const IMPLEMENTATION_KIND_LABELS: Record<ImplementationKind, string> = {
    minimal: "Minimal implementation",
    program: "Complete contest program",
    educational: "Educational implementation",
};

export type VerificationStatus = "verified" | "unverified";

export interface AlgorithmVariant {
    /** Stable identifier, unique inside one algorithm. */
    id: string;
    language: LanguageId;
    /** Path relative to the algorithm directory. */
    file: string;
    kind: ImplementationKind;
    recommendation: Recommendation;
    /** Why this variant is recommended, conditional, or not applicable. */
    reason: string;
    time: string;
    auxiliarySpace: string;
    status: VerificationStatus;
    /** Input contract, when the variant is a standalone program. */
    inputs?: string;
    /** Output contract, when the variant is a standalone program. */
    outputs?: string;
    /** Language-specific performance or correctness notes. */
    notes?: string;
    /** Semantic operation ids this variant can be highlighted for. */
    operations?: string[];
}

export interface AlgorithmEntry {
    id: string;
    title: string;
    summary: string;
    subject: Subject;
    divisions: Division[];
    importance: Importance;
    complexity: { time: string; space: string };
    prerequisites: { required: string[]; recommended: string[] };
    assumptions: string[];
    variants: AlgorithmVariant[];
    /** Identifier of the registered visualization, if any. */
    visualization?: string;
    /** Article that documents the algorithm. */
    href?: string;
    reviewed: boolean;
}

export interface ProblemEntry {
    id: string;
    title: string;
    source: string;
    contest?: string;
    division?: Division;
    url?: string;
    editorialUrl?: string;
    techniques: string[];
    prerequisites: string[];
    /** Curated educational difficulty, not an official rating. */
    difficulty: 1 | 2 | 3 | 4 | 5;
    estimatedMinutes?: number;
    specialConstraints?: string[];
    recommendedLanguages?: LanguageId[];
    hints: string[];
    discussion?: string;
    related?: string[];
}

export interface LessonEntry {
    id: string;
    title: string;
    summary?: string;
    href: string;
    divisions: Division[];
    importance: Importance;
    subjects: Subject[];
    level: "introductory" | "intermediate" | "advanced";
}

export interface VisualizationEntry {
    id: string;
    title: string;
    algorithm: string;
    scene: string;
    preset?: string;
    href: string;
    maxVertices?: number;
    maxEdges?: number;
}

export interface CurriculumTrack {
    id: string;
    title: string;
    summary: string;
    division: Division;
    lessons: string[];
}

export interface PrerequisiteEdge {
    from: string;
    to: string;
    kind: "required" | "recommended";
}

export interface PrerequisiteGraph {
    nodes: { id: string; title: string; division?: Division }[];
    edges: PrerequisiteEdge[];
    /** Topological order over the required-prerequisite edges. */
    order: string[];
}

export interface SearchEntry {
    id: string;
    title: string;
    summary: string;
    href: string;
    kind: "lesson" | "algorithm" | "template" | "visualization" | "problem" | "language" | "proof";
    keywords: string[];
}

export interface GeneratedIndex {
    algorithms: AlgorithmEntry[];
    lessons: LessonEntry[];
    problems: ProblemEntry[];
    visualizations: VisualizationEntry[];
    languages: { id: LanguageId; label: string; submittable: boolean; href: string }[];
    curriculum: CurriculumTrack[];
    prerequisites: PrerequisiteGraph;
    search: SearchEntry[];
    stats: {
        lessons: number;
        algorithms: number;
        variants: number;
        problems: number;
        visualizations: number;
        reviewedAlgorithms: number;
    };
}
