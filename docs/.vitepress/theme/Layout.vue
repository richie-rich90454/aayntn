<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from "vue";
import { Content, useData, useRoute } from "vitepress";
import SiteHeader from "./components/navigation/SiteHeader.vue";
import SiteFooter from "./components/navigation/SiteFooter.vue";
import SidebarNav from "./components/navigation/SidebarNav.vue";
import OutlineNav from "./components/navigation/OutlineNav.vue";
import ArticleBreadcrumbs from "./components/article/ArticleBreadcrumbs.vue";
import ArticleMeta from "./components/article/ArticleMeta.vue";
import ArticlePager from "./components/article/ArticlePager.vue";
import HomeLayout from "./HomeLayout.vue";
import { initPreferences } from "./composables/usePreferences";
import { enhanceSourceArchive } from "./composables/useSourceArchive";
import { sidebarOpen } from "./composables/useSidebarToggle";
import { LANGUAGE_IDS } from "../data/types";

/**
 * The root layout.
 *
 * `layout: false` in the frontmatter hands the whole page to the bespoke
 * homepage; every other page uses the standard article frame.
 */

const { frontmatter } = useData();

const isHome = computed(() => frontmatter.value.layout === false);
const hasSidebar = computed(() => frontmatter.value.sidebar !== false && !isHome.value);

/**
 * The rail carries the outline when the page has headings, and the article
 * actions on every page that is not a bespoke layout. A page that turns the
 * outline off turns the rail off with it.
 */
const hasRail = computed(() => {
    if (frontmatter.value.outline === false) return false;
    if (frontmatter.value.layout === "page") return false;
    return !isHome.value;
});

const route = useRoute();

/*
 * Preferences live in localStorage, which does not exist during the server
 * render. Applying them only after hydration keeps the first client render
 * identical to the server render; the code viewer reacts to the change.
 */
onMounted(() => {
    initPreferences(LANGUAGE_IDS);
    enhanceSourceArchive();
});

watch(
    () => route.path,
    async () => {
        await nextTick();
        enhanceSourceArchive();
    },
);
</script>

<template>
    <div v-if="isHome" class="aayntn-shell">
        <SiteHeader />
        <main id="main">
            <HomeLayout />
        </main>
        <SiteFooter />
    </div>

    <div v-else class="aayntn-shell">
        <a class="skip-link" href="#main">Skip to content</a>
        <SiteHeader />

        <div
            class="aayntn-body"
            :class="{
                'aayntn-body--no-sidebar': !hasSidebar,
            }"
        >
            <SidebarNav v-if="hasSidebar" :class="{ 'is-open': sidebarOpen }" />
            <div
                v-if="hasSidebar && sidebarOpen"
                class="aayntn-scrim"
                aria-hidden="true"
                @click="sidebarOpen = false"
            />

            <div class="aayntn-content" :class="{ 'aayntn-content--no-outline': !hasRail }">
                <main id="main" class="aayntn-main">
                    <article class="aayntn-article">
                        <header v-if="frontmatter.title" class="aayntn-article__header">
                            <ArticleBreadcrumbs />
                            <h1 class="aayntn-article__title">{{ frontmatter.title }}</h1>
                            <p v-if="frontmatter.summary" class="aayntn-article__summary">
                                {{ frontmatter.summary }}
                            </p>
                            <ArticleMeta />
                        </header>

                        <div class="aayntn-article__body aayntn-prose">
                            <Content />
                        </div>

                        <ArticlePager />
                    </article>
                </main>

                <OutlineNav v-if="hasRail" />
            </div>
        </div>

        <SiteFooter />
    </div>
</template>
