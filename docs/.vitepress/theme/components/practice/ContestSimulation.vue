<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import lessons from "../../../data/generated/lessons.json";
import problems from "../../../data/generated/problems.json";
import type { LessonEntry, ProblemEntry } from "../../../data/types";
import {
    clearContestSession,
    recordAttempt,
    saveContestSession,
    type AttemptRecord,
    type AttemptResult,
    type ContestSession,
} from "../../composables/useProgress";

/**
 * Contest simulation.
 *
 * A simulation is a rehearsal, not a judge. The clock runs in this browser,
 * the statements are read at their original source, the verdicts are written
 * down by the reader, and the solutions stay closed until the session ends.
 * Nothing is submitted anywhere, because the published contest rules forbid
 * automated submission.
 */

type Phase = "setup" | "running" | "finished";

const DIVISIONS = ["bronze", "silver", "gold", "platinum"] as const;

const DIVISION_LABELS: Record<string, string> = {
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",
    platinum: "Platinum",
};

/** USACO gives Bronze 75 minutes and every other division 120. */
const DIVISION_LIMITS: Record<string, number> = {
    bronze: 75,
    silver: 120,
    gold: 120,
    platinum: 120,
};

const LIMIT_CHOICES = [45, 60, 75, 90, 120, 150, 180];

const RESULT_LABELS: Record<AttemptResult, string> = {
    accepted: "Accepted",
    "wrong-answer": "Wrong answer",
    "time-limit": "Time limit exceeded",
    "runtime-error": "Runtime error",
    "not-attempted": "Not attempted",
};

const RESULT_ORDER: AttemptResult[] = [
    "accepted",
    "wrong-answer",
    "time-limit",
    "runtime-error",
    "not-attempted",
];

const all = problems as ProblemEntry[];
const byId = new Map(all.map((problem) => [problem.id, problem]));

const lessonHref = new Map<string, string>();
for (const lesson of lessons as LessonEntry[]) lessonHref.set(lesson.id, `/${lesson.href}`);

const phase = ref<Phase>("setup");
const division = ref<string>("bronze");
const limitMinutes = ref<number>(DIVISION_LIMITS["bronze"] ?? 75);
const selectedIds = ref<string[]>([]);

const sessionId = ref("");
const startedAtMs = ref(0);
const finishedAtMs = ref(0);
const finalElapsedMs = ref(0);
const clockNow = ref(0);
const problemStartedAtMs = ref(0);
const currentIndex = ref(0);
const verdicts = ref<Record<string, AttemptRecord>>({});
const status = ref("");

const divisionProblems = computed(() =>
    all.filter((problem) => problem.division === division.value),
);

const sessionProblems = computed(() =>
    selectedIds.value
        .map((id) => byId.get(id))
        .filter((problem): problem is ProblemEntry => problem !== undefined),
);

const currentProblem = computed(() => sessionProblems.value[currentIndex.value] ?? null);

const limitMs = computed(() => limitMinutes.value * 60_000);

const elapsedMs = computed(() => {
    if (phase.value === "setup") return 0;
    if (phase.value === "finished") return finalElapsedMs.value;
    return Math.max(0, clockNow.value - startedAtMs.value);
});

const remainingMs = computed(() => Math.max(0, limitMs.value - elapsedMs.value));

const report = computed(() => {
    const rows = sessionProblems.value.map((problem) => ({
        problem,
        attempt: verdicts.value[problem.id],
    }));
    const solved = rows.filter((row) => row.attempt?.result === "accepted").length;
    const attempted = rows.filter(
        (row) => row.attempt !== undefined && row.attempt.result !== "not-attempted",
    ).length;
    const skipped = rows.filter((row) => row.attempt?.result === "not-attempted").length;
    const review = rows.filter(
        (row) => row.attempt !== undefined && row.attempt.result !== "accepted",
    );
    const minutes = rows.reduce((total, row) => total + (row.attempt?.minutes ?? 0), 0);
    return { rows, solved, attempted, skipped, review, minutes };
});

