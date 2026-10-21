<script setup lang="ts">
import { computed } from "vue";
import stats from "../data/generated/stats.json";
import algorithms from "../data/generated/algorithms.json";
import visualizations from "../data/generated/visualizations.json";
import type { AlgorithmEntry, VisualizationEntry } from "../data/types";

/**
 * The homepage.
 *
 * A strongly colour-blocked entrance that explains the product immediately and
 * then routes the reader into the four division tracks, the encyclopedia, the
 * laboratory and the practice catalogue. The information hierarchy is carried
 * by typography and grid; ornament refines it without changing it.
 */

const algorithmList = algorithms as AlgorithmEntry[];
const visualizationList = visualizations as VisualizationEntry[];

const divisions = [
    {
        id: "bronze",
        name: "Bronze",
        focus: "Foundations",
        copy: "Simulation, careful modeling, complete enumeration, and elementary reasoning. The discipline of reading a specification and modelling it exactly.",
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
        copy: "Graph and tree decompositions, advanced range structures, DP optimization, and the techniques that separate finalists from qualifiers.",
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

const subjects = [
    {
        href: "/algorithms/graphs/",
        kicker: "Graphs",
        title: "From BFS to maximum flow",
        copy: "Representations, traversal, shortest paths, connectivity, and the reductions between them.",
    },
    {
        href: "/algorithms/dynamic-programming/",
        kicker: "Dynamic programming",
        title: "State design and proof",
        copy: "Memoization, tabulation, knapsack families, DAG and tree DP, and the optimization techniques layered on top.",
    },
    {
        href: "/algorithms/range-queries/",
        kicker: "Range structures",
        title: "Fenwick, segment tree, sparse table",
        copy: "Which algebraic property a structure needs, and how to choose the one your problem actually requires.",
    },
    {
        href: "/algorithms/trees/",
        kicker: "Trees",
        title: "LCA, heavy-light, rerooting",
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
        title: "KMP, Z, suffix structures",
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
    <div class="aayntn-home-shell">
        <a class="skip-link" href="#main">Skip to content</a>

        <section class="aayntn-hero">
            <div>
                <p class="aayntn-hero__eyebrow">
                    <span class="aayntn-chip aayntn-chip--accent">Encyclopedia</span>
                    <span class="aayntn-chip aayntn-chip--muted">Six languages</span>
                    <span class="aayntn-chip aayntn-chip--muted">Static, account-free</span>
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

            <aside class="aayntn-hero__panel" aria-label="Example session">
                <div class="aayntn-hero__panel-title">A worked session</div>
                <pre
                    class="aayntn-hero__panel-body"
                ><code><span class="c">// problem: shortest path with nonnegative weights</span>
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
                    <h2 id="home-divisions" class="aayntn-section__title">The algorithm atlas</h2>
                    <a class="aayntn-section__more" href="/curriculum/">Full curriculum →</a>
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

        <section class="aayntn-home__band aayntn-band--ink" aria-labelledby="home-how">
            <div class="aayntn-home__band-inner">
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
                    <div class="aayntn-feature">
                        <div class="aayntn-feature__kicker">01 · Recognition</div>
                        <div class="aayntn-feature__title">What to notice</div>
                        <p class="aayntn-feature__copy">
                            Every article opens with the problem shape that calls for the technique
                            and the constraints that rule the alternatives in or out.
                        </p>
                    </div>
                    <div class="aayntn-feature">
                        <div class="aayntn-feature__kicker">02 · Derivation</div>
                        <div class="aayntn-feature__title">Why it is correct</div>
                        <p class="aayntn-feature__copy">
                            Formal models, lemmas, invariants and exchange arguments — not "it
                            obviously works".
                        </p>
                    </div>
                    <div class="aayntn-feature">
                        <div class="aayntn-feature__kicker">03 · Code</div>
                        <div class="aayntn-feature__title">Six real implementations</div>
                        <p class="aayntn-feature__copy">
                            Source files in the language they claim to be, with a per-language
                            recommendation and an honest note on recursion depth.
                        </p>
                    </div>
                    <div class="aayntn-feature">
                        <div class="aayntn-feature__kicker">04 · Motion</div>
                        <div class="aayntn-feature__title">Deterministic animation</div>
                        <p class="aayntn-feature__copy">
                            A reference implementation emits an event trace; the scene renders it.
                            Step backwards, scrub, and read the narration.
                        </p>
                    </div>
                    <div class="aayntn-feature">
                        <div class="aayntn-feature__kicker">05 · Failure</div>
                        <div class="aayntn-feature__title">Why this fails</div>
                        <p class="aayntn-feature__copy">
                            The smallest counterexample that breaks a plausible wrong approach,
                            explained rather than merely mentioned.
                        </p>
                    </div>
                    <div class="aayntn-feature">
                        <div class="aayntn-feature__kicker">06 · Transfer</div>
                        <div class="aayntn-feature__title">Where to practise</div>
                        <p class="aayntn-feature__copy">
                            Problems arranged as recognition, direct application, adaptation,
                            combination, challenge and transfer — not sorted by a guessed
                            difficulty.
                        </p>
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
                    <a class="aayntn-section__more" href="/algorithms/">All algorithms →</a>
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
                            {{ entry.variants.length }} implementations ·
                            {{ entry.complexity.space }} space
                        </div>
                    </a>
                </div>
            </div>
        </section>

        <section class="aayntn-section aayntn-band--ink" aria-labelledby="home-lab">
            <div class="aayntn-section__inner">
                <div class="aayntn-section__head">
                    <div>
                        <h2 id="home-lab" class="aayntn-section__title">The laboratory</h2>
                        <p class="aayntn-section__lede">
                            Interactive SVG demonstrations driven by a trusted TypeScript reference
                            implementation. The same event stream that drives the picture also
                            drives the narration, so the animation cannot drift away from the
                            mathematics.
                        </p>
                    </div>
                    <a class="aayntn-section__more" href="/laboratory/">All laboratories →</a>
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
                            Step, scrub, change the input, and read the state narration. Every scene
                            has a static fallback that works without JavaScript.
                        </p>
                    </a>
                </div>
            </div>
        </section>

        <section class="aayntn-section" aria-labelledby="home-subjects">
            <div class="aayntn-section__inner">
                <div class="aayntn-section__head">
                    <div>
                        <h2 id="home-subjects" class="aayntn-section__title">Browse by subject</h2>
                        <p class="aayntn-section__lede">
                            The encyclopedia is organised by conceptual subject rather than by
                            contest division, so related techniques stay together.
                        </p>
                    </div>
                    <a class="aayntn-section__more" href="/algorithms/">All subjects →</a>
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
                            the same fixtures. C, C++17, Java and Python are accepted by USACO;
                            Pascal and JavaScript are educational reference implementations.
                        </p>
                    </div>
                    <a class="aayntn-section__more" href="/languages/">Compare languages →</a>
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
