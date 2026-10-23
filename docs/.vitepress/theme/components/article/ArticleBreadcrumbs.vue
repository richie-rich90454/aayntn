<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";
import { lookupHref, lookupLesson, pageHref } from "../../composables/useReadingOrder";

/**
 * Breadcrumbs.
 *
 * The subject index is taken from the frontmatter when the page names one,
 * and from the route otherwise. When no index page exists the crumb is still
 * shown, but it is not a link: a breadcrumb must never lead to a 404.
 */

const { frontmatter, page } = useData();

interface Crumb {
    title: string;
    href: string | null;
}

function labelFromSegment(segment: string): string {
    const words = segment.replace(/-/g, " ");
    return words.charAt(0).toUpperCase() + words.slice(1);
}

const section = computed<Crumb | null>(() => {
    const relative = page.value.relativePath ?? "";
    if (/(^|\/)index\.md$/.test(relative)) return null;

    const subjects = (frontmatter.value.subjects ?? []) as string[];
    const bySubject = subjects.length > 0 ? lookupLesson(`${subjects[0]}.index`) : undefined;
    if (bySubject) return { title: bySubject.title, href: bySubject.href };

    const directory = relative.split("/").slice(0, -1).join("/");
    if (!directory) return null;
    const byRoute = lookupHref(pageHref(directory + "/index.md"));
    if (byRoute) return { title: byRoute.title, href: byRoute.href };

    const segment = directory.split("/").pop() ?? "";
    return segment ? { title: labelFromSegment(segment), href: null } : null;
});
</script>

<template>
    <nav class="aayntn-crumbs" aria-label="Breadcrumb">
        <ol>
            <li v-if="section">
                <a v-if="section.href" :href="withBase(section.href)">{{ section.title }}</a>
                <span v-else>{{ section.title }}</span>
            </li>
            <li aria-current="page">{{ frontmatter.title }}</li>
        </ol>
    </nav>
</template>
