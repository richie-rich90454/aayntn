<script setup lang="ts">
/**
 * Search synonyms.
 *
 * Authors declare the alternative names a reader might use. The list is
 * rendered visually hidden so that it is available to screen readers and to
 * the local search index, without cluttering the page.
 */
withDefaults(defineProps<{ terms?: string }>(), { terms: "" });
</script>

<template>
    <span class="sr-only">Also known as: {{ terms }}</span>
</template>
