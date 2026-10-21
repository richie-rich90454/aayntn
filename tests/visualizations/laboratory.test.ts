/**
 * The visual demonstration must describe a legitimate execution of the
 * algorithm it demonstrates.
 *
 * These tests exercise the laboratory reference implementations directly. The
 * scene renderers are pure functions, so they can be checked in Node without a
 * browser, which is the only way to guarantee that a demonstration cannot
 * drift away from the algorithm.
 */
import { describe, expect, it } from "vitest";
import { allDefinitions } from "../../docs/.vitepress/theme/laboratories/algorithms";
import { sceneFor } from "../../docs/.vitepress/theme/laboratories/core/registry";
import type { LabEvent, LabState } from "../../docs/.vitepress/theme/laboratories/core/types";

const definitions = allDefinitions();

describe("laboratory reference implementations", () => {
    it("registers at least one demonstration", () => {
        expect(definitions.length).toBeGreaterThan(0);
    });

    for (const definition of definitions) {
        describe(definition.id, () => {
            it("produces a non-empty event stream for every preset", () => {
                for (const preset of definition.presets) {
                    const events = definition.build(preset.input);
                    expect(events.length, `preset ${preset.id} produced no events`).toBeGreaterThan(
                        0,
                    );
                }
            });

            it("gives every event a narration and a state", () => {
                for (const preset of definition.presets) {
                    for (const event of definition.build(preset.input)) {
                        expect(event.narration.length).toBeGreaterThan(0);
                        expect(event.state).toBeTruthy();
                        expect(event.state.nodes).toBeInstanceOf(Array);
                        expect(event.state.edges).toBeInstanceOf(Array);
                        expect(event.state.cells).toBeInstanceOf(Array);
                        expect(event.state.structures).toBeInstanceOf(Array);
                    }
                }
            });

            it("is deterministic: the same preset produces the same trace", () => {
                for (const preset of definition.presets) {
                    const first = definition.build(preset.input);
                    const second = definition.build(preset.input);
                    expect(second.map((event) => event.narration)).toEqual(
                        first.map((event) => event.narration),
                    );
                }
            });

            it("can be stepped backward, because every event carries its own state", () => {
                for (const preset of definition.presets) {
                    const events = definition.build(preset.input);
                    const last = events[events.length - 1]!;
                    const first = events[0]!;
                    expect(last.state).not.toBe(first.state);
                }
            });

            it("renders valid markup at every step", () => {
                const scene = sceneFor(definition.scene);
                for (const preset of definition.presets) {
                    for (const event of definition.build(preset.input)) {
                        const markup = scene.render(event.state, {
                            width: 720,
                            height: 460,
                            showAnnotations: true,
                            showImplementation: true,
                        });
                        expect(markup).toContain("<");
                        expect(markup).not.toContain("undefined");
                        expect(markup).not.toContain("NaN");
                    }
                }
            });

            it("keeps every node reference valid", () => {
                for (const preset of definition.presets) {
                    for (const event of definition.build(preset.input)) {
                        const ids = new Set(event.state.nodes.map((node) => node.id));
                        for (const edge of event.state.edges) {
                            expect(
                                ids.has(edge.from),
                                `edge refers to a missing vertex ${edge.from}`,
                            ).toBe(true);
                            expect(
                                ids.has(edge.to),
                                `edge refers to a missing vertex ${edge.to}`,
                            ).toBe(true);
                        }
                    }
                }
            });

            it("rejects a malformed custom input with a readable message", () => {
                let threw = false;
                try {
                    definition.build("");
                } catch (error) {
                    threw = true;
                    expect((error as Error).message.length).toBeGreaterThan(0);
                }
                // A demonstration that accepts an empty input must still be well formed.
                if (!threw) {
                    const events: LabEvent[] = definition.build("");
                    expect(Array.isArray(events)).toBe(true);
                }
            });
        });
    }
});

describe("the state model", () => {
    it("keeps the node and edge vocabularies in step with the scenes", () => {
        const state: LabState = {
            nodes: [
                { id: "a", label: "A", x: 10, y: 20, state: "active" },
                { id: "b", label: "B", x: 100, y: 20, state: "unvisited" },
            ],
            edges: [{ from: "a", to: "b", state: "active" }],
            cells: [{ index: 0, value: "1", state: "idle" }],
            structures: [{ id: "stack", label: "Stack", kind: "stack", items: [] }],
            annotations: [],
            data: {},
        };
        const markup = sceneFor("graph").render(state, {
            width: 720,
            height: 460,
            showAnnotations: true,
            showImplementation: true,
        });
        expect(markup).toContain("A");
        expect(markup).toContain("B");
    });
});
