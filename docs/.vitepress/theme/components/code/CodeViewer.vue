<script setup lang="ts">
import { computed, ref, watch } from "vue";
import algorithms from "../../../data/generated/algorithms.json";
import { loadImplementationHtml } from "../../../data/loader";
import { language as preferredLanguage, preferredVariant } from "../../composables/usePreferences";
import type { AlgorithmEntry, AlgorithmVariant, LanguageId } from "../../../data/types";
import { LANGUAGE_LABELS, isUsacoSubmittable } from "../../../data/types";

/**
 * The code viewer.
 *
 * A code implementation is treated as a first-class document: it has a
 * language selector, a variant selector, an explicit recommendation with its
 * reasoning, verification status, performance notes, and access to the raw
 * source. The highlighted listing is produced at build time, so no syntax
 * highlighter is shipped to the browser.
 */

const props = defineProps<{
    /** Algorithm identifier, matching the `algorithm` field of a manifest. */
    algorithm: string;
    /** Hide the variant selector when the algorithm has only one variant. */
    hideVariants?: boolean;
}>();

const entry = computed<AlgorithmEntry | undefined>(() =>
    (algorithms as AlgorithmEntry[]).find((item) => item.id === props.algorithm),
);

const languages = computed<LanguageId[]>(() => {
    if (!entry.value) return [];
    const present = new Set(entry.value.variants.map((variant) => variant.language));
    return (["c", "cpp17", "java", "python", "pascal", "javascript"] as LanguageId[]).filter((id) =>
        present.has(id),
    );
});

const activeLanguage = ref<LanguageId>("cpp17");

watch(
    [entry, languages],
    () => {
        if (!entry.value) return;
        const available = languages.value;
        if (available.includes(preferredLanguage.value)) {
            activeLanguage.value = preferredLanguage.value;
            return;
        }
        activeLanguage.value = available[0] ?? "cpp17";
    },
    { immediate: true },
);

const variantsForLanguage = computed<AlgorithmVariant[]>(() =>
    (entry.value?.variants ?? []).filter((variant) => variant.language === activeLanguage.value),
);

const activeVariant = ref<AlgorithmVariant | null>(null);

watch(
    [variantsForLanguage, preferredVariant],
    () => {
        const variants = variantsForLanguage.value;
        if (!variants.length) {
            activeVariant.value = null;
            return;
        }
        const preferred = preferredVariant.value;
        const match = preferred ? variants.find((variant) => variant.id === preferred) : undefined;
        activeVariant.value = match ?? variants[0]!;
    },
    { immediate: true },
);

const html = ref<string>("");
const loading = ref(false);
const expanded = ref(false);
const copied = ref(false);

async function load() {
    const variant = activeVariant.value;
    if (!variant || !entry.value) {
        html.value = "";
        return;
    }
    loading.value = true;
    const fragment = await loadImplementationHtml(entry.value.id, variant.language, variant.id);
    html.value = fragment ?? "";
    loading.value = false;
}

watch([activeVariant], load, { immediate: true });

function selectLanguage(id: LanguageId) {
    activeLanguage.value = id;
    preferredLanguage.value = id;
}

function selectVariant(variant: AlgorithmVariant) {
    activeVariant.value = variant;
    preferredVariant.value = variant.id;
}

async function copySource() {
    if (!rawHref.value || rawHref.value === "#") return;
    const response = await fetch(rawHref.value);
    if (!response.ok) return;
    await navigator.clipboard.writeText(await response.text());
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1600);
}

const recommendationLabel = computed(() => {
    switch (activeVariant.value?.recommendation) {
        case "recommended":
            return "Recommended";
        case "conditional":
            return "Conditional";
        case "not-applicable":
            return "Not applicable";
        default:
            return "";
    }
});

const recommendationClass = computed(() => {
    switch (activeVariant.value?.recommendation) {
        case "recommended":
            return "";
        case "not-applicable":
            return "aayntn-variant-note__label--not-applicable";
        default:
            return "aayntn-variant-note__label--conditional";
    }
});

const rawHref = computed(() => {
    const variant = activeVariant.value;
    if (!variant || !entry.value) return "#";
    const extension: Record<LanguageId, string> = {
        c: "c",
        cpp17: "cpp",
        java: "java",
        python: "py",
        pascal: "pas",
        javascript: "js",
    };
    return `/implementations/${entry.value.id}/${variant.language}.${variant.id}.${extension[variant.language]}`;
});
</script>