function formatDuration(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (value: number) => String(value).padStart(2, "0");
    return hours > 0
        ? `${hours}:${pad(minutes)}:${pad(seconds)}`
        : `${pad(minutes)}:${pad(seconds)}`;
}

function selectDivision(value: string) {
    division.value = value;
    limitMinutes.value = DIVISION_LIMITS[value] ?? 120;
    const first = all.filter((problem) => problem.division === value).slice(0, 3);
    selectedIds.value = first.map((problem) => problem.id);
}

function toggleProblem(id: string) {
    selectedIds.value = selectedIds.value.includes(id)
        ? selectedIds.value.filter((candidate) => candidate !== id)
        : [...selectedIds.value, id];
}

function currentSession(): ContestSession {
    return {
        sessionId: sessionId.value,
        division: division.value,
        limitMinutes: limitMinutes.value,
        startedAt: new Date(startedAtMs.value).toISOString(),
        finishedAt:
            phase.value === "finished" ? new Date(finishedAtMs.value).toISOString() : undefined,
        attempts: Object.values(verdicts.value),
    };
}

async function persist() {
    await saveContestSession(currentSession());
}

function startSession() {
    if (selectedIds.value.length === 0) return;
    const now = Date.now();
    sessionId.value = `contest-${now.toString(36)}`;
    startedAtMs.value = now;
    clockNow.value = now;
    problemStartedAtMs.value = now;
    finishedAtMs.value = 0;
    finalElapsedMs.value = 0;
    currentIndex.value = 0;
    verdicts.value = {};
    phase.value = "running";
    status.value = `The clock is running. ${selectedIds.value.length} problems are in this session.`;
    void persist();
}

async function finishSession() {
    if (phase.value !== "running") return;
    const end = Date.now();
    finishedAtMs.value = end;
    finalElapsedMs.value = Math.max(0, end - startedAtMs.value);
    phase.value = "finished";
    status.value = `The clock stopped. ${report.value.solved} of ${report.value.attempted} attempted problems were solved. The solutions are open now.`;
    await persist();
}

async function recordVerdict(result: AttemptResult) {
    const problem = currentProblem.value;
    if (!problem || phase.value !== "running") return;
    const minutes = Math.max(1, Math.round((clockNow.value - problemStartedAtMs.value) / 60_000));
    const attempt: AttemptRecord = {
        problemId: problem.id,
        contest: problem.contest,
        division: problem.division,
        result,
        attemptedAt: new Date(clockNow.value).toISOString(),
        minutes,
        sessionId: sessionId.value,
    };
    verdicts.value = { ...verdicts.value, [problem.id]: attempt };
    await recordAttempt(attempt);
    await persist();
    status.value = `${problem.title}: ${RESULT_LABELS[result]}, ${minutes} minute${minutes === 1 ? "" : "s"}.`;
    const next = sessionProblems.value.findIndex(
        (candidate, index) =>
            index > currentIndex.value && verdicts.value[candidate.id] === undefined,
    );
    if (next >= 0) {
        currentIndex.value = next;
        problemStartedAtMs.value = clockNow.value;
    }
}

function goToProblem(index: number) {
    if (index < 0 || index >= sessionProblems.value.length) return;
    currentIndex.value = index;
    problemStartedAtMs.value = clockNow.value;
    status.value = "";
}

function verdictFor(problemId: string): string {
    const attempt = verdicts.value[problemId];
    return attempt ? RESULT_LABELS[attempt.result] : "No verdict yet";
}

function resetSession() {
    phase.value = "setup";
    sessionId.value = "";
    verdicts.value = {};
    status.value = "";
}

async function discardSession() {
    if (sessionId.value !== "") await clearContestSession(sessionId.value);
    resetSession();
    status.value = "The session was discarded. Nothing about it is kept.";
}

let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
    clockNow.value = Date.now();
    timer = setInterval(() => {
        clockNow.value = Date.now();
        if (phase.value === "running" && elapsedMs.value >= limitMs.value) {
            void finishSession();
        }
    }, 1000);
});

