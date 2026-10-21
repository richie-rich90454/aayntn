/**
 * Laboratory registry.
 *
 * Every interactive demonstration in the encyclopedia is a `LabDefinition`
 * registered here. The registry is imported statically so that a page which
 * uses `<AlgorithmPlayer />` only pulls in the algorithms it actually shows.
 */
import { binarySearch } from "./binary-search";
import { bfs } from "./bfs";
import { cht } from "./cht";
import { dfs } from "./dfs";
import { dijkstra } from "./dijkstra";
import { dsu } from "./dsu";
import { fenwick } from "./fenwick";
import { hld } from "./hld";
import { knapsack } from "./knapsack";
import { lca } from "./lca";
import { prefixSums } from "./prefix-sums";
import { segmentTree } from "./segment-tree";
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
