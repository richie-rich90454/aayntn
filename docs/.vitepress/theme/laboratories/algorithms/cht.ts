/**
 * The convex hull trick.
 *
 * The reference implementation is the one in the article: a stack of lines
 * with increasing slopes, an `add` that removes the lines which can never
 * hold the minimum, and a `query` that walks down the stack as the point
 * moves to the right. The picture shows the stack of lines and the point
 * that the current query asks about.
 */
import type { LabDefinition, LabEvent, LabState } from "../core/types";

interface Line {
    slope: number;
    intercept: number;
}

interface Operation {
    kind: "add" | "query";
    slope?: number;
    intercept?: number;
    point?: number;
}

interface Parsed {
    operations: Operation[];
}

function parse(input: string): Parsed {
    const lines = input
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (lines.length === 0)
        throw new Error('Provide one line per operation: "add slope intercept" or "query point".');

    const operations: Operation[] = [];
    for (const line of lines) {
        const parts = line.split(/[\s,]+/).filter(Boolean);
        if (parts[0] === "add") {
            if (parts.length !== 3)
                throw new Error(`"add" needs a slope and an intercept, found "${line}".`);
            const slope = Number(parts[1]);
            const intercept = Number(parts[2]);
            if (!Number.isInteger(slope) || !Number.isInteger(intercept))
                throw new Error("A slope and an intercept must be integers.");
            operations.push({ kind: "add", slope, intercept });
        } else if (parts[0] === "query") {
            if (parts.length !== 2) throw new Error(`"query" needs one point, found "${line}".`);
            const point = Number(parts[1]);
            if (!Number.isInteger(point))
                throw new Error("The point of a query must be an integer.");
            operations.push({ kind: "query", point });
        } else if (parts.length === 2) {
            const slope = Number(parts[0]);
            const intercept = Number(parts[1]);
            if (!Number.isInteger(slope) || !Number.isInteger(intercept))
                throw new Error("A slope and an intercept must be integers.");
            operations.push({ kind: "add", slope, intercept });
        } else {
            throw new Error(
                `Unknown operation "${parts[0] ?? ""}": use "add slope intercept" or "query point".`,
            );
        }
    }
    return { operations };
}

/** The equation of a line, written the way a reader would say it. */
function equation(line: Line): string {
    const slope = line.slope === 1 ? "x" : line.slope === -1 ? "-x" : `${line.slope}x`;
    if (line.intercept === 0) return `y = ${slope}`;
    const sign = line.intercept < 0 ? "-" : "+";
    return `y = ${slope} ${sign} ${Math.abs(line.intercept)}`;
}

/**
 * True when the middle line of the three never holds the minimum, which is
 * the test the reference implementation makes.
 */
function redundant(first: Line, second: Line, third: Line): boolean {
    return (
        (first.intercept - second.intercept) / (second.slope - first.slope) <=
        (second.intercept - third.intercept) / (third.slope - second.slope)
    );
}

