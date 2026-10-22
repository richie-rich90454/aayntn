import { onMounted, onBeforeUnmount, ref, watch } from "vue";

/**
 * Appearance toggle.
 *
 * VitePress owns the `html.dark` class and the `vitepress-theme-appearance`
 * storage key. We manipulate both directly rather than instantiating a second
 * `useDark`, so that there is exactly one source of truth for the class and
 * the internal VitePress ref can never drift out of sync with the DOM.
 *
 * The state is shared by every component that draws, so that a picture that
 * is drawn in the colors of the page redraws itself when the page changes
 * its appearance.
 */
const APPEARANCE_KEY = "vitepress-theme-appearance";

const isDark = ref(false);
let observer: MutationObserver | undefined;
let watching = 0;

function sync() {
    isDark.value = document.documentElement.classList.contains("dark");
}

export function useThemeToggle() {
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

    onMounted(() => {
        sync();
        if (!observer) {
            observer = new MutationObserver(sync);
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ["class"],
            });
        }
        watching += 1;
    });

    onBeforeUnmount(() => {
        watching -= 1;
        if (watching <= 0 && observer) {
            observer.disconnect();
            observer = undefined;
        }
    });

    return { isDark, toggle };
}

/**
 * The appearance of the page, for the parts of the theme that draw in the
 * colors of the page rather than in the colors of a style sheet.
 */
export function useAppearance() {
    onMounted(sync);
    return isDark;
}

/** Redraw when the appearance changes. */
export function onAppearanceChange(callback: () => void) {
    const appearance = useAppearance();
    watch(appearance, callback);
}
