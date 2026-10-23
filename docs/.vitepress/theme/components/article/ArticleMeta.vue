<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useData, withBase } from "vitepress";
import type { AlgorithmEntry } from "../../../data/types";
import algorithms from "../../../data/generated/algorithms.json";
import { lookupLesson } from "../../composables/useReadingOrder";
import CopyLinkButton from "./CopyLinkButton.vue";
import LessonStatus from "./LessonStatus.vue";

/**
 * The article header card.
 *
 * Everything a reader wants before committing to a long page: which
 * divisions it serves, how long it is, what it costs, what it assumes, and
 * how much code it carries. The card is built from the frontmatter and the
 * generated algorithm index, so a page can never describe itself wrongly.
 */

const { frontmatter, page } = useData();

const divisions = computed(() => (frontmatter.value.division ?? []) as string[]);
const level = computed(() => {
    const value = frontmatter.value.level;
    return typeof value === "string" ? value.charAt(0).toUpperCase() + value.slice(1) : "";
});
const complexity = computed(() => {
    const value = frontmatter.value.complexity;
    return (value ?? {}) as { time?: string; space?: string };
});
const lessonId = computed(() => {
    const value = frontmatter.value.id;
    return typeof value === "string" ? value : "";
});

const requirements = computed(() => {
    const ids = (frontmatter.value.prerequisites?.required ?? []) as string[];
    return ids.map((id) => {
        const lesson = lookupLesson(id);
        return { id, title: lesson?.title ?? id, href: lesson?.href ?? null };
    });
});

const implementations = ref<number | null>(null);

watch(
    () => frontmatter.value.implementations as string | undefined,
    (id) => {
        implementations.value = null;
        if (!id) return;
        const entry = (algorithms as AlgorithmEntry[]).find((item) => item.id === id);
        implementations.value = entry ? entry.variants.length : null;
    },
    { immediate: true },
);

const minutes = ref(0);

function measureReadingTime() {
    if (typeof document === "undefined") return;
    const body = document.querySelector(".aayntn-article__body");
    const words = (body?.textContent ?? "").trim().split(/\s+/).filter(Boolean).length;
    minutes.value = words > 0 ? Math.max(1, Math.round(words / 220)) : 0;
}

watch(
    () => page.value.relativePath,
    () => {
        nextTick(measureReadingTime);
    },
    { immediate: true },
);

onMounted(measureReadingTime);

const visible = computed(
    () =>
        divisions.value.length > 0 ||
        Boolean(level.value || complexity.value.time || complexity.value.space || lessonId.value),
);
</script>

<template>
    <section v-if="visible" class="aayntn-article-meta" aria-label="Article details">
        <div class="aayntn-article-meta__chips">
            <span
                v-for="division in divisions"
                :key="division"
                class="aayntn-chip"
                :class="`aayntn-chip--${division}`"
            >
                {{ division }}
            </span>
            <span v-if="level" class="aayntn-chip aayntn-chip--muted">{{ level }}</span>
        </div>

        <dl class="aayntn-article-meta__facts">
            <div v-if="complexity.time" class="aayntn-article-meta__fact">
                <dt>Time</dt>
                <dd>
                    <code>{{ complexity.time }}</code>
                </dd>
            </div>
            <div v-if="complexity.space" class="aayntn-article-meta__fact">
                <dt>Space</dt>
                <dd>
                    <code>{{ complexity.space }}</code>
                </dd>
            </div>
            <div v-if="minutes > 0" class="aayntn-article-meta__fact">
                <dt>Reading time</dt>
                <dd>{{ minutes }} min</dd>
            </div>
            <div v-if="implementations !== null" class="aayntn-article-meta__fact">
                <dt>Implementations</dt>
                <dd>{{ implementations }}</dd>
            </div>
        </dl>

        <div v-if="requirements.length" class="aayntn-article-meta__requirements">
            <span class="aayntn-article-meta__label">Required background</span>
            <ul>
                <li v-for="requirement in requirements" :key="requirement.id">
                    <a v-if="requirement.href" :href="withBase(requirement.href)">
                        {{ requirement.title }}
                    </a>
                    <span v-else>{{ requirement.title }}</span>
                </li>
            </ul>
        </div>

        <div class="aayntn-article-meta__actions">
            <CopyLinkButton />
            <LessonStatus v-if="lessonId" :lesson-id="lessonId" />
        </div>
    </section>
</template>
