<script setup lang="ts">
import { onMounted, ref } from "vue";

const APPEARANCES = [
    { id: "light", name: "Light appearance" },
    { id: "dark", name: "Dark appearance" },
] as const;

/*
 * The token values of both appearances, read once from the document. Toggling
 * the class is synchronous and is restored before the frame is painted, so the
 * two panels can show the real palette side by side without a second copy of
 * tokens.css.
 */
const TOKENS = [
    "--color-black",
    "--color-white",
    "--color-cobalt",
    "--color-primary",
    "--color-primary-strong",
    "--color-gold",
    "--color-gold-bright",
    "--color-violet",
    "--color-vermilion",
    "--surface-page",
    "--surface-raised",
    "--surface-sunken",
    "--surface-inverse",
    "--surface-code",
    "--text-primary",
    "--text-secondary",
    "--text-muted",
    "--text-inverse",
    "--text-link",
    "--text-link-hover",
    "--text-accent",
    "--text-accent-hover",
    "--border-subtle",
    "--border-strong",
    "--border-ink",
    "--hover-surface",
    "--hover-surface-strong",
    "--hover-ink",
    "--hover-surface-inverse",
    "--hover-ink-inverse",
    "--hover-accent-field",
    "--hover-accent-ink",
    "--hover-primary-field",
    "--hover-primary-ink",
    "--visited-ink",
    "--focus-ring",
    "--focus-ring-inverse",
    "--state-selected-field",
    "--state-selected-ink",
    "--division-bronze",
    "--division-silver",
    "--division-gold",
    "--division-platinum",
    "--division-bronze-hover",
    "--division-silver-hover",
    "--division-gold-hover",
    "--division-platinum-hover",
    "--division-bronze-hover-ink",
    "--division-silver-hover-ink",
    "--division-gold-hover-ink",
    "--division-platinum-hover-ink",
];

const tokens = ref<Record<string, Record<string, string>>>({});
const ready = ref(false);

function readAppearance(dark: boolean): Record<string, string> {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    const style = getComputedStyle(root);
    const values: Record<string, string> = {};
    for (const name of TOKENS) {
        const value = style.getPropertyValue(name).trim();
        if (value) values[name] = value;
    }
    root.classList.toggle("dark", wasDark);
    return values;
}

onMounted(() => {
    tokens.value = {
        light: readAppearance(false),
        dark: readAppearance(true),
    };
    ready.value = true;
});
</script>

