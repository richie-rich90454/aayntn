<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import {
    readAll,
    saveLessonProgress,
    lessonStatusView,
    type LessonStatusView,
} from "../../composables/useProgress";

/**
 * The lesson status.
 *
 * The record lives in IndexedDB, not in this component, so the control is
 * filled from the store on mount and after every route change. A failure to
 * write restores the previous state rather than showing a state the store
 * does not hold.
 */

const props = defineProps<{ lessonId: string }>();

const STATES: { value: LessonStatusView; label: string }[] = [
    { value: "not-started", label: "Not started" },
    { value: "in-progress", label: "In progress" },
    { value: "mastered", label: "Mastered" },
];

const status = ref<LessonStatusView>("not-started");
const message = ref("");
let saving = false;

async function load() {
    try {
        const { lessons } = await readAll();
        const record = lessons.find((row) => row.lessonId === props.lessonId);
        status.value = lessonStatusView(record?.status);
    } catch {
        status.value = "not-started";
    }
}

async function choose(next: LessonStatusView) {
    if (saving) return;
    saving = true;
    const previous = status.value;
    status.value = next;
    try {
        await saveLessonProgress(props.lessonId, next);
        message.value = `Marked as ${next.replace("-", " ")}`;
    } catch {
        status.value = previous;
        message.value = "Progress could not be saved";
    } finally {
        saving = false;
    }
}

onMounted(load);
watch(() => props.lessonId, load);
</script>

<template>
    <div class="aayntn-status" role="group" aria-label="Lesson status">
        <span class="aayntn-status__label">Your progress</span>
        <div class="aayntn-status__options">
            <button
                v-for="state in STATES"
                :key="state.value"
                class="aayntn-status__option"
                type="button"
                :aria-pressed="status === state.value"
                :data-state="state.value"
                @click="choose(state.value)"
            >
                {{ state.label }}
            </button>
        </div>
        <span class="aayntn-status__announcement" role="status">{{ message }}</span>
    </div>
</template>
