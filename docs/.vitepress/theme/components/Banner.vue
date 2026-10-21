<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import Ornament from "../components/Ornament.vue";

/**
 * The framed banner.
 *
 * A monumental section heading, wrapped in the architectural frame that gives
 * the encyclopedia its identity. The ornament is decoration only: it carries
 * no data and it is marked as hidden from assistive technology.
 */
const props = withDefaults(
    defineProps<{
        title: string;
        lede?: string;
        eyebrow?: string;
        motif?: "corner" | "double-rule" | "rosette" | "laurel" | "medallion" | "axis" | "insignia";
        level?: 2 | 3;
    }>(),
    { lede: "", eyebrow: "", motif: "corner", level: 2 },
);

const { frontmatter } = useData();

const divisions = computed(() => (frontmatter.value.division ?? []) as string[]);
</script>

<template>
    <header class="aayntn-banner" :class="`aayntn-banner--level-${props.level}`">
        <div class="aayntn-banner__ornament" aria-hidden="true">
            <Ornament motif="corner" />
            <Ornament motif="corner" class="aayntn-ornament--flip" />
        </div>

        <div class="aayntn-banner__body">
            <p v-if="eyebrow || divisions.length" class="aayntn-banner__eyebrow">
                <span v-if="eyebrow">{{ eyebrow }}</span>
                <span
                    v-for="division in divisions"
                    :key="division"
                    class="aayntn-chip"
                    :class="`aayntn-chip--${division}`"
                >
                    {{ division }}
                </span>
            </p>
            <component :is="`h${level}`" class="aayntn-banner__title">{{ title }}</component>
            <p v-if="lede" class="aayntn-banner__lede">{{ lede }}</p>
        </div>

        <div class="aayntn-banner__rule" aria-hidden="true">
            <Ornament motif="double-rule" />
        </div>
    </header>
</template>
