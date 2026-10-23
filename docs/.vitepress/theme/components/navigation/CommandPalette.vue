<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter, withBase } from "vitepress";
import { DIVISIONS, DIVISION_LABELS, SUBJECTS, type SearchEntry } from "../../../data/types";
import {
    activeFilterCount,
    activeIndex,
    activeOptionId,
    clearFilters,
    closestMatch,
    division,
    ensureIndex,
    error,
    groups,
    kind,
    loadRecents,
    loading,
    noResults,
    options,
    query,
    remember,
    subject,
    type SearchGroupId,
    type SearchItem,
} from "../../composables/useSearch";

/**
 * The command palette.
 *
 * The header trigger and the keyboard shortcuts open the same dialog. The
 * index is requested on the first open, and the dialog keeps the whole result
 * model (query, filters, selection) in one place so the keyboard and the
 * pointer cannot disagree about what is selected.
 */

const emit = defineEmits<{ closed: [] }>();

const router = useRouter();
const route = useRoute();

const isOpen = ref(false);
const inputEl = ref<HTMLInputElement | null>(null);
const dialogEl = ref<HTMLElement | null>(null);

const KIND_LABELS: Record<SearchEntry["kind"], string> = {
    lesson: "Lesson",
    algorithm: "Algorithm",
    template: "Template",
    visualization: "Laboratory",
    problem: "Problem",
    language: "Language",
    proof: "Proof",
};

const KIND_OPTIONS: { id: SearchGroupId; label: string }[] = [
    { id: "lessons", label: "Lessons" },
    { id: "laboratories", label: "Laboratories" },
    { id: "problems", label: "Problems" },
    { id: "reference", label: "Reference" },
];

const SUBJECT_OPTIONS = SUBJECTS.map((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
}));

const hasFilters = computed(() => activeFilterCount.value > 0);

async function openPalette(): Promise<void> {
    if (isOpen.value) {
        inputEl.value?.focus();
        return;
    }
    isOpen.value = true;
    loadRecents();
    void ensureIndex();
    await nextTick();
    inputEl.value?.focus();
}

function closePalette(): void {
    if (!isOpen.value) return;
    isOpen.value = false;
    query.value = "";
    clearFilters();
    activeIndex.value = 0;
    emit("closed");
}

defineExpose({ open: openPalette, close: closePalette });

function hrefFor(href: string): string {
    return /^https?:\/\//.test(href) ? href : withBase(href);
}

function activate(item: SearchItem, event?: MouseEvent): void {
    if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) {
        remember(item.id);
        return;
    }
    event?.preventDefault();
    remember(item.id);
    closePalette();
    if (/^https?:\/\//.test(item.href)) {
        window.location.assign(item.href);
        return;
    }
    void router.go(hrefFor(item.href));
}

function activateActive(): void {
    const option = options.value[activeIndex.value];
    if (option) activate(option.item);
}

function move(step: number): void {
    const count = options.value.length;
    if (count === 0) return;
    activeIndex.value = (activeIndex.value + step + count) % count;
}

function isEditing(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    if (!element) return false;
    return (
        element.isContentEditable ||
        element.tagName === "INPUT" ||
        element.tagName === "SELECT" ||
        element.tagName === "TEXTAREA"
    );
}

function onGlobalKeydown(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if ((event.key === "k" || event.key === "K") && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (!isOpen.value) void openPalette();
        return;
    }
    if (event.key === "/" && !isEditing(event.target) && !isOpen.value) {
        event.preventDefault();
        void openPalette();
        return;
    }
    if (event.key === "Escape" && isOpen.value) {
        event.preventDefault();
        closePalette();
    }
}

function trapFocus(event: KeyboardEvent): void {
    const dialog = dialogEl.value;
    if (!dialog) return;
    const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
    ).filter((element) => element.tabIndex >= 0);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function onDialogKeydown(event: KeyboardEvent): void {
    if (event.key === "Tab") {
        trapFocus(event);
        return;
    }
    if (!isOpen.value) return;
    if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
    }
    const target = event.target as HTMLElement;
    const fromInput = target === inputEl.value;
    const fromResults = Boolean(target.closest(".aayntn-palette__results"));
    if (!fromInput && !fromResults) return;
    if (event.key === "ArrowDown") {
        event.preventDefault();
        move(1);
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        move(-1);
    } else if (event.key === "Home" && fromInput) {
        event.preventDefault();
        activeIndex.value = 0;
    } else if (event.key === "End" && fromInput) {
        event.preventDefault();
        activeIndex.value = Math.max(options.value.length - 1, 0);
    } else if (event.key === "Enter" && fromInput) {
        event.preventDefault();
        activateActive();
    }
}

watch(activeOptionId, async (id) => {
    if (!id || typeof document === "undefined") return;
    await nextTick();
    document.getElementById(id)?.scrollIntoView({ block: "nearest" });
});

watch(
    () => route.path,
    () => {
        if (isOpen.value) closePalette();
    },
);

onMounted(() => window.addEventListener("keydown", onGlobalKeydown));
onUnmounted(() => window.removeEventListener("keydown", onGlobalKeydown));
</script>

