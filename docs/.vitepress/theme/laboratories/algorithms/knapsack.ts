/**
 * The 0/1 knapsack.
 *
 * The reference implementation collapses the table into a single row and
 * sweeps the capacity downwards, because the cell on the left has to still
 * hold the answer for the items before the current one. The picture shows
 * the same computation unrolled: every row is the state of that single row
 * after one item, so the cell that is computed reads the cell of the row
 * above it.
 */
import type { LabDefinition, LabEvent, LabState } from "../core/types";

interface Item {
    weight: number;
    value: number;
}

interface Parsed {
    capacity: number;
    items: Item[];
}

function parse(input: string): Parsed {
    const lines = input
        .trim()
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) throw new Error("Provide the capacity on the first line.");
    const head = lines[0]!.split(/[\s,]+/).filter(Boolean);
    if (head.length !== 1) throw new Error("The first line must hold the capacity only.");
    const capacity = Number(head[0]);
    if (!Number.isInteger(capacity) || capacity < 0)
        throw new Error("The capacity must be a nonnegative integer.");

    const items: Item[] = [];
    for (const line of lines.slice(1)) {
        const parts = line.split(/[\s,]+/).filter(Boolean);
        if (parts.length !== 2)
            throw new Error(`An item must be written "weight value", found "${line}".`);
        const weight = Number(parts[0]);
        const value = Number(parts[1]);
        if (!Number.isInteger(weight) || weight < 0)
            throw new Error("An item weight must be a nonnegative integer.");
        if (!Number.isInteger(value)) throw new Error("An item value must be an integer.");
        items.push({ weight, value });
    }
    return { capacity, items };
}

interface Shot {
    note: string;
    formula?: string;
    /** The row that is being filled. */
    row: number;
    /** The column that is being computed, or null before the row starts. */
    column: number | null;
    /** The cells the computation reads. */
    reads: { row: number; column: number }[];
    /** The current row is already finished. */
    complete?: boolean;
}

function tableState(rows: number[][], shot: Shot): LabState {
    const reads = new Set(shot.reads.map((cell) => `${cell.row},${cell.column}`));
    const cells: {
        row: number;
        col: number;
        value: string;
        state?: "idle" | "active" | "done" | "highlight";
        dependsOn?: [number, number][];
    }[] = [];

    rows.forEach((row, rowIndex) => {
        row.forEach((value, column) => {
            const key = `${rowIndex},${column}`;
            let state: "idle" | "active" | "done" | "highlight";
            if (shot.column !== null && rowIndex === shot.row && column === shot.column) {
                state = "active";
            } else if (reads.has(key)) {
                state = "highlight";
            } else if (rowIndex < shot.row) {
                state = "done";
            } else if (rowIndex === shot.row && shot.column !== null && column > shot.column) {
                state = "done";
            } else if (rowIndex === shot.row && shot.complete) {
                state = "done";
            } else {
                state = "idle";
            }
            cells.push({
                row: rowIndex,
                col: column,
                value: String(value),
                state,
                dependsOn:
                    state === "active"
                        ? shot.reads.map((cell) => [cell.row, cell.column] as [number, number])
                        : undefined,
            });
        });
    });

    return {
        nodes: [],
        edges: [],
        cells: [],
        structures: [],
        table: {
            rowLabels: rows.map((_, index) => String(index)),
            colLabels: rows[0]!.map((_, index) => String(index)),
            cells,
        },
        annotations: [{ x: 30, y: 30, text: shot.note, emphasis: "accent" }],
        data: { rows: rows.map((row) => [...row]) },
        formula: shot.formula,
    };
}