onBeforeUnmount(() => {
    if (timer !== null) clearInterval(timer);
});

selectDivision("bronze");
</script>

<template>
    <div class="aayntn-contest">
        <section class="aayntn-contest__notice">
            <h3>What this simulation is, and what it is not</h3>
            <p>
                This site is static. There is no server behind these pages, so the simulation cannot
                run a hidden judge against the code you write, and nothing here compiles anything or
                compares your output against a reference answer.
            </p>
            <p>
                Submission happens through the legitimate external judge. You write the solution,
                you submit it yourself through the interface the competition provides, and you read
                the verdict there.
            </p>
            <p>
                This site never submits anything on your behalf. The published contest rules require
                submission through the competition's own website and prohibit automating the
                submission process, so a site that submitted for you would be breaking those rules
                in your name. There is no such feature here, and there never will be one.
            </p>
            <p>
                The verdicts below are therefore your own record of what happened. They are stored
                in this browser only, and they are not a score that any competition recognizes.
            </p>
        </section>

        <section v-if="phase === 'setup'" class="aayntn-contest__panel">
            <h3>Set up the session</h3>
            <div class="aayntn-contest__controls">
                <label class="aayntn-contest__field">
                    <span class="aayntn-contest__label">Division</span>
                    <select
                        class="aayntn-filter"
                        :value="division"
                        @change="selectDivision(($event.target as HTMLSelectElement).value)"
                    >
                        <option v-for="name in DIVISIONS" :key="name" :value="name">
                            {{ DIVISION_LABELS[name] }}
                        </option>
                    </select>
                </label>
                <label class="aayntn-contest__field">
                    <span class="aayntn-contest__label">Time limit</span>
                    <select
                        class="aayntn-filter"
                        :value="limitMinutes"
                        @change="limitMinutes = Number(($event.target as HTMLSelectElement).value)"
                    >
                        <option v-for="choice in LIMIT_CHOICES" :key="choice" :value="choice">
                            {{ choice }} minutes
                        </option>
                    </select>
                </label>
            </div>
            <p class="aayntn-contest__hint">
                The limit is the one USACO gives: 75 minutes for Bronze, 120 for every other
                division. Choose a different one if you want a shorter rehearsal.
            </p>

            <fieldset class="aayntn-contest__fieldset">
                <legend class="aayntn-contest__label">Problems in this session</legend>
                <p class="aayntn-contest__hint">
                    Every problem the catalog holds for the chosen division is listed. Pick the ones
                    you want to attempt; a USACO contest has three.
                </p>
                <ul class="aayntn-contest__choices">
                    <li v-for="problem in divisionProblems" :key="problem.id">
                        <label class="aayntn-contest__choice">
                            <input
                                type="checkbox"
                                :value="problem.id"
                                :checked="selectedIds.includes(problem.id)"
                                @change="toggleProblem(problem.id)"
                            />
                            <span class="aayntn-contest__choice-title">{{ problem.title }}</span>
                        </label>
                        <span class="aayntn-chip aayntn-chip--muted">
                            {{ problem.contest ?? "Unfiled" }}
                        </span>
                    </li>
                </ul>
            </fieldset>

            <button
                class="aayntn-contest__button"
                type="button"
                :disabled="selectedIds.length === 0"
                @click="startSession"
            >
                Start the clock
            </button>
        </section>

        <section v-else class="aayntn-contest__panel">
            <div class="aayntn-contest__clock" role="timer" aria-label="Elapsed and remaining time">
                <div class="aayntn-contest__clock-cell">
                    <span class="aayntn-contest__label">Elapsed</span>
                    <span class="aayntn-contest__clock-value">{{ formatDuration(elapsedMs) }}</span>
                </div>
                <div class="aayntn-contest__clock-cell">
                    <span class="aayntn-contest__label">Remaining</span>
                    <span class="aayntn-contest__clock-value">
                        {{ formatDuration(remainingMs) }}
                    </span>
                </div>
                <div class="aayntn-contest__clock-cell">
                    <span class="aayntn-contest__label">Division</span>
                    <span class="aayntn-contest__clock-value">
                        {{ DIVISION_LABELS[division] ?? division }}
                    </span>
                </div>
            </div>

            <article v-if="currentProblem" class="aayntn-contest__current">
                <h3>{{ currentProblem.title }}</h3>
                <div class="aayntn-contest__meta">
                    <span class="aayntn-chip" :class="`aayntn-chip--${currentProblem.division}`">
                        {{ currentProblem.division }}
                    </span>
                    <span class="aayntn-chip aayntn-chip--muted">
                        {{ currentProblem.contest ?? "Unfiled" }}
                    </span>
                    <span class="aayntn-chip aayntn-chip--muted">
                        Difficulty {{ currentProblem.difficulty }} of 5
                    </span>
                </div>
                <p v-if="currentProblem.url" class="aayntn-contest__statement">
                    <a :href="currentProblem.url" target="_blank" rel="noopener noreferrer">
                        Read the statement at its original source
                    </a>
                </p>
                <p v-if="currentProblem.specialConstraints.length" class="aayntn-contest__warning">
                    {{ currentProblem.specialConstraints.join(" ") }}
                </p>

                <fieldset class="aayntn-contest__fieldset" :disabled="phase !== 'running'">
                    <legend class="aayntn-contest__label">Record the outcome</legend>
                    <div class="aayntn-contest__verdicts">
                        <button
                            v-for="result in RESULT_ORDER"
                            :key="result"
                            class="aayntn-contest__verdict"
                            :class="`aayntn-contest__verdict--${result}`"
                            type="button"
                            :disabled="phase !== 'running'"
                            @click="recordVerdict(result)"
                        >
                            {{ RESULT_LABELS[result] }}
                        </button>
                    </div>
                </fieldset>

                <div class="aayntn-contest__nav">
                    <button
                        class="aayntn-contest__button aayntn-contest__button--ghost"
                        type="button"
                        :disabled="currentIndex === 0"
                        @click="goToProblem(currentIndex - 1)"
                    >
                        Previous problem
                    </button>
                    <button
                        class="aayntn-contest__button aayntn-contest__button--ghost"
                        type="button"
                        :disabled="currentIndex >= sessionProblems.length - 1"
                        @click="goToProblem(currentIndex + 1)"
                    >
                        Next problem
                    </button>
                </div>
            </article>

            <ol class="aayntn-contest__list">
                <li v-for="(problem, index) in sessionProblems" :key="problem.id">
                    <button
                        class="aayntn-contest__list-item"
                        :class="{ 'aayntn-contest__list-item--current': index === currentIndex }"
                        type="button"
                        @click="goToProblem(index)"
                    >
                        <span class="aayntn-contest__list-title">{{ problem.title }}</span>
                        <span class="aayntn-contest__list-verdict">
                            {{ verdictFor(problem.id) }}
                        </span>
                    </button>
                </li>
            </ol>

            <div class="aayntn-contest__actions">
                <button
                    v-if="phase === 'running'"
                    class="aayntn-contest__button"
                    type="button"
                    @click="finishSession"
                >
                    End the session
                </button>
                <button
                    class="aayntn-contest__button aayntn-contest__button--ghost"
                    type="button"
                    @click="resetSession"
                >
                    Start a new session
                </button>
            </div>
            <p class="aayntn-contest__hint">
                The solutions stay closed until the session ends. That is the whole point of the
                rehearsal: a lookup table is not a contest.
            </p>
        </section>

        <section v-if="phase === 'finished'" class="aayntn-contest__report">
            <h3>The report</h3>
            <div class="aayntn-contest__stats">
                <div class="aayntn-contest__stat">
                    <span class="aayntn-contest__label">Attempted</span>
                    <span class="aayntn-contest__stat-value">{{ report.attempted }}</span>
                </div>
                <div class="aayntn-contest__stat">
                    <span class="aayntn-contest__label">Solved</span>
                    <span class="aayntn-contest__stat-value">{{ report.solved }}</span>
                </div>
                <div class="aayntn-contest__stat">
                    <span class="aayntn-contest__label">Not attempted</span>
                    <span class="aayntn-contest__stat-value">{{ report.skipped }}</span>
                </div>
                <div class="aayntn-contest__stat">
                    <span class="aayntn-contest__label">Time on task</span>
                    <span class="aayntn-contest__stat-value">{{ report.minutes }} min</span>
                </div>
            </div>

            <h4>Time per problem</h4>
            <table class="aayntn-contest__table">
                <thead>
                    <tr>
                        <th scope="col">Problem</th>
                        <th scope="col">Outcome</th>
                        <th scope="col">Minutes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in report.rows" :key="row.problem.id">
                        <th scope="row">{{ row.problem.title }}</th>
                        <td>
                            {{ row.attempt ? RESULT_LABELS[row.attempt.result] : "No verdict" }}
                        </td>
                        <td>{{ row.attempt?.minutes ?? 0 }}</td>
                    </tr>
                </tbody>
            </table>

            <h4>What to review next</h4>
            <p v-if="report.review.length === 0" class="aayntn-contest__hint">
                Every problem in the session was solved. Pick a harder set and run it again.
            </p>
            <ol v-else class="aayntn-contest__review">
                <li v-for="row in report.review" :key="row.problem.id">
                    <a
                        v-if="row.problem.url"
                        :href="row.problem.url"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {{ row.problem.title }}
                    </a>
                    <span v-else>{{ row.problem.title }}</span>
                    <span class="aayntn-contest__review-why">
                        {{ row.attempt ? RESULT_LABELS[row.attempt.result] : "No verdict" }}
                        after {{ row.attempt?.minutes ?? 0 }} minutes.
                    </span>
                    <span v-if="row.problem.techniques.length" class="aayntn-contest__review-why">
                        Read
                        <template
                            v-for="(technique, index) in row.problem.techniques"
                            :key="technique"
                        >
                            <a v-if="lessonHref.get(technique)" :href="lessonHref.get(technique)!">
                                {{ technique }}
                            </a>
                            <span v-else>{{ technique }}</span>
                            <span v-if="index < row.problem.techniques.length - 1">,</span>
                        </template>
                        before trying it again.
                    </span>
                </li>
            </ol>

            <h4>The solutions</h4>
            <p class="aayntn-contest__hint">
                The clock is stopped, so the discussion is open. Read it for the problems you
                failed, and read it for the ones you solved as well, because the discussion usually
                contains the derivation the contest did not ask you to write down.
            </p>
            <details
                v-for="row in report.rows"
                :key="row.problem.id"
                class="aayntn-contest__solution"
            >
                <summary>{{ row.problem.title }}</summary>
                <p v-if="row.problem.discussion">{{ row.problem.discussion }}</p>
                <p v-else class="aayntn-contest__hint">
                    The catalog holds no written discussion for this problem yet.
                </p>
                <p v-if="row.problem.editorialUrl">
                    <a :href="row.problem.editorialUrl" target="_blank" rel="noopener noreferrer">
                        The official editorial
                    </a>
                    belongs to the competition. It is linked here rather than reproduced.
                </p>
            </details>

            <div class="aayntn-contest__actions">
                <button
                    class="aayntn-contest__button aayntn-contest__button--ghost"
                    type="button"
                    @click="discardSession"
                >
                    Discard this session
                </button>
                <button class="aayntn-contest__button" type="button" @click="resetSession">
                    Keep it and start a new one
                </button>
            </div>
        </section>

        <p class="aayntn-contest__status" role="status">{{ status }}</p>
    </div>
