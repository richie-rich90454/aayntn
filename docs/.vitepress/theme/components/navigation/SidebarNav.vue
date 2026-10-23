<script setup lang="ts">
import { computed } from "vue";
import { useRoute, withBase } from "vitepress";
import { useSidebar } from "vitepress/theme";

/**
 * Subject navigation.
 *
 * The sidebar is rendered from the VitePress theme configuration, so there is
 * exactly one description of the information architecture.
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

function isActive(item: SidebarItem): boolean {
    if (!item.link) return false;
    const path = route.path;
    return path === item.link || path.startsWith(item.link + "/");
}
</script>

<template>
    <nav class="aayntn-sidebar" id="aayntn-sidebar" aria-label="Section navigation">
        <div v-for="group in groups" :key="group.text" class="aayntn-sidebar__group">
            <div class="aayntn-sidebar__title">{{ group.text }}</div>
            <template v-for="item in group.items ?? []" :key="item.text">
                <a
                    class="aayntn-sidebar__link"
                    :class="{ 'is-active': isActive(item) }"
                    :href="withBase(item.link ?? '/')"
                    :aria-current="isActive(item) ? 'page' : undefined"
                >
                    {{ item.text }}
                </a>
                <template v-if="item.items">
                    <a
                        v-for="child in item.items"
                        :key="child.text"
                        class="aayntn-sidebar__link"
                        :class="{ 'is-active': isActive(child) }"
                        style="padding-left: 1.75rem; font-size: 0.875rem"
                        :href="withBase(child.link ?? '/')"
                    >
                        {{ child.text }}
                    </a>
                </template>
            </template>
        </div>
    </nav>
</template>
