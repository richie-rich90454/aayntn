<script setup lang="ts">
import { computed } from "vue";
import { Content, useData } from "vitepress";
import SiteHeader from "./components/navigation/SiteHeader.vue";
import SiteFooter from "./components/navigation/SiteFooter.vue";
import SidebarNav from "./components/navigation/SidebarNav.vue";
import OutlineNav from "./components/navigation/OutlineNav.vue";
import HomeLayout from "./HomeLayout.vue";
import { initPreferences } from "./composables/usePreferences";
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
const hasOutline = computed(
    () => frontmatter.value.outline !== false && frontmatter.value.layout !== "page",
);

initPreferences(LANGUAGE_IDS);
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
                'aayntn-body--no-outline': !hasOutline,
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

            <main id="main" class="aayntn-main">
                <article class="aayntn-article">
                    <header v-if="frontmatter.title" class="aayntn-article__header">
                        <div v-if="frontmatter.division?.length" class="aayntn-article__eyebrow">
                            <span
                                v-for="division in frontmatter.division"
                                :key="division"
                                class="aayntn-chip"
                                :class="`aayntn-chip--${division}`"
                            >
                                {{ division }}
                            </span>
                        </div>
                        <h1 class="aayntn-article__title">{{ frontmatter.title }}</h1>
                        <p v-if="frontmatter.summary" class="aayntn-article__summary">
                            {{ frontmatter.summary }}
                        </p>
                    </header>

                    <div class="aayntn-article__body aayntn-prose">
                        <Content />
                    </div>
                </article>
            </main>

            <OutlineNav v-if="hasOutline" />
        </div>

        <SiteFooter />
    </div>
</template>
