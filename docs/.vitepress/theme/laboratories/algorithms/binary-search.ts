/**
 * Binary search.
 *
 * The reference implementation below is the same algorithm the article
 * teaches: it maintains an inclusive interval `[lo, hi]`, computes
 * `mid = lo + (hi - lo) / 2`, and discards half of the interval based on the
 * comparison between `a[mid]` and the target.
 *
 * The point of the animation is not "a number gets smaller" but the specific
 * reasoning: the predicate `a[i] <= target` is monotone, so the answer — if
 * it exists — is the first index where the predicate holds.
 */
import type { LabDefinition, LabEvent, LabState } from "../core/types";

interface Parsed {
    values: number[];
    target: number;
}

function parse(input: string): Parsed {
    const tokens = input
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean);
    if (tokens.length < 2) throw new Error("Provide a sorted array followed by a target value.");
    const values = tokens.slice(0, -1).map(Number);
    const target = Number(tokens[tokens.length - 1]);
    if (values.some((value) => Number.isNaN(value)))
        throw new Error("Array entries must be numbers.");
    if (Number.isNaN(target)) throw new Error("The target must be a number.");
    for (let index = 1; index < values.length; index += 1) {
        if (values[index]! < values[index - 1]!) {
            throw new Error("The array must be sorted in non-decreasing order.");
        }
    }
    return { values, target };
}

function stateFor(
    values: number[],
    lo: number,
    hi: number,
    mid: number | null,
    target: number,
    note: string,
): LabState {
    return {
        nodes: [],
        edges: [],
        cells: values.map((value, index) => ({
            index,
            value: String(value),
            state:
                mid === null
                    ? index < lo || index > hi
                        ? "invalid"
                        : "idle"
                    : index === mid
                      ? "active"
                      : index < lo || index > hi
                        ? "invalid"
                        : "idle",
            sublabel:
                mid !== null && index === mid
                    ? `a[${index}] ${value} ${value <= target ? "≤" : ">"} ${target}`
                    : undefined,
        })),
        structures: [],
        annotations: [
            { x: 30, y: 30, text: `target = ${target}`, emphasis: "accent" },
            { x: 30, y: 130, text: note },
        ],
        data: { lo, hi, mid },
        formula: `lo = ${lo}, hi = ${hi}`,
    };
}

function build(input: string): LabEvent[] {
    const { values, target } = parse(input);
    const events: LabEvent[] = [];

    let lo = 0;
    let hi = values.length - 1;

    events.push({
        type: "init",
        operation: "init",
        narration: `Search for ${target} in a sorted array of ${values.length} elements. The whole array is still a candidate.`,
        state: stateFor(values, lo, hi, null, target, "Interval: the entire array."),
    });

    let guard = 0;
    while (lo <= hi) {
        guard += 1;
        if (guard > 1000) break;
        const mid = lo + Math.floor((hi - lo) / 2);

        events.push({
            type: "examine",
            operation: "compute-mid",
            narration: `The interval is [${lo}, ${hi}], so its midpoint is ${mid}.`,
            state: stateFor(
                values,
                lo,
                hi,
                mid,
                target,
                `mid = ${lo} + ⌊(${hi} − ${lo})/2⌋ = ${mid}`,
            ),
        });

        const value = values[mid]!;

        if (value === target) {
            events.push({
                type: "finish",
                operation: "found",
                narration: `a[${mid}] = ${target}. The target is present, so the answer is index ${mid}.`,
                state: {
                    ...stateFor(values, lo, hi, mid, target, `Found at index ${mid}.`),
                    cells: values.map((item, index) => ({
                        index,
                        value: String(item),
                        state:
                            index === mid ? "done" : index < lo || index > hi ? "invalid" : "idle",
                    })),
                },
            });
            break;
        }

        if (value < target) {
            events.push({
                type: "compare",
                operation: "discard-left",
                narration: `a[${mid}] = ${value} is smaller than ${target}, so the answer cannot be at or before ${mid}. Discard the left half.`,
                state: stateFor(
                    values,
                    lo,
                    hi,
                    mid,
                    target,
                    `${value} < ${target} → lo = ${mid + 1}`,
                ),
            });
            lo = mid + 1;
        } else {
            events.push({
                type: "compare",
                operation: "discard-right",
                narration: `a[${mid}] = ${value} is larger than ${target}, so the answer cannot be at or after ${mid}. Discard the right half.`,
                state: stateFor(
                    values,
                    lo,
                    hi,
                    mid,
                    target,
                    `${value} > ${target} → hi = ${mid - 1}`,
                ),
            });
            hi = mid - 1;
        }

        events.push({
            type: "update",
            operation: "narrow",
            narration: `The search interval is now [${lo}, ${hi}].`,
            state: stateFor(values, lo, hi, null, target, `Interval halved: [${lo}, ${hi}]`),
        });
    }

    if (lo > hi) {
        events.push({
            type: "finish",
            operation: "not-found",
            narration: `The interval became empty, so ${target} is not in the array.`,
            state: stateFor(values, lo, hi, null, target, "Interval empty — the target is absent."),
        });
    }

    return events;
}

export const binarySearch: LabDefinition = {
    id: "searching.binary-search",
    title: "Binary search",
    scene: "array",
    description:
        "Halving a sorted array by comparing the middle element with the target, until the interval is empty or the target is found.",
    maxInputLength: 200,
    presets: [
        { id: "found", label: "Target present", input: "1 3 5 7 9 11 13 15 5" },
        { id: "missing", label: "Target absent", input: "1 3 5 7 9 11 13 15 8" },
        { id: "duplicates", label: "Duplicates", input: "2 2 2 2 2 2 2 2 2" },
        { id: "single", label: "Single element", input: "42 42" },
    ],
    notes: [
        "Gray cells have been discarded: they cannot contain the answer.",
        "The gold cell is the midpoint currently being compared.",
        "Binary search needs a sorted array; the comparison must be monotone.",
    ],
    build,
};
