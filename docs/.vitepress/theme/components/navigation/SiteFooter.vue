<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";
import { REPOSITORY_URL, repositoryFile } from "../../repository";

const { theme } = useData();

const columns = computed(() => [
    {
        heading: "Learn",
        links: [
            { text: "Start here", href: withBase("/start/") },
            { text: "Curriculum", href: withBase("/curriculum/") },
            { text: "Practice", href: withBase("/practice/") },
            { text: "Contest", href: withBase("/contest/") },
        ],
    },
    {
        heading: "Reference",
        links: [
            { text: "Algorithms", href: withBase("/algorithms/") },
            { text: "Mathematics", href: withBase("/mathematics/") },
            { text: "Templates", href: withBase("/templates/") },
            { text: "Languages", href: withBase("/languages/") },
        ],
    },
    {
        heading: "Tools",
        links: [
            { text: "Laboratory", href: withBase("/laboratory/") },
            { text: "Debugging", href: withBase("/debugging/") },
            { text: "My progress", href: withBase("/progress/") },
            { text: "Coverage", href: withBase("/coverage/") },
        ],
    },
    {
        heading: "About",
        links: [
            { text: "About", href: withBase("/about") },
            { text: "Download", href: withBase("/download/") },
            { text: "Glossary", href: withBase("/reference/glossary") },
        ],
    },
]);

const documents = [
    { text: "Contributing", file: "CONTRIBUTING.md" },
    { text: "Code of conduct", file: "CODE_OF_CONDUCT.md" },
    { text: "Accessibility", file: "ACCESSIBILITY.md" },
    { text: "Trademarks", file: "TRADEMARKS.md" },
    { text: "Security", file: "SECURITY.md" },
];
</script>

<template>
    <footer class="aayntn-footer">
        <div class="aayntn-footer__inner">
            <div class="aayntn-footer__lede">
                <div class="aayntn-footer__brand">A.A.Y.N.T.N.</div>
                <p class="aayntn-footer__tagline">
                    All Algorithms You Need to Know. A competitive programming encyclopedia built
                    for USACO preparation, written in Markdown, proven in six languages, and
                    published as static files.
                </p>
            </div>

            <nav
                v-for="column in columns"
                :key="column.heading"
                class="aayntn-footer__column"
                :aria-label="`${column.heading} links`"
            >
                <h2 class="aayntn-footer__heading">{{ column.heading }}</h2>
                <ul class="aayntn-footer__list">
                    <li v-for="link in column.links" :key="link.href">
                        <a :href="link.href">{{ link.text }}</a>
                    </li>
                </ul>
            </nav>
        </div>

        <div class="aayntn-footer__legal">
            <div class="aayntn-footer__legal-inner">
                <p class="aayntn-footer__licence">{{ theme.footer?.copyright }}</p>
                <p class="aayntn-footer__trademark">{{ theme.footer?.message }}</p>
                <ul class="aayntn-footer__documents">
                    <li v-for="document in documents" :key="document.file">
                        <a :href="repositoryFile(document.file)">{{ document.text }}</a>
                    </li>
                </ul>
                <p class="aayntn-footer__source">
                    <a :href="REPOSITORY_URL">The source and its history on GitHub</a>
                </p>
            </div>
        </div>
    </footer>
</template>
