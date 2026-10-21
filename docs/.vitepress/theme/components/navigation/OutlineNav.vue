<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useData } from "vitepress";

/**
 * Page outline.
 *
 * Built from the Markdown heading anchors that VitePress already extracts, so
 * the outline can never disagree with the document body.
 */

const { page } = useData();
const activeSlug = ref("");

interface Heading {
    level: number;
    title: string;
    slug: string;
}

const headings = computed(() => (page.value.headers ?? []) as Heading[]);

function slugify(text: string): string {
    return text
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
}

function onScroll() {
    const headingsInOrder = headings.value;
    let current = "";
    for (const heading of headingsInOrder) {
        const element = document.getElementById(heading.slug);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= 120) current = heading.slug;
    }
    activeSlug.value = current;
}

onMounted(() => {
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
    <aside v-if="headings.length" class="aayntn-outline" aria-label="On this page">
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
        >
            {{ heading.title }}
        </a>
    </aside>
</template>
