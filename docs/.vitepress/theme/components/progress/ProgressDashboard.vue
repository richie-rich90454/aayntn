<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { withBase } from "vitepress";
import lessons from "../../../data/generated/lessons.json";
import problems from "../../../data/generated/problems.json";
import {
    clearProgress,
    exportSnapshot,
    importSnapshot,
    readAll,
    saveLessonProgress,
    saveProblemProgress,
    type LessonProgress,
    type ProblemProgress,
    type ProgressSnapshot,
} from "../../composables/useProgress";
import type { LessonEntry, ProblemEntry } from "../../../data/types";

/**
 * Local progress dashboard.
 *
 * Everything shown here lives in this browser only. There is no account and
 * no server, so the export/import pair is the only way to move history
 * between devices — the interface says so rather than implying a cloud sync.
 */

const lessonList = lessons as LessonEntry[];
const problemList = problems as ProblemEntry[];

const lessonStatus = ref<Record<string, LessonProgress["status"]>>({});
const problemStatus = ref<Record<string, ProblemProgress["status"]>>({});
const ready = ref(false);
const message = ref("");

async function refresh() {
    const { lessons: lessonRows, problems: problemRows } = await readAll();
    lessonStatus.value = Object.fromEntries(lessonRows.map((row) => [row.lessonId, row.status]));
    problemStatus.value = Object.fromEntries(problemRows.map((row) => [row.problemId, row.status]));
    ready.value = true;
}

onMounted(() => {
    void refresh();
});

const lessonStats = computed(() => {
    const total = lessonList.length;
    const read = lessonList.filter(
        (lesson) =>
            lessonStatus.value[lesson.id] && lessonStatus.value[lesson.id] !== "not-started",
    ).length;
    const mastered = lessonList.filter(
        (lesson) => lessonStatus.value[lesson.id] === "mastered",
    ).length;
    return { total, read, mastered };
});

const problemStats = computed(() => {
    const total = problemList.length;
    const solved = problemList.filter(
        (problem) => problemStatus.value[problem.id] === "solved",
    ).length;
    const attempted = problemList.filter(
        (problem) =>
            problemStatus.value[problem.id] === "solved" ||
            problemStatus.value[problem.id] === "attempted",
    ).length;
    return { total, attempted, solved };
});

const trackedLessons = computed(() =>
    lessonList
        .filter((lesson) => lessonStatus.value[lesson.id])
        .sort((a, b) =>
            (lessonStatus.value[b.id] ?? "").localeCompare(lessonStatus.value[a.id] ?? ""),
        ),
);

const STATUS_OPTIONS: LessonProgress["status"][] = [
    "not-started",
    "in-progress",
    "review",
    "mastered",
];

async function setLessonStatus(lessonId: string, status: LessonProgress["status"]) {
    await saveLessonProgress(lessonId, status);
    await refresh();
}

async function setProblemStatus(problemId: string, status: ProblemProgress["status"]) {
    await saveProblemProgress(problemId, status);
    await refresh();
}

async function exportProgress() {
    const snapshot = await exportSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aayntn-progress-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    message.value = "Progress exported as a portable JSON file.";
}

async function importProgress(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
        const snapshot = JSON.parse(await file.text()) as ProgressSnapshot;
        if (snapshot.version !== 1) throw new Error("Unsupported export version");
        await importSnapshot(snapshot);
        await refresh();
        message.value = "Progress imported.";
    } catch (error) {
        message.value = `Import failed: ${(error as Error).message}`;
    }
    input.value = "";
}

async function resetProgress() {
    await clearProgress();
    await refresh();
    message.value = "Local progress cleared.";
}
</script>

