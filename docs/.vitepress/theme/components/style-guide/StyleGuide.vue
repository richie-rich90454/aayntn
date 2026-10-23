<script setup lang="ts">
import RadiusControl from "./RadiusControl.vue";
import StyleGuideStates from "./StyleGuideStates.vue";
import { withBase } from "vitepress";

interface TypeRow {
    name: string;
    token: string;
    sample: string;
    mono?: boolean;
}

interface FieldRow {
    token: string;
    light: string;
    dark: string;
    lightInk: string;
    darkInk: string;
    inkName: string;
    role: string;
}

interface InkRow {
    role: string;
    token: string;
    light: string;
    dark: string;
}

const TYPE_SCALE: TypeRow[] = [
    { name: "Display", token: "--text-display", sample: "A.A.Y.N.T.N." },
    { name: "Chapter", token: "--text-chapter", sample: "Divide and conquer" },
    { name: "Article", token: "--text-article", sample: "Dijkstra's shortest path" },
    { name: "Section", token: "--text-section", sample: "The invariant" },
    { name: "Subsection", token: "--text-subsection", sample: "Exchange argument" },
    {
        name: "Body",
        token: "--text-body",
        sample: "The proof proceeds by induction on the length of the path.",
    },
    {
        name: "Secondary copy",
        token: "--text-secondary-copy",
        sample: "Every problem is a lesson in disguise.",
    },
    {
        name: "Code",
        token: "--text-code",
        sample: "std::lower_bound(first, last, key)",
        mono: true,
    },
    { name: "Meta", token: "--text-meta", sample: "18 lessons, 4 hours, no account" },
];

const FIELDS: FieldRow[] = [
    {
        token: "--color-cobalt",
        light: "#2847b8",
        dark: "#4a6ac9",
        lightInk: "#ffffff",
        darkInk: "#ffffff",
        inkName: "white",
        role: "Primary field, links",
    },
    {
        token: "--color-ultramarine",
        light: "#203c91",
        dark: "#3a58a8",
        lightInk: "#ffffff",
        darkInk: "#ffffff",
        inkName: "white",
        role: "Primary action hover",
    },
    {
        token: "--color-vermilion",
        light: "#c63d32",
        dark: "#e07a70",
        lightInk: "#ffffff",
        darkInk: "#161616",
        inkName: "white, then black",
        role: "Error field",
    },
    {
        token: "--color-oxblood",
        light: "#7b274b",
        dark: "#c98bab",
        lightInk: "#ffffff",
        darkInk: "#161616",
        inkName: "white, then black",
        role: "Rigor",
    },
    {
        token: "--color-emerald",
        light: "#225b45",
        dark: "#25543f",
        lightInk: "#ffffff",
        darkInk: "#ffffff",
        inkName: "white",
        role: "Success field",
    },
    {
        token: "--color-violet",
        light: "#593399",
        dark: "#5b3aa0",
        lightInk: "#ffffff",
        darkInk: "#ffffff",
        inkName: "white",
        role: "Selected state",
    },
    {
        token: "--color-gold",
        light: "#e8b84a",
        dark: "#e8bd63",
        lightInk: "#161616",
        darkInk: "#161616",
        inkName: "black",
        role: "Accent field",
    },
    {
        token: "--color-parchment",
        light: "#f4e5ce",
        dark: "#2a2419",
        lightInk: "#161616",
        darkInk: "#b5bdcb",
        inkName: "black, then secondary",
        role: "Note field",
    },
    {
        token: "--color-code",
        light: "#f5f7fc",
        dark: "#0f1319",
        lightInk: "#161616",
        darkInk: "#eef1f6",
        inkName: "primary ink",
        role: "Code canvas",
    },
    {
        token: "--color-highlight",
        light: "#fff0bd",
        dark: "#3d3115",
        lightInk: "#161616",
        darkInk: "#eef1f6",
        inkName: "primary ink",
        role: "Highlighted row",
    },
    {
        token: "--color-invalid-soft",
        light: "#fce1e0",
        dark: "#3d1a19",
        lightInk: "#161616",
        darkInk: "#eef1f6",
        inkName: "primary ink",
        role: "Invalid row",
    },
    {
        token: "--division-bronze",
        light: "#a34a20",
        dark: "#b3551f",
        lightInk: "#ffffff",
        darkInk: "#ffffff",
        inkName: "white",
        role: "Bronze division",
    },
    {
        token: "--division-silver",
        light: "#5c6675",
        dark: "#6a7383",
        lightInk: "#ffffff",
        darkInk: "#ffffff",
        inkName: "white",
        role: "Silver division",
    },
    {
        token: "--division-gold",
        light: "#a8790a",
        dark: "#b8860c",
        lightInk: "#161616",
        darkInk: "#161616",
        inkName: "black",
        role: "Gold division",
    },
    {
        token: "--division-platinum",
        light: "#593399",
        dark: "#6639ad",
        lightInk: "#ffffff",
        darkInk: "#ffffff",
        inkName: "white",
        role: "Platinum division",
    },
];