<template>
    <div class="aayntn-sg-states">
        <div
            v-for="appearance in APPEARANCES"
            :key="appearance.id"
            class="aayntn-sg-appearance"
            :class="ready ? `aayntn-appearance-${appearance.id}` : undefined"
            :style="tokens[appearance.id] ?? {}"
            :data-appearance="appearance.id"
            :data-ready="ready ? 'true' : 'false'"
        >
            <div class="aayntn-sg-appearance__head">
                <span class="aayntn-sg-appearance__name">{{ appearance.name }}</span>
                <span class="aayntn-sg-appearance__value">
                    {{ appearance.id === "light" ? "#ffffff" : "#0b0d11" }}
                </span>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Nav link</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--inverse">
                    <a class="aayntn-nav__link" data-state="nav-link" href="#style-guide">
                        Algorithms
                    </a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Brand</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--inverse">
                    <a class="aayntn-brand" data-state="brand" href="#style-guide">
                        <span class="aayntn-brand__mark">A.A.Y.N.T.N.</span>
                        <span class="aayntn-brand__tagline">All Algorithms</span>
                    </a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Icon button</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--inverse">
                    <button
                        class="aayntn-icon-button"
                        data-state="icon-button"
                        type="button"
                        aria-label="Switch the appearance"
                    >
                        Aa
                    </button>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Search button</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--inverse">
                    <button class="aayntn-search__button" data-state="search-button" type="button">
                        Search
                    </button>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Code action</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--inverse">
                    <button class="aayntn-code__action" data-state="code-action" type="button">
                        Copy
                    </button>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Footer link</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--inverse">
                    <ul class="aayntn-footer__list">
                        <li>
                            <a data-state="footer-link" href="#style-guide">Curriculum</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Footer legal link</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--inverse">
                    <div class="aayntn-footer__legal">
                        <a data-state="footer-legal-link" href="#style-guide">Accessibility</a>
                    </div>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Prose link</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <a data-state="prose-link" href="#style-guide">Read the proof</a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Sidebar link</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <a class="aayntn-sidebar__link" data-state="sidebar-link" href="#style-guide">
                        Binary search
                    </a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Outline link</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <a class="aayntn-outline__link" data-state="outline-link" href="#style-guide">
                        The invariant
                    </a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Search result</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <a class="aayntn-search__result" data-state="search-result" href="#style-guide">
                        <span class="aayntn-search__kind">Lesson</span>
                        <span class="aayntn-search__title" data-state-text>Dijkstra</span>
                        <span class="aayntn-search__summary" data-state-text>
                            Shortest paths from one source.
                        </span>
                    </a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Search close</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <button class="aayntn-search__close" data-state="search-close" type="button">
                        Esc
                    </button>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Button</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--cobalt">
                    <a class="aayntn-button" data-state="button" href="#style-guide">
                        Read the primer
                    </a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Ghost button</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--cobalt">
                    <a
                        class="aayntn-button aayntn-button--ghost"
                        data-state="button-ghost"
                        href="#style-guide"
                    >
                        Browse the index
                    </a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Ink button</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <button
                        class="aayntn-button aayntn-button--ink"
                        data-state="button-ink"
                        type="button"
                    >
                        Export progress
                    </button>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Chip</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <a class="aayntn-chip" data-state="chip" href="#style-guide">Foundations</a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Tab</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <div class="aayntn-tablist" role="tablist" aria-label="Implementation language">
                        <button
                            class="aayntn-tab"
                            data-state="tab"
                            role="tab"
                            aria-selected="false"
                            type="button"
                        >
                            C++17
                        </button>
                        <button
                            class="aayntn-tab"
                            data-state="tab-selected"
                            role="tab"
                            aria-selected="true"
                            type="button"
                        >
                            Python
                        </button>
                    </div>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Transport</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <button class="aayntn-transport__button" data-state="transport" type="button">
                        Previous
                    </button>
                    <button
                        class="aayntn-transport__button aayntn-transport__button--primary"
                        data-state="transport-primary"
                        type="button"
                    >
                        Play
                    </button>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Filter</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <button class="aayntn-filter" data-state="filter" type="button">Graphs</button>
                    <button
                        class="aayntn-filter"
                        data-state="filter-selected"
                        type="button"
                        aria-pressed="true"
                    >
                        Greedy
                    </button>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Feature card</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <a class="aayntn-feature" data-state="feature" href="#style-guide">
                        <span class="aayntn-feature__kicker">Foundations</span>
                        <span class="aayntn-feature__title" data-state-text>Complexity</span>
                        <span class="aayntn-feature__copy" data-state-text>
                            Count the operations before you count the lines.
                        </span>
                        <span class="aayntn-feature__meta">18 lessons</span>
                    </a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Progress link</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <div class="aayntn-progress__card">
                        <div class="aayntn-progress__row">
                            <a
                                class="aayntn-progress__title"
                                data-state="progress-title"
                                href="#style-guide"
                            >
                                Binary search
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Learn next link</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <div class="aayntn-learn-next">
                        <a
                            class="aayntn-learn-next__title"
                            data-state="learn-next-title"
                            href="#style-guide"
                        >
                            Segment trees
                        </a>
                    </div>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Section link</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <a class="aayntn-section__more" data-state="section-more" href="#style-guide">
                        All lessons
                    </a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Ink section link</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--inverse aayntn-band--ink">
                    <a
                        class="aayntn-section__more"
                        data-state="section-more-ink"
                        href="#style-guide"
                    >
                        All lessons
                    </a>
                </div>
            </div>

            <div class="aayntn-sg-state">
                <span class="aayntn-sg-state__name">Division card</span>
                <div class="aayntn-sg-stage aayntn-sg-stage--paper">
                    <div class="aayntn-sg-divisions">
                        <a
                            class="aayntn-division aayntn-division--bronze"
                            data-state="division-bronze"
                            href="#style-guide"
                        >
                            <span class="aayntn-division__name">Bronze</span>
                            <span class="aayntn-division__focus">Foundations</span>
                            <span class="aayntn-division__copy">The grammar of the craft.</span>
                        </a>
                        <a
                            class="aayntn-division aayntn-division--silver"
                            data-state="division-silver"
                            href="#style-guide"
                        >
                            <span class="aayntn-division__name">Silver</span>
                            <span class="aayntn-division__focus">Technique</span>
                            <span class="aayntn-division__copy">The standard structures.</span>
                        </a>
                        <a
                            class="aayntn-division aayntn-division--gold"
                            data-state="division-gold"
                            href="#style-guide"
                        >
                            <span class="aayntn-division__name">Gold</span>
                            <span class="aayntn-division__focus">Synthesis</span>
                            <span class="aayntn-division__copy">The longer arguments.</span>
                        </a>
                        <a
                            class="aayntn-division aayntn-division--platinum"
                            data-state="division-platinum"
                            href="#style-guide"
                        >
                            <span class="aayntn-division__name">Platinum</span>
                            <span class="aayntn-division__focus">Depth</span>
                            <span class="aayntn-division__copy">The open problems.</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
