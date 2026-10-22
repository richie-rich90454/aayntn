<script setup lang="ts">
import { computed } from "vue";
import stats from "../data/generated/stats.json";
import algorithms from "../data/generated/algorithms.json";
import visualizations from "../data/generated/visualizations.json";
import type { AlgorithmEntry, VisualizationEntry } from "./data/types";

/**
 * The homepage.
 *
 * A strongly color-blocked entrance that explains the product immediately and
 * then routes the reader into the four division tracks, the encyclopedia, the
 * laboratory and the practice catalog. The information hierarchy is carried by
 * typography and by the grid; the ornament refines it without changing it.
 */

const algorithmList = algorithms as AlgorithmEntry[];
const visualizationList = visualizations as VisualizationEntry[];

const divisions = [
    {
        id: "bronze",
        name: "Bronze",
        focus: "Foundations",
        copy: "Simulation, careful modeling, complete enumeration, and elementary reasoning. The discipline of reading a specification and modeling it exactly.",
        href: "/curriculum/bronze/",
    },
    {
        id: "silver",
        name: "Silver",
        focus: "Core techniques",
        copy: "Efficient searching, arrays, sorting, greedy patterns, and the first graph algorithms. Where brute force stops being good enough.",
        href: "/curriculum/silver/",
    },
    {
        id: "gold",
        name: "Gold",
        focus: "Optimization",
        copy: "Dynamic programming, shortest paths, tree algorithms, combinatorics, and the data structures that make the right solution expressible.",
        href: "/curriculum/gold/",
    },
    {
        id: "platinum",
        name: "Platinum",
        focus: "Advanced methods",
        copy: "Graph and tree decompositions, advanced range structures, dynamic-programming optimization, and the techniques that separate finalists from qualifiers.",
        href: "/curriculum/platinum/",
    },
];

const featured = computed(() => {
    const ids = [
        "searching.binary-search",
        "graphs.dfs",
        "graphs.dijkstra",
        "range-queries.segment-tree",
        "dynamic-programming.0-1-knapsack",
        "trees.lca",
    ];
    return ids
        .map((id) => algorithmList.find((entry) => entry.id === id))
        .filter((entry): entry is AlgorithmEntry => Boolean(entry));
});

const featuredLabs = computed(() => visualizationList.slice(0, 6));

const method = [
    {
        numeral: "01",
        kicker: "Recognition",
        title: "What to notice",
        copy: "Every article opens with the problem shape that calls for the technique and the constraints that rule the alternatives in or out.",
    },
    {
        numeral: "02",
        kicker: "Derivation",
        title: "Why it is correct",
        copy: "Formal models, lemmas, invariants and exchange arguments, never the claim that something obviously works.",
    },
    {
        numeral: "03",
        kicker: "Code",
        title: "Six real implementations",
        copy: "Source files in the language they claim to be, each with a per-language recommendation and an honest note on recursion depth.",
    },
    {
        numeral: "04",
        kicker: "Motion",
        title: "Deterministic animation",
        copy: "A reference implementation emits an event trace and a scene renders it, so the picture cannot drift away from the mathematics.",
    },
    {
        numeral: "05",
        kicker: "Failure",
        title: "Why this fails",
        copy: "The smallest counterexample that breaks a plausible wrong approach, explained rather than merely mentioned.",
    },
    {
        numeral: "06",
        kicker: "Transfer",
        title: "Where to practice",
        copy: "Problems arranged as recognition, application, adaptation, combination, challenge and transfer, not sorted by a guessed difficulty.",
    },
];

const subjects = [
    {
        href: "/algorithms/graphs/",
        kicker: "Graphs",
        title: "From breadth-first search to minimum cut",
        copy: "Representations, traversal, shortest paths, connectivity, and the reductions between them.",
    },
    {
        href: "/algorithms/dynamic-programming/",
        kicker: "Dynamic programming",
        title: "State design and proof",
        copy: "Memoization, tabulation, knapsack families, directed acyclic graph and tree dynamic programming, and the optimization layered on top.",
    },
    {
        href: "/algorithms/range-queries/",
        kicker: "Range structures",
        title: "Fenwick, segment tree, sparse table",
        copy: "Which algebraic property a structure needs, and how to choose the one the problem actually requires.",
    },
    {
        href: "/algorithms/trees/",
        kicker: "Trees",
        title: "Lowest common ancestor, heavy paths, rerooting",
        copy: "Rooting, binary lifting, path queries, and the decompositions that turn a tree into an array.",
    },
    {
        href: "/algorithms/number-theory/",
        kicker: "Number theory",
        title: "Modular arithmetic and counting",
        copy: "Primes, inverses, exponentiation, combinatorics, and the counting arguments behind them.",
    },
    {
        href: "/algorithms/strings/",
        kicker: "Strings",
        title: "KMP, the Z function, suffix structures",
        copy: "Pattern matching, rolling hashes, tries, and suffix arrays for long strings.",
    },
];