const INKS: InkRow[] = [
    { role: "Primary", token: "--text-primary", light: "#161616", dark: "#eef1f6" },
    { role: "Secondary", token: "--text-secondary", light: "#414957", dark: "#b5bdcb" },
    { role: "Muted", token: "--text-muted", light: "#646d7c", dark: "#8a94a6" },
    { role: "Link", token: "--text-link", light: "#2847b8", dark: "#8fadf5" },
    { role: "Link hover", token: "--text-link-hover", light: "#203c91", dark: "#b6c8fb" },
];

const CODE_SAMPLE = `#include <vector>

int lower_bound_index(const std::vector<int>& a, int key) {
    int low = 0;
    int high = static_cast<int>(a.size());
    while (low < high) {
        const int middle = low + (high - low) / 2;
        if (a[middle] < key) low = middle + 1;
        else high = middle;
    }
    return low;
}`;

function channels(hex: string): [number, number, number] {
    const value = Number.parseInt(hex.slice(1), 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function linear(value: number): number {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
    const [red, green, blue] = channels(hex);
    return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function ratio(first: string, second: string): string {
    const a = luminance(first);
    const b = luminance(second);
    const value = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    return `${value.toFixed(2)}:1`;
}
</script>

<template>
    <div class="aayntn-style-guide">
        <p class="aayntn-style-guide__lead">
            Every control the encyclopedia draws, shown at rest and under the pointer. The state
            matrix in section 03 puts the light and the dark appearance side by side; the rest of
            the page follows the appearance control in the header.
        </p>

        <div class="aayntn-style-guide__meta">
            <span>Type: Noto Sans, Noto Sans Mono</span>
            <span>Grid: 8 pixels</span>
            <span>Radius: one token, 5 pixels</span>
            <span>Ink: 4.5 to 1 minimum</span>
        </div>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">01</span>
                <h2 class="aayntn-sg-section__title">Type scale</h2>
            </div>
            <p class="aayntn-sg-section__note">
                Nine steps, each with one job. The display face is the only place where the type
                becomes architecture; the reading sizes stay inside a measure of 72 characters.
            </p>
            <div class="aayntn-sg-type">
                <div v-for="row in TYPE_SCALE" :key="row.token" class="aayntn-sg-type__row">
                    <div class="aayntn-sg-type__meta">
                        <span class="aayntn-sg-type__name">{{ row.name }}</span>
                        <code class="aayntn-sg-type__token">{{ row.token }}</code>
                    </div>
                    <span
                        class="aayntn-sg-type__sample"
                        :style="{
                            fontSize: `var(${row.token})`,
                            fontFamily: row.mono ? 'var(--font-code)' : undefined,
                        }"
                    >
                        {{ row.sample }}
                    </span>
                </div>
            </div>
        </section>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">02</span>
                <h2 class="aayntn-sg-section__title">Palette</h2>
            </div>
            <p class="aayntn-sg-section__note">
                A field carries one ink. The ratio is the contrast between that ink and its field in
                the appearance named above it; every pair clears 4.5 to 1.
            </p>
            <table class="aayntn-sg-palette">
                <caption class="sr-only">
                    Palette fields and the contrast of their ink in both appearances
                </caption>
                <thead>
                    <tr>
                        <th scope="col">Token</th>
                        <th scope="col">Light</th>
                        <th scope="col">Contrast</th>
                        <th scope="col">Dark</th>
                        <th scope="col">Contrast</th>
                        <th scope="col">Ink</th>
                        <th scope="col">Role</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="field in FIELDS" :key="field.token">
                        <td>
                            <code>{{ field.token }}</code>
                        </td>
                        <td>
                            <span class="aayntn-sg-swatch" :style="{ background: field.light }" />
                            <code>{{ field.light }}</code>
                        </td>
                        <td class="aayntn-sg-ratio">
                            {{ ratio(field.light, field.lightInk) }}
                        </td>
                        <td>
                            <span class="aayntn-sg-swatch" :style="{ background: field.dark }" />
                            <code>{{ field.dark }}</code>
                        </td>
                        <td class="aayntn-sg-ratio">{{ ratio(field.dark, field.darkInk) }}</td>
                        <td>{{ field.inkName }}</td>
                        <td>{{ field.role }}</td>
                    </tr>
                </tbody>
            </table>

            <div class="aayntn-sg-grid aayntn-sg-grid--two" style="margin-top: var(--space-6)">
                <table>
                    <caption>Text roles on the paper of their appearance</caption>
                    <thead>
                        <tr>
                            <th scope="col">Role</th>
                            <th scope="col">Token</th>
                            <th scope="col">Light</th>
                            <th scope="col">On paper</th>
                            <th scope="col">Dark</th>
                            <th scope="col">On paper</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="ink in INKS" :key="ink.token">
                            <td>{{ ink.role }}</td>
                            <td>
                                <code>{{ ink.token }}</code>
                            </td>
                            <td>
                                <code>{{ ink.light }}</code>
                            </td>
                            <td class="aayntn-sg-ratio">{{ ratio(ink.light, "#ffffff") }}</td>
                            <td>
                                <code>{{ ink.dark }}</code>
                            </td>
                            <td class="aayntn-sg-ratio">{{ ratio(ink.dark, "#0b0d11") }}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="aayntn-sg-specimen">
                    <span class="aayntn-sg-label">Read the room</span>
                    <p style="margin: 0 0 var(--space-3)">
                        Cobalt is a field, not a letter. On paper the link is
                        <code>--text-link</code>
                        ; on the dark desk it is the lighter
                        <code>#8fadf5</code>
                        , so the same word keeps its contrast without carrying its own rule.
                    </p>
                    <p style="margin: 0; color: var(--text-muted)">
                        Muted text is the quietest ink that still clears 4.5 to 1 on both papers.
                    </p>
                </div>
            </div>
        </section>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">03</span>
                <h2 class="aayntn-sg-section__title">Interactive states</h2>
            </div>
            <p class="aayntn-sg-section__note">
                Hover, focus, active and visited, in both appearances at once. Every background
                change names its own ink; no state relies on a filter or on the browser default for
                a visited link.
            </p>
            <StyleGuideStates />
        </section>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">04</span>
                <h2 class="aayntn-sg-section__title">Buttons and controls</h2>
            </div>
            <div class="aayntn-sg-grid aayntn-sg-grid--two">
                <div class="aayntn-sg-specimen aayntn-sg-specimen--cobalt">
                    <span class="aayntn-sg-label">On a cobalt field</span>
                    <div class="aayntn-sg-row">
                        <a class="aayntn-button" href="#style-guide">Read the primer</a>
                        <a class="aayntn-button aayntn-button--ghost" href="#style-guide">
                            Browse the index
                        </a>
                    </div>
                    <p class="aayntn-sg-caption">
                        The solid button is white on cobalt; the ghost button borrows the field.
                        Both take the gold accent on hover.
                    </p>
                </div>

                <div class="aayntn-sg-specimen">
                    <span class="aayntn-sg-label">On paper</span>
                    <div class="aayntn-sg-row">
                        <button
                            class="aayntn-button aayntn-button--ink"
                            data-focus-target
                            type="button"
                        >
                            Export progress
                        </button>
                        <button class="aayntn-button aayntn-button--ink" type="button" disabled>
                            Unavailable
                        </button>
                    </div>
                    <p class="aayntn-sg-caption">
                        The ink button reverses the figure. A disabled control keeps its shape and
                        loses its pointer.
                    </p>
                </div>

                <div class="aayntn-sg-specimen aayntn-sg-specimen--ink">
                    <span class="aayntn-sg-label">Header mechanics</span>
                    <div class="aayntn-sg-row">
                        <button
                            class="aayntn-icon-button"
                            type="button"
                            aria-label="Switch the appearance"
                        >
                            Aa
                        </button>
                        <button class="aayntn-search__button" type="button">Search</button>
                        <button class="aayntn-code__action" type="button">Copy</button>
                    </div>
                    <p class="aayntn-sg-caption">
                        Three controls that live on the ink fields. Their hover is the inverse
                        surface and the inverse ink, never a white film on white text.
                    </p>
                </div>

                <div class="aayntn-sg-specimen">
                    <span class="aayntn-sg-label">Transport, filters and tabs</span>
                    <div class="aayntn-sg-row" style="margin-bottom: var(--space-4)">
                        <button class="aayntn-transport__button" type="button">Previous</button>
                        <button
                            class="aayntn-transport__button aayntn-transport__button--primary"
                            type="button"
                        >
                            Play
                        </button>
                        <button class="aayntn-transport__button" type="button" disabled>
                            Next
                        </button>
                        <button class="aayntn-filter" type="button">Graphs</button>
                        <button class="aayntn-filter" type="button" aria-pressed="true">
                            Greedy
                        </button>
                        <button class="aayntn-search__close" type="button">Esc</button>
                    </div>
                    <div class="aayntn-tablist" role="tablist" aria-label="Implementation language">
                        <button class="aayntn-tab" role="tab" aria-selected="false" type="button">
                            C++17
                        </button>
                        <button class="aayntn-tab" role="tab" aria-selected="true" type="button">
                            Python
                        </button>
                        <button class="aayntn-tab" role="tab" aria-selected="false" type="button">
                            Java
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">05</span>
                <h2 class="aayntn-sg-section__title">Chips</h2>
            </div>
            <p class="aayntn-sg-section__note">
                A chip is a label, not a badge: the border is the ink of the field it names. The
                last one is a link, so it also carries a hover and a visited state.
            </p>
            <div class="aayntn-sg-row aayntn-sg-row--loose">
                <span class="aayntn-chip">Default</span>
                <span class="aayntn-chip aayntn-chip--bronze">Bronze</span>
                <span class="aayntn-chip aayntn-chip--silver">Silver</span>
                <span class="aayntn-chip aayntn-chip--gold">Gold</span>
                <span class="aayntn-chip aayntn-chip--platinum">Platinum</span>
                <span class="aayntn-chip aayntn-chip--accent">Accent</span>
                <span class="aayntn-chip aayntn-chip--emerald">Emerald</span>
                <span class="aayntn-chip aayntn-chip--vermilion">Vermilion</span>
                <span class="aayntn-chip aayntn-chip--muted">Muted</span>
                <a class="aayntn-chip" href="#style-guide">Interactive</a>
            </div>
        </section>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">06</span>
                <h2 class="aayntn-sg-section__title">Fields</h2>
            </div>
            <p class="aayntn-sg-section__note">
                Six saturated fields, each with the ink that clears its contrast. The gold field
                takes the black, and every other field takes the white.
            </p>
            <div class="aayntn-sg-grid aayntn-sg-grid--three">
                <div class="aayntn-field aayntn-sg-field">
                    <p class="aayntn-field__title">Cobalt</p>
                    <p class="aayntn-field__copy">
                        The primary field. It carries the navigation and the first action of a page.
                    </p>
                </div>
                <div class="aayntn-field aayntn-field--vermilion aayntn-sg-field">
                    <p class="aayntn-field__title">Vermilion</p>
                    <p class="aayntn-field__copy">
                        The error field. It appears beside a fault, never as the fault itself.
                    </p>
                </div>
                <div class="aayntn-field aayntn-field--emerald aayntn-sg-field">
                    <p class="aayntn-field__title">Emerald</p>
                    <p class="aayntn-field__copy">
                        The success field. It marks a verified listing and an invariant that holds.
                    </p>
                </div>
                <div class="aayntn-field aayntn-field--violet aayntn-sg-field">
                    <p class="aayntn-field__title">Violet</p>
                    <p class="aayntn-field__copy">
                        The selected field. It names the choice the reader has made.
                    </p>
                </div>
                <div class="aayntn-field aayntn-field--ink aayntn-sg-field">
                    <p class="aayntn-field__title">Ink</p>
                    <p class="aayntn-field__copy">
                        The deep field. It holds a code header or the method band.
                    </p>
                </div>
                <div class="aayntn-field aayntn-field--gold aayntn-sg-field">
                    <p class="aayntn-field__title">Gold</p>
                    <p class="aayntn-field__copy">
                        The accent field. It is the one field that takes the black ink.
                    </p>
                </div>
            </div>
        </section>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">07</span>
                <h2 class="aayntn-sg-section__title">Form controls</h2>
            </div>
            <div class="aayntn-sg-grid aayntn-sg-grid--two">
                <div class="aayntn-sg-specimen">
                    <div class="aayntn-sg-form">
                        <div class="aayntn-sg-form__row">
                            <label for="aayntn-sg-text">Lesson title</label>
                            <input
                                id="aayntn-sg-text"
                                class="aayntn-lab__input"
                                type="text"
                                value="Binary search"
                            />
                        </div>
                        <div class="aayntn-sg-form__row">
                            <label for="aayntn-sg-select">Learning track</label>
                            <select id="aayntn-sg-select" class="aayntn-filter">
                                <option>No track, the graph order</option>
                                <option>Bronze</option>
                                <option>Silver</option>
                                <option>Gold</option>
                                <option>Platinum</option>
                            </select>
                        </div>
                        <div class="aayntn-sg-form__row">
                            <label for="aayntn-sg-notes">Notes</label>
                            <textarea id="aayntn-sg-notes" class="aayntn-lab__input" rows="3">
The invariant is the whole proof.</textarea>
                        </div>
                        <div class="aayntn-sg-row">
                            <label class="aayntn-sg-check">
                                <input type="checkbox" checked />
                                Mark as read
                            </label>
                            <label class="aayntn-sg-check">
                                <input type="radio" name="aayntn-sg-track" checked />
                                Required
                            </label>
                            <label class="aayntn-sg-check">
                                <input type="radio" name="aayntn-sg-track" />
                                Recommended
                            </label>
                        </div>
                    </div>
                </div>

                <div class="aayntn-sg-specimen">
                    <span class="aayntn-sg-label">Search field</span>
                    <div class="aayntn-search__field">
                        <span class="aayntn-search__kind">Search</span>
                        <input
                            class="aayntn-search__input"
                            type="search"
                            placeholder="Dijkstra, Fenwick, convex hull"
                            aria-label="Search the encyclopedia"
                        />
                    </div>
                    <p class="aayntn-sg-caption">
                        The field is a rule and a caret, not a rounded box. The focus ring is drawn
                        inside the rule so the dialog never jumps.
                    </p>
                </div>
            </div>
        </section>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">08</span>
                <h2 class="aayntn-sg-section__title">Cards</h2>
            </div>
            <p class="aayntn-sg-section__note">
                A card is a bordered sheet, not a floating panel. The feature card is the one that
                is a link, so it carries the paper hover; the other two are containers.
            </p>
            <div class="aayntn-sg-grid aayntn-sg-grid--three">
                <a class="aayntn-feature" href="#style-guide">
                    <span class="aayntn-feature__kicker">Foundations</span>
                    <span class="aayntn-feature__title">Complexity</span>
                    <span class="aayntn-feature__copy">
                        Count the operations before you count the lines.
                    </span>
                    <span class="aayntn-feature__meta">18 lessons</span>
                </a>

                <div class="aayntn-progress__card">
                    <p class="aayntn-sg-card__title">Progress</p>
                    <div class="aayntn-progress__row">
                        <span class="aayntn-progress__title">Binary search</span>
                    </div>
                    <div class="aayntn-progress__bar" aria-hidden="true">
                        <div class="aayntn-progress__bar-fill" style="width: 62%" />
                    </div>
                    <p class="aayntn-sg-card__meta">62 percent of the way through</p>
                </div>

                <div class="aayntn-summary">
                    <div class="aayntn-summary__head">
                        <span class="aayntn-summary__title">Binary search</span>
                    </div>
                    <div class="aayntn-summary__grid">
                        <div class="aayntn-summary__cell">
                            <div class="aayntn-summary__label">Time</div>
                            <div class="aayntn-summary__value">O(log n)</div>
                        </div>
                        <div class="aayntn-summary__cell">
                            <div class="aayntn-summary__label">Space</div>
                            <div class="aayntn-summary__value">O(1)</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">09</span>
                <h2 class="aayntn-sg-section__title">Links</h2>
            </div>
            <p class="aayntn-sg-section__note">
                A visited link keeps the color of its context. The browser default is removed once,
                without a heavier rule that could overrule the component that owns the link.
            </p>
            <div class="aayntn-sg-grid aayntn-sg-grid--two">
                <div class="aayntn-sg-specimen">
                    <span class="aayntn-sg-label">Prose</span>
                    <p style="margin: 0">
                        A proof is a chain of claims, and every claim is
                        <a data-focus-target href="#style-guide">a link to its definition</a>
                        . The resting ink is
                        <code>--text-link</code>
                        ; the visited ink is the same.
                    </p>
                    <p style="margin: var(--space-4) 0 0">
                        <a data-visited-link :href="withBase('/style-guide/')">A visited link</a>
                        <span aria-hidden="true">/</span>
                        <a data-resting-link href="#style-guide-unvisited">A resting link</a>
                    </p>
                </div>

                <div class="aayntn-sg-specimen aayntn-sg-specimen--ink">
                    <span class="aayntn-sg-label">On the ink field</span>
                    <p style="margin: 0; color: rgba(255, 255, 255, 0.76)">
                        The footer keeps its own ink pair. A link on the ink field is
                        <a href="#style-guide" style="color: rgba(255, 255, 255, 0.76)">
                            a quiet white
                        </a>
                        until the pointer arrives.
                    </p>
                    <p style="margin: var(--space-3) 0 0">
                        <a
                            class="aayntn-section__more"
                            href="#style-guide"
                            style="color: var(--color-gold)"
                        >
                            All lessons
                        </a>
                    </p>
                </div>
            </div>
        </section>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">10</span>
                <h2 class="aayntn-sg-section__title">Table and code</h2>
            </div>
            <p class="aayntn-sg-section__note">
                A table is a ruled grid with square cells. A code block is a bounded sheet with the
                one radius, and its header carries the language and the actions.
            </p>

            <table>
                <caption>
                    The state tokens and the figure they clear in the light appearance
                </caption>
                <thead>
                    <tr>
                        <th scope="col">State</th>
                        <th scope="col">Field</th>
                        <th scope="col">Ink</th>
                        <th scope="col">Contrast</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Hover, paper</td>
                        <td><code>--hover-surface</code></td>
                        <td><code>--hover-ink</code></td>
                        <td class="aayntn-sg-ratio">16.00:1</td>
                    </tr>
                    <tr>
                        <td>Hover, ink field</td>
                        <td><code>--hover-surface-inverse</code></td>
                        <td><code>--hover-ink-inverse</code></td>
                        <td class="aayntn-sg-ratio">13.50:1</td>
                    </tr>
                    <tr>
                        <td>Primary action</td>
                        <td><code>--hover-primary-field</code></td>
                        <td><code>--hover-primary-ink</code></td>
                        <td class="aayntn-sg-ratio">9.92:1</td>
                    </tr>
                    <tr>
                        <td>Accent action</td>
                        <td><code>--hover-accent-field</code></td>
                        <td><code>--hover-accent-ink</code></td>
                        <td class="aayntn-sg-ratio">9.81:1</td>
                    </tr>
                    <tr>
                        <td>Selected</td>
                        <td><code>--state-selected-field</code></td>
                        <td><code>--state-selected-ink</code></td>
                        <td class="aayntn-sg-ratio">8.90:1</td>
                    </tr>
                    <tr>
                        <td>Visited link</td>
                        <td><code>--surface-page</code></td>
                        <td><code>--visited-ink</code></td>
                        <td class="aayntn-sg-ratio">7.83:1</td>
                    </tr>
                    <tr>
                        <td>Focus ring</td>
                        <td><code>--surface-page</code></td>
                        <td><code>--focus-ring</code></td>
                        <td class="aayntn-sg-ratio">7.83:1</td>
                    </tr>
                </tbody>
            </table>

            <div class="aayntn-code" style="margin-top: var(--space-6)">
                <div class="aayntn-code__head">
                    <span class="aayntn-code__lang">C++17</span>
                    <span class="aayntn-code__file">binary_search.cpp</span>
                    <span class="aayntn-code__status aayntn-code__status--verified">
                        <span class="aayntn-code__status-dot" />
                        Verified
                    </span>
                    <div class="aayntn-code__actions">
                        <button class="aayntn-code__action" type="button">Copy</button>
                        <button class="aayntn-code__action" type="button">Expand</button>
                    </div>
                </div>
                <div class="aayntn-code__body">
                    <pre><code>{{ CODE_SAMPLE }}</code></pre>
                </div>
            </div>
        </section>

        <section class="aayntn-sg-section">
            <div class="aayntn-sg-section__head">
                <span class="aayntn-sg-section__index">11</span>
                <h2 class="aayntn-sg-section__title">The radius</h2>
            </div>
            <p class="aayntn-sg-section__note">
                One value tunes every bordered control and surface. The slider writes
                <code>--radius</code>
                to the document element, and the line below is what the stylesheet carries when you
                are done.
            </p>
            <RadiusControl />
        </section>
    </div>
</template>