</template>

<style scoped>
.aayntn-contest {
    display: grid;
    gap: var(--space-6);
    margin: var(--space-8) 0;
}

.aayntn-contest__notice,
.aayntn-contest__panel,
.aayntn-contest__report {
    padding: var(--space-6);
    border: 1px solid var(--border-ink);
    background: var(--surface-raised);
}

.aayntn-contest__notice {
    border-color: var(--color-oxblood);
}

.aayntn-contest__notice h3,
.aayntn-contest__panel h3,
.aayntn-contest__report h3 {
    margin: 0 0 var(--space-4);
    padding-bottom: var(--space-2);
    border-bottom: 2px solid var(--color-gold);
    font-size: 1.125rem;
}

.aayntn-contest__notice p,
.aayntn-contest__hint,
.aayntn-contest__status {
    margin: 0 0 var(--space-3);
    color: var(--text-secondary);
    font-size: var(--text-secondary-copy);
    line-height: 1.6;
}

.aayntn-contest__notice p:last-child,
.aayntn-contest__hint:last-child {
    margin-bottom: 0;
}

.aayntn-contest__controls {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
}

.aayntn-contest__field {
    display: grid;
    gap: var(--space-1);
}

.aayntn-contest__label {
    color: var(--text-muted);
    font-size: var(--text-meta);
    font-weight: 700;
    letter-spacing: 0.05em;
}

