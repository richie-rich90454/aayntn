<script setup lang="ts">
import { computed } from "vue";
import algorithms from "../../../data/generated/algorithms.json";
import type { AlgorithmEntry } from "../../../data/types";

/**
 * The above-the-fold algorithm summary.
 *
 * Complexity, prerequisites, constraints, applicability, and — just as
 * important — the situations in which the algorithm is the wrong choice.
 */

const props = defineProps<{
    algorithm: string;
}>();

const entry = computed<AlgorithmEntry | undefined>(() =>
    (algorithms as AlgorithmEntry[]).find((item) => item.id === props.algorithm),
);
</script>

<template>
    <section v-if="entry" class="aayntn-summary">
        <header class="aayntn-summary__head">
            <span class="aayntn-summary__title">Summary</span>
            <span
                v-for="division in entry.divisions"
                :key="division"
                class="aayntn-chip"
                :class="`aayntn-chip--${division}`"
            >
                {{ division }}
            </span>
            <span class="aayntn-chip aayntn-chip--muted">
                {{ entry.importance.replace(/-/g, " ") }}
            </span>
        </header>

        <div class="aayntn-summary__grid">
            <div class="aayntn-summary__cell">
                <div class="aayntn-summary__label">Time</div>
                <div class="aayntn-summary__value">{{ entry.complexity.time }}</div>
            </div>
            <div class="aayntn-summary__cell">
                <div class="aayntn-summary__label">Space</div>
                <div class="aayntn-summary__value">{{ entry.complexity.space }}</div>
            </div>
            <div class="aayntn-summary__cell">
                <div class="aayntn-summary__label">Implementations</div>
                <div class="aayntn-summary__value">{{ entry.variants.length }}</div>
            </div>
            <div class="aayntn-summary__cell">
                <div class="aayntn-summary__label">Subject</div>
                <div class="aayntn-summary__value">{{ entry.subject }}</div>
            </div>
        </div>

        <dl class="aayntn-summary__rows">
            <div v-if="entry.assumptions.length" class="aayntn-summary__row">
                <dt>Assumptions</dt>
                <dd>
                    <ul>
                        <li v-for="assumption in entry.assumptions" :key="assumption">
                            {{ assumption }}
                        </li>
                    </ul>
                </dd>
            </div>
            <div v-if="entry.prerequisites.required.length" class="aayntn-summary__row">
                <dt>Required background</dt>
                <dd>{{ entry.prerequisites.required.join(", ") }}</dd>
            </div>
            <div v-if="entry.prerequisites.recommended.length" class="aayntn-summary__row">
                <dt>Recommended background</dt>
                <dd>{{ entry.prerequisites.recommended.join(", ") }}</dd>
            </div>
        </dl>
    </section>
</template>
