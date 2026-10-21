<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import graph from "../../../data/generated/prerequisites.json";
import lessons from "../../../data/generated/lessons.json";
import curriculum from "../../../data/generated/curriculum.json";
import { readAll, type LessonProgress } from "../../composables/useProgress";
import type { CurriculumTrack, LessonEntry, PrerequisiteGraph } from "../../../data/types";

/**
 * What should I learn next?
 *
 * The recommendation comes from the prerequisite graph and the reader's own
 * history, not from a fixed list. A lesson is suggested when every lesson it
 * requires has already been marked as read, and the track the reader chose
 * decides the order among the candidates.
 *
 * The advice is never more specific than the reader's own record: a lesson
 * that has been opened but not recorded is not treated as learned, because
 * reading a page is not the same as understanding it.
 */
const prereq = graph as PrerequisiteGraph;
const lessonList = lessons as LessonEntry[];
const tracks = curriculum as CurriculumTrack[];

const byId = computed(() => new Map(lessonList.map((lesson) => [lesson.id, lesson])));

const progress = ref<Record<string, LessonProgress["status"]>>({});
const trackId = ref<string>("");

onMounted(async () => {
    const { lessons: rows } = await readAll();
    progress.value = Object.fromEntries(rows.map((row) => [row.lessonId, row.status]));
    const saved = localStorage.getItem("aayntn:track");
    if (saved) trackId.value = saved;
});

function chooseTrack(id: string) {
    trackId.value = id;
    if (id) localStorage.setItem("aayntn:track", id);
    else localStorage.removeItem("aayntn:track");
}

const learned = computed(() => new Set(Object.keys(progress.value)));

/** The lessons a lesson requires, taken from the required edges. */
function requirementsOf(lessonId: string): string[] {
    return prereq.edges
        .filter((edge) => edge.to === lessonId && edge.kind === "required")
        .map((edge) => edge.from);
}

const candidates = computed(() => {
    const order = trackId.value
        ? (tracks.find((track) => track.id === trackId.value)?.lessons ?? [])
        : prereq.order;

    const position = new Map(order.map((id, index) => [id, index]));

    return lessonList
        .filter((lesson) => !learned.value.has(lesson.id))
        .filter((lesson) => requirementsOf(lesson.id).every((id) => learned.value.has(id)))
        .map((lesson) => ({
            lesson,
            order: position.get(lesson.id) ?? Number.MAX_SAFE_INTEGER,
        }))
        .sort((a, b) => a.order - b.order || a.lesson.title.localeCompare(b.lesson.title))
        .slice(0, 8)
        .map((entry) => entry.lesson);
});

const blocked = computed(() => {
    const unmet = new Map<string, string[]>();
    for (const lesson of lessonList) {
        const missing = requirementsOf(lesson.id).filter((id) => !learned.value.has(id));
        if (missing.length > 0) unmet.set(lesson.id, missing);
    }
    return unmet;
});
</script>

<template>
    <div class="aayntn-learn-next">
        <div class="aayntn-learn-next__controls">
            <label class="aayntn-learn-next__label" for="aayntn-track">Learning track</label>
            <select
                id="aayntn-track"
                class="aayntn-filter"
                :value="trackId"
                @change="chooseTrack(($event.target as HTMLSelectElement).value)"
            >
                <option value="">No track, the graph order</option>
                <option v-for="track in tracks" :key="track.id" :value="track.id">
                    {{ track.title }}
                </option>
            </select>
        </div>

        <p v-if="candidates.length === 0" class="aayntn-progress__empty">
            Nothing is waiting for you. Either you have recorded every lesson whose prerequisites
            you have met, or you have not recorded the lessons that unlock the rest. Mark a lesson
            as read to open the next one.
        </p>

        <ul v-else class="aayntn-learn-next__list">
            <li v-for="lesson in candidates" :key="lesson.id" class="aayntn-learn-next__item">
                <a class="aayntn-learn-next__title" :href="lesson.href">{{ lesson.title }}</a>
                <span class="aayntn-learn-next__summary">{{ lesson.summary }}</span>
                <span class="aayntn-learn-next__meta">
                    <span
                        v-for="division in lesson.divisions"
                        :key="division"
                        class="aayntn-chip"
                        :class="`aayntn-chip--${division}`"
                    >
                        {{ division }}
                    </span>
                    <span class="aayntn-chip aayntn-chip--muted">
                        {{ lesson.importance.replace(/-/g, " ") }}
                    </span>
                </span>
            </li>
        </ul>

        <p v-if="blocked.size > 0" class="aayntn-progress__empty">
            {{ blocked.size }} further lesson(s) are waiting on a prerequisite that you have not
            recorded yet. The map on the curriculum page shows which one.
        </p>
    </div>
</template>
