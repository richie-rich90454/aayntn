<script setup lang="ts">
/**
 * Mathematical callout.
 *
 * Definitions, lemmas, theorems, proofs, invariants, recurrences and
 * counterexamples each get a distinct, consistent treatment so that the
 * reader can tell at a glance what kind of mathematical object they are
 * looking at.
 */

withDefaults(
    defineProps<{
        type?:
            | "definition"
            | "lemma"
            | "theorem"
            | "proof"
            | "invariant"
            | "recurrence"
            | "counterexample"
            | "complexity";
        title?: string;
    }>(),
    { type: "definition", title: undefined },
);
</script>

<template>
    <aside class="aayntn-math" :class="`aayntn-math--${type}`">
        <span class="aayntn-math__label">{{ title ?? type }}</span>
        <div class="aayntn-math__body">
            <slot />
        </div>
    </aside>
</template>