.aayntn-contest__fieldset {
    margin: var(--space-4) 0;
    padding: var(--space-4);
    border: 1px solid var(--border-subtle);
}

.aayntn-contest__fieldset legend {
    padding: 0 var(--space-2);
}

.aayntn-contest__choices {
    display: grid;
    gap: var(--space-2);
    margin: var(--space-3) 0 0;
    padding: 0;
    list-style: none;
}

.aayntn-contest__choices li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) 0;
    border-bottom: 1px solid var(--border-subtle);
}

.aayntn-contest__choice {
    display: flex;
    flex: 1 1 18rem;
    align-items: center;
    gap: var(--space-3);
    min-height: 44px;
    cursor: pointer;
}

.aayntn-contest__choice-title {
    font-size: var(--text-secondary-copy);
}

.aayntn-contest__button {
    padding: var(--space-3) var(--space-6);
    border: 2px solid var(--border-ink);
    background: var(--color-cobalt);
    color: var(--color-white);
    font-size: 0.9375rem;
    font-weight: 700;
    cursor: pointer;
}

.aayntn-contest__button:hover:not(:disabled) {
    background: var(--color-ultramarine);
    border-color: var(--color-ultramarine);
}

.aayntn-contest__button--ghost {
    background: transparent;
    color: var(--color-cobalt);
}