function build(input: string): LabEvent[] {
    const { operations } = parse(input);
    const events: LabEvent[] = [];

    const hull: Line[] = [];
    let point: number | null = null;
    let answer = 0;

    const snapshot = (note: string, formula?: string): LabState => ({
        nodes:
            point === null
                ? []
                : [
                      {
                          id: "query",
                          label: String(point),
                          x: 360,
                          y: 190,
                          state: "active",
                          value: `y = ${answer}`,
                          marker: "query point",
                      },
                  ],
        edges: [],
        cells: [],
        structures: hull.map((line, index) => ({
            id: `line-${index}`,
            label: `L${index + 1}: ${equation(line)}`,
            kind: "list" as const,
            orientation: "horizontal" as const,
            items: [
                {
                    value: `m=${line.slope} b=${line.intercept}`,
                    state: "highlight" as const,
                    sublabel:
                        point === null
                            ? "not queried yet"
                            : `y(${point}) = ${line.slope * point + line.intercept}`,
                },
            ],
        })),
        annotations: [{ x: 30, y: 130, text: note, emphasis: "accent" }],
        data: { hull: hull.map((line) => ({ ...line })), point },
        formula,
    });

    events.push({
        type: "init",
        operation: "init",
        narration: "The hull is empty, so it holds no lines and every query answers zero.",
        state: snapshot("The hull is empty.", "hull = 0 lines"),
    });

    for (const operation of operations) {
        if (operation.kind === "add") {
            const line: Line = { slope: operation.slope!, intercept: operation.intercept! };

            let dropped = false;
            while (hull.length > 0 && hull[hull.length - 1]!.slope === line.slope) {
                const top = hull[hull.length - 1]!;
                if (top.intercept <= line.intercept) {
                    events.push({
                        type: "prune",
                        operation: "prune-redundant",
                        narration: `The line ${equation(line)} has the same slope as the line on top and a larger intercept, so it is never the smallest and is dropped.`,
                        state: snapshot(
                            `${equation(line)} is dropped.`,
                            "the new line is redundant",
                        ),
                    });
                    dropped = true;
                    break;
                }
                hull.pop();
                events.push({
                    type: "prune",
                    operation: "prune-redundant",
                    narration: `The line ${equation(line)} has the same slope as the line on top and a smaller intercept, so the line on top is removed.`,
                    state: snapshot(`The line on top is removed.`, `hull = ${hull.length} lines`),
                });
            }
            if (dropped) continue;

            while (
                hull.length >= 2 &&
                redundant(hull[hull.length - 2]!, hull[hull.length - 1]!, line)
            ) {
                const removed = hull[hull.length - 1]!;
                hull.pop();
                events.push({
                    type: "prune",
                    operation: "prune-redundant",
                    narration: `The line ${equation(removed)} never holds the minimum, because the switch points of the three lines do not increase, so it is removed.`,
                    state: snapshot(
                        `${equation(removed)} is never the smallest.`,
                        `hull = ${hull.length} lines`,
                    ),
                });
            }

            hull.push(line);
            events.push({
                type: "add",
                operation: "add-line",
                narration: `The line ${equation(line)} is pushed onto the hull, whose slopes increase from bottom to top.`,
                state: snapshot(`${equation(line)} is on the hull.`, `hull = ${hull.length} lines`),
            });
            continue;
        }

        point = operation.point!;
        while (hull.length >= 2) {
            const top = hull[hull.length - 1]!;
            const below = hull[hull.length - 2]!;
            const topValue = top.slope * point + top.intercept;
            const belowValue = below.slope * point + below.intercept;
            if (belowValue >= topValue) break;
            hull.pop();
            events.push({
                type: "query",
                operation: "query",
                narration: `At x = ${point} the line ${equation(top)} gives ${topValue} and the line below it gives ${belowValue}, so the line below is smaller and the line on top is dropped for good.`,
                state: snapshot(`${equation(top)} is dropped.`, `hull = ${hull.length} lines`),
            });
        }

        const best = hull[hull.length - 1];
        answer = best ? best.slope * point + best.intercept : 0;
        events.push({
            type: "query",
            operation: "query",
            narration: best
                ? `The line ${equation(best)} is the smallest at x = ${point}, so the answer is ${answer}.`
                : `The hull is empty, so the answer at x = ${point} is 0.`,
            state: snapshot(
                best ? `The answer is ${answer}.` : "The hull is empty.",
                `query(${point}) = ${answer}`,
            ),
        });
    }

    events.push({
        type: "finish",
        operation: "finish",
        narration:
            "Every line that was removed was removed for good, so the hull holds the lower envelope of the lines that were added.",
        state: snapshot("The hull is complete.", `hull = ${hull.length} lines`),
    });

    return events;
}

export const definition: LabDefinition = {
    id: "dynamic-programming.convex-hull-trick",
    title: "Convex hull trick",
    scene: "hybrid",
    description:
        "Keeps the lower envelope of a set of lines in a stack, so that the smallest value at a point is found in constant amortized time.",
    maxInputLength: 300,
    presets: [
        {
            id: "pruning",
            label: "A redundant line",
            input: "add 1 0\nadd 2 -1\nadd 3 -3\nquery 0\nquery 1\nquery 2",
        },
        {
            id: "same-slope",
            label: "The same slope twice",
            input: "add 4 -20\nadd 4 -30\nadd 4 0\nquery 3",
        },
        {
            id: "growing",
            label: "A growing point",
            input: "add 1 5\nadd 2 1\nadd 3 -4\nquery 0\nquery 2\nquery 5",
        },
    ],
    notes: [
        "Each box is a line of the hull, and the boxes are in the order of the stack, from the bottom of the stack to the top.",
        "The gold circle is the point of the current query, and the number under it is the answer.",
        "A line is removed either because it never holds the minimum or because the query has moved past it.",
    ],
    build,
};
