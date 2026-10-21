import { ref } from "vue";

/**
 * Subject-navigation drawer state.
 *
 * Module scope so that the header button and the layout agree on a single
 * source of truth.
 */
export const sidebarOpen = ref(false);

export function toggleSidebar() {
    sidebarOpen.value = !sidebarOpen.value;
}

export function closeSidebar() {
    sidebarOpen.value = false;
}