const languages = [
    { id: "C", submittable: true, href: "/languages/c/" },
    { id: "C++17", submittable: true, href: "/languages/cpp17/" },
    { id: "Java", submittable: true, href: "/languages/java/" },
    { id: "Python", submittable: true, href: "/languages/python/" },
    { id: "Pascal", submittable: false, href: "/languages/pascal/" },
    { id: "JavaScript", submittable: false, href: "/languages/javascript/" },
];
</script>

<template>
    <div class="aayntn-home">
        <a class="skip-link" href="#main">Skip to content</a>

        <section class="aayntn-hero">
            <div>
                <p class="aayntn-hero__eyebrow">
                    <span class="aayntn-chip">Encyclopedia</span>
                    <span class="aayntn-chip">Six languages</span>
                    <span class="aayntn-chip">No account, no backend</span>
                </p>
                <h1 class="aayntn-hero__title">
                    All algorithms
                    <em>you need to know.</em>
                </h1>
                <p class="aayntn-hero__lede">
                    From AP Computer Science A to USACO Platinum. Mathematical derivations, real
                    implementations in C, C++17, Java, Python, Pascal and JavaScript, and
                    deterministic animated explanations of every algorithm that matters.
                </p>
                <div class="aayntn-hero__actions">
                    <a class="aayntn-button" href="/start/from-ap-csa/">Start from AP CSA</a>
                    <a class="aayntn-button aayntn-button--ghost" href="/algorithms/">
                        Browse the encyclopedia
                    </a>
                    <a class="aayntn-button aayntn-button--ghost" href="/laboratory/">
                        Open the laboratory
                    </a>
                </div>
            </div>

            <aside class="aayntn-hero__panel" aria-label="A worked session">
                <div class="aayntn-hero__panel-title">A worked session</div>
                <pre
                    class="aayntn-hero__panel-body"
                ><code><span class="c">// shortest paths, all weights nonnegative</span>
