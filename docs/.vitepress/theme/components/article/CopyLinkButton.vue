<script setup lang="ts">
import { onUnmounted, ref } from "vue";

/**
 * Copy the address of the current page.
 *
 * The button never lies: the confirmation is announced only after the
 * clipboard has accepted the text, and a refusal says so.
 */
withDefaults(defineProps<{ label?: string }>(), { label: "Copy link" });

const message = ref("");
let timer: number | undefined;

async function copy() {
    const url = window.location.origin + window.location.pathname;
    try {
        await navigator.clipboard.writeText(url);
        message.value = "Link copied";
    } catch {
        message.value = "Copy failed";
    }
    window.clearTimeout(timer);
    timer = window.setTimeout(() => (message.value = ""), 2400);
}

onUnmounted(() => window.clearTimeout(timer));
</script>

<template>
    <span class="aayntn-copy">
        <button class="aayntn-copy__button" type="button" @click="copy">{{ label }}</button>
        <span class="aayntn-copy__status" role="status">{{ message }}</span>
    </span>
</template>