<template>
    <div class="aayntn-progress">
        <div class="aayntn-progress__card">
            <h2>What is stored, and where</h2>
            <p>
                Your reading history, practice results and bookmarks are kept in this browser's
                IndexedDB database. Nothing is uploaded, no account exists, and no analytics script
                observes what you read. Because of that, the only way to move your history to
                another device is the export and import buttons below.
            </p>
        </div>

        <div class="aayntn-progress__card">
            <h2>Lessons</h2>
            <div class="aayntn-progress__row">
                <span class="aayntn-progress__title">Read</span>
                <div
                    class="aayntn-progress__bar"
                    role="img"
                    :aria-label="`${lessonStats.read} of ${lessonStats.total} lessons read`"
                >
                    <div
                        class="aayntn-progress__bar-fill"
                        :style="{
                            width: `${lessonStats.total ? (lessonStats.read / lessonStats.total) * 100 : 0}%`,
                        }"
                    />
                </div>
                <span class="aayntn-chip aayntn-chip--muted">
                    {{ lessonStats.read }} / {{ lessonStats.total }}
                </span>
            </div>
            <div class="aayntn-progress__row">
                <span class="aayntn-progress__title">Mastered</span>
                <div
                    class="aayntn-progress__bar"
                    role="img"
                    :aria-label="`${lessonStats.mastered} of ${lessonStats.total} lessons mastered`"
                >
                    <div
                        class="aayntn-progress__bar-fill"
                        :style="{
                            width: `${lessonStats.total ? (lessonStats.mastered / lessonStats.total) * 100 : 0}%`,
                        }"
                    />
                </div>
                <span class="aayntn-chip aayntn-chip--muted">
                    {{ lessonStats.mastered }} / {{ lessonStats.total }}
                </span>
            </div>
            <p class="aayntn-progress__empty">
                “Mastered” is a claim you make yourself after satisfying the review checklist on the
                lesson. Merely reaching the bottom of a page never marks it.
            </p>
        </div>

        <div class="aayntn-progress__card">
            <h2>Practice</h2>
            <div class="aayntn-progress__row">
                <span class="aayntn-progress__title">Attempted</span>
                <span class="aayntn-chip aayntn-chip--muted">
                    {{ problemStats.attempted }} / {{ problemStats.total }}
                </span>
            </div>
            <div class="aayntn-progress__row">
                <span class="aayntn-progress__title">Solved</span>
                <span class="aayntn-chip aayntn-chip--emerald">
                    {{ problemStats.solved }} / {{ problemStats.total }}
                </span>
            </div>
        </div>

        <div class="aayntn-progress__card">
            <h2>Recently touched lessons</h2>
            <p v-if="trackedLessons.length === 0" class="aayntn-progress__empty">
                No lessons have been marked yet. Open a lesson and use the control at the end of the
                page to record what you did.
            </p>
            <div
                v-for="lesson in trackedLessons.slice(0, 12)"
                :key="lesson.id"
                class="aayntn-progress__row"
            >
                <a class="aayntn-progress__title" :href="withBase(lesson.href)">
                    {{ lesson.title }}
                </a>
                <select
                    class="aayntn-filter"
                    :value="lessonStatus[lesson.id]"
                    :aria-label="`Status for ${lesson.title}`"
                    @change="
                        setLessonStatus(
                            lesson.id,
                            ($event.target as HTMLSelectElement).value as LessonProgress['status'],
                        )
                    "
                >
                    <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">
                        {{ status }}
                    </option>
                </select>
            </div>
        </div>

        <div class="aayntn-progress__card">
            <h2>Export and import</h2>
            <div class="aayntn-progress__actions">
                <button class="aayntn-button" type="button" @click="exportProgress">
                    Export all progress
                </button>
                <label class="aayntn-button aayntn-button--ghost">
                    Import progress
                    <input
                        type="file"
                        accept="application/json"
                        class="sr-only"
                        @change="importProgress"
                    />
                </label>
                <button
                    class="aayntn-button aayntn-button--ghost"
                    type="button"
                    @click="resetProgress"
                >
                    Clear local data
                </button>
            </div>
            <p v-if="message" class="aayntn-progress__empty" role="status">{{ message }}</p>
            <p class="aayntn-progress__empty">
                Practice results are recorded by hand. aayntn is a static site: it cannot run a
                hidden judge against code you paste into it, and it does not pretend to. Submit to
                the official judge, then record the outcome here.
            </p>
        </div>
    </div>
</template>
