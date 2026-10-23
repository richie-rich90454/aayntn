<script setup lang="ts">
import { withBase } from "vitepress";
import stats from "../data/generated/stats.json";
import lessons from "../data/generated/lessons.json";
import visualizations from "../data/generated/visualizations.json";
import {
    LANGUAGE_IDS,
    LANGUAGE_LABELS,
    SUBJECTS,
    SUBJECT_LABELS,
    isUsacoSubmittable,
} from "../data/types";
import type { LessonEntry, Subject, VisualizationEntry } from "../data/types";
import { coveragePercent, taggingPercent, useCoverage } from "./composables/useCoverage";

/**
 * The homepage.
 *
 * Five blocks, in the order a reader needs them: what this is, where to
 * begin, what is actually finished, what subjects exist, and what the
 * laboratory and the six languages contain. Every figure is read from the
 * generated data, so the page cannot claim more than the build published.
 */

const lessonList = lessons as LessonEntry[];
const laboratoryList = visualizations as VisualizationEntry[];
const coverage = useCoverage();

const coverageShare = coveragePercent(coverage);
const taggingShare = taggingPercent(coverage);
const hasCoverage = coverage.required > 0 || coverage.totalTasks > 0;

const coverageSentence = hasCoverage
    ? "These are the published figures, exactly as the coverage tooling reports them."
    : "No coverage has been published yet, so the figures below are exactly the zeros the tooling reports.";

const paths = [
    {
        index: "01",
        title: "I have never programmed",
        copy: "Start with the vocabulary an AP Computer Science A course assumes, then write your first loops and programs.",
        first: "From AP Computer Science A",
        href: withBase("/start/from-ap-csa/"),
    },
    {
        index: "02",
        title: "I am working on Bronze",
        copy: "Learn to model a statement exactly, then simulate and enumerate it without guessing at an optimization.",
        first: "The Bronze track",
        href: withBase("/curriculum/bronze/"),
    },
    {
        index: "03",
        title: "I know the basics",
        copy: "Go straight to the subject index and read the derivation, the proof and the implementation you need.",
        first: "The subject index",
        href: withBase("/algorithms/"),
    },
];

const subjects = SUBJECTS.map((subject: Subject) => {
    const prefix = `/algorithms/${subject}/`;
    const count = lessonList.filter(
        (lesson) =>
            lesson.subjects.includes(subject) &&
            lesson.href.startsWith(prefix) &&
            lesson.href !== `/algorithms/${subject}`,
    ).length;
    return {
        id: subject,
        label: SUBJECT_LABELS[subject],
        count,
        href: withBase(prefix),
    };
});

const laboratories = laboratoryList.map((laboratory) => ({
    id: laboratory.id,
    title: laboratory.title,
    scene: laboratory.scene,
    href: withBase(laboratory.href),
}));

const languages = LANGUAGE_IDS.map((id) => ({
    id,
    label: LANGUAGE_LABELS[id],
    submittable: isUsacoSubmittable(id),
    href: withBase(`/languages/${id}/`),
}));

const figures = [
    { value: stats.lessons, label: "Lessons" },
    { value: stats.algorithms, label: "Algorithms" },
    { value: stats.variants, label: "Tested implementations" },
    { value: stats.problems, label: "Curated problems" },
];

function openSearch(): void {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }));
}
</script>

