/**
 * Prefix sums.
 *
 * The reference implementation is the one in the article: a single pass that
 * stores the running total of the array, so that the sum of a range becomes
 * the difference of two stored totals. The picture shows the running totals
 * as they are produced, and a range query is two lookups and one subtraction.
 */
import type { LabDefinition, LabEvent, LabState } from "../core/types";

interface Parsed {
    values: number[];
    queries: { left: number; right: number }[];
}

function parse(input: string): Parsed {
    const lines = input
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) throw new Error("Provide the array values on the first line.");
    const tokens = lines[0]!.split(/[\s,]+/).filter(Boolean);
    if (tokens.length === 0) throw new Error("The first line must hold at least one value.");
    const values = tokens.map(Number);
    if (values.some((value) => Number.isNaN(value)))
        throw new Error("Array entries must be numbers.");

    const queries: { left: number; right: number }[] = [];
    for (const line of lines.slice(1)) {
        const parts = line.split(/[\s,]+/).filter(Boolean);
        if (parts.length !== 2)
            throw new Error(`A query must be written "left right", found "${line}".`);
        const left = Number(parts[0]);
        const right = Number(parts[1]);
        if (!Number.isInteger(left) || !Number.isInteger(right))
            throw new Error("Query bounds must be integers.");
        if (left < 1 || right > values.length || left > right)
            throw new Error(
                `The query ${left}..${right} does not fit an array of ${values.length} values.`,
            );
        queries.push({ left, right });
    }
    return { values, queries };
}

interface Snapshot {
    note: string;
    formula?: string;
    /** The prefix entry that was just written. */
    active?: number | null;
    /** The prefix entries a query reads. */
    highlight?: number[];
}

function stateFor(values: number[], prefix: number[], computed: number, shot: Snapshot): LabState {
    const highlight = new Set(shot.highlight ?? []);
    return {
        nodes: [],
        edges: [],
        cells: prefix.map((total, index) => ({
            index,
            value: index <= computed ? String(total) : "?",
            state:
                index === shot.active
                    ? "active"
                    : highlight.has(index)
                      ? "highlight"
                      : index <= computed
                        ? "done"
                        : "idle",
            sublabel: index === 0 ? "empty" : `a${index} = ${values[index - 1]}`,
        })),
        structures: [],
        annotations: [{ x: 30, y: 30, text: shot.note, emphasis: "accent" }],
        data: { prefix: [...prefix] },
        formula: shot.formula,
    };
}

function build(input: string): LabEvent[] {
    const { values, queries } = parse(input);
    const events: LabEvent[] = [];

    const prefix: number[] = new Array<number>(values.length + 1).fill(0);
    let computed = 0;

    events.push({
        type: "init",
        operation: "init",
        narration: `The array holds ${values.length} values. The prefix array starts with a single zero, because the sum of the first zero elements is zero.`,
        state: stateFor(values, prefix, computed, {
            note: "The prefix array is empty apart from its first zero.",
            formula: "P[0] = 0",
        }),
    });

    for (let index = 1; index <= values.length; index += 1) {
        const previous = prefix[index - 1]!;
        const value = values[index - 1]!;
        prefix[index] = previous + value;
        computed = index;
        events.push({
            type: "add",
            operation: "add",
            narration: `prefix[${index}] = prefix[${index - 1}] + a[${index}] = ${previous} + ${value} = ${prefix[index]}, so the running total after ${index} values is ${prefix[index]}.`,
            state: stateFor(values, prefix, computed, {
                note: `prefix[${index}] = ${previous} + ${value} = ${prefix[index]}`,
                formula: `P[${index}] = P[${index - 1}] + a[${index}] = ${prefix[index]}`,
                active: index,
            }),
        });
    }

    for (const { left, right } of queries) {
        const high = prefix[right]!;
        const low = prefix[left - 1]!;
        events.push({
            type: "lookup",
            operation: "prefix-sum",
            narration: `The sum of the first ${right} values is prefix[${right}] = ${high}, and the sum of the first ${left - 1} values is prefix[${left - 1}] = ${low}.`,
            state: stateFor(values, prefix, computed, {
                note: `prefix[${right}] = ${high} and prefix[${left - 1}] = ${low}`,
                formula: `sum(${left}, ${right}) = prefix[${right}] - prefix[${left - 1}]`,
                highlight: [right, left - 1],
            }),
        });
        events.push({
            type: "query",
            operation: "range-sum",
            narration: `The sum of the range ${left}..${right} is prefix[${right}] - prefix[${left - 1}] = ${high} - ${low} = ${high - low}.`,
            state: stateFor(values, prefix, computed, {
                note: `sum(${left}, ${right}) = ${high} - ${low} = ${high - low}`,
                formula: `sum(${left}, ${right}) = ${high - low}`,
                highlight: [right, left - 1],
            }),
        });
    }

    events.push({
        type: "finish",
        operation: "finish",
        narration: `Every prefix total is stored, so every later question about a range is one subtraction.`,
        state: stateFor(values, prefix, computed, {
            note: "The prefix array is complete.",
            formula: `${computed + 1} prefix totals stored`,
        }),
    });

    return events;
}

export const prefixSums: LabDefinition = {
    id: "arrays.prefix-sums",
    title: "Prefix sums",
    scene: "array",
    description:
        "Stores the running total of the array so that the sum of any range becomes the difference of two stored totals.",
    maxInputLength: 200,
    presets: [
        { id: "mixed", label: "Mixed signs", input: "3 -2 5 4 -1\n2 4" },
        { id: "negatives", label: "Negative values", input: "-4 7 -2 3\n1 4\n2 3" },
        { id: "single", label: "A single value", input: "10\n1 1" },
    ],
    notes: [
        "Each box holds one prefix total, and the number above it is the index of that total.",
        "The small text under a box is the original array element that was added to reach it.",
        "A range query reads two boxes and subtracts the lower one from the higher one.",
    ],
    build,
};
