/**
 * Scene registry.
 *
 * A scene is a pure renderer: state in, SVG out. Because they are pure they
 * can be exercised in Node by the test suite without a browser.
 */
import { renderArray, renderGraph, renderStructures, renderTable, sceneDefs } from "./scenes";
import type { LabScene, LabState, RenderOptions } from "./types";

const GRAPH_BOX = { width: 720, height: 460 };
const ARRAY_BOX = { width: 720, height: 240 };
const MATRIX_BOX = { width: 720, height: 420 };
const STRUCTURE_BOX = { width: 720, height: 340 };

function withDefs(body: string): string {
    return `<defs>${sceneDefs()}</defs>${body}`;
}

export const scenes: Record<string, LabScene> = {
    graph: {
        id: "graph",
        viewBox: () => `0 0 ${GRAPH_BOX.width} ${GRAPH_BOX.height}`,
        render: (state: LabState, options: RenderOptions) => withDefs(renderGraph(state, options)),
    },

    tree: {
        id: "tree",
        viewBox: () => `0 0 ${GRAPH_BOX.width} ${GRAPH_BOX.height}`,
        render: (state: LabState, options: RenderOptions) => withDefs(renderGraph(state, options)),
    },

    array: {
        id: "array",
        viewBox: () => `0 0 ${ARRAY_BOX.width} ${ARRAY_BOX.height}`,
        render: (state: LabState, options: RenderOptions) => withDefs(renderArray(state, options)),
    },

    "number-line": {
        id: "number-line",
        viewBox: () => `0 0 ${ARRAY_BOX.width} ${ARRAY_BOX.height}`,
        render: (state: LabState, options: RenderOptions) => withDefs(renderArray(state, options)),
    },

    matrix: {
        id: "matrix",
        viewBox: () => `0 0 ${MATRIX_BOX.width} ${MATRIX_BOX.height}`,
        render: (state: LabState) => withDefs(renderTable(state)),
    },

    structures: {
        id: "structures",
        viewBox: () => `0 0 ${STRUCTURE_BOX.width} ${STRUCTURE_BOX.height}`,
        render: (state: LabState) => withDefs(renderStructures(state)),
    },

    /**
     * A composite scene for algorithms that manipulate an array together with a
     * supporting structure: the knapsack table, a Fenwick tree, a union-find
     * parent array.
     */
    hybrid: {
        id: "hybrid",
        viewBox: () => `0 0 ${MATRIX_BOX.width} ${MATRIX_BOX.height}`,
        render: (state: LabState, options: RenderOptions) => {
            const parts: string[] = [];
            if (state.nodes.length) parts.push(renderGraph(state, options));
            if (state.cells.length) parts.push(renderArray(state, options));
            if (state.table) parts.push(renderTable(state));
            if (state.structures.length) parts.push(renderStructures(state));
            return withDefs(parts.join(""));
        },
    },
};

export function sceneFor(id: string): LabScene {
    return scenes[id] ?? scenes.graph!;
}
