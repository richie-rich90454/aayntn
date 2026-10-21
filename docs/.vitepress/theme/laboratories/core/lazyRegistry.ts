/**
 * The lazy laboratory registry.
 *
 * The theme must not ship every demonstration in its initial bundle: a reader
 * who only wants to read an article should not download the twelve algorithms
 * that animate them. Each demonstration is therefore a separate chunk that is
 * fetched the first time a page asks for it.
 *
 * The mapping is written out rather than globbed, because a glob would pull
 * every module into the bundle, and because an explicit list is what makes
 * the split visible in the build output.
 */
import type { LabDefinition } from "./types";

const loaders: Record<string, () => Promise<{ definition: LabDefinition }>> = {
    "searching.binary-search": () => import("../algorithms/binary-search"),
    "arrays.prefix-sums": () => import("../algorithms/prefix-sums"),
    "graphs.dfs": () => import("../algorithms/dfs"),
    "graphs.bfs": () => import("../algorithms/bfs"),
    "graphs.dijkstra": () => import("../algorithms/dijkstra"),
    "graphs.dsu": () => import("../algorithms/dsu"),
    "range-queries.fenwick-tree": () => import("../algorithms/fenwick"),
    "range-queries.segment-tree": () => import("../algorithms/segment-tree"),
    "trees.lca": () => import("../algorithms/lca"),
    "trees.heavy-light-decomposition": () => import("../algorithms/hld"),
    "dynamic-programming.0-1-knapsack": () => import("../algorithms/knapsack"),
    "dynamic-programming.convex-hull-trick": () => import("../algorithms/cht"),
};

export async function loadDefinition(id: string): Promise<LabDefinition | undefined> {
    const loader = loaders[id];
    if (!loader) return undefined;
    const module = await loader();
    return module.definition;
}

/** The identifiers of the registered demonstrations, for the index page. */
export const registeredIds = Object.keys(loaders);
