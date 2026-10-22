<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useData, useRoute } from "vitepress";
import { useThemeToggle } from "../../composables/useTheme";
import { sidebarOpen, toggleSidebar } from "../../composables/useSidebarToggle";
import SearchOverlay from "./SearchOverlay.vue";

const { theme } = useData();
const route = useRoute();
const { isDark, toggle } = useThemeToggle();

watch(
    () => route.path,
    () => {
        sidebarOpen.value = false;
    },
);

const navItems = computed(() => theme.value.nav ?? []);

function isActive(item: { link?: string; activeMatch?: string }): boolean {
    const path = route.path;
    if (item.activeMatch) return path.startsWith(item.activeMatch);
    if (item.link) return path === item.link || path.startsWith(item.link);
    return false;
}
</script>

<template>
    <header class="aayntn-header">
        <div class="aayntn-header__inner">
            <button
                class="aayntn-icon-button aayntn-menu-button"
                type="button"
                :aria-expanded="sidebarOpen"
                aria-controls="aayntn-sidebar"
                aria-label="Open the section navigation"
                @click="toggleSidebar"
            >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path
                        d="M2 4h14M2 9h14M2 14h14"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="square"
                    />
                </svg>
            </button>

            <a class="aayntn-brand" href="/">
                <span class="aayntn-brand__mark">A.A.Y.N.T.N.</span>
                <span class="aayntn-brand__tagline">All Algorithms You Need to Know</span>
            </a>

            <nav class="aayntn-nav" aria-label="Primary">
                <a
                    v-for="item in navItems"
                    :key="item.text"
                    class="aayntn-nav__link"
                    :class="{ 'is-active': isActive(item) }"
                    :href="item.link"
                >
                    {{ item.text }}
                </a>
            </nav>

            <div class="aayntn-header__tools">
                <SearchOverlay />
                <button
                    class="aayntn-icon-button"
                    type="button"
                    :aria-label="isDark ? 'Switch to the light theme' : 'Switch to the dark theme'"
                    :title="isDark ? 'Switch to the light theme' : 'Switch to the dark theme'"
                    @click="toggle"
                >
                    <svg
                        v-if="isDark"
                        width="18"
                        height="18"
                        viewBox="0 0 18 18"
                        aria-hidden="true"
                    >
                        <circle cx="9" cy="9" r="3.4" fill="currentColor" />
                        <path
                            d="M9 1v2.2M9 14.8V17M1 9h2.2M14.8 9H17M3.3 3.3l1.6 1.6M13.1 13.1l1.6 1.6M14.7 3.3l-1.6 1.6M4.9 13.1l-1.6 1.6"
                            stroke="currentColor"
                            stroke-width="1.4"
                            stroke-linecap="square"
                        />
                    </svg>
                    <svg v-else width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                        <path
                            d="M14.8 11.6A6.4 6.4 0 0 1 6.4 3.2a6.4 6.4 0 1 0 8.4 8.4z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>
        </div>
    </header>
</template>
