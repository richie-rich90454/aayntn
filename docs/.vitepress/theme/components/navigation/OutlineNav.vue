<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useData } from "vitepress";
import { useStudyMode } from "../../composables/useStudyMode";
import CopyLinkButton from "../article/CopyLinkButton.vue";

/**
 * The section rail.
 *
 * The headings come from the anchors VitePress already extracts, so the rail
 * can never disagree with the document body. The rail also carries the two
 * actions that belong to the page as a whole: the study mode toggle and the
 * copy-link control.
 */

const { page } = useData();
const { study, toggle } = useStudyMode();
const activeSlug = ref("");

interface Heading {
    level: number;
    title: string;
    slug: string;
}

const headings = computed(() => (page.value.headers ?? []) as Heading[]);

/**
 * The line above which a heading counts as reached. It follows the scroll
 * padding the stylesheet sets, because the anchor handler lands a heading a
 * little below the top of the page and a fixed threshold would leave the
 * heading the reader followed unmarked.
 */
function activeLine(): number {
    if (typeof window === "undefined") return 120;
    const padding = Number.parseFloat(
        window.getComputedStyle(document.documentElement).scrollPaddingTop,
    );
    return Number.isFinite(padding) ? padding + 48 : 120;
}

function onScroll() {
    const headingsInOrder = headings.value;
    const line = activeLine();
    let current = "";
    for (const heading of headingsInOrder) {
        const element = document.getElementById(heading.slug);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= line) current = heading.slug;
    }
    activeSlug.value = current;
}

onMounted(() => {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => window.removeEventListener("scroll", onScroll));

watch(
    () => page.value.relativePath,
    () => {
        activeSlug.value = "";
        requestAnimationFrame(onScroll);
    },
);
</script>

<template>
    <aside class="aayntn-outline aayntn-rail" aria-label="Article navigation">
        <div class="aayntn-rail__actions">
            <button
                class="aayntn-rail__action"
                type="button"
                :aria-pressed="study"
                data-study-toggle
                @click="toggle"
            >
                <span>Study mode</span>
                <span class="aayntn-rail__state">{{ study ? "On" : "Off" }}</span>
            </button>
            <CopyLinkButton label="Copy page link" />
        </div>

        <nav v-if="headings.length" class="aayntn-rail__sections" aria-label="On this page">
            <div class="aayntn-outline__title">On this page</div>
            <a
                v-for="heading in headings"
                :key="heading.slug"
                class="aayntn-outline__link"
                :class="[
                    `aayntn-outline__link--depth-${heading.level}`,
                    { 'is-active': activeSlug === heading.slug },
                ]"
                :href="`#${heading.slug}`"
                :aria-current="activeSlug === heading.slug ? 'location' : undefined"
            >
                {{ heading.title }}
            </a>
        </nav>
    </aside>
</template>