<template>
    <section v-if="entry" class="aayntn-code" :class="{ 'aayntn-code--numbered': true }">
        <header class="aayntn-code__head">
            <span class="aayntn-code__lang">{{ LANGUAGE_LABELS[activeLanguage] }}</span>
            <span class="aayntn-code__file">{{ activeVariant?.file }}</span>
            <span
                v-if="activeVariant"
                class="aayntn-code__status"
                :class="
                    activeVariant.status === 'verified'
                        ? 'aayntn-code__status--verified'
                        : 'aayntn-code__status--unverified'
                "
            >
                <span class="aayntn-code__status-dot" aria-hidden="true" />
                {{ activeVariant.status === "verified" ? "Verified in CI" : "Not yet verified" }}
            </span>
            <div class="aayntn-code__actions">
                <button class="aayntn-code__action" type="button" @click="expanded = true">
                    Expand
                </button>
                <a class="aayntn-code__action" :href="rawHref" download>Raw source</a>
                <button class="aayntn-code__action" type="button" @click="copySource">
                    {{ copied ? "Copied" : "Copy" }}
                </button>
            </div>
        </header>

        <div class="aayntn-code-controls">
            <div class="aayntn-tablist" role="tablist" aria-label="Implementation language">
                <button
                    v-for="id in languages"
                    :key="id"
                    class="aayntn-tab"
                    type="button"
                    role="tab"
                    :aria-selected="activeLanguage === id"
                    @click="selectLanguage(id)"
                >
                    {{ LANGUAGE_LABELS[id] }}
                    <span
                        v-if="!isUsacoSubmittable(id)"
                        class="aayntn-tab__badge"
                        title="Educational reference implementation; not a USACO submission language"
                    >
                        edu
                    </span>
                </button>
            </div>

            <div
                v-if="variantsForLanguage.length > 1 && !hideVariants"
                class="aayntn-tablist"
                role="tablist"
                aria-label="Implementation variant"
            >
                <button
                    v-for="variant in variantsForLanguage"
                    :key="variant.id"
                    class="aayntn-tab"
                    type="button"
                    role="tab"
                    :aria-selected="activeVariant?.id === variant.id"
                    @click="selectVariant(variant)"
                >
                    {{ variant.id }}
                    <span v-if="variant.recommendation === 'recommended'" class="aayntn-tab__badge">
                        use
                    </span>
                </button>
            </div>
        </div>

        <div v-if="activeVariant" class="aayntn-variant-note">
            <span class="aayntn-variant-note__label" :class="recommendationClass">
                {{ recommendationLabel }} · {{ activeVariant.time }} time ·
                {{ activeVariant.auxiliarySpace }}
                auxiliary space
            </span>
            {{ activeVariant.reason }}
            <template v-if="activeVariant.notes">
                <br />
                {{ activeVariant.notes }}
            </template>
        </div>

        <div class="aayntn-code__body">
            <p v-if="loading" class="aayntn-code__loading">Loading source…</p>
            <!-- eslint-disable-next-line vue/no-v-html -- Shiki output is generated at build time from repository sources. -->
            <div v-else v-html="html" />
        </div>

        <Teleport to="body">
            <div v-if="expanded" class="aayntn-code-expanded" role="dialog" aria-modal="true">
                <div class="aayntn-code-expanded__bar">
                    <span class="aayntn-code__lang">{{ LANGUAGE_LABELS[activeLanguage] }}</span>
                    <span class="aayntn-code__file">{{ activeVariant?.file }}</span>
                    <button
                        class="aayntn-code__action"
                        type="button"
                        style="margin-left: auto"
                        @click="expanded = false"
                    >
                        Close
                    </button>
                </div>
                <div class="aayntn-code-expanded__body">
                    <!-- eslint-disable-next-line vue/no-v-html -- Build-time Shiki output. -->
                    <div v-html="html" />
                </div>
            </div>
        </Teleport>
    </section>

    <p v-else class="aayntn-code__loading">
        No implementation manifest is registered for
        <code>{{ algorithm }}</code>
        .
    </p>
</template>
