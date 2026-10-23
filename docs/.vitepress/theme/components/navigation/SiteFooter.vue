<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";
import { repositoryFile } from "../../repository";

const { theme } = useData();

const columns = computed(() => [
    {
        heading: "Learn",
        links: [
            { text: "Start here", href: withBase("/start/") },
            { text: "From AP Computer Science A", href: withBase("/start/from-ap-csa/") },
            { text: "The curriculum", href: withBase("/curriculum/") },
            { text: "Bronze to Platinum", href: withBase("/curriculum/bronze/") },
        ],
    },
    {
        heading: "Reference",
        links: [
            { text: "The encyclopedia", href: withBase("/algorithms/") },
            { text: "The laboratory", href: withBase("/laboratory/") },
            { text: "The mathematics", href: withBase("/mathematics/") },
            { text: "The practice catalog", href: withBase("/practice/") },
        ],
    },
    {
        heading: "Build",
        links: [
            { text: "The language centers", href: withBase("/languages/") },
            { text: "The template library", href: withBase("/templates/") },
            { text: "The competition rules", href: withBase("/reference/usaco-rules") },
            { text: "The pre-contest checklist", href: withBase("/reference/contest-checklist") },
        ],
    },
    {
        heading: "The project",
        links: [
            { text: "About this encyclopedia", href: withBase("/about") },
            { text: "Contributing", href: repositoryFile("CONTRIBUTING.md") },
            { text: "Code of conduct", href: repositoryFile("CODE_OF_CONDUCT.md") },
            { text: "Accessibility", href: repositoryFile("ACCESSIBILITY.md") },
            { text: "Trademarks and affiliation", href: repositoryFile("TRADEMARKS.md") },
            { text: "Security policy", href: repositoryFile("SECURITY.md") },
        ],
    },
]);
</script>

<template>
    <footer class="aayntn-footer">
        <div class="aayntn-footer__inner">
            <div>
                <div class="aayntn-footer__brand">A.A.Y.N.T.N.</div>
                <p class="aayntn-footer__tagline">
                    All Algorithms You Need to Know. A competitive programming encyclopedia built
                    for USACO preparation, written in Markdown, proven in six languages, and
                    published as static files.
                </p>
            </div>

            <div v-for="column in columns" :key="column.heading">
                <div class="aayntn-footer__heading">{{ column.heading }}</div>
                <ul class="aayntn-footer__list">
                    <li v-for="link in column.links" :key="link.href">
                        <a :href="link.href">{{ link.text }}</a>
                    </li>
                </ul>
            </div>
        </div>

        <div class="aayntn-footer__legal">
            <p>{{ theme.footer?.message }}</p>
            <p>{{ theme.footer?.copyright }}</p>
        </div>
    </footer>
</template>