.aayntn-contest__button--ghost:hover:not(:disabled) {
    background: var(--surface-sunken);
    color: var(--color-ultramarine);
}

.aayntn-contest__button:disabled {
    border-color: var(--border-subtle);
    background: var(--surface-sunken);
    color: var(--text-muted);
    cursor: not-allowed;
}

.aayntn-contest__button:focus-visible,
.aayntn-contest__verdict:focus-visible,
.aayntn-contest__list-item:focus-visible,
.aayntn-contest__choice input:focus-visible,
.aayntn-contest select:focus-visible {
    outline: 3px solid var(--color-gold);
    outline-offset: 2px;
}

.aayntn-contest__clock {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 1px;
    margin-bottom: var(--space-6);
    background: var(--border-subtle);
    border: 1px solid var(--border-ink);
}

.aayntn-contest__clock-cell {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    background: var(--surface-raised);
}

.aayntn-contest__clock-value {
    font-family: var(--font-code);
    font-size: 1.375rem;
    font-weight: 700;
}

.aayntn-contest__current {
    padding: var(--space-4);
    border: 1px solid var(--border-subtle);
    background: var(--surface-sunken);
}

.aayntn-contest__current h3 {
    margin: 0 0 var(--space-3);
    font-size: 1.125rem;
}

.aayntn-contest__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
}

.aayntn-contest__statement {
    margin: 0 0 var(--space-3);
    font-size: var(--text-secondary-copy);
}

