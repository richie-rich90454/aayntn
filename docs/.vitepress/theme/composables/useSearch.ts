/**
 * The search session.
 *
 * The index is a static file and the per-page metadata is generated at build
 * time, so both are loaded on the first open of the palette and never again
 * during the session. MiniSearch ranks the title above the summary; importance
 * breaks the ties.
 */

import { computed, ref, shallowRef, watch } from "vue";
import MiniSearch from "minisearch";
import {
    DIVISIONS,
    SUBJECTS,
    type Division,
    type Importance,
    type LessonEntry,
    type SearchEntry,
    type Subject,
} from "../../data/types";

export type SearchGroupId = "lessons" | "laboratories" | "problems" | "reference";

export interface SearchItem extends SearchEntry {
    group: SearchGroupId;
    divisions: Division[];
    subjects: Subject[];
    importance: Importance;
}

export interface SearchOption {
    item: SearchItem;
    id: string;
    index: number;
}

export interface SearchGroup {
    id: string;
    label: string;
    options: SearchOption[];
}

const GROUP_BY_KIND: Record<SearchEntry["kind"], SearchGroupId> = {
    lesson: "lessons",
    visualization: "laboratories",
    problem: "problems",
    algorithm: "reference",
    template: "reference",
    language: "reference",
    proof: "reference",
};

const GROUP_ORDER: SearchGroupId[] = ["lessons", "laboratories", "problems", "reference"];

const GROUP_LABELS: Record<SearchGroupId, string> = {
    lessons: "Lessons",
    laboratories: "Laboratories",
    problems: "Problems",
    reference: "Reference",
};

const DEFAULT_IMPORTANCE: Record<SearchEntry["kind"], Importance> = {
    lesson: "extended-reference",
    algorithm: "common-contest-technique",
    visualization: "common-contest-technique",
    problem: "common-contest-technique",
    template: "common-contest-technique",
    language: "extended-reference",
    proof: "advanced-technique",
};

const IMPORTANCE_ORDER: Record<Importance, number> = {
    "core-prerequisite": 0,
    "common-contest-technique": 1,
    "advanced-technique": 2,
    "specialized-technique": 3,
    "extended-reference": 4,
};

const RECENT_KEY = "aayntn-search-recent";

const items = shallowRef<SearchItem[]>([]);
const index = shallowRef<MiniSearch<SearchEntry> | null>(null);
const recentIds = ref<string[]>([]);

let indexPromise: Promise<void> | null = null;

export const query = ref("");
export const division = ref<Division | "">("");
export const subject = ref<Subject | "">("");
export const kind = ref<SearchGroupId | "">("");
export const loading = ref(false);
export const error = ref<string | null>(null);
export const activeIndex = ref(0);

export const activeFilterCount = computed(() => {
    let count = 0;
    if (division.value) count += 1;
    if (subject.value) count += 1;
    if (kind.value) count += 1;
    return count;
});

function importanceRank(item: SearchItem): number {
    return IMPORTANCE_ORDER[item.importance];
}

function optionId(item: SearchItem): string {
    return `aayntn-palette-option-${item.id.replace(/[^a-zA-Z0-9]+/g, "-")}`;
}

function subjectsFromKeywords(entry: SearchEntry): Subject[] {
    const found = new Set<Subject>();
    for (const keyword of entry.keywords) {
        const prefix = keyword.split(".")[0];
        if (prefix && (SUBJECTS as readonly string[]).includes(prefix)) {
            found.add(prefix as Subject);
        }
    }
    return [...found];
}

function divisionsFromProblemId(entry: SearchEntry): Division[] {
    if (entry.kind !== "problem") return [];
    const parts = entry.id.split(".");
    return DIVISIONS.filter((candidate) => parts.includes(candidate));
}

function enrich(entry: SearchEntry, metadata: Map<string, LessonEntry>): SearchItem {
    const bareId = entry.id.includes(":") ? entry.id.slice(entry.id.indexOf(":") + 1) : entry.id;
    const lesson = metadata.get(bareId);
    return {
        ...entry,
        group: GROUP_BY_KIND[entry.kind],
        divisions: lesson ? [...lesson.divisions] : divisionsFromProblemId(entry),
        subjects: lesson ? [...lesson.subjects] : subjectsFromKeywords(entry),
        importance: lesson?.importance ?? DEFAULT_IMPORTANCE[entry.kind],
    };
}

/**
 * Load the index and the metadata once. The palette can be opened, closed and
 * reopened without touching the network again.
 */
export function ensureIndex(): Promise<void> {
    if (indexPromise) return indexPromise;
    indexPromise = (async () => {
        loading.value = true;
        error.value = null;
        try {
            const response = await fetch(`${import.meta.env.BASE_URL}search-index.json`);
            if (!response.ok) {
                throw new Error(`The search index answered with ${response.status}.`);
            }
            const payload = (await response.json()) as { entries: SearchEntry[] };
            const { default: lessons } = await import("../../data/generated/lessons.json");
            const metadata = new Map(
                (lessons as LessonEntry[]).map((lesson) => [lesson.id, lesson]),
            );

            items.value = payload.entries.map((entry) => enrich(entry, metadata));

            const search = new MiniSearch<SearchEntry>({
                fields: ["title", "summary"],
                storeFields: ["id"],
                searchOptions: {
                    fields: ["title", "summary"],
                    boost: { title: 3 },
                    fuzzy: 0.2,
                    prefix: true,
                    combineWith: "AND",
                },
            });
            search.addAll(payload.entries);
            index.value = search;
        } catch (cause) {
            error.value =
                cause instanceof Error ? cause.message : "The search index could not be loaded.";
        } finally {
            loading.value = false;
        }
    })();
    return indexPromise;
}

