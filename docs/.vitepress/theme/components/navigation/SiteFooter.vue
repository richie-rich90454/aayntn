<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";

const { theme } = useData();

const columns = computed(() => [
    {
        heading: "Learn",
        links: [
            { text: "Start here", href: "/start/" },
            { text: "From AP Computer Science A", href: "/start/from-ap-csa/" },
            { text: "Curriculum", href: "/curriculum/" },
            { text: "Bronze to Platinum", href: "/curriculum/bronze/" },
        ],
    },
    {
        heading: "Reference",
        links: [
            { text: "Algorithm encyclopedia", href: "/algorithms/" },
            { text: "Interactive laboratory", href: "/laboratory/" },
            { text: "Mathematics", href: "/mathematics/" },
            { text: "Practice catalogue", href: "/practice/" },
        ],
    },
    {
        heading: "Build",
        links: [
            { text: "Language centers", href: "/languages/" },
            { text: "Template library", href: "/templates/" },
            { text: "USACO rules", href: "/reference/usaco-rules" },
            { text: "Contest checklist", href: "/reference/contest-checklist" },
        ],
    },
]);
</script>

<template>
    <footer class="aayntn-footer">
        <div class="aayntn-footer__inner">
            <div>
                <div class="aayntn-footer__brand">aayntn</div>
                <p class="aayntn-footer__tagline">
                    All Algorithms You Need to Know — a competitive programming encyclopedia built
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
