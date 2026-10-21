<script setup lang="ts">
/**
 * A captioned figure.
 *
 * Instructional diagrams must be distinguishable from ornament, so every
 * diagram carries a visible frame, a caption, and — when the meaning of the
 * picture is not obvious — a text alternative.
 */
withDefaults(
    defineProps<{
        src?: string;
        alt?: string;
        caption?: string;
        bare?: boolean;
    }>(),
    { src: undefined, alt: "", caption: "", bare: false },
);
</script>

<template>
    <figure class="aayntn-figure" :class="{ 'aayntn-figure--bare': bare }">
        <div class="aayntn-figure__frame">
            <img v-if="src" :src="src" :alt="alt" loading="lazy" decoding="async" />
            <slot />
        </div>
        <figcaption v-if="caption" class="aayntn-figure__caption">
            <slot name="caption">{{ caption }}</slot>
        </figcaption>
    </figure>
</template>