export function loadRecents(): void {
    try {
        const stored = window.localStorage.getItem(RECENT_KEY);
        if (!stored) {
            recentIds.value = [];
            return;
        }
        const parsed: unknown = JSON.parse(stored);
        recentIds.value = Array.isArray(parsed)
            ? parsed.filter((value): value is string => typeof value === "string").slice(0, 4)
            : [];
    } catch {
        recentIds.value = [];
    }
}

export function remember(id: string): void {
    const next = [id, ...recentIds.value.filter((value) => value !== id)].slice(0, 4);
    recentIds.value = next;
    try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
        // Storage can be unavailable in a private window; the session still works.
    }
}

export function clearFilters(): void {
    division.value = "";
    subject.value = "";
    kind.value = "";
}

const filtered = computed(() => {
    const chosenDivision = division.value;
    const chosenSubject = subject.value;
    const chosenKind = kind.value;
    return items.value.filter((item) => {
        if (chosenDivision && !item.divisions.includes(chosenDivision)) return false;
        if (chosenSubject && !item.subjects.includes(chosenSubject)) return false;
        if (chosenKind && item.group !== chosenKind) return false;
        return true;
    });
});

const byId = computed(() => new Map(items.value.map((item) => [item.id, item])));

const recentItems = computed(() =>
    recentIds.value
        .map((id) => byId.value.get(id))
        .filter((item): item is SearchItem => item !== undefined),
);

const essentialLessons = computed(() => {
    const recent = new Set(recentIds.value);
    return items.value
        .filter((item) => item.kind === "lesson" && !recent.has(item.id))
        .sort(
            (left, right) =>
                importanceRank(left) - importanceRank(right) ||
                left.title.localeCompare(right.title),
        )
        .slice(0, 6);
});

function dedupeByHref(list: SearchItem[]): SearchItem[] {
    const seen = new Set<string>();
    const output: SearchItem[] = [];
    for (const item of list) {
        const key = item.href.replace(/\/$/, "");
        if (seen.has(key)) continue;
        seen.add(key);
        output.push(item);
    }
    return output;
}

const searchedItems = computed(() => {
    const search = index.value;
    const text = query.value.trim();
    if (!search || !text) return [];
    const scores = new Map<string, number>();
    for (const result of search.search(text)) {
        scores.set(String(result.id), result.score);
    }
    const hits = filtered.value
        .filter((item) => scores.has(item.id))
        .sort(
            (left, right) =>
                (scores.get(right.id) ?? 0) - (scores.get(left.id) ?? 0) ||
                importanceRank(left) - importanceRank(right) ||
                left.title.localeCompare(right.title),
        );
    return dedupeByHref(hits).slice(0, 40);
});

const browseItems = computed(() => {
    const sorted = [...filtered.value].sort(
        (left, right) =>
            importanceRank(left) - importanceRank(right) || left.title.localeCompare(right.title),
    );
    return dedupeByHref(sorted);
});

function buildGroups(
    sections: { id: string; label: string; items: SearchItem[] }[],
): SearchGroup[] {
    let cursor = 0;
    return sections
        .map((section) => {
            const options = section.items.map((item) => {
                const option: SearchOption = { item, id: optionId(item), index: cursor };
                cursor += 1;
                return option;
            });
            return { id: section.id, label: section.label, options };
        })
        .filter((group) => group.options.length > 0);
}

export const groups = computed<SearchGroup[]>(() => {
    if (loading.value || error.value) return [];
    const text = query.value.trim();
    if (text || activeFilterCount.value > 0) {
        const list = text ? searchedItems.value : browseItems.value;
        return buildGroups(
            GROUP_ORDER.map((groupId) => ({
                id: groupId,
                label: GROUP_LABELS[groupId],
                items: list.filter((item) => item.group === groupId).slice(0, text ? 40 : 8),
            })),
        );
    }
    const sections: { id: string; label: string; items: SearchItem[] }[] = [];
    if (recentItems.value.length > 0) {
        sections.push({ id: "recent", label: "Recent", items: recentItems.value });
    }
    if (essentialLessons.value.length > 0) {
        sections.push({ id: "lessons", label: "Essential lessons", items: essentialLessons.value });
    }
    return buildGroups(sections);
});

export const options = computed(() => groups.value.flatMap((group) => group.options));

export const activeOptionId = computed(() => options.value[activeIndex.value]?.id);

export const noResults = computed(
    () =>
        !loading.value &&
        !error.value &&
        (query.value.trim() !== "" || activeFilterCount.value > 0) &&
        groups.value.length === 0,
);

function normalize(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function editDistance(left: string, right: string): number {
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    const current = new Array<number>(right.length + 1).fill(0);
    for (let i = 1; i <= left.length; i += 1) {
        current[0] = i;
        for (let j = 1; j <= right.length; j += 1) {
            const cost = left[i - 1] === right[j - 1] ? 0 : 1;
            current[j] = Math.min(
                (current[j - 1] ?? 0) + 1,
                (previous[j] ?? 0) + 1,
                (previous[j - 1] ?? 0) + cost,
            );
        }
        for (let j = 0; j <= right.length; j += 1) {
            previous[j] = current[j] ?? 0;
        }
    }
    return previous[right.length] ?? 0;
}

export const closestMatch = computed<SearchItem | null>(() => {
    const wanted = normalize(query.value);
    if (!wanted) return null;
    let best: SearchItem | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const item of dedupeByHref(filtered.value)) {
        const distance = editDistance(wanted, normalize(item.title));
        if (distance < bestDistance) {
            bestDistance = distance;
            best = item;
        }
    }
    return best;
});

watch([query, division, subject, kind], () => {
    activeIndex.value = 0;
});

watch(options, (list) => {
    if (activeIndex.value >= list.length) activeIndex.value = 0;
});