.aayntn-contest__warning {
    margin: 0 0 var(--space-3);
    color: var(--color-vermilion);
    font-size: var(--text-secondary-copy);
}

.aayntn-contest__verdicts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
}

.aayntn-contest__verdict {
    padding: var(--space-2) var(--space-4);
    min-height: 44px;
    border: 1px solid var(--border-ink);
    background: var(--surface-page);
    color: var(--text-primary);
    font-size: var(--text-secondary-copy);
    font-weight: 700;
    cursor: pointer;
}

.aayntn-contest__verdict:hover:not(:disabled) {
    background: var(--color-gold);
    border-color: var(--color-gold);
    color: var(--color-black);
}

.aayntn-contest__verdict--accepted {
    border-color: var(--color-emerald);
    color: var(--color-emerald);
}

.aayntn-contest__verdict--wrong-answer,
.aayntn-contest__verdict--time-limit {
    border-color: var(--color-vermilion);
    color: var(--color-vermilion);
}

.aayntn-contest__verdict:disabled {
    border-color: var(--border-subtle);
    color: var(--text-muted);
    cursor: not-allowed;
}

.aayntn-contest__nav,
.aayntn-contest__actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
    margin-top: var(--space-4);
}

.aayntn-contest__list {
    display: grid;
    gap: 1px;
    margin: var(--space-6) 0 0;
    padding: 0;
    list-style: none;
    background: var(--border-subtle);
    border: 1px solid var(--border-ink);
}

.aayntn-contest__list-item {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-3);
    width: 100%;
    min-height: 44px;
    padding: var(--space-3) var(--space-4);
    border: 0;
    background: var(--surface-raised);
    color: var(--text-primary);
    font-size: var(--text-secondary-copy);
    text-align: left;
    cursor: pointer;
}

.aayntn-contest__list-item--current {
    background: var(--surface-sunken);
    box-shadow: inset 0 0 0 1px var(--color-gold);
}

.aayntn-contest__list-title {
    flex: 1 1 12rem;
    font-weight: 700;
}

.aayntn-contest__list-verdict {
    color: var(--text-muted);
    font-size: var(--text-meta);
}

.aayntn-contest__stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 1px;
    margin-bottom: var(--space-6);
    background: var(--border-subtle);
    border: 1px solid var(--border-ink);
}

.aayntn-contest__stat {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    background: var(--surface-raised);
}

.aayntn-contest__stat-value {
    font-family: var(--font-code);
    font-size: 1.375rem;
    font-weight: 700;
}

.aayntn-contest__report h4 {
    margin: var(--space-6) 0 var(--space-3);
    font-size: 1rem;
}

.aayntn-contest__table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-secondary-copy);
}

.aayntn-contest__table th,
.aayntn-contest__table td {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--border-subtle);
    text-align: left;
}

.aayntn-contest__table thead th {
    background: var(--surface-sunken);
    font-size: var(--text-meta);
    letter-spacing: 0.05em;
}

.aayntn-contest__review {
    display: grid;
    gap: var(--space-3);
    margin: 0;
    padding-left: var(--space-6);
    font-size: var(--text-secondary-copy);
}

.aayntn-contest__review-why {
    display: block;
    color: var(--text-muted);
}

.aayntn-contest__solution {
    margin-top: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--border-subtle);
    background: var(--surface-sunken);
}

.aayntn-contest__solution summary {
    font-weight: 700;
    cursor: pointer;
}

.aayntn-contest__solution p {
    margin: var(--space-3) 0 0;
    font-size: var(--text-secondary-copy);
    line-height: 1.6;
}

.aayntn-contest__status {
    margin: 0;
    min-height: 1.6em;
    color: var(--text-muted);
}

@media (max-width: 640px) {
    .aayntn-contest__notice,
    .aayntn-contest__panel,
    .aayntn-contest__report {
        padding: var(--space-4);
    }

    .aayntn-contest__button {
        flex: 1 1 100%;
        justify-content: center;
    }

    .aayntn-contest__verdict {
        flex: 1 1 100%;
    }
}
</style>
