import { onMounted, onBeforeUnmount, ref } from "vue";

/**
 * Appearance toggle.
 *
 * VitePress owns the `html.dark` class and the `vitepress-theme-appearance`
 * storage key. We manipulate both directly rather than instantiating a second
 * `useDark`, so there is exactly one source of truth for the class and the
 * internal VitePress ref can never drift out of sync with the DOM.
 */
const APPEARANCE_KEY = "vitepress-theme-appearance";

export function useThemeToggle() {
    const isDark = ref(false);

    const sync = () => {
        isDark.value = document.documentElement.classList.contains("dark");
    };

    const toggle = () => {
        const next = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", next);
        try {
            localStorage.setItem(APPEARANCE_KEY, next ? "dark" : "light");
        } catch {
            // Private browsing modes can refuse storage; the class change still applies.
        }
        sync();
    };

    onMounted(sync);
    onBeforeUnmount(() => {});

    return { isDark, toggle };
}
