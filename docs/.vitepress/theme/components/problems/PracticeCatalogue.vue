<script setup lang="ts">
import { computed, ref } from "vue";
import problems from "../../../data/generated/problems.json";
import type { ProblemEntry } from "../../../data/types";

/**
 * Practice catalogue.
 *
 * Problems are filtered by technique, division and difficulty, and each one
 * carries a progressive hint ladder that the reader opens deliberately. A
 * problem is never presented with its solution attached; the worked
 * discussion lives in the lesson, not here.
 */

const props = withDefaults(
    defineProps<{
        /** Filter by technique identifier. */
        technique?: string;
        /** Filter by division. */
        division?: string;
        /** Maximum number of problems to show. */
        limit?: number;
    }>(),
    { technique: undefined, division: undefined, limit: 50 },
);

const all = problems as ProblemEntry[];

const filtered = computed(() =>
    all
        .filter((problem) => !props.technique || problem.techniques.includes(props.technique))
        .filter((problem) => !props.division || problem.division === props.division)
        .slice(0, props.limit),
);

const openHints = ref<Record<string, number>>({});

function revealHint(id: string, index: number) {
    openHints.value = { ...openHints.value, [id]: index };
}

function hintCount(id: string) {
    return openHints.value[id] ?? 0;
}
</script>

<template>
    <div class="aayntn-practice">
        <div class="aayntn-practice__list">
            <article v-for="problem in filtered" :key="problem.id" class="aayntn-problem">
                <header class="aayntn-problem__head">
                    <h3 class="aayntn-problem__title">
                        <a
                            v-if="problem.url"
                            :href="problem.url"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {{ problem.title }}
                        </a>
                        <template v-else>{{ problem.title }}</template>
                    </h3>
                    <span
                        v-if="problem.division"
                        class="aayntn-chip"
                        :class="`aayntn-chip--${problem.division}`"
                    >
                        {{ problem.division }}
                    </span>
                    <span
                        class="aayntn-difficulty"
                        :aria-label="`Difficulty ${problem.difficulty} of 5`"
                    >
                        <span
                            v-for="pip in 5"
                            :key="pip"
                            class="aayntn-difficulty__pip"
                            :class="{ 'aayntn-difficulty__pip--on': pip <= problem.difficulty }"
                        />
                    </span>
                </header>

                <div class="aayntn-problem__meta">
                    <span>{{ problem.source }}</span>
                    <span v-if="problem.contest">{{ problem.contest }}</span>
                    <span v-if="problem.estimatedMinutes">
                        ≈ {{ problem.estimatedMinutes }} min
                    </span>
                </div>

                <div v-if="problem.techniques.length" class="aayntn-problem__techniques">
                    <span
                        v-for="technique in problem.techniques"
                        :key="technique"
                        class="aayntn-chip aayntn-chip--muted"
                    >
                        {{ technique }}
                    </span>
                </div>

                <ul
                    v-if="problem.specialConstraints.length"
                    class="aayntn-problem__techniques"
                    style="margin-top: 0.5rem"
                >
                    <li
                        v-for="constraint in problem.specialConstraints"
                        :key="constraint"
                        class="aayntn-problem__meta"
                        style="color: var(--color-vermilion)"
                    >
                        {{ constraint }}
                    </li>
                </ul>

                <div v-if="problem.hints.length" class="aayntn-hint">
                    <button
                        class="aayntn-hint__toggle"
                        type="button"
                        :aria-expanded="hintCount(problem.id) > 0"
                        @click="
                            revealHint(
                                problem.id,
                                Math.min(hintCount(problem.id) + 1, problem.hints.length),
                            )
                        "
                    >
                        {{
                            hintCount(problem.id) === 0
                                ? "Reveal a hint"
                                : `Hint ${hintCount(problem.id)} of ${problem.hints.length}`
                        }}
                    </button>
                    <p v-if="hintCount(problem.id) > 0" class="aayntn-hint__body">
                        {{ problem.hints[hintCount(problem.id) - 1] }}
                    </p>
                </div>
            </article>
        </div>

        <p v-if="filtered.length === 0" class="aayntn-progress__empty" style="padding: 1rem">
            No problems are registered for this filter yet.
        </p>
    </div>
</template>
