<script setup lang="ts">
import { computed } from "vue";
import graph from "../../data/generated/prerequisites.json";
import lessons from "../../data/generated/lessons.json";
import type { LessonEntry, PrerequisiteGraph } from "../../data/types";

/**
 * Prerequisite graph.
 *
 * Shows the conceptual dependencies of a topic: which lessons must be
 * understood first (hard edges) and which ones help but are not required
 * (soft edges). The layout is a deterministic layered graph computed in the
 * browser from the build-time DAG, so the picture always matches the data.
 */

const props = withDefaults(
    defineProps<{
        /** Focus on one lesson and its immediate dependencies. */
        focus?: string;
        /** Maximum number of nodes to draw. */
        limit?: number;
    }>(),
    { focus: undefined, limit: 40 },
);

const prereq = graph as PrerequisiteGraph;
const lessonList = lessons as LessonEntry[];

const lessonById = computed(() => new Map(lessonList.map((lesson) => [lesson.id, lesson])));

interface Node {
    id: string;
    title: string;
    x: number;
    y: number;
    depth: number;
    focused: boolean;
}

interface Edge {
    from: string;
    to: string;
    kind: "required" | "recommended";
    path: string;
}

const layout = computed(() => {
    const relevant = new Set<string>();

    if (props.focus) {
        relevant.add(props.focus);
        for (const edge of prereq.edges) {
            if (edge.to === props.focus) relevant.add(edge.from);
            if (edge.from === props.focus) relevant.add(edge.to);
        }
    } else {
        const reachable = new Set<string>();
        const stack = prereq.nodes.map((node) => node.id);
        while (stack.length) {
            const current = stack.pop()!;
            if (reachable.has(current)) continue;
            reachable.add(current);
            for (const edge of prereq.edges) {
                if (edge.to === current) stack.push(edge.from);
            }
        }
        for (const id of reachable) relevant.add(id);
    }

    const ids = [...relevant].slice(0, props.limit);
    const idSet = new Set(ids);

    // Depth is the longest path from a source node along required edges.
    const depth = new Map<string, number>();
    for (const id of prereq.order) {
        if (!idSet.has(id)) continue;
        let value = 0;
        for (const edge of prereq.edges) {
            if (edge.kind !== "required" || edge.to !== id) continue;
            value = Math.max(value, (depth.get(edge.from) ?? 0) + 1);
        }
        depth.set(id, value);
    }

    const byDepth = new Map<number, string[]>();
    for (const id of ids) {
        const level = depth.get(id) ?? 0;
        byDepth.set(level, [...(byDepth.get(level) ?? []), id]);
    }

    const columns = [...byDepth.keys()].sort((a, b) => a - b);
    const columnWidth = 260;
    const rowHeight = 76;
    const nodes: Node[] = [];
    let maxRows = 1;

    for (const level of columns) {
        const column = byDepth.get(level)!.sort();
        maxRows = Math.max(maxRows, column.length);
        column.forEach((id, index) => {
            nodes.push({
                id,
                title: lessonById.value.get(id)?.title ?? id,
                x: level * columnWidth + 20,
                y: index * rowHeight + 20,
                depth: level,
                focused: id === props.focus,
            });
        });
    }

    const positions = new Map(nodes.map((node) => [node.id, node]));
    const edges: Edge[] = [];
    for (const edge of prereq.edges) {
        if (!idSet.has(edge.from) || !idSet.has(edge.to)) continue;
        const from = positions.get(edge.from)!;
        const to = positions.get(edge.to)!;
        const x1 = from.x + 210;
        const y1 = from.y + 18;
        const x2 = to.x;
        const y2 = to.y + 18;
        const mid = (x1 + x2) / 2;
        edges.push({
            from: edge.from,
            to: edge.to,
            kind: edge.kind,
            path: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`,
        });
    }

    return {
        nodes,
        edges,
        width: (columns.length || 1) * columnWidth,
        height: maxRows * rowHeight + 40,
    };
});
</script>

<template>
    <figure class="aayntn-prereq">
        <div class="aayntn-prereq__head">Prerequisite map</div>
        <div class="aayntn-prereq__body">
            <svg
                :viewBox="`0 0 ${layout.width} ${layout.height}`"
                :width="layout.width"
                :height="layout.height"
                role="img"
                aria-label="Directed graph of prerequisite relationships between lessons"
            >
                <defs>
                    <marker
                        id="aayntn-arrow-required"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path
                            class="aayntn-prereq__arrow aayntn-prereq__arrow--required"
                            d="M 0 0 L 10 5 L 0 10 z"
                        />
                    </marker>
                    <marker
                        id="aayntn-arrow-recommended"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="6"
                        markerHeight="6"
                        orient="auto-start-reverse"
                    >
                        <path
                            class="aayntn-prereq__arrow aayntn-prereq__arrow--recommended"
                            d="M 0 0 L 10 5 L 0 10 z"
                        />
                    </marker>
                </defs>

                <g fill="none">
                    <path
                        v-for="(edge, index) in layout.edges"
                        :key="`${edge.from}-${edge.to}-${index}`"
                        :d="edge.path"
                        :class="[
                            'aayntn-prereq__edge',
                            edge.kind === 'required'
                                ? 'aayntn-prereq__edge--required'
                                : 'aayntn-prereq__edge--recommended',
                        ]"
                        :stroke-width="edge.kind === 'required' ? 1.8 : 1.2"
                        :stroke-dasharray="edge.kind === 'recommended' ? '4 3' : undefined"
                        :marker-end="
                            edge.kind === 'required'
                                ? 'url(#aayntn-arrow-required)'
                                : 'url(#aayntn-arrow-recommended)'
                        "
                    />
                </g>

                <g v-for="node in layout.nodes" :key="node.id">
                    <rect
                        :x="node.x"
                        :y="node.y"
                        width="210"
                        height="36"
                        :class="[
                            'aayntn-prereq__node',
                            node.focused
                                ? 'aayntn-prereq__node--focused'
                                : 'aayntn-prereq__node--plain',
                        ]"
                        stroke-width="1.2"
                    />
                    <text
                        :x="node.x + 10"
                        :y="node.y + 23"
                        :class="[
                            'aayntn-prereq__text',
                            node.focused
                                ? 'aayntn-prereq__text--focused'
                                : 'aayntn-prereq__text--plain',
                        ]"
                        font-family="Noto Sans, sans-serif"
                        font-size="12"
                    >
                        {{ node.title.length > 30 ? node.title.slice(0, 29) + "…" : node.title }}
                    </text>
                </g>
            </svg>
        </div>
        <figcaption class="aayntn-prereq__legend">
            <span class="aayntn-prereq__legend-item">
                <span class="aayntn-prereq__swatch aayntn-prereq__swatch--required" />
                Required
            </span>
            <span class="aayntn-prereq__legend-item">
                <span class="aayntn-prereq__swatch aayntn-prereq__swatch--recommended" />
                Recommended
            </span>
        </figcaption>
    </figure>
</template>