<span class="k">while</span> (!pq.empty()) {
  <span class="k">auto</span> [d, u] = pq.top(); pq.pop();
  <span class="k">if</span> (d != dist[u]) <span class="k">continue</span>;  <span class="c">// stale</span>
  <span class="k">for</span> (<span class="k">auto</span> [v, w] : adj[u])
    <span class="k">if</span> (dist[u] + w &lt; dist[v]) {
      dist[v] = dist[u] + w;
      pq.push({dist[v], v});
    }
}</code></pre>
            </aside>
        </section>

        <section class="aayntn-home__band" aria-labelledby="home-divisions">
            <div class="aayntn-home__band-inner">
                <div class="aayntn-section__head">
                    <div>
                        <h2 id="home-divisions" class="aayntn-section__title">
                            The algorithm atlas
                        </h2>
                        <p class="aayntn-section__lede">
                            Four guided tracks through the same encyclopedia, organized by the idea
                            behind a technique rather than by the contest it appeared in.
                        </p>
                    </div>
                    <a class="aayntn-section__more" href="/curriculum/">The full curriculum</a>
                </div>
            </div>
            <div class="aayntn-divisions">
                <a
                    v-for="division in divisions"
                    :key="division.id"
                    class="aayntn-division"
                    :class="`aayntn-division--${division.id}`"
                    :href="division.href"
                >
                    <div class="aayntn-division__name">{{ division.name }}</div>
                    <div class="aayntn-division__focus">{{ division.focus }}</div>
                    <p class="aayntn-division__copy">{{ division.copy }}</p>
                </a>
            </div>
        </section>

        <section class="aayntn-section aayntn-band--ink" aria-labelledby="home-how">
            <div class="aayntn-section__inner">
                <div class="aayntn-section__head">
                    <div>
                        <h2 id="home-how" class="aayntn-section__title">
                            How this encyclopedia works
                        </h2>
                        <p class="aayntn-section__lede">
                            Every topic follows one structure, so that knowing one algorithm tells
                            you how to read the next one. Nothing is a link dump; every page carries
                            a derivation, a proof, a worked example and code that was actually
                            compiled and run.
                        </p>
                    </div>
                </div>

                <div class="aayntn-feature-grid">
                    <div v-for="step in method" :key="step.numeral" class="aayntn-feature">
                        <span class="aayntn-numeral">{{ step.numeral }}</span>
                        <div class="aayntn-feature__kicker">{{ step.kicker }}</div>
                        <div class="aayntn-feature__title">{{ step.title }}</div>
                        <p class="aayntn-feature__copy">{{ step.copy }}</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="aayntn-section" aria-labelledby="home-featured">
            <div class="aayntn-section__inner">
                <div class="aayntn-section__head">
                    <div>
                        <h2 id="home-featured" class="aayntn-section__title">
                            Featured algorithms
                        </h2>
                        <p class="aayntn-section__lede">
                            A cross-section of the encyclopedia: an array search, two graph
                            traversals, a weighted shortest path, a range structure, a knapsack and
                            a tree query.
                        </p>
                    </div>
                    <a class="aayntn-section__more" href="/algorithms/">All algorithms</a>
                </div>

                <div class="aayntn-feature-grid">
                    <a
                        v-for="entry in featured"
                        :key="entry.id"
                        class="aayntn-feature"
                        :href="entry.href ?? `/algorithms/${entry.id.replace(/\./g, '/')}`"
                    >
                        <div class="aayntn-feature__kicker">{{ entry.complexity.time }}</div>
                        <div class="aayntn-feature__title">{{ entry.title }}</div>
                        <p class="aayntn-feature__copy">{{ entry.summary }}</p>
                        <div class="aayntn-feature__meta">
                            {{ entry.variants.length }} implementations,
                            {{ entry.complexity.space }} of space
                        </div>
                    </a>
                </div>
            </div>
        </section>

        <section class="aayntn-section" aria-labelledby="home-lab">
            <div class="aayntn-section__inner">
                <div class="aayntn-section__head">
                    <div>
                        <h2 id="home-lab" class="aayntn-section__title">The laboratory</h2>
                        <p class="aayntn-section__lede">
                            Interactive demonstrations driven by a trusted reference implementation.
                            The same event stream that draws the picture also drives the narration,
                            so the animation cannot drift away from the mathematics.
                        </p>
                    </div>
                    <a class="aayntn-section__more" href="/laboratory/">All laboratories</a>
                </div>

                <div class="aayntn-feature-grid">
                    <a
                        v-for="lab in featuredLabs"
                        :key="lab.id"
                        class="aayntn-feature"
                        :href="lab.href"
                    >
                        <div class="aayntn-feature__kicker">{{ lab.scene }}</div>
                        <div class="aayntn-feature__title">{{ lab.title }}</div>
                        <p class="aayntn-feature__copy">
                            Step, scrub, change the input, and read the state narration. Every
                            laboratory has a static fallback that works without JavaScript.
                        </p>
                    </a>
                </div>
            </div>
        </section>

        <section class="aayntn-section aayntn-band--ink" aria-labelledby="home-subjects">
            <div class="aayntn-section__inner">
                <div class="aayntn-section__head">
                    <div>
                        <h2 id="home-subjects" class="aayntn-section__title">Browse by subject</h2>
                        <p class="aayntn-section__lede">
                            The encyclopedia is organized by conceptual subject, so that related
                            techniques stay together and a reader can find the family a technique
                            belongs to.
                        </p>
                    </div>
                    <a class="aayntn-section__more" href="/algorithms/">All subjects</a>
                </div>

                <div class="aayntn-feature-grid">
                    <a
                        v-for="subject in subjects"
                        :key="subject.href"
                        class="aayntn-feature"
                        :href="subject.href"
                    >
                        <div class="aayntn-feature__kicker">{{ subject.kicker }}</div>
                        <div class="aayntn-feature__title">{{ subject.title }}</div>
                        <p class="aayntn-feature__copy">{{ subject.copy }}</p>
                    </a>
                </div>
            </div>
        </section>

        <section class="aayntn-section" aria-labelledby="home-languages">
            <div class="aayntn-section__inner">
                <div class="aayntn-section__head">
                    <div>
                        <h2 id="home-languages" class="aayntn-section__title">
                            Six languages, one contract
                        </h2>
                        <p class="aayntn-section__lede">
                            Every algorithm is implemented in all six languages and tested against
                            the same fixtures. C, C++17, Java and Python are accepted by USACO.
                            Pascal and JavaScript are educational reference implementations.
                        </p>
                    </div>
                    <a class="aayntn-section__more" href="/languages/">Compare the languages</a>
                </div>

                <div class="aayntn-stats">
                    <div v-for="language in languages" :key="language.id" class="aayntn-stat">
                        <div class="aayntn-stat__value" style="font-size: 1.375rem">
                            <a :href="language.href" style="color: inherit">{{ language.id }}</a>
                        </div>
                        <div class="aayntn-stat__label">
                            {{ language.submittable ? "USACO submittable" : "Educational only" }}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="aayntn-section aayntn-band--ink" aria-labelledby="home-stats">
            <div class="aayntn-section__inner">
                <div class="aayntn-section__head">
                    <h2 id="home-stats" class="aayntn-section__title">What is published</h2>
                </div>
                <div class="aayntn-stats">
                    <div class="aayntn-stat">
                        <div class="aayntn-stat__value">{{ stats.lessons }}</div>
                        <div class="aayntn-stat__label">Lessons</div>
                    </div>
                    <div class="aayntn-stat">
                        <div class="aayntn-stat__value">{{ stats.algorithms }}</div>
                        <div class="aayntn-stat__label">Algorithms</div>
                    </div>
                    <div class="aayntn-stat">
                        <div class="aayntn-stat__value">{{ stats.variants }}</div>
                        <div class="aayntn-stat__label">Tested implementations</div>
                    </div>
                    <div class="aayntn-stat">
                        <div class="aayntn-stat__value">{{ stats.problems }}</div>
                        <div class="aayntn-stat__label">Curated problems</div>
                    </div>
                    <div class="aayntn-stat">
                        <div class="aayntn-stat__value">{{ stats.visualizations }}</div>
                        <div class="aayntn-stat__label">Animated laboratories</div>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>
