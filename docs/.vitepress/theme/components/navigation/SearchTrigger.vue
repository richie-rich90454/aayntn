<script setup lang="ts">
import { ref } from "vue";
import CommandPalette from "./CommandPalette.vue";

/**
 * The search control in the header.
 *
 * The header knows only this component. The trigger owns the button so that
 * focus can return to it when the palette closes; the dialog and its state
 * live in the palette.
 */

const trigger = ref<HTMLButtonElement | null>(null);
const palette = ref<InstanceType<typeof CommandPalette> | null>(null);

function openSearch(): void {
    void palette.value?.open();
}

function restoreFocus(): void {
    trigger.value?.focus();
}
</script>

<template>
    <div class="aayntn-search">
        <button
            ref="trigger"
            class="aayntn-search__button"
            type="button"
            aria-label="Search A.A.Y.N.T.N."
            aria-haspopup="dialog"
            @click="openSearch"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <circle
                    cx="7"
                    cy="7"
                    r="4.6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                />
                <path
                    d="M10.4 10.4L14 14"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="square"
                />
            </svg>
            <span class="aayntn-search__label">Search</span>
            <kbd class="aayntn-search__kbd">Ctrl K</kbd>
        </button>

        <CommandPalette ref="palette" @closed="restoreFocus" />
    </div>
</template>
