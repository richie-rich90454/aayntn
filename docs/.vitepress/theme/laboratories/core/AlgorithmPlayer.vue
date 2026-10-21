<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { sceneFor } from "./registry";
import { definitionFor } from "../algorithms";
import type { LabDefinition, LabEvent, LabPreset, LabState } from "./types";

/**
 * The algorithm player.
 *
 * Controls: play, pause, step forward and backward, jump to the ends, scrub,
 * speed, presets, custom input, reset, annotation toggle, fullscreen, and
 * keyboard control. Backward navigation is exact because every event carries
 * the state that results from applying it.
 */

const props = withDefaults(
    defineProps<{
        /** Laboratory identifier, matching a registered algorithm. */
        algorithm: string;
        /** Hide the implementation panel. */
        hideImplementation?: boolean;
    }>(),
    { hideImplementation: false },
);

const definition = computed<LabDefinition | undefined>(() => definitionFor(props.algorithm));

/* ------------------------------------------------------------------ */
/* Trace construction                                                  */
/* ------------------------------------------------------------------ */

const events = ref<LabEvent[]>([]);
const current = ref(0);
const playing = ref(false);
const speed = ref(1);
const showAnnotations = ref(true);
const fullscreen = ref(false);
const presetId = ref("");
const customInput = ref("");
const error = ref("");

let timer: number | undefined;

function rebuild(input: string) {
    error.value = "";
    try {
        events.value = definition.value?.build(input) ?? [];
    } catch (err) {
        events.value = [];
        error.value = (err as Error).message;
    }
    current.value = 0;
    playing.value = false;
}

const presets = computed(() => definition.value?.presets ?? []);
const activePreset = computed(
    () => presets.value.find((preset) => preset.id === presetId.value) ?? presets.value[0],
);

watch(
    definition,
    (value) => {
        if (!value) return;
        presetId.value = value.presets[0]?.id ?? "";
        customInput.value = value.presets[0]?.input ?? "";
        rebuild(value.presets[0]!.input);
    },
    { immediate: true },
);

const state = computed<LabState | undefined>(() => events.value[current.value]?.state);

const scene = computed(() => sceneFor(definition.value?.scene ?? "graph"));

const svgMarkup = computed(() => {
    if (!state.value) return "";
    return scene.value.render(state.value, {
        width: 720,
        height: 460,
        showAnnotations: showAnnotations.value,
        showImplementation: !props.hideImplementation,
    });
});

const narration = computed(() => events.value[current.value]?.narration ?? "");

const operation = computed(() => events.value[current.value]?.operation);

const formula = computed(() => state.value?.formula);

/* ------------------------------------------------------------------ */
/* Playback                                                            */
/* ------------------------------------------------------------------ */

function stop() {
    playing.value = false;
    if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
    }
}

function play() {
    if (!events.value.length) return;
    if (current.value >= events.value.length - 1) current.value = 0;
    playing.value = true;
    const interval = Math.max(40, 700 / speed.value);
    timer = window.setInterval(() => {
        if (current.value >= events.value.length - 1) {
            stop();
            return;
        }
        current.value += 1;
    }, interval);
}

function togglePlay() {
    if (playing.value) stop();
    else play();
}

function stepForward() {
    stop();
    current.value = Math.min(current.value + 1, events.value.length - 1);
}

function stepBack() {
    stop();
    current.value = Math.max(current.value - 1, 0);
}

function jumpToStart() {
    stop();
    current.value = 0;
}

function jumpToEnd() {
    stop();
    current.value = Math.max(0, events.value.length - 1);
}

function scrub(value: number) {
    stop();
    current.value = value;
}

watch(speed, () => {
    if (playing.value) {
        stop();
        play();
    }
});

function applyPreset(preset: LabPreset) {
    presetId.value = preset.id;
    customInput.value = preset.input;
    rebuild(preset.input);
}

function applyCustomInput() {
    rebuild(customInput.value);
}

function reset() {
    const preset = activePreset.value;
    if (preset) rebuild(preset.input);
}

