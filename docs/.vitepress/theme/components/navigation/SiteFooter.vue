<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import { repositoryFile } from "../../repository";

const { theme } = useData();

const columns = computed(() => [
    {
        heading: "Learn",
        links: [
            { text: "Start here", href: "/start/" },
            { text: "From AP Computer Science A", href: "/start/from-ap-csa/" },
            { text: "The curriculum", href: "/curriculum/" },
            { text: "Bronze to Platinum", href: "/curriculum/bronze/" },
        ],
    },
    {
        heading: "Reference",
        links: [
            { text: "The encyclopedia", href: "/algorithms/" },
            { text: "The laboratory", href: "/laboratory/" },
            { text: "The mathematics", href: "/mathematics/" },
            { text: "The practice catalog", href: "/practice/" },
        ],
    },
    {
        heading: "Build",
        links: [
            { text: "The language centers", href: "/languages/" },
            { text: "The template library", href: "/templates/" },
            { text: "The competition rules", href: "/reference/usaco-rules" },
            { text: "The pre-contest checklist", href: "/reference/contest-checklist" },
        ],
    },
    {
        heading: "The project",
        links: [
            { text: "About this encyclopedia", href: "/about/" },
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
