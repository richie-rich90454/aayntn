import type { Theme } from "vitepress";
import Layout from "./Layout.vue";
import Synonyms from "./components/Synonyms.vue";
import { registerServiceWorker } from "./composables/useServiceWorker";

import "katex/dist/katex.min.css";
import "./styles/index.css";

/**
 * aayntn theme.
 *
 * A completely bespoke interface built on VitePress's data layer. Markdown
 * remains the canonical form of every lesson.
 *
 * Components are imported by the page that uses them, not registered here.
 * A global registration puts every component and every data file it imports
 * into the entry bundle, including the four hundred kilobytes of problem
 * records and the algorithm catalogue. The pages that need a component import
 * it directly, so the bundler ships that component and its data with that
 * page and nothing else.
 */
export default {
    Layout,
    enhanceApp({ app }) {
        /*
         * Synonyms is a three-line hidden label used by most articles. It has
         * no data and no dependencies, so registering it once is cheaper than
         * repeating the import in eighty pages.
         */
        app.component("Synonyms", Synonyms);
        registerServiceWorker();
    },
} satisfies Theme;