<template>
    <Teleport to="body">
        <div v-if="isOpen" class="aayntn-palette" @click.self="closePalette">
            <div
                ref="dialogEl"
                class="aayntn-palette__dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="aayntn-palette-title"
                @keydown="onDialogKeydown"
            >
                <h2 id="aayntn-palette-title" class="sr-only">Search A.A.Y.N.T.N.</h2>

                <div class="aayntn-palette__field">
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
                        class="aayntn-palette__input"
                        type="search"
                        placeholder="Search lessons, laboratories, problems and reference"
                        aria-label="Search query"
                        role="combobox"
                        aria-expanded="true"
                        :aria-controls="loading || error ? undefined : 'aayntn-palette-results'"
                        aria-autocomplete="list"
                        :aria-activedescendant="activeOptionId"
                        autocomplete="off"
                        spellcheck="false"
                    />
                    <button
                        class="aayntn-palette__close"
                        type="button"
                        aria-label="Close search"
                        @click="closePalette"
                    >
                        Esc
                    </button>
                </div>

                <div class="aayntn-palette__filters" role="group" aria-label="Search filters">
                    <label class="aayntn-palette__filter">
                        <span>Division</span>
                        <select v-model="division" aria-label="Division">
                            <option value="">Any division</option>
                            <option v-for="value in DIVISIONS" :key="value" :value="value">
                                {{ DIVISION_LABELS[value] }}
                            </option>
                        </select>
                    </label>

                    <label class="aayntn-palette__filter">
                        <span>Subject</span>
                        <select v-model="subject" aria-label="Subject">
                            <option value="">Any subject</option>
                            <option
                                v-for="option in SUBJECT_OPTIONS"
                                :key="option.id"
                                :value="option.id"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </label>

                    <label class="aayntn-palette__filter">
                        <span>Kind</span>
                        <select v-model="kind" aria-label="Kind">
                            <option value="">Any kind</option>
                            <option
                                v-for="option in KIND_OPTIONS"
                                :key="option.id"
                                :value="option.id"
                            >
                                {{ option.label }}
                            </option>
                        </select>
                    </label>

                    <div class="aayntn-palette__meta">
                        <span class="aayntn-palette__count" aria-live="polite">
                            {{ activeFilterCount }} active
                        </span>
                        <button
                            v-if="hasFilters"
                            class="aayntn-palette__clear"
                            type="button"
                            @click="clearFilters"
                        >
                            Clear all
                        </button>
                    </div>
                </div>

                <div class="aayntn-palette__results">
                    <p v-if="loading" class="aayntn-palette__status">Building the index&hellip;</p>
                    <p v-else-if="error" class="aayntn-palette__status" role="alert">{{ error }}</p>
                    <template v-else>
                        <div v-if="noResults" class="aayntn-palette__empty">
                            <p v-if="query.trim()" class="aayntn-palette__status">
                                No results for &ldquo;{{ query }}&rdquo;.
                            </p>
                            <p v-else class="aayntn-palette__status">
                                No page matches these filters.
                            </p>
                            <button
                                v-if="closestMatch"
                                class="aayntn-palette__closest"
                                type="button"
                                @click="activate(closestMatch)"
                            >
                                Closest title:
                                <strong>{{ closestMatch.title }}</strong>
                            </button>
                            <button
                                v-else-if="hasFilters"
                                class="aayntn-palette__closest"
                                type="button"
                                @click="clearFilters"
                            >
                                Clear all filters
                            </button>
                        </div>

                        <div
                            id="aayntn-palette-results"
                            class="aayntn-palette__list"
                            role="listbox"
                            aria-label="Search results"
                        >
                            <div
                                v-for="(group, groupIndex) in groups"
                                :key="group.id"
                                class="aayntn-palette__group"
                                role="group"
                                :aria-labelledby="`aayntn-palette-group-${groupIndex}`"
                            >
                                <p
                                    :id="`aayntn-palette-group-${groupIndex}`"
                                    class="aayntn-palette__group-title"
                                >
                                    {{ group.label }}
                                </p>
                                <a
                                    v-for="option in group.options"
                                    :id="option.id"
                                    :key="option.item.id"
                                    class="aayntn-palette__result aayntn-search__result"
                                    :class="{ 'is-active': activeIndex === option.index }"
                                    :href="hrefFor(option.item.href)"
                                    :data-divisions="option.item.divisions.join(' ')"
                                    role="option"
                                    tabindex="-1"
                                    :aria-selected="activeIndex === option.index"
                                    @mouseenter="activeIndex = option.index"
                                    @click="activate(option.item, $event)"
                                >
                                    <span class="aayntn-palette__kind">
                                        {{ KIND_LABELS[option.item.kind] }}
                                    </span>
                                    <span class="aayntn-palette__text">
                                        <span class="aayntn-palette__title-text">
                                            {{ option.item.title }}
                                        </span>
                                        <span class="aayntn-palette__summary">
                                            {{ option.item.summary }}
                                        </span>
                                    </span>
                                </a>
                            </div>
                        </div>
                    </template>
                </div>

                <div class="aayntn-palette__footer" aria-hidden="true">
                    <span>
                        <kbd>Up</kbd>
                        <kbd>Down</kbd>
                        move
                    </span>
                    <span>
                        <kbd>Enter</kbd>
                        open
                    </span>
                    <span>
                        <kbd>Esc</kbd>
                        close
                    </span>
                </div>
            </div>
        </div>
    </Teleport>
</template>