function build(input: string): LabEvent[] {
    const { capacity, items } = parse(input);
    const events: LabEvent[] = [];

    const rows: number[][] = [new Array<number>(capacity + 1).fill(0)];

    events.push({
        type: "init",
        operation: "init-table",
        narration: `The budget is ${capacity} and there are ${items.length} items. Before any item is considered, every capacity holds the value zero.`,
        state: tableState(rows, {
            note: "Row 0 holds the answer when no item may be used.",
            row: 0,
            column: null,
            reads: [],
            complete: true,
            formula: `F(0, c) = 0`,
        }),
    });

    items.forEach((item, index) => {
        const row = index + 1;
        const previous = rows[rows.length - 1]!;
        const current = previous.slice();
        rows.push(current);

        if (item.weight > capacity) {
            events.push({
                type: "skip-item",
                operation: "update-row",
                narration: `The item weighs ${item.weight}, which is more than the budget of ${capacity}, so it cannot be taken and the row is unchanged.`,
                state: tableState(rows, {
                    note: `Item ${row} does not fit in the budget.`,
                    row,
                    column: null,
                    reads: [],
                    complete: true,
                    formula: `F(${row}, c) = F(${row - 1}, c)`,
                }),
            });
            return;
        }

        for (let column = capacity; column >= item.weight; column -= 1) {
            const skipped = previous[column]!;
            const taken = previous[column - item.weight]! + item.value;

            if (taken > skipped) {
                current[column] = taken;
                events.push({
                    type: "take-item",
                    operation: "take-item",
                    narration: `At capacity ${column}, taking the item gives ${previous[column - item.weight]!} + ${item.value} = ${taken}, which beats the ${skipped} of the item above, so the cell becomes ${taken}.`,
                    state: tableState(rows, {
                        note: `Take the item: ${taken} beats ${skipped}.`,
                        row,
                        column,
                        reads: [
                            { row: row - 1, column },
                            { row: row - 1, column: column - item.weight },
                        ],
                        formula: `F(${row}, ${column}) = max(${skipped}, ${previous[column - item.weight]!} + ${item.value}) = ${taken}`,
                    }),
                });
            } else {
                events.push({
                    type: "skip-item",
                    operation: "skip-item",
                    narration: `At capacity ${column}, taking the item would give ${previous[column - item.weight]!} + ${item.value} = ${taken}, which is no better than the ${skipped} of the item above, so the cell keeps ${skipped}.`,
                    state: tableState(rows, {
                        note: `Skip the item: ${skipped} is at least ${taken}.`,
                        row,
                        column,
                        reads: [
                            { row: row - 1, column },
                            { row: row - 1, column: column - item.weight },
                        ],
                        formula: `F(${row}, ${column}) = max(${skipped}, ${taken}) = ${skipped}`,
                    }),
                });
            }
        }
    });

    const best = rows[rows.length - 1]![capacity]!;
    events.push({
        type: "finish",
        operation: "finish",
        narration: `The best value that fits in a budget of ${capacity} is ${best}.`,
        state: tableState(rows, {
            note: `The answer is the cell in the last row and the last column.`,
            row: rows.length - 1,
            column: null,
            reads: [],
            complete: true,
            formula: `answer = ${best}`,
        }),
    });

    return events;
}

export const knapsack: LabDefinition = {
    id: "dynamic-programming.0-1-knapsack",
    title: "0/1 knapsack",
    scene: "matrix",
    description:
        "Fills a table of the best value reachable at every capacity, sweeping the capacity downwards so that an item is never used twice.",
    maxInputLength: 300,
    presets: [
        {
            id: "classic",
            label: "Four items",
            input: "7\n3 4\n4 5\n5 7\n2 3",
        },
        {
            id: "tight",
            label: "A tight budget",
            input: "5\n2 3\n2 4\n3 7\n4 5",
        },
        {
            id: "heavy",
            label: "An item that never fits",
            input: "4\n5 9\n2 3\n1 2",
        },
    ],
    notes: [
        "Rows are the items in the order they are considered, and columns are the budgets from zero to the capacity.",
        "The gold cell is the one being computed, and the pale cells are the two values it reads.",
        "Each row is the state of the single row that the implementation keeps, so the sweep runs from right to left.",
    ],
    build,
};
