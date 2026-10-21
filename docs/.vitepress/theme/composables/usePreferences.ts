import { ref, watch } from "vue";
import type { LanguageId } from "../../data/types";

/**
 * Reading preferences.
 *
 * The chosen implementation language and variant are remembered between
 * lessons so that a reader who works in Java does not have to re-select it on
 * every page. Everything is stored locally; no account is involved.
 */

const LANGUAGE_KEY = "aayntn:language";
const VARIANT_KEY = "aayntn:variant";

export const language = ref<LanguageId>("cpp17");
export const preferredVariant = ref<string | null>(null);

function read<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
    if (typeof localStorage === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
    } catch {
        return fallback;
    }
}

export function initPreferences(allowedLanguages: readonly LanguageId[]) {
    language.value = read(LANGUAGE_KEY, allowedLanguages, "cpp17");
    preferredVariant.value =
        typeof localStorage === "undefined" ? null : (localStorage.getItem(VARIANT_KEY) ?? null);
}

watch(language, (value) => {
    if (typeof localStorage === "undefined") return;
    try {
        localStorage.setItem(LANGUAGE_KEY, value);
    } catch {
        // Storage unavailable — the preference simply will not persist.
    }
});

watch(preferredVariant, (value) => {
    if (typeof localStorage === "undefined") return;
    try {
        if (value) localStorage.setItem(VARIANT_KEY, value);
        else localStorage.removeItem(VARIANT_KEY);
    } catch {
        // Ignore.
    }
});
