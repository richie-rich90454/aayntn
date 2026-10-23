<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, withBase } from "vitepress";
import { useSidebar } from "vitepress/theme";

/**
 * Subject navigation.
 *
 * The sidebar is rendered from the VitePress theme configuration, so there is
 * exactly one description of the information architecture. Only the group
 * that holds the current page is open; the others wait behind their heading.
 */

const route = useRoute();
const { sidebar } = useSidebar();

interface SidebarItem {
    text: string;
    link?: string;
    items?: SidebarItem[];
    collapsed?: boolean;
}

const groups = computed(() => (sidebar.value ?? []) as SidebarItem[]);
const openIndex = ref<number | null>(null);

function isActive(item: SidebarItem): boolean {
    if (!item.link) return false;
    const path = route.path;
    return path === item.link || path.startsWith(item.link + "/");
}

function hasActive(item: SidebarItem): boolean {
    return isActive(item) || (item.items ?? []).some(hasActive);
}

function countItems(items: SidebarItem[] | undefined): number {
    if (!items) return 0;
    return items.reduce((total, item) => total + (item.link ? 1 : 0) + countItems(item.items), 0);
}

function findActiveGroup(): number | null {
    const index = groups.value.findIndex((group) => (group.items ?? []).some(hasActive));
    return index === -1 ? null : index;
}

watch(
    [() => route.path, groups],
    () => {
        openIndex.value = findActiveGroup();
    },
    { immediate: true },
);

function toggleGroup(index: number) {
    openIndex.value = openIndex.value === index ? null : index;
}
</script>

<template>
    <nav class="aayntn-sidebar" id="aayntn-sidebar" aria-label="Section navigation">
        <div v-for="(group, index) in groups" :key="group.text" class="aayntn-sidebar__group">
            <h2 class="aayntn-sidebar__heading">
                <button
                    class="aayntn-sidebar__toggle"
                    type="button"
                    :aria-expanded="openIndex === index"
                    :aria-controls="`aayntn-sidebar-group-${index}`"
                    @click="toggleGroup(index)"
                >
                    <span class="aayntn-sidebar__name">{{ group.text }}</span>
                    <span
                        class="aayntn-sidebar__count"
                        :aria-label="`${countItems(group.items)} links`"
                    >
                        {{ countItems(group.items) }}
                    </span>
                    <svg
                        class="aayntn-sidebar__chevron"
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        aria-hidden="true"
                    >
                        <path
                            d="M3.5 2 6.5 5 3.5 8"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.4"
                            stroke-linecap="square"
                        />
                    </svg>
                </button>
            </h2>

            <div
                v-show="openIndex === index"
                :id="`aayntn-sidebar-group-${index}`"
                class="aayntn-sidebar__items"
            >
                <template v-for="item in group.items ?? []" :key="item.text">
                    <a
                        v-if="item.link"
                        class="aayntn-sidebar__link"
                        :class="{ 'is-active': isActive(item) }"
                        :href="withBase(item.link)"
                        :aria-current="isActive(item) ? 'page' : undefined"
                    >
                        {{ item.text }}
                    </a>
                    <a
                        v-for="child in item.items ?? []"
                        :key="child.text"
                        class="aayntn-sidebar__link aayntn-sidebar__link--child"
                        :class="{ 'is-active': isActive(child) }"
                        :href="withBase(child.link ?? '/')"
                        :aria-current="isActive(child) ? 'page' : undefined"
                    >
                        {{ child.text }}
                    </a>
                </template>
            </div>
        </div>
    </nav>
</template>