function onKeydown(event: KeyboardEvent) {
    if (!events.value.length) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
        return;

    switch (event.key) {
        case "ArrowRight":
            event.preventDefault();
            stepForward();
            break;
        case "ArrowLeft":
            event.preventDefault();
            stepBack();
            break;
        case " ":
            event.preventDefault();
            togglePlay();
            break;
        case "Home":
            event.preventDefault();
            jumpToStart();
            break;
        case "End":
            event.preventDefault();
            jumpToEnd();
            break;
        case "Escape":
            if (fullscreen.value) fullscreen.value = false;
            break;
    }
}

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => {
    stop();
    window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
    <section v-if="definition" class="aayntn-lab" :class="{ 'aayntn-lab--fullscreen': fullscreen }">
        <header class="aayntn-lab__head">
            <span class="aayntn-lab__title">{{ definition.title }}</span>
            <span class="aayntn-chip aayntn-chip--muted">{{ definition.scene }}</span>
            <div class="aayntn-code__actions">
                <button
                    class="aayntn-code__action"
                    type="button"
                    @click="showAnnotations = !showAnnotations"
                >
                    {{ showAnnotations ? "Hide annotations" : "Show annotations" }}
                </button>
                <button class="aayntn-code__action" type="button" @click="fullscreen = !fullscreen">
                    {{ fullscreen ? "Exit fullscreen" : "Fullscreen" }}
                </button>
            </div>
        </header>

        <div class="aayntn-lab__stage">
            <div class="aayntn-lab__canvas">
                <svg
                    :viewBox="
                        scene.viewBox({
                            width: 720,
                            height: 460,
                            showAnnotations,
                            showImplementation: true,
                        })
                    "
                    role="img"
                    :aria-label="`${definition.title}: ${narration}`"
                    v-html="svgMarkup"
                />
                <p v-if="error" class="aayntn-hint__body" role="alert">{{ error }}</p>
            </div>

            <aside class="aayntn-lab__sidebar">
                <div class="aayntn-lab__section">
                    <div class="aayntn-lab__section-title">Input</div>
                    <textarea
                        v-model="customInput"
                        class="aayntn-lab__input"
                        rows="4"
                        spellcheck="false"
                        aria-label="Custom algorithm input"
                        :maxlength="definition.maxInputLength ?? 400"
                    />
                    <div class="aayntn-lab__preset">
                        <button class="aayntn-filter" type="button" @click="applyCustomInput">
                            Run input
                        </button>
                        <button class="aayntn-filter" type="button" @click="reset">Reset</button>
                    </div>
                    <div class="aayntn-lab__preset">
                        <button
                            v-for="preset in presets"
                            :key="preset.id"
                            class="aayntn-filter"
                            type="button"
                            :aria-pressed="preset.id === presetId"
                            @click="applyPreset(preset)"
                        >
                            {{ preset.label }}
                        </button>
                    </div>
                </div>

                <div v-if="definition.notes?.length" class="aayntn-lab__section">
                    <div class="aayntn-lab__section-title">Reading the picture</div>
                    <ul class="aayntn-legend">
                        <li v-for="note in definition.notes" :key="note" class="aayntn-legend__row">
                            {{ note }}
                        </li>
                    </ul>
                </div>

                <div class="aayntn-lab__section">
                    <div class="aayntn-lab__section-title">State</div>
                    <p
                        v-if="formula"
                        class="aayntn-lab__narration"
                        style="padding: 0; min-height: 0"
                    >
                        <code>{{ formula }}</code>
                    </p>
                    <p class="aayntn-lab__narration" style="padding: 0; min-height: 0">
                        <span v-if="operation" class="aayntn-chip aayntn-chip--muted">
                            {{ operation }}
                        </span>
                    </p>
                </div>
            </aside>
        </div>

        <p class="aayntn-lab__narration">
            <strong>Step {{ current + 1 }} of {{ events.length }}.</strong>
            {{ narration }}
        </p>

        <div class="aayntn-transport">
            <button
                class="aayntn-transport__button"
                type="button"
                aria-label="Jump to start"
                @click="jumpToStart"
            >
                ⏮
            </button>
            <button
                class="aayntn-transport__button"
                type="button"
                aria-label="Step backward"
                :disabled="current === 0"
                @click="stepBack"
            >
                ◀
            </button>
            <button
                class="aayntn-transport__button aayntn-transport__button--primary"
                type="button"
                :aria-label="playing ? 'Pause' : 'Play'"
                @click="togglePlay"
            >
                {{ playing ? "❚❚" : "▶" }}
            </button>
            <button
                class="aayntn-transport__button"
                type="button"
                aria-label="Step forward"
                :disabled="current >= events.length - 1"
                @click="stepForward"
            >
                ▶
            </button>
            <button
                class="aayntn-transport__button"
                type="button"
                aria-label="Jump to end"
                @click="jumpToEnd"
            >
                ⏭
            </button>

            <input
                class="aayntn-transport__scrub"
                type="range"
                min="0"
                :max="Math.max(0, events.length - 1)"
                :value="current"
                aria-label="Scrub the timeline"
                @input="scrub(Number(($event.target as HTMLInputElement).value))"
            />
            <span class="aayntn-transport__counter">{{ current + 1 }} / {{ events.length }}</span>

            <label class="aayntn-transport__speed">
                Speed
                <select v-model.number="speed" class="aayntn-filter">
                    <option :value="0.5">0.5×</option>
                    <option :value="1">1×</option>
                    <option :value="2">2×</option>
                    <option :value="4">4×</option>
                </select>
            </label>
        </div>
    </section>

    <p v-else class="aayntn-progress__empty">
        No laboratory is registered for
        <code>{{ algorithm }}</code>
        .
    </p>
</template>
