import type { Theme } from "vitepress";
import Layout from "./Layout.vue";
import CodeViewer from "./components/code/CodeViewer.vue";
import AlgorithmSummary from "./components/articles/AlgorithmSummary.vue";
import MathPanel from "./components/mathematics/MathPanel.vue";
import PrerequisiteGraph from "./components/PrerequisiteGraph.vue";
import PracticeCatalog from "./components/problems/PracticeCatalog.vue";
import ContestSimulation from "./components/practice/ContestSimulation.vue";
import ProgressDashboard from "./components/progress/ProgressDashboard.vue";
import LearnNext from "./components/progress/LearnNext.vue";
import Synonyms from "./components/Synonyms.vue";
import Figure from "./components/Figure.vue";
import Ornament from "./components/Ornament.vue";
import Banner from "./components/Banner.vue";
import AlgorithmPlayer from "./laboratories/core/AlgorithmPlayer.vue";
import { registerServiceWorker } from "./composables/useServiceWorker";

import "katex/dist/katex.min.css";
import "./styles/index.css";

/**
 * aayntn theme.
 *
 * A completely bespoke interface built on VitePress's data layer. Markdown
 * remains the canonical form of every lesson; the components below only
 * render things that are described in metadata.
 */
export default {
    Layout,
    enhanceApp({ app }) {
        app.component("CodeViewer", CodeViewer);
        app.component("AlgorithmSummary", AlgorithmSummary);
        app.component("MathPanel", MathPanel);
        app.component("PrerequisiteGraph", PrerequisiteGraph);
        app.component("PracticeCatalog", PracticeCatalog);
        app.component("ContestSimulation", ContestSimulation);
        app.component("ProgressDashboard", ProgressDashboard);
        app.component("LearnNext", LearnNext);
        app.component("Synonyms", Synonyms);
        app.component("Figure", Figure);
        app.component("Ornament", Ornament);
        app.component("Banner", Banner);
        app.component("AlgorithmPlayer", AlgorithmPlayer);
        registerServiceWorker();
    },
} satisfies Theme;
