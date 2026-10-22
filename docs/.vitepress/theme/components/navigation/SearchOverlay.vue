<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRouter } from "vitepress";
import MiniSearch, { type SearchResult } from "minisearch";
import type { SearchEntry } from "../../../data/types";

/**
 * aayntn search.
 *
 * A self-contained local search over an index generated at build time from the
 * editorial content only. Source code is deliberately excluded: readers are
 * looking for explanations, not for the inside of a reference implementation.
 *
 * The index carries a synonym expansion so that "DSU" finds "disjoint set
 * union", and every record declares its kind so results can be labeled.
 */

const open = ref(false);
const query = ref("");
const loading = ref(false);
const results = ref<SearchResult[]>([]);
const activeIndex = ref(0);
const dialogEl = ref<HTMLElement>();
const inputEl = ref<HTMLInputElement>();

const router = useRouter();

let miniSearch: MiniSearch<SearchEntry> | null = null;
let indexPromise: Promise<void> | null = null;

const KIND_LABELS: Record<SearchEntry["kind"], string> = {
    lesson: "Lesson",
    algorithm: "Algorithm",
    template: "Template",
    visualization: "Visualization",
    problem: "Problem",
    language: "Language guide",
    proof: "Proof",
};

const resultMeta = computed(() => {
    const map = new Map<string, SearchEntry>();
    for (const entry of entriesById.values()) map.set(entry.id, entry);
    return map;
});

const entriesById = new Map<string, SearchEntry>();

async function ensureIndex(): Promise<void> {
    if (indexPromise) return indexPromise;
    indexPromise = (async () => {
        loading.value = true;
        const response = await fetch("/search-index.json");
        const payload = (await response.json()) as { entries: SearchEntry[] };
        for (const entry of payload.entries) entriesById.set(entry.id, entry);

        miniSearch = new MiniSearch<SearchEntry>({
            fields: ["title", "summary", "body", "keywords"],
            storeFields: ["title", "href", "kind", "summary"],
            searchOptions: {
                boost: { title: 6, keywords: 4, summary: 2, body: 1 },
                fuzzy: 0.2,
                prefix: true,
                combineWith: "AND",
            },
        });
        miniSearch.addAll(payload.entries as unknown as Record<string, unknown>[]);
        loading.value = false;
        // A reader who typed while the index was still loading must not be
        // left with an empty list.
        runSearch();
    })();
    return indexPromise;
}

function runSearch() {
    if (!miniSearch || !query.value.trim()) {
        results.value = [];
        return;
    }
    const raw = query.value.trim();
    // Expand well-known abbreviations before searching so that "DSU" also
    // matches lessons that only ever spell out "disjoint set union".
    const expanded = new Set([raw]);
    for (const entry of entriesById.values()) {
        for (const keyword of entry.keywords) {
            if (keyword.toLowerCase() === raw.toLowerCase()) {
                expanded.add(keyword);
            }
        }
    }
    const seen = new Set<string>();
    const collected: SearchResult[] = [];
    for (const term of expanded) {
        for (const result of miniSearch.search(term)) {
            if (seen.has(result.id as string)) continue;
            seen.add(result.id as string);
            collected.push(result);
        }
    }
    results.value = collected.slice(0, 30);
    activeIndex.value = 0;
}

watch(query, () => runSearch());

async function openSearch() {
    open.value = true;
    await ensureIndex();
    await nextTick();
    inputEl.value?.focus();
}

function closeSearch() {
    open.value = false;
    query.value = "";
    results.value = [];
}

function go(result: SearchResult) {
    const href = (result as unknown as { href: string }).href;
    closeSearch();
    void router.go(href);
}

function onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const editing =
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "SELECT" ||
        target.tagName === "TEXTAREA";

    if (
        (event.key === "k" && (event.metaKey || event.ctrlKey)) ||
        (event.key === "/" && !editing)
    ) {
        event.preventDefault();
        if (open.value) closeSearch();
        else void openSearch();
        return;
    }

    if (!open.value) return;

    if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
    } else if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1);
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex.value = Math.max(activeIndex.value - 1, 0);
    } else if (event.key === "Enter") {
        event.preventDefault();
        const result = results.value[activeIndex.value];
        if (result) go(result);
    }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onUnmounted(() => window.removeEventListener("keydown", onKeydown));

defineExpose({ open: openSearch });
</script>

<template>
    <div class="aayntn-search">
        <button
            class="aayntn-search__button"
            type="button"
            aria-label="Search A.A.Y.N.T.N."
            @click="openSearch"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <circle
                    cx="7"
                    cy="7"
                    r="4.6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                />
                <path
                    d="M10.4 10.4L14 14"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="square"
                />
            </svg>
            <span class="aayntn-search__label">Search</span>
            <kbd class="aayntn-search__kbd">Ctrl K</kbd>
        </button>

        <div v-if="open" class="aayntn-search__overlay" @click.self="closeSearch">
            <div
                ref="dialogEl"
                class="aayntn-search__dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Search A.A.Y.N.T.N."
            >
                <div class="aayntn-search__field">
                    <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
                        <circle
                            cx="7"
                            cy="7"
                            r="4.6"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                        />
                        <path
                            d="M10.4 10.4L14 14"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="square"
                        />
                    </svg>
                    <input
                        ref="inputEl"
                        v-model="query"
                        class="aayntn-search__input"
                        type="search"
                        placeholder="Search algorithms, techniques and problems…"
                        aria-label="Search query"
                    />
                    <button
                        class="aayntn-search__close"
                        type="button"
                        aria-label="Close search"
                        @click="closeSearch"
                    >
                        Esc
                    </button>
                </div>

                <div class="aayntn-search__results" role="listbox" aria-label="Search results">
                    <p v-if="loading" class="aayntn-search__status">Building the index…</p>
                    <p v-else-if="!query.trim()" class="aayntn-search__status">
                        Try
                        <strong>DSU</strong>
                        ,
                        <strong>shortest path with negative weights</strong>
                        , or
                        <strong>range updates</strong>
                        .
                    </p>
                    <p v-else-if="results.length === 0" class="aayntn-search__status">
                        No results for “{{ query }}”.
                    </p>
                    <template v-else>
                        <a
                            v-for="(result, index) in results"
                            :key="result.id"
                            class="aayntn-search__result"
                            :class="{ 'is-active': index === activeIndex }"
                            :href="(result as any).href"
                            role="option"
                            :aria-selected="index === activeIndex"
                            @mouseenter="activeIndex = index"
                            @click="closeSearch"
                        >
                            <span class="aayntn-search__kind">
                                {{ KIND_LABELS[(result as any).kind] }}
                            </span>
                            <span class="aayntn-search__title">{{ (result as any).title }}</span>
                            <span class="aayntn-search__summary">
                                {{ (result as any).summary }}
                            </span>
                        </a>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>
