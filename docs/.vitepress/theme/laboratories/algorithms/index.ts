/**
 * Laboratory registry.
 *
 * Every interactive demonstration in the encyclopedia is a `LabDefinition`
 * registered here. The registry is imported statically so that a page which
 * uses `<AlgorithmPlayer />` only pulls in the algorithms it actually shows.
 */
import { binarySearch } from "./binary-search";
import { bfs } from "./bfs";
import { dfs } from "./dfs";
import { dijkstra } from "./dijkstra";
import type { LabDefinition } from "../core/types";

const registry: Record<string, LabDefinition> = {
    [binarySearch.id]: binarySearch,
    [bfs.id]: bfs,
    [dfs.id]: dfs,
    [dijkstra.id]: dijkstra,
};

export function definitionFor(id: string): LabDefinition | undefined {
    return registry[id];
}

export function allDefinitions(): LabDefinition[] {
    return Object.values(registry);
}

export { binarySearch, bfs, dfs, dijkstra };
