import summary from "../../../../data/coverage-summary.json";

/**
 * The state of the coverage claim.
 *
 * The numbers are produced by the coverage tooling and written to
 * `data/coverage-summary.json`. This composable is the only reader, so the
 * home page, the progress page and the coverage page can never disagree about
 * what has been published.
 */

export interface CoverageDivision {
    id: string;
    label: string;
    required: number;
    complete: number;
    taggedTasks: number;
    totalTasks: number;
}

export interface CoverageSummary {
    updated: string | null;
    techniques: number;
    published: number;
    missing: number;
    algorithms: number;
    required: number;
    complete: number;
    taggedTasks: number;
    totalTasks: number;
    divisions: CoverageDivision[];
}

export const coverage = summary as CoverageSummary;

/** The share of the required techniques that carry the full contract. */
export function coveragePercent(value: CoverageSummary = coverage): number {
    if (value.required === 0) return 0;
    return Math.round((value.complete / value.required) * 100);
}

/** The share of the corpus that has been tagged with a technique. */
export function taggingPercent(value: CoverageSummary = coverage): number {
    if (value.totalTasks === 0) return 0;
    return Math.round((value.taggedTasks / value.totalTasks) * 100);
}

export function useCoverage(): CoverageSummary {
    return coverage;
}
