<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useData, useRoute, withBase } from "vitepress";
import type { NavigationGroup } from "../../../config";
import { useThemeToggle } from "../../composables/useTheme";
import { pagePath } from "../../composables/useBasePath";
import { sidebarOpen, toggleSidebar } from "../../composables/useSidebarToggle";
import SearchTrigger from "./SearchTrigger.vue";

const { theme } = useData();
const route = useRoute();
const { isDark, toggle } = useThemeToggle();

const navGroups = computed<NavigationGroup[]>(
    () => (theme.value.nav ?? []) as unknown as NavigationGroup[],
);
const openIndex = ref<number | null>(null);

watch(
    () => route.path,
    () => {
        openIndex.value = null;
        sidebarOpen.value = false;
    },
);

function triggerId(index: number): string {
    return `aayntn-nav-trigger-${index}`;
}

function menuId(index: number): string {
    return `aayntn-nav-menu-${index}`;
}

function isLinkActive(link: string): boolean {
    const path = pagePath(route.path);
    if (path === link || path === `${link}/`) return true;
    return path.startsWith(link.endsWith("/") ? link : `${link}/`);
}

const activeGroup = computed(() => {
    const direct = navGroups.value.find((group) =>
        group.items.some((item) => isLinkActive(item.link)),
    );
    if (direct) return direct.text;
    return (
        navGroups.value.find(
            (group) => group.activeMatch && pagePath(route.path).startsWith(group.activeMatch),
        )?.text ?? null
    );
});

function menuItems(index: number): HTMLElement[] {
    const menu = document.getElementById(menuId(index));
    return menu ? Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]')) : [];
}

function focusItem(index: number, placement: "first" | "last") {
    const items = menuItems(index);
    const item = placement === "first" ? items[0] : items[items.length - 1];
    item?.focus();
}

async function openMenu(index: number, placement: "first" | "last" | null = null) {
    openIndex.value = index;
    await nextTick();
    if (placement) focusItem(index, placement);
}

function closeMenu() {
    openIndex.value = null;
}

function onTriggerClick(event: MouseEvent, index: number) {
    if (openIndex.value === index) {
        closeMenu();
        return;
    }
    void openMenu(index, event.detail === 0 ? "first" : null);
}

function onTriggerKeydown(event: KeyboardEvent, index: number) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    void openMenu(index, event.key === "ArrowDown" ? "first" : "last");
}

function onMenuKeydown(event: KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const current = (event.target as HTMLElement).closest<HTMLElement>('[role="menuitem"]');
    if (!current) return;
    const items = Array.from(
        (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="menuitem"]'),
    );
    const position = items.indexOf(current);
    if (position === -1) return;
    event.preventDefault();
    const step = event.key === "ArrowDown" ? 1 : -1;
    items[(position + step + items.length) % items.length]?.focus();
}

function onDocumentKeydown(event: KeyboardEvent) {
    if (event.key !== "Escape" || openIndex.value === null) return;
    const trigger = document.getElementById(triggerId(openIndex.value));
    closeMenu();
    trigger?.focus();
}

function onDocumentPointerDown(event: PointerEvent) {
    if (openIndex.value === null) return;
    const target = event.target as Element | null;
    if (target?.closest(".aayntn-nav__group, .aayntn-nav__menu")) return;
    closeMenu();
}

onMounted(() => {
    document.addEventListener("keydown", onDocumentKeydown);
    document.addEventListener("pointerdown", onDocumentPointerDown);
});

onUnmounted(() => {
    document.removeEventListener("keydown", onDocumentKeydown);
    document.removeEventListener("pointerdown", onDocumentPointerDown);
});
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

            <a class="aayntn-brand" v-bind:href="withBase('/')">
                <span class="aayntn-brand__mark">A.A.Y.N.T.N.</span>
                <span class="aayntn-brand__tagline">All Algorithms You Need to Know</span>
            </a>

            <nav class="aayntn-nav" aria-label="Primary">
                <div class="aayntn-nav__strip">
                    <div
                        v-for="(group, index) in navGroups"
                        :key="group.text"
                        class="aayntn-nav__group"
                    >
                        <button
                            :id="triggerId(index)"
                            class="aayntn-nav__button"
                            :class="{
                                'is-active': activeGroup === group.text,
                                'is-open': openIndex === index,
                            }"
                            type="button"
                            aria-haspopup="menu"
                            :aria-expanded="openIndex === index"
                            :aria-controls="menuId(index)"
                            @click="onTriggerClick($event, index)"
                            @keydown="onTriggerKeydown($event, index)"
                        >
                            <span class="aayntn-nav__label">{{ group.text }}</span>
                            <svg
                                class="aayntn-nav__chevron"
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                aria-hidden="true"
                            >
                                <path
                                    d="M2 3.5 5 6.5 8 3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.4"
                                    stroke-linecap="square"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="aayntn-nav__panels">
                    <div
                        v-for="(group, index) in navGroups"
                        v-show="openIndex === index"
                        :id="menuId(index)"
                        :key="group.text"
                        class="aayntn-nav__menu"
                        role="menu"
                        :aria-labelledby="triggerId(index)"
                        @keydown="onMenuKeydown"
                    >
                        <div class="aayntn-nav__menu-inner">
                            <div class="aayntn-nav__menu-head">
                                <span class="aayntn-nav__menu-title">{{ group.text }}</span>
                                <span class="aayntn-nav__menu-count">
                                    {{ group.items.length }} destinations
                                </span>
                            </div>
                            <ul class="aayntn-nav__list">
                                <li v-for="item in group.items" :key="item.link">
                                    <a
                                        class="aayntn-nav__item"
                                        :class="{ 'is-active': isLinkActive(item.link) }"
                                        :href="withBase(item.link)"
                                        role="menuitem"
                                        :aria-current="isLinkActive(item.link) ? 'page' : undefined"
                                        @click="closeMenu"
                                    >
                                        <span class="aayntn-nav__item-label">
                                            {{ item.text }}
                                        </span>
                                        <span class="aayntn-nav__item-description">
                                            {{ item.description }}
                                        </span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

            <div class="aayntn-header__tools">
                <SearchTrigger />
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