<template>
    <div class="aayntn-home">
        <a class="skip-link" href="#main">Skip to content</a>

        <section class="aayntn-home-hero" aria-labelledby="aayntn-home-title">
            <div class="aayntn-home-hero__inner">
                <h1 id="aayntn-home-title" class="aayntn-home-hero__title">
                    <span class="aayntn-home-hero__brand">A.A.Y.N.T.N.</span>
                    <span class="aayntn-home-hero__name">
                        All algorithms
                        <em>you need to know.</em>
                    </span>
                </h1>
                <p class="aayntn-home-hero__lede">
                    An encyclopedia of algorithms from AP Computer Science A through USACO Platinum,
                    with derivations, tested implementations in six languages and deterministic
                    animated explanations.
                </p>
                <div class="aayntn-home-hero__actions">
                    <a
                        class="aayntn-home-button aayntn-home-button--primary"
                        v-bind:href="withBase('/start/from-ap-csa/')"
                    >
                        Start from the beginning
                    </a>
                    <a
                        class="aayntn-home-button aayntn-home-button--secondary"
                        v-bind:href="withBase('/algorithms/')"
                    >
                        Browse the encyclopedia
                    </a>
                    <button class="aayntn-home-search" type="button" @click="openSearch">
                        <span>Search the encyclopedia</span>
                        <kbd>Ctrl K</kbd>
                    </button>
                </div>
            </div>
        </section>

        <section class="aayntn-home-section" aria-labelledby="aayntn-home-paths">
            <div class="aayntn-home-section__inner">
                <header class="aayntn-home-section__head">
                    <div>
                        <h2 id="aayntn-home-paths" class="aayntn-home-section__title">
                            Choose a starting point
                        </h2>
                        <p class="aayntn-home-section__lede">
                            Three routes into the same material, chosen by how much programming you
                            have already done.
                        </p>
                    </div>
                </header>

                <div class="aayntn-home-paths">
                    <a
                        v-for="path in paths"
                        :key="path.href"
                        class="aayntn-home-path"
                        :href="path.href"
                    >
                        <span class="aayntn-home-path__index">{{ path.index }}</span>
                        <h3 class="aayntn-home-path__title">{{ path.title }}</h3>
                        <p class="aayntn-home-path__copy">{{ path.copy }}</p>
                        <span class="aayntn-home-path__first">First read: {{ path.first }}</span>
                    </a>
                </div>
            </div>
        </section>

        <section
            class="aayntn-home-section aayntn-home-coverage"
            aria-labelledby="aayntn-home-coverage"
        >
            <div class="aayntn-home-section__inner">
                <header class="aayntn-home-section__head">
                    <div>
                        <h2 id="aayntn-home-coverage" class="aayntn-home-section__title">
                            Coverage
                        </h2>
                        <p class="aayntn-home-section__lede">{{ coverageSentence }}</p>
                    </div>
                    <a class="aayntn-home-section__link" v-bind:href="withBase('/coverage/')">
                        Read the coverage report
                    </a>
                </header>

                <dl class="aayntn-home-coverage__figures">
                    <div class="aayntn-home-coverage__figure">
                        <dt class="aayntn-home-coverage__label">Required techniques complete</dt>
                        <dd class="aayntn-home-coverage__value">{{ coverageShare }}%</dd>
                        <dd class="aayntn-home-coverage__count">
                            {{ coverage.complete }} of {{ coverage.required }}
                        </dd>
                    </div>
                    <div class="aayntn-home-coverage__figure">
                        <dt class="aayntn-home-coverage__label">Tasks tagged with a technique</dt>
                        <dd class="aayntn-home-coverage__value">{{ taggingShare }}%</dd>
                        <dd class="aayntn-home-coverage__count">
                            {{ coverage.taggedTasks }} of {{ coverage.totalTasks }}
                        </dd>
                    </div>
                </dl>
            </div>
        </section>

        <section class="aayntn-home-section" aria-labelledby="aayntn-home-subjects">
            <div class="aayntn-home-section__inner">
                <header class="aayntn-home-section__head">
                    <div>
                        <h2 id="aayntn-home-subjects" class="aayntn-home-section__title">
                            Subjects
                        </h2>
                        <p class="aayntn-home-section__lede">
                            All fourteen subjects, with the number of techniques each one currently
                            publishes.
                        </p>
                    </div>
                </header>

                <nav class="aayntn-home-subjects" aria-label="Subjects">
                    <div class="aayntn-home-subjects__grid">
                        <a
                            v-for="subject in subjects"
                            :key="subject.id"
                            class="aayntn-home-subject"
                            :href="subject.href"
                        >
                            <span class="aayntn-home-subject__label">{{ subject.label }}</span>
                            <span class="aayntn-home-subject__count">{{ subject.count }}</span>
                        </a>
                    </div>
                </nav>
            </div>
        </section>

        <section class="aayntn-home-section aayntn-home-labs" aria-labelledby="aayntn-home-labs">
            <div class="aayntn-home-section__inner">
                <header class="aayntn-home-section__head">
                    <div>
                        <h2 id="aayntn-home-labs" class="aayntn-home-section__title">
                            Laboratories and languages
                        </h2>
                        <p class="aayntn-home-section__lede">
                            Twelve interactive laboratories and six reference languages; C, C++17,
                            Java and Python are submittable to USACO, while Pascal and JavaScript
                            are educational.
                        </p>
                    </div>
                    <a class="aayntn-home-section__link" v-bind:href="withBase('/laboratory/')">
                        Open the laboratory
                    </a>
                </header>

                <nav class="aayntn-home-labs__strip" aria-label="Laboratories">
                    <a
                        v-for="laboratory in laboratories"
                        :key="laboratory.id"
                        class="aayntn-home-lab"
                        :href="laboratory.href"
                    >
                        <span class="aayntn-home-lab__title">{{ laboratory.title }}</span>
                        <span class="aayntn-home-lab__scene">{{ laboratory.scene }}</span>
                    </a>
                </nav>

                <div class="aayntn-home-labs__columns">
                    <ul class="aayntn-home-languages" aria-label="Reference languages">
                        <li
                            v-for="language in languages"
                            :key="language.id"
                            class="aayntn-home-language"
                        >
                            <a :href="language.href">
                                <span>{{ language.label }}</span>
                                <span class="aayntn-home-language__note">
                                    {{ language.submittable ? "USACO" : "Educational" }}
                                </span>
                            </a>
                        </li>
                    </ul>

                    <div class="aayntn-home-figures">
                        <div
                            v-for="figure in figures"
                            :key="figure.label"
                            class="aayntn-home-figure"
                        >
                            <span class="aayntn-home-figure__value">{{ figure.value }}</span>
                            <span class="aayntn-home-figure__label">{{ figure.label }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
