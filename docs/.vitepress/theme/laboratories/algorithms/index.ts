/**
 * The laboratory registry.
 *
 * Every interactive demonstration in the encyclopedia is a `LabDefinition`.
 * The registry imports them statically so that the test suite can exercise
 * all of them in one process; the theme uses the lazy registry instead, so
 * that a reader only downloads the demonstration a page actually shows.
 */
import { definition as binarySearch } from "./binary-search";
import { definition as bfs } from "./bfs";
import { definition as cht } from "./cht";
import { definition as dfs } from "./dfs";
import { definition as dijkstra } from "./dijkstra";
import { definition as dsu } from "./dsu";
import { definition as fenwick } from "./fenwick";
import { definition as hld } from "./hld";
import { definition as knapsack } from "./knapsack";
import { definition as lca } from "./lca";
import { definition as prefixSums } from "./prefix-sums";
import { definition as segmentTree } from "./segment-tree";
import type { LabDefinition } from "../core/types";

const registry: Record<string, LabDefinition> = {
    [binarySearch.id]: binarySearch,
    [bfs.id]: bfs,
    [cht.id]: cht,
    [dfs.id]: dfs,
    [dijkstra.id]: dijkstra,
    [dsu.id]: dsu,
    [fenwick.id]: fenwick,
    [hld.id]: hld,
    [knapsack.id]: knapsack,
    [lca.id]: lca,
    [prefixSums.id]: prefixSums,
    [segmentTree.id]: segmentTree,
};

export function definitionFor(id: string): LabDefinition | undefined {
    return registry[id];
}

export function allDefinitions(): LabDefinition[] {
    return Object.values(registry);
}

export {
    binarySearch,
    bfs,
    cht,
    dfs,
    dijkstra,
    dsu,
    fenwick,
    hld,
    knapsack,
    lca,
    prefixSums,
    segmentTree,
};
